import { createFileRoute } from '@tanstack/react-router'
import { DndContext } from '@dnd-kit/core'
import { SortableContext } from '@dnd-kit/sortable'
import { motion } from 'motion/react'
import { Home, Settings, Users, BarChart } from 'lucide-react'
import { Toaster, toast } from 'sonner'

export const Route = createFileRoute('/app/dashboard')({
	component: DashboardPage,
})

function DashboardPage() {
	return (
		<DndContext>
			<SortableContext items={[]}>
				<div className="space-y-4">
					<motion.h1
						className="text-xl font-bold"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
					>
						Dashboard
					</motion.h1>
					<div className="grid grid-cols-4 gap-4">
						<div className="rounded border bg-white p-4">
							<Home className="h-5 w-5" />
							<span>Properties</span>
						</div>
						<div className="rounded border bg-white p-4">
							<Users className="h-5 w-5" />
							<span>Contacts</span>
						</div>
						<div className="rounded border bg-white p-4">
							<BarChart className="h-5 w-5" />
							<span>Analytics</span>
						</div>
						<div className="rounded border bg-white p-4">
							<Settings className="h-5 w-5" />
							<span>Settings</span>
						</div>
					</div>
					<Toaster />
				</div>
			</SortableContext>
		</DndContext>
	)
}
