/**
 * Reproduction: Rolldown JSX panic in Cloudflare SSR environment
 *
 * Root cause: @cloudflare/vite-plugin sets the SSR environment's
 * `optimizeDeps.rolldownOptions.transform` to `{ target, define }` — with NO
 * `jsx` property. Meanwhile, @vitejs/plugin-react only sets `jsx` at the
 * TOP-LEVEL `optimizeDeps.rolldownOptions.transform`, which the per-environment
 * config from Cloudflare overwrites.
 *
 * When the SSR dep optimizer bundles a package that ships raw .tsx source,
 * Rolldown's side_effect_detector panics:
 *   "internal error: entered unreachable code: jsx should be transpiled"
 *
 * The debug plugin below logs the config mismatch. In a large monorepo with
 * workspace packages that ship .tsx source (not pre-compiled), the optimizer
 * processes these as SSR deps and panics.
 *
 * To verify:
 *   1. bun install && rm -rf node_modules/.vite
 *   2. bun dev
 *   3. Check debug output — SSR env has NO jsx in its transform config
 *
 * Workaround: uncomment jsxEnvFixPlugin() below.
 */

import contentCollections from '@content-collections/vite'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import alchemy from 'alchemy/cloudflare/tanstack-start'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'

// Debug: shows the config mismatch between client and SSR environments.
// Client gets jsx config from viteReact(); SSR gets target+define from Cloudflare
// but NO jsx config.
function jsxDebugPlugin(): Plugin {
	return {
		name: 'jsx-debug',
		configResolved(config) {
			console.log('\n[jsx-debug] Top-level oxc:', JSON.stringify((config as any).oxc?.jsx))
			for (const [name, env] of Object.entries(config.environments || {})) {
				const envAny = env as any
				const transform = envAny.optimizeDeps?.rolldownOptions?.transform
				console.log(`[jsx-debug] env "${name}" optimizeDeps.rolldownOptions.transform:`, JSON.stringify(transform))
			}
			console.log()
		},
	}
}

// Workaround: inject JSX config into the SSR environment's optimizeDeps.
// This merges with the Cloudflare plugin's transform config, adding the
// missing jsx property.
function jsxEnvFixPlugin(): Plugin {
	return {
		name: 'jsx-env-fix',
		config() {
			return {
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
			}
		},
	}
}

export default defineConfig({
	plugins: [
		tailwindcss(),
		alchemy(),
		tanstackStart({
			router: { routeToken: 'layout' },
		}),
		viteReact(),
		contentCollections(),
		jsxDebugPlugin(),
		// ──────────────────────────────────────────
		// Uncomment the line below to fix the panic:
		// jsxEnvFixPlugin(),
		// ──────────────────────────────────────────
	],

	// In a real monorepo, workspace packages that ship raw .tsx source are
	// automatically discovered and pre-bundled by the SSR dep optimizer.
	// Include @repro/ui here to simulate that scenario.
	ssr: {
		optimizeDeps: {
			include: ['@repro/ui'],
		},
	},
})
