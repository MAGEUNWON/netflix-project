import { Module } from "@nestjs/common";
import { CommonService } from "./common.service";
import { CommonController } from './common.controller';
import { MulterModule } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { join } from "path";
import { v4 } from "uuid";
import { TasksService } from "./tasks.service";

@Module({
    imports: [
        // 파일 업로드 모듈 설정
        MulterModule.register({
            storage: diskStorage({ // 어디에 파일을 저장할 것인지 지정하는 것
              destination: join(process.cwd(), 'public', 'temp'),  // 어느 폴더에 넣을 것인지 지정하는 것. 
              // process.cwd함수를 사용하면 현재 내가 서버를 실행하고 있는 위치의 최상단(루트)의 경로가 나오게 됨. join 함수 안에다가 경로를 넣게 되면 콤마(,)로 폴더를 지정할 수 있음. 이 최상단 경로 안에서 들어가고 싶은 폴더를 하나씩 입력해주면 됨
              // 만약 process.cwd() + '/public' + '/movie' 이런식으로 해도 되긴 하지만 이렇게 사용하려면 배포하려는 환경도 같아야 가능함. 
              // 윈도우는 process.cwd() + '\public' + '\movie' 이런식으로 진행되기 때문에 윈도우에서는 파일 실행을 할 수 없게됨. 이걸 방지하기 위해 join 함수를 사용하는 것임. 각자의 운영체제에 적합하게 변경해서 진행해줌 
              // ......../Netflix/public/movie 이렇게 경로가 지정된 것임
      
              filename: (req, file, cb) => { // req -> 클라이언트에서 보낸 HTTP 요청 정보를 포함. file -> 업로드된 파일 정보 객체. cb -> 콜백함수(error, filename), error에 null 넣으면 error 없이 진행
                const split = file.originalname.split('.'); // -> originalname이 exeample.mp4로 되어 있다면 . 기준으로 split 한것 
      
                let extension = 'mp4'; // 기본 확장자는 mp4
      
                if(split.length > 1){ // 확장자가 있는 경우에만 처리함
                  extension = split[split.length - 1]; // 배열의 마지막 요소를 확장자로 지정
                }
      
                cb(null, `${v4()}_${Date.now()}.${extension}`); // 이 콜백에 null 넣고 그 뒤에 원하는 파일 이름 넣어주면 그 파일 이름대로 변경되서 저장됨. 파일 이름은 v4 사용해서 uuid 생성해줌
              }
            }), 
          }),
    ],
    controllers: [CommonController],
    providers: [CommonService, TasksService],
    exports: [CommonService],
})
export class CommonModule{}