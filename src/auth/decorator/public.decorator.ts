// public으로 만들어주고 싶은 endpoint들만 이 decorator를 붙여줌으로써 authGuards를 통과할 수 있게 함

import { Reflector } from "@nestjs/core";

// 이렇게 하면 public이 실행됨. public이 붙으면 어떻게 동작할 것인지에 대한 로직은 auth.guards.ts에서 만들어주면 됨
export const Public = Reflector.createDecorator();
