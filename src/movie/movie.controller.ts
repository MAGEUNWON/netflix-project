import { Controller, Request, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, ClassSerializerInterceptor, ParseIntPipe, BadRequestException, NotAcceptableException, ParseFloatPipe, ParseBoolPipe, ParseArrayPipe, ParseUUIDPipe, UseGuards, UploadedFile, UploadedFiles, Version, VERSION_NEUTRAL } from '@nestjs/common';
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
import { CacheKey, CacheTTL, CacheInterceptor as CI} from '@nestjs/cache-manager';
import { Throttle } from 'src/auth/decorator/throttle.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

// controlelr에 버저닝 적용 
// @Controller({
//   path: 'movie',
//   version: '2'
// })
// export class MovieControllerV2{
//   @Get()
//   getMovies(){
//     return [];
//   }
// }

// @Controller({
  // path: 'movie',
  // version: '1', // header type은 header 안에 version : 1 이렇게 키값과 버전값을 넣어주면 적용됨. 엔드포인트에(path) 넣지 않음 
  // version: VERSION_NEUTRAL, // 버전 default 값 처리할 때는 VERSION_NEUTRAL 넣어주면 됨, 이걸 쓸 때는 movie.module의 controler에서 순서를 잘 적용해줘야함 
// })
@Controller('movie')
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor) // class transfomer를 MovieController에 적용하겠다는 것.
export class MovieController {
  constructor(private readonly movieService: MovieService) {}
  
  @Get()
  @Public() // Public 이면 로그인 안해도 접근 가능 
  // @UseInterceptors(CacheInterceptor)
  @Throttle({
    count: 5,
    unit: 'minute',
  })
  // @Version('5') // 메서드에 버전 적용한 것. 메서드에 하면 이게 우선으로 적용됨, 무조건 /v5로만 사용가능. 여기도 배열로 여러 버전 적용 가능함 
  getMovies(
    @Query() dto: GetMoviesDto,
    @UserId() userId?: number,
  ){
    // title 쿼리의 타입이 string 타입인지?
    return this.movieService.findAll(dto, userId);
  }

  // /movie/recent -> 최신 영화만 가져오게 함
  // 전체 다 가져오는 아래 Get(':id')보다 아래 밑에 있으면 저기서 걸리기 때문에 위에다 써줘야 함
  @Get('recent')
  @UseInterceptors(CI) // UseInterceptors안에 @nestjs/cache-manager에 있는 CacheInterceptor를 넣어주면 자동으로 이 엔드포인트의 결과를 캐싱함. 이건 근데 url을 기반으로 캐싱함. 그래서 같은 엔드포인트에서 쿼리파라미터를 넣으면 각각 다른 키로 캐싱이 됨  
  @CacheKey('getMoviesRecent') // 캐시 키값을 바꿔주는 것. 이렇게 하면 캐시키가 일괄적으로 적용되기 때문에 쿼리파라미터가 변경되도 같은 저 키값으로 캐싱됨 
  @CacheTTL(1000) // 여기서 ttl 적용해주면 module에 적용한거 무시하고 이걸로 적용됨 
  getMoviesRecent(){
    return this.movieService.findRecent();
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

  /**
   * 좋아요 기능 구성
   * [Like] [Dislike]
   * 
   * 아무것도 누르지 않은 상태
   * Like & Dislike 모두 버튼 꺼져있음
   * 
   * Like 버튼 누르면 
   * Like 버튼 불 켜짐
   * 
   * Like 버튼 다시 누르면 
   * Like 버튼 불 꺼짐
   * 
   * Dislike 버튼 누르면
   * Dislike 버튼 불 켜짐
   * 
   * Dislike 버튼 다시 누르면
   * Dislike 불 꺼짐
   * 
   * Like 버튼 누른 상태(Like 불 켜진 상태에서)
   * Dislike 버튼 누르면 Like 버튼 불 꺼지고 Dislike 버튼 불 켜짐
   */
  @Post(':id/like')
  createMovieLike(
    @Param('id', ParseIntPipe) movieId: number,
    @UserId() userId: number,
  ) {
    return this.movieService.toggleMovieLike(movieId, userId, true);
  }

  @Post(':id/dislike')
  createMovieDisLike(
    @Param('id', ParseIntPipe) movieId: number,
    @UserId() userId: number,
  ){
    return this.movieService.toggleMovieLike(movieId, userId, false);

  }

}


