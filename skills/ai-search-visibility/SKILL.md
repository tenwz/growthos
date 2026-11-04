---
name: growthos-ai-search-visibility
description: Find and fix gaps in how AI assistants answer questions in your category. Use for ChatGPT/Perplexity citations, llms.txt, comparison pages, and "why don't we show up" research.
---

# AI Search Visibility

AI answers are assembled from sources. Your job is to become a source that is easy to quote, not to stuff keywords.

## Method

1. **Define the questions that precede a purchase.** Write 10–20 real questions a buyer asks before they know your name. Pull phrasing from signals when possible.
2. **Probe the assistants.** Ask each question in 2–3 assistants, logged out. Record:
   - which brands are named;
   - which URLs are cited;
   - what claim about your category is repeated;
   - whether your brand appears at all.
3. **Capture the observations** as signals with `provenance: public` or `internal`, quoting the answer verbatim and linking the conversation or a saved file.
4. **Find the source gap.** If assistants cite a comparison page, directory, or docs page, the gap is usually content structure, not authority.
5. **Fix one source at a time.** Prefer pages that are:
   - direct answers with a one-sentence definition;
   - tables with explicit columns and units;
   - original data or a verifiable number;
   - crawlable without JavaScript;
   - linked from a canonical `llms.txt` or docs index.

## Output contract

`growth/ai-search/YYYY-MM-DD-visibility-gaps.md`:

```markdown
# Visibility gaps — 2026-11-06

## Questions probed

| Question | Assistant | Brands named | Sources cited | We appear? |
| --- | --- | --- | --- | --- |

## Repeated claims about the category

- "<claim>" — seen in 4/6 answers.

## Gaps we can own

| Gap | Page to build/fix | What would make it quotable | Receipt |
| --- | --- | --- | --- |

## Next probe

- <question set>, <assistants>, <date>
```

Rules:

- Never fabricate an AI answer. Quote it and link the saved artifact.
- Do not claim "ranking" from a single prompt run; assistants are stochastic.
- Do not write text designed to manipulate an assistant. Write text a human would trust.
- If your product is not mentioned, say so plainly; that is the finding.

## Report

Give the user the three questions where they are invisible, the two sources that keep winning, and the one page to fix this week.
