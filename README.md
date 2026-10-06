<p align="center">
  <img src="public/logo.png" alt="Quibly" width="240" />
</p>

# Quibly

Quibly est une alternative open source à Kahoot pour créer et animer des quiz en direct. Simple à lancer, pensé pour les classes, ateliers et événements.

Le lien : [quibly-quiz.vercel.app](https://quibly-quiz.vercel.app/)

## En bref
- Créez un quiz en quelques minutes.
- Partagez un code (et un QR code) pour rejoindre la partie.
- Jouez en temps réel avec chrono, résultats et classement.

## Déroulé d’une partie
1. L’hôte crée le quiz et ouvre la salle d’attente.
2. Les joueurs rejoignent avec un code et choisissent un pseudo.
3. La partie alterne questions, résultats et classements jusqu’au final.

## Côté hôte
- Créer le quiz (questions, réponses, temps, points).
- Lancer la partie et avancer les questions.
- Voir les réponses en direct et le classement.

## Côté joueur
- Répondre depuis un téléphone ou un ordinateur.
- Découvrir son résultat après chaque question.
- Suivre son score et le classement final.

## Tech
- React 19, Vite, Tailwind CSS v4, shadcn/ui, Phosphor Icons.
- Supabase pour la base de données et le temps réel.

## Développement local

### Prérequis
- Node.js
- pnpm
- Un projet Supabase configuré

### Variables d’environnement
Créer un fichier `.env` :
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Commandes
```
pnpm dev
pnpm build
pnpm preview
pnpm lint
```

### Mode démonstration
`VITE_DEMO_MODE=true` produit une vitrine sans backend : le client Supabase n'est jamais créé, la création et la connexion à une partie sont désactivées, et « Voir la démo » déroule un quiz d'exemple en local. Sans cette variable (par défaut), l'application complète est construite.
```
VITE_DEMO_MODE=true pnpm build
```
Sur Vercel, définir `VITE_DEMO_MODE=true` dans les variables d'environnement du projet.

## Licence
MIT. Voir le fichier `LICENSE`.
