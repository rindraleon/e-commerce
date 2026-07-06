# Déploiement Render / Railway + domaine réel

> Configuration préparée pour `shop.monsite.com`.
> Si ton vrai domaine final change, remplace simplement cette valeur dans les variables d'environnement.

## 1. Ce qui a été préparé

- `render.yaml` pour un déploiement **Render Blueprint**
- Docker frontend rendu compatible **ports dynamiques** (`PORT`) pour Render/Railway
- proxy frontend `/api` et `/uploads` configurable par variables runtime
- configuration frontend runtime via `app-config.js`
- support backend pour `DATABASE_URL`
- workflows GitHub Actions :
  - `.github/workflows/ci.yml`
  - `.github/workflows/deploy-render.yml`
  - `.github/workflows/deploy-railway.yml`
  - `.github/workflows/postgres-backup.yml`
- scripts backup / restore PostgreSQL :
  - `scripts/backup-postgres.sh`
  - `scripts/restore-postgres.sh`

---

## 2. Variables importantes

### Backend

- `FRONTEND_URL=https://shop.monsite.com`
- `CORS_ALLOWED_ORIGINS=https://shop.monsite.com`
- `JWT_SECRET=<secret-long-et-fort>`
- `DATABASE_URL=<url postgres managée>`
- `DB_SSL=false` (ou `true` si ton fournisseur l’exige)
- `TRUST_PROXY=true`
- `THROTTLE_TTL=60`
- `THROTTLE_LIMIT=120`
- `AUTH_THROTTLE_TTL=60`
- `AUTH_THROTTLE_LIMIT=10`
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM`

### Frontend

- `VITE_SITE_URL=https://shop.monsite.com`
- `VITE_API_BASE_URL=/api`
- `VITE_API_PREFIX=`
- `BACKEND_UPSTREAM_SCHEME=http` ou `https`
- `BACKEND_UPSTREAM_HOSTPORT=<backend-host:port>`

> Le frontend proxy automatiquement `/api/*` et `/uploads/*` vers le backend.

---

## 3. Déploiement sur Render

### Option recommandée
Utiliser directement `render.yaml`.

### Services attendus
- `ecommerce-postgres`
- `ecommerce-backend`
- `ecommerce-frontend`

### Domaine
Attacher le domaine **`shop.monsite.com`** au service frontend `ecommerce-frontend`.

### Secrets GitHub pour déploiement Render
Si tu utilises le workflow automatique Render, ajoute :

- `RENDER_BACKEND_DEPLOY_HOOK_URL`
- `RENDER_FRONTEND_DEPLOY_HOOK_URL`

Le workflow `deploy-render.yml` déclenchera les déploiements seulement après succès du workflow CI sur `main`.

---

## 4. Déploiement sur Railway

### Services à créer
- 1 service PostgreSQL managé
- 1 service backend (root directory: `backend`)
- 1 service frontend (root directory: `frontend`)

### Backend Railway
Variables recommandées :

```env
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://shop.monsite.com
CORS_ALLOWED_ORIGINS=https://shop.monsite.com
DATABASE_URL=<DATABASE_URL Railway Postgres>
DB_SSL=false
JWT_SECRET=<secret-long-et-fort>
TRUST_PROXY=true
THROTTLE_TTL=60
THROTTLE_LIMIT=120
AUTH_THROTTLE_TTL=60
AUTH_THROTTLE_LIMIT=10
MAIL_HOST=
MAIL_PORT=587
MAIL_USER=
MAIL_PASSWORD=
MAIL_FROM=no-reply@shop.monsite.com
```

### Frontend Railway
Variables recommandées :

```env
VITE_SITE_URL=https://shop.monsite.com
VITE_API_BASE_URL=/api
VITE_API_PREFIX=
BACKEND_UPSTREAM_SCHEME=http
BACKEND_UPSTREAM_HOSTPORT=<private-backend-host:port-ou-domaine-public>
```

### Domaine
Attacher le domaine **`shop.monsite.com`** au service frontend.

### Secrets GitHub pour déploiement Railway
- `RAILWAY_TOKEN`
- `RAILWAY_BACKEND_SERVICE_ID`
- `RAILWAY_FRONTEND_SERVICE_ID`

Le workflow `deploy-railway.yml` déploiera backend + frontend après succès du workflow CI sur `main`.

---

## 5. Backups PostgreSQL

### Backup logique automatique
Workflow : `.github/workflows/postgres-backup.yml`

Il fait :
1. `pg_dump`
2. compression `.sql.gz`
3. upload comme **artifact GitHub Actions**
4. upload vers **S3** si les secrets AWS sont définis

### Secrets GitHub à ajouter
Obligatoire :
- `BACKUP_DATABASE_URL`

Optionnel pour S3 :
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `S3_BACKUP_BUCKET`

### Lancement manuel
Depuis GitHub Actions :
- workflow **PostgreSQL Backup**
- bouton **Run workflow**

### Restauration manuelle
```bash
RESTORE_DATABASE_URL="postgresql://..."
BACKUP_FILE="./backups/postgres/eshop-YYYY-MM-DDTHH-MM-SSZ.sql.gz"
bash ./scripts/restore-postgres.sh
```

---

## 6. GitHub Actions prévus

### `ci.yml`
Exécute automatiquement :
- backend lint
- backend build
- backend tests
- backend e2e
- frontend lint
- frontend build
- frontend tests

### `deploy-render.yml`
Déploie sur Render via **deploy hooks** après succès CI sur `main`.

### `deploy-railway.yml`
Déploie sur Railway via **Railway CLI** après succès CI sur `main`.

### `postgres-backup.yml`
Crée un backup quotidien PostgreSQL + artifact + S3.

---

## 7. Vérification finale après mise en ligne

### Frontend
- `https://shop.monsite.com`

### Backend via proxy frontend
- `https://shop.monsite.com/api/health`
- `https://shop.monsite.com/uploads/...`

### Points à vérifier
- login / signup
- création produit admin
- upload image produit / article
- commande + paiement mobile
- emails
- dashboard admin
- blog / commentaires / likes
