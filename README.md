# GovernancePulse

AI & blockchain–powered tracking for campaign pledges and everyday government commitments.

**Live:** [https://govpls.vercel.app/](https://govpls.vercel.app/)

---

## Vision

**Full product:** GovernancePulse automatically scrapes local newspapers and government websites based on the user’s selected location. Pledges, updates, and official announcements are ingested in the backend and surfaced on the frontend for tracking and voting—no manual uploads needed.

**MVP (current):** Manual file upload simulates that flow. Users select a location (Lawrence, Kansas City, Topeka, Wichita, etc.) and upload `.txt`, `.md`, or `.pdf` files containing pledge text. An optional **Fetch news** feature uses the [GNews API](https://gnews.io) to pull location-based articles as a step toward automatic ingestion.

---

## Why

Local governments and representatives make infrastructure promises—roads, drainage, streetlights, sanitation—but citizens often have no transparent way to track whether those promises are kept. Documents and updates scatter across speeches, newsletters, and reports. Accountability is opaque.

**GovernancePulse** solves this by:

- Turning unstructured documents into structured, auditable promises
- Storing evidence immutably on IPFS and blockchain
- Letting citizens vote on visible progress
- Computing promise status from collective input

---

## What (MVP)

GovernancePulse is a full-stack platform that:

1. **Accepts** documents via drag-and-drop upload or `artifacts/incoming` folder *(full product: automatic scrape from local news & gov sites by location)*
2. **Extracts** text from `.txt`, `.md`, and `.pdf` files
3. **Classifies** content with AI (Gemini) as new promises, progress updates, or irrelevant
4. **Stores** artifacts on IPFS (Pinata) for immutable evidence
5. **Records** promises and evidence on Polygon Amoy via a smart contract
6. **Enables** citizens to vote on progress (Not Visible → In Progress → Partially Done → Done)
7. **Computes** final promise status from vote distribution and updates on-chain

**Location selector:** Users choose a city/region. In the full product, this drives which sources are scraped. In the MVP, it provides context and official info (mayor, city manager, council).

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4 |
| **Backend** | Next.js API Routes (serverless) |
| **Database** | MongoDB, Mongoose |
| **AI** | Google Gemini 2.5 Flash (classification) |
| **Storage** | Pinata (IPFS), ipfs.io gateway |
| **Blockchain** | Polygon Amoy, Solidity, Viem, Hardhat |
| **File Processing** | pdf-parse, Chokidar (optional watcher) |

---

## Architecture

### Document Ingestion

**Current (MVP):**

```
┌─────────────────────────────────────────────────────────────────┐
│  Manual upload (web) OR artifacts/incoming (watcher)             │
│  Optional: Fetch news by location (GNews API)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Artifact Processor                                              │
│  ├─ Artifact Reader   (text extraction: txt, md, pdf)           │
│  ├─ Pinata            (upload to IPFS → CID)                    │
│  ├─ Gemini AI         (classify: NEW_PROMISE | PROMISE_UPDATE   │
│  │                     | IRRELEVANT)                            │
│  └─ Blockchain        (addPromise, addEvidence, openReviewRound)│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  MongoDB  (Artifact, PromiseRecord, TriggerEvent,               │
│            ReviewRound, Vote, TimelineEvent)                     │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

- **NEW_PROMISE** → Create PromiseRecord → Upload to IPFS → `addPromise()` on-chain → Move to `artifacts/processed`
- **PROMISE_UPDATE** → Create TriggerEvent → `addEvidence()` + `openReviewRound()` → Citizens vote → `castVote()` → Status computed from votes → `updateStatus()` when round closes
- **IRRELEVANT** → Mark as unmatched, no on-chain action

### Smart Contract (Solidity)

- **`PromisePulse.sol`** — Records promises (hash, category, region, IPFS CID), links evidence, opens review rounds, accepts votes
- **Vote options:** 0=Not Visible, 1=In Progress, 2=Partially Done, 3=Done, 4=Not Sure
- **Events:** `PromiseRecorded`, `EvidenceLinked`, `ReviewRoundOpened`, `VoteCast`, `StatusUpdated`
- Deployed on **Polygon Amoy** (testnet)

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard: location selector, upload, live pipeline, pledges, active rounds, KPIs |
| `/dashboard` | Redirects to `/` |
| `/promises` | Browse pledges with filters (status, category, region) |
| `/promises/[id]` | Promise detail, timeline, evidence, IPFS source link |
| `/review/[roundId]/vote` | Vote on promise progress |
| `/review/[roundId]/results` | Vote distribution and final status |
| `/history` | Processing history, artifact list, retry failed |
| `/admin` | Redirects to `/history` |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string (Atlas or local) |
| `PINATA_API_KEY` | Yes | Pinata API key for IPFS |
| `PINATA_SECRET` | Yes | Pinata API secret |
| `GEMINI_API_KEY` | Yes | Google AI Studio API key for Gemini |
| `PRIVATE_KEY` | Yes* | Wallet private key for blockchain writes |
| `RPC_URL` | No | Polygon Amoy RPC (default: `https://rpc-amoy.polygon.technology`) |
| `CONTRACT_ADDRESS` | Yes* | Deployed PromisePulse contract address |
| `NEXT_PUBLIC_CHAIN_ID` | No | Chain ID for frontend (default: 80002) |
| `ARTIFACTS_PATH` | No | Path to artifacts folder (default: `./artifacts`) |
| `REVIEW_ROUND_DURATION_HOURS` | No | Hours until review round closes (overrides days) |
| `REVIEW_ROUND_DURATION_DAYS` | No | Days until review round closes (default: 7) |
| `GNEWS_API_KEY` | No | [GNews](https://gnews.io) API key for location-based news fetch |

*Required for on-chain features. The app works without blockchain for classification and storage.

---

## Roadmap

| Phase | Description |
|-------|-------------|
| **MVP (current)** | Manual upload, GNews fetch by location, AI classification, IPFS + blockchain, citizen voting |
| **v2** | Automatic scraping from local newspapers and government websites driven by selected location |
| **Future** | Broader source coverage, RSS feeds, official press releases, real-time monitoring |

---

## Local Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or [Atlas](https://cloud.mongodb.com))
- API keys: [Pinata](https://www.pinata.cloud/), [Google AI Studio](https://aistudio.google.com/), Polygon Amoy wallet with test MATIC

### Install & Run

```bash
npm install
cp .env.example .env
# Edit .env with MONGODB_URI, PINATA_*, GEMINI_API_KEY, PRIVATE_KEY

npm run compile
npm run deploy
# Add CONTRACT_ADDRESS to .env

npm run dev
```

Open **http://localhost:3000**

### Optional: Folder Watcher

Process files dropped into `artifacts/incoming` automatically:

```bash
npm run watcher
```

---

## Demo Flow

1. **Select location** — Choose a city (e.g. Lawrence, KS, Topeka) to see relevant officials and context
2. **Upload a pledge** — Drag & drop a `.txt`, `.md`, or `.pdf` with infrastructure promises (e.g. "We will install 120 LED streetlights along Oak Street by September 2025"). *Alternative: Use Fetch news (if GNEWS_API_KEY is set) to pull location-based articles*
2. **Watch the pipeline** — Detected → Extracted → Stored on IPFS → Classified by AI → Recorded on blockchain
3. **Upload an update** — "Oak Street streetlight installation is 50% complete" → Matched to existing pledge, review round opens
4. **Vote** — Click "Vote now" → Choose progress level → Transaction on Polygon Amoy
5. **View results** — See vote distribution and updated pledge status

---

## Deployment (Vercel)

1. **Connect** your GitHub repo to [Vercel](https://vercel.com)
2. **Add environment variables** in Project → Settings → Environment Variables:
   - `MONGODB_URI`, `PINATA_API_KEY`, `PINATA_SECRET`, `GEMINI_API_KEY`
   - `PRIVATE_KEY`, `RPC_URL`, `CONTRACT_ADDRESS`, `NEXT_PUBLIC_CHAIN_ID`
3. **MongoDB Atlas** — Add `0.0.0.0/0` to Network Access whitelist for Vercel
4. **Deploy** — Push to main or trigger redeploy

### Custom Domain

In Vercel → Settings → Domains, add your subdomain (e.g. `gp.yourdomain.com`). Add a CNAME record pointing to `cname.vercel-dns.com`.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js dev server (webpack) |
| `npm run dev:turbo` | Next.js dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run watcher` | Process files from `artifacts/incoming` |
| `npm run compile` | Compile Solidity contracts |
| `npm run deploy` | Deploy PromisePulse to Polygon Amoy |

---

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── page.tsx            # Dashboard (upload + pipeline + pledges)
│   ├── history/            # Processing history
│   ├── admin/              # Redirects to /history
│   ├── promises/           # Browse, filter, detail
│   ├── review/             # Vote, results
│   └── api/                # API routes
├── components/             # React components
├── contracts/              # Solidity (PromisePulse.sol)
├── lib/                    # Core logic
│   ├── ai.ts               # Gemini classification
│   ├── artifactProcessor.ts
│   ├── artifactReader.ts
│   ├── blockchain.ts       # Viem + contract calls
│   ├── dashboardData.ts    # Dashboard queries
│   ├── promisesData.ts
│   ├── adminData.ts
│   ├── pinata.ts
│   ├── statusEngine.ts     # Vote → status computation
│   └── pipelineEvents.ts
├── models/                 # Mongoose schemas
└── artifacts/              # Document folders
    ├── buffer/             # Sample pledge/result files
    ├── incoming/           # Watcher input
    ├── uploaded/           # Web uploads (local)
    ├── processed/
    ├── unmatched/
    └── error/
```
