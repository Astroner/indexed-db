export const getDBState = <T>(db: IDBDatabase) => new Promise<T>((resolve, reject) => {
    const state: any = {};
    const tables = Array.from(db.objectStoreNames);

    const transaction = db.transaction(tables, "readonly");

    Promise.all(tables.map((table) => new Promise<void>((res, rej) => {
        const store = transaction.objectStore(table);
        state[table] = [];

        const openRequest = store.openCursor();

        openRequest.onsuccess = () => {
            const cursor = openRequest.result;
            if (cursor) {
                state[table].push({
                    key: cursor.key,
                    value: cursor.value,
                });
                cursor.continue();
            } else {
                res();
            }
        };

        openRequest.onerror = () => rej();
    })))
        .then(() => resolve(state))
        .catch(reject);
});
