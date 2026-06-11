import { Music2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AppShell({ children, className }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 md:px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Music2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">Lyric Validator</p>
            <p className="text-xs text-muted-foreground">Songwriting assistant</p>
          </div>
        </div>
      </header>
      <main className={cn('mx-auto max-w-5xl px-4 py-8 md:px-6', className)}>
        {children}
      </main>
    </div>
  )
}
