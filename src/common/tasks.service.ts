import { Injectable } from "@nestjs/common";
import { Cron, SchedulerRegistry } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { readdir, unlink } from "fs/promises";
import { join, parse } from "path";
import { Movie } from "src/movie/entity/movie.entity";
import { Repository } from "typeorm";
import { Logger } from "@nestjs/common";
import { DefaultLogger } from "./logger/default.logger";


@Injectable()
export class TasksService{
    // private readonly logger = new Logger(TasksService.name); // Logger () 안에 넣어주는 내용은 출력될 때 Log[] 이부분에 나오는 내용임. 

    constructor(
        @InjectRepository(Movie)
        private readonly movieRepository: Repository<Movie>,
        private readonly schedulerRegistry: SchedulerRegistry,
        private readonly logger: DefaultLogger,
    ){}

    @Cron('*/5 * * * * *')
    logEverySecond(){
        // nestjs에서 제공해주는 레벨의 중요도 순서 fatal에 가까울수록 무조건 보여야 하는 로그고 verbose에 가까울수록 안보여도 되는 로그임. 이 순서는 항상 지켜줘야 함
        this.logger.fatal('FATAL 레벨 로그'); // 지금 당장 해결해야 하는 문제. 절대 일어나면 안되는 문제일 때 사용
        this.logger.error('ERROR 레벨 로그'); // 실제로 중요한 문제가 생겼을 때 사용
        this.logger.warn('WARN 레벨 로그'); // 일어나면 안되는 일은 맞지만 프로그램을 실행하는데에는 문제가 없는 경우 사용
        this.logger.log('LOG 레벨 로그'); // 정보성 메시지를 작성할 때 사용. 
        this.logger.debug('DEBUG 레벨 로그'); // 개발환경에서 중요한 로그들을 작성할 때 사용
        this.logger.verbose('VERBOSE 레벨 로그'); // 진짜 중요하지 않은 내용일 때 씀
    }
    // [Nest] 43515  - 01/07/2025, 2:51:37 PM     LOG [TasksService] 1초마다 실행!
    // 이런식으로 로그가 나오게 됨. [Nest] -> 실행한 프로세스 이름. 
    // 43515 -> 실행하고 있는 프로세스 아이디. 매번 새로 실행할때 마다 프로세스 아이디가 바뀜
    // 01/07/2025, 2:51:37 PM  -> 날짜, 시간. 언제 이 로그가 작성이 됐는지 알 수 있음. 
    // LOG -> 로그 레벨
    // [TasksService] -> 위에서 적은 문맥. context 
    // 1초마다 실행! -> 실제 적용한 메시지 

    // !잉여파일 삭제 하기
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

    // ! 좋아요 싫어요 통계 기능
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
    
    // ! 다양한 Cron 기능 Test 
    // Cron은 되도록 이런식으로 선언형으로 만들어놔야 관리하기가 편함 
    // @Cron('* * * * * *', { // 1초마다 실행
    //     name: 'printer', // 이렇게 해주면 Cron job의 이름을 넣어줄 수 있음
    // })
    printer(){
        console.log('print every seconds')
    }

    // @Cron('*/5 * * * * *') // 5초마다 실행
    stopper(){
        console.log('---stopper run---');

        const job = this.schedulerRegistry.getCronJob('printer');

        // console.log('# Last Date');
        // console.log(job.lastDate()); // 마지막으로 실행한 순간
        // console.log('# Next Date')
        // console.log(job.nextDate()); // 다음 실행할 시간
        console.log('# Next Dates');
        console.log(job.nextDates(5)); // 다음으로 실행할 5개의 시간들

        if(job.running){ // job.running이라고 하면 boolean 값이 반환됨. 실행중이면 true, 아니면 false 출력됨
            job.stop();
        }else {
            job.start();
        }
    }


}