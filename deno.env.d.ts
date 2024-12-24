// Oak types
declare module "oak" {
  export class Application {
    use(middleware: (ctx: Context, next: () => Promise<void>) => Promise<void>): void;
    listen(options: { port: number }): Promise<void>;
  }

  export class Router {
    routes(): (ctx: Context, next: () => Promise<void>) => Promise<void>;
    allowedMethods(): (ctx: Context, next: () => Promise<void>) => Promise<void>;
    get(path: string, ...middleware: Array<(ctx: Context, next: () => Promise<void>) => Promise<void>>): void;
    post(path: string, ...middleware: Array<(ctx: Context, next: () => Promise<void>) => Promise<void>>): void;
    put(path: string, ...middleware: Array<(ctx: Context, next: () => Promise<void>) => Promise<void>>): void;
    delete(path: string, ...middleware: Array<(ctx: Context, next: () => Promise<void>) => Promise<void>>): void;
  }

  export interface Context {
    request: {
      url: URL;
      headers: Headers;
      body(): { type: string; value: Promise<any> };
    };
    response: {
      status: number;
      body: any;
      headers: Headers;
    };
    state: Record<string, any>;
    params: Record<string, string>;
    send(options: { root: string; index?: string }): Promise<void>;
  }

  export type RouterContext<P extends string = any> = Context & {
    params: Record<string, string>;
  };

  export enum Status {
    OK = 200,
    Created = 201,
    NoContent = 204,
    BadRequest = 400,
    Unauthorized = 401,
    Forbidden = 403,
    NotFound = 404,
    InternalServerError = 500,
  }
}

// MongoDB types
declare module "mongo" {
  export class MongoClient {
    constructor();
    connect(uri: string): Promise<void>;
    database(name: string): Database;
  }

  export class Database {
    collection<T>(name: string): Collection<T>;
  }

  export class Collection<T> {
    findOne(filter: object): Promise<T | null>;
    find(filter: object): { toArray(): Promise<T[]> };
    insertOne(doc: Omit<T, "_id">): Promise<{ $oid: string }>;
    updateOne(filter: object, update: object): Promise<{ modifiedCount: number }>;
    deleteOne(filter: object): Promise<{ deletedCount: number }>;
  }

  export class ObjectId {
    constructor(id: string);
    toString(): string;
    $oid: string;
  }
}

// CORS types
declare module "cors" {
  export function oakCors(options?: {
    origin?: string | string[] | ((origin: string) => string);
    methods?: string[];
    allowedHeaders?: string[];
    credentials?: boolean;
  }): (ctx: any, next: () => Promise<void>) => Promise<void>;
}

// Rate limit types
declare module "oak_rate_limit" {
  export function rateLimit(options: {
    windowMs: number;
    max: number;
    message?: string;
  }): (ctx: any, next: () => Promise<void>) => Promise<void>;
}

// Dotenv types
declare module "dotenv" {
  export function config(): Promise<{ [key: string]: string }>;
}

// JWT types
declare module "djwt" {
  export function create(header: object, payload: object, key: Uint8Array): Promise<string>;
  export function verify(token: string, key: Uint8Array): Promise<any>;
}

// Bcrypt types
declare module "bcrypt" {
  export function hash(data: string): Promise<string>;
  export function compare(data: string, hash: string): Promise<boolean>;
}

// HTTP Status types
declare module "http/http_status.ts" {
  export enum Status {
    OK = 200,
    Created = 201,
    NoContent = 204,
    BadRequest = 400,
    Unauthorized = 401,
    Forbidden = 403,
    NotFound = 404,
    InternalServerError = 500,
  }
}

// Deno namespace
declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    toObject(): { [key: string]: string };
  }

  export const env: Env;
  export function exit(code?: number): never;
  export function cwd(): string;
}
