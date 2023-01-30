# Hi there
This is simple abstraction over indexedDB based on classes, tables and columns.

# Table of content
 - [Basics](#basics)
    - [Model](#model)
    - [DB](#db)
    - [Basic operations](#basic-operations)
    - [Migration](#migration)
        - [Next](#next)
        - [Extend](#extend)
    - [Disconnect](#disconnect)
 - [Advanced](#advanced)
    - [DBSTable](#dbstable)
    - [DBTable](#dbtable)


# Basics
### Model
First, we need to create a data model for the DB:
```ts
import { DBModel, DBSTable } from '@dogonis/db'

const model = DBModel.create({
    items: new DBSTable<string>()
})
```
**DBModel.create(tables)** returns initial DB model based on tables it got. In the example above **DBSTable** is used as table type. 
**DBSTable** stands for *Database Simple Table*. *Simple* here means that it's just a key-value storage. The only generic argument here is a type of the table data, keys are always strings.

### DB
So, we have Model now we can create DB:
```ts
import { DB } from '@dogonis/db'

const db = new DB('db-name', model);
```
Actual DB interface is implemented by **DB** class. It takes database name and model.

### Basic operations
Lets try some simple operations like add, get and delete:
```ts
import { DBModel, DBSTable } from '@dogonis/db'

const model = DBModel.create({
    items: new DBSTable<string>()
})

const db = new DB('db-name', model);

const addItem = (key: string, value: string) => {
    return db.add("items", key, value);
}

const getItem = async (key: string) => {
    return db.get("items", key);
}

const getAllItems = async () => {
    return db.getAll("items");
}

const deleteItem = async (key: string) => {
    return db.delete("items", key);
}
```
Basically each method represents specific operation and takes table name as the first argument.

### Migration
Unfortunately we can't just add new fields to the model or modify existing ones, we have to create a new model from previous.
**DBModel** provides 2 methods to do so: **next()** and **extend()**:

#### Next
Simply creates new model from previous and provides migration function:
```ts
const model = DBModel
    .create({
        items: new DBSTable<string>()
    })
    .next(
        {
            entries: new DBSTable<{ name: string }>(),
        },
        (prevState) => ({
            entries: prevState.map((item) => ({ key: item.key, value: { name: item.value } }))
        })
    )

const db = new DB('db-name', model);
```
As you can see we can(and it's recommended) just chain methods to change Database model, **DB** class will automatically evaluate state from previous versions using provided migration functions.

#### Extend
Does exactly what **next()** does, but takes previous model as basis:
```ts
const model = DBModel
    .create({
        items: new DBSTable<string>()
    })
    .next(
        {
            entries: new DBSTable<{ name: string }>(),
        },
        (prevState) => ({
            entries: prevState.map((item) => ({ key: item.key, value: { name: item.value } }))
        })
    )
    .extend(
        {
            categories: new DBSTable<string>(),
        },
        (prevState) => ({
            entries: prevState.entries,
            categories: [],
        })
    )
``` 
Here we just added new table categories, but it doesn't mean that we only can add, we also can override:
```ts
const model = DBModel
    .create({
        items: new DBSTable<string>()
    })
    .next(
        {
            entries: new DBSTable<{ name: string }>(),
        },
        (prevState) => ({
            entries: prevState.map((item) => ({ key: item.key, value: { name: item.value } }))
        })
    )
    .extend(
        {
            categories: new DBSTable<string>(),
        },
        (prevState) => ({
            entries: prevState.entries,
            categories: [],
        })
    )
    .extend(
        {
            entries: new DBSTable<number>(),
        },
        (prevState) => ({
            categories: prevState.categories,
            entries: [],
        })
    )
``` 
### Disconnect
To disconnect the **DB** instance from indexedDB just call **DB.disconnect()**
```ts
const db = new DB('db-name', model);

// operations...

db.disconnect();
```
IndexedDB will wait until end of all existing operations and then just close the connection.


# Advanced
### DBSTable
Additionally **DBSTable** takes second **autoKey** parameter:
```ts
const model = DBModel.create({
    withNumbers: new DBSTable<string, true>(true),
})
```
Here we have to not only pass **true** to the **constructor** but also add second generic argument, because we need to save type data.
If **autoKey** then **DB** will change key type for this table from **string** to **number** and will set it automatically, which also means that we cant use **DB.put()** method, because it only works with **string** keys.

```ts
const model = DBModel.create({
    withNumbers: new DBSTable<string, true>(true),
})

const db = new DB('db-name', model);

db.add("withNumbers", null, "test-string")
```

### DBTable
Moving on from *Simple* table to *Normal* table or **DBTable**:
```ts
const model = DBModel.create({
    users: new DBTable({
        name: new DBColumn<string>(),
        surname: new DBColumn<string>(),
        age: new DBColumn<number>(),
    })
})
```
As it shown above **DBTable** takes some sort of table schema made of **DBColumn**. **DBColumn** takes column data type as generic argument. The main difference of **DBTable** from **DBSTable** is the opportunity to make *indexes* and *unique* fields. Indexes allows you to select items from table by specific field. To set column as indexable you need pass **true** to the constructor and generic argument:
```ts
const model = DBModel.create({
    users: new DBTable({
        nickname: new DBColumn<string, true>(true, true),
        name: new DBColumn<string>(),
        surname: new DBColumn<string, true>(true),
        age: new DBColumn<number>(),
    })
})
```
Above we added *nickname* column as `new DBColumn<string, true>(true, true)`, second **true** means that this field is not only indexable, but also unique.
Now we can use **DB.getBy()** and **DB.getAllBy()** to search data:
```ts
const model = DBModel.create({
    characters: new DBTable({
        nickname: new DBColumn<string, true>(true, true),
        name: new DBColumn<string>(),
        surname: new DBColumn<string, true>(true),
        age: new DBColumn<number>(),
    })
})

const db = new DB('db-name', model);

const test = async () => {
    await db.add('characters', null, { nickname: '007', name: 'james', surname: 'bond', age: 32 });
    await db.add('characters', null, { nickname: 'fullmetal alchemist', name: 'edward', surname: 'elric', age: 18 });
    await db.add('characters', null, { nickname: 'armor', name: 'alphonse', surname: 'elric', age: 17 });

    const bond = await db.getBy('characters', 'nickname', '007');

    const elrics = await db.getAllBy('characters', 'surname', 'elric');
}
```