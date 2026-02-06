# Rolldown JSX Panic: Vite 8 + Cloudflare + React

## Bug Summary

`@cloudflare/vite-plugin` sets `optimizeDeps.rolldownOptions.transform` to `{ target, define }` for
the SSR environment — **without a `jsx` property**. Meanwhile, `@vitejs/plugin-react` only sets
`transform.jsx` at the **top level**, which the Cloudflare plugin's per-environment config overwrites.

When the SSR dep optimizer encounters a package that ships raw `.tsx` source (common in monorepos with
workspace packages), Rolldown's `side_effect_detector` panics:

```
internal error: entered unreachable code: jsx should be transpiled
```

## Config Mismatch (visible with debug plugin)

```
[jsx-debug] env "client" optimizeDeps.rolldownOptions.transform:
  {"jsx":{"runtime":"automatic"}}                              ← ✅ has jsx

[jsx-debug] env "ssr" optimizeDeps.rolldownOptions.transform:
  {"target":"es2024","define":{...}}                           ← ❌ NO jsx
```

The client environment gets `jsx` from `viteReact()`; the SSR environment gets `target` + `define`
from `@cloudflare/vite-plugin` but **no `jsx`**.

## Trigger Conditions

The panic requires ALL of these:
1. **Vite 8** with Rolldown (native Rolldown dep optimization)
2. **`@cloudflare/vite-plugin`** creating an SSR environment with `viteEnvironment: { name: 'ssr' }`
3. **`@vitejs/plugin-react`** setting JSX config at top level only
4. **A package with raw `.tsx` source** in the SSR dep optimization graph

In a real monorepo (e.g., CRM with 50+ routes importing workspace packages like `@org/ui`
that ship `.tsx` source), the optimizer discovers and bundles these packages. Without JSX config,
Rolldown panics.

## Versions

| Package | Version |
|---------|---------|
| vite | 8.0.0-beta.13 |
| @vitejs/plugin-react | 5.1.2+ |
| @cloudflare/vite-plugin | 1.23.1 |
| @tanstack/react-start | 1.158.x |

## Reproduce

```bash
bun install
rm -rf node_modules/.vite
bun dev
```

Check the console output for the config mismatch in the `[jsx-debug]` lines.

**Note:** The actual panic requires a large enough dep graph with `.tsx` source packages.
This minimal repro demonstrates the config mismatch. In a full monorepo (47 routes, 124 SSR deps,
workspace packages with `.tsx` source), it panics consistently on a clean `.vite` cache.

## Root Cause

In `@cloudflare/vite-plugin/dist/index.mjs` (line ~21624):

```js
optimizeDeps: {
    ...isRolldown ? { rolldownOptions: {
        platform: "neutral",
        resolve: { conditionNames: [...], extensions: ... },
        transform: {
            target,         // ← sets target
            define: define  // ← sets define
            // ← NO jsx property!
        },
        plugins: [...]
    } } : { ... }
}
```

And in `@vitejs/plugin-react`:

```js
// Sets jsx at the TOP LEVEL only
optimizeDeps: { rolldownOptions: { transform: { jsx: { runtime: "automatic" } } } }
```

When Vite merges configs, the Cloudflare plugin's per-environment `transform: { target, define }`
**replaces** the top-level `transform: { jsx: {...} }` instead of merging with it.

## Workaround

Uncomment `jsxEnvFixPlugin()` in `vite.config.ts`, or add directly:

```ts
export default defineConfig({
  environments: {
    ssr: {
      optimizeDeps: {
        rolldownOptions: {
          transform: {
            jsx: { runtime: 'automatic', importSource: 'react' },
          },
        },
      },
    },
  },
})
```

## Fix Responsibility

**`@cloudflare/vite-plugin`** (primary): when setting `optimizeDeps.rolldownOptions.transform`
for the SSR environment, it should **merge** with the existing top-level transform config (preserving
the `jsx` property) rather than replacing it entirely.

**Rolldown** (secondary): should never panic on missing JSX config. Should emit a proper error like
"encountered JSX syntax but no JSX transform is configured" instead of
`internal error: entered unreachable code`.

**`@vitejs/plugin-react`** (minor): could set `transform.jsx` per-environment rather than only at
the top level, making it resilient to other plugins overwriting per-environment config.

## Related

- https://github.com/rolldown/rolldown/issues/8216
- Rolldown source: `crates/rolldown/src/ast_scanner/side_effect_detector/mod.rs:659`
