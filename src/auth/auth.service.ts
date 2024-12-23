import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role, User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { envVariableKeys } from 'src/common/const/env.const'; 
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';


@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache,
    ){}

    // 토큰 요청 bock 하는 기능
    async tokenBlock(token: string){
        const payload = this.jwtService.decode(token); // 아래 만료기간동안 토큰 정보 들고 있으면서 이 토큰으로 요청하면 어떤 요청이 들어와도 다 block 해버림

        // payload(['exp]) -> epoch time seconds. 이걸 사용해서 지금부터 만료기간까지 몇 초가 남았는지를 계산할 수 있음
        const expiryDate = +new Date(payload['exp'] * 1000); // 초 단위로 되어 있는데 밀리세컨트로 제공하기 위해 * 1000 해줌
        const now = +Date.now(); // 현재, 타입스크립트는 이게 숫자로 변환된다는 것을 유추를 못하지 때문에 +를 앞에 붙여줌 

        const differenceInSeconds = (expiryDate - now)  / 1000; // 초당 차이를 계산. 밀리세컨드 단위로 계산했기 때문에 1000 나눠 줘야 초로 계산 할 수 있음 

        await this.cacheManager.set(`BLOCK_TOKEN_${token}`, payload, // set(키, 값, ttl)
              Math.max((differenceInSeconds) * 1000, 1) // ttl은 밀리세컨이기 때문에 다시 * 1000 해서 바꿔줘야 함. 최소 1m/s이 되도록 만들어줌
        ); // 이 expireyDate를 섬세하게 잘 적용해 주는 것이 매우 중요함. 0이 되거나 할 가능성을 주면 제대로 검증 등이 안될 수 있음 

        return true;
    }

    // basic token을 받으면 rawToken -> "Basic $token"모양으로 생김
    // toekn 값을 추출하면 base64로 인코딩 되어있으니 디코딩해서 emial:password 값을 구해야 함
    // 이걸 다른 곳에서도 쓸 수 있으니 parseBasicToken 이라는 함수로 만들기
    parseBasicToken(rawToken: string){
        // 1) 토큰을 ' '(띄어쓰기) 기준으로 스플릿 한 후 토큰 값만 추출하기
        const basicSplit = rawToken.split(' ');

        // 길이 확인. basic token 정상적으로 들어왔다면 ' ' 기준으로 스플릿 했을 때 
        // ['Basic', '$token'] 이렇게 길이가 2개로 나와야 함. 그래서 길이가 2인지 확인해 줄 것
        if(basicSplit.length !== 2){
            throw new BadRequestException('토큰 포멧이 잘못됐습니다!')
        }

        const [basic, token] = basicSplit;

        if(basic.toLowerCase() !== 'basic') {
            throw new BadRequestException('토큰 포멧이 잘못됐습니다!');
        }

        // 2) 추출한 토큰을 base64 디코딩해서 이메일과 비밀번호로 나누기
        // 디코딩 하는 방법은 그냥 아래 방식으로 외우면 됨 
        const decoded = Buffer.from(token, 'base64').toString('utf-8'); // toekn값을 base64로부터 utf-8로 변경한다는 뜻

        // 변환이 다 되고 나면 "email:password" 이 상태로 변환이 됨.
        // 이번엔 : 기준으로 또 spilt 해서 위의 내용 반복해주면 됨
        const tokenSplit = decoded.split(':');

        // 정상적으로 split 된다면 [email, password] 이 형식으로 나와야 함
        if(tokenSplit.length !== 2) {
            throw new BadRequestException('토큰 포멧이 잘못됐습니다!')
        }

        const [email, password] = tokenSplit;

        return {
            email, 
            password,
        }
    }

    
    // Bearer Token 검증기능(refresh token 검증 용도)
    async parseBearerToken(rawToken: string, isRefreshToken: boolean){
        const basicSplit = rawToken.split(' ');

        // 길이 확인. basic token 정상적으로 들어왔다면 ' ' 기준으로 스플릿 했을 때 
        // ['Basic', '$token'] 이렇게 길이가 2개로 나와야 함. 그래서 길이가 2인지 확인해 줄 것
        if(basicSplit.length !== 2){
            throw new BadRequestException('토큰 포멧이 잘못됐습니다!')
        }

        const [bearer, token] = basicSplit;


        if(bearer.toLowerCase() !== 'bearer') {
            throw new BadRequestException('토큰 포멧이 잘못됐습니다!');
        }

        try{
            // token 검증
            // jwtService.decode를 쓰면 토큰 만료나 비밀번호 검증은 안하고 payload만 가져오는 것임
            // jwtService.verifyAsync를 쓰면 payload를 가져오는 동시에 검증까지 해주는 기능임 
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get<string>(
                    isRefreshToken ? envVariableKeys.refreshTokenSecret : envVariableKeys.accessTokenSecret,
                ),
            });

            if(isRefreshToken){
                if(payload.type !== 'refresh'){
                    throw new BadRequestException('refresh 토큰을 입력해주세요!')
                }
            }else{
                if(payload.type !== 'access'){
                    throw new BadRequestException('access 토큰을 입력해주세요!')
                }
            }
    
            return payload;

        }catch(e){
            throw new UnauthorizedException('토큰이 만료됐습니다!')
        }
    }


    // 회원 가입 기능(등록 기능)
    // rawToken -> "Basic $token"모양으로 생김. 
    async register(rawToken: string){
        const {email, password} = this.parseBasicToken(rawToken);

        // 이미 가입한 사용자인지 체크
        const user = await this.userRepository.findOne({
            where:{
                email,
            },
        });

        if(user){
            throw new BadRequestException('이미 가입한 이메일 입니다!');
        }

        // password는 직접 저장해서는 안됨. bcrypt사용해 줘서 보안 설정 해줄 것(bcrypt는 따로 설치해줘야함)
        // hash(hash하고 싶은 비밀번호, salt or rounds) 여기선 Rounds 넣어 줄 것.
        // rounds는 숫자가 올라갈 수록 bcrypt가 hashing 하는 속도가 더 오래 걸리게 됨. roudns를 넣어주면 salt는 자동으로 생성 됨
        // roudns는 따로 .env 파일에 넣어 줌.  
        const hash = await bcrypt.hash(password, this.configService.get<number>(envVariableKeys.hashRounds)) 
        
        // 이렇게 하면 비밀번호 원본은 날라가게 되고 hash한 값만 저장됨 
        await this.userRepository.save({
            email,
            password:hash,
        });

        return this.userRepository.findOne({
            where: {
                email,
            },
        });
    }

    // 로그인 정보 확인 함수(인증 기능)
    async authenticate(email: string, password: string){
        // 가입된 user인지 확인하는 용도
        const user = await this.userRepository.findOne({
            where:{
                email,
            },
        });

        if(!user){
            throw new BadRequestException('잘못된 로그인 정보입니다!');
        }

        // 정확한 비빌번호가 입력되었는지 비교하는 용도
        const passOk = await bcrypt.compare(password, user.password); // password는 암호화가 안된 상태고 user.password는 암호화가 된 상태

        if(!passOk){
            throw new BadRequestException('잘못된 로그인 정보입니다!');
        }

        return user;
    }


    // access token, refresh token 발급 기능
    async issueToken(user: {id:number, role: Role}, isRefreshToken: boolean){
        const refreshTokenSecret = this.configService.get<string>(envVariableKeys.refreshTokenSecret);
        const accessTokenSecret = this.configService.get<string>(envVariableKeys.accessTokenSecret);

        return this.jwtService.signAsync({
            // payload
            sub: user.id,
            role: user.role,
            type: isRefreshToken ? 'refresh' : 'access',
        }, {
            secret: isRefreshToken ? refreshTokenSecret : accessTokenSecret,
            expiresIn: isRefreshToken ? '24h' : 300,
        })
    }


    // login 기능
    async login(rawToken: string){
        const {email, password} = this.parseBasicToken(rawToken);

        const user = await this.authenticate(email, password);
        
        return {
            refreshToken: await this.issueToken(user, true),
            accessToken: await this.issueToken(user, false),
        }
    }
}
