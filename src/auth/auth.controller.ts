import { Controller, Post, Headers, Request, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './strategy/local.strategy';
import { JwtAuthGuard } from './strategy/jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 회원 가입
  @Post('register')
  // authorization: Basic $token 값이 string으로 들어감. 
  registerUser(@Headers('authorization') token: string){ // Headers는 기본으로 쓰이는 Headers도 따로 있기 때문에 꼭 @nestjs/common에 직접 import 해줘야 함. 
    return this.authService.register(token);
  }

  // login
  @Post('login')
  loginUser(@Headers('authorization') token: string){
    return this.authService.login(token);
  }

  // access token 재발급 
  @Post('token/access')
  async rotateAccessToken(@Request() req){    
    return{
      accessToken: await this.authService.issueToken(req.user, false),
    }
  } 


// -------------------- 이 프로젝트에서 실제 쓰이진 않지만 참고용으로 만들어 둠 ------------------
  
  // Local AuthGuard
  @UseGuards(LocalAuthGuard)
  @Post('login/passport')
  async loginUserPassport(@Request() req){
    return {
      refreshToken: await this.authService.issueToken(req.user, true),
      accessToken: await this.authService.issueToken(req.user, false),
    };
  }

  // Jwt AuthGuard
  @UseGuards(JwtAuthGuard) // Guard를 적용해놓으면 에러가 발생 했을 때 이 밑의 코드가 아예 실행이 되지 않음
  @Get('private')
  async private(@Request() req){
    return req.user;
  }
}
