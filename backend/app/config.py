from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db: str = "keepsake"

    # "local" for development, "r2" for Cloudflare R2
    storage_backend: str = "local"
    media_dir: str = "media"
    public_api_url: str = "http://localhost:8000"

    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket: str = ""
    r2_public_base_url: str = ""

    # AI pipeline
    clip_model: str = "clip-ViT-B-32"  # 512-dim image/text embeddings

    # Gemma for naming clusters: "api" (hosted via Gemini API) or "ollama" (local)
    gemma_provider: str = "api"
    google_api_key: str = ""
    gemma_api_model: str = "gemma-4-26b-a4b-it"
    ollama_url: str = "http://localhost:11434"
    gemma_model: str = "gemma3:4b"  # only used when gemma_provider=ollama

    # ElevenLabs narration for the trip recap (leave the key empty to get the script only)
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = "JBFqnCBsd6RMkjVDRZzb"
    elevenlabs_model: str = "eleven_multilingual_v2"

    # Observability (leave the DSN empty to disable Sentry)
    sentry_dsn: str = ""
    sentry_environment: str = "development"

    # Sign-in (Clerk). The publishable key is enough: the token issuer is derived from it.
    clerk_publishable_key: str = ""
    clerk_issuer: str = ""  # optional override, e.g. https://your-app.clerk.accounts.dev

    cors_origins: str = "http://localhost:3000"
    max_upload_mb: int = 30


settings = Settings()
