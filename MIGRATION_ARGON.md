# Migration SamTech vers Argon React

## Vue d'ensemble
Migration de l'application SamTech actuelle (Vite + React + Tailwind) vers le template Argon React pour améliorer l'interface utilisateur et profiter des composants pré-construits.

## Étapes de migration

### 1. Préparation et sauvegarde
- [x] Analyse de la structure actuelle
- [ ] Sauvegarde complète du projet
- [ ] Documentation des composants personnalisés à conserver

### 2. Installation d'Argon React
- [ ] Télécharger le template Argon React
- [ ] Intégrer les dépendances Argon dans package.json
- [ ] Configurer les assets (CSS, JS, images)

### 3. Migration de la structure
- [ ] Adapter le layout principal (DashboardLayout)
- [ ] Migrer la navigation et le menu latéral
- [ ] Adapter le système d'authentification
- [ ] Migrer les contextes (AuthContext, etc.)

### 4. Migration des composants
- [ ] Tableaux de données (remplacer par les composants Argon)
- [ ] Formulaires (utiliser les inputs Argon)
- [ ] Modals et popups
- [ ] Cartes et widgets du dashboard
- [ ] Graphiques (adapter Chart.js avec le style Argon)

### 5. Migration des pages
- [ ] Dashboard principal
- [ ] Pages de gestion (clients, fournisseurs, factures)
- [ ] Pages d'authentification
- [ ] Pages de paramétrage
- [ ] Pages de rapports

### 6. Styles et thème
- [ ] Intégrer les variables CSS d'Argon
- [ ] Adapter les couleurs personnalisées SamTech
- [ ] Responsive design
- [ ] Mode sombre (si applicable)

### 7. Tests et validation
- [ ] Tests fonctionnels
- [ ] Tests de responsive
- [ ] Validation de l'UX
- [ ] Performance

## Composants Argon à utiliser

### Navigation
- Sidebar Argon avec menu hiérarchique
- Navbar avec profil utilisateur et notifications
- Breadcrumbs

### Tables
- Composant DataTable Argon
- Pagination
- Filtres et recherche

### Formulaires
- Input components stylisés
- Select et multi-select
- Date pickers
- File upload

### Widgets
- Cards et panels
- Stats widgets
- Charts containers
- Timeline components

### Modals
- Modal components Argon
- Confirmations
- Forms modals

## Dépendances à ajouter
```json
{
  "@material-tailwind/react": "^2.1.4",
  "react-perfect-scrollbar": "^1.5.8",
  "@heroicons/react": "^2.0.18" (déjà présent),
  "chart.js": "^4.4.0" (déjà présent),
  "react-chartjs-2": "^5.2.0" (déjà présent)
}
```

## Configuration
- Adapter tailwind.config.js pour Argon
- Configurer les couleurs du thème SamTech
- Intégrer les fonts Argon

## Points d'attention
- Conserver la logique métier existante
- Maintenir la compatibilité avec le backend
- Préserver les permissions et la sécurité
- Garder les fonctionnalités spécifiques SamTech

## Timeline estimée
- Semaine 1: Préparation et setup
- Semaine 2: Migration layout et navigation
- Semaine 3: Migration composants principaux
- Semaine 4: Migration pages et finalisation 