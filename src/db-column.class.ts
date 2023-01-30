export class DBColumn<T, Indexable extends boolean = false> {
    type!: T;
    constructor(
        public indexable: Indexable = (false as Indexable),
        public unique: Indexable extends true ? boolean : never = (false as any),
    ){}
}