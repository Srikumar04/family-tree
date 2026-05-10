# Family Tree Web Application — Design Spec
**Date:** 2026-05-10  
**Status:** Approved

---

## Overview

A full-stack Family Tree application where authenticated users can create, visualize, and share interactive family trees. The centrepiece is a D3-powered hierarchical tree canvas with pan/zoom, animated transitions, and relationship overlays.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS (darkMode: 'class') + custom CSS |
| State | Zustand (sliced stores) |
| Tree rendering | D3.js — d3-hierarchy + d3-zoom + SVG foreignObject |
| Animations | Framer Motion (page transitions) |
| Toasts | react-hot-toast |
| Backend | Node.js + Express + TypeScript |
| Database | SQLite via better-sqlite3 (synchronous) |
| Auth | JWT in httpOnly cookie + bcryptjs |
| File uploads | Multer → /uploads static dir |
| Export | html2canvas + jsPDF |
| Validation | Zod (shared between client and server) |
| Monorepo | npm workspaces (client, server, shared) |

---

## Project Structure

```
family-tree/
  ├── package.json              # workspace root
  ├── .env.example
  ├── client/
  │   ├── src/
  │   │   ├── components/
  │   │   │   ├── Tree/         # TreeCanvas, TreeNode, TreeEdge
  │   │   │   ├── Person/       # PersonCard, PersonForm, PersonPanel
  │   │   │   ├── Auth/         # LoginForm, RegisterForm
  │   │   │   └── UI/           # Button, Modal, Skeleton, EmptyState
  │   │   ├── pages/            # Home, Dashboard, TreeView, SharedView
  │   │   ├── store/            # authStore, treeStore, uiStore
  │   │   ├── hooks/            # useAuth, useTree, usePerson
  │   │   └── api/              # axios instance + typed API calls
  ├── server/
  │   ├── src/
  │   │   ├── routes/           # auth, trees, persons, relationships, share, upload
  │   │   ├── middleware/       # authGuard, errorHandler, upload
  │   │   ├── db/               # schema.ts, seed.ts, connection.ts
  │   │   └── utils/            # jwt.ts, hash.ts, validators.ts
  │   └── data/                 # family.db (gitignored)
  └── shared/
      └── src/
          ├── types.ts          # Person, Tree, Relationship, User interfaces
          └── schemas.ts        # Zod schemas for all API inputs
```

---

## Data Model

### Tables

**users**
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
email TEXT UNIQUE NOT NULL
passwordHash TEXT NOT NULL
createdAt TEXT NOT NULL
```

**trees**
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
name TEXT NOT NULL
ownerId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
shareToken TEXT UNIQUE
createdAt TEXT NOT NULL
```

**persons**
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
treeId INTEGER NOT NULL REFERENCES trees(id) ON DELETE CASCADE
firstName TEXT NOT NULL
lastName TEXT NOT NULL
birthDate TEXT
deathDate TEXT
gender TEXT CHECK(gender IN ('male','female','unknown')) DEFAULT 'unknown'
bio TEXT
photoUrl TEXT
```

**relationships**
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
treeId INTEGER NOT NULL REFERENCES trees(id) ON DELETE CASCADE
person1Id INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE
person2Id INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE
type TEXT CHECK(type IN ('parent-child','spouse','sibling')) NOT NULL
UNIQUE(person1Id, person2Id, type)
```

**Indexes:** `persons(treeId)`, `relationships(treeId)`, `trees(ownerId)`, `trees(shareToken)`

---

## API Endpoints

```
POST   /api/auth/register          { email, password } → { user }
POST   /api/auth/login             { email, password } → sets httpOnly JWT cookie
POST   /api/auth/logout            clears cookie
GET    /api/auth/me                → { user } (used to hydrate session on mount)

GET    /api/trees                  → Tree[]
POST   /api/trees                  { name } → Tree
DELETE /api/trees/:id              → 204

GET    /api/trees/:id/persons      → Person[]
POST   /api/trees/:id/persons      { firstName, lastName, ... } → Person
PUT    /api/trees/:id/persons/:pid { ...fields } → Person
DELETE /api/trees/:id/persons/:pid → 204

GET    /api/trees/:id/relationships → Relationship[]
POST   /api/trees/:id/relationships { person1Id, person2Id, type } → Relationship
DELETE /api/trees/:id/relationships/:rid → 204

POST   /api/trees/:id/share        → { shareToken }
GET    /api/share/:token           → { tree, persons, relationships } (no auth)

POST   /api/upload/photo           multipart/form-data → { photoUrl }
```

All protected routes require a valid JWT cookie. Ownership is verified — users can only access their own trees.

---

## D3 Tree Visualization — Option A

### Layout Algorithm

1. **Root selection:** The oldest person with no parent relationships is the root. If none exists, use the first person. User can re-root by right-clicking a node.
2. **Hierarchy build:** Walk parent-child relationships to build a `d3.hierarchy()` node tree.
3. **Layout:** `d3.tree().nodeSize([220, 120])` computes (x, y) for each node in a top-down layout.
4. **Spouse overlay:** After layout, spouses are positioned adjacent (x ± 230) to their partner. A dashed curved SVG path with a small connector icon links them horizontally.
5. **All elements** live in a single `<svg>` → `<g class="zoom-container">` receiving `d3.zoom()` transforms (scroll to zoom, drag to pan).

