# OWLSight — Demo Script

---

## Before You Start

- Backend: `uvicorn app.main:app --reload --port 8000`
- Frontend: `npm run dev` → `http://localhost:3000`

---

## 1. Landing Page

> "OWLSight is the intelligence layer between market data and execution. It decides whether a cross-chain route is actually worth running before a single dollar moves."

Click **Launch App**.

---

## 2. Sign In & Dashboard

Sign in. Note: the marketing nav disappears — you're now in the app.

> "Four stats at the top: simulations run, executions submitted, approval rate, estimated P&L. If no wallet is connected, the dashboard flags it immediately."

---

## 3. Connect MetaMask

Go to **Settings → Wallets**, click connect, approve in MetaMask.

> "Wallet linked. This is what gates live execution."

Back to dashboard — wallet CTA is gone.

---

## 4. Mission Control

Navigate to `/app`. Type in the intent box:

> **"Swap 2 ETH to SOL, best execution"**

> "Three panels: intent on the left, route candidates in the center, inspector on the right. The status bar shows live signals — market provider, Hummingbot connection, execution mode."

---

## 5. Route Intelligence Matrix

Routes populate. Click the top card.

> "Each route shows net P&L after fees, a confidence score, and a verdict. Let's see why this one was approved."

---

## 6. Route Inspector + Monte Carlo

> "The inspector shows the full P&L equation: gross spread, minus fees on both sides, minus slippage in basis points, minus bridge latency penalty. Every cost term is explicit."

Point to confidence score.

> "87% confidence. That's Monte Carlo — we run thousands of simulated executions sampling real distributions of slippage, gas variance, and bridge timing. Not a gut feel. A probability distribution."

Switch to **Whisker** view → show P10/P50/P90. Switch to **Decompose** → show which cost driver eats the most edge.

---

## 7. Execute

Click **Execute with Hummingbot**.

> "Watch the timeline: detection → snapshot → simulation → scored → decision → handed to Hummingbot → paper trade running → completed. Every stage timestamped. The request ID is logged end to end."

Click the bookmark icon to save the simulation.

---

## 8. Rejection Path

Click **Run High Slippage Scenario**.

> "Slippage overwhelms the spread. Confidence: 34%. This route never reaches Hummingbot."

Click **Run Hummingbot Failure Scenario**, execute.

> "Control surface reachable, but no compatible endpoint accepted the request. Falls back to mock cleanly — no silent failures."

---

## 9. Dashboard History

Go to `/dashboard/history`.

> "Full audit trail. Filter by status, asset, date. Expand any row for the full timeline and cost breakdown. Export CSV for tax or portfolio analysis."

---

## 10. Close

> "OWLSight doesn't replace Hummingbot — it makes Hummingbot smarter. Monte Carlo replaces guesswork with a probability distribution. The dashboard gives you the audit trail. The confidence score is the fraction of simulated executions that return positive after every real cost in the route."

---

## Reference

**Key metrics:**

| Metric | Meaning |
|---|---|
| Confidence Score | % of Monte Carlo runs with positive net outcome |
| P10 / P50 / P90 | Worst-case / median / best-case simulated P&L |
| Slippage (bps) | Price impact as basis points of notional |
| Bridge Latency Penalty | USD cost of price drift during transit |
| Net P&L | Gross spread − fees − slippage − latency penalty |

**Demo scenarios:**

| Scenario | Outcome |
|---|---|
| Run Profitable Scenario | Approved, high confidence |
| Run High Slippage Scenario | Rejected, slippage > spread |
| Run High Latency Scenario | Rejected, latency kills edge |
| Run Hummingbot Failure Scenario | Approved but falls back to mock |
