import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
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
    CacheModule.register({
      ttl: 3000, // 만약 module에도 해주고 service에도 ttl 적용하면 service에서 적용한 세부 ttl이 더 우선시되서 적용됨
    }), // @nestjs/chche-manager install 해줌 
  ],  
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
