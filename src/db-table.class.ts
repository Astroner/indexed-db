import { DBColumn } from "./db-column.class";

export type DBTableBasicColumns = Record<string, DBColumn<any, boolean>>;

export class DBTable<Columns extends DBTableBasicColumns> {
    constructor(public columns: Columns) {}
}