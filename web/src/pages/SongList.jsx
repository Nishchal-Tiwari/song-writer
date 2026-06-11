import { useEffect, useState } from 'react'
import { Plus, ChevronRight, Music, Loader2 } from 'lucide-react'
import { api } from '@/api/client'
import AppShell from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function SongList({ onCreate, onOpen }) {
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getSongs()
      .then(setSongs)
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <AppShell className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your projects</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Create a song, define formal rules, then chat for lyric suggestions
            validated against syllable count, stress, and rhyme.
          </p>
        </div>
        <Button onClick={onCreate} size="lg">
          <Plus className="h-4 w-4" />
          New song
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {songs.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Music className="h-7 w-7" />
            </div>
            <CardTitle>No songs yet</CardTitle>
            <CardDescription>
              Start by creating a song project and defining your verse constraints.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <Button onClick={onCreate}>
              <Plus className="h-4 w-4" />
              Create your first song
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {songs.map((song) => {
            const ready = song.sections?.length > 0
            return (
              <Card
                key={song.id}
                className="cursor-pointer transition-all hover:border-primary/40 hover:shadow-primary/5"
                onClick={() => onOpen(song.id, ready ? 'chat' : 'rules')}
              >
                <CardContent className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
                      <Music className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold">{song.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {ready ? 'Ready to chat' : 'Setup incomplete'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={ready ? 'success' : 'secondary'}>
                      {ready ? 'Active' : 'Draft'}
                    </Badge>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </AppShell>
  )
}
