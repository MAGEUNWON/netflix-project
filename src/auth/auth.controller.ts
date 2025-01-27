import { Controller, Post, Headers, Request, UseGuards, Get, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './strategy/local.strategy';
import { JwtAuthGuard } from './strategy/jwt.strategy';
import { Public } from './decorator/public.decorator';
import { ApiBasicAuth, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Authorization } from './decorator/authorization.decorator';

@Controller('auth')
@ApiBearerAuth() // swagger에서 bearer token 인증을 활성화하기 위한 것. 
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 회원 가입
  @Public()
  @ApiBasicAuth()
  @Post('register')
  // authorization: Basic $token 값이 string으로 들어감. 
  registerUser(@Authorization() token:string) { // swagger적용시 authorization decorator만들고 나면 이렇게 변경해 줄 수 있음
    return this.authService.register(token);
  }
  // registerUser(@Headers('authorization') token: string){ // Headers는 기본으로 쓰이는 Headers도 따로 있기 때문에 꼭 @nestjs/common에 직접 import 해줘야 함. 
  //   return this.authService.register(token);
  // }

  // login
  @Public() 
  @ApiBasicAuth() // swagger에서 basicAuth 로그인 후 그 값을 authorization header에 넣어주기 위한 것. 이렇게 해주면 auth/login 옆에 자물쇠 버튼이 생김. 토큰 인증이 활성화 됐다는 뜻임.
  @Post('login')
  loginUser(@Authorization() token: string) { // swagger적용시 authorization decorator만들고 나면 이렇게 변경해 줄 수 있음
    return this.authService.login(token);
  }
  // loginUser(@Headers('authorization') token: string){
  //   return this.authService.login(token);
  // }

  // Token block
  @Post('token/block')
  blockToken(
    @Body('token') token: string,
  ){
    return this.authService.tokenBlock(token);
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
