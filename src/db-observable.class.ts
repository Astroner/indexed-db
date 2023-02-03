import { DBModel, DBModelBasicTables } from "./db-model.class";
import { DB } from "./db.class";
import { TableItem } from "./utility-types/table-item";

export class DBObservable<Model extends DBModel<DBModelBasicTables, any>, K extends keyof Model['tables']> {
    
    private value: Promise<TableItem<Model, K>[]>

    private subs = new Array<(next: TableItem<Model, K>[]) => void>()

    private sub: ReturnType<DB<Model>['subscribe']>;

    constructor(db: DB<Model>, table: K) {
        this.value = db.getAllWithKeys(table);

        this.sub = db.subscribe(updatedTable => {
            if(updatedTable !== table) return;

            this.value = db.getAllWithKeys(table);

            this.update();
        })
    }

    async getValue() {
        return await this.value;
    }

    subscribe(cb: (next: TableItem<Model, K>[]) => void) {
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