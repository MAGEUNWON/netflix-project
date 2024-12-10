import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, of, tap } from "rxjs";

@Injectable()
export class CacheInterceptor implements NestInterceptor{
    // Map<key, value>
    private cache = new Map<string, any>(); // interceptor에서 들고 있을 변수 임. 나중에 쓴다면 이렇게 메모리에 넣는것 보다는 Redis를 사용하는 것이 좋음. 

    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();

        // GET /movie -> (Map key 값) GET /movie로 부르는 것이 Key 값이 됨
        const key = `${request.method}-${request.path}`;

        if(this.cache.has(key)){ // has를 통해 key가 존재하는지 확인 함
            return of(this.cache.get(key)); // of를 쓰면 Observable로 반환할 수 있음. of를 쓰면 일반 변수를 Observable로 반환할 수 있음
            // 똑같은 key값을 찾으면 반환해버림. next.handle 함수를 부르지 않고도 바로 반환할 수 있음. 
        }

        return next.handle() // cache가 없는 경우, cache 저장이 안된 경우임
        .pipe(
            tap(response => this.cache.set(key, response)), // set을 사용해서 cache 변수 안에 넣어줌. 
        )


    }
    // 이렇게 하면 nextCursor를 넣어줘도 응답이 변하지 않고 첫번째 보낸 응답 그대로 나옴. key값을 method + key 값으로 해뒀기 때문에 
    // nextCursor를 아무리 변경해도 첫번째 값이 응답되게 됨. 서버를 다시 시작하게 되면 그 때 응답이 바뀜. 
}