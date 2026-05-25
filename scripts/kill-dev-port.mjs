/**
 * Libera el puerto 3001 en Windows (dev de Next.js colgado).
 * Uso: node scripts/kill-dev-port.mjs
 */
import { execSync } from "node:child_process";

const PORT = process.env.DEV_PORT?.trim() || "3001";

function killPortWindows(port) {
  let out = "";
  try {
    out = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] });
  } catch {
    return;
  }

  const pids = new Set();
  for (const line of out.split(/\r?\n/)) {
    if (!/LISTENING/i.test(line)) continue;
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && /^\d+$/.test(pid)) pids.add(pid);
  }

  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: "inherit" });
      console.log(`[kill-dev-port] Proceso ${pid} terminado (puerto ${port}).`);
    } catch {
      console.warn(`[kill-dev-port] No se pudo terminar PID ${pid}.`);
    }
  }

  if (pids.size === 0) {
    console.log(`[kill-dev-port] Puerto ${port} libre (sin LISTENING).`);
  }
}

if (process.platform !== "win32") {
  console.warn("[kill-dev-port] Solo automatizado en Windows; usa lsof/fuser en otros SO.");
  process.exit(0);
}

killPortWindows(PORT);
