import { Suspense, lazy, useCallback, useLayoutEffect, useMemo, useState } from 'react'
import { CaretLeftIcon, CaretRightIcon, DownloadSimpleIcon } from '@phosphor-icons/react'
import { Button as CustomButton } from '@/components/ui/custom-button'
import { DEMO_QUIZ, DemoTourContext, REPO_URL, type DemoTour } from '@/demo'
import type { GameSession } from '@/types'

const Home = lazy(() => import('@/pages/Home').then((module) => ({ default: module.Home })))
const Terms = lazy(() => import('@/pages/Terms').then((module) => ({ default: module.Terms })))
const Privacy = lazy(() => import('@/pages/Privacy').then((module) => ({ default: module.Privacy })))
const GameLobby = lazy(() => import('@/pages/GameLobby').then((module) => ({ default: module.GameLobby })))
const HostGame = lazy(() => import('@/pages/HostGame').then((module) => ({ default: module.HostGame })))
const Results = lazy(() => import('@/pages/Results').then((module) => ({ default: module.Results })))

type DemoView = 'home' | 'terms' | 'privacy' | 'tour'

type TourStep = Pick<GameSession, 'status' | 'phase' | 'currentQuestionIndex'>

const LAST_QUESTION_INDEX = DEMO_QUIZ.questions.length - 1

const STEPS: TourStep[] = [
  { status: 'waiting', phase: 'question', currentQuestionIndex: 0 },
  ...DEMO_QUIZ.questions.flatMap((_, currentQuestionIndex) =>
    (['question', 'results', 'scoreboard'] as const).map((phase) => ({ status: 'playing' as const, phase, currentQuestionIndex }))
  ),
  { status: 'finished', phase: 'scoreboard', currentQuestionIndex: LAST_QUESTION_INDEX },
]

const PHASE_LABELS: Record<TourStep['phase'], string> = {
  question: 'chrono en cours',
  results: 'réponses',
  scoreboard: 'classement',
}

const stepLabel = (step: TourStep) => {
  if (step.status === 'waiting') return 'Salle d\'attente'
  if (step.status === 'finished') return 'Podium final'
  return `Question ${step.currentQuestionIndex + 1} · ${PHASE_LABELS[step.phase]}`
}

const findStepIndex = (target: TourStep) =>
  STEPS.findIndex((step) =>
    step.status === target.status
    && (step.status !== 'playing' || (step.phase === target.phase && step.currentQuestionIndex === target.currentQuestionIndex))
  )

const openRepo = () => window.open(REPO_URL, '_blank', 'noopener,noreferrer')

const scrollToTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' })

type TourState = { stepIndex: number; startedAt: Date }

function Tour({ onExit }: { onExit: () => void }) {
  const [tour, setTour] = useState<TourState>(() => ({ stepIndex: 0, startedAt: new Date() }))
  const step = STEPS[tour.stepIndex]
  const isLastStep = tour.stepIndex === STEPS.length - 1

  const goTo = useCallback((stepIndex: number) => {
    const startedAt = new Date()
    setTour((prev) => (prev.stepIndex === stepIndex ? prev : { stepIndex, startedAt }))
  }, [])

  const onSessionUpdate = useCallback<DemoTour['onSessionUpdate']>((updates) => {
    setTour((prev) => {
      const current = STEPS[prev.stepIndex]
      const next = findStepIndex({
        status: updates.status ?? current.status,
        phase: updates.phase ?? current.phase,
        currentQuestionIndex: updates.currentQuestionIndex ?? current.currentQuestionIndex,
      })
      return next === -1 || next === prev.stepIndex ? prev : { stepIndex: next, startedAt: new Date() }
    })
  }, [])

  const value = useMemo<DemoTour>(() => ({
    session: {
      ...step,
      id: 'demo-session',
      quizId: DEMO_QUIZ.id,
      code: DEMO_QUIZ.code,
      players: [],
      hostId: 'demo-host',
      questionStartedAt: tour.startedAt,
      startedAt: null,
      endedAt: null,
      updatedAt: null,
    },
    onSessionUpdate,
  }), [onSessionUpdate, step, tour.startedAt])

  useLayoutEffect(scrollToTop, [tour.stepIndex])

  return (
    <DemoTourContext.Provider value={value}>
      <div className="pb-24">
        {step.status === 'waiting' ? (
          <GameLobby
            session={value.session}
            quiz={DEMO_QUIZ}
            onStart={() => onSessionUpdate({ status: 'playing', phase: 'question', currentQuestionIndex: 0 })}
            onBack={onExit}
            isHost
          />
        ) : step.status === 'playing' ? (
          <HostGame key={tour.stepIndex} session={value.session} quiz={DEMO_QUIZ} onQuit={onExit} />
        ) : (
          <Results session={value.session} onBack={onExit} />
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-[var(--background)]">
        <div className="container mx-auto max-w-4xl px-6 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0 text-sm">
            <p className="font-medium text-foreground">
              Démo {tour.stepIndex + 1}/{STEPS.length}
            </p>
            <p className="hidden sm:block truncate text-muted-foreground">{stepLabel(step)}</p>
          </div>
          <div className="flex gap-2">
            <CustomButton
              variant="secondary"
              onClick={() => goTo(tour.stepIndex - 1)}
              disabled={tour.stepIndex === 0}
              icon={<CaretLeftIcon className="w-4 h-4" />}
              className="px-4 sm:px-6"
            >
              Précédent
            </CustomButton>
            {isLastStep ? (
              <CustomButton
                variant="primary"
                onClick={openRepo}
                icon={<DownloadSimpleIcon className="w-4 h-4" />}
                className="px-4 sm:px-6"
              >
                Télécharger le code
              </CustomButton>
            ) : (
              <CustomButton
                variant="primary"
                onClick={() => goTo(tour.stepIndex + 1)}
                icon={<CaretRightIcon className="w-4 h-4" />}
                className="px-4 sm:px-6"
              >
                Suivant
              </CustomButton>
            )}
          </div>
        </div>
      </div>
    </DemoTourContext.Provider>
  )
}

const initialView = (): DemoView => {
  const hash = window.location.hash.replace('#', '').trim().toLowerCase()
  if (hash === 'conditions') return 'terms'
  if (hash === 'confidentialite') return 'privacy'
  return 'home'
}

export function DemoApp() {
  const [view, setView] = useState<DemoView>(initialView)
  const goHome = useCallback(() => setView('home'), [])
  const openTerms = useCallback(() => setView('terms'), [])
  const openPrivacy = useCallback(() => setView('privacy'), [])

  useLayoutEffect(scrollToTop, [view])

  const renderView = () => {
    switch (view) {
      case 'home':
        return <Home onStartDemo={() => setView('tour')} onOpenTerms={openTerms} onOpenPrivacy={openPrivacy} />
      case 'terms':
        return <Terms onBack={goHome} onOpenTerms={openTerms} onOpenPrivacy={openPrivacy} />
      case 'privacy':
        return <Privacy onBack={goHome} onOpenTerms={openTerms} onOpenPrivacy={openPrivacy} />
      case 'tour':
        return <Tour onExit={goHome} />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Suspense
        fallback={
          <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
            Chargement...
          </div>
        }
      >
        {renderView()}
      </Suspense>
    </div>
  )
}
