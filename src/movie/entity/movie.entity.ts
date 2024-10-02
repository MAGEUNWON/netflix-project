import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { BaseTable } from "../../common/entity/base-entity";
import { MovieDetail } from "./movie-detail.entity";
import { Director } from "src/director/entitiy/director.entity";

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

    // 영화와 상세 내용의 관계 설정
    @OneToOne(
        () => MovieDetail,
        movieDetail => movieDetail.id,
        {
            cascade: true, // 이 설정을 true로 하면 Movie를 만들때 MovieDetail 테이블까지 전부 다 만들 수 있게 해주라는 설정(한번에 데이터를 생성할 수 있음)
        }
    )
    @JoinColumn()
    detail: MovieDetail;

    // 영화와 감독의 관계 설정
    @ManyToOne(
        () => Director,
        director => director.id
    )
    director: Director;

} 