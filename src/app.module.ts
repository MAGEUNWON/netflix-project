import { Module } from '@nestjs/common';
import { MovieModule } from './movie/movie.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { Movie } from './movie/entity/movie.entity';
import { MovieDetail } from './movie/entity/movie-detail.entity';
import { DirectorModule } from './director/director.module';
import { Director } from './director/entitiy/director.entity';
import { GenreModule } from './genre/genre.module';
import { Genre } from './genre/entity/genre.entity';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { User } from './user/entities/user.entity';

// app.module은 중앙화의 역할만 함. app.service, app.controller도 직접 쓰기보단 모듈화로 처리
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 어떤 모듈에서든 config 모듈에 등록된 환경 변수를 사용할 수 있도록 설정하는 것
      validationSchema: Joi.object({  // Joi로 환경변수 등록. Joi로 미리 validation 해두면 환경변수에서 어떤 값이 문제가 있는지 넣어보기 전에 알 수 있음.
        ENV: Joi.string().valid('dev', 'prod').required(), // string인데 필수값이다 라는 뜻. valid를 사용해서 dev, prod 환경만 사용하겠다고 설정함
        DB_TYPE: Joi.string().valid('postgres').required(), // valid(옵션) 안에 postgres 넣어주면 이것만 쓰겠다고 설정하는 것
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(), // number인데 필수값이다 라는 뜻.
        DB_USERNAME: Joi.string().required(), 
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required()
      }),
    }), // env 파일과 연동하기 위해 씀
    // 데이터베이스와 연결하기 위한 것
    TypeOrmModule.forRootAsync({  // config모듈에 설정된 값을 기반으로 연결할것 이기 때문에 비동기로 처리 
      useFactory:(configService: ConfigService) => ({  // 비동기로 넣을때는 useFactory, inject 두개가 들어가야 함, 비동기로 할 땐 ioc container로 ConfigService를 넣어 줄 수 있음
          type: configService.get<string>('DB_TYPE') as "postgres",
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_DATABASE'),
          entities: [ // 여기에 만들어둔 Entity 등록해줘야 테이블 생성 됨
            Movie,
            MovieDetail,
            Director, 
            Genre,
            User,
          ],
          synchronize: true,  // 자동으로 코드와 맞게 데이터베이스를 싱크시키라는 것. 때문에 개발할때만 true로 해주고 production에서는 false로 함. production에서 싱크 맞추는 것은 마이그레이션에서 함
      }),
      inject: [ConfigService]
    }),
    // TypeOrmModule.forRoot({  // 동기
    //   type: process.env.DB_TYPE as "postgres",
    //   host: process.env.DB_HOST,
    //   port: parseInt(process.env.DB_PORT),
    //   username: process.env.DB_USERNAME,
    //   password: process.env.DB_PASSWORD,
    //   database: process.env.DB_DATABASE,
    //   entities: [],
    //   synchronize: true,  // 자동으로 코드와 맞게 데이터베이스를 싱크시키라는 것. 때문에 개발할때만 true로 해주고 production에서는 false로 함. production에서 싱크 맞추는 것은 마이그레이션에서 함
    // }),
    MovieModule,
    DirectorModule,
    GenreModule,
    AuthModule,
    UserModule
  ],
})
export class AppModule {}
