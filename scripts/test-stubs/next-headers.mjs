/** Stub mínimo para unit tests (Node test runner sin bundler Next). */
export function headers() {
  return new Headers();
}

export async function cookies() {
  return {
    get: () => undefined,
    set: () => {},
    delete: () => {},
  };
}
