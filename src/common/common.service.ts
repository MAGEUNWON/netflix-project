import { BadRequestException, Injectable } from "@nestjs/common";
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

    async applyCursorPaginationParamsToQb<T>(qb: SelectQueryBuilder<T>, dto:CursorPaginationDto){
        let {cursor, take, order} = dto;

        // 다음 페이지에 적합한 쿼리를 반드는 내용 
        if(cursor) { 
            const decodedCursor = Buffer.from(cursor, 'base64').toString('utf-8'); // 먼저 인코딩 되어 있는 것을 다시 디코드 해서 받아줌

            // cursor 구조(밑의 values의 구조)
            /**
             * {
             *  values: {
             *      id: 27
             * },
             * order: ['id_DESC']
             * }
             */
            const cursorObj = JSON.parse(decodedCursor); // stirng 으로 되어 있는 형태이기 때문에 다시 JSON으로 바꿔줌

            // cursor를 받았다면 cursor로 take는 빼고 어떤 값을 받더라도 덮어 씌울 것임. 특히 order를 덮어 씌울 것. 다음 값이 cursor를 가지고 요청하면 되기 때문에 실수가 와도 오염되지 않도록 하기 위함  
            order = cursorObj.order;

            const {values} = cursorObj;

            // where (column1 > column2)
            // or   (column1 = value1 AND column2 < value2)
            // or   (column1 = value1 AND column2  = value2 AND column3 < value3 ) -> 원래는 이 형식인데 이렇게까지 잘 구현하지 않고 밑의 내용으로 해도 충분함

            // { column, column2, column3} > { value1, value2, value3} -> postgresql에서 한번에 묶어서 했던 쿼리의 모양임. 
            
            // 여기는 위 설명에서 > 이 부등호 부분을 만든 것. 
            const columns = Object.keys(values); // columns를 모두 list로 가져옴(id, likeCount 이런 것들 가져옴)
            const comparisonOperator = order.some((o) => o.endsWith('DESC')) ?  '<' : '>'; // endsWith는 이 단어로 끝나는지 체크 하는 것. 여기선 DESC로 끝나는지 체크함. DESC가 존재하면 < (DESC)를 하고 존재하지 않으면 >(ASC)를 함 

            // 여기는 부등호 왼쪽에 있는 부분 구현, { column, column2, column3} 이부분 근데 {movie.column1, movie.column2, movie.column3} 이런식으로 바꿔주고 중간에 , 까지 넣어줘야 하기 때문에 Join에 ,를 넣어서 묶어줌 
            const whereConditons = columns.map(c => `${qb.alias}.${c}`).join(','); 

            // 여기는 부등호 오른쪽에 있는 부분 구현 , { value1, value2, value3}이 부분인데 앞의 : 까지 붙여줌. 마지막에 join에 , 넣어서 묶어줌
            const whereParams = columns.map(c => `:${c}`).join(',');

            qb.where(`(${whereConditons}) ${comparisonOperator} (${whereParams})`, values); // 실제 값은 values를 넣어주면 됨


        }

        // ["likeCount_DESC", "id_DESC"] 이 형태를 split 해주는 것. 
        for(let i = 0; i < order.length; i++){
            const [column, direction] = order[i].split('_'); // 그럼 column에는 likeCount가 들어가고 direction에는 ASC가 들어가게 되는 것 

            if(direction !== 'ASC' && direction !== 'DESC'){
                throw new BadRequestException('Order는 ASC 또는 DESC로 입력해주세요')
            }

            if(i === 0){
                qb.orderBy(`${qb.alias}.${column}`, direction); // move.likeCount, DESC -> 이런 형식임 
            }else{
                qb.addOrderBy(`${qb.alias}.${column}`, direction); // i가 0이 아니면 추가하는 거니까 addOrderBy 써줌
            }
        }
        

        qb.take(take);

        const results = await qb.getMany();

        const nextCursor = this.generateNextCursor(results, order);

        return { qb, nextCursor}; // 여기서 nextCursor를 반환해주면 프론트에서 nextCursor를 받을 수 있음. 
    }

    // 실제로 cursor를 만들어서 보내주는 작업. T 타입은 쿼리를 실행하고 응답받은 실제 데이터 리스트를 여기다 넣어 줄 것. 왜냐하면 내가 보내준 마지막 데이터를 기반으로 프론트에서 원래 커서를 만들어서 보내주지만 이 프로젝트에서는 백에서 커서를 만들어 보내주는 형식이기 때문에 백에서도 마지막 데이터를 가지고 있어야 만들 수 있음. 
    generateNextCursor<T>(results: T[], order: string[]): string | null{
        if(results.length === 0) return null; // 애초에 응답값이 없다면 다음 데이터가 없다는 뜻이므로 커서를 만들 필요가 없음. 

        // cursor 구조(밑의 values의 구조)
        /**
         * {
         *  values: {
         *      id: 27
         * },
         * order: ['id_DESC']
         * }
         */
        const lastItem = results[results.length - 1]; // 모든 값에서 마지막값. 

        const values = {};

        order.forEach((columOrder) => {
            const [column] = columOrder.split('_') // order가 'id_DESC'로 들어가 있기 때문에 split 해서 id만 추출. DESC는 여기서 쓰지 않음 
            values[column] = lastItem[column]; // 여기선 27 값을 말함 즉, 위에꺼랑 합치면 id: 27 이렇게 나옴 
        });

        const cursorObj = {values, order}; // values는 위에서 만든 내용을 넣어준 것. order는 받은것 넣어줌
        const nextCursor = Buffer.from(JSON.stringify(cursorObj)).toString('base64'); // base64로 인코딩 하면 한줄의 string으로 값을 반환할 수 있음. 즉, string으로 만든 것을 base64로 인코딩해서 한줄로 받은 것
        // 인코딩 한 내용을 다시 디코딩 해보면 {"values":{"likeCount":20,"id":35},"order":["likeCount_DESC","id_DESC"]} 이런식으로 들어가게 되는 것 
        return nextCursor;

    }
}




// if(id) {
        //     const direction = order === 'ASC' ? '>' : '<'; // order가 ASC면 movie.id > :id 이고 desc면 movie.id < :id 이라는 것

        //     // 예를 들어 order -> ASC이면 movie.id > :id
        //     // 그럼 이제 :id에 dto에 입력받은 id를 넣어주면 됨
        //     qb.where(`${qb.alias}.id ${direction} :id`, {id});
        // }

        // // 입력을 아무것도 안하면 order만 작동함
        // qb.orderBy(`${qb.alias}.id`, order); // id를 ASC 또는 DESC로 orderBy 하겠다는 것. alias는 내가 선택한 테이블을 뭐라고 명칭했는지에 대한 것. movie 테이블을 선택하면 movie라고 나옴