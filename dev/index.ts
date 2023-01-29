import { DB, DBColumn, DBModel, DBSTable, DBTable, DBRequest } from "../src";

const model = DBModel
    .create({
        ss: new DBTable({
            a: new DBColumn<{ a: number }>(),
            b: new DBColumn<string>(),
        }),
        aa: new DBSTable<string>(),
    })

const db = new DB('test', model);