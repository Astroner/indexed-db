import { DBModel, DBModelBasicTables } from "./db-model.class";
import { initDB } from "./helpers/init-db";
import { KeyTablesOnly } from "./utility-types/key-tables-only";
import { TableType } from "./utility-types/table-type";
import { TableKey } from "./utility-types/table-key";
import { promisifyRequest } from "./helpers/promisify-request";
import { TableItem } from "./utility-types/table-item";
import { IndexTablesOnly } from "./utility-types/index-tables-only";
import { TableIndexes } from "./utility-types/table-indexes";

export class DB<Model extends DBModel<DBModelBasicTables, any>> {
    static drop(name: string) {
        indexedDB.deleteDatabase(name);
    }
    
    private storage: Promise<IDBDatabase>;

    private subs = new Array<(table: keyof Model['tables']) => void>();

    constructor(public name: string, public model: Model){
        this.storage = initDB(name, model);
    }

    async disconnect(){
        this.subs = [];
        const storage = await this.storage;

        storage.close()

        return new Promise<void>(resolve => {
            storage.onclose = () => resolve();
        })
    }

    /**
     * 
     * @param table Table name
     * @param key Item key
     * @param value Item value
     * 
     * @description Works only with simple tables. Tries to add an item to the table with specific key. 
     * If Table already has item with this key, it will be replaced
     */
    async put<K extends keyof KeyTablesOnly<Model>>(table: K, key: string, value: KeyTablesOnly<Model>[K]['type']){
        const store = await this.getObjectStore(table as string, "readwrite");

        await promisifyRequest(store.put(value, key));

        this.sendUpdate(table);
    }

    /**
     * 
     * @param table Table name
     * @param key Item key
     * @returns Item from table with specified key
     */
    async get<K extends keyof Model['tables']>(table: K, key: TableKey<Model, K>): Promise<TableType<Model, K> | null> {
        const store = await this.getObjectStore(table as string, "readonly");

        return key && (await promisifyRequest(store.get(key)) ?? null);
    }

    /**
     * 
     * @param table Table name
     * @param key Item key
     * @returns true if item with such key exists else returns false
     */
    async has<K extends keyof Model['tables']>(table: K, key: TableKey<Model, K>): Promise<boolean> {
        return !!(await this.get(table, key))
    }

    /**
     * 
     * @param table Table name
     * @param key Item key
     * @param value Item value
     * 
     * @description Tries to add an item to the table with specific key. 
     * If Table already has item with this key, it will throw an error.
     */
    async add<K extends keyof Model['tables']>(
        table: K, 
        key: TableKey<Model, K> extends number ? null : string, 
        value: TableType<Model, K>
    ): Promise<void> {
        const store = await this.getObjectStore(table as string, "readwrite");

        await promisifyRequest(store.add(value, key ?? undefined));

        this.sendUpdate(table);
    }

    /**
     * 
     * @param table Table name
     * @returns count of items in the table
     */
    async count<K extends keyof Model['tables']>(table: K): Promise<number> {
        const store = await this.getObjectStore(table as string, "readonly");

        return promisifyRequest(store.count());
    }

    /**
     * 
     * @param table Table name
     * @returns All items from the table
     */
    async getAll<K extends keyof Model['tables']>(table: K): Promise<TableType<Model, K>[]> {
        const store = await this.getObjectStore(table as string, "readonly");

        return promisifyRequest(store.getAll());
    }

    /**
     * 
     * @param table Table name
     * @returns All items from the table in key-value format
     */
    async getAllWithKeys<K extends keyof Model['tables']>(table: K): Promise<TableItem<Model, K>[]> {
        const store = await this.getObjectStore(table as string, "readonly");

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
    
    /**
     * 
     * @param table Table name
     * @param key Table item key
     * @param next new value
     * 
     * @description Updates table item by key. Will throw Error("CANNOT_UPDATE") if item with provided key doesn't exists
     */
    async update<K extends keyof Model['tables']>(table: K, key: TableKey<Model, K>, next: TableType<Model, K>){
        const store = await this.getObjectStore(table as string, "readwrite");

        const item = !!(await promisifyRequest(store.get(key as string)));

        if(!item) throw new Error("CANNOT_UPDATE");

        await promisifyRequest(store.put(next, key as any));
        
        this.sendUpdate(table);
    }


    /**
     * 
     * @param table Table name
     * @param key Item key
     */
    async delete<K extends keyof Model['tables']>(table: K, key: TableKey<Model, K>) {
        const store = await this.getObjectStore(table as string, "readwrite");

        await promisifyRequest(store.delete(key as string));

        this.sendUpdate(table);
    }

    /**
     * 
     * @param table Table name
     * @description Removes everything from the table
     */
    async clear<K extends keyof Model['tables']>(table: K) {
        const store = await this.getObjectStore(table as string, "readwrite");

        await promisifyRequest(store.clear());
        
        this.sendUpdate(table);
    }

    /**
     * 
     * @param table Table name
     * @param index Table index
     * @param key Table index key
     * @returns Single item from the table with specified table index key
     */
    async getBy<
        K extends keyof IndexTablesOnly<Model>, 
        I extends TableIndexes<IndexTablesOnly<Model>[K]>
    >(
        table: K, 
        index: I, 
        key: IndexTablesOnly<Model>[K]['columns'][I]['type']
    ): Promise<TableItem<Model, K> | null> {
        const store = await this.getObjectStore(table as string, "readonly");
        const indexStore = store.index(index as string);
        
        return new Promise((resolve, reject) => {
            const cursorReq = indexStore.openCursor(key);
            cursorReq.onsuccess = () => {
                const cursor = cursorReq.result;
                if(cursor) {
                    resolve({ key: cursor.primaryKey as any, value: cursor.value })
                } else {
                    resolve(null);
                }
            }
            cursorReq.onerror = reject;
        })
    }

    /**
     * 
     * @param table Table name
     * @param index Table index
     * @param key Table index key
     * @returns All items from the table with specified table index key
     */
    async getAllBy<
        K extends keyof IndexTablesOnly<Model>, 
        I extends TableIndexes<IndexTablesOnly<Model>[K]>
    >(
        table: K, 
        index: I, 
        key: IndexTablesOnly<Model>[K]['columns'][I]['type']
    ): Promise<TableItem<Model, K>[]> {
        const store = await this.getObjectStore(table as string, "readonly");
        const indexStore = store.index(index as string);
        
        return new Promise((resolve, reject) => {
            const result: TableItem<Model, K>[] = [];

            const cursorReq = indexStore.openCursor(key);
            cursorReq.onsuccess = () => {
                const cursor = cursorReq.result;
                if(cursor) {
                    result.push({ key: cursor.primaryKey as any, value: cursor.value });
                    cursor.continue();
                } else {
                    resolve(result);
                }
            }
            cursorReq.onerror = reject;
        })
    }

    subscribe(sub: (table: keyof Model['tables']) => void) {
        this.subs.push(sub);

        return {
            unsubscribe: () => {
                this.subs.splice(this.subs.indexOf(sub), 1);
            }
        }
    }

    private sendUpdate(table: keyof Model['tables']) {
        for(const sub of this.subs) {
            sub(table);
        }
    }
    
    private async getObjectStore(table: string, mode: "readonly" | "readwrite") {
        const storage = await this.storage;

        const transaction = storage.transaction(table, mode);

        const store = transaction.objectStore(table);

        return store;
    }
}