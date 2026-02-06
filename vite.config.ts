/**
 * Reproduction: Rolldown JSX panic in Cloudflare SSR environment
 *
 * Root cause: @cloudflare/vite-plugin sets the SSR environment's
 * `optimizeDeps.rolldownOptions.transform` to `{ target, define }` — without a
 * `jsx` property. @vitejs/plugin-react only sets `transform.jsx` at the TOP
 * level, which the per-environment config overwrites.
 *
 * When the SSR dep optimizer encounters a package that ships raw .tsx source
 * (common in monorepos), Rolldown's side_effect_detector panics:
 *   "internal error: entered unreachable code: jsx should be transpiled"
 *
 * To verify:
 *   1. bun install && rm -rf node_modules/.vite
 *   2. bun dev
 *   3. Check debug output — SSR env has NO jsx in its transform config
 *
 * Workaround: uncomment jsxEnvFixPlugin() below.
 */

import contentCollections from '@content-collections/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'

// Debug: shows the config mismatch between client and SSR environments.
// Client gets jsx config from viteReact(); SSR gets target+define from Cloudflare
// but NO jsx config.
function jsxDebugPlugin(): Plugin {
	return {
		name: 'jsx-debug',
		configResolved(config) {
			console.log('')
			const missing: string[] = []
			for (const [name, env] of Object.entries(config.environments || {})) {
				const envAny = env as any
				const jsx = envAny.optimizeDeps?.rolldownOptions?.transform?.jsx
				const hasJsx = jsx !== undefined
				const icon = hasJsx ? '✅' : '❌'
				console.log(`[jsx-debug] ${icon} env "${name}" transform.jsx: ${hasJsx ? JSON.stringify(jsx) : 'MISSING'}`)
				if (!hasJsx && envAny.optimizeDeps?.rolldownOptions?.transform) {
					missing.push(name)
				}
			}
			console.log('')
			if (missing.length > 0) {
				throw new Error(
					`\n\n🐛 BUG DETECTED: optimizeDeps.rolldownOptions.transform.jsx is MISSING for env "${missing.join('", "')}"\n\n` +
					`@cloudflare/vite-plugin sets transform to { target, define } for the SSR environment,\n` +
					`overwriting the { jsx } config from @vitejs/plugin-react.\n\n` +
					`In monorepos with workspace packages shipping raw .tsx source, this causes Rolldown to panic:\n` +
					`  "internal error: entered unreachable code: jsx should be transpiled"\n\n` +
					`➡️  Workaround: uncomment jsxEnvFixPlugin() in vite.config.ts\n`
				)
			}
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
		cloudflare({ viteEnvironment: { name: 'ssr' } }),
		tanstackStart(),
		viteReact(),
		contentCollections(),
		jsxDebugPlugin(),
		// ──────────────────────────────────────────
		// Uncomment the line below to fix the bug:
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
