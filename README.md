---
title: My Glance Dashboard
emoji: 🚀
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---

# 🌿 SASSAFRAS Dashboard

A personalized, self-hosted [Glance](https://github.com/glanceapp/glance) command center.
Runs as a Docker container on Hugging Face Spaces (port 7860).

- `config/glance.yml` — server, theme, auth
- `config/home.yml` — layout: columns and widgets
- `assets/user.css` — custom styling
- `Dockerfile` — HF-compatible build (port 7860)

Pushes to `main` are mirrored to the Hugging Face Space automatically via GitHub Actions.
Secrets (API keys, auth) live in **HF Space → Settings → Variables and secrets**, never in this repo.
