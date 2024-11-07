import { Controller, Request, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, ClassSerializerInterceptor, ParseIntPipe, BadRequestException, NotAcceptableException, ParseFloatPipe, ParseBoolPipe, ParseArrayPipe, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieTitleValidationPipe } from './pipe/movie-title-validation.pipe';
import { AuthGuard } from 'src/auth/guard/auth.guard';

@Controller('movie')
@UseInterceptors(ClassSerializerInterceptor) // class transfomer를 MovieController에 적용하겠다는 것.
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  getMovies(
    @Query('title', MovieTitleValidationPipe) title?: string,
  ){
    // title 쿼리의 타입이 string 타입인지?
    return this.movieService.findAll(title);
  }

  @Get(':id')
  getMovie(@Param('id', ParseIntPipe) id: number, // ParseIntPipe 기본 내장 파이프임. 들어 오는 값이 숫자가 아니면 에러를 던져줌. 
  ){
    return this.movieService.findOne(id);
  }

  @Post()
  postMovie(
   @Body() body: CreateMovieDto,

  ){
    return this.movieService.create(
      body,
    );
  }

  @Patch(':id')
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
  deleteMovie(
    @Param('id', ParseIntPipe) id:string,
  ){
    return this.movieService.remove(
      +id
    );
  }
}
