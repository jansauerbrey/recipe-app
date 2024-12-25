declare module 'djwt' {
  export interface Header {
    alg: string;
    typ?: string;
    cty?: string;
    kid?: string;
  }

  export interface Payload {
    [key: string]: any;
    iss?: string;
    sub?: string;
    aud?: string[] | string;
    exp?: number;
    nbf?: number;
    iat?: number;
    jti?: string;
  }

  export interface Algorithm {
    name: string;
    sign(data: Uint8Array, key: CryptoKey): Promise<Uint8Array>;
    verify(signature: Uint8Array, data: Uint8Array, key: CryptoKey): Promise<boolean>;
  }

  export interface JwtValidation {
    audience?: string | string[];
    issuer?: string;
    algorithms?: string[];
    ignoreExpiration?: boolean;
    ignoreNotBefore?: boolean;
    subject?: string;
    jwtId?: string;
  }

  export function create(header: Header, payload: Payload, key: string | CryptoKey): Promise<string>;
  export function verify(jwt: string, key: string | CryptoKey, options?: JwtValidation): Promise<Payload>;
  export function decode(jwt: string): [Header, Payload, Uint8Array];
  export function validate(jwt: string, key: string | CryptoKey, options?: JwtValidation): Promise<boolean>;
  export function getNumericDate(exp?: number): number;
}
