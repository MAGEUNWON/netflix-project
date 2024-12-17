import { Column, Entity, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { Movie } from "./movie.entity";
import { User } from "src/user/entities/user.entity";

// 여긴 중간 테이블임. MovieUserLike가 중간테이블인데 이게 Many가 되고 movie, user 테이블은 One이 됨
@Entity()
export class MovieUserLike {
    // movieId와 userId 두개를 조합했을 때 식별된 primary 키가 됨. 그래서 절대 중복된 데이터를 넣을 수 없음
    @PrimaryColumn({ // composite primarykey(복합 키) - 두 개 이상의 키를 pk로 지정하는 것
        name: 'movieId',
        type: 'int8',
    })
    @ManyToOne( // 하나의 영화가 여러개의 좋아요와 연결됨. 
        () => Movie,
        (movie) => movie.likedUsers,
    )
    movie: Movie;

    @PrimaryColumn({ // composite primarykey(복합 키)
        name: 'userId',
        type: 'int8',
    })
    @ManyToOne( // 하나의 사용자가 여러개의 좋아요와 연결됨 
        () => User,
        (user) => user.likedMovies,
    )
    user: User;

    @Column()
    isLike: boolean;
}

// 이렇게 되면 결국 여러개의 영화가 여러개의 사용자와 서로 상호관계를 가질 수 있는 관계가 될 수 있음. 