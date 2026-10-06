import { Card, CardContent } from "@/components/ui/card";
import { Button as CustomButton } from "@/components/ui/custom-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SiteFooter } from "@/components/SiteFooter";
import {
  GameController01Icon,
  UserGroupIcon,
  CrownIcon,
  ArrowRight01Icon,
  PlayIcon,
  ZapIcon,
  GithubIcon,
  GitPullRequestIcon,
  RocketIcon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Download04Icon,
  InformationCircleIcon,
} from "hugeicons-react";
import { REPO_URL } from "@/demo";

type HomeActionsProps =
  | { onCreate: () => void; onJoin: () => void }
  | { onStartDemo: () => void };

type HomeProps = HomeActionsProps & {
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
};

function HomeActions(props: HomeActionsProps) {
  if ("onStartDemo" in props) {
    return (
      <div className="flex flex-col sm:flex-row gap-3 md:justify-center w-full sm:w-auto">
        <CustomButton
          variant="primary"
          onClick={() => window.open(REPO_URL, "_blank", "noopener,noreferrer")}
          icon={<Download04Icon className="w-4 h-4" />}
          className="w-full sm:w-auto"
        >
          Télécharger le code
        </CustomButton>
        <CustomButton
          variant="secondary"
          onClick={props.onStartDemo}
          icon={<PlayIcon className="w-4 h-4" />}
          className="w-full sm:w-auto"
        >
          Voir la démo
        </CustomButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 md:justify-center w-full sm:w-auto">
      <CustomButton
        variant="primary"
        onClick={props.onCreate}
        icon={<PlayIcon className="w-4 h-4" />}
        className="w-full sm:w-auto"
      >
        Créer un quiz
      </CustomButton>
      <CustomButton
        variant="secondary"
        onClick={props.onJoin}
        icon={<ArrowRight01Icon className="w-4 h-4" />}
        className="w-full sm:w-auto"
      >
        Rejoindre une partie
      </CustomButton>
    </div>
  );
}

export function Home(props: HomeProps) {
  const { onOpenTerms, onOpenPrivacy } = props;
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
            icon={<GithubIcon className="w-4 h-4" />}
            onClick={() =>
              window.open(
                "https://github.com/Louistmg/Quibly",
                "_blank",
                "noopener,noreferrer"
              )
            }
          >
            Star
          </CustomButton>
        </div>
      </nav>

      <section className="min-h-[calc(100dvh-4rem)] flex flex-col justify-center px-10 sm:px-8 md:px-6 py-16 md:py-0 md:items-center">
        <div className="max-w-2xl md:mx-auto text-left md:text-center">
          {"onStartDemo" in props && (
            <div className="mb-8 inline-flex items-start gap-2 rounded-lg border border-border bg-secondary/40 px-4 py-3 text-left text-sm text-foreground">
              <InformationCircleIcon className="w-5 h-5 shrink-0 text-[hsl(var(--answer-blue))]" />
              <p>
                Version de démonstration — téléchargez le code pour héberger
                votre propre Quibly
              </p>
            </div>
          )}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-medium tracking-tight text-foreground mb-4 leading-tight">
            L'alternative gratuite à Kahoot pour vos quiz.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground md:max-w-xl md:mx-auto leading-snug mb-8">
            Créez des QCM, définissez le chrono et les points, puis lancez une
            partie en temps réel. Un code de 6 caractères et un pseudo suffisent
            pour rejoindre, sans inscription.
          </p>
          <HomeActions {...props} />
        </div>
      </section>

      <section className="border-y border-border bg-secondary/30 mb-20">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <p className="text-3xl md:text-4xl font-medium text-foreground">
                13K+
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Joueurs uniques
              </p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-medium text-foreground">
                4K+
              </p>
              <p className="text-sm text-muted-foreground mt-1">Quiz créés</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-medium text-foreground">
                50K+
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Parties jouées
              </p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-medium text-foreground">
                99%
              </p>
              <p className="text-sm text-muted-foreground mt-1">Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      <section id="fonctionnalites" className="container mx-auto px-6 py-36">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-medium mb-3">
            Fonctionnalités
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <Card className="border-border">
            <CardContent className="p-5">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center mb-3">
                <GameController01Icon className="w-4 h-4" />
              </div>
              <h3 className="text-base font-medium mb-1">QCM interactifs</h3>
              <p className="text-sm text-muted-foreground">
                Rédigez des questions avec des réponses colorées et une seule
                bonne réponse
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-5">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center mb-3">
                <UserGroupIcon className="w-4 h-4" />
              </div>
              <h3 className="text-base font-medium mb-1">Code de partie</h3>
              <p className="text-sm text-muted-foreground">
                Un code de 6 caractères et un pseudo suffisent pour rejoindre
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-5">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center mb-3">
                <ZapIcon className="w-4 h-4" />
              </div>
              <h3 className="text-base font-medium mb-1">Chrono & points</h3>
              <p className="text-sm text-muted-foreground">
                Définissez le temps par question et les points attribués
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-5">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center mb-3">
                <CrownIcon className="w-4 h-4" />
              </div>
              <h3 className="text-base font-medium mb-1">
                Classement en direct
              </h3>
              <p className="text-sm text-muted-foreground">
                Résultats par question et classement mis à jour en temps réel
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="comparaison" className="container mx-auto px-6 py-32">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-medium mb-3">
            Comparaison : Kahoot vs Quibly
          </h2>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="border-border overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="sm:w-1/2 py-3 sm:py-4 px-4 sm:px-6">
                      Fonctionnalité
                    </TableHead>
                    <TableHead className="text-center py-3 sm:py-4 px-3 sm:px-4">
                      <span className="text-muted-foreground">Kahoot</span>
                    </TableHead>
                    <TableHead className="text-center py-3 sm:py-4 px-3 sm:px-4">
                      <span>Quibly</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="py-3 sm:py-4 px-4 sm:px-6 text-muted-foreground">
                      Sans inscription pour créer
                    </TableCell>
                    <TableCell className="text-center py-3 sm:py-4">
                      <Cancel01Icon className="w-5 h-5 text-destructive mx-auto" />
                    </TableCell>
                    <TableCell className="text-center py-3 sm:py-4">
                      <CheckmarkCircle02Icon className="w-5 h-5 text-[hsl(var(--answer-blue))] mx-auto" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="py-3 sm:py-4 px-4 sm:px-6 text-muted-foreground">
                      Sans inscription pour jouer
                    </TableCell>
                    <TableCell className="text-center py-3 sm:py-4">
                      <CheckmarkCircle02Icon className="w-5 h-5 text-[hsl(var(--answer-blue))] mx-auto" />
                    </TableCell>
                    <TableCell className="text-center py-3 sm:py-4">
                      <CheckmarkCircle02Icon className="w-5 h-5 text-[hsl(var(--answer-blue))] mx-auto" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="py-3 sm:py-4 px-4 sm:px-6 text-muted-foreground">
                      Participants en live
                    </TableCell>
                    <TableCell className="text-center py-3 sm:py-4">
                      <span className="text-sm text-muted-foreground">10</span>
                    </TableCell>
                    <TableCell className="text-center py-3 sm:py-4">
                      <span className="text-sm">Illimité</span>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="py-3 sm:py-4 px-4 sm:px-6 text-muted-foreground">
                      Points personnalisables
                    </TableCell>
                    <TableCell className="text-center py-3 sm:py-4">
                      <Cancel01Icon className="w-5 h-5 text-destructive mx-auto" />
                    </TableCell>
                    <TableCell className="text-center py-3 sm:py-4">
                      <CheckmarkCircle02Icon className="w-5 h-5 text-[hsl(var(--answer-blue))] mx-auto" />
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-b-0">
                    <TableCell className="py-3 sm:py-4 px-4 sm:px-6 text-muted-foreground">
                      Code source accessible
                    </TableCell>
                    <TableCell className="text-center py-3 sm:py-4">
                      <Cancel01Icon className="w-5 h-5 text-destructive mx-auto" />
                    </TableCell>
                    <TableCell className="text-center py-3 sm:py-4">
                      <CheckmarkCircle02Icon className="w-5 h-5 text-[hsl(var(--answer-blue))] mx-auto" />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </section>

      <section id="opensource" className="container mx-auto px-6 py-32">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-medium mb-3">Open source</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          <Card className="border-border">
            <CardContent className="p-5">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center mb-3">
                <GithubIcon className="w-4 h-4" />
              </div>
              <h3 className="text-base font-medium mb-1">Code source ouvert</h3>
              <p className="text-sm text-muted-foreground">
                Accédez au code complet sur GitHub et adaptez-le à vos besoins
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-5">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center mb-3">
                <GitPullRequestIcon className="w-4 h-4" />
              </div>
              <h3 className="text-base font-medium mb-1">Contribuez</h3>
              <p className="text-sm text-muted-foreground">
                Ouvrez des issues et proposez vos idées d'amélioration
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-5">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center mb-3">
                <RocketIcon className="w-4 h-4" />
              </div>
              <h3 className="text-base font-medium mb-1">Mises à jour</h3>
              <p className="text-sm text-muted-foreground">
                Suivez les nouvelles fonctionnalités et les corrections
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="comment-ca-marche" className="container mx-auto px-6 py-32">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-medium mb-3">
            Comment ça marche ?
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-medium mb-3">
                1
              </div>
              <h3 className="text-base font-medium mb-1">Créez votre quiz</h3>
              <p className="text-sm text-muted-foreground">
                Ajoutez un titre, une description, des questions, puis
                choisissez la bonne réponse, le chrono et les points
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-medium mb-3">
                2
              </div>
              <h3 className="text-base font-medium mb-1">Partagez le code</h3>
              <p className="text-sm text-muted-foreground">
                Un code unique de 6 caractères est généré. Les joueurs entrent
                le code et un pseudo pour rejoindre
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-medium mb-3">
                3
              </div>
              <h3 className="text-base font-medium mb-1">Lancez la partie</h3>
              <p className="text-sm text-muted-foreground">
                Réponses en direct, résultats par question et classement final
                en temps réel
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-6 pt-32 pb-56">
        <div className="max-w-2xl md:mx-auto text-left md:text-center">
          <h2 className="text-2xl md:text-3xl font-medium mb-3">
            Prêt à jouer ?
          </h2>
          <p className="text-muted-foreground mb-6">
            Passez à Quibly, l'alternative gratuite à Kahoot. Créez un quiz,
            partagez un code et jouez en direct en quelques clics.
          </p>
          <HomeActions {...props} />
        </div>
      </section>

      <SiteFooter
        onOpenTerms={onOpenTerms}
        onOpenPrivacy={onOpenPrivacy}
      />
    </div>
  );
}
