import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // logger: false, // flase로 해두면 logger가 안보임 
    logger: ['verbose'],// [] 안에 써준 순서 위로만 보여짐. 만약 error를 넣어주면 error, fatal만 보임. 
  });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER))
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
