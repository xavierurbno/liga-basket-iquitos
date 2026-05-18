export class QueryTimeoutError extends Error {
  readonly label: string;
  readonly timeoutMs: number;

  constructor(label: string, timeoutMs: number) {
    super(`Consulta "${label}" superó ${timeoutMs}ms (pool o red lenta).`);
    this.name = "QueryTimeoutError";
    this.label = label;
    this.timeoutMs = timeoutMs;
  }
}

/** Evita que peticiones RSC queden colgadas si el pool de Postgres está saturado. */
export function withQueryTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new QueryTimeoutError(label, timeoutMs));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}
