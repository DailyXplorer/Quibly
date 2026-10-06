import { CaretLeftIcon, GithubLogoIcon } from '@phosphor-icons/react'

import { SiteFooter } from '@/components/SiteFooter'
import { Button as CustomButton } from '@/components/ui/custom-button'

type PrivacyProps = {
  onBack: () => void
  onOpenTerms: () => void
  onOpenPrivacy: () => void
}

const paragraphs = [
  "Quibly traite notamment le pseudo choisi par les joueurs, le contenu des quiz (titre, description, questions, réponses), les réponses, scores et temps restants pendant les parties, un identifiant technique anonyme associé à votre appareil (authentification Supabase) et les horodatages nécessaires au déroulement des parties.",
  "Dans une même partie, les participants voient les pseudos et les scores afin de permettre le classement.",
  "Le navigateur peut conserver une session active et un brouillon de quiz pour faciliter la reprise d'une partie ou d'une création.",
  "Ces données servent à permettre la création et le partage de quiz, assurer le temps réel, le classement et les résultats, et maintenir la sécurité afin de prévenir les abus.",
  "Les données sont stockées sur Supabase, utilisé pour la base de données et les mises à jour en temps réel.",
  "Les données sont conservées le temps nécessaire au fonctionnement du service. Vous pouvez demander leur suppression via le dépôt GitHub.",
  "Vous pouvez demander l'accès, la rectification ou la suppression de vos données via le dépôt GitHub.",
]

export function Privacy({ onBack, onOpenTerms, onOpenPrivacy }: PrivacyProps) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" aria-label="Recharger Quibly">
            <img
              src="/logo.png"
              alt="Logo Quibly"
              className="h-16 w-56 object-contain translate-y-1"
            />
          </a>
          <CustomButton
            variant="secondary"
            icon={<GithubLogoIcon className="w-4 h-4" />}
            onClick={() =>
              window.open(
                'https://github.com/Louistmg/Quibly',
                '_blank',
                'noopener,noreferrer'
              )
            }
          >
            Star
          </CustomButton>
        </div>
      </nav>

      <main className="pb-20">
        <section className="container mx-auto px-6 pt-10">
          <CustomButton
            variant="secondary"
            onClick={onBack}
            icon={<CaretLeftIcon className="w-4 h-4" />}
            className="mb-8"
          >
            Retour à l'accueil
          </CustomButton>
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-medium mb-4">
              Politique de confidentialité
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              Cette politique explique quelles données sont traitées lors de
              l'utilisation de Quibly.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-6 py-12">
          <div className="max-w-3xl space-y-4 text-sm text-muted-foreground">
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter
        onOpenTerms={onOpenTerms}
        onOpenPrivacy={onOpenPrivacy}
        active="privacy"
      />
    </div>
  )
}
