import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // logger: false, // flase로 해두면 logger가 안보임 
    logger: ['verbose'],// [] 안에 써준 순서 위로만 보여짐. 만약 error를 넣어주면 error, fatal만 보임. 
  });

  // swagger 설정, nest-cli.json에 plugins 설정까지 해주면 자동으로 정의를 해줌 
  const config = new DocumentBuilder()
  .setTitle('넷플릭스')
  .setDescription('Nesjs!')
  .setVersion('1.0') // 문서의 버전을 말하는 것
  .addBasicAuth() // basicAuth 있을 때 swagger 맨 윗 페이지에 설정 할 수 있도록 생기게 해줌 
  .addBearerAuth() // bearerAuth 있을 때 swagger 맨 윗 페이지에 설정 할 수 있도록 생기게 해줌 
  .build()

  // documnet 생성
  const document = SwaggerModule.createDocument(app, config); 

  SwaggerModule.setup('doc', app, document, { // 첫번째 파라미터에 어디에 setup 할 건지 입력해줌. 이렇게 하면 http://localhost:3000/doc 주소로 들어가면 나오게 됨 
    swaggerOptions:{
      persistAuthorization: true, // 이렇게 해주면 swagger에서 새로고침 해도 authorization이 안풀리고 유지됨. 다시 로그인 안해줘도됨
    }
  }) 

  // versioning 관련 코드
  // app.enableVersioning({
    // type: VersioningType.HEADER, // header type 버저닝 적용 
    // header: 'version', // 키값을 뭘로 사용 할지 적용하는 옵션. 키값이 'version'이 되는 것 
    // type: VersioningType.URI, // 전체 api에 url 타입으로 versioningType을 지정해줌
    // defaultVersion: ['1', '2'], // 이렇게 배열로 넣을 수도 있고 그냥 '1' 이렇게 하나만 넣어도 됨. 저렇게 넣으면 기존 api 엔드포인트앞에 /v1 , /v2 넣어줘야 함
    // type: VersioningType.MEDIA_TYPE, // media Type 버저닝 적용
    // key: 'v=', // 흔히 많이 쓰는 key 형태임 . 키값은 무조건 Accept 넣어주면됨. 값은 application/json;v=1 이런식으로 들어감 
  // });
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
