import { DBColumn } from "../db-column.class";
import { DBTable, DBTableBasicColumns } from "../db-table.class";
import { KeysMatching } from "./keys-matching";

export type TableIndexes<Table extends DBTable<DBTableBasicColumns>> = KeysMatching<Table['columns'], DBColumn<any, true>>;