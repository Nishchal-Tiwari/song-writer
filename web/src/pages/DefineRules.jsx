import { useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { api } from '@/api/client'
import AppShell from '@/components/layout/AppShell'
import StepIndicator from '@/components/layout/StepIndicator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

const DEFAULT_RULES = {
  name: 'Verse 1',
  rhymeScheme: 'ABBA',
  validateStress: false,
  lineConstraints: [
    { lineNumber: 1, syllableCount: 8, stressPattern: '01010101' },
    { lineNumber: 2, syllableCount: 10, stressPattern: '0101010101' },
    { lineNumber: 3, syllableCount: 10, stressPattern: '0101010101' },
    { lineNumber: 4, syllableCount: 8, stressPattern: '01010101' },
  ],
}

export default function DefineRules({ songId, onComplete, onCancel }) {
  const [rules, setRules] = useState(DEFAULT_RULES)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const updateLine = (index, field, value) => {
    setRules((current) => ({
      ...current,
      lineConstraints: current.lineConstraints.map((line, idx) =>
        idx === index
          ? {
              ...line,
              [field]: field === 'syllableCount' ? Number(value) : value,
            }
          : line,
      ),
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setSaving(true)
      setError('')
      await api.addSection(songId, rules)
      onComplete(songId)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell>
      <StepIndicator
        currentStep={2}
        steps={['Create song', 'Define rules', 'Chat']}
      />

      <Button variant="ghost" className="mb-4 -ml-2" onClick={onCancel}>
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Define rules</h1>
        <p className="mt-2 text-muted-foreground">
          Formal constraints only — meaning and imagery come later in chat.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Section template</CardTitle>
            <CardDescription>Rhyme scheme and line structure</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="section">Section name</Label>
              <Input
                id="section"
                value={rules.name}
                onChange={(event) =>
                  setRules((current) => ({ ...current, name: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rhyme">Rhyme scheme</Label>
              <Input
                id="rhyme"
                value={rules.rhymeScheme}
                onChange={(event) =>
                  setRules((current) => ({
                    ...current,
                    rhymeScheme: event.target.value.toUpperCase(),
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Validation mode</CardTitle>
            <CardDescription>
              Choose how strictly generated lines are checked.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between gap-4 rounded-lg border border-border/60 bg-background/40 p-4">
              <div className="space-y-1">
                <Label htmlFor="stress-toggle" className="text-sm font-medium">
                  Enforce stress patterns
                </Label>
                <p className="text-xs text-muted-foreground">
                  Syllables and rhyme are always checked. Stress is the most
                  restrictive constraint — leaving it off gives many more valid
                  results. Turn it on for strict metrical matching.
                </p>
              </div>
              <Switch
                id="stress-toggle"
                checked={rules.validateStress}
                onCheckedChange={(value) =>
                  setRules((current) => ({ ...current, validateStress: value }))
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          {rules.lineConstraints.map((line, index) => (
            <Card key={line.lineNumber}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Line {line.lineNumber}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="space-y-2">
                  <Label>Syllables</Label>
                  <Input
                    type="number"
                    min="1"
                    value={line.syllableCount}
                    onChange={(event) =>
                      updateLine(index, 'syllableCount', event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Stress pattern</Label>
                    {!rules.validateStress ? (
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Not enforced
                      </span>
                    ) : null}
                  </div>
                  <Input
                    value={line.stressPattern}
                    onChange={(event) =>
                      updateLine(index, 'stressPattern', event.target.value)
                    }
                    className={cn(
                      'font-mono text-xs',
                      !rules.validateStress && 'opacity-50',
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator />

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving} size="lg">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Start chatting'
            )}
          </Button>
        </div>
      </form>
    </AppShell>
  )
}
