# Mise en production

## 1) Préparer les variables
Copier le fichier d'exemple :

```bash
cp .env.production.example .env.production
```

Puis modifier au minimum :
- `DOMAIN_NAME`
- `ACME_EMAIL`
- `FRONTEND_URL`
- `CORS_ALLOWED_ORIGINS`
- `VITE_SITE_URL`
- `JWT_SECRET`
- `POSTGRES_PASSWORD`
- les variables SMTP si vous voulez les emails réels

## 2) DNS
Pointer le domaine vers le serveur :
- enregistrement `A` vers l'IP publique
- ou `AAAA` si IPv6

Exemple :
- `shop.example.com -> votre serveur`

## 3) Lancer la stack HTTPS
Depuis la racine du projet :

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

## 4) Services exposés
En production, seuls ces ports sont publics :
- `80` -> redirection / validation TLS
- `443` -> site HTTPS

PostgreSQL, backend et frontend restent internes au réseau Docker.

## 5) Reverse proxy
La stack utilise **Caddy** :
- HTTPS automatique avec Let's Encrypt
- reverse proxy vers le frontend
- proxy `/api/*`, `/uploads/*` et `/health` vers le backend
- en-têtes de sécurité HTTP activés

## 6) Vérifications
Tester après le démarrage :

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
curl -I https://votre-domaine
curl https://votre-domaine/health
```

## 7) Conseils sécurité
- utiliser un `JWT_SECRET` long et aléatoire
- garder `TRUST_PROXY=true` derrière Caddy
- limiter l'accès SSH au serveur
- sauvegarder le volume PostgreSQL régulièrement
- surveiller les logs :

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f caddy backend frontend
```
