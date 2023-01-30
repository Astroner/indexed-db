import { DBModel, DBModelBasicTables } from "../db-model.class";
import { TableKey } from "./table-key";
import { TableType } from "./table-type";

export type TableItem<
    Model extends DBModel<DBModelBasicTables, any>, 
    K extends keyof Model['tables']
> = { key: TableKey<Model, K>, value: TableType<Model, K> };