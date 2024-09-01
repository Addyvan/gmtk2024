import fs from "fs-extra";
import esbuild from "esbuild";
import express from "express";
import cors from "cors";
import open from "open";

const onBuild = (error, result) => {
  console.log(result);
  if (error) {
    console.error(error);
    return;
  }

  console.log(`Listening at http://localhost:${process.env.PORT || 3000} 🚀!`);

  fs.copySync(`./public/`, `./dist/`);
};

async function build() {
  const ctx = await esbuild.context({
    entryPoints: [
      "src/index.tsx",
    ],
    outdir: "dist/",
    bundle: true,
    minify: false,
    treeShaking: false,
    sourcemap: true,
    loader: {
      ".png": "dataurl",
      ".jpg": "dataurl",
      ".gif": "dataurl",
      ".wasm": "dataurl",
      ".ttf": "dataurl",
    },
    external: [],
    define: {},
    plugins: [
      {
        name: "rebuild-notify",
        setup(build) {
          build.onEnd((result) => {
            onBuild(null, result);
          });
        },
      },
    ],
  });

  const app = express();

  app.use(cors({ origin: "*" }));

  app.use((_, res, next) => {
    res.setHeader("X-Frame-Options", "ALLOW-FROM *");
    // Required for SharedArrayBuffer to work?
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    next();
  });
  app.use(express.static("dist"));

  const port = process.env.PORT || 3000;

  app.listen(port, () => {
    open(`http://localhost:${port}`);
  });

  await ctx.watch();
}

build().catch((err) => {
  console.error(err);
});
