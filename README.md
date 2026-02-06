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

## Reproduce

```bash
bun install
bun dev
```

The dev server fails immediately with:

```
[jsx-debug] ✅ env "client" transform.jsx: {"runtime":"automatic"}
[jsx-debug] ❌ env "ssr" transform.jsx: MISSING

🐛 BUG DETECTED: optimizeDeps.rolldownOptions.transform.jsx is MISSING for env "ssr"

@cloudflare/vite-plugin sets transform to { target, define } for the SSR environment,
overwriting the { jsx } config from @vitejs/plugin-react.
```

The client environment gets `jsx` from `viteReact()`; the SSR environment gets `target` + `define`
from `@cloudflare/vite-plugin` but **no `jsx`**.

### Apply the workaround

Uncomment `jsxEnvFixPlugin()` in `vite.config.ts`:

```
[jsx-debug] ✅ env "client" transform.jsx: {"runtime":"automatic"}
[jsx-debug] ✅ env "ssr" transform.jsx: {"runtime":"automatic","importSource":"react"}

VITE v8.0.0-beta.13  ready in 2147 ms
```

## How This Causes a Panic in Real Projects

This repro includes `@repro/ui` — a local package that ships raw `.tsx` source (via `postinstall`
script into `node_modules`). It demonstrates the missing config.

In a real monorepo (e.g., App with 50+ routes, 124 SSR deps, workspace packages like `@org/ui`
that ship `.tsx` source), the SSR dep optimizer discovers and bundles these packages. At scale, the
missing JSX config causes Rolldown's `side_effect_detector` to panic consistently on a clean
`.vite` cache.

## Versions

| Package | Version |
|---------|---------|
| vite | 8.0.0-beta.13 |
| @vitejs/plugin-react | 5.1.2+ |
| @cloudflare/vite-plugin | 1.23.1 |
| @tanstack/react-start | 1.158.x |

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

Uncomment `jsxEnvFixPlugin()` in `vite.config.ts`, or add to your own config:

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
