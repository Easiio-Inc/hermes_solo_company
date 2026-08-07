# Class 12 Developer Build Spec + Student Lesson Plan

> **For Hermes:** This is a planning-first document for building and teaching Class 12: AI Customer Service and Sales Agent.

**Goal:** Define both the implementation blueprint and the classroom teaching flow for a review-first conversion workflow that turns inbound leads into customer-service actions, sales follow-up, and CRM-ready next steps.

**Architecture:** Build Class 12 as an intake-and-routing workflow. Students provide a lead or inquiry, Hermes classifies the route, scores the lead, drafts the response package, and prepares a CRM-ready handoff. The classroom experience should mirror the real small-business workflow so students learn by operating the same modules they can later reuse.

**Tech Stack:** Hermes skill orchestration, structured markdown/JSON outputs, Solo CRM integration patterns, optional class page/workspace UI later.

---

# Part 1 — Developer Build Spec

## 1. Product Summary

### Module name
`class12-customer-service-sales-agent`

### Purpose
Help students and instructors convert one inbound message into:
- route classification
- qualification score
- customer-service or sales response
- CRM stage recommendation
- follow-up task
- operator next action

### Core principle
Do not start with autonomous outreach or auto-send behavior. The first version should be review-first, operator-approved, and CRM-centered.

---

## 2. System Architecture

### Input layer
Collect:
- lead identity fields
- inquiry text or transcript
- service interest
- budget / timeline if known
- source
- optional previous conversation context

### Routing layer
Orchestrate these reusable skills/modules:
1. `class12-customer-service-sales-orchestrator`
2. `class12-lead-qualification`
3. `class12-customer-service-reply`
4. `class12-sales-followup`
5. `class12-crm-update-handoff`

### Presentation layer
Render or return:
- lead summary
- route classification
- scorecard
- reply drafts
- CRM note
- next action

### Optional persistence layer
Future versions can write directly to Solo CRM or a classroom queue. Phase 1 should stay safe and review-first.

---

## 3. Recommended Repository / Module Structure

```text
class12-customer-service-sales-agent/
  README.md
  docs/
    class12-spec.md
    prompts/
      orchestrator.md
      lead-qualification.md
      sales-followup.md
      crm-handoff.md
    schemas/
      lead-input.schema.json
      qualification.schema.json
      response-package.schema.json
      crm-handoff.schema.json
  skills/
    class12-customer-service-sales-orchestrator.md
    class12-lead-qualification.md
    class12-sales-followup.md
    class12-crm-update-handoff.md
  src/
    intake/
      leadInput.ts
      transcriptNormalizer.ts
    analysis/
      runRouteClassification.ts
      runLeadQualification.ts
      runSalesFollowup.ts
      runCrmHandoff.ts
    ui/
      Class12Page.tsx
      LeadIntakeForm.tsx
      QualificationPanel.tsx
      FollowupDraftPanel.tsx
      CrmHandoffPanel.tsx
  tests/
    intake/
    analysis/
    ui/
```

If the environment stays prompt-first instead of app-first, keep the same conceptual split even if the files are docs-and-skills only.

---

## 4. Data Contracts

### 4.1 LeadInput
```json
{
  "name": "Sarah Chen",
  "email": "sarah@example.com",
  "company": "Smile Dental",
  "source": "website_chatbot",
  "inquiry_text": "We want an AI chatbot for after-hours patient questions.",
  "service_interest": "AI chatbot",
  "budget": "$1500/month",
  "timeline": "this month"
}
```

### 4.2 QualificationOutput
```json
{
  "lead_score": 5,
  "score_reason": "Clear fit, urgent timeline, and specific business pain.",
  "positive_signals": ["after-hours pain", "budget signal", "urgent timeline"],
  "red_flags": [],
  "recommended_next_step": "book demo call"
}
```

### 4.3 ResponsePackage
```json
{
  "route": "sales_qualified",
  "email_draft": "...",
  "dm_draft": "...",
  "call_script": "...",
  "best_cta": "Book a 20-minute workflow review"
}
```

### 4.4 CrmHandoff
```json
{
  "summary": "Dental clinic wants after-hours appointment chatbot.",
  "stage_recommendation": "qualified",
  "follow_up_task": "Send workflow summary and book demo",
  "missing_information": ["number of current monthly inquiries"],
  "operator_next_action": "Send consultative email today"
}
```

---

# Part 2 — Student Lesson Plan

## Learning objectives
By the end of Class 12, students should be able to:
1. identify whether an inquiry is service, sales, or weak-fit
2. score lead quality from 1 to 5
3. draft consultative responses for multiple channels
4. convert one conversation into a clean CRM handoff
5. recommend one practical next action

## Class sequence
1. explain the conversion pipeline
2. classify example inquiries
3. score leads
4. draft replies
5. prepare CRM handoffs
6. discuss what qualifies for a proposal or quote in the next step

## Teaching guardrails
- never auto-send in class
- never treat all leads as equal
- never skip the next-action field
- keep outputs practical and editable
