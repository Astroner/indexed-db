import { DBModel, DBModelBasicTables } from "./db-model.class";
import { DB } from "./db.class";

export class DBObservable<Model extends DBModel<DBModelBasicTables>, K extends keyof Model['tables']> {
    

    constructor(db: DB<Model>, table: K) {
        
    }
}