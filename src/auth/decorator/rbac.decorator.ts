import { Reflector } from "@nestjs/core";
import { Role } from "src/user/entities/user.entity";

// controller에서 RBAC 데코레이터가 붙여서 역할에 맞게 기능을 부여할 수 있음. 여기서도 데코레이터 생성만 해주고 자세한 로직은 rbac.guard.ts에서 진행 
export const RBAC = Reflector.createDecorator<Role>();