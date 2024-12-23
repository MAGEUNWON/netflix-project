import { BadRequestException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { boolean, number } from 'joi';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Like, QueryRunner, Repository } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entitiy/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CommonService } from 'src/common/common.service';
import { join } from 'path';
import { rename } from 'fs/promises';
import { UserId } from 'src/user/decorator/user-id.decorator';
import { User } from 'src/user/entities/user.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';


@Injectable()
export class MovieService {

  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(MovieDetail)
    private readonly movieDetailRepository: Repository<MovieDetail>,
    @InjectRepository(Director)
    // Director Repository를 따로 생성하지 않고 그냥 director service를 import 하고 싶으면 그렇게 해도 되긴 함. 
    // 근데 원칙적으로는 서로의 영역을 같은 내역끼리는 침범하지 않는 것이 원칙임. service는 service 끼리 repository는 repository끼리 서로 의존을 하지 않는 것이 좋음. 
    // 이건 절대 적인 것은 아니기 때문에 프로젝트 팀 상황에 맞게 진행하면 됨 
    private readonly directorRepository: Repository<Director>,
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>, 
    @InjectRepository(MovieUserLike)
    private readonly movieUserLikeRepository: Repository<MovieUserLike>,
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
    @Inject(CACHE_MANAGER) // 어디서 import 하는지도 중요함. 잘 확인하면서 해야함 
    private readonly cacheManager: Cache,
  ){}

  async findRecent(){

    const cacheData = await this.cacheManager.get('MOVIE_RECENT') // 캐시 저장. set(key, value)

    // cache에 cacheData가 있으면 여기서 그냥 가져오면 됌. 데이터까지 갈 필요 없음. 
    if(cacheData){
      return cacheData;
    }

    // cacheData가 없으면 그 때 데이터베이스에 요청 함 
    const data = await this.movieRepository.find({
      order: {
        createdAt: 'DESC', 
      },
      take: 10,
    });

    // 데이터베이스에서 응답 받은 값을 cache에 저장한 다음 반환함. 
    // 저장한 캐시 불러오기, cache에는 ttl(time to live)이라는 것이 있음. cache가 몇초동안 데이터를 저장하고 있을지 설정하는 것. set에 0이라고 마지막에 넣어주면 지우지 않고 무한하게 저장함, 만약 3000(3초)로 설정하면 3초 뒤에는 다시 데이터에서 요청에서 가져오게 됨. 처음에 아예 설정하고 싶으면 movie module에 ttl 설정해주면 됨   
    // 만약 module에도 해주고 service에도 ttl 적용하면 service에서 적용한 세부 ttl이 더 우선시되서 적용됨
    await this.cacheManager.set("MOVIE_RECENT", data); 

    // 그럼 두번째 요청을 하게 되면 cache에 저장이 되어 있기 때문에 데이터에 요청 안해도 됨 
    // 그냥 기본 cache를 쓰게되면 메모리에 있기 때문에 서버 다시 시작되면 유실됨. 재시작하지 않고 실행 중에만 cache 보존됨 
    return data;
  }

  // 전체 값 가져오기
  // 쿼리 빌더로 변경한 코드 
  async findAll(dto: GetMoviesDto, userId: number){
    const { title } = dto;

    const qb = await this.movieRepository.createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres');

      if(title){
        qb.where('movie.title LIKE :title', {title: `%${title}%`})
      }

      // this.commonService.applyPagePaginationParamsToQb(qb, dto); 
      const {nextCursor} = await this.commonService.applyCursorPaginationParamsToQb(qb, dto);

      let [data, count] = await qb.getManyAndCount(); // getManyAndCount이기 때문에 count까지 같이 반환해 주기 

      if(userId){
        // data에 좋아요한 상태를 넣어서 같이 보내 줄 것
        const movieIds = data.map(movie => movie.id);

        // 현재 페이지네이션에서 가져온 데이터 중에서 좋아요 또는 싫어요를 한 데이터 모두 가져옴
        const likedMovies = movieIds.length < 1 ? [] : await this.movieUserLikeRepository.createQueryBuilder('mul')// 영화를 가져온게 하나도 없으면 그냥 빈 리스트 보내주고 아닌 경우(영화 있는 경우)만 쿼리 실행
        .leftJoinAndSelect('mul.user', 'user')
        .leftJoinAndSelect('mul.movie', 'movie')
        .where('movie.id IN(:...movieIds)', {movieIds}) // :은 변수라는 뜻. ...은 list값을 넣어줬을 때 , 로 자동으로 나눠져서 들어가게 됨
        .andWhere('user.id = :userId', {userId})
        .getMany(); // 여러개의 데이터를 가져와라. 

        
        /**
         * 데이터를 map으로 변환해줄 것
         * {
         * movieId: boolean // movieId가 key가 되고 boolean 값이(좋아요, 싫어요 여부) valuer가 됨
         * } 
         */
        const likedMoviesMap = likedMovies.reduce((acc, next) => ({
          ...acc, // 기존 데이터
          [next.movie.id]: next.isLike, // key : value
        }), {});

        // data에 덮어 씌울 것
        data = data.map((x) => ({
          ...x,
          // null || true || false -> 좋아요 상태 추가로 데이터 넣어줌
          likeStatus: x.id in likedMoviesMap ? likedMoviesMap[x.id] : null, 
        }));
      }

      return {
        data,
        nextCursor,
        count,
      }

  // //title 없을 때 조건, count 적용 
  //   if(!title) {
  //     return [await this.movieRepository.find({
  //       relations: ['director', 'genres'],
  //     }), await this.movieRepository.count()];
  //   }

  //   // title 있을 때 조건 필터 적용
  //   return this.movieRepository.findAndCount({
  //     where:{
  //       title: Like(`%${title}%`),
  //     }, // 여기선 보통 detail을 가져오지는 않음. 
  //     relations: ['director', 'genres'],
  //   }); 
  } 
  
  // 특정 값 가져오기
  async findOne(id: number){

    // 쿼리 빌더로 변경한 코드. 실제로는 findOne은 그냥 레포지토리를 사용하는게 더 효율적임
    const movie = await this.movieRepository.createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres')
      .leftJoinAndSelect('movie.detail', 'detail')
      .leftJoinAndSelect('movie.creator', 'creator')
      .where('movie.id = :id', {id})
      .getOne();


    // const movie = await this.movieRepository.findOne({
    //   where:{
    //     id,
    //   },
    //   relations: ['detail', 'director', 'genres'] // detail 값까지 가져오려면 Text로 relation 안에 넣어주면 됨
    // }); // detail은 보통 전체 리스트에서 보다는 특정 값을 가져올때 나오게 함. 주로 상세페이지에서 사용 

    if(!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }

    return movie; 
  }

  // Movie data 생성
  async create(createMovieDto: CreateMovieDto, userId: number, qr: QueryRunner){ // 여기서 qr은 이제 interceptor에서 만든 qr을 받아 오게됨
   
      const director = await qr.manager.findOne(Director, { // 트랜잭션을 사용하려면 레포지토리 대신 qr.manager를 사용해서 findOne 해야함. 추가로 어떤 테이블에서 작업할 것인지 () 엔에 테이블을 넣어줘야함(Director)
        where: {
          id: createMovieDto.directorId,
        },
      });
  
      if(!director){
        throw new NotFoundException('존재하지 않는 ID의 감독입니다.')
      }
  
      // 여러개의 장르를 찾을 거니까 find를 사용
      const genres = await qr.manager.find(Genre, {
        where: {
          id: In(createMovieDto.genreIds), // In을 사용해서 list로 값을 넣어두면 list에 넣은 모든 값들을 찾을 수 있음. 즉 id가 genreIds에 해당하는 모든 값이 나옴
        },
      });
  
      if(genres.length !== createMovieDto.genreIds.length) {
        throw new NotFoundException(`존재하지 않는 장르가 있습니다. 존재하는 ids -> ${genres.map(genre => genre.id).join(',')}`);
      };
  
      // movieDetail 만들고 
      const movieDetail = await qr.manager.createQueryBuilder() // createQueryBuilder는 어짜피 테이블이 들어가기 때문에 () 안에 따로 안넣어줘도 됨
        .insert()
        .into(MovieDetail)
        .values({
          detail: createMovieDto.detail,
        })
        .execute();
      
      // insert한 값들의 id를 받을 수 있음. identifieres는 배열임. value를 여러개를 넣을 수 있기 때문 
      const movieDetailId = movieDetail.identifiers[0].id; // value를 1개만 넣었기 때문에 그냥 바로 [0].id 해줌
      
      
      const movieFolder = join('public', 'movie'); // 옮기려는 파일 
      const tempFolder = join('public', 'temp');  // 여기 들어있는 파일을 movieFolder로 옮겨줘야 함
      

      // movie 만들고 
      const movie = await qr.manager.createQueryBuilder()
        .insert()
        .into(Movie)
        .values({
          title: createMovieDto.title,
          detail: {
            id: movieDetailId, // 위에서 id 값 받을 수 있게 만들고 여기서 연결해 줘야 함.
          },
          director,
          creator:{
            id:userId,
          },
          movieFilePath: join(movieFolder, createMovieDto.movieFileName),
        })
        .execute();
  
        const movieId = movie.identifiers[0].id;
  
        // 만들 movie에 장르의 관계를 넣어줌
        await qr.manager.createQueryBuilder()
          .relation(Movie, 'genres')
          .of(movieId)
          .add(genres.map(genre => genre.id));

        // 파일을 temp폴더에서 moive 폴더로 옮겨주는 작업
        // rename은 트랜잭션의 영향을 받지 않기 때문에 movie 위에다 두면 에러가 나서 movie 데이터는 멈춰도 파일은 이동되서 잉여 파일이 되버리기 때문에 데이터 처리 과정이 에러없이 다 끝난 후인 마지막에 둬야 함. 
        await rename(
          join(process.cwd(), tempFolder, createMovieDto.movieFileName),
          join(process.cwd(), movieFolder, createMovieDto.movieFileName)
        )


      // 그리고 movie 반환, return은 commit 된 다음 반환
      // commit이 handle 함수가 실행된 다음에 실행됨. 그래서 같은 트랜잭션 안에서 데이터를 찾지 않으면 실제 데이터에 반영이 되지 않은 상태가 됨. 그래서 같은 트랜잭션 안에서 봐야 하기 때문에 this.movieRepository 대신 qr.manager를 사용해야 함
      return await qr.manager.findOne(Movie, { 
        where: {
          id: movieId,
        },
        relations: ['detail', 'director', 'genres']
      });
  }

  
  // Movie data 업데이트
  async update(id: number, updateMovieDto: UpdateMovieDto){
    const qr = this.dataSource.createQueryRunner();

    await qr.connect();
    await qr.startTransaction();

    try{
      const movie = await qr.manager.findOne(Movie, {
        where:{
          id,
        },
        relations:['detail', 'genres']
      });
      
      if(!movie) {
        throw new NotFoundException('존재하지 않는 ID의 영화입니다.')
      }
  
      const {detail, directorId, genreIds, ...movieRest} = updateMovieDto;
  
      // 감독 업데이트
      let newDirector;
  
      if(directorId) {
        const director = await qr.manager.findOne(Director, {
          where: {
            id: directorId,
          }
        });
  
        // 감독이 없으면 없다는 에러를 던져줘야 프론트에서 알 수 있음
        if(!director){
          throw new NotFoundException('존재하지 않는 ID의 감독입니다.')
        }
  
        newDirector = director;
      }
  
      // 장르 업데이트
      let newGenres;
  
      if(genreIds) {
        const genres = await qr.manager.find(Genre, {
          where:{
            id: In(genreIds),
          },
        });
  
        if(genres.length !== updateMovieDto.genreIds.length) {
          throw new NotFoundException(`존재하지 않는 장르가 있습니다. 존재하는 ids -> ${genres.map(genre => genre.id).join(',')}`);
        }
  
        newGenres = genres;
      }

      const movieUpdateFields = {
        ...movieRest, // newDirector가 존재하지 않으면 movieUpdateFields는 movieRest와 같고
        ...(newDirector && {director: newDirector}) // newDirector가 존재하면 director는 newDirector라는 값이 스프레드로 들어감 
      }
  
      // 쿼리 빌더로 바꾼 코드
      await qr.manager.createQueryBuilder()
        .update(Movie)
        .set(movieUpdateFields)
        .where(`id = :id`, {id})
        .execute();
      
      if(detail) {
        await qr.manager.createQueryBuilder()
          .update(MovieDetail)
          .set({
            detail,
          })
          .where(`id = :id`, {id: movie.detail.id})
          .execute();
      }

      if(newGenres){
        await qr.manager.createQueryBuilder()
          .relation(Movie, 'genres')
          .of(id)
          .addAndRemove(newGenres.map(genre => genre.id), movie.genres.map(genre => genre.id)) // addAndRemove는 추가와 삭제를 동시에 함. 첫번째 파라미터에 추가할 파라미터, 두번째는 삭제할 파라미터 넣어 주면 됌 . 
      }

      await qr.commitTransaction();

      return this.movieRepository.findOne({
        where: {
          id,
        },
        relations: ['detail', 'director', 'genres']
      });

    }catch(e){
      await qr.rollbackTransaction();

      throw e;
    }finally{

      await qr.release();
    }

    // const movie = await this.movieRepository.findOne({
    //   where:{
    //     id,
    //   },
    //   relations:['detail', 'genres']
    // });
    
    // if(!movie) {
    //   throw new NotFoundException('존재하지 않는 ID의 영화입니다.')
    // }

    // const {detail, directorId, genreIds, ...movieRest} = updateMovieDto;

    // // 감독 업데이트
    // let newDirector;

    // if(directorId) {
    //   const director = await this.directorRepository.findOne({
    //     where: {
    //       id: directorId,
    //     }
    //   });

    //   // 감독이 없으면 없다는 에러를 던져줘야 프론트에서 알 수 있음
    //   if(!director){
    //     throw new NotFoundException('존재하지 않는 ID의 감독입니다.')
    //   }

    //   newDirector = director;
    // }

    // // 장르 업데이트
    // let newGenres;

    // if(genreIds) {
    //   const genres = await this.genreRepository.find({
    //     where:{
    //       id: In(genreIds),
    //     },
    //   });

    //   if(genres.length !== updateMovieDto.genreIds.length) {
    //     throw new NotFoundException(`존재하지 않는 장르가 있습니다. 존재하는 ids -> ${genres.map(genre => genre.id).join(',')}`);
    //   }

    //   newGenres = genres;
    // }


    /**
     * {
     * ...movieRest,
     * {director: director}
     * }
     * 위에처럼 들어가는게 아니라 
     * 아래처럼 들어감
     * {
     * ...movieRest,
     * director: director
     * }
     */
    // const movieUpdateFields = {
    //   ...movieRest, // newDirector가 존재하지 않으면 movieUpdateFields는 movieRest와 같고
    //   ...(newDirector && {director: newDirector}) // newDirector가 존재하면 director는 newDirector라는 값이 스프레드로 들어감 
    // }

    // // 쿼리 빌더로 바꾼 코드
    // await this.movieRepository.createQueryBuilder()
    //   .update(Movie)
    //   .set(movieUpdateFields)
    //   .where(`id = :id`, {id})
    //   .execute();

    // await this.movieRepository.update(
    //   {id},
    //   movieUpdateFields,
    // );

    // 쿼리 빌더로 바꾼 코드 
    // if(detail) {
    //   await this.movieDetailRepository.createQueryBuilder()
    //     .update(MovieDetail)
    //     .set({
    //       detail,
    //     })
    //     .where(`id = :id`, {id: movie.detail.id})
    //     .execute();
    // }

    // if(detail){
    //   await this.movieDetailRepository.update(
    //     {
    //       id: movie.detail.id,
    //     },
    //     {
    //       detail,
    //     }
    //   )
    // }

    // update 함수는 저장한 값을 반환해주지 않기 때문에 update 된 값을 찾아서 다시 반환해줌
    
    // 쿼리 빌더로 바꾼 코드 
    // if(newGenres){
    //   await this.movieRepository.createQueryBuilder()
    //     .relation(Movie, 'genres')
    //     .of(id)
    //     .addAndRemove(newGenres.map(genre => genre.id), movie.genres.map(genre => genre.id)) // addAndRemove는 추가와 삭제를 동시에 함. 첫번째 파라미터에 추가할 파라미터, 두번째는 삭제할 파라미터 넣어 주면 됌 . 
    // }
    
    // const newMovie = await this.movieRepository.findOne({
    //   where:{
    //     id,
    //   },
    //   relations: ['detail', 'director']
    // });

    // update에 장르를 바로 넣어줄 수 없기 때문에 save를 사용해줘야함
    // detail까지 update한 다음에 여기에 다시 장르를 넣어줌
    // newMovie.genres = newGenres;

    // 그리고 나서 다시 장르들을 연결해서 저장하기 위해 save를 또 사용해 줘야 함.
    // await this.movieRepository.save(newMovie);

    // update한 값도 다시 불러와 줌.
    // return this.movieRepository.findOne({
    //   where: {
    //     id,
    //   },
    //   relations: ['detail', 'director', 'genres']
    // });
  }

  // Movie Data 삭제
  async remove(id: number){

    const movie = await this.movieRepository.findOne({
      where:{
        id,
      },
      relations:['detail']
    });

    if(!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.')
    }

    // 쿼리 빌더로 바꾼 코드
    await this.movieRepository.createQueryBuilder()
      .delete()
      .where('id = :id', {id})
      .execute();

    // await this.movieRepository.delete(id);
    
    await this.movieDetailRepository.delete(movie.detail.id);
    
    return id;
    
  }

  // 좋아요 싫어요 기능
  async toggleMovieLike(movieId: number, userId: number, isLike: boolean){
    const movie = await this.movieRepository.findOne({
      where: {
        id: movieId,
      }
    });

    if(!movie){
      throw new BadRequestException('존재하지 않는 영화입니다!');
    }

    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      }
    });

    if(!user){
      throw new UnauthorizedException('사용자 정보가 없습니다!');
    }

    // 좋아요 또는 싫어요 데이터 있는지 확인
    const likeRecored = await this.movieUserLikeRepository.createQueryBuilder('mul')
    .leftJoinAndSelect('mul.movie', 'movie')
    .leftJoinAndSelect('mul.user', 'user')
    .where('movie.id = :movieId', { movieId })
    .andWhere('user.id = :userId', { userId })
    .getOne(); // 하나의 데이터만 가져오기

    // 좋아요 또는 싫어요가 존재하는 경우
    if(likeRecored) {
      // 좋아요 누른 상태에서 좋아요 누르거나 싫어요 누른 상태에서 싫어요 누른 경우 
      if(isLike === likeRecored.isLike) { 
        await this.movieUserLikeRepository.delete({ // 그냥 삭제해서 아무것도 안눌린 상태로 변경해줌
          movie,
          user,
        });
      // 좋아요 누른 상태에서 싫어요 누르거나 싫어요 누른 상태에서 좋아요 누른 경우 
      } else{
        await this.movieUserLikeRepository.update({
          movie,
          user,
        }, {
          isLike, // toggleMovieLike에서 입력받은 isLike로 변경(toggle 해주면 됨)
        })
      }

    // 좋아요 또는 싫어요가 존재하지 않는 경우(그냥 그 상태로 저장하면 됨)
    } else { 
      await this.movieUserLikeRepository.save({
        movie,
        user,
        isLike,
      });
    }

    const result = await this.movieUserLikeRepository.createQueryBuilder('mul')
    .leftJoinAndSelect('mul.movie', 'movie')
    .leftJoinAndSelect('mul.user', 'user')
    .where('movie.id = :movieId', { movieId })
    .andWhere('user.id = :userId', { userId })
    .getOne(); // 하나의 데이터만 가져오기
    
    return {
      isLike: result && result.isLike, // result가 존재하지 않으면 null 반환, 존재하면 result의 isLike를 반환
    }
  }
}
 