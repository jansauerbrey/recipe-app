declare module "std/fs/mod.ts" {
  export interface WalkOptions {
    maxDepth?: number;
    includeFiles?: boolean;
    includeDirs?: boolean;
    followSymlinks?: boolean;
    exts?: string[];
    match?: RegExp[];
    skip?: RegExp[];
  }

  export interface WalkEntry {
    path: string;
    isFile: boolean;
  }

  export function walk(dir: string, options?: WalkOptions): AsyncIterableIterator<WalkEntry>;

  export function ensureDir(dir: string): Promise<void>;
  export function emptyDir(dir: string): Promise<void>;
  export function exists(path: string): Promise<boolean>;
  export function copy(src: string, dest: string, options?: { overwrite?: boolean }): Promise<void>;
  export function move(src: string, dest: string, options?: { overwrite?: boolean }): Promise<void>;
  export function remove(path: string, options?: { recursive?: boolean }): Promise<void>;
}

declare module "std/path/mod.ts" {
  export function join(...paths: string[]): string;
  export function dirname(path: string): string;
  export function basename(path: string): string;
  export function extname(path: string): string;
  export function normalize(path: string): string;
  export function resolve(...paths: string[]): string;
  export function relative(from: string, to: string): string;
  export function isAbsolute(path: string): boolean;
  export const SEP: string;
}

declare module "std/flags/mod.ts" {
  export interface ParseOptions {
    string?: string[];
    boolean?: string[];
    default?: Record<string, any>;
  }
  export function parse(args: string[], options?: ParseOptions): Record<string, any>;
}

declare module "std/fmt/colors.ts" {
  export function green(str: string | number): string;
  export function red(str: string | number): string;
  export function yellow(str: string | number): string;
  export function blue(str: string | number): string;
  export function bold(str: string): string;
  export function dim(str: string): string;
  export function italic(str: string): string;
  export function underline(str: string): string;
}

declare module "std/testing/mod.ts" {
  export interface TestDefinition {
    name: string;
    fn: () => Promise<void>;
    sanitizeResources?: boolean;
    sanitizeOps?: boolean;
    ignore?: boolean;
    only?: boolean;
  }

  export interface TestResult {
    passed: number;
    failed: number;
    skipped: number;
    measured?: boolean;
    filtered?: boolean;
  }

  export interface TestContext {
    name: string;
    parent?: TestContext;
    children: TestContext[];
    level: number;
    sanitizeOps: boolean;
    sanitizeResources: boolean;
  }

  export function test(def: TestDefinition): Promise<TestResult>;
  export function test(name: string, fn: () => void | Promise<void>): Promise<TestResult>;
}

declare module "bdd" {
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void | Promise<void>): void;
  export function beforeEach(fn: () => void | Promise<void>): void;
  export function afterEach(fn: () => void | Promise<void>): void;
  export function beforeAll(fn: () => void | Promise<void>): void;
  export function afterAll(fn: () => void | Promise<void>): void;
}

declare module "testing/mod.ts" {
  export interface TestDefinition {
    name: string;
    fn: () => Promise<void>;
    sanitizeResources?: boolean;
    sanitizeOps?: boolean;
    ignore?: boolean;
    only?: boolean;
  }

  export interface TestResult {
    passed: number;
    failed: number;
    skipped: number;
    measured?: boolean;
    filtered?: boolean;
  }

  export interface TestContext {
    name: string;
    parent?: TestContext;
    children: TestContext[];
    level: number;
    sanitizeOps: boolean;
    sanitizeResources: boolean;
  }

  export function test(def: TestDefinition): Promise<TestResult>;
  export function test(name: string, fn: () => void | Promise<void>): Promise<TestResult>;
}

declare module "testing/asserts.ts" {
  type ErrorConstructor = new (...args: any[]) => Error;

  export function assertEquals(actual: unknown, expected: unknown, msg?: string): void;
  export function assertNotEquals(actual: unknown, expected: unknown, msg?: string): void;
  export function assertStrictEquals(actual: unknown, expected: unknown, msg?: string): void;
  export function assertExists(actual: unknown, msg?: string): void;
  export function assertMatch(actual: string, expected: RegExp, msg?: string): void;
  export function assertNotMatch(actual: string, expected: RegExp, msg?: string): void;
  export function assertArrayIncludes<T>(actual: ArrayLike<T>, expected: ArrayLike<T>, msg?: string): void;
  export function assertStringIncludes(actual: string, expected: string, msg?: string): void;
  export function assertRejects(fn: () => Promise<unknown>, ErrorClass?: ErrorConstructor, msgIncludes?: string): Promise<void>;
  export function assertThrows(fn: () => unknown, ErrorClass?: ErrorConstructor, msgIncludes?: string): void;
}

declare interface ImportMeta {
  url: string;
  main: boolean;
}

declare namespace Deno {
  export const test: {
    (def: import("testing/mod.ts").TestDefinition): Promise<import("testing/mod.ts").TestResult>;
    (name: string, fn: () => void | Promise<void>): Promise<import("testing/mod.ts").TestResult>;
  };
  export const args: string[];
  export const watchFs: (paths: string[]) => AsyncIterableIterator<{ kind: string; paths: string[]; }>;
}
