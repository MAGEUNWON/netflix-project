import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { number } from 'joi';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Like, Repository } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entitiy/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CommonService } from 'src/common/common.service';

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
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
  ){}

  // 전체 값 가져오기
  // 쿼리 빌더로 변경한 코드 
  async findAll(dto: GetMoviesDto ){
    const { title, take, page } = dto;

    const qb = await this.movieRepository.createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres');

      if(title){
        qb.where('movie.title LIKE :title', {title: `%${title}%`})
      }

      if(take && page) {
        this.commonService.applyPagePaginationParamsToQb(qb, dto);
       
      }

      return await qb.getManyAndCount();

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
  async create(createMovieDto: CreateMovieDto){
    // ! movie entity에서 casecade를 true 설정 하면 이 부분 안만들고 detail에서 한번에 처리 가능함
    // const movieDetail = await this.movieDetailRepository.save({
    //   detail: createMovieDto.detail
    // });  

    // 트랜잭션 추가 
    const qr = this.dataSource.createQueryRunner();

    await qr.connect();
    await qr.startTransaction();

    // 트랜잭션 사용할 때는 try-catch가 꼭 필요함
    try{ // Try 안에 실행하고 싶은 로직 넣어줌. 
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
  
      // save도 레포지토리로 하는게 맞음. 쿼리빌더로 바꾸는 것이 더 코드가 복잡해짐
      // 쿼리빌더에서는 cascade로 한번에 같이 생성하는게 안됌. manytomany도 안됌
      
      // 이렇게 아래처럼 만들었을 때 문제점은 isnert를 여러번 하기 때문에 밑에서 문제가 생기면 먼저 insert한 
      // 데이터는 고아가 되버림. 그래서 한번에 insert 할 수 있도록 하나의 쿼리로 묶어서 해줘야 함. 이걸 트랜젝션이라고 함
  
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
        })
        .execute();
  
        const movieId = movie.identifiers[0].id;
  
        // 만들 movie에 장르의 관계를 넣어줌
        await qr.manager.createQueryBuilder()
          .relation(Movie, 'genres')
          .of(movieId)
          .add(genres.map(genre => genre.id));
  

      await qr.commitTransaction(); // 데이터 베이스에 실행 내용 반영

      // 그리고 movie 반환, return은 commit 된 다음 반환
      return await this.movieRepository.findOne({ // 여기는 이미 commit이 된 후에 진행되는 것이기 때문에 qr.manager말고 MovieRepository로 실행하면 됨 
        where: {
          id: movieId,
        },
        relations: ['detail', 'director', 'genres']
      });
    }catch(e){ // 에러가 생겼을 때 사용. 
      await qr.rollbackTransaction(); // 에러가 하나라도 생겼을 때 상태로 복원 시키기 위해 사용.

      throw e; // 에러 생기면 던져줘야 프론트에서 알 수 있음. 
    }finally{

      await qr.release(); // 에러가 났든, 트랜잭션에 커밋을 했든 release를 통해 데이터베이스 pool에 트랜잭션을 되돌려 줘야함. 안하면 계속 물려있을 수 있음. 
    }

    // const director = await this.directorRepository.findOne({
    //   where: {
    //     id: createMovieDto.directorId,
    //   },
    // });

    // if(!director){
    //   throw new NotFoundException('존재하지 않는 ID의 감독입니다.')
    // }

    // // 여러개의 장르를 찾을 거니까 find를 사용
    // const genres = await this.genreRepository.find({
    //   where: {
    //     id: In(createMovieDto.genreIds), // In을 사용해서 list로 값을 넣어두면 list에 넣은 모든 값들을 찾을 수 있음. 즉 id가 genreIds에 해당하는 모든 값이 나옴
    //   },
    // });

    // if(genres.length !== createMovieDto.genreIds.length) {
    //   throw new NotFoundException(`존재하지 않는 장르가 있습니다. 존재하는 ids -> ${genres.map(genre => genre.id).join(',')}`);
    // };

    // // save도 레포지토리로 하는게 맞음. 쿼리빌더로 바꾸는 것이 더 코드가 복잡해짐
    // // 쿼리빌더에서는 cascade로 한번에 같이 생성하는게 안됌. manytomany도 안됌
    
    // // 이렇게 아래처럼 만들었을 때 문제점은 isnert를 여러번 하기 때문에 밑에서 문제가 생기면 먼저 insert한 
    // // 데이터는 고아가 되버림. 그래서 한번에 insert 할 수 있도록 하나의 쿼리로 묶어서 해줘야 함. 이걸 트랜젝션으라고 함

    // // movieDetail 만들고 
    // const movieDetail = await this.movieDetailRepository.createQueryBuilder()
    //   .insert()
    //   .into(MovieDetail)
    //   .values({
    //     detail: createMovieDto.detail,
    //   })
    //   .execute();
    
    // // insert한 값들의 id를 받을 수 있음. identifieres는 배열임. value를 여러개를 넣을 수 있기 때문 
    // const movieDetailId = movieDetail.identifiers[0].id; // value를 1개만 넣었기 때문에 그냥 바로 [0].id 해줌
    
    // // movie 만들고 
    // const movie = await this.movieRepository.createQueryBuilder()
    //   .insert()
    //   .into(Movie)
    //   .values({
    //     title: createMovieDto.title,
    //     detail: {
    //       id: movieDetailId, // 위에서 id 값 받을 수 있게 만들고 여기서 연결해 줘야 함.
    //     },
    //     director,
    //   })
    //   .execute();

    //   const movieId = movie.identifiers[0].id;

    //   // 만들 movie에 장르의 관계를 넣어줌
    //   await this.movieRepository.createQueryBuilder()
    //     .relation(Movie, 'genres')
    //     .of(movieId)
    //     .add(genres.map(genre => genre.id));

    //   // 그리고 movie 반환
    //   return await this.movieRepository.findOne({
    //     where: {
    //       id: movieId,
    //     },
    //     relations: ['detail', 'director', 'genres']
    //   });
    
    
    // // const movie = await this.movieRepository.save({
    // //   title: createMovieDto.title,
    // //   detail: {
    // //     detail: createMovieDto.detail,
    // //   },
    // //   director,
    // //   genres,
    // // });


    // // return movie;
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
}
