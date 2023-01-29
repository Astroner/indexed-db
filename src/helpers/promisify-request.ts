export const promisifyRequest = <R extends IDBRequest>(req: R) => {
    return new Promise<R['result']>((resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = reject;
    })
}