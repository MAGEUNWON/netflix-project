import { IsInt, IsOptional } from "class-validator";

export class PagePaginationDto{
    @IsInt()
    @IsOptional()
    page : number = 1;

    @IsInt()
    @IsOptional()
    take: number = 5; // 기본으로 5개만 가져오게 설정. 실무에선 10, 20개정도로 함
}

// page, take를 number로 설정했는데 모든 쿼리는 url 안에 들어가기 때문에 string으로 입력이 됨
// 그래서 IsInt()를 패스 할 수 없어서 에러가 남. 
// 이런 경우 main.ts에서 transformOptions:{enableImplicitConversion : true} 로 설정해주면 됨
// 이렇게 해주면 class에 적혀있는 타입스크립트 타입을 기반으로 입력하는 값을 변경하라는 것. url에 string으로 들어가지만
// 알아서 숫자로 바꾸라는 설정임. 