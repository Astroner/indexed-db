import { DBTable, DBTableBasicColumns } from "../db-table.class";

export type DBTableType<T extends DBTable<DBTableBasicColumns>> = {
    [K in keyof T['columns']]: T['columns'][K]['type'];
}