import { ConsoleLogger, Injectable } from "@nestjs/common";

// 이 DefaultLogger 사용하려면 common.module의 provider와 export에 넣어줘야함. 그리고 나서 tasks.service.ts에도 inject 해줘야함
@Injectable()
export class DefaultLogger extends ConsoleLogger{ // ConsoleLogger를 extends 해줘야 nestjs에서 제공하는 기본 logger의 상세 내용. 색상 등을 가져올 수 있음
    warn(message: unknown, ...rest: unknown[]): void {
        console.log('---- WARN LOG ----');
        super.warn(message, ...rest);
    }

    error(message: unknown, ...rest: unknown[]): void{
        console.log('---- ERROR LOG ----');
        super.error(message, ...rest);
    }
}
// !이렇게 커스터마이징 해주면 아래처럼 warn, error log 위에는 콘솔 메시지가 같이 출력 됨
// [Nest] 44215  - 01/07/2025, 3:37:50 PM   FATAL FATAL 레벨 로그
// ---- ERROR LOG ----
// [Nest] 44215  - 01/07/2025, 3:37:50 PM   ERROR ERROR 레벨 로그
// ---- WARN LOG ----
// [Nest] 44215  - 01/07/2025, 3:37:50 PM    WARN WARN 레벨 로그
// [Nest] 44215  - 01/07/2025, 3:37:50 PM     LOG LOG 레벨 로그
// [Nest] 44215  - 01/07/2025, 3:37:50 PM   DEBUG DEBUG 레벨 로그
// [Nest] 44215  - 01/07/2025, 3:37:50 PM VERBOSE VERBOSE 레벨 로그