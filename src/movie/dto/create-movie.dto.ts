import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsNumber, isString, IsString } from "class-validator";

export class CreateMovieDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty({ // swagger에서 example, schema에 넣어 줄 내용 적으면 됨
        description: '영화 제목',
        example: '겨울왕국',
    })
    title: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        description: '영화 설명',
        example: '킬링타임용'
    })
    detail: string;

    @IsNotEmpty()
    @IsNumber()
    @ApiProperty({
        description: '감독 객체 ID',
        example: 1,
    })
    directorId: number;

    @IsArray()
    @ArrayNotEmpty()
    @IsNumber({}, { // 첫번째 파라미터 {} 는 IsNumber 고유의 옵션임. 아무것도 안넣어도 됌
        each: true, // 이렇게 설정하면 list안에 있는 모든 값들이 각각 검증이 됌, 즉 배열 안의 값들이 각각 다 숫자인지 검증하는 것.
    })
    @Type(() => Number) // Form 데이터를 보낼때는 스트링으로 밖에 보낼 수 없기 때문에 여기서 자동으로 Number 변환해 줄 수 있도록 transform을 해줘야 함
    @ApiProperty({
        description: '장르 IDs',
        example: [1, 2, 3],
    })
    genreIds: number[];

    @IsString()
    @ApiProperty({
        description: '영화 파일 이름',
        example: 'aaa-bbb-ccc-ddd.jpg',
    })
    movieFileName: string;
}