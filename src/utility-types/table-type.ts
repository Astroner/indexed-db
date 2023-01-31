import { DBModel, DBModelBasicTables } from "../db-model.class";
import { DBSTable } from "../db-s-table.class";
import { DBTable, DBTableBasicColumns } from "../db-table.class";
import { DBTableType } from "./db-table-type";

export type TableType<
    Model extends DBModel<DBModelBasicTables, any>, 
    K extends keyof Model['tables']
> = Model['tables'][K] extends DBTable<DBTableBasicColumns>
    ? DBTableType<Model['tables'][K]>
    : Model['tables'][K] extends DBSTable<any, boolean>
    ? Model['tables'][K]['type']
    : null