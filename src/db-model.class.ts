import { DBTable, DBTableBasicColumns, DBTableType } from "./db-table.class";
import { DBSTable } from "./db-s-table.class";

export type ExtendTable<
    Origin extends Record<string, any>,
    Extend extends Record<string, any>,
> = Omit<Origin, keyof Extend> & Extend;

export type DBModelBasicTables = Record<
    string, 
    DBTable<DBTableBasicColumns> | DBSTable<any, boolean>
>;

export type TablesType<Tables extends DBModelBasicTables> = {
    [K in keyof Tables]: Array<{ 
        key: 
            Tables[K] extends DBTable<DBTableBasicColumns>
            ? number
            : Tables[K] extends DBSTable<any, boolean>
            ? Tables[K]['autoKey'] extends true 
            ? number
            : string
            : null;
        value: 
            Tables[K] extends DBTable<DBTableBasicColumns>
            ? DBTableType<Tables[K]>
            : Tables[K] extends DBSTable<any, boolean>
            ? Tables[K]['type']
            : null
    }>
}

export class DBModel<
    CurrentTables extends DBModelBasicTables,
    PrevModel extends DBModel<DBModelBasicTables, any> | null = null,
> {
    static create<T extends DBModelBasicTables>(
        tables: T, 
        version = 1,
    ) {
        return new DBModel(tables, version, null, null);
    }

    constructor(
        public tables: CurrentTables,
        public version: number,
        public prevModel: PrevModel,
        public migrate: PrevModel extends DBModel<any, any> 
            ? (data: TablesType<PrevModel['tables']>) => TablesType<CurrentTables> 
            : null,
        public isExtend: boolean = false,
    ) {}

    next<NextTables extends DBModelBasicTables>(
        tables: NextTables,
        migrate: (data: TablesType<CurrentTables>) => TablesType<NextTables>,
    ): DBModel<NextTables, DBModel<CurrentTables, PrevModel>> {
        return new DBModel(tables, this.version + 1, this, migrate as any);
    }

    extend<AddTables extends DBModelBasicTables>(
        addTables: AddTables,
        migrate: (data: TablesType<CurrentTables>) => TablesType<ExtendTable<CurrentTables, AddTables>>
    ): DBModel<ExtendTable<CurrentTables, AddTables>, DBModel<CurrentTables, PrevModel>> {
        return new DBModel({
            ...this.tables,
            ...addTables,
        }, this.version + 1, this, migrate as any, true);
    }
}
