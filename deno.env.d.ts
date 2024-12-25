/// <reference lib="deno.ns" />

// Augment existing types
declare global {
  // Oak types
  namespace Oak {
    interface Application {
      use(middleware: (ctx: Context, next: () => Promise<void>) => Promise<void>): void;
      listen(options: { port: number }): Promise<void>;
    }

    interface Router {
      routes(): (ctx: Context, next: () => Promise<void>) => Promise<void>;
      allowedMethods(): (ctx: Context, next: () => Promise<void>) => Promise<void>;
      get(
        path: string,
        ...middleware: Array<(ctx: Context, next: () => Promise<void>) => Promise<void>>
      ): void;
      post(
        path: string,
        ...middleware: Array<(ctx: Context, next: () => Promise<void>) => Promise<void>>
      ): void;
      put(
        path: string,
        ...middleware: Array<(ctx: Context, next: () => Promise<void>) => Promise<void>>
      ): void;
      delete(
        path: string,
        ...middleware: Array<(ctx: Context, next: () => Promise<void>) => Promise<void>>
      ): void;
    }

    interface Context {
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

    interface RouterContext extends Context {
      params: Record<string, string>;
    }

    enum Status {
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
  namespace Mongo {
    interface MongoClient {
      connect(uri: string): Promise<void>;
      database(name: string): Database;
    }

    interface Database {
      collection<T>(name: string): Collection<T>;
    }

    interface Collection<T> {
      findOne(filter: object): Promise<T | null>;
      find(filter: object): { toArray(): Promise<T[]> };
      insertOne(doc: Omit<T, '_id'>): Promise<{ $oid: string }>;
      updateOne(filter: object, update: object): Promise<{ modifiedCount: number }>;
      deleteOne(filter: object): Promise<{ deletedCount: number }>;
    }

    interface ObjectId {
      toString(): string;
      $oid: string;
    }
  }

  // CORS types
  namespace Cors {
    interface Options {
      origin?: string | string[] | ((origin: string) => string);
      methods?: string[];
      allowedHeaders?: string[];
      credentials?: boolean;
    }

    type Middleware = (ctx: any, next: () => Promise<void>) => Promise<void>;
  }

  // Rate limit types
  namespace RateLimit {
    interface Options {
      windowMs: number;
      max: number;
      message?: string;
    }

    type Middleware = (ctx: any, next: () => Promise<void>) => Promise<void>;
  }

  // JWT types
  namespace JWT {
    function create(header: object, payload: object, key: Uint8Array): Promise<string>;
    function verify(token: string, key: Uint8Array): Promise<any>;
  }

  // Bcrypt types
  namespace Bcrypt {
    function hash(data: string): Promise<string>;
    function compare(data: string, hash: string): Promise<boolean>;
  }

  // HTTP Status types
  namespace HTTP {
    enum Status {
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
}

// Export nothing, this is just a type declaration file
export {};
