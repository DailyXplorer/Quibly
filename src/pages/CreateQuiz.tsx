import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Button as CustomButton } from '@/components/ui/custom-button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Question, Quiz, Answer } from '@/types'
import {
  CaretLeftIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  ClockIcon,
  CrownIcon
} from '@phosphor-icons/react'
import { v4 as uuidv4 } from 'uuid'

interface CreateQuizProps {
  onSubmit: (quiz: Omit<Quiz, 'id' | 'createdAt' | 'code'>) => void
  onBack: () => void
  isLoading?: boolean
}

type Step = 1 | 2 | 3

const DEFAULT_TIME_LIMIT = 20
const DEFAULT_POINTS = 1000
const DRAFT_STORAGE_KEY = 'quibly:create-quiz-draft'
const DRAFT_VERSION = 1

type CreateQuizDraft = {
  version: number
  currentStep: Step
  title: string
  description: string
  globalTimeLimit: number
  globalPoints: number
  questions: Question[]
  selectedQuestionId: string | null
  currentQuestion: string
  currentAnswers: Answer[]
  lastUpdatedAt: string
}

const stepLabels: Record<Step, string> = {
  1: 'Informations générales',
  2: 'Questions',
  3: 'Réglages & validation'
}

const createEmptyAnswers = (): Answer[] => [
  { id: uuidv4(), text: '', isCorrect: false, color: 'red' },
  { id: uuidv4(), text: '', isCorrect: false, color: 'blue' },
  { id: uuidv4(), text: '', isCorrect: false, color: 'yellow' },
  { id: uuidv4(), text: '', isCorrect: false, color: 'green' }
]

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const isFilled = (value: string) => value.trim().length > 0
const isStep = (value: unknown): value is Step =>
  value === 1 || value === 2 || value === 3

const ANSWER_COLORS: Answer['color'][] = ['red', 'blue', 'yellow', 'green']
const isAnswerColor = (value: unknown): value is Answer['color'] =>
  ANSWER_COLORS.includes(value as Answer['color'])

const isAnswerArray = (value: unknown): value is Answer[] =>
  Array.isArray(value) &&
  value.every((answer) => {
    if (!answer || typeof answer !== 'object') return false
    const record = answer as Record<string, unknown>
    return typeof record.id === 'string'
      && typeof record.text === 'string'
      && isAnswerColor(record.color)
  })

const isQuestionArray = (value: unknown): value is Question[] =>
  Array.isArray(value) &&
  value.every((question) => {
    if (!question || typeof question !== 'object') return false
    const record = question as Record<string, unknown>
    return typeof record.id === 'string'
      && typeof record.text === 'string'
      && typeof record.timeLimit === 'number'
      && typeof record.points === 'number'
      && isAnswerArray(record.answers)
  })

const isQuestionComplete = (question: Question) => {
  if (!isFilled(question.text)) return false
  if (!question.answers.every((answer) => isFilled(answer.text))) return false
  return question.answers.some((answer) => Boolean(answer.isCorrect))
}

const getAnswerDotClass = (color: Answer['color']) => {
  switch (color) {
    case 'red':
      return 'bg-[hsl(var(--answer-red))]'
    case 'blue':
      return 'bg-[hsl(var(--answer-blue))]'
    case 'yellow':
      return 'bg-[hsl(var(--answer-yellow))]'
    case 'green':
      return 'bg-[hsl(var(--answer-green))]'
  }
}

const readDraft = (): CreateQuizDraft | null => {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<CreateQuizDraft>
    if (!parsed || parsed.version !== DRAFT_VERSION) return null
    return parsed as CreateQuizDraft
  } catch {
    return null
  }
}

const writeDraft = (draft: CreateQuizDraft) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
  } catch (err) {
    console.error('Erreur lors de la sauvegarde du brouillon :', err)
  }
}

const clearDraft = () => {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(DRAFT_STORAGE_KEY)
}

