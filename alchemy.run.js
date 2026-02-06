// Minimal alchemy run script — mirrors apps/crm/alchemy.run.ts
import alchemy from 'alchemy'
import { TanStackStart } from 'alchemy/cloudflare'
import { FileSystemStateStore } from 'alchemy/state'

const app = await alchemy('repro', {
	stateStore: (scope) => new FileSystemStateStore(scope),
})

const PORT = 5173

export const frontend = await TanStackStart('frontend', {
	adopt: true,
	compatibility: 'node',
	bindings: {
		PORT_NUMBER: PORT.toString(),
	},
	dev: {
		command: `vite dev --port=${PORT}`,
	},
})

console.log(`Frontend -> ${frontend.url}`)

await app.finalize()
