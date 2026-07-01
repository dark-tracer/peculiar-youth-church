import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const removeRedirectsPlugin = {
  name: "remove-redirects",
  closeBundle() {
    const candidates = [
      path.resolve(__dirname, "dist/client/_redirects"),
      path.resolve(__dirname, "dist/_redirects"),
      path.resolve(__dirname, ".output/public/_redirects"),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        fs.unlinkSync(p);
        console.log(`Removed _redirects from build output: ${p}`);
      }
    }
  },
};

export default defineConfig({
  vite: {
    base: "/",
    plugins: [removeRedirectsPlugin],
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
