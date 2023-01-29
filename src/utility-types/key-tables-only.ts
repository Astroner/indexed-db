import { DBModel, DBModelBasicTables } from "../db-model.class";
import { DBSTable } from "../db-s-table.class";
import { KeysMatching } from "./keys-matching";

export type KeyTablesOnly<
    Model extends DBModel<DBModelBasicTables, any>, 
> = {
    [K in KeysMatching<Model['tables'], DBSTable<any, false>>]: 
        Model['tables'][K] extends DBSTable<any, false> 
        ? Model['tables'][K]
        : never
}