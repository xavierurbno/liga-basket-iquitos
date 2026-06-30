import { register } from "node:module";

/** Misma cadena dummy que CI: permite importar módulos con `db/client` sin .env.local */
process.env.DATABASE_URL ??= "postgresql://postgres:postgres@127.0.0.1:5432/postgres";
process.env.DATABASE_POOL_MAX ??= "2";

register("./test-resolve-hooks.mjs", import.meta.url);
