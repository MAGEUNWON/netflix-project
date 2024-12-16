import { createParamDecorator, ExecutionContext, InternalServerErrorException } from "@nestjs/common";

export const QueryRunner = createParamDecorator(
    (data: any, context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();

        if(!request || !request.queryRunner) {
            throw new InternalServerErrorException('Query Runner 객체를 찾을 수 없습니다!'); // query Runner가 없는 경우는 @UseInterceptors() 안에 TransactionInterceptor를 적용하지 않은 경우밖에 없음. 이건 서버쪽 문제이기 때문에 serverError를 넣어줌
        }
        return request.queryRunner;
    }
)