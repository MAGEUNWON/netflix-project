import { Module } from '@nestjs/common';
import { MovieModule } from './movie/movie.module';

// app.module은 중앙화의 역할만 함. app.service, app.controller도 직접 쓰기보단 모듈화로 처리
@Module({
  imports: [MovieModule],
})
export class AppModule {}
