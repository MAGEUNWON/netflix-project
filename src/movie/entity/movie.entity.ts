import { Exclude, Expose, Transform } from "class-transformer";

// @Exclude() // 직렬화하는 과정에서 값을 노출시키지 않는것. 이렇게 class 위에 두면 전체가 기본으로 다 노출 안됨. 보안 등 민감한 부분에 쓸 수 있음. 
export class Movie {
    // @Expose() // 전체 다 Exclude 했다가 그 중에 보여도 되는 것들은 Expose 하면 외부에 노출 됨
    id: number;
    // @Expose()
    title: string;
    // @Transform( // custom transformer 
    //     ({value}) => value.toString().toUpperCase(),
    // )
    genre: string;
}