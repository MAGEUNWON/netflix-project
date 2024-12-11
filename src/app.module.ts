import { ForbiddenException, MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
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
import { envVariableKeys } from './common/const/env.const';
import { BearerTokenMiddleware } from './auth/middleware/bearer-token.middleware';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthGuard } from './auth/guard/auth.guard';
import { RBACGuard } from './auth/guard/rbac.guard';
import { ResponseTimeInterceptor } from './common/interceptor/response-time.interceptor';
import { ForbiddenExceptionFilter } from './common/filter/forbidden.filter';
import { QueryFailedExceptionFilter } from './common/filter/query-failed.filter';

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
        DB_DATABASE: Joi.string().required(),
        HASH_ROUNDS: Joi.number().required(),
        ACCESS_TOKEN_SECRET: Joi.string().required(),
        REFRESH_TOKEN_SECRET: Joi.string().required(),

      }),
    }), // env 파일과 연동하기 위해 씀
    // 데이터베이스와 연결하기 위한 것
    TypeOrmModule.forRootAsync({  // config모듈에 설정된 값을 기반으로 연결할것 이기 때문에 비동기로 처리 
      useFactory:(configService: ConfigService) => ({  // 비동기로 넣을때는 useFactory, inject 두개가 들어가야 함, 비동기로 할 땐 ioc container로 ConfigService를 넣어 줄 수 있음
          type: configService.get<string>(envVariableKeys.dbType) as "postgres",
          host: configService.get<string>(envVariableKeys.dbHost),
          port: configService.get<number>(envVariableKeys.dbPort),
          username: configService.get<string>(envVariableKeys.dbUsername),
          password: configService.get<string>(envVariableKeys.dbPassword),
          database: configService.get<string>(envVariableKeys.dbDatabase),
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
  providers: [ // 여기에 guard를 설정하면 전체 라우터에 적용됨. 이렇게 되면 Guard가 필요하지 않은 부분에도 적용되는 문제가 있는데 그걸 decorator로 처리해 줌
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD, // AuthGuard보다 밑에 적어줘야 함. 토큰이 있는지(AuthGuard) 먼저 확인 후 권한을(RoleGuard) 확인하는 순서이기 때문
      useClass: RBACGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTimeInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ForbiddenExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: QueryFailedExceptionFilter,
    }
  ]
})
// middleware 쓰기 위해 NestModule 을 implements 해줌
export class AppModule implements NestModule{
  // 무조건 configure 필요함.
  configure(consumer: MiddlewareConsumer) {
    // 적용할 middleware를 넣어줌
    consumer.apply(
      BearerTokenMiddleware,
    ).exclude({ // login과 register 라우터는 basic 토큰이 들어가기 때문에 BearerTokenMiddleware에서 예외처리 해줌
      path: 'auth/login',
      method: RequestMethod.POST,
    }, {
      path: 'auth/register',
      method: RequestMethod.POST,
    })
    .forRoutes('*') // '*' 이렇게 하면 전체 라우트에 적용시킨 다는 것
  }
}
