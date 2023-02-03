import { DB, DBColumn, DBModel, DBObservable, DBSTable, DBTable, DBTablesName, DBTablesType } from "../src";

type Category = "cooking" | "anime";

const model = DBModel
    .create({
        items: new DBTable({
            name: new DBColumn<string, true>(true, true),
            category: new DBColumn<Category, true>(true),
        }),
        categories: new DBTable({
            name: new DBColumn<Category, true>(true, true),
        }),
    })
    .extend(
        {
            items: new DBTable({
                name: new DBColumn<string, true>(true, true),
                category: new DBColumn<number, true>(true),
            })
        },
        (prev) => ({
            categories: prev.categories,
            items: prev.items.map(item => ({
                key: item.key,
                value: {
                    name: item.value.name,
                    category: prev.categories.find(cat => cat.value.name === item.value.category)?.key ?? 0
                }
            }))
        })
    )

const db = new DB('test', model);

window['db'] = db;

const obs = new DBObservable(db, "categories");

obs.subscribe(console.log)