import { BaseTable } from "src/common/entity/base-entity";
import { Movie } from "src/movie/entity/movie.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Director extends BaseTable {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    dob: Date;

    @Column()
    nationality: string;

    // 감독과 영화의 관계설정
    @OneToMany(
        () => Movie,
        movie => movie.director,
    )
    movies: Movie[];

}
