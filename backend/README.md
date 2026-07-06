# E-Shop Pro Backend

Backend NestJS pour la plateforme e-commerce, connecté désormais à **PostgreSQL** via **TypeORM**.

## Fonctionnalités

- Authentification JWT
- Gestion des produits, catégories, panier, commandes, avis et retours
- Gestion admin
- Pagination, recherche et filtres sur plusieurs endpoints
- Validation globale et gestion centralisée des erreurs

## Stack

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT + bcrypt
- **API**: REST

## Installation

1. Aller dans le dossier backend
2. Installer les dépendances
   ```bash
   npm install
   ```
3. Copier `.env.example` vers `.env`
4. Configurer PostgreSQL
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=eshop
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   JWT_SECRET=change_this_secret
   ```
5. Lancer le backend
   ```bash
   npm run start:dev
   ```

## Notes PostgreSQL

- Le driver utilisé est **pg**
- Le module TypeORM est configuré avec `uuidExtension: 'pgcrypto'`
- `synchronize: true` est activé pour le développement uniquement

## Variables d'environnement

- `PORT`
- `FRONTEND_URL`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `NODE_ENV`

## Docker

Fichiers ajoutés :
- `backend/docker/Dockerfile`
- `backend/docker/docker-compose.yml`
- `backend/.dockerignore`

Lancer PostgreSQL + le backend + Mailpit :
```bash
cd backend/docker
docker compose up --build -d
```

Arrêter les services :
```bash
docker compose down
```

Voir les logs :
```bash
docker compose logs -f
```

Mailpit (emails de dev) :
- SMTP : `mailpit:1025`
- Interface web : `http://localhost:8025`

## Email SMTP réel

### Brevo
```env
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=587
MAIL_USER=your_brevo_login
MAIL_PASSWORD=your_brevo_smtp_key
MAIL_FROM=no-reply@your-domain.com
```

### Gmail
```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_FROM=your@gmail.com
```

> Pour Gmail, utilisez un **mot de passe d’application**, pas votre mot de passe principal.

## Seed de démonstration

Un vrai seed de démonstration est disponible pour préparer rapidement le projet avec :
- un **admin par défaut**
- un **client de démonstration**
- des **catégories**
- des **produits**
- des **coupons**
- des **articles/blogs de démonstration**
- des **commandes**
- des **avis**
- un peu d’**engagement blog** (likes / commentaires)

### Pré-requis
Le backend doit pouvoir se connecter à PostgreSQL.

### Lancer le seed
```bash
npm run seed
```

### Réinitialiser puis reseeder les données de démonstration
```bash
npm run seed -- --reset
```

### Comptes générés
```txt
Admin : admin@eshop.local / admin123
Client : client@eshop.local / client123
```

> Le script est idempotent : vous pouvez le relancer pour remettre les données de démonstration à jour sans recréer des doublons principaux.
>
> Depuis l’admin, un bouton **Seeder / reset démo** est aussi disponible sur le dashboard pour regénérer les données de démonstration directement depuis l’interface.

## Scripts utiles

```bash
npm run build
npm run start:dev
npm run test
npm run lint
npm run seed
```
