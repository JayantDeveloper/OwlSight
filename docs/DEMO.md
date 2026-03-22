# 2-Minute Judge Demo Script

## Opening

“This is OwlSight. It sits on top of Hummingbot and decides whether a cross-chain arbitrage route is actually executable before any trade request gets handed off.”

## Step 1: Show the Opportunity Feed

- Open the dashboard.
- Point out the hero statement: “We simulate execution before we trade.”
- Mention that the top pills show market provider, execution engine, Hummingbot status, fallback state, and live demo session state.
- Mention that each card already shows net PnL, spread, confidence, and whether the route is greenlit or blocked.

## Step 2: Inspect a Route

- Click `Run Profitable Scenario`.
- Click the now-staged approved route.
- Walk through the route inspector:
  - visual lifecycle pipeline
  - final verdict card
  - equation-style PnL breakdown
  - bridge latency penalty
  - confidence score
- Say: “This is the intelligence layer. It is not just looking at spread. It is checking whether the edge survives real execution conditions.”

## Step 3: Show the Hummingbot Handoff

- Click `Execute with Hummingbot`.
- Move to the execution timeline panel.
- Explain the progression:
  - detected
  - market snapshot received
  - feasibility simulation started
  - slippage modeled
  - route scored
  - decision made
  - handed to Hummingbot
  - paper trade running
  - completed
- Point to the terminal-style event log and show the corresponding acknowledgement messages.
- Say: “For the hackathon this runs in paper-trade mode when Hummingbot is reachable. If not, the app falls back cleanly and tells you exactly why.”

## Step 4: Show the Rejection Path

- Click `Run High Slippage Scenario` or `Run High Latency Scenario`.
- Point out the rejection reason in the verdict panel and PnL equation.
- Then click `Run Hummingbot Failure Scenario` and execute a still-approved route.
- Show the fallback banner and event log message.
- Say: “The key product behavior is that bad-looking routes never reach Hummingbot, and unavailable infrastructure does not break the demo.”

## Close

“The startup thesis is that Hummingbot should remain the execution engine, while this copilot becomes the decision layer for cross-chain execution quality and execution reliability.”
