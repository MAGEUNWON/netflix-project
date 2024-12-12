import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import { v4 } from "uuid";
import { rename } from "fs/promises"; // 프로미스 기반으로 쓸 수 있은 파일 시스템에서 rename이란 기능 가져옴. 파일 이름 변경하는 기능
import { join } from "path";

@Injectable()
export class MovieFilePipe implements PipeTransform<Express.Multer.File, Promise<Express.Multer.File>>{ // < 전환하려는 값, 반환하려는 값이 들어감 
    constructor( // 파라미터를 받아줌
        private readonly options:{
            // MB로 입력
            maxSize: number,
            mimetype: string,
        }
    ){
    }

    async transform(value: Express.Multer.File, metadata: ArgumentMetadata): Promise<Express.Multer.File> {
        if(!value){
            throw new BadRequestException('movie 필드는 필수 입니다!');
        }

        const byteSize = this.options.maxSize * 1000000;

        if(value.size > byteSize){
            throw new BadRequestException(`${this.options.maxSize}MB 이하의 사이즈만 업로드 가능합니다!`);
        }

        if(value.mimetype !== this.options.mimetype){
            throw new BadRequestException(`${this.options.mimetype}만 업로드 가능합니다!`);
        }

        const split = value.originalname.split('.');

        let extension = 'mp4';

        if(split.length > 1){
          extension = split[split.length - 1];
        }

        // uuid_Date.mp4 형식으로 저장하는 것
        const filename = `${v4()}_${Date.now()}.${extension}`;
        const newPath = join(value.destination, filename);

        await rename(value.path, newPath); // value.path는 파일의 원래 위치 가져오는 것. newPath는 파일 이동할 위치 

        return {
            ...value,
            filename, // 새로운 파일 이름으로 덮어씌움
            path: newPath, // 새로운 경로로 덮어씌움
        }

    }
}