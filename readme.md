
# GLPI Ticket Transfer Tool by Rest API (English)

This tool is developed for transferring tickets between two GLPI (Gestion Libre de Parc Informatique) systems via a REST API. I faced significant challenges in transferring tickets from an old GLPI system to a new one due to a lack of available resources. Therefore, I developed this application to make the process easier.

## Features
- Transfers tickets from an old to a new GLPI system.
- Filters tickets based on status.
- Handles errors gracefully, logging them to `error.log` for manual intervention if needed.

## Prerequisites

- Node.js installed on your system. Check by running `node -v`. If not installed, [download and install Node.js](https://nodejs.org/en/download/).
- Access to both GLPI systems.
- Valid `app_token` for both systems.
- The API URLs of both systems.

## Setup

1. Clone or download this repository.
2. Navigate to the directory and install dependencies with `npm install`.

## Configuration

Create a `.env` file with the following variables:

```plaintext
# GLPI API URLs
OLD_BASE_URL=http://your-old-glpi-url/apirest.php
NEW_BASE_URL=http://your-new-glpi-url/apirest.php

# App tokens for the old and new GLPI systems
OLD_APP_TOKEN=your-old-app-token
NEW_APP_TOKEN=your-new-app-token

# Basic Auth keys for the old and new GLPI systems
OLD_AUTH_KEY=your-old-auth-key
NEW_AUTH_KEY=your-new-auth-key

# Default user ID and email for the new GLPI system
NEW_GLPI_DEFAULT_USER_ID=your-default-user-id
NEW_GLPI_DEFAULT_USER_EMAIL=your-default-user-email

# Batch size for processing tickets
BATCH_SIZE=number-of-tickets-per-batch

# Database configuration for DBtoJSON script
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_DATABASE=your-database-name

```

## Usage
- Ensure to replace your-old-glpi-url, your-new-glpi-url, your-old-app-token, your-new-app-token, etc., with the actual values relevant to your GLPI systems and database. This configuration helps in securely managing sensitive data.
- Run `dbtoJson` script to fetch user and mail information from the new GLPI system.
- Modify the `ticket.status` filter in the code as needed.
- Execute the tool with `node app.js`.

## Security Tips

- Keep sensitive information like `app_token` in the `.env` file.
- Restrict IP access to the GLPI API.

## Contributing

Feel free to contribute or reach out for any specific queries at cs.ahmetyilmaz@gmail.com.

---

# Outil de Transfert de Tickets GLPI par API Rest (Français)

Cet outil est développé pour le transfert de tickets entre deux systèmes GLPI (Gestion Libre de Parc Informatique) via une API Rest. J'ai rencontré des défis significatifs pour transférer des tickets d'un ancien système GLPI à un nouveau, dû à un manque de ressources disponibles. J'ai donc développé cette application pour faciliter le processus.

## Fonctionnalités
- Transfère des tickets d'un ancien à un nouveau système GLPI.
- Filtre les tickets en fonction de leur statut.
- Gère les erreurs de manière élégante, les enregistrant dans `error.log` pour une intervention manuelle si nécessaire.

## Prérequis

- Node.js installé sur votre système. Vérifiez en exécutant `node -v`. Si non installé, [téléchargez et installez Node.js](https://nodejs.org/fr/download/).
- Accès aux deux systèmes GLPI.
- `app_token` valide pour les deux systèmes.
- Les URL API des deux systèmes.

## Installation

1. Clonez ou téléchargez ce dépôt.
2. Naviguez vers le répertoire et installez les dépendances avec `npm install`.

## Configuration

Créez un fichier `.env` avec les variables suivantes :

```plaintext
# GLPI API URLs
OLD_BASE_URL=http://your-old-glpi-url/apirest.php
NEW_BASE_URL=http://your-new-glpi-url/apirest.php

# App tokens for the old and new GLPI systems
OLD_APP_TOKEN=your-old-app-token
NEW_APP_TOKEN=your-new-app-token

# Basic Auth keys for the old and new GLPI systems
OLD_AUTH_KEY=your-old-auth-key
NEW_AUTH_KEY=your-new-auth-key

# Default user ID and email for the new GLPI system
NEW_GLPI_DEFAULT_USER_ID=your-default-user-id
NEW_GLPI_DEFAULT_USER_EMAIL=your-default-user-email

# Batch size for processing tickets
BATCH_SIZE=number-of-tickets-per-batch

# Database configuration for DBtoJSON script
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_DATABASE=your-database-name

```

## Utilisation

- Exécutez le script `dbtoJson` pour récupérer les informations des utilisateurs et mails du nouveau système GLPI.
- Modifiez le filtre `ticket.status` dans le code selon vos besoins.
- Exécutez l'outil avec `node app.js`.

## Conseils de Sécurité

- Gardez les informations sensibles comme `app_token` dans le fichier `.env`.
- Restreignez l'accès IP à l'API GLPI.

## Contribution

N'hésitez pas à contribuer ou à me contacter pour toute question spécifique à cs.ahmetyilmaz@gmail.com.
