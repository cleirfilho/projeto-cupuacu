FROM mcr.microsoft.com/devcontainers/base:noble

RUN apt-get update \
    && export DEBIAN_FRONTEND=noninteractive \
    && apt-get install -y --no-install-recommends sqlite3 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
