FROM python:3.12-slim

# run as a normal user, which hosts like Hugging Face Spaces require
RUN useradd -m -u 1000 app
WORKDIR /app
ENV HOME=/home/app HF_HOME=/home/app/.cache/huggingface PYTHONUNBUFFERED=1

# CPU-only torch first: the default wheel bundles GPU libraries and is several GB larger
COPY requirements.txt .
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r requirements.txt

USER app
# bake the CLIP model into the image so the first Organize does not wait on a download
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('clip-ViT-B-32')"

COPY --chown=app . .
RUN mkdir -p media

ENV PORT=8000
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
