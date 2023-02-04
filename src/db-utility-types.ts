import { DBModel } from "./db-model.class";
import { DBObservable } from "./db-observable.class";
import { DB } from "./db.class";
import { TableType } from "./utility-types/table-type";

export type DBTablesName<DBT extends DB<DBModel<any>>> = keyof DBT['model']['tables']

export type DBTablesType<DBT extends DB<DBModel<any>>> = {
    [K in keyof DBT['model']['tables']]: TableType<DBT['model'], K>
}

export type DBObservableType<Observable extends DBObservable<any, any, any>> = Observable extends DBObservable<any, any, infer T> ? T : never;