import assert from "node:assert/strict";
import test from "node:test";
import {
  formatClientActionError,
  isRetryableNetworkError,
  translateActionError,
} from "./translate-action-error.ts";

test("traduce error genérico de Next.js Server Actions", () => {
  const msg = translateActionError(
    new Error("An unexpected response was received from the server."),
  );
  assert.match(msg, /error del servidor/i);
  assert.doesNotMatch(msg, /unexpected response/i);
});

test("traduce errores de red", () => {
  assert.match(translateActionError(new Error("Failed to fetch")), /conexión/i);
  assert.equal(isRetryableNetworkError(new Error("Failed to fetch")), true);
});

test("traduce timeout y payload grande", () => {
  assert.match(
    translateActionError(new Error("FUNCTION_INVOCATION_TIMEOUT")),
    /tardó demasiado/i,
  );
  assert.match(
    translateActionError(new Error("Payload Too Large")),
    /demasiado grandes/i,
  );
});

test("traduce categoría duplicada", () => {
  assert.match(
    translateActionError(
      new Error('duplicate key value violates unique constraint "categories_unique"'),
    ),
    /Ya existe una categoría/i,
  );
});

test("conserva mensajes ya en español del servidor", () => {
  const msg = "El club no tiene liga asignada.";
  assert.equal(translateActionError(msg), msg);
});

test("formatClientActionError usa fallback personalizado", () => {
  assert.equal(
    formatClientActionError(null, "Fallo al guardar la categoría."),
    "Fallo al guardar la categoría.",
  );
});
