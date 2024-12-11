import { ArgumentsHost, Catch, ExceptionFilter, ForbiddenException } from "@nestjs/common";

@Catch(ForbiddenException)
export class ForbiddenExceptionFilter implements ExceptionFilter{
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        const status = exception.getStatus();

        console.log(`[UnauthorizedException] ${request.method} ${request.path}`);

        response.status(status) //ForbiddenException 에러는 다 영어로 나오기 때문에 이런식으로 필요한 부분을 만들어서 에러를 사용해 주면 편함
            .json({ // body를 마음대로 변경해서 응답을 해줄 수 있음
                statusCode: status,
                timestamp: new Date().toISOString(), // 언제 에러 응답이 갔는지 확인하기 위함
                path: request.url, // 어디에서 문제가 났는지 확인하기 위함
                message: '권한이 없습니다!!!',

            })
    }
    
}