import { DBColumn } from "./db-column.class";

export type DBTableBasicColumns = Record<string, DBColumn<any, boolean>>;

export class DBTable<Columns extends DBTableBasicColumns> {
    constructor(public columns: Columns) {}
}

export type DBTableType<T extends DBTable<DBTableBasicColumns>> = {
    [K in keyof T['columns']]: T['columns'][K]['type'];
}