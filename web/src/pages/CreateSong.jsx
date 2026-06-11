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

export default function CreateSong({ onCreated, onCancel }) {
  const [title, setTitle] = useState('Little Boy At Night')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!title.trim()) {
      return
    }

    try {
      setSaving(true)
      setError('')
      const song = await api.createSong(title.trim())
      onCreated(song.id)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell>
      <StepIndicator
        currentStep={1}
        steps={['Create song', 'Define rules', 'Chat']}
      />

      <Button variant="ghost" className="mb-4 -ml-2" onClick={onCancel}>
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Button>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Create song project</CardTitle>
          <CardDescription>
            Enter a title for your song. You&apos;ll define syllable and stress
            rules in the next step.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Song title</Label>
              <Input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Little Boy At Night"
              />
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Continue to rules'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  )
}
