---
name: student-lead-followup
description: Class 4 teaching skill that turns website lead data into a consultative follow-up email, CRM note, qualification score, dental FAQ examples, and next action.
---

# Student Lead Follow-up Skill

## When to use

Use this skill in AI Solo Company Class 4 when a website visitor or chatbot conversation produces a lead and the student needs a repeatable business follow-up package.

This skill connects the Class 3 workflow:

```text
Website visitor -> Chatbot -> Lead capture -> Solo CRM
```

to the Class 4 workflow:

```text
Lead data -> Hermes Skill -> Follow-up email + CRM note + next action
```

The default example and specialization are for a dental clinic lead, especially clinics losing appointment revenue because nobody answers weekend, evening, or after-hours patient questions.

## Inputs

Ask for or infer these fields when available:

- `name`
- `email`
- `phone` optional
- `company` or `business_type`
- `need`
- `budget`
- `timeline`
- `service_interest`
- `source`, such as `website_chatbot`, `ask_enroll_modal`, or `footer_inquiry_form`

If a field is missing, do not invent it. Mark it as `Unknown` and include it in the next action if important.

## Business rules

1. Use a consultative style, not a cold template.
2. Show that we understand both AI and the clinic owner's business pain: missed calls, unanswered after-hours appointment questions, patient leakage, and lost revenue from delayed response.
3. Be warm, practical, and specific. Avoid hype.
4. Treat the lead as a real business owner who needs practical help, not as a form submission.
5. Score the lead from 1 to 5 using exact boundaries for budget, timeline, business fit, and clarity of need.
6. Always include `score_reason` so the team can prioritize high-quality leads quickly.
7. Keep the follow-up short enough to send after small edits.
8. Make the CRM note copy-paste ready.
9. For dental clinic leads, include high-frequency dental FAQ examples and a specific action plan inside the CRM note.
10. Never include secrets, API keys, backend paths, or private implementation details.
11. If the lead is low fit, still be helpful and suggest a light next step.

## Consultative style requirements

Do not sound like a generic sales template. The follow-up should make the clinic owner feel understood.

Use language that recognizes problems like:

- patients ask appointment questions after business hours
- weekend and evening inquiries are not answered quickly
- front desk staff cannot cover every channel all the time
- unanswered questions turn into lost appointments
- every missed appointment request can represent lost treatment revenue
- the first AI chatbot should focus on appointment capture before adding advanced automation

The tone should be:

- consultative
- clear
- founder-to-founder
- operationally practical
- empathetic about lost revenue and missed patient inquiries

Avoid vague phrases such as:

- "revolutionize your business"
- "unlock your full potential"
- "cutting-edge synergy"
- "AI transformation journey"

## Qualification score

Use this exact `lead_score` guide:

- `5` — priority lead. Budget is greater than `$1000/month`, timeline is this month / now / urgent, business fit is clear, and the need is specific. Example: a dental clinic wants an AI chatbot for after-hours appointment questions and can launch this month.
- `4` — strong lead. Clear business fit and specific need, but either budget or timeline is less certain. Example: good dental chatbot use case, budget not confirmed, or launch is next quarter.
- `3` — possible lead. Some fit exists, but budget, timeline, or pain is incomplete. Needs qualification before proposal.
- `2` — weak lead. The request is vague, budget appears too low, or business pain is unclear.
- `1` — not enough information or poor fit. No clear contact, no business need, or no buying signal.

Budget guidance:

- Greater than `$1000/month` and urgent timeline: strong buying signal.
- `$500-$1000/month`: possible fit; qualify scope carefully.
- Below `$500/month` or unknown budget: do not disqualify automatically, but score lower unless pain and urgency are very strong.

Timeline guidance:

- `this month`, `now`, `urgent`, or `this week`: high urgency.
- `next month` or `this quarter`: medium urgency.
- `sometime`, `later`, or unknown: low urgency.

Always include `score_reason` in plain language. The reason should explain exactly why the lead received the score.

## Dental CRM note customization

When the business is a dental clinic, orthodontic clinic, dental office, or similar healthcare appointment business, the CRM note must include:

1. The core pain in business language: missed after-hours patient questions and lost appointment revenue.
2. High-frequency FAQ examples the chatbot should answer.
3. A specific next-step action plan.

Suggested dental FAQ examples:

- What appointments are available this week?
- Are you open on evenings or weekends?
- Do you accept my insurance?
- How much does a cleaning, whitening, implant consultation, Invisalign consultation, or emergency visit usually cost?
- What should I do for tooth pain or a dental emergency?
- Can I reschedule or cancel an appointment?
- Where is the clinic located and is parking available?
- Can someone call me back tomorrow morning?

Suggested dental action plan:

- Collect the clinic's top 20 patient questions.
- Confirm appointment request handoff: email, SMS, CRM, or front desk callback list.
- Configure after-hours lead capture with name, phone/email, preferred appointment time, and treatment interest.
- Start with appointment questions first, then expand to insurance, services, and recall campaigns.
- Review captured questions weekly to improve the FAQ and identify revenue opportunities.

## Output format

Return Markdown using exactly these sections:

```markdown
## Lead summary
- Name:
- Email:
- Business / company:
- Need:
- Budget:
- Timeline:
- Source:

## Qualification score
- lead_score: 1-5
- score_reason:

## Follow-up email
Subject: ...

Hi ...,
...

## CRM note
- Lead source:
- Problem / need:
- Business pain:
- Fit:
- Budget / timeline:
- Dental FAQ examples:
  - ...
- Recommended action plan:
  - ...
- Recommended next action:

## Next action
...
```

## Example input

```text
Name: Sarah Chen
Email: sarah@example.com
Business: local dental clinic (Smile Dental)
Need: wants AI chatbot for weekend & evening appointment questions
Budget: $1500/month
Timeline: this month
Source: website chatbot
```

## Example output style

The output should sound like:

- practical
- clear
- consultative
- friendly
- founder-to-founder
- focused on the next useful step
- specific to the clinic's missed-call and missed-appointment problem

Example consultative sentence style:

```text
The biggest opportunity is not to build a complicated AI system first. It is to make sure Smile Dental does not lose weekend and evening appointment requests just because the front desk is closed.
```

## Class 4 customization exercises

Students can customize this skill by changing:

1. Email tone: warmer, more direct, more premium, more casual, or more consultative.
2. Lead scoring rules: change budget or urgency weighting.
3. Output format: Markdown for humans or JSON for software integration.
4. CRM note style: bullets, table, or structured fields.
5. Industry specialization: dental clinic, real estate, restaurant, education, law firm, or local service business.
6. Next action rules: call, email, demo, audit, or nurture sequence.

## Testing checklist

After editing this skill, test with the same sample lead before and after the change.

Check that:

- Lead summary is complete.
- Qualification score is present.
- `lead_score` is between 1 and 5.
- `score_reason` explains the score using budget, timeline, fit, and clarity.
- A dental lead with budget greater than `$1000/month` and timeline `this month` scores `5`.
- Follow-up email is consultative, not a cold template.
- Follow-up email mentions the clinic's after-hours missed appointment problem when relevant.
- CRM note is copy-paste ready.
- CRM note includes dental FAQ examples for dental clinic leads.
- CRM note includes a specific action plan.
- Next action is specific.
- Output format did not accidentally change unless the exercise requested it.
