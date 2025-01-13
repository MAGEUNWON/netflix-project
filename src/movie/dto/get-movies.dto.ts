import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { CursorPaginationDto } from "src/common/dto/cursor-pagination.dto";
import { PagePaginationDto } from "src/common/dto/page-pagination.dto";

export class GetMoviesDto extends CursorPaginationDto{
    @IsString()
    @IsOptional()
    @ApiProperty({ // property 태그 하는 것. 원래 ApiProterty는 swagger에서 사용하고 싶은 모든 dto와 entity에 적용해줘야 하지만 nest-cil에 넣어서 적용했기 때문에 자동으로 이름과 타입이 유추가 됨. 설명과 예제 정도만 추가로 직접 넣어주면 됨. 또는 값에 입력하지 않아도 default로 값 들어가게 하는 역할로도 사용할 수 있음  
        description: '영화의 제목',
        example: '프로메테우스', // 기본 값으로 들어가 있게 하는 용도로도 사용할 수 있음.
    }) 
    title?: string;
}