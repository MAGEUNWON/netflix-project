import { PartialType } from "@nestjs/mapped-types";
import { CreateMovieDto } from "./create-movie.dto";


export class UpdateMovieDto extends PartialType(CreateMovieDto){}

// export class UpdateMovieDto {
//     @IsNotEmpty()  // body에 빈값이 들어오면 에러 발생
//     @IsString()
//     @IsOptional()  // 기존에 있으면 그대로 유지, genre만 수정하면 title 값을 유지되고 genre만 수정됨
//     title?: string;

//     @IsNotEmpty()
//     @IsString()
//     @IsOptional()
//     detail?: string;

//     @IsNotEmpty()
//     @IsNumber()
//     @IsOptional()
//     directorId?: number;

//     @IsArray()
//     @ArrayNotEmpty()
//     @IsNumber({}, {
//         each: true,
//     })
//     @IsOptional()
//     genreIds?: number[];

// } 

