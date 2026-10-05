# Keepsake

Upload everything. Organize nothing. Everyone's trip photos, grouped into the moments you remember.

## Run locally

Backend (needs a MongoDB Atlas URI or local MongoDB):

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # set MONGODB_URI
uvicorn app.main:app --reload
pytest
```

Frontend:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000, create a trip, add photos.

## Deploy

- **Frontend** runs on Vercel, with `frontend` as the project's root directory.
- **Backend** runs on a Hugging Face Docker Space. Push the `backend` folder to it with
  `git subtree push --prefix backend space main`.
- **Photos** go to Cloudflare R2 (`STORAGE_BACKEND=r2`), because the Space's disk is wiped on restart.
- **Database** is MongoDB Atlas.

Secrets are never committed. Set them in each host's settings, using `backend/.env.example` and
`frontend/.env.example` as the list of names.
