import { DBModel, DBModelBasicTables } from "./db-model.class";
import { initDB } from "./helpers/init-db";
import { KeyTablesOnly } from "./utility-types/key-tables-only";
import { TableType } from "./utility-types/table-type";
import { TableKey } from "./utility-types/table-key";
import { promisifyRequest } from "./helpers/promisify-request";
import { TableItem } from "./utility-types/table-item";

export enum DBRequest {
    PUT,
    GET,
    ADD,
    GET_ALL,
    GET_ALL_WITH_KEYS,
    DELETE,
    CLEAR
}

const requestModes = new Map<DBRequest, IDBTransactionMode>([
    [DBRequest.PUT, "readwrite"],
    [DBRequest.GET, "readonly"],
    [DBRequest.ADD, "readwrite"],
    [DBRequest.GET_ALL, "readonly"],
    [DBRequest.GET_ALL_WITH_KEYS, "readonly"],
    [DBRequest.DELETE, "readwrite"],
    [DBRequest.CLEAR, "readwrite"],
])

export class DB<Model extends DBModel<DBModelBasicTables, any>> {
    static drop(name: string) {
        indexedDB.deleteDatabase(name);
    }

    private storage: Promise<IDBDatabase>;

    constructor(
        name: string,
        model: Model,
    ){
        this.storage = initDB(name, model);
    }

    request<K extends keyof KeyTablesOnly<Model>>(
        type: DBRequest.PUT, 
        table: K, 
        key: string, 
        value: KeyTablesOnly<Model>[K]['type']
    ): Promise<void>
    request<K extends keyof Model['tables']>(
        type: DBRequest.GET, 
        table: K, 
        key: TableKey<Model, K>
    ): Promise<TableType<Model, K> | null>
    request<K extends keyof Model['tables']>(
        type: DBRequest.ADD, 
        table: K, 
        key: TableKey<Model, K> extends number ? null : string, 
        value: TableType<Model, K>
    ): Promise<void>
    request<K extends keyof Model['tables']>(
        type: DBRequest.GET_ALL, 
        table: K,
    ): Promise<TableType<Model, K>[]>
    request<K extends keyof Model['tables']>(
        type: DBRequest.GET_ALL_WITH_KEYS, 
        table: K,
    ): Promise<TableItem<Model, K>[]>
    request<K extends keyof Model['tables']>(
        type: DBRequest.DELETE, 
        table: K, 
        key: TableKey<Model, K>
    ): Promise<void>
    request<K extends keyof Model['tables']>(
        type: DBRequest.CLEAR, 
        table: K,
    ): Promise<void>
    async request(type: DBRequest, table: string, arg1?: any, arg2?: any): Promise<any> {
        const storage = await this.storage;

        const transaction = storage.transaction(table, requestModes.get(type));

        const store = transaction.objectStore(table);

        if(type === DBRequest.PUT) await promisifyRequest(store.put(arg2, arg1));
        else if(type === DBRequest.GET) return promisifyRequest(store.get(arg1)) ?? null;
        else if(type === DBRequest.ADD) await promisifyRequest(store.add(arg2, arg1 ?? undefined));
        else if(type === DBRequest.GET_ALL) return  promisifyRequest(store.getAll());
        else if(type === DBRequest.GET_ALL_WITH_KEYS) {
            return new Promise((resolve, reject) => {
                const result: any[] = [];

                const cursorRequest = store.openCursor();
                cursorRequest.onsuccess = () => {
                    const cursor = cursorRequest.result;
                    if(cursor) {
                        result.push({
                            key: cursor.key,
                            value: cursor.value,
                        })
                        cursor.continue();
                    } else {
                        resolve(result)
                    }
                }
                cursorRequest.onerror = reject;
            })
        }
        else if(type === DBRequest.DELETE) await promisifyRequest(store.delete(arg1))
        else if(type === DBRequest.CLEAR) await promisifyRequest(store.clear())
    }
}