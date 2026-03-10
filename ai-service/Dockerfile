FROM python:3.11-slim

WORKDIR /app

# wget for HEALTHCHECK only — no build-essential needed with ONNX wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install all dependencies (ONNX Runtime replaces torch, no extra index needed)
RUN pip install --no-cache-dir -r requirements.txt

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
