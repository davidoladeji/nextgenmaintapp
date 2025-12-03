'use client'

import * as React from 'react'
import * as ProgressPrimitives from '@radix-ui/react-progress'

import { cn } from '@/lib/utils'

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitives.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitives.Root
    ref={ref}
    className={cn(
      'relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700',
      className
    )}
    {...props}
  >
    <ProgressPrimitives.Indicator
      className="h-full w-full flex-1 bg-gray-900 dark:bg-slate-100 transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitives.Root>
))
Progress.displayName = ProgressPrimitives.Root.displayName

export { Progress }
