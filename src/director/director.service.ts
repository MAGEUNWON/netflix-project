import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Director } from './entitiy/director.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DirectorService {
  // Director inject 해주기
  constructor(
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
  ){}
  
  // 감독 생성하기
  create(createDirectorDto: CreateDirectorDto) {
    return this.directorRepository.save(createDirectorDto);
  }

  // 감독 전체 찾기
  findAll() {
    return this.directorRepository.find();
  }

  // 특정 감독 찾기
  findOne(id: number) {
    return this.directorRepository.findOne({
      where:{
        id,
      },
    });
  }

  // 감독 수정하기
  async update(id: number, updateDirectorDto: UpdateDirectorDto) {
    const director = await this.directorRepository.findOne({
      where:{
        id,
      },
    });
    
    if(!director) {
      throw new NotFoundException('존재하지 않는 감독입니다.')
    }

    await this.directorRepository.update(
      {
        id,
      },
      {
        ...updateDirectorDto,
      }
    );

    const newDirector = await this.directorRepository.findOne({
      where:{
        id,
      },
    });

    return newDirector
  }

  // 감독 삭제하기
  async remove(id: number) {
    const director = await this.directorRepository.findOne({
      where:{
        id,
      },
    });
    
    if(!director) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.')
    }

    await this.directorRepository.delete(id);

    return id;
  }
}
