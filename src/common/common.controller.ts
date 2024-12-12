import { BadRequestException, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('common')
export class CommonController {
    // post 요청으로 파일 업로드하는 api 작업. 파일을 post 할 때 같이 올리는 것이 아니라 파일은 미리 common endpoin에 올려놓은 후 파일 이름만 가지고 createMovieDto에 이름을 넘겨주면 그 파일을 영구 저장소로(s3 같은 것) 옮기는 작업을 하기 위한 것
    @Post('video')
    @UseInterceptors(FileInterceptor('video', {  // post 할 때 파일 업로드를 같이 진행함. 'movie'는 파일 올릴 때 키값 이름임, FileInterceptor는 파일 한개만 업로드할 때 사용하고 FilesInterceptor는 여러개 파일 업로드 할 때 사용
        limits: {
          fileSize: 20000000, // limits 안에 제한둔 사항은 파일 업로드가 아예 되지 않음. 
        },
        fileFilter(req, file, callback){
          console.log(file);
    
          // 이런식으로 조건 걸어줘서 받기 싫은 파일은 받지 않아 줄 수 있음. 그럼 movie 폴더에 파일이 저장되지 않음. 
          if(file.mimetype !== 'video/mp4'){
            return callback(new BadRequestException('MP4 타입만 업로드 가능합니다!'), false)
          }
    
          return callback(null, true); // null은 에러가 있으면 에러가 들어갈 부분임. 에러 넣어주면 자동으로 에러 던져줌. false는 파일이 오면 아예 파일을 받지 않는다는 설정임. 파일 받으려면 true로 설정 해줘야 함
        }
      }))
      createVideo(
        @UploadedFile() movie: Express.Multer.File,
      ) {
        return {
            fileName : movie.filename,
        }
        
      }

}



// @UseInterceptors(FileFieldsInterceptor([ // 파일 필드를 두개 이상 받을 때는 FileFieldsInterceptor를 사용함. 리스트로 받아야 함
  //   {
  //     name: 'movie', // 어떤 필드로 받을 것인지
  //     maxCount: 1, // 최대 몇개 받을 것인지 
  //   },
  //   {
  //     name: 'poster',
  //     maxCount: 2,
  //   }
  // ],{
  //   limits: {
  //     fileSize: 20000000, // limits 안에 제한둔 사항은 파일 업로드가 아예 되지 않음. 
  //   },
  //   fileFilter(req, file, callback){
  //     console.log(file);

      // 이런식으로 조건 걸어줘서 받기 싫은 파일은 받지 않아 줄 수 있음. 그럼 movie 폴더에 파일이 저장되지 않음. 
  //     if(file.mimetype !== 'video/mp4'){
  //       return callback(new BadRequestException('MP4 타입만 업로드 가능합니다!'), false)
  //     }

  //     return callback(null, true); // null은 에러가 있으면 에러가 들어갈 부분임. 에러 넣어주면 자동으로 에러 던져줌. false는 파일이 오면 아예 파일을 받지 않는다는 설정임. 파일 받으려면 true로 설정 해줘야 함
  //   }
  // }))


//  @UploadedFiles() files: Express.Multer.File[], // 파일 형식이 express의 multer file 형식이라는 것. 여기도 파일 한개면 UploadedFile을 사용하고 여러개 일땐 UploadedFiles를 사용해야 함. 파일 여러개 일 땐 리스트[]로 받아야 하기 때문에 써줘야 함 
// @UploadedFile() movie: Express.Multer.File,
  
// files: { // FileFieldsInterceptor 사용할 때는 객체로 묶어서 각각 필드에 설정을 해줘야 함
//   movie?: Express.Multer.File[],
// } 