import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { catchError, Observable, tap } from "rxjs";
import { DataSource } from "typeorm";

// movie service에서 반복되는 부분을 transaction interceptor로 만들어 주고 있음. 
// 이렇게 하면 movie service에서 try-catch-finally, qr.connect() 등등을 계속 반복해서 사용하지 않아도 됨. 
@Injectable()
export class TransactionInterceptor implements NestInterceptor{
    // dataSource에서 qr을 가져 오기 위해 inject 받음 
    constructor(
        private readonly dataSource: DataSource,
    ){}

    async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
        const req = context.switchToHttp().getRequest();

        // 트랜잭션 추가 
        const qr = this.dataSource.createQueryRunner();
        
        await qr.connect();
        await qr.startTransaction(); // 데이터 베이스에 실행 내용 반영

        // sevice에서 요청을 실행할 때 qr받아야 하는데 여기서 qr을 넘겨 줘야 함. 
        // req에 queryRunner라는 값을 붙여서 이 interceptor에서 사용할 수 있는 qr을 만들어 줌
        // 그럼 interceptor가 실행되는 동안에는 req context 안의 qeuryRunner가 여기서 만든 qr이 됨 
        req.queryRunner = qr; 

        // 로직 실행 부분 
        return next.handle()
            .pipe(
                // catchError함수를 사용하면 만약 pipe를 실행하는 동안 에러가 나면 실행할 수 있는 함수를 입력할 수 있음. 
                catchError(
                    async (e)=>{
                        await qr.rollbackTransaction(); // 에러가 하나라도 생겼을 때 상태로 복원 시키기 위해 사용.
                        await qr.release(); // 에러가 났든, 트랜잭션에 커밋을 했든 release를 통해 데이터베이스 pool에 트랜잭션을 되돌려 줘야함. 안하면 계속 물려있을 수 있음. 

                        throw e; // 다시 에러를 던져줌
                    }
                ),
                // queryRunner에서 실행한 트랜잭션이 성공적으로 실행이 잘 됐다면 commit을 해줘야지만 데이터베이스에 반영이 됨
                tap(async () => { 
                    await qr.commitTransaction(); // 데이터 베이스에 실행 내용 반영
                    await qr.release();
                })
            )
    }
    
}