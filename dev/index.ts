import { DB, DBColumn, DBModel, DBSTable, DBTable, DBTablesName, DBTablesType } from "../src";

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

const db = new DB('test', model);

(async () => {
    const categories = await db.getAll("categories");

    const categoryItems = await Promise.all(categories.map(async ({ name }) => {
        const items = await db.getAllBy("items", "category", name);

        return {
            name,
            count: items.length,
            items: items.map(item => ({
                id: item.key,
                name: item.value.name
            })),
        }
    }))

    console.log(categoryItems)
})()

db.subscribe((table) => {
    console.log(table);
})

type Keys = DBTablesName<typeof db>;

type Types = DBTablesType<typeof db>;

type CategoryT = Types['categories'];