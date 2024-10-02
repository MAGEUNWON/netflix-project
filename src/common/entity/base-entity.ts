import { CreateDateColumn, UpdateDateColumn, VersionColumn } from "typeorm";

export class BaseTable{  // Movie가 아니어도 어디서든 쓰일 것 같은 컬럼들을 묶어줌
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @VersionColumn()
    version: number;
}
