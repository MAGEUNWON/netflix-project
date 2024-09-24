import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { number } from 'joi';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';

@Injectable()
export class MovieService {

  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>
  ){}

  async getManyMovies(title?: string){
    // title 없을 때 조건, count 적용 
    if(!title) {
      return [await this.movieRepository.find(), await this.movieRepository.count()];
    }

    // title 있을 때 조건 필터 적용
    return this.movieRepository.findAndCount({
      where:{
        title: Like(`%${title}%`),
      },
    });
  }
  
  async getMovieById(id: number){
    const movie = await this.movieRepository.findOne({
      where:{
        id,
      }
    });

    if(!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }

    return movie;
  }

  async createMovie(createMovieDto: CreateMovieDto){
    const movie = await this.movieRepository.save(createMovieDto);

    return movie;
  }

  async updateMovie(id: number, updateMovieDto: UpdateMovieDto){
    const movie = await this.movieRepository.findOne({
      where:{
        id,
      }
    });
    
    if(!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.')
    }

    await this.movieRepository.update(
      {id},
      updateMovieDto,
    );

    // update 함수는 저장한 값을 반환해주지 않기 때문에 update 된 값을 찾아서 다시 반환해줌
    const newMovie = await this.movieRepository.findOne({
      where:{
        id,
      }
    });

    return newMovie;
  }

  async deleteMovie(id: number){

    const movie = await this.movieRepository.findOne({
      where:{
        id,
      }
    });

    if(!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.')
    }

    await this.movieRepository.delete(id);
    
    return id;
  }
}
