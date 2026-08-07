---
name: class12-lead-qualification
description: Student-editable Class 12 workflow for scoring business leads using fit, urgency, budget, timeline, and buying intent.
---

# Class 12 Lead Qualification

## When to use
Use this skill when a student or operator needs to decide **how strong a lead really is** before spending time on quoting, proposal drafting, or repeated follow-up.

## Inputs
Collect when available:
- name
- company or business type
- need or pain point
- service interest
- source
- budget
- timeline
- urgency phrases
- role / decision-maker clues
- objections or concerns

## Scoring dimensions
Evaluate these dimensions:
1. business fit
2. pain clarity
3. urgency
4. budget strength
5. timeline strength
6. buying intent
7. decision-maker access

## Score guide
- `5` — priority lead: clear fit, strong pain, near-term timeline, real buying signal
- `4` — strong lead: good fit with one unclear factor such as budget or timeline
- `3` — possible lead: some fit, but needs qualification before proposal
- `2` — weak lead: vague inquiry, limited buying signal, or poor fit
- `1` — poor-fit or insufficient information lead

## Business rules
- Do not invent missing budget or timeline.
- A lead asking for pricing, demo, proposal, or implementation help is stronger than a generic “tell me more.”
- A weak lead can still be useful for nurture or content insight.
- Always include `score_reason` in plain business language.
- Highlight red flags if the lead is low-fit, price-only, or clearly research-only.

## Output format
## Qualification summary
- lead_score: 1-5
- score_reason:
- strongest positive signals:
- red flags:
- qualification gaps:
- recommended next step:

## Example prompt
Use the Class 12 lead qualification workflow.
Score this lead from 1 to 5 and explain why.
