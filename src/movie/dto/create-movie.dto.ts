import { ArrayNotEmpty, IsArray, IsNotEmpty, IsNumber, isString, IsString } from "class-validator";

export class CreateMovieDto {
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsNotEmpty()
    @IsString()
    detail: string;

    @IsNotEmpty()
    @IsNumber()
    directorId: number;

    @IsArray()
    @ArrayNotEmpty()
    @IsNumber({}, { // 첫번째 파라미터 {} 는 IsNumber 고유의 옵션임. 아무것도 안넣어도 됌
        each: true, // 이렇게 설정하면 list안에 있는 모든 값들이 각각 검증이 됌, 즉 배열 안의 값들이 각각 다 숫자인지 검증하는 것.
    })
    genreIds: number[];
}