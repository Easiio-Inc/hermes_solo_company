# Class 12 Customer Service and Sales Agent Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build a classroom-ready Class 12 conversion workflow that takes one inquiry or lead and returns qualification, follow-up drafts, CRM handoff, and one best next action.

**Architecture:** Implement Phase 1 as a docs-and-skills release first. Keep the workflow review-first and prompt/skill-centered before building any direct CRM-writing or UI-heavy automation.

**Tech Stack:** Markdown skills, classroom docs, structured output conventions, future Solo CRM integration.

---

## Current context / assumptions

This plan assumes:
- the repo already contains prior class materials under `skills/class11/` and `docs/class11/`
- Class 12 should fit directly after market research and before business-model packaging
- Phase 1 focuses on teaching assets and reusable skills, not a full product UI

---

## Target feature set

### Phase 1 MVP
1. Class 12 skills README
2. customer-service + sales orchestrator skill
3. lead qualification skill
4. customer-service reply skill
5. sales follow-up skill
6. CRM update handoff skill
7. Class 12 docs README
8. Class 12 teacher handout
9. developer build spec + lesson plan
10. sample leads file
11. AI Solo Company demo case

### Post-Phase-1
- quote/proposal draft skill
- class12 workspace page
- Solo CRM write integration
- follow-up queue UI
- activity timeline and stage analytics

---

## Proposed file structure

```text
skills/class12/
  README.md
  class12-customer-service-sales-orchestrator/
    SKILL.md
  class12-lead-qualification/
    SKILL.md
  class12-customer-service-reply/
    SKILL.md
  class12-sales-followup/
    SKILL.md
  class12-crm-update-handoff/
    SKILL.md

docs/class12/
  README.md
  class12-teacher-handout.md
  class12-dev-spec-and-lesson-plan.md
  class12-implementation-plan.md
  class12-sample-leads.md
  class12-demo-case-ai-solo-company.md
```

---

## Task breakdown

### Task 1: Mirror Class 11 structure
**Objective:** Follow the repo's existing class pattern so Class 12 stays consistent.

Files:
- inspect `skills/class11/README.md`
- inspect `docs/class11/README.md`
- inspect `docs/class11/class11-teacher-handout.md`

Verification:
- Class 12 file names and folder layout match prior classroom conventions.

### Task 2: Create core Phase 1 skills
**Objective:** Create the four reusable workflows students will actually use in class.

Files:
- create `skills/class12/class12-customer-service-sales-orchestrator/SKILL.md`
- create `skills/class12/class12-lead-qualification/SKILL.md`
- create `skills/class12/class12-customer-service-reply/SKILL.md`
- create `skills/class12/class12-sales-followup/SKILL.md`
- create `skills/class12/class12-crm-update-handoff/SKILL.md`

Verification:
- each skill has frontmatter, purpose, inputs, business rules, output format, and example usage
- no secrets or hidden implementation details appear in the text

### Task 3: Create teaching docs
**Objective:** Package the class as a teachable module, not just a set of prompts.

Files:
- create `docs/class12/README.md`
- create `docs/class12/class12-teacher-handout.md`
- create `docs/class12/class12-dev-spec-and-lesson-plan.md`
- create `docs/class12/class12-sample-leads.md`
- create `docs/class12/class12-demo-case-ai-solo-company.md`

Verification:
- docs explain class goal, outputs, live demo flow, and reference files

### Task 4: Validate repo scope
**Objective:** Make sure only intended Class 12 files are introduced.

Run:
- `git status --short`
- `git diff --stat -- docs/class12 skills/class12`

Expected:
- new Class 12 files only
- unrelated repo changes remain unstaged

---

## Verification checklist
- Class 12 repo paths exist
- skill files are readable and reusable
- teaching docs are classroom-ready
- Class 12 clearly connects Class 11 outputs to later monetization work
- outputs stay review-first and operator-approved
