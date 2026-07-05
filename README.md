# OpsCenter

A unified operations dashboard built with **Next.js 16**, **React 19**, and **TypeScript**. Serves as the single frontend for five independent backend microservices — authentication, concurrency testing, rate limiting, job queues, and file storage.

## Modules

| Module | Backend Service | What It Does |
|--------|----------------|--------------|
| Identity Vault | AuthVault | Register, login, logout, JWT session management |
| High-Concurrency Locks | FlashLock Engine | Flash sale simulator, lock mode switching |
| Rate Limiter Lab | Rate Limiter | Login attack simulator, algorithm switching |
| Task Yard | TaskYard | Job submission, real-time SSE pipeline feed, chaos mode |
| Cloud Stash | CloudStash | File upload/download, bucket management |

## Tech Stack

Next.js 16 · React 19 · TypeScript 5 · Tailwind CSS 4 · jwt-decode

## Project Structure

```
src/features/
├── auth-vault/          # Identity & session management
├── flashsale-engine/    # Concurrency lock testing UI
├── rate-limiter-lab/    # Rate limiting algorithm lab
├── task-yard/           # Job queue & pipeline dashboard
└── cloud-stash/         # File storage management
```

