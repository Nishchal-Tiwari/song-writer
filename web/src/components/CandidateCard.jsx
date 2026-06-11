import { useState } from 'react'
import { Check, X, ChevronDown, ChevronUp, Minus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default function CandidateCard({ candidate, index, passed }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card
      className={cn(
        'overflow-hidden',
        passed
          ? 'border-[hsl(var(--success)/0.35)] bg-[hsl(var(--success)/0.05)]'
          : 'border-destructive/30 bg-destructive/5',
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium">
          {passed ? 'Valid suggestion' : `Rejected #${index}`}
        </CardTitle>
        <Badge variant={passed ? 'success' : 'destructive'}>
          {passed ? 'PASS' : 'REJECTED'}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {candidate.lines.map((line, lineIndex) => (
            <p
              key={lineIndex}
              className="rounded-lg bg-background/50 px-3 py-2 text-sm leading-relaxed"
            >
              {line}
            </p>
          ))}
        </div>

        {passed ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Hide details
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show validation
              </>
            )}
          </Button>
        ) : null}

        {(expanded || !passed) && candidate.validation?.lines?.length ? (
          <div className="space-y-2 rounded-lg border border-border/60 bg-background/30 p-3">
            {candidate.validation.lines.map((validation) => (
              <div key={validation.lineNumber} className="space-y-1 text-xs">
                <p className="font-medium">Line {validation.lineNumber}</p>
                <div className="flex flex-wrap gap-3 text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    {validation.syllablesMatch ? (
                      <Check className="h-3 w-3 text-[hsl(var(--success))]" />
                    ) : (
                      <X className="h-3 w-3 text-destructive" />
                    )}
                    {validation.actual.syllableCount}/{validation.expected.syllableCount}{' '}
                    syllables
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono">
                    {validation.stressValidated ? (
                      validation.stressMatch ? (
                        <Check className="h-3 w-3 text-[hsl(var(--success))]" />
                      ) : (
                        <X className="h-3 w-3 text-destructive" />
                      )
                    ) : (
                      <Minus className="h-3 w-3 text-muted-foreground" />
                    )}
                    {validation.actual.stressPattern}
                    {!validation.stressValidated ? (
                      <span className="ml-1 font-sans text-[10px] uppercase tracking-wide text-muted-foreground">
                        info
                      </span>
                    ) : null}
                  </span>
                </div>
                {validation.failures?.map((failure) => (
                  <p key={failure} className="text-destructive">
                    {failure}
                  </p>
                ))}
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
