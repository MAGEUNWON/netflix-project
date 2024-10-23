// emial과 password로 로그인 할 수 있는 strategy

import { Injectable } from "@nestjs/common";
import { AuthGuard, PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local"; // local strategy를 불러 옴
import { AuthService } from "../auth.service";

export class LocalAuthGuard extends AuthGuard('local'){};

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy){
    constructor(
        private readonly authService: AuthService,
    ){
        super({
            usernameField: 'email' // username이란 이름을 email로 바꿔줌
        }); // 모든 stragety는 super consturctor를 불러 줘야함. 필요한 파라미터는 이 안에 다 넣어야 함
    }

    /**
     * validate는 stratgy에서 제공하는 값으로 실제로 존재하는 사용자인지 검증해주는 것임. 
     * 근데 LocalStrategy는 
     * 
     * validate함수에 username, password -> 이 두개의 파라미터를 그냥 넣어주면 됨 
     * 
     * return -> Request(); 반환값을 request 객체에서 받을 수 있음. 
     */
    async validate(email: string, password: string){
        const user = await this.authService.authenticate(email, password);

        return user;
    }
}