// custom pipe 만드는 코드
// 여기서 만들고나서 controller에 가서 불러와서 쓰면 됨 
import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from "@nestjs/common";

@Injectable()
export class MovieTitleValidationPipe implements PipeTransform<string, string>{
    
    transform(value: string, metadata: ArgumentMetadata): string {
        // 타이틀이 아예 입력이 안된 경우에는 그냥 return 
        if(!value) {
            return value;
        }
        
        // 만약에 글자 길이가 2보다 작거나 같으면 에러 던지기!
        if(value.length <= 2) {  // 내가 원하는 방식으로 에러를 만들 수 있음. 
            throw new BadRequestException('영화의 제목은 3자 이상 작성해주세요')
        }

        return value;
    }
}