# Family Tree

An interactive family tree web application — visualise, manage, and share your family history.

## Quick Start

```bash
npm install
cp .env.example .env         # Edit JWT_SECRET for production
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:3001
- Demo login: `demo@familytree.app` / `demo1234`

## Project Structure

```
family-tree/
  ├── client/     React + Vite + D3.js frontend
  ├── server/     Express + node:sqlite backend
  └── shared/     Shared TypeScript types + Zod schemas
```

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| State | Zustand |
| Tree viz | D3.js (d3-hierarchy + d3-zoom) |
| Animations | Framer Motion |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite via node:sqlite (built-in, no compilation) |
| Auth | JWT in httpOnly cookie |
| Uploads | Multer |
| Validation | Zod (shared between client + server) |

## Features

- **Interactive D3 tree** — hierarchical layout with spouse overlays, pan/zoom, hover highlighting
- **Full CRUD** — add/edit/delete persons and relationships
- **Photo uploads** — profile photos stored server-side
- **Search** — filter persons by name, dims non-matching nodes
- **Export** — PNG and PDF export of the tree canvas
- **Sharing** — shareable read-only link (no login required for viewers)
- **Multiple trees** — create and switch between trees
- **Dark mode** — warm parchment light theme + dark mode toggle
- **Seed data** — The Sharma Family (8 members, 3 generations) seeded on first run

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Server port |
| `JWT_SECRET` | *(change me)* | Secret for JWT signing |
| `DB_PATH` | `./server/data/family.db` | SQLite database path |
| `UPLOAD_DIR` | `./server/uploads` | Photo upload directory |
| `CLIENT_URL` | `http://localhost:5173` | CORS allowed origin |

## Architecture

The D3 tree uses an **Option A** layout: `d3.tree()` builds a top-down hierarchy from parent-child relationships, choosing one primary parent per child. Spouses are positioned adjacent via a post-processing step, connected by dashed gold lines. React renders all DOM elements at D3-computed positions ("D3 for math, React for DOM").
