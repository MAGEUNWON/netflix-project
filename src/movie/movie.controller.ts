import { Controller, Request, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, ClassSerializerInterceptor, ParseIntPipe, BadRequestException, NotAcceptableException, ParseFloatPipe, ParseBoolPipe, ParseArrayPipe, ParseUUIDPipe, UseGuards, UploadedFile, UploadedFiles } from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieTitleValidationPipe } from './pipe/movie-title-validation.pipe';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { Role } from 'src/user/entities/user.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CacheInterceptor } from 'src/common/interceptor/cache.interceptor';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { FileFieldsInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { MovieFilePipe } from './pipe/movie-file.pipe';

@Controller('movie')
@UseInterceptors(ClassSerializerInterceptor) // class transfomer를 MovieController에 적용하겠다는 것.
export class MovieController {
  constructor(private readonly movieService: MovieService) {}
  
  @Get()
  @Public() // Public 이면 로그인 안해도 접근 가능 
  // @UseInterceptors(CacheInterceptor)
  getMovies(
    @Query() dto: GetMoviesDto,
  ){
    // title 쿼리의 타입이 string 타입인지?
    return this.movieService.findAll(dto);
  }

  @Get(':id')
  @Public()
  getMovie(@Param('id', ParseIntPipe) id: number, // ParseIntPipe 기본 내장 파이프임. 들어 오는 값이 숫자가 아니면 에러를 던져줌. 
  ){
    return this.movieService.findOne(id);
  }

  @Post()
  @RBAC(Role.admin) // 이건 admin만 접근 가능 하다는 것
  @UseInterceptors(TransactionInterceptor) // queryRunner를 붙이기 위함
  @UseInterceptors(FileInterceptor('movie', {  // post 할 때 파일 업로드를 같이 진행함. 'movie'는 파일 올릴 때 키값 이름임, FileInterceptor는 파일 한개만 업로드할 때 사용하고 FilesInterceptor는 여러개 파일 업로드 할 때 사용
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

  //     // 이런식으로 조건 걸어줘서 받기 싫은 파일은 받지 않아 줄 수 있음. 그럼 movie 폴더에 파일이 저장되지 않음. 
  //     if(file.mimetype !== 'video/mp4'){
  //       return callback(new BadRequestException('MP4 타입만 업로드 가능합니다!'), false)
  //     }

  //     return callback(null, true); // null은 에러가 있으면 에러가 들어갈 부분임. 에러 넣어주면 자동으로 에러 던져줌. false는 파일이 오면 아예 파일을 받지 않는다는 설정임. 파일 받으려면 true로 설정 해줘야 함
  //   }
  // }))
  postMovie(
   @Body() body: CreateMovieDto,
   @Request() req,
  //  @UploadedFiles() files: Express.Multer.File[], // 파일 형식이 express의 multer file 형식이라는 것. 여기도 파일 한개면 UploadedFile을 사용하고 여러개 일땐 UploadedFiles를 사용해야 함. 파일 여러개 일 땐 리스트[]로 받아야 하기 때문에 써줘야 함 
  @UploadedFile() movie: Express.Multer.File,
  
  // files: { // FileFieldsInterceptor 사용할 때는 객체로 묶어서 각각 필드에 설정을 해줘야 함
  //   movie?: Express.Multer.File[],
  // } 
  ) {
    return this.movieService.create(
      body,
      movie.filename,
      req.queryRunner,
    );
  }

  @Patch(':id')
  @RBAC(Role.admin)
  patchMovie(
    @Param('id', ParseIntPipe) id: string,
    @Body() body: UpdateMovieDto
  ){
    return this.movieService.update(
      +id,
      body
    );
  }

  @Delete(':id')
  @RBAC(Role.admin)
  deleteMovie(
    @Param('id', ParseIntPipe) id:string,
  ){
    return this.movieService.remove(
      +id
    );
  }
}
