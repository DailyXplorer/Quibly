import { CaretLeftIcon, GithubLogoIcon } from '@phosphor-icons/react'

import { SiteFooter } from '@/components/SiteFooter'
import { Button as CustomButton } from '@/components/ui/custom-button'

type TermsProps = {
  onBack: () => void
  onOpenTerms: () => void
  onOpenPrivacy: () => void
}

const paragraphs = [
  "Quibly permet de créer des quiz, de partager un code d'accès et de jouer en temps réel.",
  "L'accès est possible sans compte. Un identifiant technique anonyme est créé pour assurer le fonctionnement du service.",
  "Vous êtes responsable des questions, réponses et visuels ajoutés. Vous garantissez disposer des droits nécessaires et ne pas publier de contenu illicite.",
  "Il est interdit de perturber le déroulement des parties, d'accéder aux données d'autres joueurs sans autorisation, de publier des contenus violents, haineux, diffamatoires ou illicites, ou d'utiliser des scripts pour fausser les scores.",
  "Le service peut être modifié, suspendu ou interrompu pour maintenance ou évolution. Nous faisons au mieux pour garantir une expérience stable, sans promesse de disponibilité continue.",
  "Le code de Quibly est open source sous licence MIT. Le contenu des quiz reste la propriété de leurs auteurs.",
  "Quibly est fourni tel quel. Dans les limites autorisées par la loi, nous ne pouvons être tenus responsables des dommages indirects ou de pertes liées à l'utilisation du service.",
  "Pour toute question ou demande, vous pouvez nous contacter via le dépôt GitHub.",
]

export function Terms({ onBack, onOpenTerms, onOpenPrivacy }: TermsProps) {
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
              Conditions d'utilisation
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              Ces conditions encadrent l'usage de Quibly, une alternative open source
              à Kahoot pour créer et animer des quiz en temps réel.
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
        active="terms"
      />
    </div>
  )
}
