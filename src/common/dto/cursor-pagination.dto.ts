import { IsArray, IsIn, IsInt, IsOptional, IsString, isString } from "class-validator";

// cursor 페이지네이션은 궁극적인 로직만 구현이 되면 나머지 형식은 자유도가 높음. 꼭 아래 형식에 맞지 않아도 상관없음
export class CursorPaginationDto{
    @IsString()
    @IsOptional()
    // id_52, likeCount_20 이런 형식으로 넣을 것
    cursor?: string; // cursor를 페이지네이션 할 때마다 서버에서 프론트로 보내주는 방식.

    @IsArray()
    @IsString({
        each: true
    })
    @IsOptional()
    // id_ACS_id_DESC
    // [id_DESC, likeCount_DESC] -> order는 이렇게 생김
    order : string[] = ['id_DESC']; // ASC, DESC를 여기서 나타내 줌, 만약 아무값도 안넣어주면 기본값이 id_DESC 기준으로 정렬됨

    @IsInt()
    @IsOptional()
    take: number = 5;
}