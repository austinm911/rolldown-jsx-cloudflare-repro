import { type ReactNode, useState } from 'react'

export interface TabsProps {
  children?: ReactNode
  defaultTab?: string
}

export function Tabs({ children, defaultTab }: TabsProps) {
  const [active, setActive] = useState(defaultTab)
  return (
    <div className="tabs" data-active={active}>
      <div className="tab-list" role="tablist">
        {children}
      </div>
    </div>
  )
}

export function TabPanel({ children }: { children?: ReactNode }) {
  return <div className="tab-panel" role="tabpanel">{children}</div>
}
