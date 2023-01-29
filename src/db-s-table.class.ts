export class DBSTable<T, AutoKey extends boolean = false> {
    type!: T;

    constructor(public autoKey: AutoKey = (false as AutoKey)) {}
}
