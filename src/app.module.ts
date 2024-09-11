import { Module } from '@nestjs/common';
import { MovieModule } from './movie/movie.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// app.module은 중앙화의 역할만 함. app.service, app.controller도 직접 쓰기보단 모듈화로 처리
@Module({
  imports: [
    ConfigModule.forRoot(), // env 파일과 연동하기 위해 씀
    // 데이터베이스와 연결하기 위한 것
    TypeOrmModule.forRoot({
      type: process.env.DB_TYPE as "postgres",
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [],
      synchronize: true,  // 자동으로 코드와 맞게 데이터베이스를 싱크시키라는 것. 때문에 개발할때만 true로 해주고 production에서는 false로 함. production에서 싱크 맞추는 것은 마이그레이션에서 함
    }),
    MovieModule
  ],
})
export class AppModule {}
