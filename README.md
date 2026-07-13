# OpsCenter

A unified operations dashboard built with **Next.js 16**, **React 19**, and **TypeScript**. Serves as the single frontend for six independent backend microservices — authentication, concurrency testing, rate limiting, job queues, file storage, and cache performance.

## Modules

| Module | Backend Service | What It Does |
|--------|-----------------|--------------|
| Identity Vault | AuthVault | Register, login, logout, JWT session management |
| Flashlock Engine | FlashLock Engine | Flash sale simulator, lock mode switching |
| Rate Limiter Lab | Rate Limiter | Login attack simulator, algorithm switching |
| Task Yard | TaskYard | Job submission, real-time SSE pipeline feed, chaos mode |
| Cloud Stash | CloudStash | File upload/download, bucket management |
| Swift Flow | SwiftFlow | Cache vs database speed comparison |

## Related Repositories

Backend services live in their own repos:

| Service | Repo |
|---------|------|
| AuthVault | [auth-vault](https://github.com/Daemon1319/auth-vault) |
| FlashLock Engine | [flashlock-engine](https://github.com/Daemon1319/flashlock-engine) |
| Rate Limiter | [ratelimiter-lab](https://github.com/Daemon1319/ratelimiter-lab) |
| TaskYard | [task-yard](https://github.com/Daemon1319/task-yard) |
| CloudStash | [cloud-stash](https://github.com/Daemon1319/cloud-stash) |
| SwiftFlow | [swift-flow](https://github.com/Daemon1319/swift-flow) |

## Tech Stack

Next.js 16 · React 19 · TypeScript 5 · Tailwind CSS 4 · jwt-decode

## Project Structure

```
src/features/
├── auth-vault/          # Identity & session management
├── flashlock-engine/    # Concurrency lock testing UI
├── rate-limiter-lab/    # Rate limiting algorithm lab
├── task-yard/           # Job queue & pipeline dashboard
├── cloud-stash/         # File storage management
└── swift-flow/          # Cache vs DB speed comparison
```
