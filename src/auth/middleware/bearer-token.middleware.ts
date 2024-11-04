import { BadRequestException, Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { NextFunction, Request, Response } from "express";
import { envVariableKeys } from "src/common/const/env.const";

@Injectable()
// Middleware를 쓰려면 NestMiddleware를 implements 해야함
export class BearerTokenMiddleware implements NestMiddleware{
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ){

    }
    // implements를 하려면 use라는 함수를 불러와서 정의를 해줘야 함
    async use(req: Request, res: Response, next: NextFunction) {
       // Basic $token
       // Bearer $token
       const authHeader = req.headers['authorization'];

       // header가 아예 존재하지 않으면 애초에 bearerToken을 인증할 의도가 없으므로 그냥 return 함
       if(!authHeader){
            next();
            return;
       }
    
       // header가 있으면 validateBearerToken 함수로 가서 token 검증해주기 
       const token = this.validateBearerToken(authHeader);
      
       try{
            // decode는 검증은 안하고 가져오기만 함. 
            const decodedPayload = this.jwtService.decode(token);

            // token이 refresh 또는 access가 아니면 에러 던짐
            if(decodedPayload.type !== 'refresh' && decodedPayload.type !== 'access'){
                throw new UnauthorizedException('잘못된 토큰입니다!');
            }

            // 위에서 검증했기 때문에 여기서부터 토큰은 refresh 또는 access만 나오게 됨. 
            const secretKey = decodedPayload.type === 'refresh' ? 
                envVariableKeys.refreshTokenSecret : 
                envVariableKeys.accessTokenSecret;

           // token 검증
           // jwtService.decode를 쓰면 토큰 만료나 비밀번호 검증은 안하고 payload만 가져오는 것임
           // jwtService.verifyAsync를 쓰면 payload를 가져오는 동시에 검증까지 해주는 기능임 
           const payload = await this.jwtService.verifyAsync(token, {
               secret: this.configService.get<string>(
                    secretKey,
                ),
           });
           
           // user Request에 payload를 적용 
           // 이렇게 middleware를 적용하면 어디에서든 req.user = payload를 가져올 수 있음. 
           req.user = payload;
           next();
       }catch(e){
           throw new UnauthorizedException('토큰이 만료됐습니다!')
       }
    }

    // 토큰 검증 
    validateBearerToken(rawToken: string){
        const basicSplit = rawToken.split(' ');

        // 길이 확인. basic token 정상적으로 들어왔다면 ' ' 기준으로 스플릿 했을 때 
        // ['Basic', '$token'] 이렇게 길이가 2개로 나와야 함. 그래서 길이가 2인지 확인해 줄 것
        if(basicSplit.length !== 2){
            throw new BadRequestException('토큰 포멧이 잘못됐습니다!')
        }
 
        const [bearer, token] = basicSplit;
        
        // bearer 토큰이 아니면 에러 발생함. 
        if(bearer.toLowerCase() !== 'bearer') {
            throw new BadRequestException('토큰 포멧이 잘못됐습니다!');
        }

        return token;
        
    }
    
}