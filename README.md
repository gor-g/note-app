# Memonote

A web app for taking **memo notes as question–answer pairs** — small flashcard-like
cards you can review and search. The defining constraints of the project:

- **End-to-end encryption (E2EE).** Note contents are encrypted in the browser
  before anything leaves the device. The server only ever stores ciphertext and
  never has access to the keys, so it cannot read your notes.
- **Local-first data.** Cards live in the browser's **IndexedDB**, so the app
  works against a local copy of the data.
- **Client-side fuzzy search.** Search runs entirely in the front end over the
  decrypted data in IndexedDB — the server is never asked to search (it couldn't
  anyway, since it only holds ciphertext).

## Repository layout

```
note-app/
├── front/      React + TypeScript + Vite single-page app (the UI)
├── back/       Go HTTP API (users, and later: cards/sync)
├── cicd/       Build/run scripts and local Postgres + migration tooling
├── secrets/    Local-only credential env files (git-ignored)
└── external/   Vendored binaries (e.g. dbmate) (git-ignored)
```

## Current status

This is an early-stage project. What exists today:

- **Backend:** a single `POST /users` endpoint that creates a user (email +
  bcrypt-hashed password) in Postgres. There is **no login/session endpoint
  yet** and no authentication tokens.
- **Frontend:** the login / sign-up screen (this step). Sign-up is wired to the
  real `POST /users` endpoint; login is wired to a future `POST /sessions`
  endpoint that the backend does not implement yet.

The encryption, IndexedDB storage, card CRUD, and fuzzy search are **not built
yet** — they are the planned next steps.

## Architecture intent (where this is heading)

Because of the E2EE requirement, the backend is deliberately "dumb" about note
contents. The likely split:

- **Frontend** derives an encryption key from the user's password (or a separate
  passphrase), encrypts/decrypts cards locally, stores them in IndexedDB, and
  does all searching there.
- **Backend** authenticates users and stores **opaque encrypted blobs** for
  cross-device sync — never plaintext, never keys.

> Note: a password used both for login *and* for key derivation must be handled
> carefully so the server never sees the key material. This is a design point to
> nail down before building sync.

## Frontend (`front/`)

React + TypeScript app built with Vite.

```bash
cd front
npm install
cp .env.example .env     # optional; defaults to http://localhost:8081
npm run dev              # dev server, usually http://localhost:5173
npm run build            # type-check + production build
```

Code map:

| File | Responsibility |
| --- | --- |
| `src/api/client.ts` | Typed `fetch` wrapper: base URL, JSON, error handling. |
| `src/api/auth.ts` | `signup()` / `login()` calls and their request/response types. |
| `src/components/AuthForm.tsx` | The shared email + password form (login & signup). |
| `src/pages/AuthPage.tsx` | Login/Sign-up tab toggle around the form. |
| `src/App.tsx` | Holds auth state; switches between auth screen and home. |

## Backend (`back/`)

Go HTTP API using `net/http` and `pgx` (Postgres).

```bash
# Requires a running Postgres and the env files under cicd/ and secrets/.
./cicd/back/run.sh            # go run
./cicd/back/build_and_run.sh  # build a binary, then run it
```

The server listens on `:8081`.

## Roadmap

1. ✅ User sign-up (backend) + login/sign-up UI (frontend).
2. ⬜ Backend login + sessions (cookies or tokens).
3. ⬜ Client-side crypto: key derivation, encrypt/decrypt cards.
4. ⬜ IndexedDB storage layer for cards.
5. ⬜ Card CRUD UI (create/review question–answer pairs).
6. ⬜ Client-side fuzzy search.
7. ⬜ Encrypted-blob sync between client and server.
