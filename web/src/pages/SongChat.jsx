import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Loader2, Send } from 'lucide-react'
import { api } from '@/api/client'
import AppShell from '@/components/layout/AppShell'
import StepIndicator from '@/components/layout/StepIndicator'
import ChatThread from '@/components/ChatThread'
import ConstraintsSummary from '@/components/ConstraintsSummary'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

const STARTER_PROMPT = `Write the first verse.

Line 1:
Introduce the boy alone.

Line 2:
Describe the quiet room.

Line 3:
Show vulnerability.

Line 4:
Strong visual image.`

const INITIAL_STREAM_STATE = {
  status: 'Starting…',
  round: 0,
  maxRounds: 20,
  toolCalls: 0,
  attempts: 0,
  activity: [],
  candidates: [],
  passedCandidate: null,
}

function createActivityItem(kind, text, passed = false) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    text,
    passed,
  }
}

export default function SongChat({ songId, onBack }) {
  const [song, setSong] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [streamState, setStreamState] = useState(null)
  const [error, setError] = useState('')
  const [chatInput, setChatInput] = useState(STARTER_PROMPT)
  const abortRef = useRef(null)
  const activityCounter = useRef(0)

  const section = song?.sections?.[0] ?? null

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const [songData, messageData] = await Promise.all([
          api.getSong(songId),
          api.getMessages(songId),
        ])
        setSong(songData)
        setMessages(messageData)
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [songId])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const handleStreamEvent = (event, data) => {
    if (event === 'user_message') {
      setMessages((current) => {
        const withoutPending = current.filter(
          (message) => !String(message.id).startsWith('pending-user-'),
        )
        const exists = withoutPending.some((message) => message.id === data.id)
        if (exists) {
          return withoutPending
        }
        return [...withoutPending, data]
      })
      return
    }

    if (event === 'progress') {
      setStreamState((current) => {
        const next = { ...(current ?? INITIAL_STREAM_STATE) }

        if (data.type === 'status') {
          next.status = data.message
        }

        if (data.type === 'progress') {
          next.round = data.round
          next.maxRounds = data.maxRounds
          next.toolCalls = data.toolCalls
          next.attempts = data.attempts
        }

        if (data.type === 'tool') {
          next.status = data.summary
          next.activity = [
            ...(next.activity ?? []),
            createActivityItem('tool', data.summary),
          ].slice(-12)
        }

        if (data.type === 'candidate') {
          const label = data.candidate.passed
            ? `Valid verse found on attempt ${data.attempt}`
            : `Attempt ${data.attempt} did not pass all constraints`
          next.status = data.candidate.passed
            ? 'Valid verse found — saving result…'
            : `Attempt ${data.attempt} rejected — trying again…`
          next.attempts = data.attempt
          next.candidates = [...(next.candidates ?? []), data.candidate].slice(-3)
          if (data.candidate.passed) {
            next.passedCandidate = data.candidate
          }
          next.activity = [
            ...(next.activity ?? []),
            createActivityItem('candidate', label, data.candidate.passed),
          ].slice(-12)
        }

        return next
      })
      return
    }

    if (event === 'complete') {
      setMessages((current) => {
        const withoutAssistant = current.filter(
          (message) => message.id !== data.assistantMessage.id,
        )
        const hasAssistant = current.some(
          (message) => message.id === data.assistantMessage.id,
        )
        if (hasAssistant) {
          return current
        }
        return [...withoutAssistant, data.assistantMessage]
      })
      setStreamState(null)
      setGenerating(false)
      return
    }

    if (event === 'error') {
      setError(data.message || 'Generation failed')
      setStreamState(null)
      setGenerating(false)
    }
  }

  const handleAsk = async (event) => {
    event.preventDefault()
    if (!section || !chatInput.trim() || generating) {
      return
    }

    const content = chatInput.trim()
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    activityCounter.current += 1

    setGenerating(true)
    setError('')
    setStreamState({
      ...INITIAL_STREAM_STATE,
      status: 'Sending your request…',
    })

    setMessages((current) => [
      ...current,
      {
        id: `pending-user-${activityCounter.current}`,
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      },
    ])

    try {
      let completed = false

      await api.askForLyricsStream(
        song.id,
        section.id,
        content,
        (event, data) => {
          if (event === 'complete') {
            completed = true
          }
          handleStreamEvent(event, data)
        },
        controller.signal,
      )

      if (!completed) {
        setStreamState(null)
        setGenerating(false)
      }
    } catch (askError) {
      if (askError.name !== 'AbortError') {
        setError(askError.message)
      }
      setStreamState(null)
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <AppShell className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </AppShell>
    )
  }

  if (!song || !section) {
    return (
      <AppShell>
        <Alert variant="destructive">
          <AlertDescription>{error || 'Song setup is incomplete.'}</AlertDescription>
        </Alert>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <StepIndicator
        currentStep={3}
        steps={['Create song', 'Define rules', 'Chat']}
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button variant="ghost" className="-ml-2 mb-2" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            All projects
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{song.title}</h1>
          <p className="mt-2 text-muted-foreground">
            Chat with the assistant. Only validated lyrics are shown.
          </p>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mb-6">
        <ConstraintsSummary section={section} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
          <CardDescription>
            Describe meaning per line. The AI validates syllables, stress, and rhyme
            before showing results — progress streams live below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ChatThread
            messages={messages}
            generating={generating}
            streamState={streamState}
          />

          <form onSubmit={handleAsk} className="space-y-3 border-t border-border pt-4">
            <Textarea
              rows={6}
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Describe what each line should say..."
              className="resize-none"
              disabled={generating}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={generating} size="lg">
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Working…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Syllable accuracy ~98–99% · Stress ~85–95% · Lexical stress only
      </p>
    </AppShell>
  )
}
