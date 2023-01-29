import { DBModel, DBModelBasicTables } from "../db-model.class";
import { DBSTable } from "../db-s-table.class";
import { DBTable, DBTableBasicColumns, DBTableType } from "../db-table.class";
import { TableKey } from "./table-key";
import { TableType } from "./table-type";

export type TableItem<
    Model extends DBModel<DBModelBasicTables, any>, 
    K extends keyof Model['tables']
> = { key: TableKey<Model, K>, value: TableType<Model, K> };