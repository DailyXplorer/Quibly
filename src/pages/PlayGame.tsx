import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { TimerIcon, CrownIcon, CheckIcon, XIcon, FireIcon } from '@phosphor-icons/react'
import { GameSession, Quiz, Player, Question, Answer } from '@/types'
import type { Player as DbPlayer } from '@/lib/supabase'
import { useSupabase } from '@/hooks/useSupabase'
import { computeStreaks } from '@/lib/streaks'

interface PlayGameProps {
  session: GameSession | null
  quiz: Quiz | null
  player: Player | null
}

type ScoreboardPlayer = {
  id: string
  name: string
  score: number
  isHost: boolean
  streak: number
}

const getAnswerColorClass = (_: Answer['color'], selected: boolean, showCorrect: boolean, isCorrect: boolean) => {
  if (showCorrect) {
    if (isCorrect) return 'ring-4 ring-white/50 scale-105'
    return 'opacity-50'
  }
  if (selected) return 'ring-4 ring-white/50 scale-105'
  return ''
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

export function PlayGame({ session, quiz, player }: PlayGameProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [score, setScore] = useState(() => player?.score ?? 0)
  const [answerResult, setAnswerResult] = useState<{ isCorrect: boolean; pointsEarned: number; correctAnswerId: string | null } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [scoreboardPlayers, setScoreboardPlayers] = useState<ScoreboardPlayer[]>([])
  const [isLoadingScoreboard, setIsLoadingScoreboard] = useState(false)
  const { submitAnswer, getAnswerStats, getPlayers, subscribeToSession, getPlayerAnswers } = useSupabase()

  const currentQuestionIndex = session?.currentQuestionIndex ?? 0
  const currentQuestion: Question | undefined = quiz?.questions[currentQuestionIndex]
  const phase = session?.phase ?? 'question'
  const showResult = phase === 'results'
  const isScoreboardPhase = phase === 'scoreboard'
  const isQuestionPhase = phase === 'question'
  
  const [timeRemaining, setTimeRemaining] = useState(() => currentQuestion?.timeLimit ?? 0)
  const hasSubmittedRef = useRef(false)
  const [serverCorrectAnswerId, setServerCorrectAnswerId] = useState<string | null>(null)

  const handleAnswer = useCallback(async (answerId: string | null) => {
    if (!currentQuestion || !player || isSubmitting || hasSubmittedRef.current || phase !== 'question') return

    hasSubmittedRef.current = true
    setSelectedAnswer(answerId)
    setIsSubmitting(true)
    setSubmissionError(null)

    try {
      const result = await submitAnswer(player.id, currentQuestion.id, answerId, timeRemaining)
      const pointsEarned = result?.points_earned ?? 0
      setAnswerResult({
        isCorrect: result?.is_correct ?? false,
        pointsEarned,
        correctAnswerId: result?.correct_answer_id ?? null,
      })
      if (typeof result?.new_score === 'number') {
        setScore(result.new_score)
      } else {
        setScore(prev => prev + pointsEarned)
      }
    } catch (err) {
      console.error('Error submitting answer:', err)
      setAnswerResult(null)
      setSubmissionError('Impossible de valider la réponse pour le moment.')
    } finally {
      setIsSubmitting(false)
    }

  }, [currentQuestion, isSubmitting, phase, player, submitAnswer, timeRemaining])

  useEffect(() => {
    if (!player) return
    setScore(player.score)
  }, [player?.id, player?.score, player])

  useEffect(() => {
    if (!currentQuestion || !isQuestionPhase) return
    hasSubmittedRef.current = false
    setSelectedAnswer(null)
    setAnswerResult(null)
    setSubmissionError(null)
    setTimeRemaining(currentQuestion.timeLimit)
    setServerCorrectAnswerId(null)
  }, [currentQuestion, isQuestionPhase])

  useEffect(() => {
    if (!currentQuestion || !isQuestionPhase) return
    const startTime = session?.questionStartedAt ?? session?.updatedAt ?? new Date()
    const tick = () => {
      const elapsedSeconds = Math.floor((Date.now() - startTime.getTime()) / 1000)
      const remaining = Math.max(0, currentQuestion.timeLimit - elapsedSeconds)
      setTimeRemaining(remaining)
    }
    tick()
    const interval = setInterval(tick, 500)
    return () => clearInterval(interval)
  }, [currentQuestion, isQuestionPhase, session?.questionStartedAt, session?.updatedAt])

  useEffect(() => {
    if (!currentQuestion || !isQuestionPhase || hasSubmittedRef.current) return
    if (!session?.questionStartedAt) return
    const startTime = new Date(session.questionStartedAt)
    const elapsedMs = Date.now() - startTime.getTime()
    if (elapsedMs < currentQuestion.timeLimit * 1000) return
    if (timeRemaining === 0) {
      void handleAnswer(null)
    }
  }, [currentQuestion, handleAnswer, isQuestionPhase, session?.questionStartedAt, timeRemaining])

  useEffect(() => {
    if (!session?.id || !currentQuestion) return
    if (!showResult) return
    if (answerResult?.correctAnswerId || serverCorrectAnswerId) return
    void (async () => {
      try {
        const stats = await getAnswerStats(session.id, currentQuestion.id)
        setServerCorrectAnswerId(stats.correct_answer_id ?? null)
      } catch (err) {
        console.error('Erreur chargement bonne réponse :', err)
      }
    })()
  }, [answerResult?.correctAnswerId, currentQuestion, getAnswerStats, serverCorrectAnswerId, session?.id, showResult])

  const mapDbPlayers = useCallback((dbPlayers: DbPlayer[]): ScoreboardPlayer[] => {
    return dbPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      isHost: p.is_host,
      streak: 0,
    }))
  }, [])

  const scoreboardQuestionIds = useMemo(() => {
    if (!quiz) return []
    const endIndex = Math.min(currentQuestionIndex + 1, quiz.questions.length)
    return quiz.questions.slice(0, endIndex).map((question) => question.id)
  }, [currentQuestionIndex, quiz])

  const loadScoreboard = useCallback(async () => {
    if (!session?.id) return
    setIsLoadingScoreboard(true)
    try {
      const data = await getPlayers(session.id)
      const mappedPlayers = mapDbPlayers(data)
      let streaks: Record<string, number> = {}
      if (mappedPlayers.length > 0 && scoreboardQuestionIds.length > 0) {
        const playerIds = mappedPlayers.map((p) => p.id)
        const answers = await getPlayerAnswers(playerIds, scoreboardQuestionIds)
        streaks = computeStreaks(playerIds, scoreboardQuestionIds, answers)
      }
      setScoreboardPlayers(
        mappedPlayers.map((player) => ({
          ...player,
          streak: streaks[player.id] ?? 0,
        }))
      )
    } catch (err) {
      console.error('Erreur lors du chargement du classement :', err)
    } finally {
      setIsLoadingScoreboard(false)
    }
  }, [getPlayers, mapDbPlayers, session?.id, getPlayerAnswers, scoreboardQuestionIds])

  useEffect(() => {
    if (!isScoreboardPhase) return
    void loadScoreboard()
  }, [isScoreboardPhase, loadScoreboard])

  useEffect(() => {
    if (!session?.id || !isScoreboardPhase) return
    const unsubscribe = subscribeToSession(session.id, () => {
      void loadScoreboard()
    })
    return unsubscribe
  }, [isScoreboardPhase, loadScoreboard, session?.id, subscribeToSession])

  const resolvedCorrectAnswerId = answerResult?.correctAnswerId ?? serverCorrectAnswerId
  const canAnswer = isQuestionPhase
  const hasSelectedAnswer = Boolean(selectedAnswer)
  const isWaitingForResults = isQuestionPhase && hasSelectedAnswer
  const isAnswerCorrect = resolvedCorrectAnswerId
    ? selectedAnswer === resolvedCorrectAnswerId
    : (answerResult?.isCorrect ?? false)
  const pointsEarned = answerResult?.pointsEarned ?? 0
  const rankedPlayers = useMemo(() => {
    return scoreboardPlayers
      .filter((p) => !p.isHost)
      .sort((a, b) => b.score - a.score)
      .map((p, index) => ({
        ...p,
        rank: index + 1,
      }))
  }, [scoreboardPlayers])

  if (!currentQuestion) return null

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white p-4">
      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 border border-white/10">
          <CrownIcon className="w-5 h-5 text-[hsl(var(--answer-yellow))]" />
          <span className="font-medium">{score}</span>
        </div>
        <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 border border-white/10">
          <span className="text-sm text-white/60">Question</span>
          <span className="font-medium">{currentQuestionIndex + 1}/{quiz?.questions.length}</span>
        </div>
      </div>

      {!isScoreboardPhase && (
        <>
          <div className="mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <TimerIcon className="w-6 h-6" />
              <span className={`font-heading text-3xl font-medium ${timeRemaining <= 5 ? 'text-[hsl(var(--answer-red))]' : ''}`}>
                {timeRemaining}s
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  timeRemaining <= 5 ? 'bg-[hsl(var(--answer-red))]' : 'bg-[hsl(var(--answer-green))]'
                }`}
                style={{ width: `${(timeRemaining / currentQuestion.timeLimit) * 100}%` }}
              />
            </div>
          </div>

          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-medium leading-tight">
              {currentQuestion.text}
            </h2>
          </div>
        </>
      )}

      {!isScoreboardPhase && (
        <>
          {isWaitingForResults ? (
            <div className="max-w-3xl mx-auto">
              <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-white/10 bg-white/5 py-16">
                <div className="h-10 w-10 rounded-full border-4 border-white/20 border-t-white animate-spin" />
                <p className="text-lg font-medium text-white/90">En attente de la réponse</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {currentQuestion.answers.map((answer) => {
                const isSelected = selectedAnswer === answer.id
                const isCorrect = resolvedCorrectAnswerId === answer.id
                const canShowCorrect = showResult && resolvedCorrectAnswerId !== null
                
                return (
                  <button
                    key={answer.id}
                    onClick={() => canAnswer && handleAnswer(answer.id)}
                    disabled={!canAnswer}
                    className={`
                      relative h-28 sm:h-32 md:h-40 rounded-2xl font-medium text-lg sm:text-xl md:text-2xl
                      transition-all duration-300 transform hover:scale-105
                      ${getAnswerBgClass(answer.color)}
                      ${getAnswerShape(answer.color)}
                      ${getAnswerColorClass(answer.color, isSelected, canShowCorrect, isCorrect)}
                      ${canAnswer ? 'cursor-pointer shadow-lg hover:shadow-xl' : 'cursor-default'}
                    `}
                  >
                    <span className="relative z-10 px-4">{answer.text}</span>
                    
                    {showResult && isCorrect && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <CheckIcon className="w-12 h-12 text-white/80" />
                      </div>
                    )}
                    
                    {showResult && isSelected && !isCorrect && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl">
                        <XIcon className="w-12 h-12 text-white/80" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}

      {showResult && !isScoreboardPhase && (
        <div className="text-center mt-8 space-y-4">
          {submissionError ? (
            <div className="inline-flex items-center gap-2 bg-destructive/10 text-destructive px-6 py-3 rounded-full font-medium text-lg">
              <XIcon className="w-6 h-6" />
              {submissionError}
            </div>
          ) : !hasSelectedAnswer ? (
            <div className="inline-flex items-center gap-2 bg-white/20 text-white px-6 py-3 rounded-full font-medium text-xl">
              <TimerIcon className="w-6 h-6" />
              Temps écoulé
            </div>
          ) : isAnswerCorrect ? (
            <div className="inline-flex items-center gap-2 bg-[hsl(var(--answer-green))] text-white px-6 py-3 rounded-full font-medium text-xl">
              <CheckIcon className="w-6 h-6" />
              Bonne réponse ! +{pointsEarned} pts
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-[hsl(var(--answer-red))] text-white px-6 py-3 rounded-full font-medium text-xl">
              <XIcon className="w-6 h-6" />
              Mauvaise réponse
            </div>
          )}

        </div>
      )}

      {isScoreboardPhase && (
        <div className="max-w-3xl mx-auto mt-6 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-medium">Classement provisoire</h2>
          </div>
          {isLoadingScoreboard ? (
            <div className="text-center text-sm text-white/60">Chargement du classement...</div>
          ) : rankedPlayers.length === 0 ? (
            <div className="text-center text-sm text-white/60">Aucun joueur pour le moment.</div>
          ) : (
            <div className="space-y-3">
              {rankedPlayers.map((rankedPlayer) => {
                const isCurrentPlayer = rankedPlayer.id === player?.id
                return (
                  <div
                    key={rankedPlayer.id}
                    className={`
                      flex items-center justify-between gap-4 rounded-2xl border px-4 py-3
                      ${isCurrentPlayer ? 'border-white/40 bg-white/10' : 'border-white/10 bg-white/5'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center font-medium">
                        #{rankedPlayer.rank}
                      </div>
                      <div>
                        <p className="font-medium text-white">{rankedPlayer.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {rankedPlayer.streak >= 2 && (
                          <div className="flex items-center gap-1">
                            <FireIcon className="w-4 h-4 text-[hsl(var(--answer-yellow))]" />
                            {rankedPlayer.streak > 2 && (
                              <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-xs font-medium text-white/80">
                                {rankedPlayer.streak - 1}
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-lg font-medium text-white">{rankedPlayer.score}</p>
                      </div>
                      <p className="text-xs text-white/60">pts</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
