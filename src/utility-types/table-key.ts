import { DBModel, DBModelBasicTables } from "../db-model.class";
import { DBSTable } from "../db-s-table.class";
import { DBTable, DBTableBasicColumns, DBTableType } from "../db-table.class";

export type TableKey<
    Model extends DBModel<DBModelBasicTables, any>, 
    K extends keyof Model['tables']
> = Model['tables'][K] extends DBTable<DBTableBasicColumns>
    ? number
    : Model['tables'][K] extends DBSTable<any, boolean>
    ? Model['tables'][K]['autoKey'] extends true
    ? number
    : string
    : null