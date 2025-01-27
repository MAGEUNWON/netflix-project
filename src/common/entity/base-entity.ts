import { ApiHideProperty } from "@nestjs/swagger";
import { Exclude } from "class-transformer";
import { CreateDateColumn, UpdateDateColumn, VersionColumn } from "typeorm";

export class BaseTable{  // Movie가 아니어도 어디서든 쓰일 것 같은 컬럼들을 묶어줌
    @CreateDateColumn()
    @Exclude() // serialization은 서버에서 프론트에 응답을 주기 전에 데이터를 변화하는 과정. 데이터 가져올 때 프론트에서 불필요한 값들이 있는데 이걸 Excluse()를 통해 숨겨줄 수 있음.  
    @ApiHideProperty() // swagger에서 해당 컬럼 안보이게 설정해 줄 수 있음
    createdAt: Date;

    @UpdateDateColumn()
    @Exclude() // 이렇게 Exclude 해주면 프론트에서는 보이지 않고 백엔드에서만 사용하게 됨. 
    @ApiHideProperty()
    updatedAt: Date;

    @VersionColumn()
    @Exclude()
    @ApiHideProperty()
    version: number;
}
