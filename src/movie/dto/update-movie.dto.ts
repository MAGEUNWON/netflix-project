import { CreateMovieDto } from "./create-movie.dto"; 
// import { PartialType } from "@nestjs/mapped-types"; // mapped-types에서 PartialType을 불러오면 swagger에서 update 부분은 인식이 제대로 안되 
import { PartialType } from "@nestjs/swagger"; // 여기서 불러와야 swagger에서 인지 할 수 있음. swagger 사용할 때는 이걸로 불러줘야 함 


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

