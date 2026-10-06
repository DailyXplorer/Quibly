import { useState } from 'react'
import { Button as CustomButton } from '@/components/ui/custom-button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CaretLeftIcon, UserIcon, HashIcon } from '@phosphor-icons/react'

interface JoinGameProps {
  onJoin: (code: string, playerName: string) => void
  onBack: () => void
  isLoading?: boolean
  initialCode?: string
}

export function JoinGame({ onJoin, onBack, isLoading, initialCode }: JoinGameProps) {
  const [code, setCode] = useState(initialCode ? initialCode.toUpperCase() : '')
  const [playerName, setPlayerName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedCode = code.trim()
    const trimmedName = playerName.trim()
    if (trimmedCode && trimmedName) {
      onJoin(trimmedCode.toUpperCase(), trimmedName)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <CustomButton
          variant="secondary"
          onClick={onBack}
          className="mb-6"
          icon={<CaretLeftIcon className="w-5 h-5" />}
        >
          Retour
        </CustomButton>

        <Card className="border border-border shadow-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-medium">Rejoindre une partie</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <HashIcon className="w-4 h-4" />
                  <span className="inline-flex items-center gap-1">
                    Code de la partie
                    <span className="text-destructive" aria-hidden="true">*</span>
                    <span className="sr-only">obligatoire</span>
                  </span>
                </label>
                <Input
                  placeholder="Exemple : ABC123"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  aria-required="true"
                  className="tracking-wider border-border focus-visible:ring-foreground"
                  maxLength={6}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  <span className="inline-flex items-center gap-1">
                    Votre pseudo
                    <span className="text-destructive" aria-hidden="true">*</span>
                    <span className="sr-only">obligatoire</span>
                  </span>
                </label>
                <Input
                  placeholder="Entrez votre nom"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  aria-required="true"
                  className="border-border focus-visible:ring-foreground"
                />
              </div>

              <CustomButton
                variant="primary"
                type="submit"
                className="w-full"
                disabled={!code.trim() || !playerName.trim() || isLoading}
              >
                {isLoading ? 'Connexion...' : 'Rejoindre'}
              </CustomButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
