import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // logger: false, // flase로 해두면 logger가 안보임 
    logger: ['verbose'],// [] 안에 써준 순서 위로만 보여짐. 만약 error를 넣어주면 error, fatal만 보임. 
  });
  app.enableVersioning({
    type: VersioningType.HEADER, // header type 버저닝 적용 
    header: 'version', // 키값을 뭘로 사용 할지 적용하는 옵션. 키값이 'version'이 되는 것 
    // type: VersioningType.URI, // 전체 api에 url 타입으로 versioningType을 지정해줌
    // defaultVersion: ['1', '2'], // 이렇게 배열로 넣을 수도 있고 그냥 '1' 이렇게 하나만 넣어도 됨. 저렇게 넣으면 기존 api 엔드포인트앞에 /v1 , /v2 넣어줘야 함
    // type: VersioningType.MEDIA_TYPE, // media Type 버저닝 적용
    // key: 'v=', // 흔히 많이 쓰는 key 형태임 . 키값은 무조건 Accept 넣어주면됨. 값은 application/json;v=1 이런식으로 들어감 
  })
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
