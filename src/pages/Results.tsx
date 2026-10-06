import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button as CustomButton } from '@/components/ui/custom-button'
import type { GameSession, Player as UiPlayer } from '@/types'
import type { Player as DbPlayer } from '@/lib/supabase'
import { useSupabase } from '@/hooks/useSupabase'
import { CaretLeftIcon } from '@phosphor-icons/react'

interface ResultsProps {
  session: GameSession | null
  onBack: () => void
}

const getRankStyle = (rank: number) => {
  switch (rank) {
    case 1:
      return 'bg-[hsl(var(--answer-yellow))]/10 border-[hsl(var(--answer-yellow))]'
    case 2:
      return 'bg-secondary/70 border-border'
    case 3:
      return 'bg-muted/70 border-border'
    default:
      return 'bg-background border-border'
  }
}

const getRankBadgeStyle = (rank: number) => {
  switch (rank) {
    case 1:
      return 'bg-[hsl(var(--answer-yellow))] text-white'
    case 2:
      return 'bg-foreground text-background'
    case 3:
      return 'bg-muted text-foreground'
    default:
      return 'bg-secondary text-foreground'
  }
}

const getPodiumBadgeStyle = (rank: number) => {
  switch (rank) {
    case 1:
      return 'bg-[hsl(var(--answer-yellow))] text-white'
    case 2:
      return 'bg-foreground text-background'
    case 3:
      return 'bg-muted text-foreground'
    default:
      return 'bg-secondary text-foreground'
  }
}

export function Results({ session, onBack }: ResultsProps) {
  const [players, setPlayers] = useState<UiPlayer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { getPlayers } = useSupabase()

  const mapDbPlayers = useCallback((dbPlayers: DbPlayer[]): UiPlayer[] => {
    return dbPlayers
      .filter((p) => !p.is_host)
      .map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        answers: [],
        isHost: p.is_host,
        userId: p.user_id ?? '',
      }))
  }, [])

  const loadPlayers = useCallback(async () => {
    if (!session?.id) return
    setIsLoading(true)
    try {
      const data = await getPlayers(session.id)
      setPlayers(mapDbPlayers(data))
    } catch (err) {
      console.error('Erreur lors du chargement des résultats :', err)
    } finally {
      setIsLoading(false)
    }
  }, [getPlayers, mapDbPlayers, session?.id])

  useEffect(() => {
    void loadPlayers()
  }, [loadPlayers])

  const rankedPlayers = useMemo(() => {
    return [...players]
      .sort((a, b) => b.score - a.score)
      .map((p, index) => ({
        ...p,
        rank: index + 1,
      }))
  }, [players])

  const winner = rankedPlayers[0]
  const podiumItems = useMemo(() => {
    const first = rankedPlayers[0]
    const second = rankedPlayers[1]
    const third = rankedPlayers[2]

    return [
      { rank: 2, player: second, height: 'h-28 sm:h-32', lift: 'translate-y-2 sm:translate-y-1' },
      { rank: 1, player: first, height: 'h-36 sm:h-40', lift: '-translate-y-2 sm:-translate-y-3' },
      { rank: 3, player: third, height: 'h-24 sm:h-28', lift: 'translate-y-4 sm:translate-y-3' },
    ]
  }, [rankedPlayers])

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="container mx-auto max-w-3xl space-y-10">
        <div className="flex items-center justify-between">
          <CustomButton
            variant="secondary"
            onClick={onBack}
            icon={<CaretLeftIcon className="w-5 h-5" />}
          >
            Retour à l'accueil
          </CustomButton>
        </div>

        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-medium text-foreground">
            Classement final
          </h1>
          <p className="text-lg text-muted-foreground">
            {winner ? (
              <>
                Félicitations à <span className="font-medium text-foreground">{winner.name}</span>
              </>
            ) : (
              'Aucun joueur pour le moment.'
            )}
          </p>
        </div>

        {rankedPlayers.length > 0 && (
          <div className="grid grid-cols-3 items-end gap-4">
            {podiumItems.map((item) => (
              <div key={item.rank} className={`flex flex-col items-center gap-3 ${item.lift}`}>
                <div className={`rounded-full px-3 py-1 text-xs font-medium ${getPodiumBadgeStyle(item.rank)}`}>
                  {item.rank === 1 ? '1er' : item.rank === 2 ? '2e' : '3e'}
                </div>
                <div className={`w-full rounded-2xl border shadow-lg ${getRankStyle(item.rank)} ${item.height}`}>
                  <div className="flex h-full flex-col items-center justify-end pb-4">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-medium ${getRankBadgeStyle(item.rank)}`}>
                      {(item.player?.name?.[0] ?? '?').toUpperCase()}
                    </div>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {item.player?.name ?? '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.player ? `${item.player.score} pts` : ' '}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium">Classement final</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="p-6 text-sm text-muted-foreground">Chargement des résultats...</div>
            ) : rankedPlayers.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">Aucun résultat disponible.</div>
            ) : (
              rankedPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-border"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-medium">
                      #{player.rank}
                    </div>
                    <p className="font-medium text-foreground">{player.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-medium text-foreground">{player.score}</p>
                    <p className="text-sm text-muted-foreground">points</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <CustomButton
          variant="primary"
          onClick={onBack}
          className="w-full"
        >
          Nouvelle partie
        </CustomButton>
      </div>
    </div>
  )
}
