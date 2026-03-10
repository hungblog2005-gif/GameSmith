FROM python:3.11-slim

WORKDIR /app

# Install build dependencies + wget for HEALTHCHECK
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    wget \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install CPU-only torch first (avoids downloading CUDA binaries)
RUN pip install --no-cache-dir \
    torch==2.6.0+cpu \
    --extra-index-url https://download.pytorch.org/whl/cpu

# Install the rest of the dependencies
RUN pip install --no-cache-dir \
    fastapi==0.115.6 \
    "uvicorn[standard]==0.34.0" \
    sentence-transformers==3.3.1 \
    qdrant-client==1.12.1 \
    "pydantic==2.10.4" \
    python-dotenv==1.0.1 \
    "numpy==1.26.4" \
    Pillow>=10.0.0 \
    requests>=2.31.0

# HuggingFace cache — mounted as a volume so models persist across rebuilds
ENV HF_HOME=/app/hf_cache
RUN mkdir -p /app/hf_cache

# Non-root user for security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
RUN chown -R appuser:appgroup /app/hf_cache

COPY --chown=appuser:appgroup . .

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO /dev/null http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
