import { createContext, useCallback, useContext, useMemo } from 'react'
import type { AnswerColor, GameSession, Quiz } from '@/types'
import type { Player as DbPlayer } from '@/lib/supabase'
import type { PlayerAnswerRecord } from '@/lib/streaks'
import type { SupabaseApi } from '@/hooks/useSupabase'

export const isDemo = import.meta.env.VITE_DEMO_MODE === 'true'

export const REPO_URL = 'https://github.com/DailyXplorer/Quibly'

const ANSWER_COLORS: AnswerColor[] = ['red', 'blue', 'yellow', 'green']
const TIME_LIMIT = 20
const POINTS = 1000

const QUESTIONS = [
  { text: 'Quelle est la capitale de l\'Australie ?', answers: ['Sydney', 'Canberra', 'Melbourne', 'Perth'], correct: 1 },
  { text: 'Combien de côtés compte un hexagone ?', answers: ['Cinq', 'Six', 'Sept', 'Huit'], correct: 1 },
  { text: 'Quelle planète est surnommée la planète rouge ?', answers: ['Vénus', 'Jupiter', 'Mars', 'Saturne'], correct: 2 },
]

export const DEMO_QUIZ: Quiz = {
  id: 'demo-quiz',
  title: 'Culture générale',
  description: 'Un quiz de démonstration en trois questions',
  code: 'DEMO42',
  createdAt: new Date(0),
  questions: QUESTIONS.map((question, questionIndex) => ({
    id: `demo-q${questionIndex}`,
    text: question.text,
    timeLimit: TIME_LIMIT,
    points: POINTS,
    answers: question.answers.map((text, answerIndex) => ({
      id: `demo-q${questionIndex}-a${answerIndex}`,
      text,
      color: ANSWER_COLORS[answerIndex],
      isCorrect: answerIndex === question.correct,
    })),
  })),
}

/** Each pick is [answer index, seconds taken to answer], one per question. */
const PLAYERS: { name: string; picks: [number, number][] }[] = [
  { name: 'Camille', picks: [[1, 4], [1, 3], [2, 5]] },
  { name: 'Léo', picks: [[0, 6], [1, 5], [2, 4]] },
  { name: 'Inès', picks: [[1, 7], [1, 9], [0, 6]] },
  { name: 'Hugo', picks: [[1, 3], [2, 4], [2, 8]] },
  { name: 'Manon', picks: [[2, 10], [1, 7], [2, 3]] },
]

const isCorrectPick = (questionIndex: number, [answerIndex]: [number, number]) =>
  QUESTIONS[questionIndex].correct === answerIndex

const pointsFor = (questionIndex: number, pick: [number, number]) =>
  isCorrectPick(questionIndex, pick) ? Math.round(POINTS * (1 - pick[1] / TIME_LIMIT / 2)) : 0

const scoredQuestionCount = (session: GameSession) => {
  if (session.status === 'waiting') return 0
  if (session.status === 'finished') return QUESTIONS.length
  return session.currentQuestionIndex + (session.phase === 'question' ? 0 : 1)
}

const elapsedSeconds = (session: GameSession) =>
  (Date.now() - (session.questionStartedAt?.getTime() ?? 0)) / 1000

export type DemoTour = {
  session: GameSession
  onSessionUpdate: (updates: Parameters<SupabaseApi['updateSessionState']>[1]) => void
}

export const DemoTourContext = createContext<DemoTour | null>(null)

const unavailable = () => Promise.reject(new Error('Indisponible en mode démo'))
const noopSubscription = () => () => {}

export function useDemoSupabase(): SupabaseApi {
  const tour = useContext(DemoTourContext)
  const session = tour?.session ?? null
  const onSessionUpdate = tour?.onSessionUpdate

  const getPlayers = useCallback(async (): Promise<DbPlayer[]> => {
    const scored = session ? scoredQuestionCount(session) : 0
    return PLAYERS.map((player, index) => ({
      id: `demo-p${index}`,
      session_id: session?.id ?? '',
      user_id: null,
      name: player.name,
      score: player.picks.slice(0, scored).reduce((total, pick, questionIndex) => total + pointsFor(questionIndex, pick), 0),
      is_host: false,
      joined_at: '',
    }))
  }, [session])

  const getAnswerStats = useCallback(async (_sessionId: string, questionId: string) => {
    const questionIndex = DEMO_QUIZ.questions.findIndex((question) => question.id === questionId)
    const question = DEMO_QUIZ.questions[questionIndex]
    const isLive = session?.phase === 'question' && session.currentQuestionIndex === questionIndex
    const elapsed = session && isLive ? elapsedSeconds(session) : Infinity
    const picks = PLAYERS.map((player) => player.picks[questionIndex]).filter(([, seconds]) => seconds <= elapsed)
    return {
      total_players: PLAYERS.length,
      total_answers: picks.length,
      correct_answer_id: question.answers.find((answer) => answer.isCorrect)?.id ?? null,
      answers: question.answers.map((answer, answerIndex) => ({
        id: answer.id,
        text: answer.text,
        color: answer.color,
        count: picks.filter(([picked]) => picked === answerIndex).length,
      })),
    }
  }, [session])

  const getPlayerAnswers = useCallback(async (_playerIds: string[], questionIds: string[]): Promise<PlayerAnswerRecord[]> => {
    return PLAYERS.flatMap((player, playerIndex) =>
      questionIds.map((questionId) => {
        const questionIndex = DEMO_QUIZ.questions.findIndex((question) => question.id === questionId)
        return {
          playerId: `demo-p${playerIndex}`,
          questionId,
          isCorrect: isCorrectPick(questionIndex, player.picks[questionIndex]),
          answeredAt: new Date(0).toISOString(),
        }
      })
    )
  }, [])

  const updateSessionState = useCallback(async (_sessionId: string, updates: Parameters<DemoTour['onSessionUpdate']>[0]) => {
    onSessionUpdate?.(updates)
  }, [onSessionUpdate])

  return useMemo(() => ({
    loading: false,
    error: null,
    userId: null,
    ensureAuth: unavailable,
    createQuiz: unavailable,
    getQuizByCode: unavailable,
    createGameSession: unavailable,
    joinGame: unavailable,
    getPlayers,
    updateSessionStatus: unavailable,
    updateSessionState,
    submitAnswer: unavailable,
    getWaitingSessionByCode: unavailable,
    getAnswerStats,
    getPlayerAnswers,
    advanceSessionPhase: unavailable,
    getSessionById: unavailable,
    getPlayerById: unavailable,
    getPlayerBySession: unavailable,
    removePlayer: unavailable,
    deleteGameSession: unavailable,
    subscribeToSession: noopSubscription,
    subscribeToGameSession: noopSubscription,
    notifyPlayersChanged: unavailable,
  }), [getAnswerStats, getPlayerAnswers, getPlayers, updateSessionState])
}
