import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Public } from "../decorator/public.decorator";

@Injectable()
// Guard를 사용하기 위해서는 무조건 CanActivate를 implements 해야 함
export class AuthGuard implements CanActivate{
    constructor( // decorator에 있는 reflector 인스턴스를 주입 받기 위해 사용.  
        private readonly reflector: Reflector,
    ){}

    canActivate(context: ExecutionContext): boolean {
        // 만약에 public decoration이 되어 있으면 
        // 모든 로직을 bypass(통과)시킴
        const isPublic = this.reflector.get(Public, context.getHandler());

        if(isPublic){
            return true;
        }

        // 요청에서 user 객체가 존재하는지 확인하기(현재 HTTP요청 객체에 접근)
        const request = context.switchToHttp().getRequest();

        // 요청 객체에 user 객체가 없거나 user 정보의 type이 access 가 아닌 경우 false 반환
        if(!request.user || request.user.type !== 'access'){
            return false; // false는 guard 미적용
        }

        return true;  // ture면 guard 적용
        
    }
    
}

// ! 
// context는 NestJs에서 요청의 실행 컨텍스트(Execution Context)를 나타내며 
// Guard, interceptor, Filter 등에서 요청에 대한 메타데이터를 다루기 위해 사용됨. 
// 즉, 현재 요청이 어떤 환경에서 실행되는지를 나타내는 객체임. 이를 통해 HTTP 요청인지, WebSocket요청인지
// RPC 요청인지 알 수 있음. 