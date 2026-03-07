# PromisePulse

AI-powered public promise tracking for local infrastructure accountability.

---

## Why

Local governments and representatives make infrastructure promises—roads, drainage, streetlights, sanitation—but citizens often have no transparent way to track whether those promises are kept. Documents and updates scatter across speeches, newsletters, and reports. Accountability is opaque.

**PromisePulse** solves this by:

- Turning unstructured documents into structured, auditable promises
- Storing evidence immutably on IPFS and blockchain
- Letting citizens vote on visible progress
- Computing promise status from collective input

---

## What

PromisePulse is a full-stack platform that:

1. **Monitors** a local `artifacts/incoming` folder for new documents
2. **Extracts** text from `.txt`, `.md`, and `.pdf` files
3. **Classifies** content with AI (Gemini) as new promises, progress updates, or irrelevant
4. **Stores** artifacts on IPFS (Pinata) for immutable evidence
5. **Records** promises and evidence on Polygon Amoy via a smart contract
6. **Enables** citizens to vote on progress (Not Visible → In Progress → Partially Done → Done)
7. **Computes** final promise status from vote distribution and updates on-chain

---

## How — Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4 |
| **Backend** | Next.js API Routes (serverless) |
| **Database** | MongoDB, Mongoose |
| **AI** | Google Gemini 2.5 Flash (classification, extraction) |
| **Storage** | Pinata (IPFS), ipfs.io gateway |
| **Blockchain** | Polygon Amoy, Solidity, Ethers.js, Hardhat |
| **File Watch** | Chokidar (Node.js) |

### Architecture

```
artifacts/incoming/*.txt|.md|.pdf
        │
        ▼
   [Chokidar Watcher]
        │ POST /api/internal/process-artifact
        ▼
   [Artifact Processor]
        │
        ├─► [Artifact Reader]  (text extraction)
        ├─► [Pinata]           (upload to IPFS → CID)
        ├─► [Gemini AI]        (classify: NEW_PROMISE | PROMISE_UPDATE | IRRELEVANT)
        └─► [Blockchain]       (addPromise, addEvidence, openReviewRound)
        │
        ▼
   [MongoDB]  (PromiseRecord, TriggerEvent, ReviewRound, TimelineEvent)
```

### Smart Contract (Solidity)

- **`PromisePulse.sol`** — Records promises (hash, category, region, IPFS CID), links evidence, opens review rounds, and accepts votes
- **Vote options:** 0=Not Visible, 1=In Progress, 2=Partially Done, 3=Done, 4=Not Sure
- **Events:** `PromiseRecorded`, `EvidenceLinked`, `ReviewRoundOpened`, `VoteCast`, `StatusUpdated`
- Deployed on **Polygon Amoy** (testnet)

### Data Flow

- **NEW_PROMISE** → Create promise in DB → Upload to IPFS → `addPromise()` on-chain → Move file to `artifacts/processed`
- **PROMISE_UPDATE** → Create TriggerEvent → `addEvidence()` + `openReviewRound()` → Citizens vote → `castVote()` → Status computed → `updateStatus()` when round closes

---

## Demo (for Judges)

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- API keys: [Pinata](https://www.pinata.cloud/), [Google AI Studio](https://aistudio.google.com/), Polygon Amoy wallet with test MATIC

### Setup

```bash
npm install
cp .env.example .env
# Fill: MONGODB_URI, PINATA_API_KEY, PINATA_SECRET, GEMINI_API_KEY, PRIVATE_KEY

npm run compile && npm run deploy
# Add CONTRACT_ADDRESS to .env
```

### Run

```bash
npm run dev      # Terminal 1
npm run watcher  # Terminal 2
```

### Try It

1. Open **http://localhost:3000**
2. Add `artifacts/incoming/promise.txt` with infrastructure promises (roads, drainage, streetlights, etc.)
3. Watch the dashboard — promise appears after AI classification and on-chain recording
4. Add a follow-up file (e.g. "Sector 7 work has started") → triggers review round
5. Vote at Dashboard → "Vote now" → View results

**Note:** The watcher processes only files added *after* it starts.

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home |
| `/dashboard` | Stats, latest promises, active review rounds |
| `/promises` | Browse with filters |
| `/promises/[id]` | Detail, timeline, evidence, source artifact (IPFS) |
| `/review/[roundId]/vote` | Vote on promise progress |
| `/review/[roundId]/results` | Vote results |
| `/admin` | Artifact history, retry failed |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js dev server |
| `npm run watcher` | Folder watcher |
| `npm run build` | Production build |
| `npm run compile` | Compile Solidity |
| `npm run deploy` | Deploy to Polygon Amoy |
