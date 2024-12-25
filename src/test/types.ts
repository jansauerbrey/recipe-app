import { Context, State } from 'oak';

export type Middleware = (context: Context, next: () => Promise<void>) => Promise<void>;

export interface MockState extends State {
  user?: {
    id: string;
    role: string;
  };
  [key: string]: unknown;
}

export interface MockContext extends Omit<Context, 'state'> {
  state: MockState;
  request: {
    method: string;
    url: URL;
    headers: Headers;
    body: () => { type: string; value: Promise<any> };
    hasBody: boolean;
  };
  response: {
    status: number;
    body: any;
    headers: Headers;
    type: string;
  };
  cookies: {
    get(key: string): string | undefined;
    set(key: string, value: string, options?: any): void;
  };
  throw(status: number, message?: string): never;
  assert(condition: boolean, status: number, message?: string): void;
}

export type TestMiddleware = (context: MockContext, next: () => Promise<void>) => Promise<void>;

export interface TestContext<T = unknown> {
  state: {
    data?: T;
    error?: Error;
  };
}

export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  password?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TestRecipe {
  id: string;
  title: string;
  description: string;
  ingredients: Array<{
    name: string;
    amount: number;
    unit: string;
  }>;
  instructions: string[];
  userId: string;
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
