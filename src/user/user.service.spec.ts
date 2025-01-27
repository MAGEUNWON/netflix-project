import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

const mockUserRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { // module에 직접 typeOrmModule을 넣어주지 않았지만 아래 설정으로 test가 가능해짐
          provide: getRepositoryToken(User), // User 값으로 레포지토리의 레퍼런스를 가져올 수 있음. TypeOrmModule.forFeature에 User를 넣어준것과 같은 역할을 함
          useValue: mockUserRepository, // 여기선 특정 값을 사용하라는 설정인데 위에 만들어둔 mockUserREpository 값을 사용하라는 설정임
        }
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
