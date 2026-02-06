import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
	component: Home,
})

function Home() {
	return (
		<div className="p-8">
			<h1 className="text-2xl font-bold">Rolldown JSX Repro</h1>
			<p className="mt-2 text-gray-600">If you see this, the bug is fixed (or not enough routes to trigger it).</p>
		</div>
	)
}
