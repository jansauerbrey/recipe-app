declare module "std/testing/bdd.ts" {
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void | Promise<void>): void;
  export function beforeEach(fn: () => void | Promise<void>): void;
  export function afterEach(fn: () => void | Promise<void>): void;
  export function beforeAll(fn: () => void | Promise<void>): void;
  export function afterAll(fn: () => void | Promise<void>): void;
}

declare module "std/testing/asserts.ts" {
  export type Constructor = new (...args: any[]) => any;

  export function assertEquals(actual: unknown, expected: unknown, msg?: string): void;
  export function assertNotEquals(actual: unknown, expected: unknown, msg?: string): void;
  export function assertStrictEquals(actual: unknown, expected: unknown, msg?: string): void;
  export function assertExists(actual: unknown, msg?: string): void;
  export function assertMatch(actual: string, expected: RegExp, msg?: string): void;
  export function assertNotMatch(actual: string, expected: RegExp, msg?: string): void;
  export function assertArrayIncludes<T>(actual: ArrayLike<T>, expected: ArrayLike<T>, msg?: string): void;
  export function assertStringIncludes(actual: string, expected: string, msg?: string): void;
  export function assertRejects(fn: () => Promise<unknown>, ErrorClass?: Constructor, msgIncludes?: string): Promise<void>;
  export function assertThrows(fn: () => unknown, ErrorClass?: Constructor, msgIncludes?: string): void;
}

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
    name: string;
    isFile: boolean;
    isDirectory: boolean;
    isSymlink: boolean;
  }

  export function walk(path: string, options?: WalkOptions): AsyncIterableIterator<WalkEntry>;
  export function walkSync(path: string, options?: WalkOptions): IterableIterator<WalkEntry>;
  
  export function ensureDir(path: string): Promise<void>;
  export function ensureDirSync(path: string): void;
  
  export function exists(path: string): Promise<boolean>;
  export function existsSync(path: string): boolean;
}

declare module "std/path/mod.ts" {
  export function basename(path: string, ext?: string): string;
  export function dirname(path: string): string;
  export function extname(path: string): string;
  export function format(pathObject: FormatInputPathObject): string;
  export function fromFileUrl(url: string | URL): string;
  export function isAbsolute(path: string): boolean;
  export function join(...paths: string[]): string;
  export function normalize(path: string): string;
  export function parse(path: string): ParsedPath;
  export function relative(from: string, to: string): string;
  export function resolve(...pathSegments: string[]): string;
  export function toFileUrl(path: string): URL;
  export const SEP: string;
  export const delimiter: string;

  export interface ParsedPath {
    root: string;
    dir: string;
    base: string;
    ext: string;
    name: string;
  }

  export interface FormatInputPathObject {
    root?: string;
    dir?: string;
    base?: string;
    ext?: string;
    name?: string;
  }
}

declare module "std/flags/mod.ts" {
  export interface ParseOptions {
    string?: string[];
    boolean?: string[];
    default?: Record<string, any>;
    alias?: Record<string, string>;
    stopEarly?: boolean;
    unknown?: (arg: string, key?: string, value?: unknown) => boolean | void;
  }

  export function parse(args: string[], options?: ParseOptions): Record<string, unknown>;
}

declare module "std/dotenv/mod.ts" {
  export interface ConfigOptions {
    path?: string;
    export?: boolean;
    safe?: boolean;
    example?: string;
    allowEmptyValues?: boolean;
    defaults?: Record<string, string>;
  }

  export function config(options?: ConfigOptions): Promise<Record<string, string>>;
  export function configSync(options?: ConfigOptions): Record<string, string>;
  export function load(options?: ConfigOptions): Promise<void>;
  export function loadSync(options?: ConfigOptions): void;
}

declare module "std/fmt/colors.ts" {
  export function red(str: string): string;
  export function green(str: string): string;
  export function yellow(str: string): string;
  export function blue(str: string): string;
  export function magenta(str: string): string;
  export function cyan(str: string): string;
  export function white(str: string): string;
  export function gray(str: string): string;
  export function bold(str: string): string;
  export function italic(str: string): string;
  export function underline(str: string): string;
  export function strikethrough(str: string): string;
  export function reset(str: string): string;
}
