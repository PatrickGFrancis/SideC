'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'

import { cn } from '@/lib/utils'

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-secondary/30',
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          'h-full w-full flex-1 bg-gradient-to-r from-primary to-accent transition-all duration-300',
          value === undefined && 'animate-pulse' // Indeterminate state for processing
        )}
        style={{ 
          transform: value !== undefined 
            ? `translateX(-${100 - (value || 0)}%)` 
            : 'translateX(0%)' // Full width when indeterminate
        }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }