---
name: class12-customer-service-sales-orchestrator
description: Student-editable Class 12 entry workflow for routing website leads, chatbot transcripts, and inquiry messages into customer-service or sales follow-up actions.
---

# Class 12 Customer Service + Sales Orchestrator

## Purpose
Use this Class 12 skill as the **main entry point** when a student or operator receives:
- a website lead
- a chatbot conversation
- an email inquiry
- a DM inquiry
- a short call summary

The goal is to convert one incoming inquiry into:
- lead summary
- route classification
- qualification score
- draft reply package
- CRM note
- next action

## Core principle
Do **not** start with autonomous selling.

Start with:
1. summarize the inquiry
2. classify the route
3. score the lead
4. draft the response
5. prepare CRM handoff
6. recommend the next step

## Inputs
Ask for or infer when available:
- name
- email
- phone optional
- company or business type
- source
- inquiry text or transcript
- service interest
- budget
- timeline
- urgency signals
- known objections or special requirements

If information is missing, do not invent it. Mark it as `Unknown` when important.

## Route options
### Route A — Customer-service inquiry
Use when the person mainly needs:
- product or service clarification
- pricing range explanation
- FAQ answers
- scheduling help
- support direction

### Route B — Sales-qualified lead
Use when the person shows:
- clear business pain
- request for quote, proposal, demo, or next step
- urgency or implementation timeline
- budget or buying intent signals

### Route C — Early-stage / weak-fit lead
Use when the inquiry is:
- vague
- research-only
- free-only
- poorly matched to the offer
- missing core buying signals

## Output goals
Return:
1. a concise lead summary
2. the best route classification
3. a qualification score with reason
4. a recommended downstream skill
5. a draft response package
6. a CRM-ready handoff
7. one best next action

## Business rules
- Keep the tone consultative and practical.
- Separate customer-service help from sales advancement.
- Prefer one clear next action instead of many vague suggestions.
- Do not claim a quote is approved unless a human approved it.
- Do not claim CRM was updated unless it actually was.
- If the lead is weak, still be helpful without forcing a hard sell.

## Recommended downstream skill mapping
- Customer-service inquiry -> `class12-customer-service-reply`
- Sales-qualified lead -> `class12-sales-followup`
- CRM packaging needed -> `class12-crm-update-handoff`
- Quote/proposal request -> future `class12-quote-proposal-draft`

## Output format
## Lead summary
## Route classification
## Qualification score
## Recommended downstream skill
## Draft response package
## CRM handoff
## Best next action

## Example prompt
Use the Class 12 customer-service and sales orchestrator for this inquiry.

Inputs:
- name:
- company:
- source:
- inquiry text:
- budget:
- timeline:

Return:
- lead summary
- route classification
- qualification score
- recommended downstream skill
- draft response package
- CRM handoff
- best next action
