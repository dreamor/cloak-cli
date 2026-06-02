/**
 * Entry point used when spawning the daemon as a detached process.
 * Started by lifecycle.ts via Node.
 */
import { startServer } from './server.js';

startServer().catch((err) => {
  process.stderr.write(`daemon start failed: ${err?.message ?? err}\n`);
  process.exit(1);
});
