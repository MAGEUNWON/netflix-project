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
import { UserId } from 'src/user/decorator/user-id.decorator';
import { QueryRunner } from 'src/common/decorator/query-runner.decorator';
import { QueryRunner as QR} from 'typeorm';

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
  postMovie(
   @Body() body: CreateMovieDto,
   @QueryRunner() queryRunner: QR, // @Request() req, 사용하는 대신 이렇게 paramDecorator를 만들어서 사용해 주는 것이 더 정확하고 관리하기 좋음 
   @UserId() userId: number,
  ) {
    return this.movieService.create(
      body,
      userId,
      queryRunner,
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
