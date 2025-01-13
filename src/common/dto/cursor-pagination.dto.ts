import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsArray, IsIn, IsInt, IsOptional, IsString, isString } from "class-validator";

// cursor 페이지네이션은 궁극적인 로직만 구현이 되면 나머지 형식은 자유도가 높음. 꼭 아래 형식에 맞지 않아도 상관없음
export class CursorPaginationDto{
    @IsString()
    @IsOptional()
    @ApiProperty({
        description: '페이지네이션 커서',
        example: 'eyJ2YWx1ZXMiOnsiaWQiOjF9LCJvcmRlciI6WyJpZF9ERVNDIl19',
    })
    // id_52, likeCount_20 이런 형식으로 넣을 것
    cursor?: string; // cursor를 페이지네이션 할 때마다 서버에서 프론트로 보내주는 방식.

    @IsArray()
    @IsString({
        each: true
    })
    @IsOptional()
    @ApiProperty({
        description: '내림차 또는 오름차 정렬',
        example: ['id_DESC'] // swagger에서는 []로 넣어줬을 때 1개 값만 넣으면 Error: Bad Request로 나옴.(포스트맨은 정상). 배열이기 때문에 2개 이상 넣어줘야 제대로 값이 나옴. 
    })
    @Transform(({value}) => (Array.isArray(value) ? value : [value])) // 그래서 위의 문제를 해결하기위해 value가 array면 그대로 value 반환하고 array 아니면 array로 만들어서 나오도록 transform 해줌
    // id_ACS_id_DESC
    // [id_DESC, likeCount_DESC] -> order는 이렇게 생김
    order : string[] = ['id_DESC']; // ASC, DESC를 여기서 나타내 줌, 만약 아무값도 안넣어주면 기본값이 id_DESC 기준으로 정렬됨

    @IsInt()
    @IsOptional()
    @ApiProperty({
        description: '가져올 데이터 갯수',
        example: 5,
    })
    take: number = 5;
}