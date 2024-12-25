declare module 'mongo' {
  export class MongoClient {
    constructor();
    connect(uri: string): Promise<void>;
    close(): Promise<void>;
    database(name?: string): Database;
  }

  export interface Database {
    listCollectionNames(): Promise<string[]>;
    collection<T = any>(name: string): Collection<T>;
  }

  export interface Collection<T> {
    deleteMany(filter: object): Promise<DeleteResult>;
    insertOne(doc: T): Promise<InsertOneResult>;
    insertMany(docs: T[]): Promise<InsertManyResult>;
    findOne(filter: object): Promise<T | null>;
    find(filter: object): Promise<T[]>;
    updateOne(filter: object, update: object): Promise<UpdateResult>;
    updateMany(filter: object, update: object): Promise<UpdateResult>;
    deleteOne(filter: object): Promise<DeleteResult>;
  }

  export interface InsertOneResult {
    insertedId: string;
  }

  export interface InsertManyResult {
    insertedIds: string[];
  }

  export interface UpdateResult {
    matchedCount: number;
    modifiedCount: number;
  }

  export interface DeleteResult {
    deletedCount: number;
  }
}
