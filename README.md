# JuriLex

Application web (PWA) pour aider à **comprendre un document avant de le signer**, en français simple, avec une traduction en éwé.

JuriLex n’est pas un avocat et ne remplace pas un professionnel du droit.

## Où en est le projet

Étapes 0 à 3 du cahier des charges sont en place :

| Étape | Contenu | Statut |
|---|---|---|
| 0 | Audit | Fait |
| 1 | Interface PWA | Fait |
| 2 | Import PDF / photo + OCR | Fait |
| 3 | Analyse Gemma 4 + traduction éwé | Fait |
| 4 | Synthèse vocale éwé | En cours (code présent, pas encore validé) |
| 5 | Parcours de démonstration complet | À faire |
| 6 | Préparation démo finale | À faire |

## Ce que l’application fait aujourd’hui

1. Ajouter un PDF, une image, ou prendre une photo.
2. Extraire le texte (PDF.js pour les PDF avec texte, Tesseract.js dans le navigateur pour les photos).
3. Relire et corriger le texte.
4. Envoyer le texte à **Gemma 4** (`gemma-4-26b-a4b-it` via l’API Gemini) pour une explication structurée.
5. Afficher : résumé, obligations, argent, dates, points à vérifier, traduction en éwé.

La lecture du fichier reste dans le navigateur. L’explication envoie le **texte** à Google (Gemma 4), pas le fichier original. Ce n’est pas un traitement entièrement local.

## Prérequis

- Node.js 24 (ou proche)
- Python 3.14 (celui de la machine de développement)
- Une clé API Gemini dans `backend/.env`

## Installation

### Frontend

```bash
cd frontend
npm install
```

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn httpx python-dotenv
```

Pour la voix (étape 4, optionnel pour l’instant) :

```bash
pip install torch transformers scipy
```

## Configuration

Copiez `backend/.env.example` vers `backend/.env` :

```bash
cd backend
cp .env.example .env
```

Renseignez :

```
GEMINI_API_KEY=votre_clé
GEMMA_MODEL=gemma-4-26b-a4b-it
```

- La clé reste **uniquement** dans `backend/.env`.
- Ne la mettez pas dans `frontend/.env` (elle serait exposée au navigateur).
- Ne commitez jamais `.env`.

## Lancement

Deux terminaux.

**Backend** — le port doit être **8000** (pas `0000`) :

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000
```

Vérification :

```bash
curl http://127.0.0.1:8000/api/health
```

Réponse attendue : `"ok": true`, `"analysis": true`, `"model": "gemma-4-26b-a4b-it"`.

**Frontend** :

```bash
cd frontend
npm run dev
```

Ouvrir **http://localhost:5173/**.

Le frontend relaie `/api` vers `http://127.0.0.1:8000`. Si le backend est arrêté, « Comprendre ce document » échoue.

## Parcours de test (jusqu’à l’étape 3)

1. Accueil → **Ajouter mon document** (PDF) ou **Prendre une photo**.
2. Attendre la lecture du texte, puis **Continuer vers le texte** si besoin.
3. Corriger le texte.
4. Lire l’avertissement (envoi à Gemma 4 / Google), puis **Comprendre ce document**.
5. Vérifier les six sections, puis **Écouter en éwé** pour voir la traduction.

L’analyse prend souvent **8 à 15 secondes**. Si le message indique un délai trop long, relancer uniquement le backend (sans charger la voix en même temps).

## API backend

- `GET /api/health` — état du serveur, présence de la clé, modèle IA.
- `POST /api/analyze` — `{ "text": "..." }` → JSON `summary`, `you`, `other`, `money`, `dates`, `checks`, `ewe`, `model`.
- `POST /api/tts` — prévu pour la voix éwé (`facebook/mms-tts-ewe`). Pas encore validé.

Le contenu des documents n’est pas enregistré en base. Aucun compte utilisateur.

## Licences à connaître

- **Gemma 4** : Apache 2.0. Traitement via l’API Gemini (données envoyées à Google).
- **facebook/mms-tts-ewe** : CC-BY-NC 4.0. Usage de démo / non commercial.
- **PDF.js** et **Tesseract.js** : lecture locale dans le navigateur.

## Limites connues

- Ce n’est pas un avis juridique.
- Gemma 4 peut se tromper ou mal traduire l’éwé : toujours relire.
- L’OCR est imparfait sur les photos floues ou les PDF scannés.
- La machine de démo a peu de RAM : ne pas lancer l’analyse et le chargement TTS en même temps.
- La PWA installe l’interface ; l’analyse et la voix ont besoin d’internet et du backend.
- La synthèse vocale n’est pas encore une fonctionnalité de démo stable.

## Structure

```text
frontend/     interface React + Vite (JSX, pas de TypeScript)
backend/      FastAPI (analyse Gemma 4, TTS en préparation)
```
