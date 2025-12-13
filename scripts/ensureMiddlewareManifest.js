const fs = require("fs");
const path = require("path");

/**
 * Firebase Hosting (frameworks preview) expects `.next/server/middleware-manifest.json` to exist.
 * Next.js Turbopack builds may omit it when no middleware is present.
 * This script creates a minimal manifest if it doesn't exist.
 */

function ensureMiddlewareManifest() {
  const projectRoot = process.cwd();
  const serverDir = path.join(projectRoot, ".next", "server");
  const manifestPath = path.join(serverDir, "middleware-manifest.json");

  try {
    if (fs.existsSync(manifestPath)) return;

    fs.mkdirSync(serverDir, { recursive: true });

    const minimal = {
      version: 2,
      middleware: {},
      functions: {},
      sortedMiddleware: [],
    };

    fs.writeFileSync(manifestPath, JSON.stringify(minimal, null, 2), "utf8");
    // eslint-disable-next-line no-console
    console.log(`[postbuild] Wrote missing middleware manifest: ${manifestPath}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[postbuild] Failed to ensure middleware-manifest.json:", err);
  }
}

ensureMiddlewareManifest();




