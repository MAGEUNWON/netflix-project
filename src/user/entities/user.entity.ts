import { Exclude } from "class-transformer";
import { BaseTable } from "src/common/entity/base-entity";
import { MovieUserLike } from "src/movie/entity/movie-user-like.entity";
import { Movie } from "src/movie/entity/movie.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

export enum Role{
    admin,
    paidUser,
    user,
}

@Entity()
export class User extends BaseTable{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        unique: true,
    })
    email: string;

    @Column()
    @Exclude({
        toPlainOnly: true, // 응답으로 보낼때만 보이지 않게 한다는 뜻
    })
    password: string;

    @Column({
        enum: Role,
        default: Role.user,
    })
    role: Role;

    // 영화와 유저의(생성한 사람)의 관계
    @OneToMany(
        () => Movie,
        (movie) => movie.creator,
    )
    createdMovies: Movie[];

    // 유저와 좋아요의 관계
    @OneToMany(
        () => MovieUserLike,
        (mul) => mul.user,
    )
    likedMovies: MovieUserLike[];
}