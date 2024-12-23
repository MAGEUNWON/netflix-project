import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import { CallHandler, ExecutionContext, ForbiddenException, Inject, Injectable, NestInterceptor } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, tap } from "rxjs";
import { Throttle } from "src/auth/decorator/throttle.decorator";

// throttling은 어떤 api 사용시 분당 몇번 사용 할 수 있다는 제안 걸려 있는 것을 말함. 이걸 데이터베이스에 저장해서 데이터 resource를 사용할 필요 없이 캐시로 처리할 수 있음
@Injectable()
export class ThrottleInterceptor implements NestInterceptor{
    constructor(
        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache,
        private readonly reflector: Reflector,
    ){}
    async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();

        // cache에 넣을 key 값 -> URL_USERID_MINTE
        // value 값 -> count
        
        const userId = request?.user?.sub;

        // userId 없으면 아예 throttling 하지 않음
        if(!userId){
            return next.handle();
        }

        const throttleOptions = this.reflector.get<{
            count: number,
            unit: 'minute',
        }>(Throttle, context.getHandler());

        if(!throttleOptions){
            return next.handle();
        }

        const date = new Date();
        const minute = date.getMinutes();

        const key = `${request.method}_${request.path}_${userId}_${minute}`;
        
        // key에 대한 value 값을 cache에 저장 한것. key값 별로 몇번 요청이 들어갔는지 세어 놓을 것
        const count = await this.cacheManager.get<number>(key);

        console.log(key);
        console.log(count);

        if(count && count >= throttleOptions.count){
            throw new ForbiddenException('요청 가능 횟수를 넘어섰습니다!');
        }

        return next.handle()
        .pipe(
            tap(
                async () => {
                    const count = await this.cacheManager.get<number>(key) ?? 0; // 만약 null이면 0으로 

                    this.cacheManager.set(key, count + 1, 60000); // 60초 뒤엔 삭제 해도 됨.
                    
                }
            )
        )


    }
}