### Node Card (SVG foreignObject)

Each node renders a React component inside `<foreignObject width="200" height="90">`:
- Circular photo (40px diameter, placeholder silhouette if no photo)
- Full name in Playfair Display
- Birth – death years in Lora
- Left border color: green (male), rose (female), amber (unknown)
- On hover: scale 1.05×; ancestors highlight gold; descendants highlight green; others dim to 30% opacity
- On click: `treeStore.selectPerson(id)` → opens right side panel

### Edges

| Relationship | Visual |
|---|---|
| Parent → Child | Solid vertical line, small arrowhead |
| Spouse | Dashed curved horizontal path, muted gold |
| (Sibling) | Implicit — shared parent node |

Edge labels (e.g. "spouse") appear only on hover.

### Transitions

All D3 enter/update/exit selections use `.transition().duration(400).ease(d3.easeCubicOut)`. New nodes enter from their parent's (x,y) position. Deleted nodes scale to 0 and fade out.

### Mobile Fallback

On `< 768px` viewport: D3 canvas hidden. A scrollable list of `PersonCard` React components, grouped by computed generation number, replaces it.

---

## Frontend State (Zustand)

### authStore
```ts
{ user: User | null, isLoading: boolean }
actions: login(email, password), register(email, password), logout(), checkSession()
```

### treeStore
```ts
{
  trees: Tree[],
  activeTreeId: number | null,
  persons: Person[],
  relationships: Relationship[],
  selectedPersonId: number | null,
  isLoading: boolean
}
actions: fetchTrees(), createTree(), deleteTree(), setActiveTree(),
         fetchPersons(), addPerson(), updatePerson(), deletePerson(),
         fetchRelationships(), addRelationship(), deleteRelationship(),
         selectPerson(), generateShareToken()
```

### uiStore
```ts
{ theme: 'light' | 'dark', isSidePanelOpen: boolean, searchQuery: string, generationFilter: number | null }
actions: toggleTheme(), setSearch(), setGenerationFilter()
```

---

## Pages

| Route | Component | Auth |
|---|---|---|
| `/` | Home (redirect) | public |
| `/login` | LoginPage | public |
| `/register` | RegisterPage | public |
| `/dashboard` | Dashboard | required |
| `/trees/:id` | TreeView | required |
| `/share/:token` | SharedView | public |

Page transitions: Framer Motion `AnimatePresence` with fade + 8px upward slide, 200ms duration.

---

## UX & Theme

**Light theme (default):**
- Background: parchment `#F5F0E8`
- Primary: forest green `#2D5016`
- Accent: gold `#C9A84C`
- Text: dark brown `#2C1810`

**Dark theme:**
- Background: deep charcoal `#1A1A1A`
- Primary: muted green `#4A7C2F`
- Accent: dimmed gold `#A88A3D`
- Text: warm white `#F0EBE3`

**Typography:** Playfair Display 700 (headings) + Lora 400/500 (body) via Google Fonts.

**Toast:** bottom-right, amber background in light mode, styled via `react-hot-toast` `toastOptions`.

**Empty state:** SVG parchment scroll illustration + "Add your first family member" button, shown when `persons.length === 0`.

**Loading skeletons:** Pulse-animated rounded rects match the shape of the content they replace (cards on dashboard, fields in side panel).

---

## Export & Share

- **PNG:** `html2canvas` captures the `.tree-canvas` div → `canvas.toDataURL()` → `<a download>` trigger
- **PDF:** Same canvas → `jsPDF` with A4 landscape orientation
- **Share link:** `POST /api/trees/:id/share` returns `{ shareToken }`. Frontend copies `https://<host>/share/<token>` to clipboard. Shared view is fully read-only, no auth required.

---

## Seed Data

On startup, if 0 trees exist, insert "The Sharma Family" with:
- Generation 0: Ramesh Sharma + Kamla Sharma (spouses) — 2 persons
- Generation 1: Arjun Sharma (son), Meera Sharma (daughter), Priya Sharma (spouse of Arjun) — 3 persons
- Generation 2: Aanya Sharma, Rohan Sharma, Dev Sharma (children of Arjun + Priya) — 3 persons

8 persons total. Relationships covered: parent-child (Ramesh+Kamla → Arjun, Meera; Arjun+Priya → Aanya, Rohan, Dev), spouse (Ramesh+Kamla, Arjun+Priya), sibling (Arjun+Meera, Aanya+Rohan+Dev).

---

## Environment Variables (.env.example)

```
PORT=3001
JWT_SECRET=change_me_in_production
DB_PATH=./server/data/family.db
UPLOAD_DIR=./server/uploads
CLIENT_URL=http://localhost:5173
```

---

## Quality Requirements

- Zero `any` TypeScript except D3 internal event handlers (typed as `d3.D3ZoomEvent<SVGSVGElement, unknown>` etc.)
- Zod validation on all API inputs; shared schemas reused on frontend for form validation
- React Error Boundaries wrapping TreeCanvas and each page
- `PRAGMA foreign_keys = ON` at DB connection time
- ESLint + Prettier configured at root, applied to both client and server
- All HTTP errors return `{ error: string, details?: ZodIssue[] }`
