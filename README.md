# PROMPTS.md

**Repo:** [Ai_interview_agent](https://github.com/elwindainuvarghese/Ai_interview_agent)
**Build window:** Aug 8, 2026, 09:44 – 12:27 IST (2h 43m, 21 commits)
**Contributors:** elwindainuvarghese (scaffold), Jeffin05 (build-out)

## What this file is

A commit-by-commit log of how this project was built, reconstructed from the repo's actual git history — timestamps, authors, commit messages, and diffs. Every date, hash, and file count below is real and independently checkable with `git log`.

The **prompts are reconstructed, not exported** — this repo doesn't contain raw chat logs, and I (Claude) don't have access to the literal conversation that produced each commit. Each "prompt" is my best inference of what was likely asked, written from the diff content and commit message. Treat the timeline/diffs as the hard evidence and the quoted prompts as a readable narrative on top of it.

> If your cohort needs a verbatim transcript rather than a reconstruction, the strongest move is to export the real chat history from whatever tool wrote these commits (Cursor, Windsurf, Claude Code, etc.) and drop it in alongside this file — that's primary evidence this document can't be.

---

## Build Timeline

| Time | Commit | Change |
|---|---|---|
| 09:44 | `14c17e8` | Initial commit — static HTML/JS scaffold (orb, chat, calendar UI) |
| 10:31 | `fb6cf48` | FastAPI backend + Gemini 2.5 Flash integration |
| 11:10 | `10c8075` | Migrate to React + Vite, add Admin Portal, Login |
| 11:12 | `b5338fb` | Glassmorphic LoginModal restyle |
| 11:15 | `92d697f` | Demo login button + Firebase guidance |
| 11:25 | `d429531` | Restore original UI (3D orb, chat, calendar) inside React app |
| 11:30 | `dceb13f` | Add AI proctoring: tab-switch, gaze, noise detection |
| 11:37 | `66f461e` | Cyberpunk HUD overlay + attention score gauge |
| 11:43 | `a1e97b5` | Tighten gaze/phone detection sensitivity |
| 11:48 | `6b5818e` | Instant phone detection + auto-terminate on no-human |
| 11:51 | `b96e8a2` | Fix false-positive phone detection (region restriction) |
| 11:54 | `3ed0070` | Add tracking reticle overlay |
| 11:57 | `93b2592` | Add manual test-trigger buttons for debugging |
| 11:59 | `d6a693b` | Add live telemetry overlay for debugging |
| 12:04 | `7d06ea4` | Automate tracking loop, remove manual triggers |
| 12:09 | `c9c7a23` | Real-time attention score calculation |
| 12:12 | `614beea` | Fix blank-page crash (CSS prop typo) |
| 12:17 | `93573dd` | Skin-tone based detection (fix red-shirt false positive) |
| 12:20 | `07da206` | Combine skin-tone + occlusion checks |
| 12:23 | `9580f52` | Restrict scan region (fix TV/furniture false positives) |
| 12:27 | `b650a45` | Stabilize attention score at rest, clear stale penalties |

---

## Phase 1 — Scaffold
**`14c17e8`, 09:44**
Static starting point: `index.html`, `main.js`, `server.js`, and component CSS for a 3D orb, chat panel, calendar widget, and form/button styling. No reconstructed prompt for this one — it's the boilerplate everything else was built on top of.

## Phase 2 — Backend contract
**`fb6cf48`, 10:31**
> "Build a FastAPI backend that talks to Gemini for the interview logic, grounds the questions in our `curriculum.json`, and returns structured feedback — strengths, gaps, next steps — as JSON, not free text. Also the chat UI is leaking our internal 'day' tags to the candidate, strip those out before rendering."

Shipped: `backend/main.py` (251 lines) with a Pydantic `FeedbackSchema`, session storage keyed by `sessionId`, curriculum-grounded prompting against `gemini-2.5-flash`.

## Phase 3 — React migration + Admin Portal
**`10c8075`, 11:10** — 14 files, 3,552 insertions
> "Migrate this whole thing to React + Vite. I want a real login flow with Firebase, an admin dashboard to review candidates, a candidate profile card, a feedback report screen, and the interview chat as its own component. Make it feel premium, not like a default template."

**`b5338fb`, 11:12** (2 minutes later)
> "The login modal still looks flat — make it properly glassmorphic, blurred glass panels, and responsive on mobile."

**`92d697f`, 11:15**
> "Add an instant demo-login button so I can skip real auth while testing, and if the Firebase provider isn't enabled yet, show a clear message instead of failing silently."

## Phase 4 — UI restore
**`d429531`, 11:25** — App.jsx shrank 261 lines, new `OriginalGithubUI.jsx` (+388)
> "Put the original screen back — the 3D orb, chat panel, and calendar from before the migration. Keep the new login and admin pieces, just wire them around the original layout instead of the generic one."

## Phase 5 — AI proctoring (the real vibe-coding loop)
Eleven commits in 57 minutes, almost all touching a single file (`useProctoring.js`) — the classic "run it, watch it fail, describe the failure, run it again" loop.

**`dceb13f`, 11:30** — new `ProctorMonitor.jsx` (242 lines) + `useProctoring.js` (260 lines)
> "Add a live proctoring layer during the interview — flag tab-switching after 3 strikes, track whether the candidate is looking away from the screen, and listen for background noise or multiple voices."

**`66f461e`, 11:37** (+467/-232 across both files)
> "Give the proctor widget an actual HUD look — cyberpunk-style overlay with a live attention score gauge. Also the warning toast is overflowing its box, fix that layout."

**`a1e97b5`, 11:43**
> "It's too slow to catch a phone or a glance away. Make detection more sensitive and strike after 1.5s instead."

**`6b5818e`, 11:48**
> "Phone detection needs to be instant, zero delay. And if there's no face in frame at all for 2 seconds, just auto-end the interview."

**`b96e8a2`, 11:51**
> "It's flagging things that aren't phones. Restrict the scan to the chin/hand region only and make it persist 1.2s before it counts as a real trigger."

**`3ed0070`, 11:54**
> "Add a rotating target reticle so I can see what region it's actually scanning. Also drop the sideways-glance strike time to 0.8s."

**`93b2592`, 11:57**
> "I'm tired of physically holding up my phone to test this — add 'Test Phone' and 'Test Sideways Glance' buttons that simulate the event."

**`d6a693b`, 11:59**
> "Show the raw position telemetry on screen too, so I can see what the tracker thinks my face coordinates are while I'm testing."

**`7d06ea4`, 12:04** (99 insertions, 191 deletions — net simplification)
> "Pull the manual test buttons back out of the real flow and make tracking fully automatic — sample every frame at 30fps, no button presses needed."

**`c9c7a23`, 12:09**
> "Attention score isn't updating live, make it dynamic. Phone scanner is still missing things — bump sensitivity again."

**`614beea`, 12:12**
> "Page just went white. Something's crashing — I think it's a bad inline style prop in the proctor component, fix it." *(root cause: `justifyBetween` used instead of the valid CSS `justifyContent`)*

## Phase 6 — Killing false positives for good
**`93573dd`, 12:17**
> "It's flagging my red shirt as a phone. Do actual skin-tone pixel detection so it's not just reacting to any dark blob near my face."

**`07da206`, 12:20**
> "Combine both signals — skin tone next to a dark occlusion — and push the sideways-gaze check harder too."

**`9580f52`, 12:23**
> "Now it's picking up the TV in the background and furniture edges as a phone. Tighten the scan region down to just near the candidate's hands and chin."

**`b650a45`, 12:27** — final commit of the session
> "When I'm just facing forward, the score should sit at 100, it's drifting for no reason. And let the tab-switch penalty actually clear after good behavior instead of staying stuck forever."

---

## Stack (for context)
React 19 + Vite + Tailwind v4 + Framer Motion frontend, Firebase auth, `@mediapipe/tasks-vision` + raw canvas pixel heuristics for webcam proctoring, FastAPI + Gemini 2.5 Flash backend with curriculum-grounded question generation and structured JSON feedback.
