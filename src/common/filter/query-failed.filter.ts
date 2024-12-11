import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import { QueryFailedError } from "typeorm"; // typeorm에서 query 날렸을 때 문제가 생기면 이 에러를 던져줌

@Catch(QueryFailedError)
export class QueryFailedExceptionFilter implements ExceptionFilter{
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        const status = 400; // QueryFailedError에는 typeorm에서 가져오는 것이기 때문에 getStatus가 없음. 때문에 임의로 지정해줌

        let message = '데이터베이스 에러 발생!';

        // 혹시 실수로라도 다른 entity에 unique 키를 중복체를 안하고 데이터를 만들려고 했더라고 여기서 걸러줄 수 있음
        if(exception.message.includes('duplicate key')) {
            message = '중복 키 에러!';
        }

        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(), // 언제 에러 응답이 갔는지 확인하기 위함
            path: request.url, // 어디에서 문제가 났는지 확인하기 위함
            message,
        })
    }

}