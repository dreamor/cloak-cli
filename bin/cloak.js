#!/usr/bin/env node
import('../dist/cli.js').then((m) => m.main(process.argv)).catch((err) => {
  process.stderr.write(
    JSON.stringify({
      ok: false,
      error: {
        code: 'BOOT_ERROR',
        message: err && err.message ? err.message : String(err),
        stack: err && err.stack ? err.stack : undefined,
      },
    }) + '\n'
  );
  process.exit(1);
});
