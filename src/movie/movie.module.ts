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

@Module({
  imports:[
    TypeOrmModule.forFeature([
      Movie,
      MovieDetail,
      Director,
      Genre,
    ]),
    CommonModule,
    MulterModule.register({
      storage: diskStorage({ // 어디에 파일을 저장할 것인지 지정하는 것
        destination: join(process.cwd(), 'public', 'movie')  // 어느 폴더에 넣을 것인지 지정하는 것. 
        // process.cwd함수를 사용하면 현재 내가 서버를 실행하고 있는 위치의 최상단(루트)의 경로가 나오게 됨. join 함수 안에다가 경로를 넣게 되면 콤마(,)로 폴더를 지정할 수 있음. 이 최상단 경로 안에서 들어가고 싶은 폴더를 하나씩 입력해주면 됨
        // 만약 process.cwd() + '/public' + '/movie' 이런식으로 해도 되긴 하지만 이렇게 사용하려면 배포하려는 환경도 같아야 가능함. 
        // 윈도우는 process.cwd() + '\public' + '\movie' 이런식으로 진행되기 때문에 윈도우에서는 파일 실행을 할 수 없게됨. 이걸 방지하기 위해 join 함수를 사용하는 것임. 각자의 운영체제에 적합하게 변경해서 진행해줌 
        // ......../Netflix/public/movie 이렇게 경로가 지정된 것임
      }), 
    }),
  ],  
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
