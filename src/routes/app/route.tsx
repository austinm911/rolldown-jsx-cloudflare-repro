import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/route')({
	component: AppLayout,
})

function AppLayout() {
	return (
		<div className="min-h-screen bg-gray-50">
			<nav className="border-b bg-white p-4">
				<span className="font-semibold">Repro App</span>
			</nav>
			<main className="p-6">
				<Outlet />
			</main>
		</div>
	)
}
