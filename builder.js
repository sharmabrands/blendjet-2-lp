let { build } = require("esbuild");

build({
  entryPoints: ["index.js"],
  outfile: "./dist/index.js",
  minify: false,
  bundle: true,
  sourcemap: true,
}).catch(() => process.exit(1));
