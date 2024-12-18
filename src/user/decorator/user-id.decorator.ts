import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";

export const UserId = createParamDecorator( // parameter를 만들려면 createParamDecorator함수를 실행해 주면 됌
    (data: unknown, context: ExecutionContext) => { // data는 decorator쓸 때 ('')이 안에 들어갈 값이 data임
        const request = context.switchToHttp().getRequest();

        return request?.user?.sub; // bearer-token guard에서 req.user를 payload에 넣어줬었음. payload의 sub키 안에 사용자 아이디를 넣어놨기 때문에 이렇게 가져올 수 있음
    }
);