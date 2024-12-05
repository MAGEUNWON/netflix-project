import { CallHandler, ExecutionContext, Injectable, InternalServerErrorException, NestInterceptor } from "@nestjs/common";
import { delay, Observable, tap } from "rxjs";

@Injectable()
export class ResponseTimeInterceptor implements NestInterceptor{
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
        const req = context.switchToHttp().getRequest();

        const reqTime = Date.now(); // 요청 전에, 요청이 프로세싱되기 직전의 시간임

        return next.handle()
        .pipe( // pipe 안의 코드는 위에 줄 부터 순서대로 실행됨. 
            delay(1000), // delay 함수를 써주면 일부러 1000초를 기다리게 할 수 있음. 에러 내보기 위한 것
            tap(()=>{ // tap에 콜백으로 실행하고 싶은 함수 넣어주면 됨. 
                const respTime = Date.now(); // 응답이 프로세싱 된 직후의 시간임
                const diff = respTime - reqTime; // 차이를 구함 밀리세컨으로 나옴 

                if(diff > 1000){ // 너무 오래 걸리면 응답을 끊어버릴 수 있도록 설정할 수 있음. 
                    console.log(`!!!TIMEOUT!!! ${req.method} ${req.path}] ${diff}ms` )

                    throw new InternalServerErrorException('시간이 너무 오래 걸렸습니다!')

                }else {
                    console.log(`[${req.method} ${req.path}] ${diff}ms`); // req.method는 어떤 메소드로 요청을 보냈는지 알 수 있음. 
                }
            }),
            // 위의 코드대로면 ResponseTimeInterceptor를 사용하면 적용된 요청(함수)에서 몇초 동안 로직이 프로세싱 됐는지(로깅을) 알 수 있음. 

        )
    }
}