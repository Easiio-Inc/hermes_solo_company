---
name: class13-website-skill-recorder-publishing
description: Student-editable Class 13 skill for turning an approved browser recording into a reusable Hermes website-operation skill draft and publication pack.
---

# Class 13 Website Skill Recorder Publishing

## Purpose
Use this Class 13 skill when a student, operator, or founder wants to teach Hermes how to operate a website by first **recording a human workflow in the browser** and then converting that approved recording into a skill draft.

The goal is to turn one approved walkthrough into:
- a cleaned action timeline
- a redacted evidence pack
- a Hermes-ready skill draft
- a publication checklist for sharing the skill later with other bots or operators

## Core principle
Do **not** publish or hand off raw browser recordings without review.

Every run should be **review-first**:
1. capture
2. inspect
3. redact
4. approve
5. export
6. publish later only after human sign-off

## When to use it
Use this skill for workflows such as:
- logging into a business dashboard
- navigating a CMS or admin tool
- submitting forms on a vendor portal
- searching and updating records on an internal web app
- teaching Hermes how to complete a repeatable website task

## Input checklist
Collect or confirm:
- target website name
- starting URL
- business goal of the workflow
- operator description of success criteria
- recording of user actions
- screenshots or DOM evidence if needed
- redaction policy for secrets, personal data, and tokens
- publish/private decision

## Workflow

### Step 1 — Define the website task
Summarize the task in one sentence:
- website
- user role
- target outcome
- stop condition

### Step 2 — Capture the interaction
Record the operator workflow with the Chrome extension.

Capture at minimum:
- page URL
- page title
- event type
- selector candidates
- input intent
- timestamps

### Step 3 — Review the captured steps
Before building a skill, inspect the timeline for:
- duplicate clicks
- accidental actions
- navigations that should be ignored
- missing waits or confirmations
- sensitive text that must be redacted

### Step 4 — Redact sensitive data
Remove or mask:
- passwords
- access tokens
- API keys
- email addresses when not necessary
- phone numbers when not necessary
- customer names if they are not essential to the workflow
- long free-text inputs that may contain secrets

Keep only the minimum evidence required to rebuild the website skill safely.

### Step 5 — Convert the recording into a Hermes skill draft
Build a draft that includes:
- skill name
- short description
- target domain
- prerequisites
- ordered steps
- selector strategy notes
- failure handling notes
- verification step

### Step 6 — Create the publication pack
Prepare:
- cleaned skill markdown
- action JSON export
- risk notes
- reviewer checklist
- version label

### Step 7 — Publish only after approval
If the workflow is meant for reuse by other bots or operators, publish only after:
- redaction review passed
- selector quality is acceptable
- no secrets remain
- the workflow has been replayed or spot-checked

## Output goals
1. Keep the workflow specific and reproducible.
2. Prefer stable selectors over fragile visual descriptions.
3. Preserve enough context for Hermes to act, but not enough to leak secrets.
4. Separate private internal skills from publishable public skills.
5. End with a clear verification step.

## Guardrails
- Do not store passwords, raw cookies, access tokens, or session IDs.
- Do not publish recordings without approval.
- Do not assume selector stability if the site uses generated class names.
- Do not keep accidental operator actions in the final skill.
- Do not expose customer data when demonstrating the workflow.

## Output format
## Website task summary
## Recording review summary
## Redaction summary
## Hermes skill draft
## Selector notes
## Risks and assumptions
## Verification step
## Publication recommendation

## Example prompt
Use the Class 13 website skill recorder publishing workflow for this request.

Website:
Starting URL:
Operator goal:
Success condition:
Sensitive fields to redact:
Recording payload:

Return:
- website task summary
- recording review summary
- redaction summary
- Hermes skill draft
- selector notes
- risks and assumptions
- verification step
- publication recommendation
