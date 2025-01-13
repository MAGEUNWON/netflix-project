import { createParamDecorator, ExecutionContext } from "@nestjs/common";

// swagger에서 인식이 안되게 할 수 있기 때문에 auth/login 같은 경우 authorization 직접 없이 맨 위에서 로그인 해주면 처리될 수 있도록 할 수 있음 
export const Authorization = createParamDecorator(
    (data: any, context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();

        return req.headers['authorization'];
    }
);