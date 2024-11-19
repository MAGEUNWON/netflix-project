import { Injectable } from "@nestjs/common";
import { PagePaginationDto } from "./dto/page-pagination.dto";
import { SelectQueryBuilder } from "typeorm";
import { CursorPaginationDto } from "./dto/cursor-pagination.dto";

@Injectable()
export class CommonService{
    constructor(){}

    applyPagePaginationParamsToQb<T>(qb: SelectQueryBuilder<T>, dto: PagePaginationDto){
        const {page, take} = dto;
        
        const skip = (page -1) * take;

        qb.take(take);
        qb.skip(skip);
    }

    applyCursorPaginationParamsToQb<T>(qb: SelectQueryBuilder<T>, dto:CursorPaginationDto){
        const {order, take, id} = dto;

        if(id) {
            const direction = order === 'ASC' ? '>' : '<'; // order가 ASC면 movie.id > :id 이고 desc면 movie.id < :id 이라는 것

            // 예를 들어 order -> ASC이면 movie.id > :id
            // 그럼 이제 :id에 dto에 입력받은 id를 넣어주면 됨
            qb.where(`${qb.alias}.id ${direction} :id`, {id});
        }

        // 입력을 아무것도 안하면 order만 작동함
        qb.orderBy(`${qb.alias}.id`, order); // id를 ASC 또는 DESC로 orderBy 하겠다는 것. alias는 내가 선택한 테이블을 뭐라고 명칭했는지에 대한 것. movie 테이블을 선택하면 movie라고 나옴

        qb.take(take);
    }
}