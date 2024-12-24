declare namespace Deno {
  export const env: {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    toObject(): { [key: string]: string };
  };

  export interface FileInfo {
    isFile: boolean;
    isDirectory: boolean;
    isSymlink: boolean;
    size: number;
    mtime: Date | null;
    atime: Date | null;
    birthtime: Date | null;
  }

  export interface DirEntry {
    name: string;
    isFile: boolean;
    isDirectory: boolean;
    isSymlink: boolean;
  }

  export class errors {
    static NotFound: typeof Error;
    static PermissionDenied: typeof Error;
    static AlreadyExists: typeof Error;
    static ConnectionRefused: typeof Error;
    static ConnectionReset: typeof Error;
    static ConnectionAborted: typeof Error;
    static NotConnected: typeof Error;
    static AddrInUse: typeof Error;
    static AddrNotAvailable: typeof Error;
    static BrokenPipe: typeof Error;
    static InvalidData: typeof Error;
    static TimedOut: typeof Error;
    static Interrupted: typeof Error;
    static WriteZero: typeof Error;
    static UnexpectedEof: typeof Error;
    static BadResource: typeof Error;
    static Busy: typeof Error;
  }

  export function readDir(path: string): AsyncIterableIterator<DirEntry>;
  export function mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  export function remove(path: string, options?: { recursive?: boolean }): Promise<void>;
  export function stat(path: string): Promise<FileInfo>;
}

declare interface ImportMeta {
  url: string;
  main: boolean;
}
