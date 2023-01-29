export class DBColumn<T, Unique extends boolean = false> {
    type!: T;
    constructor(
        public unique: Unique = (false as any)
    ){}
}