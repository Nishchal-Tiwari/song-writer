import { cn } from '@/lib/utils'

export default function StepIndicator({ currentStep, steps }) {
  return (
    <div className="mb-8 flex items-center gap-2">
      {steps.map((step, index) => {
        const stepNumber = index + 1
        const active = stepNumber === currentStep
        const done = stepNumber < currentStep

        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                active && 'bg-primary text-primary-foreground shadow-md shadow-primary/25',
                done && 'bg-success/20 text-[hsl(var(--success))]',
                !active && !done && 'bg-muted text-muted-foreground',
              )}
            >
              {stepNumber}
            </div>
            <span
              className={cn(
                'hidden text-sm sm:inline',
                active ? 'font-medium text-foreground' : 'text-muted-foreground',
              )}
            >
              {step}
            </span>
            {index < steps.length - 1 ? (
              <div className="mx-2 hidden h-px w-8 bg-border sm:block" />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
