import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { BaseTable } from "../../common/entity/base-entity";
import { MovieDetail } from "./movie-detail.entity";
import { Director } from "src/director/entitiy/director.entity";
import { Genre } from "src/genre/entity/genre.entity";

// ManyToOne -> Director (감독은 여러개의 영화를 만들 수 있음)
// OneToOne -> MovieDetail (영화는 하나의 상세 내용을 가질 수 있음)
// ManyToMany -> Genre (영화는 여러개의 장르를 가질 수 있고 장르는 여러개의 영화에 속할 수 있음)

@Entity()  // entity 파일에서 테이블을 생성하는 역할을함. Entity()를 꼭 등록해줘야 테이블이 생김. 
export class Movie extends BaseTable {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        unique: true, // unique를 ture로 해주면 한 테이블에 같은 값이 두개가 존재할 수 없도록 제약을 줄 수 있음. 
    })
    title: string;

    // 영화와 장르의 관계 설정
    @ManyToMany(
        () => Genre,
        genre => genre.movies,
    )
    @JoinTable() // 다대다 관계는 genre, movie 둘 중 아무곳에나 설정 해줘야 함. 영화에 해줌
    genres: Genre[]

    @Column({
        default : 0,
    })
    likeCount: number;
 

    // 영화와 상세 내용의 관계 설정
    @OneToOne(
        () => MovieDetail,
        movieDetail => movieDetail.id,
        {
            cascade: true, // 이 설정을 true로 하면 Movie를 만들때 MovieDetail 테이블까지 전부 다 만들 수 있게 해주라는 설정(한번에 데이터를 생성할 수 있음)
            nullable: false, // 이 설정을 false로 해주면 null이 절대 될 수 없도록 해줌. 이렇게 해줘야 무결성을 지키면서 할 수 있음
        }
    )
    @JoinColumn()
    detail: MovieDetail;

    // movie file 경로 컬럼 
    @Column()
    movieFilePath: string; 

    // 영화와 감독의 관계 설정
    @ManyToOne(
        () => Director,
        director => director.id,
        {
            cascade: true,
            nullable: false,
        }
    )
    director: Director;

 
} 