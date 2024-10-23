import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
    ){}

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

        const [_, token] = basicSplit;

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

    // 인증 기능
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
        const hash = await bcrypt.hash(password, this.configService.get<number>('HASH_ROUNDS')) 
        
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

    async authenticate(email: string, password: string){
        const user = await this.userRepository.findOne({
            where:{
                email,
            },
        });

        if(!user){
            throw new BadRequestException('잘못된 로그인 정보입니다!');
        }

        // 정확한 비빌번호가 만들어졌는지 비교하는 용도
        const passOk = await bcrypt.compare(password, user.password); // password는 암호화가 안된 상태고 user.password는 암호화가 된 상태

        if(!passOk){
            throw new BadRequestException('잘못된 로그인 정보입니다!');
        }

        return user;
    }

    async issueToken(user: User, isRefreshToken: boolean){
        const refreshTokenSecret = this.configService.get<string>('REFRESH_TOKEN_SECRET');
        const accessTokenSecret = this.configService.get<string>('ACCESS_TOKEN_SECRET');

        return this.jwtService.signAsync({
            // payload
            sub: user.id,
            role: user.role,
            type: isRefreshToken ? 'refresh' : 'access',
        }, {
            secret: isRefreshToken? refreshTokenSecret : accessTokenSecret,
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
