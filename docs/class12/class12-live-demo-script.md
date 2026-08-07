# Class 12 Live Demo Script

Use this script to run a clean, classroom-ready demo of the current Class 12 workspace in the owner app.

---

## Demo objective
Show students how one inbound inquiry becomes:
- route classification
- lead score
- response package
- CRM-ready handoff
- queue review decision
- proposal review
- exported markdown/JSON handoff for future skill creation

---

## Recommended demo duration
- short version: 8 to 10 minutes
- full teaching version: 15 to 20 minutes

---

## Demo setup
Before class, prepare:
- the owner app running with the Class 12 tab available
- the default demo lead or one chosen sample lead
- the Class 12 sample leads document for reference
- a short explanation of queue statuses and review-first behavior

Recommended demo lead:
- Sarah Chen
- Smile Dental
- wants after-hours patient questions handled and appointments captured
- budget around $1500/month
- timeline this month

---

## Talk track and click path

### Step 1 — Introduce the business problem
Say:
> Many businesses do not just need an AI answer. They need a system that decides what kind of inquiry this is, what reply to send, what to put in the CRM, and whether the lead is worth serious follow-up.

Then open the **Class 12 workspace**.

---

### Step 2 — Show lead intake
Use the **Lead intake** section.

Action:
- click **Load demo lead** or enter the lead manually

Say:
> This is the raw inbound signal. Before we promise anything, we need structured intake.

Point out the fields:
- lead name
- email
- company
- source
- service interest
- budget
- timeline
- inquiry text
- previous context

---

### Step 3 — Run the Class 12 package
Action:
- click **Run Class 12 package**

Say:
> Now Hermes turns one inquiry into an operational package, not just a single answer.

---

### Step 4 — Read the lead summary and route
Use the **Lead summary** and **Signals and risks** sections.

Explain:
- why the lead was routed the way it was
- which signals increase confidence
- which missing fields still matter

Ask students:
- Why is this sales-qualified instead of customer service only?
- What evidence supports the score?

---

### Step 5 — Show the response package
Use the **Multi-channel drafts** section.

Walk through:
- best CTA
- email draft
- DM draft
- call script

Say:
> Good operators adapt the same business decision into multiple communication formats.

Teaching point:
- the CTA should stay consistent across channels
- tone should be practical, not overly salesy

---

### Step 6 — Show the CRM handoff
Use the **Operator-approved next action** section.

Explain:
- stage recommendation
- follow-up task
- operator next action
- why auto-send remains disabled

Say:
> If this cannot become a clean CRM note, it is not yet a reliable business workflow.

---

### Step 7 — Show queue review
Use **Phase 8** and **Follow-up queue UI**.

Explain:
- pending review
- approved
- deferred
- completed

Action:
- select the queue item
- approve it if needed

Say:
> This is where the human operator keeps control. AI helps prepare the work, but review still matters.

---

### Step 8 — Show proposal review
Use **Phase 9**.

Action:
- edit the quote band
- edit one scope bullet
- edit one discovery question
- optionally edit the proposal note

Say:
> Not every lead deserves proposal time. But for the right lead, we can prepare a better next step without auto-sending anything.

Teaching point:
- students should learn when a lead is mature enough for proposal review
- proposal work begins after qualification, not before

---

### Step 9 — Show exportable handoff
Use **Phase 10**.

Explain the two exports:
- **markdown** for a human-readable operator brief
- **JSON** for future Hermes or bot ingestion

Action:
- export the markdown file
- export the JSON file

Say:
> This is the bridge from today’s classroom workflow to tomorrow’s reusable website skill. Once an operator approves the flow, it can become structured knowledge for future bots.

---

### Step 10 — Close with the main lesson
Say:
> The real value is not just answering a lead. The real value is building a repeatable system for deciding what happens next.

Recap the flow:
1. intake
2. route
3. qualify
4. draft reply
5. prepare CRM handoff
6. review queue
7. prepare proposal if justified
8. export reusable workflow knowledge

---

## Questions to ask students during the demo
- What makes this lead high-fit or low-fit?
- What missing information would change your decision?
- What is the best CTA and why?
- Should this go to proposal review now, later, or never?
- What would you store in the CRM if you had only 30 seconds?

---

## Optional second demo lead
Use a weaker or less clear lead after the strong one.

Example:
- research-only inquiry
- unclear budget
- no timeline
- asking broad pricing questions only

Teaching contrast:
- likely route becomes nurture or weak-fit
- response should stay helpful without overcommitting
- proposal review should usually be skipped

---

## Common demo mistakes to avoid
- spending too long editing prompts instead of explaining decisions
- acting as if every lead should go to proposal stage
- focusing only on copy instead of workflow logic
- skipping the CRM handoff explanation
- forgetting to explain why review-first is safer and more realistic

---

## Follow-up teaching assets to build next
- screenshot-based slide deck
- student worksheet with 4 scored leads
- rubric for route + score + CTA quality
- export examples annotated line by line
- short homework asking students to convert one export into a reusable website skill
