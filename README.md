# Notify

**Notify** is a personal dashboard application that allows users to build and customize their own desktop widgets. Users can authenticate with Keycloak and manage widgets such as clocks, weather, and task management through a modern React interface.

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12-blue?logo=python" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-009688?logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/React-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Docker-2496ED?logo=docker" alt="Docker">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
</p>

<p align="center">
  <img src="docs/images/notify_dashboard.png" alt="Notify Dashboard Preview" width="800">
</p>

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start with Docker](#quick-start-with-docker)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [REST API](#rest-api)
- [Project Structure](#project-structure)
- [Security & Deployment Notes](#security--deployment-notes)
- [Code Quality](#code-quality)
- [Contributors](#contributors)
- [License](#license)

## Features

- User authentication and registration with Keycloak (OpenID Connect, PKCE)
- Create, favorite, restore, move to trash, and delete widgets
- **Clock Widget**: select locations/time zones with real-time clock updates
- **Weather Widget**: search locations and display current weather data using the Open-Meteo API
- **Task Management Widget**: create and delete daily tasks
- Customize widget size, color, transparency, and border radius
- Persist dashboard state using REST APIs and PostgreSQL
- Light and dark mode support

## Technology Stack

| Component | Technology |
| ---------- | ---------- |
| Frontend | React 19, Vite 8, Tailwind CSS, TypeScript |
| Backend | FastAPI, SQLAlchemy, Uvicorn |
| Database | PostgreSQL 17 |
| Authentication | Keycloak 26, OpenID Connect |
| Database Management | pgAdmin 4 |
| Containerization | Docker Compose |

## Architecture

```text
Browser
  |-- React/Vite (Frontend :5173)
  |     |-- Keycloak (:8080)
  |     `-- FastAPI (:8000)
  |              `-- PostgreSQL (:5433 on host, :5432 inside Docker)
  `-- Open-Meteo APIs (Weather & Geocoding)
```


## Prerequisites

- Docker Desktop or Docker Engine with Docker Compose v2
- A modern web browser with JavaScript enabled

## Quick Start with Docker

### 1. Create the environment file

```bash
cp .env.example .env
```

### 2. Configure environment variables

Ensure your `.env` file contains the following variables. The values below are suitable for local development.

```dotenv
FRONTEND_PORT=5173
BACKEND_PORT=8000
POSTGRES_PORT=5433
POSTGRES_DB=notify_db
POSTGRES_USER=notify
POSTGRES_PASSWORD=notify123
PGADMIN_PORT=5050
PGADMIN_EMAIL=admin@notify.local
PGADMIN_PASSWORD=change-me
KEYCLOAK_PORT=8080
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=change-me
```

### 3. Start all services

```bash
docker compose up --build
```

### 4. Open the application

| Service | URL |
| -------- | --- |
| Notify | http://localhost:5173 |
| FastAPI | http://localhost:8000 |
| API Documentation | http://localhost:8000/docs |
| Keycloak Admin Console | http://localhost:8080 |
| pgAdmin | http://localhost:5050 |

The `notify` realm and `notify-frontend` client are automatically imported from `keycloak/notify-realm.json` when Keycloak starts.

On the Notify homepage, click **Sign In** or **Register** to authenticate using Keycloak.

To stop all containers and remove the database volume:

```bash
docker compose down -v
```

## Local Development

The frontend and backend can also be run independently. A PostgreSQL instance must be accessible, and the backend should be configured with the appropriate `DATABASE_URL`.

### Backend (Linux/macOS)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
```

### Backend (Windows PowerShell)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### Frontend

```bash
cd frontend

npm ci

$env:VITE_API_BASE_URL = "http://127.0.0.1:8000"
$env:VITE_KEYCLOAK_URL = "http://localhost:8080"

npm run dev
```

## Environment Variables

| Variable | Description |
| -------- | ----------- |
| `FRONTEND_PORT` | Public port used by the Vite development server. |
| `BACKEND_PORT` | Public port exposed by the FastAPI server. |
| `POSTGRES_PORT` | PostgreSQL port on the host machine. |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | PostgreSQL initialization credentials. |
| `PGADMIN_PORT`, `PGADMIN_EMAIL`, `PGADMIN_PASSWORD` | pgAdmin configuration. |
| `KEYCLOAK_PORT`, `KEYCLOAK_ADMIN`, `KEYCLOAK_ADMIN_PASSWORD` | Keycloak server configuration. |
| `DATABASE_URL` | SQLAlchemy connection string. The default value works inside Docker Compose. |
| `VITE_API_BASE_URL` | Base URL for backend API requests. Automatically configured when running with Docker Compose. |
| `VITE_KEYCLOAK_URL` | Keycloak server URL. Default: `http://localhost:8080`. |
| `VITE_KEYCLOAK_REALM` | Keycloak realm. Default: `notify`. |
| `VITE_KEYCLOAK_CLIENT_ID` | Keycloak client ID. Default: `notify-frontend`. |

> **Note:** Do not commit the `.env` file. It is already excluded by `.gitignore`.

## REST API

Interactive OpenAPI documentation is available at `/docs` once the backend is running.

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `POST` | `/auth/register` | Create a local development account. |
| `POST` | `/auth/login` | Authenticate a local development account. |
| `POST` | `/auth/social-login` | Mock Google/Facebook login for development. |
| `GET`, `PATCH` | `/dashboard-state/` | Retrieve or update dashboard state. |
| `POST` | `/dashboard-state/reset` | Reset the dashboard to its default state. |
| `GET`, `POST` | `/widgets/` | List or create widgets stored in PostgreSQL. |
| `GET`, `PATCH`, `DELETE` | `/widgets/{widget_id}` | Retrieve, update, or delete a widget by ID. |

## Project Structure

```text
.
|-- backend/          # FastAPI backend, SQLAlchemy models, REST API
|-- frontend/         # React + Vite dashboard
|-- keycloak/         # Realm and client configuration imported at startup
|-- docker-compose.yml
`-- .env.example
```

## Security & Deployment Notes

- The backend currently allows all CORS origins, and API endpoints do not yet enforce Bearer token authentication. This configuration is intended **for development only** and should not be used in production.
- The `/auth/*` endpoints use SHA-256 password hashing and `dev-token-*` tokens for development purposes. Production authentication is handled through Keycloak.
- Replace all default passwords in `.env` before deployment, and configure the appropriate `redirectUris` and `webOrigins` in Keycloak for your production domain.
- Weather and geocoding services rely on the Open-Meteo API and require an active Internet connection.

## Code Quality

### Frontend

```bash
cd frontend

npm run lint
npm run build
```

Automated backend tests have not yet been implemented.
````

## Contributors

| Name | Role |
|------|------|
| Hoang Anh Thu Nguyen | Backend Development, Authentication, API Integration |
| Mai Anh Tran | Contributor |

## License

This project is licensed under the MIT License.
