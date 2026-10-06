import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TimerIcon, CaretRightIcon, CheckIcon, CaretLeftIcon, FireIcon } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button as CustomButton } from '@/components/ui/custom-button'
import type { GameSession, Player as UiPlayer, Quiz, Answer } from '@/types'
import type { Player as DbPlayer } from '@/lib/supabase'
import { useSupabase } from '@/hooks/useSupabase'
import { computeStreaks } from '@/lib/streaks'

type AnswerStat = {
  id: string
  text: string
  color: 'red' | 'blue' | 'yellow' | 'green'
  count: number
}

type AnswerStats = {
  total_players: number
  total_answers: number
  correct_answer_id: string | null
  answers: AnswerStat[]
}

type PlayerWithStreak = UiPlayer & { streak: number }

interface HostGameProps {
  session: GameSession | null
  quiz: Quiz | null
  onQuit: () => void
}

const getAnswerBgClass = (color: Answer['color']) => {
  switch (color) {
    case 'red': return 'bg-[hsl(var(--answer-red))]'
    case 'blue': return 'bg-[hsl(var(--answer-blue))]'
    case 'yellow': return 'bg-[hsl(var(--answer-yellow))] text-foreground'
    case 'green': return 'bg-[hsl(var(--answer-green))]'
  }
}

const getAnswerShape = (color: Answer['color']) => {
  switch (color) {
    case 'red': return 'rounded-tr-2xl'
    case 'blue': return 'rounded-tl-2xl'
    case 'yellow': return 'rounded-br-2xl'
    case 'green': return 'rounded-bl-2xl'
  }
}

