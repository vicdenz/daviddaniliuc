FROM python:3.13-slim-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends g++ && rm -rf /var/lib/apt/lists/* && pip install --no-cache-dir pytest==8.4.2
ENV PYTHONDONTWRITEBYTECODE=1 PYTEST_DISABLE_PLUGIN_AUTOLOAD=1
WORKDIR /work
USER 65534:65534
