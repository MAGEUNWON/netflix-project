import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { number } from 'joi';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';

@Injectable()
export class MovieService {

  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(MovieDetail)
    private readonly movieDetailRepository: Repository<MovieDetail>,
  ){}

  // 전체 값 가져오기
  async getManyMovies(title?: string){
    // title 없을 때 조건, count 적용 
    if(!title) {
      return [await this.movieRepository.find(), await this.movieRepository.count()];
    }

    // title 있을 때 조건 필터 적용
    return this.movieRepository.findAndCount({
      where:{
        title: Like(`%${title}%`),
      }, // 여기선 보통 detail을 가져오지는 않음. 
    }); 
  }
  
  // 특정 값 가져오기
  async getMovieById(id: number){
    const movie = await this.movieRepository.findOne({
      where:{
        id,
      },
      relations: ['detail'] // detail 값까지 가져오려면 Text로 relation 안에 넣어주면 됨
    }); // detail은 보통 전체 리스트에서 보다는 특정 값을 가져올때 나오게 함. 주로 상세페이지에서 사용 

    if(!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }

    return movie;
  }

  // Movie data 생성
  async createMovie(createMovieDto: CreateMovieDto){
    // ! movie entity에서 casecade를 true 설정 하면 이 부분 안만들고 detail에서 한번에 처리 가능함
    // const movieDetail = await this.movieDetailRepository.save({
    //   detail: createMovieDto.detail
    // });  

    const movie = await this.movieRepository.save({
      title: createMovieDto.title,
      genre: createMovieDto.genre,
      detail: {
        detail: createMovieDto.detail,
      },
    });

    return movie;
  }

  
  // Movie data 업데이트
  async updateMovie(id: number, updateMovieDto: UpdateMovieDto){
    const movie = await this.movieRepository.findOne({
      where:{
        id,
      },
      relations:['detail']
    });
    
    if(!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.')
    }

    const {detail, ...movieRest} = updateMovieDto;

    await this.movieRepository.update(
      {id},
      movieRest,
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
      }
    });

    return newMovie;
  }

  // Movie Data 삭제
  async deleteMovie(id: number){

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
