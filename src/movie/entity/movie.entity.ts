import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { BaseTable } from "./base.entity";
import { MovieDetail } from "./movie-detail.entity";

// ManyToOne -> Director (감독은 여러개의 영화를 만들 수 있음)
// OneToOne -> MovieDetail (영화는 하나의 상세 내용을 가질 수 있음)
// ManyToMany -> Genre (영화는 여러개의 장르를 가질 수 있고 장르는 여러개의 영화에 속할 수 있음)

@Entity()  // entity 파일에서 테이블을 생성하는 역할을함. Entity()를 꼭 등록해줘야 테이블이 생김. 
export class Movie extends BaseTable {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    genre: string; 

    @OneToOne(
        () => MovieDetail,
    )
    @JoinColumn()
    detail: MovieDetail;

} 