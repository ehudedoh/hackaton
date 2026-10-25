# JuriLex

Application web (PWA) pour aider à **comprendre un document avant de le signer**, en français simple, avec une traduction et une voix en éwé.

JuriLex n’est pas un avocat et ne remplace pas un professionnel du droit.

## Où en est le projet

| Étape | Contenu | Statut |
|---|---|---|
| 0 | Audit | Fait |
| 1 | Interface PWA | Fait |
| 2 | Import PDF / photo + OCR | Fait |
| 3 | Analyse Gemma 4 + traduction éwé | Fait |
| 4 | Synthèse vocale éwé | Fait |
| 5 | Parcours de démonstration complet | Fait |
| 6 | Préparation démo finale | À faire |

## Ce que l’application fait aujourd’hui

1. Ajouter un PDF, une image, ou prendre une photo.
2. Extraire le texte (PDF.js pour les PDF avec texte, Tesseract.js dans le navigateur pour les photos).
3. Relire et corriger le texte.
4. Envoyer le texte à **Gemma 4** (`gemma-4-26b-a4b-it` via l’API Gemini) pour une explication structurée.
5. Afficher : résumé, obligations, argent, dates, points à vérifier, traduction en éwé.
6. Écouter la traduction avec **facebook/mms-tts-ewe** (WAV local, pause / reprise).

La lecture du fichier reste dans le navigateur. L’explication envoie le **texte** à Google (Gemma 4), pas le fichier original. La voix est générée sur la machine, sans base de données.

## Prérequis

- Node.js 24 (ou proche)
- Python 3.14
- Une clé API Gemini dans `backend/.env`
- Pour la voix : `torch`, `transformers`, `scipy` (déjà dans le venv de démo)

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
pip install fastapi uvicorn httpx python-dotenv torch transformers scipy
```

## Configuration

```bash
cd backend
cp .env.example .env
```

```
GEMINI_API_KEY=votre_clé
GEMMA_MODEL=gemma-4-26b-a4b-it
```

- Clé **uniquement** dans `backend/.env`, jamais dans le frontend.
- Ne commitez jamais `.env`.

### Render (deux services)

Le frontend statique n’a **pas** le proxy Vite. Sans `VITE_API_URL`, « Comprendre ce document » appelle `/api` sur le site frontend et reçoit une réponse vide (`Unexpected end of JSON input`).

**Backend** (Web Service, racine `backend`) :

- Build : `pip install -r requirements.txt`
- Start : `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Variables : `GEMINI_API_KEY`, `GEMMA_MODEL=gemma-4-26b-a4b-it`, `CORS_ORIGINS=https://hackaton-ulix.onrender.com`

**Frontend** (Static Site, racine `frontend`) :

- Build : `npm install && npm run build`
- Publish : `dist`
- Variable **de build** : `VITE_API_URL=https://hackaton-bcd.onrender.com`  
  Puis **Clear build cache & deploy** (Vite lit cette variable au build).

La voix TTS (PyTorch) dépasse souvent la RAM d’une instance Render gratuite. Ne pas garder le POST `/api/tts` ouvert pendant le chargement du modèle (Render coupe ~30 s, le téléphone affiche « Failed to fetch »). Le modèle se charge en arrière-plan (`POST /api/tts/warmup`) ; le POST voix n’est envoyé que lorsque `/api/health` a `"tts": true`. Sur Render, `PRELOAD_TTS` est activé par défaut.

## Lancement

Deux terminaux.

**Backend** — port **8000** (pas `0000`) :

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000
```

```bash
curl http://127.0.0.1:8000/api/health
```

Attendu : `"ok": true`, `"analysis": true`, `"model": "gemma-4-26b-a4b-it"`.  
`"tts": true` quand le modèle voix est chargé (`"tts_loading": true` pendant le chargement).

**Frontend** :

```bash
cd frontend
npm run dev
```

Ouvrir **http://localhost:5173/**.

## Parcours de test (étape 5 — vérifié)

Fichier d’exemple : `frontend/public/samples/contrat-texte.pdf`.

1. **Ajouter mon document** (PDF texte) → extraction PDF.js, écran « Vérifier le texte ».
2. Relire / corriger, puis **Comprendre ce document** (Gemma 4, ici ~2 s une fois le backend chaud).
3. Six sections remplies (résumé, obligations, argent, dates, points à vérifier).
4. **Écouter en éwé** : traduction affichée ; WAV préparé (ici ~35 s avec le modèle déjà chargé, plus long au tout premier chargement).
5. **Écouter** / pause / fin naturelle (~15 s pour l’exemple).
6. **Effacer et recommencer** → retour à l’accueil, session vide.
7. Chemin **image PNG** (texte dessiné) : Tesseract.js a reconnu le contrat ; pas de photo caméra ni PDF scanné réel dans ce test.

Ne lancez pas l’analyse Gemma 4 et le premier chargement TTS en même temps : la machine a peu de RAM.

## API backend

- `GET /api/health`
- `POST /api/analyze` — `{ "text": "..." }` → `summary`, `you`, `other`, `money`, `dates`, `checks`, `ewe`, `model`
- `POST /api/tts` — `{ "text": "..." }` → fichier **WAV** (`audio/wav`), modèle `facebook/mms-tts-ewe`

Les fichiers WAV temporaires sont supprimés après envoi. Aucun historique, aucun compte.

Test voix :

```bash
curl -o voix.wav -X POST http://127.0.0.1:8000/api/tts \
  -H 'Content-Type: application/json' \
  -d '{"text":"Lɔnu 50 000 FCFA ɣleti sia ɣleti."}'
```

## Licences

- **Gemma 4** : Apache 2.0. Appel API Gemini (texte envoyé à Google).
- **facebook/mms-tts-ewe** : **CC-BY-NC 4.0**. Démo / usage non commercial uniquement.
- **PDF.js** et **Tesseract.js** : lecture locale dans le navigateur.

## Limites connues

- Ce n’est pas un avis juridique.
- Gemma 4 peut se tromper ou mal traduire l’éwé.
- L’OCR est imparfait sur photos floues ou PDF scannés.
- Peu de RAM : séparer analyse et premier chargement de la voix.
- La PWA n’offre pas l’analyse ni la voix hors ligne.
- MMS TTS n’est pas adapté à un usage commercial sans autre licence.
- Déploiement Render : `VITE_API_URL` obligatoire au build du frontend ; TTS peu réaliste sur l’offre gratuite.

## Structure

```text
frontend/     React + Vite (JSX)
backend/      FastAPI : analyse Gemma 4 + TTS éwé
```
