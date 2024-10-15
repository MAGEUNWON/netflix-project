import { ArrayNotEmpty, Contains, Equals, IsAlpha, IsAlphanumeric, IsArray, IsBoolean, IsCreditCard, IsDateString, IsDefined, IsDivisibleBy, IsEmpty, IsEnum, IsHexColor, IsIn, IsInt, IsLatLong, IsNegative, isNotEmpty, IsNotEmpty, IsNotIn, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Max, MaxLength, Min, MinLength, NotContains, NotEquals, registerDecorator, Validate, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

enum MovieGenre {
    Fantasy = 'fantasy',
    Action = 'action'
}


export class UpdateMovieDto {
    @IsNotEmpty()  // body에 빈값이 들어오면 에러 발생
    @IsString()
    @IsOptional()  // 기존에 있으면 그대로 유지, genre만 수정하면 title 값을 유지되고 genre만 수정됨
    title?: string;

    @IsNotEmpty()
    @IsString()
    @IsOptional()
    detail?: string;

    @IsNotEmpty()
    @IsNumber()
    @IsOptional()
    directorId?: number;

    @IsArray()
    @ArrayNotEmpty()
    @IsNumber({}, {
        each: true,
    })
    @IsOptional()
    genreIds?: number[];

} 