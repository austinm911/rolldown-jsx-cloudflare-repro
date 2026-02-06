import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { Plus, Filter, Download, Search } from 'lucide-react'

export const Route = createFileRoute('/app/properties')({
	component: PropertiesPage,
})

function PropertiesPage() {
	return (
		<div className="space-y-4">
			<motion.h1 className="text-xl font-bold" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
				Properties
			</motion.h1>
			<div className="flex gap-2">
				<div className="flex items-center gap-1 rounded border px-3 py-1.5">
					<Search className="h-4 w-4" />
					<input placeholder="Search..." className="outline-none" />
				</div>
				<button className="flex items-center gap-1 rounded bg-blue-500 px-3 py-1.5 text-white">
					<Plus className="h-4 w-4" /> Create
				</button>
				<button className="flex items-center gap-1 rounded border px-3 py-1.5">
					<Filter className="h-4 w-4" /> Filter
				</button>
				<button className="flex items-center gap-1 rounded border px-3 py-1.5">
					<Download className="h-4 w-4" /> Export
				</button>
			</div>
			<div className="grid grid-cols-3 gap-4">
				{Array.from({ length: 9 }, (_, i) => (
					<motion.div
						key={i}
						className="rounded border bg-white p-3"
						initial={{ y: 10, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ delay: i * 0.05 }}
					>
						<div className="text-sm font-medium">Properties Item {i + 1}</div>
						<div className="text-xs text-gray-500">Description</div>
					</motion.div>
				))}
			</div>
		</div>
	)
}
