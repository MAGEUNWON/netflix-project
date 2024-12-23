import { Reflector } from "@nestjs/core";

export const Throttle = Reflector.createDecorator<{
    count: number, // 몇 번 요청이 들어왔는지 기억 해두는 것
    unit: 'minute' // 분마다 적용할지, 시간, 일 마다 적용할지 등 적용하는 것
}>();