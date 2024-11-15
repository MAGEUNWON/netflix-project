import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // 불리안 값을 넣을 수 있음. 기본값은 false임, true로 하면 애초에 정의하지 않은 값은 전달하지 않음. 
    forbidNonWhitelisted: true, // 기본값 false, ture로 하면 정의한 값이 아니면 에러를 냄.
    transformOptions:{
      enableImplicitConversion : true, // class 적혀있는 type에 맞게 형태를 변경하라는 것
    }
  }));
  await app.listen(3000);
}
bootstrap();
