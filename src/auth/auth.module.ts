import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategy/local.strategy';
import { JwtStrategy } from './strategy/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
    ]),
    JwtModule.register({}) // jwt 사용하려면 설치 후 모듈에 등록. 원래는 {} 안에 셋팅 값을 넣어줘야 하는데 지금은 모듈에 등록하지 않고 서비스 안에서 사용할 때 옵션 넣어줄 것임(비밀번호랑 유효기간 다 따로 쓸것이기 때문)
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService, JwtModule]
})
export class AuthModule {}
