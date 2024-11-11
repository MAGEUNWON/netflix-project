import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "src/user/entities/user.entity";
import { RBAC } from "../decorator/rbac.decorator";

@Injectable()
export class RBACGuard implements CanActivate{
    constructor(
        private readonly reflector: Reflector,
    ){}

    canActivate(context: ExecutionContext): boolean {
        const role = this.reflector.get<Role>(RBAC, context.getHandler());

        // Role Eunm(user entity에 정해뒀던 것)에 해당되는 값이 데코레이터에 들어갔는지 확인하기! 아예 안들어갔으면 검사할 필요가 없기 때문에 그냥 통과 시키면 됌
        if(!Object.values(Role).includes(role)){
            return true;
        }

        const request = context.switchToHttp().getRequest();

        const user = request.user;

        if(!user){
            return false;
        }
 
        return user.role <= role; // role enum 에서 만들어둔 걸 보면 admin, paid user, user 인데 각각 순서대로 번호가 0, 1, 2 번으로 매겨짐. 
    }
    
}