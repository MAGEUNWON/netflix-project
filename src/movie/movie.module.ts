import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController, MovieControllerV2 } from './movie.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './entity/movie.entity';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entitiy/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { CommonModule } from 'src/common/common.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import {join} from 'path';
import { v4 } from 'uuid';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { User } from 'src/user/entities/user.entity';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports:[
    TypeOrmModule.forFeature([
      Movie,
      MovieDetail,
      MovieUserLike,
      Director,
      Genre,
      User
    ]),
    CommonModule,
  ],  
  controllers: [MovieController, MovieControllerV2], // version neutral을 사용할 때는 모든 버전을 흡수하기 때문에 상세한 버전이 먼저 쓰여야 적용됨. MovieControllerV2를 앞에 적어줘야 제대로 [] 값이 나오게 됨 
  providers: [MovieService],
})
export class MovieModule {}
