# Launch kit

Everything needed to put growthOS in front of people without pretending it is bigger than it is.

**Main metric:** GitHub stars + npm installs. Everything else is a leading indicator.
**Positioning:** Marketing skills teach agents what to say. growthOS gives them memory, receipts, and a scoreboard.
**Proof:** [`PROOF.md`](../PROOF.md). Week 0 is all zeros on purpose.

## Contents

| File | Use |
| --- | --- |
| [`x-thread.md`](x-thread.md) | 8-post launch thread, 6 quote-post variants, reply playbook, DMs |
| [`xiaohongshu.md`](xiaohongshu.md) | 8-slide carousel, 3 hooks, cover copy, comment CTA, posting notes |
| [`show-hn.md`](show-hn.md) | Show HN title/body, first comment, hostile-question FAQ |
| [`reddit.md`](reddit.md) | r/opensource, r/SideProject, r/ClaudeAI variants + subreddit rules |
| [`video-script.md`](video-script.md) | 90-second demo, 30-second vertical cut, shot list, captions |
| [`design-partner.md`](design-partner.md) | One-pager, outreach DM, 60-minute audit agenda, memo template |
| [`newsletter-pitch.md`](newsletter-pitch.md) | Three pitches: dev-tools, AI, marketing operators |
| [`cards/`](cards/) | 12 quote cards (1:1), an 8-slide XHS carousel (3:4), OG image (1200×630) |

Regenerate the cards after changing claims or quotes (needs Chrome; set `CHROME_PATH` if it is not in a standard location):

```bash
pnpm cards
```

## Schedule

All times explicit. The account has under 500 followers, so borrowed reach is the plan, not a bonus.

| When | Do |
| --- | --- |
| T-14 | Freeze v0.1. Record the 90s demo. Publish three build-in-public posts. Start the 30 design-partner DMs. |
| T-7 | Publish the spec for feedback. Publish the first dogfood memo. Collect 10 concrete quote commitments. Open 5 good-first-issues. |
| T-3 | Finalize every asset. Test on clean macOS, Linux, WSL. Send exact copy and timing to the quote pool. |
| T-1 | Publish the npm version. Verify demo, badge, docs, video, landing page. Remind all 50 people with their specific slot. |
| T0 09:00 ET | Main X post with video. Reply to every comment for 90 minutes. |
| T0 09:05–09:30 ET | Quote posts from the pool. Each one gets its own angle and its own sentence. |
| T0 09:30 ET | Show HN. |
| T0 10:00 ET | Reddit (r/opensource first, others spaced by 3+ hours). |
| T0 20:00 CST | Xiaohongshu carousel. Reply to every comment for 60 minutes. |
| T0 21:00 CST | 即刻 / V2EX, Chinese text only. |
| T+1 | Numbers thread. Thank the pool by name. Ship one feedback fix. Update `PROOF.md`. |
| T+7 | Week-1 proof post: stars, installs, demos, partner calls, what failed. Publish the first case study. |

## The three spikes

A small account gets near-zero organic reach. Distribution has to be manufactured:

1. **Borrowed quotes.** 30–50 people, each with a specific sentence and a specific time. Not "please support."
2. **Technical launch.** Show HN and Reddit with architecture, limitations, and no growth-hack language.
3. **The badge loop.** Design partners carry a Growth OS Score badge in their README. Every badge is a backlink and a discovery node.

## Repository settings (do once, before T-7)

- **Description:** `Evidence-first Growth OS for AI agents. Signals, receipts, experiments, and a deterministic score.`
- **Topics:** `growth`, `marketing`, `ai-agents`, `mcp`, `claude-code`, `codex`, `customer-truth`, `growth-os`, `typescript`.
- **Social preview:** upload [`cards/og-1200x630.png`](cards/og-1200x630.png) under Settings → General → Social preview.
- **Features:** enable Discussions. Pin a "Share your Growth OS Score" discussion and link the issue form.
- **Pages:** source = GitHub Actions; the `pages` workflow deploys `site/`.
- **Labels:** `bug`, `evidence`, `showcase`, `good first issue`, `format`, `docs`.
- **Good first issues:** at least five, each with a file pointer and an acceptance test.
- **Release:** tag `v0.1.0` only after `pnpm pack:smoke` passes on a clean machine.

```bash
gh repo edit --description "Evidence-first Growth OS for AI agents. Signals, receipts, experiments, and a deterministic score." \
  --add-topic growth,marketing,ai-agents,mcp,claude-code,codex,customer-truth,growth-os
```

## Weekly leading indicators

Track in `PROOF.md`, not in a private dashboard:

- stars/day and cumulative
- npm installs/day (7-day rolling from npm)
- demo completion (`demo` runs that print the score)
- `doctor` runs per install (anonymous opt-in only; never phone home silently)
- design-partner calls booked and completed
- external repos displaying the badge
- inbound issues and PRs
- qualified replies ("I ran this on my repo" beats "great project")

## Kill criteria

Written down before launch so the decision is not emotional.

- **30 days:** < 500 stars, < 1,000 installs, < 10 partner calls, < 3 external badges → narrow to "CI for marketing claims": a GitHub Action that runs `growthos doctor` on every content PR.
- **60 days:** < 1,500 stars and no organic creator mentions → stop broad launch. Go niche at dev-tool startups. Build 20 case studies.
- **90 days:** < 3,000 stars → 10K is not realistic without a second distribution event. Either find a partner with reach or redefine success as a useful 1K-star project with real users.
- **Product signal:** installs happen but experiments are never used → growthOS is a linter, not an OS. Double down on the linter.
- **Vanity signal:** stars grow but installs and partner calls do not → distribution without product. Stop launching and fix onboarding.

## Rules for every asset

- Say what the product is in the first line. Cleverness is not a substitute.
- Use real numbers or no numbers. No "10x," no "revolutionary."
- Quote customers verbatim or do not quote them.
- Never imply design partners exist before they do.
- One CTA per asset: run `npx growthos demo`, or reply, or book an audit. Not all three.
- No auto-DM, no scraping, no engagement pods. The whole product argues against that.