export function CreateQuiz({ onSubmit, onBack, isLoading }: CreateQuizProps) {
  const initialDraft = useMemo(() => readDraft(), [])
  const answerInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const [currentStep, setCurrentStep] = useState<Step>(() =>
    isStep(initialDraft?.currentStep) ? initialDraft.currentStep : 1
  )
  const [title, setTitle] = useState(() => initialDraft?.title ?? '')
  const [description, setDescription] = useState(() => initialDraft?.description ?? '')
  const [globalTimeLimit, setGlobalTimeLimit] = useState(() =>
    typeof initialDraft?.globalTimeLimit === 'number'
      ? clampNumber(initialDraft.globalTimeLimit, 5, 60)
      : DEFAULT_TIME_LIMIT
  )
  const [globalPoints, setGlobalPoints] = useState(() =>
    typeof initialDraft?.globalPoints === 'number'
      ? clampNumber(initialDraft.globalPoints, 500, 1000)
      : DEFAULT_POINTS
  )
  const [questions, setQuestions] = useState<Question[]>(() =>
    isQuestionArray(initialDraft?.questions) ? initialDraft.questions : []
  )

  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(() =>
    typeof initialDraft?.selectedQuestionId === 'string' ? initialDraft.selectedQuestionId : null
  )
  const [currentQuestion, setCurrentQuestion] = useState(() => initialDraft?.currentQuestion ?? '')
  const [currentAnswers, setCurrentAnswers] = useState<Answer[]>(() =>
    isAnswerArray(initialDraft?.currentAnswers) ? initialDraft.currentAnswers : createEmptyAnswers()
  )

  useEffect(() => {
    const draft: CreateQuizDraft = {
      version: DRAFT_VERSION,
      currentStep,
      title,
      description,
      globalTimeLimit,
      globalPoints,
      questions,
      selectedQuestionId,
      currentQuestion,
      currentAnswers,
      lastUpdatedAt: new Date().toISOString(),
    }
    writeDraft(draft)
  }, [
    currentStep,
    title,
    description,
    globalTimeLimit,
    globalPoints,
    questions,
    selectedQuestionId,
    currentQuestion,
    currentAnswers,
  ])

  const totalQuestions = questions.length
  const completedQuestions = useMemo(
    () => questions.filter((question) => isQuestionComplete(question)),
    [questions]
  )
  const totalTime = useMemo(
    () => questions.reduce((sum, question) => sum + question.timeLimit, 0),
    [questions]
  )
  const averageTime = totalQuestions > 0 ? Math.round(totalTime / totalQuestions) : 0

  const canProceedToQuestions = isFilled(title)
  const canProceedToSettings = completedQuestions.length > 0

  const isCurrentComplete =
    isFilled(currentQuestion) &&
    currentAnswers.every((answer) => isFilled(answer.text)) &&
    currentAnswers.some((answer) => Boolean(answer.isCorrect))

  const resetEditor = () => {
    setSelectedQuestionId(null)
    setCurrentQuestion('')
    setCurrentAnswers(createEmptyAnswers())
  }

  const loadQuestionIntoEditor = (question: Question) => {
    setSelectedQuestionId(question.id)
    setCurrentQuestion(question.text)
    setCurrentAnswers(
      question.answers.map((answer) => ({
        ...answer,
        isCorrect: Boolean(answer.isCorrect)
      }))
    )
  }

  const handleSelectQuestion = (id: string) => {
    const question = questions.find((item) => item.id === id)
    if (!question) return
    loadQuestionIntoEditor(question)
  }

  const handleRemoveQuestion = (id: string) => {
    const remainingQuestions = questions.filter((question) => question.id !== id)
    setQuestions(remainingQuestions)

    if (selectedQuestionId === id) {
      const nextQuestion = remainingQuestions[0]
      if (nextQuestion) {
        loadQuestionIntoEditor(nextQuestion)
      } else {
        resetEditor()
      }
    }
  }

  const handleUpdateAnswer = (id: string, text: string) => {
    setCurrentAnswers((prev) =>
      prev.map((answer) => (answer.id === id ? { ...answer, text } : answer))
    )
  }

  const handleSetCorrectAnswer = (id: string) => {
    setCurrentAnswers((prev) => prev.map((answer) => ({ ...answer, isCorrect: answer.id === id })))
  }

  const focusAnswerInput = (id: string) => {
    const input = answerInputRefs.current[id]
    if (input) {
      input.focus()
      input.select()
    }
  }

  const handleSaveQuestion = () => {
    if (!isCurrentComplete) return

    if (selectedQuestionId) {
      setQuestions((prev) =>
        prev.map((question) =>
          question.id === selectedQuestionId
            ? {
                ...question,
                text: currentQuestion,
                answers: currentAnswers,
                timeLimit: globalTimeLimit,
                points: globalPoints
              }
            : question
        )
      )
    } else {
      const newId = uuidv4()
      const newQuestion: Question = {
        id: newId,
        text: currentQuestion,
        answers: currentAnswers,
        timeLimit: globalTimeLimit,
        points: globalPoints
      }
      setQuestions((prev) => [...prev, newQuestion])
      resetEditor()
    }
  }

  const handleGlobalTimeChange = (value: number) => {
    const clamped = clampNumber(value, 5, 60)
    setGlobalTimeLimit(clamped)
    setQuestions((prev) =>
      prev.map((question) => ({ ...question, timeLimit: clamped }))
    )
  }

  const handleGlobalPointsChange = (value: number) => {
    const clamped = clampNumber(value, 500, 1000)
    setGlobalPoints(clamped)
    setQuestions((prev) =>
      prev.map((question) => ({ ...question, points: clamped }))
    )
  }

  const handleSubmit = () => {
    if (!canProceedToSettings || !isFilled(title)) return
    onSubmit({ title, description, questions })
  }

  const handleBack = () => {
    clearDraft()
    onBack()
  }

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="container mx-auto max-w-5xl space-y-8">
        <div className="flex items-center justify-between">
          <CustomButton
            variant="secondary"
            onClick={handleBack}
            icon={<CaretLeftIcon className="w-5 h-5" />}
          >
            Retour
          </CustomButton>
          <div className="text-sm text-muted-foreground">
            Étape {currentStep} / 3
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-medium text-foreground">Créer un quiz</h1>
          <p className="text-muted-foreground">
            {stepLabels[currentStep]} · Avancez étape par étape pour créer un quiz clair et rapide.
          </p>
        </div>

        {currentStep === 1 && (
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium">Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground inline-flex items-center gap-1">
                  Titre du quiz
                  <span className="text-destructive" aria-hidden="true">*</span>
                  <span className="sr-only">obligatoire</span>
                </label>
                <Input
                  placeholder="Exemple : Culture générale"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  aria-required="true"
                  className="border-border focus-visible:ring-foreground"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <Input
                  placeholder="Une brève description de votre quiz..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="border-border focus-visible:ring-foreground"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <CustomButton
                  variant="primary"
                  onClick={() => setCurrentStep(2)}
                  className="w-full sm:w-auto"
                  disabled={!canProceedToQuestions}
                >
                  Continuer
                </CustomButton>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="border border-border shadow-sm lg:col-span-1 flex h-full flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg font-medium">
                  Questions ({totalQuestions})
                </CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={resetEditor}
                  className="hover:bg-muted"
                >
                  <PlusIcon className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex h-full flex-col gap-4">
                <div className="space-y-4">
                  {totalQuestions === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Aucune question pour le moment. Commencez à droite.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {questions.map((question, index) => {
                        const isSelected = question.id === selectedQuestionId

                        return (
                          <div
                            key={question.id}
                            className={cn(
                              'flex items-start justify-between gap-3 rounded-lg border px-3 py-3 transition',
                              isSelected
                                ? 'border-foreground bg-secondary/60'
                                : 'border-border bg-background hover:bg-muted/40'
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => handleSelectQuestion(question.id)}
                              className="min-w-0 flex-1 text-left"
                            >
                              <p className="text-sm font-medium text-foreground">
                                Question {index + 1}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {question.text || 'Sans titre'}
                              </p>
                            </button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveQuestion(question.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              aria-label="Supprimer la question"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                </div>

                <div className="mt-auto space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <CustomButton
                      variant="secondary"
                      onClick={() => setCurrentStep(1)}
                      className="w-full"
                    >
                      Précédent
                    </CustomButton>
                  <CustomButton
                    variant="primary"
                    onClick={() => setCurrentStep(3)}
                    className="w-full"
                    disabled={!canProceedToSettings}
                  >
                    Suivant
                  </CustomButton>
                </div>
              </div>
            </CardContent>
          </Card>

            <Card className="border border-border shadow-sm lg:col-span-2">
              <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-lg font-medium">
                  {selectedQuestionId ? 'Modifier la question' : 'Nouvelle question'}
                </CardTitle>
                <CustomButton
                  variant="primary"
                  onClick={handleSaveQuestion}
                  className="w-full h-10 px-4 text-sm sm:w-auto"
                  disabled={!isCurrentComplete}
                  icon={<PlusIcon className="w-4 h-4" />}
                >
                  {selectedQuestionId ? 'Mettre à jour' : 'Ajouter'}
                </CustomButton>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground inline-flex items-center gap-1">
                    Question
                    <span className="text-destructive" aria-hidden="true">*</span>
                    <span className="sr-only">obligatoire</span>
                  </label>
                  <Input
                    placeholder="Votre question ici..."
                    value={currentQuestion}
                    onChange={(e) => setCurrentQuestion(e.target.value)}
                    aria-required="true"
                    className="border-border focus-visible:ring-foreground"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Réponses</p>
                  <p className="text-xs text-muted-foreground">Choisissez la bonne réponse</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentAnswers.map((answer, index) => (
                    <div
                      key={answer.id}
                      className={cn(
                        'space-y-3 rounded-xl border p-3 transition',
                        answer.isCorrect
                          ? 'border-[hsl(var(--answer-green))] bg-[hsl(var(--answer-green))]/5'
                          : 'border-border bg-background hover:border-foreground/30'
                      )}
                      onClick={() => focusAnswerInput(answer.id)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <div className={cn('w-3 h-3 rounded-full', getAnswerDotClass(answer.color))} />
                          <span className="inline-flex items-center gap-1">
                            Réponse {index + 1}
                            <span className="text-destructive" aria-hidden="true">*</span>
                            <span className="sr-only">obligatoire</span>
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleSetCorrectAnswer(answer.id)}
                          onMouseDown={(event) => event.stopPropagation()}
                          className={cn(
                            'inline-flex h-8 w-8 items-center justify-center rounded-md border text-xs font-medium transition',
                            answer.isCorrect
                              ? 'border-[hsl(var(--answer-green))] bg-[hsl(var(--answer-green))] text-white'
                              : 'border-border text-muted-foreground hover:text-foreground'
                          )}
                          aria-pressed={answer.isCorrect}
                          aria-label="Définir comme bonne réponse"
                        >
                          {answer.isCorrect ? <CheckIcon className="w-4 h-4" /> : '✓'}
                        </button>
                      </div>
                      <Input
                        placeholder={`Réponse ${index + 1}`}
                        value={answer.text}
                        onChange={(e) => handleUpdateAnswer(answer.id, e.target.value)}
                        aria-required="true"
                        className={cn(
                          'border-border focus-visible:ring-foreground',
                          answer.isCorrect && 'border-[hsl(var(--answer-green))]'
                        )}
                        ref={(node) => {
                          answerInputRefs.current[answer.id] = node
                        }}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>
        )}

        {currentStep === 3 && (
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium">Réglages & validation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-border bg-secondary/30 p-4">
                  <p className="text-xs text-muted-foreground">Questions</p>
                  <p className="text-2xl font-medium text-foreground">{totalQuestions}</p>
                </div>
                <div className="rounded-xl border border-border bg-secondary/30 p-4">
                  <p className="text-xs text-muted-foreground">Temps total</p>
                  <p className="text-2xl font-medium text-foreground">
                    {totalTime > 0 ? `${totalTime}s` : '—'}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-secondary/30 p-4">
                  <p className="text-xs text-muted-foreground">Temps moyen</p>
                  <p className="text-2xl font-medium text-foreground">
                    {averageTime > 0 ? `${averageTime}s` : '—'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ClockIcon className="w-4 h-4" />
                    Temps par défaut (secondes)
                  </label>
                  <Input
                    type="number"
                    min={5}
                    max={60}
                    value={globalTimeLimit}
                    onChange={(e) => handleGlobalTimeChange(Number(e.target.value))}
                    className="border-border focus-visible:ring-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CrownIcon className="w-4 h-4" />
                    Points par défaut
                  </label>
                  <Input
                    type="number"
                    min={500}
                    max={1000}
                    step={1}
                    value={globalPoints}
                    onChange={(e) => handleGlobalPointsChange(Number(e.target.value))}
                    className="border-border focus-visible:ring-foreground"
                  />
                </div>
              </div>


              <div className="flex flex-col sm:flex-row gap-3">
                <CustomButton
                  variant="secondary"
                  onClick={() => setCurrentStep(2)}
                  className="w-full sm:w-auto"
                >
                  Étape précédente
                </CustomButton>
                <CustomButton
                  variant="primary"
                  onClick={handleSubmit}
                  className="w-full sm:w-auto"
                  disabled={!canProceedToSettings || isLoading}
                >
                  {isLoading ? 'Création en cours...' : 'Créer le quiz et lancer la partie'}
                </CustomButton>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
