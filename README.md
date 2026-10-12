# frontend

[![CI Pipeline](https://github.com/stackstormproject/frontend/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/stackstormproject/frontend/actions)
![Coverage](https://img.shields.io/badge/coverage-pending-lightgrey)

StackStorm frontend: React (Vite) single-page application for the Dickwella Fashion Corner e-commerce system.

Broader project: https://github.com/stackstormproject

## Tech stack
React 18+, Vite, Redux Toolkit, React Router, Axios, Vitest.

## Prerequisites
| Software | Version |
|---|---|
| Node.js | 20 LTS |
| npm | 10 or newer |
| Git | latest |
| Backend API | running on http://localhost:5000 (see the backend repo) |

## Installation and run
1. `git clone https://github.com/stackstormproject/frontend.git` and `cd frontend`
2. `npm install`
3. Copy `.env.example` to `.env`
4. `npm run dev`
5. Open http://localhost:5173

## Scripts
`npm run dev`, `npm run build`, `npm run lint`, `npm run format:check`, `npm test`, `npm run test:coverage`

## Branches and pull requests
- Branches: `main`, `develop`, `feature/<issue>-<slug>`, `fix/<issue>-<slug>`
- Open PRs against `develop`. CI must pass and one teammate must approve
- Never commit secrets. `.env` is git-ignored

## CI/CD
The pipeline is defined in the infra repo (`frontend-ci.yml`) and called from `.github/workflows/ci.yml`.

## Deployed application
Staging URL: to be added when hosting is configured.

## Related repositories
backend, infra (Docker and shared CI/CD), documents (SRS, SDS, ADRs).