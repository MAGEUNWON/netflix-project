import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { readdir, unlink } from "fs/promises";
import { join, parse } from "path";
import { Movie } from "src/movie/entity/movie.entity";
import { Repository } from "typeorm";

@Injectable()
export class TasksService{
    constructor(
        @InjectRepository(Movie)
        private readonly movieRepository: Repository<Movie>
    ){}

    logEverySecond(){
        console.log('1초마다 실행!')
    }

    // 잉여파일 삭제 하기
    // 날짜 기준으로 특정 날짜 기준이 넘어가면 삭제하기 ( 하루 기준으로 잡음. true면 삭제 처리. false는 그대로)
    // @Cron('* * * * * *')
    async eraseOrphanFiles(){
        const files = await readdir(join(process.cwd(), 'public', 'temp'));

        const deleteFilesTargets = files.filter((file) => {
            const filename = parse(file).name; // 끝에 확장자(.mp4)를 제외한 이름만 가져옴

            const split = filename.split('_'); 
            console.log("Xx", split)

            if(split.length !== 2){
                return true; // 바로 삭제 처리 
            }

            try{
                const date = +new Date(parseInt(split[split.length - 1])); // 실제로는 string으로 들어오기 때문에 parseInt 해줌. -1해줘서 마지막 값 가져옴  
                const aDayInMileSec = (24 * 60 * 60 * 1000); // 밀리세컨드 기준으로 값을 불러오기 때문에 하루가 몇 밀리초가 있는지 계산 해줌 

                const now = +new Date(); // 현재 시간 (밀리세컨드 기준)

                return (now - date) > aDayInMileSec; // 하루 이상 지난 것들만 return 함 

            } catch(e){
                return true; // 에러 나면 그냥 삭제 
            }
        });

        await Promise.all(
            deleteFilesTargets.map(
                (x) => unlink(join(process.cwd(), 'public', 'temp', x)) // 파일 삭제는 unlink 사용
            )
        ); // for문으로 삭제하면 파일 하나하나 순서대로 삭제하는거 기다려야하지만 Promise.all 사용하면 
        // 동시에 시작을 해서 모두 다 끝나면 반환해줌 

    }

    // @Cron('0 * * * * *') // 1분 정각에 한번씩 
    async calculateMovieLikeCount(){ // 좋아요, 싫어요 숫자가 많아지면 바로바로 업데이트 하기 어려우니까 시간당 모아서 주기적으로 업데이트 해줄 수 있음. 
        // console.log('run');
        // 좋아요 수 세서 movie의 likeCount에 업데이트 
        await this.movieRepository.query(
            `          
            update movie m
            set "likeCount" = (
            	select count(*) from movie_user_like mul
            	where m.id = mul."movieId" and mul."isLike" = true
            );
            `
        );

        // 싫어요 수 세서 movie의 likeCount에 업데이트 
        await this.movieRepository.query(
            `          
            update movie m
            set "dislikeCount" = (
            	select count(*) from movie_user_like mul
            	where m.id = mul."movieId" and mul."isLike" = false 
            );
            `
        );
    }

}