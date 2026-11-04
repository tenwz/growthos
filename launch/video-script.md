# Demo video

Two cuts from one recording session:

- **90 seconds, 16:9** — main post, landing page, README embed.
- **30 seconds, 9:16** — X, 小红书, 即刻, Reels.

Record at 60 fps, 1440×900 or 1920×1080. Terminal font at least 18 px. Dark theme, no transparency, no desktop wallpaper. Every claim on screen must match the actual CLI output.

## Rules

- The product appears within the first 5 seconds. No logo animation, no title card, no "hi I'm..."
- Captions burned in. Most people watch muted.
- One CTA: `npx growthos demo`.
- No fake metrics, no stock footage, no AI voice claiming to be a customer.
- If the terminal shows a failure, that is the point. Do not cut it.

## 90-second cut

| Time | Visual | Voiceover / caption |
| --- | --- | --- |
| 0:00–0:07 | Terminal. Cursor blinks. Type `npx growthos demo`. | "Every AI marketing tool makes claims. Almost none can show you the receipt." |
| 0:07–0:15 | Output appears. `FAIL` line, then the claim text. | "This memo says HVAC owners want an AI SDR. It has no source." |
| 0:15–0:21 | Highlight `Claim 2 has no receipt.` Slow push in. | "So the build fails. Not a warning. A failure." |
| 0:21–0:30 | Scroll to `PASS` memo: 6 claims, 18 receipts, 4 channels. | "The next memo has six claims and eighteen receipts across four channels. It passes." |
| 0:30–0:36 | Score line: `88/100 (System)`. | "Same repo. Same command. The difference is evidence." |
| 0:36–0:46 | Open `growth/signals/` in an editor. Show one file: quote, URL, `quote_hash`. | "A signal is a verbatim quote with a URL, a date, consent, and a hash. Edit the quote later and the audit knows." |
| 0:46–0:58 | Open a memo. Highlight `[@sig_...]` citations. | "Every claim in a memo must cite a signal. No citation, no claim." |
| 0:58–1:08 | Run `npx growthos score --explain`. Show the rubric lines. | "The score is a hundred deterministic points. Evidence, freshness, loop closure, agent operations, memo quality, proof. Under twenty signals, it caps at sixty." |
| 1:08–1:18 | Open the cockpit HTML. Scroll past score, receipts donut, experiment ledger. | "The cockpit is one HTML file. No CDN, no account, no database. It works offline." |
| 1:18–1:26 | Cut to Claude Code / terminal: `growthos task compile customer-truth`. | "Your agent reads the repo through a compiler or an MCP server. Write tools default to dry-run." |
| 1:26–1:30 | End card: `npx growthos demo` + repo URL. | "MIT. Open source. Run the demo." |

VO word count: ~150 words. Read at a normal pace, about 165 wpm. Do not rush; cut words instead.

## 30-second vertical cut (9:16)

| Time | Visual | Caption |
| --- | --- | --- |
| 0:00–0:04 | Terminal filling the frame. `npx growthos demo` typed large. | `AI marketing has no receipts.` |
| 0:04–0:10 | Output. `FAIL Claim 2: no receipt.` | `This claim has no source. So the build fails.` |
| 0:10–0:17 | Scroll to PASS and 88/100. | `6 claims. 18 receipts. 88/100.` |
| 0:17–0:23 | Fast cuts: signal file hash, memo citation, cockpit. | `Quote → hash → citation → audit.` |
| 0:23–0:30 | End card. Large command. | `npx growthos demo · MIT · open source` |

For 小红书, replace the end card with `评论区回复 growthOS` and keep the repo URL off-screen.

## Shot list

1. Clean shell, `~/demo/growthos`, prompt visible, no personal paths.
2. `npx growthos demo` — record the full run, including the pause before output. Do not speed it up; it finishes in under 5 seconds.
3. `growth/signals/2026-11-03-owner-ai-sdr.md` (or whichever signal backs the failing claim) open in an editor, scrolled to frontmatter.
4. `growth/memos/2026-11-05-whatthemarketistellingus.md`, claims section, with citations visible.
5. `npx growthos score --explain` output.
6. `growth/cockpit/index.html` in a browser at 1440 wide, then at 390 wide for the mobile shot.
7. `npx growthos task compile customer-truth`, then `ls .growthos/runs/<id>/`.
8. Optional: Claude Code window running `growthos_status` through MCP. Only if it works on the first take.

## Captions file

Keep a plain-text transcript next to the video for accessibility and for reposting:

```text
Every AI marketing tool makes claims. Almost none can show you the receipt.
This memo says HVAC owners want an AI SDR. It has no source.
So the build fails.
The next memo has six claims and eighteen receipts. It passes.
Same repo. Same command. The difference is evidence.
Signals are verbatim quotes with a URL, a date, and a hash.
Every claim must cite a signal.
The score is one hundred deterministic points.
The cockpit is one HTML file. It works offline.
MIT. Open source. Run the demo.
```

## Production notes

- Record the terminal with OBS or QuickTime; keep the cursor steady.
- Use a clean font (Berkeley Mono, JetBrains Mono, SF Mono) at 18–20 px.
- Slow push-ins are enough. No zooms that make text unreadable.
- Add a 0.4s fade between cuts, nothing else.
- Export: H.264, 1080p, 8–12 Mbps; vertical 1080×1920.
- Also export a 12-second GIF of the FAIL → PASS sequence for the README.
- Watch the final cut muted on a phone before publishing. If the story does not land without audio, re-cut.
