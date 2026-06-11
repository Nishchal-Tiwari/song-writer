import { useEffect, useRef } from 'react'
import { Bot, Check, Loader2, Search, Sparkles, X } from 'lucide-react'
import CandidateCard from '@/components/CandidateCard'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

function ActivityItem({ item, isLatest }) {
  const Icon =
    item.kind === 'candidate'
      ? item.passed
        ? Check
        : X
      : item.kind === 'tool'
        ? Search
        : Sparkles

  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors',
        isLatest ? 'bg-primary/10 text-foreground' : 'text-muted-foreground',
      )}
    >
      <Icon
        className={cn(
          'mt-0.5 h-3.5 w-3.5 shrink-0',
          item.kind === 'candidate' && item.passed
            ? 'text-[hsl(var(--success))]'
            : item.kind === 'candidate'
              ? 'text-destructive'
              : 'text-primary',
        )}
      />
      <span className="leading-relaxed">{item.text}</span>
    </div>
  )
}

export default function GenerationStreamPanel({ streamState }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [streamState?.activity?.length, streamState?.candidates?.length])

  if (!streamState) {
    return null
  }

  const {
    status,
    round,
    maxRounds,
    toolCalls,
    attempts,
    activity = [],
    candidates = [],
    passedCandidate,
  } = streamState

  const progressPercent =
    maxRounds > 0 ? Math.min(100, Math.round((round / maxRounds) * 100)) : 0

  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
        <Bot className="h-4 w-4" />
      </div>

      <div className="max-w-[85%] flex-1 rounded-2xl rounded-tl-md border border-border bg-card px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <p className="text-sm font-medium">{status}</p>
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              Round {round}/{maxRounds}
            </Badge>
            <Badge variant="outline">{toolCalls} checks</Badge>
            <Badge variant="outline">{attempts} verse attempts</Badge>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {activity.length > 0 ? (
          <div className="mt-4 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border/60 bg-background/40 p-2">
            {activity.slice(-8).map((item, index) => (
              <ActivityItem
                key={item.id}
                item={item}
                isLatest={index === activity.slice(-8).length - 1}
              />
            ))}
          </div>
        ) : null}

        {passedCandidate ? (
          <div className="mt-4">
            <CandidateCard candidate={passedCandidate} index={1} passed />
          </div>
        ) : candidates.length > 0 ? (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-muted-foreground">
              Latest attempt (still refining…)
            </p>
            <CandidateCard
              candidate={candidates[candidates.length - 1]}
              index={candidates.length}
              passed={false}
            />
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
