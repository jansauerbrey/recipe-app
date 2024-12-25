declare module 'oak' {
  export type Next = () => Promise<void>;

  export interface Context {
    request: {
      method: string;
      url: URL;
      headers: Headers;
      body: () => { type: string; value: Promise<any> };
    };
    response: {
      status: number;
      body: any;
      headers: Headers;
      type: string;
    };
    state: {
      user?: {
        id: string;
        role: string;
      };
      [key: string]: any;
    };
    cookies: {
      get(key: string): string | undefined;
      set(key: string, value: string, options?: any): void;
    };
    throw(status: number, message?: string): never;
    assert(condition: boolean, status: number, message?: string): void;
  }

  export interface RouterContext<R extends string = any> extends Context {
    params: {
      [K in R]: string;
    };
  }

  export type Middleware = (context: Context, next: Next) => Promise<void>;
  export type RouterMiddleware<R extends string = any> = (context: RouterContext<R>, next: Next) => Promise<void>;

  export interface RouterOptions {
    prefix?: string;
    methods?: string[];
    routerPath?: string;
    sensitive?: boolean;
    strict?: boolean;
  }

  export interface AllowedMethodsOptions {
    throw?: boolean;
    notImplemented?: () => Response;
    methodNotAllowed?: () => Response;
  }

  export interface Route<P extends string = any> {
    path: string;
    regexp: RegExp;
    paramNames: string[];
    middleware: RouterMiddleware<P>[];
  }

  export class Router<P extends string = any> {
    constructor(options?: RouterOptions);
    
    all<T extends string>(path: T, ...middleware: RouterMiddleware<T>[]): Router<P | T>;
    get<T extends string>(path: T, ...middleware: RouterMiddleware<T>[]): Router<P | T>;
    post<T extends string>(path: T, ...middleware: RouterMiddleware<T>[]): Router<P | T>;
    put<T extends string>(path: T, ...middleware: RouterMiddleware<T>[]): Router<P | T>;
    delete<T extends string>(path: T, ...middleware: RouterMiddleware<T>[]): Router<P | T>;
    patch<T extends string>(path: T, ...middleware: RouterMiddleware<T>[]): Router<P | T>;
    options<T extends string>(path: T, ...middleware: RouterMiddleware<T>[]): Router<P | T>;
    head<T extends string>(path: T, ...middleware: RouterMiddleware<T>[]): Router<P | T>;
    
    prefix(prefix: string): Router<P>;
    middleware(): RouterMiddleware<P>;
    allowedMethods(options?: AllowedMethodsOptions): Middleware;
  }
}
