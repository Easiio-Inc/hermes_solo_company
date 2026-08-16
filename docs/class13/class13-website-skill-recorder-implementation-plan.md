# Class 13 Website Skill Recorder Chrome Extension — Implementation Plan

> **For Hermes:** Use TDD for logic helpers and keep publication flows review-first.

## Goal
Build a classroom-ready Chrome extension MVP that records operator actions on a website, lets the operator review and approve the action timeline, and then exports a Hermes-ready skill draft that can later be published for other bots.

## User story
As an operator, I want to record how I complete a task on a website so Hermes can learn that workflow without me manually writing every selector and step.

## MVP scope
1. Start/stop recording for the active tab
2. Capture clicks, inputs, changes, submits, and key confirmations
3. Generate selector candidates for each step
4. Redact sensitive values before export
5. Review the captured step list in an extension panel
6. Approve and export a Hermes skill draft plus JSON payload

## Non-goals for MVP
- automatic replay
- cloud sync
- direct Hermes API upload
- multi-user publishing workflow
- visual AI understanding of screenshots

## Recommended folder layout

```text
tools/hermes-website-skill-recorder-extension/
  README.md
  manifest.json
  package.json
  src/
    background/
      service-worker.js
    content/
      shared.js
      recorder.js
    panel/
      panel.html
      panel.css
      panel.js
    shared/
      skill-builder.js
  tests/
    skill-builder.test.mjs
```

## Data model
Each recorded action should include:
- id
- tabId
- url
- pageTitle
- eventType
- timestamp
- selectorCandidates[]
- chosenSelector
- label
- textSample (redacted when needed)
- inputKind
- notes

## Approval flow
1. Operator opens the popup and starts recording.
2. Operator performs the workflow on the target website.
3. Content script streams steps to the background worker.
4. Popup shows the timeline grouped by tab/session.
5. Operator removes accidental steps if needed.
6. Operator clicks **Build skill draft**.
7. Extension exports:
   - sanitized JSON recording
   - markdown skill draft
   - publication checklist metadata

## Redaction rules for MVP
Redact by default when a field or selector suggests:
- password
- token
- secret
- auth
- credit card
- email
- phone

Also truncate long text input values and prefer placeholders such as `[REDACTED_EMAIL]`.

## Future phases
- direct Hermes bot handoff
- replay validation mode
- selector health scoring
- screenshot diff support
- public skill registry packaging

## Verification checklist
- recording works on a normal HTML form
- approval UI shows captured steps in order
- exported markdown includes prerequisites, steps, and verification notes
- redaction removes sensitive values from both JSON and markdown
- test suite covers selector normalization and redaction logic
