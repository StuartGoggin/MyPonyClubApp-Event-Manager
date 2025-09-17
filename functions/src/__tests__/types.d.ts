declare module 'supertest' {
  interface Test {
    send(data: any): this;
    set(field: string, val: string): this;
  }
}

declare global {
  var TextEncoder: typeof import('util').TextEncoder;
  var TextDecoder: typeof import('util').TextDecoder;
}