export function HostGame({ session, quiz, onQuit }: HostGameProps) {
  const phase = session?.phase ?? 'question'
  const currentQuestionIndex = session?.currentQuestionIndex ?? 0
  const currentQuestion = quiz?.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex >= ((quiz?.questions.length ?? 1) - 1)

  const [players, setPlayers] = useState<PlayerWithStreak[]>([])
  const [answerStats, setAnswerStats] = useState<(AnswerStats & { questionId: string }) | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(() => currentQuestion?.timeLimit ?? 0)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [hasTimerStarted, setHasTimerStarted] = useState(false)
  const hasAutoAdvancedRef = useRef(false)
  const { getPlayers, subscribeToSession, getAnswerStats, updateSessionState, getPlayerAnswers } = useSupabase()

  const mapDbPlayers = useCallback((dbPlayers: DbPlayer[]): PlayerWithStreak[] => {
    return dbPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      answers: [],
      isHost: p.is_host,
      userId: p.user_id ?? '',
      streak: 0,
    }))
  }, [])

  const scoreboardQuestionIds = useMemo(() => {
    if (!quiz) return []
    const endIndex = Math.min(currentQuestionIndex + 1, quiz.questions.length)
    return quiz.questions.slice(0, endIndex).map((question) => question.id)
  }, [currentQuestionIndex, quiz])

  const loadPlayers = useCallback(async () => {
    if (!session?.id) return
    try {
      const data = await getPlayers(session.id)
      const mappedPlayers = mapDbPlayers(data)
      let streaks: Record<string, number> = {}
      if (phase === 'scoreboard' && mappedPlayers.length > 0 && scoreboardQuestionIds.length > 0) {
        const playerIds = mappedPlayers.map((player) => player.id)
        const answers = await getPlayerAnswers(playerIds, scoreboardQuestionIds)
        streaks = computeStreaks(playerIds, scoreboardQuestionIds, answers)
      }
      setPlayers(
        mappedPlayers.map((player) => ({
          ...player,
          streak: streaks[player.id] ?? 0,
        }))
      )
    } catch (err) {
      console.error('Erreur lors du chargement des joueurs :', err)
    }
  }, [getPlayers, mapDbPlayers, session?.id, phase, getPlayerAnswers, scoreboardQuestionIds])

  const loadAnswerStats = useCallback(async () => {
    if (!session?.id || !currentQuestion) return
    const hasCurrentStats = answerStats?.questionId === currentQuestion.id
    if (!hasCurrentStats) {
      setIsLoadingStats(true)
    }
    try {
      const stats = await getAnswerStats(session.id, currentQuestion.id)
      setAnswerStats({ ...stats, questionId: currentQuestion.id })
    } catch (err) {
      console.error('Erreur lors du chargement des réponses :', err)
    } finally {
      setIsLoadingStats(false)
    }
  }, [answerStats?.questionId, currentQuestion, getAnswerStats, session?.id])

  useEffect(() => {
    void loadPlayers()
  }, [loadPlayers])

  useEffect(() => {
    if (!session?.id) return
    const unsubscribe = subscribeToSession(session.id, () => {
      void loadPlayers()
    })
    return unsubscribe
  }, [loadPlayers, session?.id, subscribeToSession])

  useEffect(() => {
    if (!currentQuestion || phase === 'scoreboard') return
    void loadAnswerStats()
    const interval = setInterval(loadAnswerStats, phase === 'question' ? 1000 : 2000)
    return () => clearInterval(interval)
  }, [currentQuestion, loadAnswerStats, phase])

  useEffect(() => {
    if (!currentQuestion || phase !== 'question') return
    setTimeRemaining(currentQuestion.timeLimit)
    setHasTimerStarted(false)
    const startTime = session?.questionStartedAt ?? session?.updatedAt ?? new Date()
    const tick = () => {
      const elapsedSeconds = Math.floor((Date.now() - startTime.getTime()) / 1000)
      const remaining = Math.max(0, currentQuestion.timeLimit - elapsedSeconds)
      setTimeRemaining(remaining)
      setHasTimerStarted(true)
    }
    tick()
    const interval = setInterval(tick, 500)
    return () => clearInterval(interval)
  }, [currentQuestion, phase, session?.questionStartedAt, session?.updatedAt])

  useEffect(() => {
    if (phase === 'question') {
      hasAutoAdvancedRef.current = false
    }
  }, [phase, currentQuestionIndex, session?.id])

  const handleShowScoreboard = async () => {
    if (!session?.id) return
    await updateSessionState(session.id, { phase: 'scoreboard' })
  }

  const totalPlayers = useMemo(() => {
    return players.filter((p) => !p.isHost).length
  }, [players])

  const rankedPlayers = useMemo(() => {
    return players
      .filter((p) => !p.isHost)
      .sort((a, b) => b.score - a.score)
  }, [players])

  const currentStats = currentQuestion && answerStats?.questionId === currentQuestion.id ? answerStats : null

  const answersWithCounts = useMemo(() => {
    if (!currentQuestion) return []
    const statsMap = new Map(currentStats?.answers.map((answer) => [answer.id, answer]) ?? [])
    return currentQuestion.answers.map((answer) => ({
      ...answer,
      count: statsMap.get(answer.id)?.count ?? 0
    }))
  }, [currentQuestion, currentStats?.answers])

  const totalAnswers = currentStats?.total_answers ?? 0
  const totalPlayersForStats = currentStats?.total_players ?? totalPlayers
  const correctAnswerId = currentStats?.correct_answer_id ?? null

  useEffect(() => {
    if (phase !== 'question' || !session?.id) return
    if (hasAutoAdvancedRef.current) return
    const everyoneAnswered = totalPlayersForStats > 0 && totalAnswers >= totalPlayersForStats
    const timeIsUp = hasTimerStarted && timeRemaining <= 0
    if (!everyoneAnswered && !timeIsUp) return
    hasAutoAdvancedRef.current = true
    void (async () => {
      try {
        await updateSessionState(session.id, { phase: 'results' })
      } catch (err) {
        console.error('Erreur lors du passage automatique aux résultats :', err)
        hasAutoAdvancedRef.current = false
      }
    })()
  }, [phase, hasTimerStarted, session?.id, timeRemaining, totalAnswers, totalPlayersForStats, updateSessionState])

  const handleNextQuestion = async () => {
    if (!session?.id || !quiz) return
    const now = new Date().toISOString()
    await updateSessionState(session.id, {
      currentQuestionIndex: currentQuestionIndex + 1,
      phase: 'question',
      questionStartedAt: now,
    })
  }

  const handleFinishGame = async () => {
    if (!session?.id) return
    const now = new Date().toISOString()
    await updateSessionState(session.id, { status: 'finished', endedAt: now })
  }

  if (!currentQuestion) return null

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-6xl space-y-6">
        <div className="flex justify-end">
          <CustomButton
            variant="secondary"
            onClick={onQuit}
            icon={<CaretLeftIcon className="w-4 h-4" />}
          >
            Quitter la partie
          </CustomButton>
        </div>
        <div className="text-center space-y-3">
          <p className="text-sm uppercase tracking-wider text-muted-foreground">
            Question {currentQuestionIndex + 1} / {quiz?.questions.length}
          </p>
          <h1 className="text-3xl md:text-4xl font-medium text-foreground">
            {currentQuestion.text}
          </h1>
          <div className="flex items-center justify-center gap-3 text-muted-foreground">
            <TimerIcon className="w-5 h-5" />
            <span className="text-lg font-medium">{timeRemaining}s</span>
            <span className="text-sm">·</span>
            <span className="text-sm">{totalAnswers}/{totalPlayers} réponses</span>
          </div>
        </div>

        {phase === 'question' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {currentQuestion.answers.map((answer) => (
              <div
                key={answer.id}
                className={`
                  relative h-28 md:h-36 rounded-2xl font-medium text-lg md:text-xl
                  flex items-center justify-center text-center px-4
                  ${getAnswerBgClass(answer.color)}
                  ${getAnswerShape(answer.color)}
                  opacity-90
                `}
              >
                {answer.text}
              </div>
            ))}
          </div>
        )}

        {phase === 'question' && (
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">En attente des réponses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[hsl(var(--answer-green))] transition-all duration-500"
                  style={{ width: totalPlayersForStats > 0 ? `${Math.min(100, Math.round((totalAnswers / totalPlayersForStats) * 100))}%` : '0%' }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {phase === 'results' && (
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Répartition des réponses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingStats && !currentStats ? (
                <p className="text-sm text-muted-foreground">Chargement des réponses...</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {answersWithCounts.map((answer) => {
                    const percentage = totalPlayersForStats > 0 ? Math.round((answer.count / totalPlayersForStats) * 100) : 0
                    const isCorrect = correctAnswerId === answer.id
                    return (
                      <div key={answer.id} className="space-y-3">
                        <div className="flex items-end h-40 bg-muted/50 rounded-xl p-3">
                          <div
                            className={`w-full rounded-lg transition-all duration-500 ${getAnswerBgClass(answer.color)}`}
                            style={{ height: `${Math.max(4, percentage)}%` }}
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-base font-medium text-foreground">{answer.text}</p>
                          <p className="text-sm text-muted-foreground">{answer.count} réponse(s)</p>
                          {isCorrect && (
                            <span className="inline-flex items-center gap-1 text-sm text-[hsl(var(--answer-green))]">
                              <CheckIcon className="w-4 h-4" />
                              Bonne réponse
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="flex justify-end">
                <CustomButton
                  variant="primary"
                  onClick={handleShowScoreboard}
                  icon={<CaretRightIcon className="w-5 h-5" />}
                >
                  Afficher le classement
                </CustomButton>
              </div>
            </CardContent>
          </Card>
        )}

        {phase === 'scoreboard' && (
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Classement provisoire</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rankedPlayers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun joueur pour le moment.</p>
              ) : (
                <div className="space-y-3">
                  {rankedPlayers.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-muted/40 rounded-xl border border-border transition-all duration-500"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-medium">
                          {(player.name?.[0] ?? '?').toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground break-words">{player.name}</p>
                          <p className="text-sm text-muted-foreground">#{index + 1}</p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="flex items-center justify-start gap-2 sm:justify-end">
                          {player.streak >= 2 && (
                            <div className="flex items-center gap-1">
                              <FireIcon className="w-4 h-4 text-[hsl(var(--answer-yellow))]" />
                              {player.streak > 2 && (
                                <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 text-xs font-medium text-foreground/80">
                                  {player.streak - 1}
                                </span>
                              )}
                            </div>
                          )}
                          <p className="text-lg font-medium text-foreground">{player.score}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">pts</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end">
                {isLastQuestion ? (
                  <CustomButton
                    variant="primary"
                    onClick={handleFinishGame}
                    icon={<CaretRightIcon className="w-5 h-5" />}
                  >
                    Terminer la partie
                  </CustomButton>
                ) : (
                  <CustomButton
                    variant="primary"
                    onClick={handleNextQuestion}
                    icon={<CaretRightIcon className="w-5 h-5" />}
                  >
                    Question suivante
                  </CustomButton>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
