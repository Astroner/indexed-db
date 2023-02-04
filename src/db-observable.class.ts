import { DBModel, DBModelBasicTables } from "./db-model.class";
import { DB } from "./db.class";
import { TableType } from "./utility-types/table-type";

export class DBObservable<
    Model extends DBModel<DBModelBasicTables, any>, 
    K extends keyof Model['tables'],
    DataType,
> {

    static create<Model extends DBModel<DBModelBasicTables, any>, K extends keyof Model['tables']>(
        db: DB<Model>, 
        table: K
    ): DBObservable<Model, K, TableType<Model, K>[]>;
    static create<Model extends DBModel<DBModelBasicTables, any>, K extends keyof Model['tables'], DataType>(
        db: DB<Model>, 
        table: K, 
        stateFactory: () => Promise<DataType>
    ): DBObservable<Model, K, DataType>
    static create(db: DB<any>, table: string, stateFactory?: () => Promise<any>) {
        if(stateFactory) return new DBObservable(db, table, stateFactory);
        return new DBObservable(db, table, () => db.getAll(table));
    }

    
    private value: Promise<DataType>

    private subs = new Array<(next: DataType) => void>()

    private sub: ReturnType<DB<Model>['subscribe']>;
    
    /**
     * 
     * @param db Database for observation
     * @param table Observing table
     * @param stateFactory (Optional) creates next state
     */
    constructor(
        db: DB<Model>, 
        table: K,
        private stateFactory: () => Promise<DataType>
    ) {
        this.value = this.stateFactory();

        this.sub = db.subscribe(updatedTable => {
            if(updatedTable !== table) return;

            this.value = this.stateFactory();

            this.update();
        })
    }

    async getValue() {
        return await this.value;
    }

    subscribe(cb: (next: DataType) => void) {
        this.subs.push(cb);

        return {
            unsubscribe: () => {
                this.subs.splice(this.subs.indexOf(cb), 1);
            }
        }
    }

    destroy() {
        this.sub.unsubscribe();
        this.subs = [];
    }

    private async update() {
        const value = await this.value;

        for(const sub of this.subs) {
            sub(value);
        }
    }
}