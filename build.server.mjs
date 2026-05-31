import * as esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await esbuild.build({
  entryPoints: [path.join(__dirname, "server/index.ts")],
  bundle: true,
  platform: "node",
  target: "node20",
  outfile: path.join(__dirname, "dist/server/index.js"),
  format: "esm",
  packages: "external",
  plugins: [
    {
      name: "path-alias",
      setup(build) {
        build.onResolve({ filter: /^@\// }, (args) => ({
          path: path.resolve(__dirname, "server", args.path.slice(2)),
        }));
        build.onResolve({ filter: /^@shared\// }, (args) => ({
          path: path.resolve(__dirname, "shared", args.path.slice(8)),
        }));
      },
    },
  ],
});

console.log("Server build complete → dist/server/index.js");
