import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function ConstraintsSummary({ section }) {
  if (!section) {
    return null
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{section.name}</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Rhyme {section.rhymeScheme}</Badge>
            <Badge variant={section.validateStress ? 'default' : 'outline'}>
              {section.validateStress
                ? 'Syllables + Stress + Rhyme'
                : 'Syllables + Rhyme'}
            </Badge>
          </div>
        </div>
        {!section.validateStress ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Stress patterns shown for reference but not enforced.
          </p>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2">
          {section.lineConstraints.map((constraint) => (
            <div
              key={constraint.id ?? constraint.lineNumber}
              className="rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm"
            >
              <span className="font-medium">Line {constraint.lineNumber}</span>
              <span className="text-muted-foreground">
                {' '}
                · {constraint.syllableCount} syllables ·{' '}
                <code
                  className={
                    'rounded bg-muted px-1 py-0.5 font-mono text-xs' +
                    (section.validateStress ? '' : ' opacity-50')
                  }
                >
                  {constraint.stressPattern}
                </code>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
