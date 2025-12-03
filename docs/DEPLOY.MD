# Deployment

## Docker lokal
cd infra
docker compose up --build

backend → http://localhost:5000
postgres → port 5432

## VPS
- Buat droplet / instance Ubuntu 22.04
- Install Docker + Docker Compose
- Copy repo ke VPS
- Set .env
- docker compose up -d

## SSL
Bisa pakai:
- Cloudflare proxy
- Caddy reverse proxy
- Nginx + certbot

Rencana hosting SaaS:
- Server Indonesia = Niagahoster / IDCloudHost / DigitalOcean SGP
