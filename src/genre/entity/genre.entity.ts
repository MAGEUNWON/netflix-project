import { BaseTable } from "src/common/entity/base-entity";
import { Movie } from "src/movie/entity/movie.entity";
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Genre extends BaseTable {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        unique: true,
    })
    name: string;

    // 장르와 영화의 관계설정
    @ManyToMany(
        () => Movie,
        movie => movie.genres,
    )
    movies: Movie[]
}
