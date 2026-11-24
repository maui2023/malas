Act as a Principal Frontend Architect and AI Integration Engineer. Build a complete, production-ready, 100% serverless, local-first web application called **"OpenWork Lite"** designed to run entirely in the browser and be hosted statically on **GitHub Pages** (`HTML + JS + CSS` / React + Vite static build) with **zero backend servers and zero external database storage**.

---

### 1. CORE ARCHITECTURE & CONSTRAINTS
* **100% Client-Side & Zero-Server:** No backend APIs, no server-side databases, and no OAuth `client_secret` (since static GitHub Pages apps are public clients).
* **Local-First Persistence:**
  * Store non-sensitive settings, OAuth `Client ID`, AI provider configs (BYOK - Bring Your Own Key for Gemini / OpenAI / OpenRouter), and custom prompt templates in `localStorage`.
  * Store OAuth `access_token` in memory / `sessionStorage` with auto-expiry tracking and one-click re-auth.
  * Store cached email summaries, chat history, and local drafts in `IndexedDB` (using Dexie.js or native IndexedDB wrapper) with a "Clear All Local Data" panic button.
* **Headless / CLI Automation Ready:**
  * Support URL query parameter triggers and headless browser execution (Playwright/Puppeteer with persistent `--user-data-dir` profile).
  * Include an **"Export / Import Workspace Config (.json)"** feature so workflows, prompts, and connector settings can be replicated across local browsers and headless server runners effortlessly.

---

### 2. GOOGLE WORKSPACE CONNECTOR (DIRECT CLIENT-SIDE OAUTH)
Build a clean, intuitive **"Add Google Workspace Connector"** settings modal/drawer modeled after modern connector interfaces:
1. **Configuration Fields:**
   * **Connector Name:** Default `Google Workspace` (editable).
   * **Authorized Origin Helper:** Automatically detect and display `window.location.origin` with a one-click Copy button so the user knows exact URL to paste into Google Cloud Console's *Authorized JavaScript Origins*.
   * **OAuth App Client ID:** Input field for the user's Google Cloud OAuth 2.0 Web Client ID (`xxxx.apps.googleusercontent.com`).
2. **Granular Scope Checkboxes ("What your AI can do"):**
   Dynamically build the OAuth `scope` string based on checked permissions:
   * **Gmail:**
     * `[x]` Read Gmail (`https://www.googleapis.com/auth/gmail.readonly`)
     * `[x]` Create and edit email drafts (`https://www.googleapis.com/auth/gmail.compose`)
     * `[ ]` Send email drafts after confirmation (`https://www.googleapis.com/auth/gmail.send`)
     * `[ ]` Create and manage Gmail labels (`https://www.googleapis.com/auth/gmail.labels`)
     * `[ ]` Modify / Archive / Mark as read (`https://www.googleapis.com/auth/gmail.modify`)
   * **Google Calendar (Optional toggle):**
     * `[ ]` Read calendar (`https://www.googleapis.com/auth/calendar.readonly`)
     * `[ ]` Create, edit, and cancel calendar events (`https://www.googleapis.com/auth/calendar.events`)
3. **Direct Auth Flow:**
   * Implement **Google Identity Services (GIS)** `google.accounts.oauth2.initTokenClient` directly in the browser.
   * Show clear connection status badge (`Connected`, `Token Expired - Reconnect`, `Disconnected`), connected email profile, and token countdown timer.

---

### 3. CORE FUNCTIONAL MODULES & AI AGENT WORKFLOWS

#### A. AI Agent & Tool-Calling Engine (BYOK)
* Support direct browser `fetch` calls to **Google Gemini API** (default, e.g., `gemini-2.5-flash`) or **OpenAI-compatible endpoints** using the user's locally stored API key.
* Implement client-side **Function Calling / Tool Use** where the AI agent can autonomously invoke local Gmail wrapper functions:
  1. `list_emails(query, maxResults)` — e.g., `is:unread`, `newer_than:1d`, or search terms.
  2. `get_email_thread(threadId)` — fetches full decoded plain-text/HTML body safely.
  3. `summarize_inbox(filter, count)` — batch-fetches emails and generates structured executive summaries with action items and priority tags.
  4. `create_draft(to, subject, body, threadId)` — creates a real draft inside the user's Gmail account.
  5. `send_email(draftId or payload)` — **MUST trigger a UI Confirmation Modal** before executing unless explicitly running in headless automation mode.
  6. `manage_labels(messageId, addLabels, removeLabels)` — archive, mark read, or apply labels.

#### B. User Interface (Clean, Modern Workspace UI)
* **Layout:** Left sidebar (Chat/Task History, Quick Workflows, Connector Status) + Main Agent Workspace + Right Slide-Over Drawer (Connector & API Settings).
* **Quick-Action Prompt Chips:**
  * *"Summarize my unread emails today & list urgent tasks"*
  * *"Draft polite replies for unanswered emails from the last 24h"*
  * *"Find all invoices/receipts this month and summarize totals"*
  * *"Clean up & archive promotional unread emails"*
* **Interactive Action Cards in Chat:** When the AI prepares an email draft or proposes labeling/archiving emails, render a rich preview card with **"Save to Gmail Drafts"**, **"Edit"**, or **"Approve & Send"** buttons.

#### C. Headless Mode Support (`?headless=true&task=...`)
* If loaded with `?headless=true`, hide unnecessary animations, read stored credentials from `localStorage`/`IndexedDB`, execute the specified task or default daily digest workflow automatically, render clean JSON/Markdown output in a `#headless-output` DOM container (so Playwright/Puppeteer can scrape it easily), and optionally fire a user-configured Webhook URL (e.g., Telegram Bot API or Discord/Slack webhook) directly from the browser.

---

### 4. DELIVERABLES & PROJECT STRUCTURE
Generate a complete, ready-to-deploy project structure:
1. `package.json` & `vite.config.js` (configured with `base: './'` for seamless GitHub Pages deployment).
2. `index.html` (including Google Identity Services script `https://accounts.google.com/gsi/client`).
3. Clean modular source code (`src/`):
   * `src/services/googleAuth.js` (GIS Token client & scope manager)
   * `src/services/gmailApi.js` (REST wrapper for Gmail API v1 + base64url decoder/encoder)
   * `src/services/aiAgent.js` (Gemini/OpenAI tool-calling loop & prompt orchestrator)
   * `src/services/localDb.js` (IndexedDB + localStorage manager + JSON export/import)
   * `src/components/ConnectorModal.jsx` (The Google Workspace OAuth & Scope selector UI)
   * `src/components/WorkspaceChat.jsx` (Chat interface + interactive Draft/Summary cards)
4. `scripts/headless-runner.js` — A standalone Playwright example script showing how to run the hosted GitHub Pages app headlessly on a server using `--user-data-dir`.
5. `.github/workflows/deploy.yml` — GitHub Actions workflow to auto-deploy to GitHub Pages on push.
6. `README.md` — Step-by-step setup guide (how to get a Google OAuth Client ID, add GitHub Pages URL to Authorized Origins, and run headless mode).

Write clean, complete, non-truncated, production-ready code for every file.
