import { PartialType } from '@nestjs/mapped-types';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CreateDirectorDto } from './create-director.dto';

// 기존에 옵션으로 컬럼들을 다 적어준걸 PartialType 을 사용해서 CreateDirectorDto에
// 있는 내용을 옵셔널로 가져와서 사용할 수 있음. 이렇게하면 훨씬 코드가 간단해짐. 내용을 추가하고 싶으면
// CreateDto에 추가해주면 자동으로 UpdateDto에도 반영됨
export class UpdateDirectorDto extends PartialType(CreateDirectorDto){}

// export class UpdateDirectorDto {
//     @IsNotEmpty()
//     @IsString()
//     @IsOptional()
//     name?: string;

//     @IsNotEmpty()
//     @IsDateString()
//     @IsOptional()
//     dob?: Date;

//     @IsNotEmpty()
//     @IsString()
//     @IsOptional()
//     nationality?: string;
// }
