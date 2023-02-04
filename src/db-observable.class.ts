import { DBModel, DBModelBasicTables } from "./db-model.class";
import { DB } from "./db.class";
import { TableType } from "./utility-types/table-type";

export class DBObservable<Model extends DBModel<DBModelBasicTables, any>, K extends keyof Model['tables']> {
    
    private value: Promise<TableType<Model, K>[]>

    private subs = new Array<(next: TableType<Model, K>[]) => void>()

    private sub: ReturnType<DB<Model>['subscribe']>;

    constructor(db: DB<Model>, table: K) {
        this.value = db.getAll(table);

        this.sub = db.subscribe(updatedTable => {
            if(updatedTable !== table) return;

            this.value = db.getAll(table);

            this.update();
        })
    }

    async getValue() {
        return await this.value;
    }

    subscribe(cb: (next: TableType<Model, K>[]) => void) {
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