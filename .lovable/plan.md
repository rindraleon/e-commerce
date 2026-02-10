

# 🛒 Site E-Commerce Complet — Plan d'Implémentation

## Vue d'ensemble
Site e-commerce bilingue (FR/EN), design coloré et dynamique, avec gestion complète des produits, commandes, paiements (Stripe + M-Pesa), et panel administrateur. Backend sur Supabase.

---

## 🎨 Design & Thème
- **Style** : Coloré et dynamique avec couleurs vives (orange/bleu/vert), animations fluides, hover effects
- **Responsive** : Mobile-first, adapté desktop/tablette/mobile
- **Bilingue** : Système i18n Français / Anglais avec switcher de langue

---

## 📄 Pages Publiques (Visiteurs & Clients)

### Page d'accueil
- Hero banner animé avec promotions
- Catégories en vedette avec icônes colorées
- Produits populaires / nouveautés en carrousel
- Barre de recherche proéminente

### Catalogue produits
- Grille de produits avec filtres (catégorie, prix, disponibilité)
- Tri par prix, popularité, date
- Pagination
- Badge "Rupture de stock" pour stock = 0

### Page détail produit
- Galerie d'images avec zoom
- Description, prix, stock disponible
- Bouton "Ajouter au panier" (désactivé si stock = 0)
- Section avis clients (note + commentaires)
- Produits similaires

### Panier
- Liste des produits avec quantités modifiables
- Calcul automatique du total
- Vérification du stock en temps réel
- Bouton "Passer la commande"

### Processus de commande (Checkout)
- Formulaire d'adresse de livraison
- Calcul des frais de livraison (selon zone et poids)
- Choix du moyen de paiement (Stripe / M-Pesa)
- Récapitulatif avant validation
- Confirmation de commande

### Suivi de commande
- Liste des commandes du client
- Statuts visuels : En attente → Payée → Expédiée → Livrée
- Timeline de progression
- Détails de chaque commande

### Gestion des retours
- Formulaire de demande de retour (dans le délai autorisé)
- Suivi du statut du retour/remboursement

---

## 👤 Espace Client

### Inscription / Connexion
- Inscription par email avec validation
- Connexion sécurisée via Supabase Auth
- Mots de passe cryptés automatiquement

### Profil utilisateur
- Modification des informations personnelles
- Gestion des adresses de livraison
- Historique des commandes

### Avis clients
- Laisser un avis uniquement sur les produits commandés
- Note (étoiles) + commentaire textuel

---

## 🔧 Panel Administrateur

### Dashboard
- Statistiques de ventes (chiffre d'affaires, commandes du jour/mois)
- Graphiques avec Recharts (ventes, produits populaires)
- Alertes stock faible

### Gestion des produits
- CRUD complet (ajout, modification, suppression avec confirmation)
- Upload de multiples images par produit
- Gestion des catégories
- Indicateur visuel du niveau de stock

### Gestion des commandes
- Liste de toutes les commandes avec filtres par statut
- Changement de statut (avec règles : annulée ≠ expédiable, livrée = non modifiable)
- Détails complets de chaque commande

### Gestion des clients
- Liste des clients inscrits
- Consultation des profils et historiques

### Gestion des avis
- Modération : valider ou refuser les avis
- Suppression des avis offensants

### Gestion des retours
- Validation des demandes de retour
- Déclenchement du remboursement

### Journal d'activités
- Traçabilité de chaque action administrative

---

## 💳 Paiements

### Stripe
- Paiement par carte bancaire sécurisé
- Intégration via l'outil Stripe de Lovable

### M-Pesa
- Intégration via edge function Supabase
- API M-Pesa (Daraja) pour les paiements mobiles

---

## 🗄️ Base de Données (Supabase)

### Tables principales
- **profiles** : infos utilisateurs
- **user_roles** : rôles (client/admin) — table séparée pour la sécurité
- **categories** : catégories de produits
- **products** : produits avec stock, prix, description
- **product_images** : images multiples par produit
- **cart_items** : panier lié au client
- **orders** : commandes avec statuts
- **order_items** : détail des produits commandés
- **payments** : historique des paiements
- **addresses** : adresses de livraison
- **reviews** : avis clients avec statut de modération
- **returns** : demandes de retour/remboursement
- **admin_logs** : journal des actions admin

### Sécurité
- Row Level Security (RLS) sur toutes les tables
- Les clients ne voient que leurs propres données
- Les admins ont accès étendu via fonction `has_role()`
- Validation des entrées avec Zod côté client

---

## 🌍 Internationalisation
- Système de traduction FR/EN
- Switcher de langue dans le header
- Toutes les chaînes de texte traduites

