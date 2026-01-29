# MATTR Issuance Demo Application

A full-stack demo application for issuing verifiable credentials using the MATTR issuance platform. Built with NestJS backend and Next.js frontend.

## Architecture Overview

This application follows a clean separation between frontend and backend:

- **Frontend (Next.js)**: React-based UI that communicates with the backend API only
- **Backend (NestJS)**: Handles all external API integrations (MATTR platform), session management, authentication, and business logic

### System Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Browser   │────────▶│  Next.js    │────────▶│   NestJS    │
│             │         │  Frontend   │         │   Backend   │
└─────────────┘         └─────────────┘         └─────────────┘
                                                       │
                                                       ├─────────┐
                                                       │         │
                                                ┌──────▼──┐  ┌──▼──────┐
                                                │  Redis  │  │  MATTR  │
                                                │ Session │  │  API    │
                                                │  Store  │  │         │
                                                └─────────┘  └─────────┘
```

## Features

- ✅ JWT-based authentication
- ✅ Configurable session management (Redis or in-memory)
- ✅ Comprehensive logging infrastructure
- ✅ MATTR Platform API integration
- ✅ Protected routes and API endpoints
- ✅ Type-safe API client
- ✅ Modern UI with Tailwind CSS

## Project Structure

```
zespri-demo/
├── backend/                 # NestJS Backend
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── config/         # Configuration management
│   │   ├── issuance/       # MATTR issuance module
│   │   ├── logger/         # Logging infrastructure
│   │   ├── session/        # Session management
│   │   ├── users/          # User management
│   │   └── common/         # Shared utilities
│   └── .env.example
│
├── frontend/               # Next.js Frontend
│   ├── src/
│   │   ├── app/           # Next.js App Router pages
│   │   ├── components/    # React components
│   │   ├── lib/           # Utilities and API client
│   │   ├── hooks/         # Custom React hooks
│   │   ├── context/       # React Context providers
│   │   └── types/         # TypeScript types
│   └── .env.local.example
│
├── docker-compose.yml      # Redis setup
└── README.md
```

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for Redis)
- MATTR Platform API credentials

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd zespri-demo
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env and configure:
# - JWT_SECRET (use a strong secret in production)
# - MATTR_API_URL
# - MATTR_API_KEY
# - REDIS_HOST, REDIS_PORT (if not using Docker)
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Edit .env.local and configure:
# - NEXT_PUBLIC_API_URL (backend URL, default: http://localhost:3001)
```

### 4. Start Redis (Docker)

```bash
# From project root
docker-compose up -d redis

# Verify Redis is running
docker ps
```

### 5. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Configuration

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | 3001 |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRATION` | Token expiration time | 1d |
| `REDIS_HOST` | Redis host | localhost |
| `REDIS_PORT` | Redis port | 6379 |
| `SESSION_STORE_TYPE` | Session storage (redis/memory) | redis |
| `SESSION_TTL` | Session TTL in seconds | 3600 |
| `MATTR_API_URL` | MATTR Platform API URL | - |
| `MATTR_API_KEY` | MATTR API key | - |
| `LOG_LEVEL` | Logging level | info |

### Frontend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | http://localhost:3001 |
| `NEXT_PUBLIC_APP_NAME` | Application name | MATTR Issuance Demo |

## Usage

### Default Credentials

The application comes with a demo user:
- Email: `admin@example.com`
- Password: `password123`

**Note:** In production, implement proper user registration and password management.

### API Endpoints

#### Authentication
- `POST /auth/login` - Login and get JWT token
- `POST /auth/logout` - Logout and invalidate session
- `GET /auth/profile` - Get current user profile (protected)

#### Issuance
- `POST /issuance/create` - Create a new credential (protected)
- `POST /issuance/issue` - Issue a credential (protected)
- `GET /issuance/status/:id` - Get credential status (protected)

#### Session
- `GET /session` - Get current session (protected)
- `POST /session` - Update session data (protected)
- `DELETE /session` - Delete session (protected)

## Development

### Backend Commands

```bash
cd backend

# Development with hot reload
npm run start:dev

# Production build
npm run build
npm run start:prod

# Run tests
npm test
```

### Frontend Commands

```bash
cd frontend

# Development server
npm run dev

# Production build
npm run build
npm run start

# Linting
npm run lint
```

## Session Management

The application supports configurable session storage:

- **Redis** (recommended for production): Set `SESSION_STORE_TYPE=redis`
- **In-memory** (for development): Set `SESSION_STORE_TYPE=memory`

Sessions are stored with a TTL (time-to-live) configured via `SESSION_TTL` (default: 3600 seconds).

## Logging

The backend uses Winston for structured logging. Logs are written to:
- Console (with colors)
- `logs/error.log` (errors only)
- `logs/combined.log` (all logs)

Log levels can be configured via `LOG_LEVEL` environment variable (debug, info, warn, error).

## MATTR Platform Integration

The issuance module integrates with the MATTR Platform API. Update the following in your `.env`:

```
MATTR_API_URL=https://api.mattr.global
MATTR_API_KEY=your-api-key-here
```

**Note:** The current implementation includes placeholder/mock responses. Update the `issuance.service.ts` file with the actual MATTR API endpoints and payload structures based on your MATTR Platform documentation.

## Security Considerations

- Use strong `JWT_SECRET` in production
- Store `MATTR_API_KEY` securely (use secrets management)
- Enable HTTPS in production
- Implement rate limiting
- Add input validation and sanitization
- Use httpOnly cookies for tokens in production (current implementation uses localStorage)
- Implement proper CORS policies

## Troubleshooting

### Redis Connection Issues

If Redis connection fails:
1. Verify Redis is running: `docker ps`
2. Check Redis logs: `docker logs matt-issuance-redis`
3. Verify `REDIS_HOST` and `REDIS_PORT` in `.env`
4. Try using in-memory storage: `SESSION_STORE_TYPE=memory`

### Backend Won't Start

1. Check Node.js version: `node --version` (should be 18+)
2. Verify dependencies: `npm install`
3. Check environment variables: Ensure `.env` file exists and is configured
4. Check logs for errors

### Frontend API Errors

1. Verify `NEXT_PUBLIC_API_URL` in `.env.local`
2. Ensure backend is running
3. Check browser console for CORS errors
4. Verify JWT token is being sent in requests

## License

This project is a demo application for educational purposes.

## Support

For issues related to:
- **MATTR Platform**: Consult MATTR Platform documentation
- **NestJS**: Visit [nestjs.com](https://nestjs.com)
- **Next.js**: Visit [nextjs.org](https://nextjs.org)



# Steps to Start the applicaiton

## 1. Start Redis (Docker)

### Start Docker desktop
From windows start menu

```bash
# From project root
docker-compose up -d redis

# Verify Redis is running
docker ps
```

## 2. Start the Application


### Start Backend
**Git Bash Terminal - Backend:**
```bash
cd backend
npm run start:dev
```

### Start Frontend
**Git Bash Terminal - Frontend:**
```bash
cd frontend
npm run dev
```

### Start Mobile App

Both the mobile device and tthe application should be run on the same network
Check IP address on compuater
Update mobile applicaiton config file

```bash
cd c:\projects\stack_digital\stack-verifier\mattr-verifier
npx expo start --dev-client
```

## On Mobile device
Conect using 
exp://192.168.1.59:8081


curl -X POST http://192.168.1.59:3001/api/v1/verify -H "Content-Type: application/json"  -d '{"payload": "your-credential-payload-here"}'
