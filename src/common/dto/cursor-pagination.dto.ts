import { IsIn, IsInt, IsOptional } from "class-validator";

export class CursorPaginationDto{
    @IsInt()
    @IsOptional()
    id?: number;

    @IsIn(['ASC','DESC']) // ASC 또는 DESC만 넣을 수 있음
    @IsOptional()
    order : 'ASC' | 'DESC' = 'DESC'; // 기본값은 DESC, 아무것도 입력안하면 그냥 DESC 되는 것

    @IsInt()
    @IsOptional()
    take: number = 5;
}