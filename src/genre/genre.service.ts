import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Genre } from './entity/genre.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GenreService {

  // Genre inject 해주기
  constructor(
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
  ){}

  // 장르 생성하기
  async create(createGenreDto: CreateGenreDto) {
    const genre = await this.genreRepository.findOne({
      where:{
        name: createGenreDto.name,
      },
    });
    
    if(genre) {
      throw new NotFoundException('이미 존재하는 장르입니다.')
    }

    return this.genreRepository.save(createGenreDto);
  }

  // 장르 전체 찾기
  findAll() {
    return this.genreRepository.find();
  }

  // 특정 장르 찾기
  findOne(id: number) {
    return this.genreRepository.findOne({
      where: {
        id,
      },
    });
  }

  // 장르 수정하기
  async update(id: number, updateGenreDto: UpdateGenreDto) {
    const genre = await this.genreRepository.findOne({
      where:{
        id,
      },
    });
    
    if(!genre) {
      throw new NotFoundException('존재하지 않는 장르입니다.')
    }

    await this.genreRepository.update(
      {
        id,
      },
      {
        ...updateGenreDto,
      }
    );

    const newGenre = await this.genreRepository.findOne({
      where: {
        id,
      },
    });

    return newGenre;
  }

  // 장르 삭제하기
  async remove(id: number) {
    const genre = await this.genreRepository.findOne({
      where:{
        id,
      },
    });
    
    if(!genre) {
      throw new NotFoundException('존재하지 않는 ID의 장르입니다.')
    }

    await this.genreRepository.delete(id);

    return id;
  }
}
