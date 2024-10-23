import { Controller, Post, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  // authorization: Baseic $token 값이 string으로 들어감. 
  registerUser(@Headers('authorization') token: string){ // Headers는 기본으로 쓰이는 Headers도 따로 있기 때문에 꼭 @nestjs/common에 직접 import 해줘야 함. 
    return this.authService.register(token);
  }

  @Post('login')
  loginUser(@Headers('authorization') token: string){
    return this.authService.login(token);
  }
}
