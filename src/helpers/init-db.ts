import { DBModel, DBModelBasicTables } from "../db-model.class";
import { DBTable } from "../db-table.class";
import { evaluateFromOldVersion } from "./evaluate-from-old-version";
import { getDBState } from "./get-db-state";

export const initDB = (
    name: string, 
    model: DBModel<DBModelBasicTables, any>,
): Promise<IDBDatabase> => window.indexedDB
    .databases()
    .then((databases) => databases.find((item) => item.name === name) ?? null)
    .then(async (prevDB): Promise<{ status: "NEW" | "SAME" | "UPGRADE", oldVersion?: { state: any, version: number } }> => {
        if (!prevDB) return { status: "NEW" };

        if (prevDB.version === model.version) return { status: "SAME" };

        return new Promise((resolve) => {
            const dbReq = window.indexedDB.open(name);
            dbReq.onsuccess = () => {
                const db = dbReq.result;
                getDBState(db)
                    .then((state) => {
                        resolve({ oldVersion: { state, version: prevDB.version ?? 1 }, status: "UPGRADE" });
                        db.close();
                    });
            };
        });
    })
    .then((info) => new Promise((resolve, reject) => {
        const dbRequest = window.indexedDB.open(name, model.version);

        dbRequest.onsuccess = async () => {
            const db = dbRequest.result;

            if (info.status !== "UPGRADE" || !info.oldVersion) return resolve(db);

            const newState = evaluateFromOldVersion(
                model, 
                info.oldVersion.version, 
                info.oldVersion.state,
            );

            const storages = Array.from(db.objectStoreNames);

            const transaction = db.transaction(storages, "readwrite");

            await Promise.all(
                storages.map((table) => {
                    const store = transaction.objectStore(table);

                    if (!newState[table]) return Promise.resolve(null);

                    return Promise.all(
                        newState[table].map((
                            item: { key: number | string, value: any },
                        ) => new Promise((res, rej) => {
                            const putReq = store.put(item.value, item.key);
                            putReq.onsuccess = () => res(null);
                            putReq.onerror = rej;
                        }))
                    );
                }),
            );

            return resolve(db);
        };
        
        dbRequest.onerror = reject;

        dbRequest.onupgradeneeded = () => {
            const db = dbRequest.result;

            for (const table of Array.from(db.objectStoreNames)) {
                db.deleteObjectStore(table);
            }

            for (const [key, table] of Object.entries(model.tables)) {
                if(table instanceof DBTable) {
                    const storage = db.createObjectStore(key, {
                        autoIncrement: true,
                    })
                    for(const [columnName, column] of Object.entries(table.columns)) {
                        storage.createIndex(columnName, columnName, {
                            unique: column.unique,
                        })
                    }
                } else {
                    db.createObjectStore(key, {
                        autoIncrement: table.autoKey,
                    });
                }
            }
        };
    }));
