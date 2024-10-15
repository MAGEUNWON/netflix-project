import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { number } from 'joi';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Repository } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entitiy/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';

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
  ){}

  // 전체 값 가져오기
  async findAll(title?: string){
    // title 없을 때 조건, count 적용 
    if(!title) {
      return [await this.movieRepository.find({
        relations: ['director', 'genres'],
      }), await this.movieRepository.count()];
    }

    // title 있을 때 조건 필터 적용
    return this.movieRepository.findAndCount({
      where:{
        title: Like(`%${title}%`),
      }, // 여기선 보통 detail을 가져오지는 않음. 
      relations: ['director', 'genres'],
    }); 
  }
  
  // 특정 값 가져오기
  async findOne(id: number){
    const movie = await this.movieRepository.findOne({
      where:{
        id,
      },
      relations: ['detail', 'director', 'genres'] // detail 값까지 가져오려면 Text로 relation 안에 넣어주면 됨
    }); // detail은 보통 전체 리스트에서 보다는 특정 값을 가져올때 나오게 함. 주로 상세페이지에서 사용 

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

    const director = await this.directorRepository.findOne({
      where: {
        id: createMovieDto.directorId,
      },
    });

    if(!director){
      throw new NotFoundException('존재하지 않는 ID의 감독입니다.')
    }

    // 여러개의 장르를 찾을 거니까 find를 사용
    const genres = await this.genreRepository.find({
      where: {
        id: In(createMovieDto.genreIds), // In을 사용해서 list로 값을 넣어두면 list에 넣은 모든 값들을 찾을 수 있음. 즉 id가 genreIds에 해당하는 모든 값이 나옴
      },
    });

    if(genres.length !== createMovieDto.genreIds.length) {
      throw new NotFoundException(`존재하지 않는 장르가 있습니다. 존재하는 ids -> ${genres.map(genre => genre.id).join(',')}`);
    };

    const movie = await this.movieRepository.save({
      title: createMovieDto.title,
      detail: {
        detail: createMovieDto.detail,
      },
      director,
      genres,
    });

    return movie;
  }

  
  // Movie data 업데이트
  async update(id: number, updateMovieDto: UpdateMovieDto){
    const movie = await this.movieRepository.findOne({
      where:{
        id,
      },
      relations:['detail']
    });
    
    if(!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.')
    }

    const {detail, directorId, genreIds, ...movieRest} = updateMovieDto;

    // 감독 업데이트
    let newDirector;

    if(directorId) {
      const director = await this.directorRepository.findOne({
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
      const genres = await this.genreRepository.find({
        where:{
          id: In(genreIds),
        },
      });

      if(genres.length !== updateMovieDto.genreIds.length) {
        throw new NotFoundException(`존재하지 않는 장르가 있습니다. 존재하는 ids -> ${genres.map(genre => genre.id).join(',')}`);
      }

      newGenres = genres;
    }


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
    const movieUpdateFields = {
      ...movieRest, // newDirector가 존재하지 않으면 movieUpdateFields는 movieRest와 같고
      ...(newDirector && {director: newDirector}) // newDirector가 존재하면 director는 newDirector라는 값이 스프레드로 들어감 
    }

    await this.movieRepository.update(
      {id},
      movieUpdateFields,
    );

    if(detail){
      await this.movieDetailRepository.update(
        {
          id: movie.detail.id,
        },
        {
          detail,
        }
      )
    }

    // update 함수는 저장한 값을 반환해주지 않기 때문에 update 된 값을 찾아서 다시 반환해줌
    const newMovie = await this.movieRepository.findOne({
      where:{
        id,
      },
      relations: ['detail', 'director']
    });

    // update에 장르를 바로 넣어줄 수 없기 때문에 save를 사용해줘야함
    // detail까지 update한 다음에 여기에 다시 장르를 넣어줌
    newMovie.genres = newGenres;

    // 그리고 나서 다시 장르들을 연결해서 저장하기 위해 save를 또 사용해 줘야 함.
    await this.movieRepository.save(newMovie);

    // update한 값도 다시 불러와 줌.
    return this.movieRepository.findOne({
      where: {
        id,
      },
      relations: ['detail', 'director', 'genres']
    });
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

    await this.movieRepository.delete(id);
    await this.movieDetailRepository.delete(movie.detail.id);
    
    return id;
  }
}
