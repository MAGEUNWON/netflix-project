import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import { BadRequestException, Inject, Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";
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
        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache
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

        // block token이 존재하면 차단시켜버림 
        const blockedToken = await this.cacheManager.get(`BLOCK_TOKEN_${token}`);

        if(blockedToken){
            throw new UnauthorizedException('차단된 토큰입니다!');
        }
        
        // 만약 한번 검증해서 캐시에 데이터를 저장한 적이 있으면 캐시에서 데이터를 가져와서 그걸 바로 req.user 객체에 붙이고 다음 함수 실행하면 됨. 계속 decoding이나 verify를 하지 않아도 됨
        const tokenKey = `TOKEN_${token}`;
        const cachedPayload = await this.cacheManager.get(tokenKey)
        if(cachedPayload) {
            req.user = cachedPayload;
            return next();
        }
        // decode는 검증은 안하고 가져오기만 함. 
        const decodedPayload = this.jwtService.decode(token);
        // token이 refresh 또는 access가 아니면 에러 던짐
        if(decodedPayload.type !== 'refresh' && decodedPayload.type !== 'access'){
            throw new UnauthorizedException('잘못된 토큰입니다!');
        }
    
        try{
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

           // payload(['exp]) -> epoch time seconds. 이걸 사용해서 지금부터 만료기간까지 몇 초가 남았는지를 계산할 수 있음
           const expiryDate = +new Date(payload['exp'] * 1000); // 초 단위로 되어 있는데 밀리세컨트로 제공하기 위해 * 1000 해줌
           const now = +Date.now(); // 현재, 타입스크립트는 이게 숫자로 변환된다는 것을 유추를 못하지 때문에 +를 앞에 붙여줌 

           const differenceInSeconds = (expiryDate - now)  / 1000; // 초당 차이를 계산. 밀리세컨드 단위로 계산했기 때문에 1000 나눠 줘야 초로 계산 할 수 있음 

           await this.cacheManager.set(tokenKey, payload, // set(키, 값, ttl)
                Math.max((differenceInSeconds - 30) * 1000, 1) // ttl은 밀리세컨이기 때문에 다시 * 1000 해서 바꿔줘야 함. 위에서 계산을 하는 순간부터 저장하는 순간까지의 시간이 걸릴 수 있기 때문에 이 시간을 30초 정도로 예상해서 빼줌. 근데 30을 빼면 0이 나오거나 마이너스가 나오는 경우도 있을 수 있기 때문에 최대값으로 1을 지정해줌. 최소 1m/s이 되도록 만들어줌
           ); // 이 expireyDate를 섬세하게 잘 적용해 주는 것이 매우 중요함. 0이 되거나 할 가능성을 주면 제대로 검증 등이 안될 수 있음 
           
           // user Request에 payload를 적용 
           // 이렇게 middleware를 적용하면 어디에서든 req.user = payload를 가져올 수 있음. 
           req.user = payload;
           next();
        }catch(e){
            if(e.name === 'TokenExpiredError'){
                throw new UnauthorizedException('토큰이 만료됐습니다!')
            }

            next(); // 원래 여기 에러를 던져줬지만 이제 guard를 해줬기 때문에 에러를 guard로 넘김 
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