# Keepsake

**Upload everything. Organize nothing.**

Keepsake is a shared trip album. Everyone on the trip adds their photos, and Keepsake groups them
into the places and moments you actually remember, names each one, lets you search by describing
a scene, and reads a short recap of the trip aloud.

**Live demo:** https://keepsake-gray.vercel.app

## What it does

- **Shared trips.** Create a trip and send friends an invite link. Everyone uploads into the same album.
- **Automatic moments.** Photos are grouped by what they show and when they were taken, so
  "the beach", "dinner" and "the fort" become separate sections without anyone sorting anything.
- **Named for you.** Each moment gets a short name and a one-line description written by Gemma.
- **Search by description.** Type "sunset at the beach" and get the matching photos, no tags needed.
- **Narrated recap.** A short story of the trip, written from its moments and read aloud.
- **Handles real uploads.** iPhone HEIC photos, duplicates across contributors, and missing
  timestamps are all dealt with on upload.

## How it works

1. **Upload.** Each photo is fingerprinted to skip duplicates, rotated upright, and given a
   thumbnail. The time and location stored in the photo are read where present.
2. **Embed.** A CLIP model turns every photo into a vector that captures what it shows.
3. **Cluster.** HDBSCAN groups photos using those vectors together with the time they were taken.
4. **Name.** The most typical photos of each group are sent to Gemma, which returns a name and
   description. Several groups are named at once, with retries when the model's API fails.
5. **Search.** The search text is embedded with the same CLIP model and matched against the
   photos with MongoDB Atlas Vector Search.
6. **Recap.** Gemma writes a narration from the moment names and ElevenLabs voices it.

## Built with

| Part | Technology |
|---|---|
| Frontend | Next.js 14, React, Tailwind CSS, Framer Motion |
| Backend | FastAPI (Python) |
| Sign-in | Clerk |
| Database and search | MongoDB Atlas, Atlas Vector Search |
| Photo understanding | CLIP (`clip-ViT-B-32`) via sentence-transformers |
| Grouping | HDBSCAN (scikit-learn) |
| Naming and recap text | Gemma 4 through the Gemini API |
| Narration | ElevenLabs |
| Photo storage | Cloudflare R2 |
| Monitoring | Sentry |

## Run locally

You need Python 3.12, Node.js 20, and a MongoDB database (Atlas or local).

Backend:

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # fill in the values, see below
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
cp .env.example .env.local  # fill in the Clerk keys
npm install
npm run dev
```

Open http://localhost:3000, sign up, create a trip and add photos.

Run the backend tests with `pytest` from the `backend` folder.

### Settings

The full list of names is in `backend/.env.example` and `frontend/.env.example`.

| Setting | Needed for | Without it |
|---|---|---|
| `MONGODB_URI` | Everything | The backend will not start |
| `CLERK_PUBLISHABLE_KEY`, plus the Clerk keys in the frontend | Sign-in | Nobody can sign in |
| `GOOGLE_API_KEY` | Moment names and recap text | Moments are called "Moment 1", "Moment 2", ... |
| `ELEVENLABS_API_KEY` | Recap audio | The recap is text only |
| `R2_...` with `STORAGE_BACKEND=r2` | Cloud photo storage | Photos are saved to a local `media` folder |
| `SENTRY_DSN` | Error and performance tracing | Tracing is off |

Semantic search uses an Atlas Vector Search index, which the backend creates on startup. On a
local MongoDB without it, search falls back to a slower in-memory comparison.

## Deployment

| Part | Host |
|---|---|
| Frontend | Vercel, with `frontend` as the project root |
| Backend | A Hugging Face Docker Space built from `backend/Dockerfile` |
| Photos | Cloudflare R2, because the Space's own disk is wiped on every restart |
| Database | MongoDB Atlas, with network access open to the Space |

Secrets are never committed. They are set in each host's settings.

The backend needs about 2 GB of memory to hold the CLIP model, which is what decides where it can run.

## Project layout

```
backend/
  app/
    routers/     API endpoints: trips, photos, organize, search, recap
    services/    upload processing, embeddings, clustering, naming, recap
    auth.py      Clerk session checks and trip membership
    storage.py   local folder or Cloudflare R2
  tests/
frontend/
  app/           pages: home, trip, join, sign-in, sign-up
  components/    photo grid, viewer, search, recap, invites
  lib/api.ts     calls to the backend
```

## License

See [LICENSE](LICENSE).
