import { Contains, Equals, IsAlpha, IsAlphanumeric, IsArray, IsBoolean, IsCreditCard, IsDateString, IsDefined, IsDivisibleBy, IsEmpty, IsEnum, IsHexColor, IsIn, IsInt, IsLatLong, IsNegative, isNotEmpty, IsNotEmpty, IsNotIn, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Max, MaxLength, Min, MinLength, NotContains, NotEquals, registerDecorator, Validate, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

enum MovieGenre {
    Fantasy = 'fantasy',
    Action = 'action'
}

// // custom validator (하나의 클래스와 하나의 함수로 만들 수 있음.)
// @ValidatorConstraint({
//     async: true, // 이렇게 하면 비동기로도 할 수 있음. 
// })
// class PasswordValidator implements ValidatorConstraintInterface {
//     validate(value: any, validationArguments?: ValidationArguments): Promise<boolean> | boolean {
//         // 비밀번호 길이는 4-8
//         return value.length > 4 && value.length < 8;
//     }
//     defaultMessage?(validationArguments?: ValidationArguments): string {
//         return '비밀번호의 길이는 4~8자로 해주세요. 입력된 비밀번호:($value)'
//     }

// }

// function IsPasswordValid(validationOptions?: ValidationOptions) {
//     return function(object: Object, propertyName: string){
//         registerDecorator({
//             target: object.constructor,
//             propertyName,
//             options: validationOptions,
//             validator: PasswordValidator,
//         });
//     }
// }

export class UpdateMovieDto {
    @IsNotEmpty()  // body에 빈값이 들어오면 에러 발생
    @IsOptional()  // 기존에 있으면 그대로 유지, genre만 수정하면 title 값을 유지되고 genre만 수정됨
    title?: string;

    @IsNotEmpty()
    @IsOptional()
    genre?: string;

    // @IsDefined()  // null || undefined 이 둘은 안됌. 
    // @IsOptional()
    // @Equals('code') // 안에 단어랑 같아야함. 
    // @NotEquals('code') // 안에 단어랑 같으면 안됌
    // @IsEmpty() // null || undefined || '' 이 세개만 가능(비어 있어야 함)
    // @IsNotEmpty()

    // !Array
    // @IsIn(['action', 'fantasy']) // 이 배열안에 있는 것만 가능
    // @IsNotIn(['action', 'fantasy']) // 이 배열안에 있는 것만 안됌

    // !type value 
    // @IsBoolean() // true, false만 가능
    // @IsString() // 글자만 가능
    // @IsNumber() // 숫자만 가능
    // @IsInt()  // 정수만 가능 
    // @IsArray() // 배열인지 아닌지, 배열만 가능
    // @IsEnum(MovieGenre)  // IsIn은 스트링으로 바로 입력해서 일회성으로 사용할 때 유용하고 데이터성으로 여기저기 사용하려면 enum이 유용함
    // @IsDateString() // 2024-07-07T12:00:00.000Z 여기까지 가능. 년월일은 - 나누고 날짜와 시간 사이는 T로 나눔. Z는 UTC 타입이라는 뜻이고 없으면 현재 시간을 말함, 2024만 보내도 가능함. 저 형식으로만 보내면 됌

    // !숫자 관련
    // @IsDivisibleBy(5) // () 안의 숫자로 나눌 수 있는가. 
    // @IsPositive() // 양수인가
    // @IsNegative() // 음수인가
    // @Min(100) // ()안의 수가 최소값
    // @Max(100) // () 안의 수가 최대값

    // @Contains('code') // ()안의 글자를 포함하는가, code 글자 자체는 훼손되서는 안되고 앞뒤로 다른 글자가 붙는 것은 가능. 포함만 되어있으면 됨
    // @NotContains('code') // () 안의 글자가 포함되지 않아야 함
    // @IsAlphanumeric() // 알파벳과 숫자로만 이루어져야함. 빈칸(공백), 한글 다 안됨 
    // @IsCreditCard() // 신용카드 번호(존재하는 카드인지 정도만 체크할 수 있다고 보면 됨), 5432-1234-1234-1234 이런 형식임
    // @IsHexColor() // 컴퓨터에서 색깔을 표현하는 방식(16진수 6글자로 표현함. FEFEFE 이런식. 무조건 6글자임.). 색깔 받을 때나 16진수 인지 구분할 수 있음. 
    // @MaxLength(6) // 최대로 들어갈 수 있는 숫자 (비밀번호 들어갈때 MinLength랑 같이 쓰면 좋음)
    // @MinLength(1) // 최소로 들어가야할 수 있는 숫자 
    // @IsUUID() // 데이터베이스에서 아이디 자동생성 시 랜덤하게 5개의 글자와 숫자들이 -로 나눠져 있는 것. 이 uuid에 해당되는 타입인지 확인하는 것
    // @IsLatLong() // 위도, 경도 유형에 맞는지. 자주 쓰이지는 않음. 
    // @IsPasswordValid({
    //     message: '다른 메세지'
    // })
    // test: string;
}