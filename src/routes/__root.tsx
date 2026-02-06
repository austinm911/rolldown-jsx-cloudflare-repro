import { Outlet, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
	component: RootLayout,
	head: () => ({
		meta: [
			{ charSet: 'UTF-8' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
			{ title: 'Rolldown JSX Repro' },
		],
	}),
})

function RootLayout() {
	return (
		<html lang="en">
			<head />
			<body>
				<Outlet />
			</body>
		</html>
	)
}
