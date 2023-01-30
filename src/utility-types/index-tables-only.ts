import { DBModel, DBModelBasicTables } from "../db-model.class";
import { DBTable, DBTableBasicColumns } from "../db-table.class";
import { KeysMatching } from "./keys-matching";

export type IndexTablesOnly<
    Model extends DBModel<DBModelBasicTables, any>, 
> = {
    [K in KeysMatching<Model['tables'], DBTable<DBTableBasicColumns>>]: 
        Model['tables'][K] extends DBTable<DBTableBasicColumns>
        ? Model['tables'][K]
        : never
}