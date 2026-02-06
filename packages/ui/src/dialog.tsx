import { type ReactNode } from 'react'

export interface DialogProps {
  children?: ReactNode
  className?: string
  variant?: 'default' | 'primary' | 'secondary' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

export function Dialog({ children, className, variant = 'default', size = 'md' }: DialogProps) {
  return (
    <div className={className} data-variant={variant} data-size={size}>
      <div className="inner">
        <span className="label">{children}</span>
      </div>
    </div>
  )
}
