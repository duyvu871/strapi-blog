import { defineConfig, type Options } from "tsup";

export default defineConfig((options: Options) => ({
    ...options,
    entry: ["./src/index.ts"],
    format: ["cjs"],
    clean: true, // clean the dist folder before bundling
    // bundle: true, // bundle all dependencies, except "devDependencies"
    // dts: true, // enable .d.ts generation
    tsconfig: "./tsconfig.json",
    // platform: 'node',
    // watch: "./src/**/*",
    banner: ({ format }) => {
        if (format === "esm") return ({
            js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
        })
        return {}
    },
}));