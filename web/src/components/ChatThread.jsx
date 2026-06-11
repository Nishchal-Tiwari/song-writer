import GenerationStreamPanel from '@/components/GenerationStreamPanel'
import { Bot, User } from 'lucide-react'
import CandidateCard from '@/components/CandidateCard'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

function AssistantResult({ metadata }) {
  if (metadata?.type !== 'generation_result' || !metadata.result) {
    return null
  }

  const { passed = [], rejected = [] } = metadata.result

  return (
    <div className="mt-4 space-y-3">
      {passed.length > 0 ? (
        <div className="space-y-3">
          {passed.map((candidate, index) => (
            <CandidateCard
              key={`passed-${index}`}
              candidate={candidate}
              index={index + 1}
              passed
            />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
          No lines passed validation. Try simpler rhyme words like room/moon or
          night/light.
        </p>
      )}

      {rejected.length > 0 ? (
        <details className="group">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
            {rejected.length} rejected candidates (debug)
          </summary>
          <div className="mt-3 space-y-3">
            {rejected.slice(0, 3).map((candidate, index) => (
              <CandidateCard
                key={`rejected-${index}`}
                candidate={candidate}
                index={index + 1}
                passed={false}
              />
            ))}
          </div>
        </details>
      ) : null}
    </div>
  )
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary',
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
          isUser
            ? 'rounded-tr-md bg-primary text-primary-foreground'
            : 'rounded-tl-md border border-border bg-card',
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {!isUser ? <AssistantResult metadata={message.metadataJson} /> : null}
      </div>
    </div>
  )
}

export default function ChatThread({ messages, generating, streamState }) {
  return (
    <ScrollArea className="h-[420px] pr-4">
      <div className="space-y-6 pb-4">
        {messages.length === 0 && !generating ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Bot className="h-7 w-7" />
            </div>
            <p className="max-w-sm text-sm text-muted-foreground">
              Describe what each line should say. Only lyrics that pass syllable,
              stress, and rhyme validation will be shown.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}

        {generating && streamState ? (
          <GenerationStreamPanel streamState={streamState} />
        ) : null}
      </div>
    </ScrollArea>
  )
}
