declare module 'supertest' {
  interface Test {
    send(data: any): this;
    set(field: string, val: string): this;
  }
}

export {};