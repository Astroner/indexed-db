import { DBModel, DBModelBasicTables } from "./db-model.class";
import { DB } from "./db.class";
import { TableType } from "./utility-types/table-type";

export class DBObservable<
    Model extends DBModel<DBModelBasicTables, any>, 
    K extends keyof Model['tables'],
    DataType extends any = TableType<Model, K>[],
> {
    
    private value: Promise<DataType>

    private subs = new Array<(next: DataType) => void>()

    private sub: ReturnType<DB<Model>['subscribe']>;

    private updateState: () => Promise<DataType>;
    
    /**
     * 
     * @param db Database for observation
     * @param table Observing table
     * @param stateFactory (Optional) creates next state
     */
    constructor(
        db: DB<Model>, 
        table: K,
        stateFactory?: () => Promise<DataType>
    ) {
        this.updateState = stateFactory ?? (() => {
            return db.getAll(table) as any;
        })

        this.value = this.updateState();

        this.sub = db.subscribe(updatedTable => {
            if(updatedTable !== table) return;

            this.value = this.updateState();

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