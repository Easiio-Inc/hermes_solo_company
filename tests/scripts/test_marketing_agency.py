from __future__ import annotations

import csv
import importlib.util
import sys
from pathlib import Path
from types import SimpleNamespace


def load_marketing_agency_module():
    script_path = Path(__file__).resolve().parents[2] / "scripts" / "marketing_agency.py"
    spec = importlib.util.spec_from_file_location("marketing_agency", script_path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


marketing_agency = load_marketing_agency_module()


def create_strategy_project(tmp_path: Path) -> Path:
    result = marketing_agency.create_strategy(
        SimpleNamespace(
            brand="Batch Score Brand",
            business="AI workflow automation for SMBs.",
            audience="SMB founders and operations leaders with manual lead handling.",
            goal="Book discovery calls.",
            offer="AI automation audit",
            tone="practical",
            region="US",
            output_dir=str(tmp_path / "workspace"),
            force=True,
        )
    )
    assert result["ok"] is True
    project_dir = Path(result["projectDir"])
    signal_result = marketing_agency.define_lead_signals(
        SimpleNamespace(
            project_dir=str(project_dir),
            signals="manual lead handling,website chatbot,partner package",
            channels="Email,LinkedIn,Website",
            negative_signals="student research",
        )
    )
    assert signal_result["ok"] is True
    return project_dir


def write_sample_csv(path: Path) -> None:
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["name", "company", "role", "source", "channel", "url", "text"],
        )
        writer.writeheader()
        writer.writerow(
            {
                "name": "Alex Founder",
                "company": "Northfield Service Group",
                "role": "Founder",
                "source": "apollo",
                "channel": "Website",
                "url": "https://example.com/northfield",
                "text": "We handle leads manually across website forms and Gmail. We are evaluating vendors for AI workflow automation and a website chatbot.",
            }
        )
        writer.writerow(
            {
                "name": "Jamie Program Director",
                "company": "FutureSkills Academy",
                "role": "Program Director",
                "source": "linkedin",
                "channel": "LinkedIn",
                "url": "https://example.com/futureskills",
                "text": "We are exploring a practical AI curriculum and may want a partner package for co-delivery.",
            }
        )


def create_prospect_list(project_dir: Path, *, name: str = "dental-outreach") -> dict[str, object]:
    return marketing_agency.create_prospect_list(
        SimpleNamespace(
            project_dir=str(project_dir),
            name=name,
            description="Bay Area dental clinics for chatbot and lead response workflows.",
        )
    )


def test_create_prospect_list_creates_state_and_artifacts(tmp_path: Path) -> None:
    project_dir = create_strategy_project(tmp_path)

    result = create_prospect_list(project_dir, name="bay-area-dental")

    assert result["ok"] is True
    assert result["list"]["slug"] == "bay-area-dental"
    assert result["list"]["approvalStatus"] == "review"

    list_json = project_dir / "docs" / "leads" / "prospect-lists" / "bay-area-dental.json"
    list_md = project_dir / "docs" / "leads" / "prospect-lists" / "bay-area-dental.md"
    assert list_json.exists()
    assert list_md.exists()

    state = marketing_agency.read_state(project_dir / marketing_agency.STATE_PATH)
    assert state["lastProspectList"]["slug"] == "bay-area-dental"
    assert state["workflowState"] == "prospect_list_ready"


def test_import_prospects_normalizes_csv_headers(tmp_path: Path) -> None:
    project_dir = create_strategy_project(tmp_path)
    create_prospect_list(project_dir, name="dental")
    csv_path = tmp_path / "prospects.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["Full Name", "Company Name", "Website", "Lead Notes", "Location"])
        writer.writeheader()
        writer.writerow(
            {
                "Full Name": "Dr. Amy Chen",
                "Company Name": "SmileWorks Dental",
                "Website": "https://smileworks.example",
                "Lead Notes": "Dental clinic with slow web response and no chatbot.",
                "Location": "San Jose, CA",
            }
        )

    result = marketing_agency.import_prospects(
        SimpleNamespace(
            project_dir=str(project_dir),
            list_id="dental",
            csv=str(csv_path),
            json_path="",
            source="manual-csv",
            channel="Email",
            limit=0,
        )
    )

    assert result["ok"] is True
    assert result["importedCount"] == 1
    assert result["rows"][0]["company"] == "SmileWorks Dental"
    assert result["rows"][0]["name"] == "Dr. Amy Chen"
    assert result["rows"][0]["channel"] == "Email"
    assert result["rows"][0]["location"] == "San Jose, CA"


def test_import_prospects_rejects_unknown_list_id(tmp_path: Path) -> None:
    project_dir = create_strategy_project(tmp_path)
    create_prospect_list(project_dir, name="known-list")
    csv_path = tmp_path / "prospects.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["Full Name", "Company Name", "Lead Notes"])
        writer.writeheader()
        writer.writerow(
            {
                "Full Name": "Dr. Amy Chen",
                "Company Name": "SmileWorks Dental",
                "Lead Notes": "Dental clinic with slow web response and no chatbot.",
            }
        )

    result = marketing_agency.import_prospects(
        SimpleNamespace(
            project_dir=str(project_dir),
            list_id="missing-list",
            csv=str(csv_path),
            json_path="",
            source="manual-csv",
            channel="Email",
            limit=0,
        )
    )

    assert result["ok"] is False
    assert "No prospect list found" in result["error"]



def test_import_prospects_accepts_json_rows(tmp_path: Path) -> None:
    project_dir = create_strategy_project(tmp_path)
    create_prospect_list(project_dir, name="education")
    json_path = tmp_path / "prospects.json"
    json_path.write_text(
        marketing_agency.json.dumps(
            [
                {
                    "Contact Name": "Priya Shah",
                    "Organization Name": "Future Skills Lab",
                    "Title": "Program Director",
                    "Website URL": "https://futureskills.example",
                    "Lead Notes": "Exploring AI curriculum partnerships and co-delivery.",
                }
            ]
        ),
        encoding="utf-8",
    )

    result = marketing_agency.import_prospects(
        SimpleNamespace(
            project_dir=str(project_dir),
            list_id="education",
            csv="",
            json_path=str(json_path),
            source="partner-sheet",
            channel="LinkedIn",
            limit=0,
        )
    )

    assert result["ok"] is True
    assert result["importedCount"] == 1
    assert result["rows"][0]["company"] == "Future Skills Lab"
    assert result["rows"][0]["role"] == "Program Director"
    assert result["rows"][0]["url"] == "https://futureskills.example"


def test_dedupe_prospects_prefers_richer_row(tmp_path: Path) -> None:
    project_dir = create_strategy_project(tmp_path)
    create_prospect_list(project_dir, name="dental")
    csv_path = tmp_path / "duplicates.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["name", "company", "url", "text", "source"])
        writer.writeheader()
        writer.writerow(
            {
                "name": "Dr. Amy Chen",
                "company": "SmileWorks Dental",
                "url": "https://smileworks.example",
                "text": "Dental clinic",
                "source": "sheet-a",
            }
        )
        writer.writerow(
            {
                "name": "Dr. Amy Chen",
                "company": "SmileWorks Dental",
                "url": "https://smileworks.example/",
                "text": "Dental clinic evaluating chatbot and lead response automation this quarter.",
                "source": "sheet-b",
            }
        )

    import_result = marketing_agency.import_prospects(
        SimpleNamespace(
            project_dir=str(project_dir),
            list_id="dental",
            csv=str(csv_path),
            json_path="",
            source="manual-csv",
            channel="Email",
            limit=0,
        )
    )
    assert import_result["ok"] is True

    result = marketing_agency.dedupe_prospects(SimpleNamespace(project_dir=str(project_dir), list_id="dental"))

    assert result["ok"] is True
    assert result["removedCount"] == 1
    assert result["keptCount"] == 1
    assert result["keptRows"][0]["text"] == "Dental clinic evaluating chatbot and lead response automation this quarter."


def test_dedupe_prospects_keeps_distinct_text_only_rows(tmp_path: Path) -> None:
    project_dir = create_strategy_project(tmp_path)
    create_prospect_list(project_dir, name="anonymous")
    csv_path = tmp_path / "anonymous.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["text", "location", "source", "channel"])
        writer.writeheader()
        writer.writerow(
            {
                "text": "Clinic looking for bilingual chatbot follow-up.",
                "location": "San Jose, CA",
                "source": "sheet-a",
                "channel": "Email",
            }
        )
        writer.writerow(
            {
                "text": "Trade school exploring AI admissions workflow support.",
                "location": "Oakland, CA",
                "source": "sheet-b",
                "channel": "LinkedIn",
            }
        )

    import_result = marketing_agency.import_prospects(
        SimpleNamespace(
            project_dir=str(project_dir),
            list_id="anonymous",
            csv=str(csv_path),
            json_path="",
            source="manual-csv",
            channel="Email",
            limit=0,
        )
    )
    assert import_result["ok"] is True

    result = marketing_agency.dedupe_prospects(SimpleNamespace(project_dir=str(project_dir), list_id="anonymous"))

    assert result["ok"] is True
    assert result["keptCount"] == 2
    assert result["removedCount"] == 0



def test_enrich_prospects_adds_industry_and_status_fields(tmp_path: Path) -> None:
    project_dir = create_strategy_project(tmp_path)
    create_prospect_list(project_dir, name="dental")
    csv_path = tmp_path / "prospects.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["name", "company", "text", "location"])
        writer.writeheader()
        writer.writerow(
            {
                "name": "Dr. Amy Chen",
                "company": "SmileWorks Dental",
                "text": "Dental clinic evaluating chatbot and lead response automation this quarter.",
                "location": "San Jose, CA",
            }
        )

    import_result = marketing_agency.import_prospects(
        SimpleNamespace(
            project_dir=str(project_dir),
            list_id="dental",
            csv=str(csv_path),
            json_path="",
            source="manual-csv",
            channel="Email",
            limit=0,
        )
    )
    assert import_result["ok"] is True

    dedupe_result = marketing_agency.dedupe_prospects(SimpleNamespace(project_dir=str(project_dir), list_id="dental"))
    assert dedupe_result["ok"] is True

    result = marketing_agency.enrich_prospects(SimpleNamespace(project_dir=str(project_dir), list_id="dental"))

    assert result["ok"] is True
    assert result["rows"][0]["industry"] == "Dental"
    assert result["rows"][0]["status"] == "enriched"
    assert result["rows"][0]["channel"] == "Email"
    assert result["rows"][0]["location"] == "San Jose, CA"


def test_export_prospects_for_scoring_feeds_batch_score_leads(tmp_path: Path) -> None:
    project_dir = create_strategy_project(tmp_path)
    create_prospect_list(project_dir, name="dental")
    csv_path = tmp_path / "prospects.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["Full Name", "Company Name", "Website", "Lead Notes"])
        writer.writeheader()
        writer.writerow(
            {
                "Full Name": "Dr. Amy Chen",
                "Company Name": "SmileWorks Dental",
                "Website": "https://smileworks.example",
                "Lead Notes": "Dental clinic evaluating chatbot and lead response automation this quarter.",
            }
        )

    import_result = marketing_agency.import_prospects(
        SimpleNamespace(
            project_dir=str(project_dir),
            list_id="dental",
            csv=str(csv_path),
            json_path="",
            source="manual-csv",
            channel="Email",
            limit=0,
        )
    )
    assert import_result["ok"] is True
    assert marketing_agency.dedupe_prospects(SimpleNamespace(project_dir=str(project_dir), list_id="dental"))["ok"] is True
    assert marketing_agency.enrich_prospects(SimpleNamespace(project_dir=str(project_dir), list_id="dental"))["ok"] is True

    export_result = marketing_agency.export_prospects_for_scoring(SimpleNamespace(project_dir=str(project_dir), list_id="dental"))
    assert export_result["ok"] is True

    score_result = marketing_agency.batch_score_leads(
        SimpleNamespace(
            project_dir=str(project_dir),
            csv=export_result["exportCsvPath"],
            source="",
            channel="",
            limit=0,
        )
    )
    assert score_result["ok"] is True
    assert score_result["scoredCount"] == 1


def test_batch_score_leads_imports_csv_and_creates_scorecards(tmp_path: Path) -> None:
    project_dir = create_strategy_project(tmp_path)
    csv_path = tmp_path / "leads.csv"
    write_sample_csv(csv_path)

    result = marketing_agency.batch_score_leads(
        SimpleNamespace(
            project_dir=str(project_dir),
            csv=str(csv_path),
            source="",
            channel="",
            draft_channel="",
            min_grade_for_draft="hot",
            limit=0,
        )
    )

    assert result["ok"] is True
    assert result["importedCount"] == 2
    assert result["scoredCount"] == 2
    assert result["gradeCounts"]["hot"] >= 1

    imported_json = project_dir / "docs" / "leads" / "imported-leads.json"
    imported_md = project_dir / "docs" / "leads" / "imported-leads.md"
    scorecards_json = project_dir / "docs" / "leads" / "lead-scorecards.json"

    assert imported_json.exists()
    assert imported_md.exists()
    assert scorecards_json.exists()

    imported_rows = marketing_agency.json.loads(imported_json.read_text(encoding="utf-8"))
    assert len(imported_rows["rows"]) == 2
    assert imported_rows["rows"][0]["name"] == "Alex Founder"

    scorecards = marketing_agency.json.loads(scorecards_json.read_text(encoding="utf-8"))
    assert len(scorecards) == 2
    assert scorecards[0]["company"] == "Northfield Service Group"
    assert scorecards[1]["company"] == "FutureSkills Academy"


def test_batch_score_leads_can_apply_fallback_source_and_limit_rows(tmp_path: Path) -> None:
    project_dir = create_strategy_project(tmp_path)
    csv_path = tmp_path / "fallback-leads.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["name", "company", "text"])
        writer.writeheader()
        writer.writerow({"name": "Taylor Ops", "company": "OpsCo", "text": "Manual lead handling and inconsistent follow-up."})
        writer.writerow({"name": "Morgan Ops", "company": "OpsCo 2", "text": "Manual lead handling and website chatbot gap."})

    result = marketing_agency.batch_score_leads(
        SimpleNamespace(
            project_dir=str(project_dir),
            csv=str(csv_path),
            source="apollo-export",
            channel="Email",
            draft_channel="",
            min_grade_for_draft="hot",
            limit=1,
        )
    )

    assert result["ok"] is True
    assert result["importedCount"] == 1
    assert result["scoredCount"] == 1

    imported_json = project_dir / "docs" / "leads" / "imported-leads.json"
    payload = marketing_agency.json.loads(imported_json.read_text(encoding="utf-8"))
    assert payload["rows"][0]["source"] == "apollo-export"
    assert payload["rows"][0]["channel"] == "Email"


def test_batch_score_leads_accepts_space_separated_csv_headers_for_common_aliases(tmp_path: Path) -> None:
    project_dir = create_strategy_project(tmp_path)
    csv_path = tmp_path / "header-alias-leads.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["Full Name", "Company", "Job Title", "Profile URL", "Notes"],
        )
        writer.writeheader()
        writer.writerow(
            {
                "Full Name": "Dana Founder",
                "Company": "SignalOps",
                "Job Title": "Founder",
                "Profile URL": "https://example.com/signalops",
                "Notes": "Manual lead handling, website chatbot gap, and active AI automation evaluation.",
            }
        )

    result = marketing_agency.batch_score_leads(
        SimpleNamespace(
            project_dir=str(project_dir),
            csv=str(csv_path),
            source="partner-sheet",
            channel="LinkedIn",
            limit=0,
        )
    )

    assert result["ok"] is True
    imported_json = project_dir / "docs" / "leads" / "imported-leads.json"
    scorecards_json = project_dir / "docs" / "leads" / "lead-scorecards.json"
    payload = marketing_agency.json.loads(imported_json.read_text(encoding="utf-8"))
    scorecards = marketing_agency.json.loads(scorecards_json.read_text(encoding="utf-8"))

    assert payload["rows"][0]["name"] == "Dana Founder"
    assert payload["rows"][0]["role"] == "Founder"
    assert payload["rows"][0]["url"] == "https://example.com/signalops"
    assert scorecards[0]["name"] == "Dana Founder"
    assert scorecards[0]["company"] == "SignalOps"


def test_batch_score_leads_accepts_contact_organization_and_lead_notes_aliases(tmp_path: Path) -> None:
    project_dir = create_strategy_project(tmp_path)
    csv_path = tmp_path / "contact-org-leads.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["Contact Name", "Organization Name", "Title", "Website URL", "Lead Notes"],
        )
        writer.writeheader()
        writer.writerow(
            {
                "Contact Name": "Ada Operator",
                "Organization Name": "Acme Logistics",
                "Title": "COO",
                "Website URL": "https://example.com/acme-logistics",
                "Lead Notes": "Manual lead handling and website chatbot evaluation are both active this quarter.",
            }
        )

    result = marketing_agency.batch_score_leads(
        SimpleNamespace(
            project_dir=str(project_dir),
            csv=str(csv_path),
            source="partner-sheet",
            channel="Email",
            limit=0,
        )
    )

    assert result["ok"] is True
    imported_json = project_dir / "docs" / "leads" / "imported-leads.json"
    payload = marketing_agency.json.loads(imported_json.read_text(encoding="utf-8"))

    assert payload["rows"][0]["name"] == "Ada Operator"
    assert payload["rows"][0]["company"] == "Acme Logistics"
    assert payload["rows"][0]["role"] == "COO"
    assert payload["rows"][0]["url"] == "https://example.com/acme-logistics"
    assert payload["rows"][0]["text"].startswith("Manual lead handling")


def test_batch_draft_outreach_creates_review_drafts_for_matching_grades(tmp_path: Path) -> None:
    project_dir = create_strategy_project(tmp_path)
    csv_path = tmp_path / "leads.csv"
    write_sample_csv(csv_path)
    score_result = marketing_agency.batch_score_leads(
        SimpleNamespace(
            project_dir=str(project_dir),
            csv=str(csv_path),
            source="",
            channel="",
            limit=0,
        )
    )
    assert score_result["ok"] is True

    result = marketing_agency.batch_draft_outreach(
        SimpleNamespace(
            project_dir=str(project_dir),
            channel="email",
            tone="helpful",
            cta="Book a 15-minute workflow review",
            min_grade="hot",
            limit=0,
        )
    )

    assert result["ok"] is True
    assert result["createdCount"] == 1
    assert result["selectedCount"] == 1
    assert result["createdLeadIds"]

    drafts_json = project_dir / "docs" / "leads" / "outreach-drafts.json"
    assert drafts_json.exists()
    drafts = marketing_agency.json.loads(drafts_json.read_text(encoding="utf-8"))
    assert len(drafts) == 1
    assert drafts[0]["channel"] == "email"
    assert "Book a 15-minute workflow review" in drafts[0]["body"]



def test_batch_draft_outreach_respects_limit_and_skips_existing_channel_drafts(tmp_path: Path) -> None:
    project_dir = create_strategy_project(tmp_path)
    csv_path = tmp_path / "lead-list.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["name", "company", "role", "source", "channel", "text"])
        writer.writeheader()
        writer.writerow(
            {
                "name": "Avery Founder",
                "company": "Northfield One",
                "role": "Founder",
                "source": "apollo",
                "channel": "Website",
                "text": "Manual lead handling, website chatbot gap, and evaluating AI workflow automation now.",
            }
        )
        writer.writerow(
            {
                "name": "Riley Founder",
                "company": "Northfield Two",
                "role": "Founder",
                "source": "apollo",
                "channel": "Website",
                "text": "We need AI workflow automation for manual lead handling and want a website chatbot this quarter.",
            }
        )

    score_result = marketing_agency.batch_score_leads(
        SimpleNamespace(
            project_dir=str(project_dir),
            csv=str(csv_path),
            source="",
            channel="",
            limit=0,
        )
    )
    assert score_result["ok"] is True

    first_result = marketing_agency.batch_draft_outreach(
        SimpleNamespace(
            project_dir=str(project_dir),
            channel="linkedin",
            tone="",
            cta="",
            min_grade="hot",
            limit=1,
        )
    )
    assert first_result["ok"] is True
    assert first_result["createdCount"] == 1

    second_result = marketing_agency.batch_draft_outreach(
        SimpleNamespace(
            project_dir=str(project_dir),
            channel="linkedin",
            tone="",
            cta="",
            min_grade="hot",
            limit=10,
        )
    )
    assert second_result["ok"] is True
    assert second_result["createdCount"] == 1
    assert second_result["selectedCount"] == 1

    drafts_json = project_dir / "docs" / "leads" / "outreach-drafts.json"
    drafts = marketing_agency.json.loads(drafts_json.read_text(encoding="utf-8"))
    assert len(drafts) == 2
    assert all(draft["channel"] == "linkedin" for draft in drafts)


def test_batch_crm_export_groups_rows_by_track_and_requires_drafts_when_requested(tmp_path: Path) -> None:
    project_dir = create_strategy_project(tmp_path)
    csv_path = tmp_path / "leads.csv"
    write_sample_csv(csv_path)

    score_result = marketing_agency.batch_score_leads(
        SimpleNamespace(project_dir=str(project_dir), csv=str(csv_path), source="", channel="", limit=0)
    )
    assert score_result["ok"] is True

    draft_result = marketing_agency.batch_draft_outreach(
        SimpleNamespace(
            project_dir=str(project_dir),
            channel="email",
            tone="",
            cta="",
            min_grade="hot",
            limit=0,
        )
    )
    assert draft_result["ok"] is True
    assert draft_result["createdCount"] == 1

    export_result = marketing_agency.batch_crm_export(
        SimpleNamespace(
            project_dir=str(project_dir),
            owner="Jian",
            format="json",
            min_grade="hot",
            require_draft=True,
        )
    )

    assert export_result["ok"] is True
    assert export_result["leadCount"] == 1
    assert export_result["trackCounts"]["priority_outreach"] == 1

    export_json = project_dir / "docs" / "leads" / "crm-export-batch.json"
    payload = marketing_agency.json.loads(export_json.read_text(encoding="utf-8"))
    assert payload["trackCounts"]["priority_outreach"] == 1
    assert payload["tracks"][0]["track"] == "priority_outreach"
    assert payload["tracks"][0]["rows"][0]["owner"] == "Jian"
    assert payload["tracks"][0]["rows"][0]["outreach_channel"] == "email"



def test_batch_crm_export_csv_includes_track_column_and_warm_rows_without_drafts(tmp_path: Path) -> None:
    project_dir = create_strategy_project(tmp_path)
    csv_path = tmp_path / "warm-leads.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["name", "company", "role", "source", "channel", "text"])
        writer.writeheader()
        writer.writerow(
            {
                "name": "Taylor Coordinator",
                "company": "OpsCo",
                "role": "Coordinator",
                "source": "apollo",
                "channel": "Website",
                "text": "We still have manual lead handling and a website chatbot gap.",
            }
        )

    score_result = marketing_agency.batch_score_leads(
        SimpleNamespace(project_dir=str(project_dir), csv=str(csv_path), source="", channel="", limit=0)
    )
    assert score_result["ok"] is True

    export_result = marketing_agency.batch_crm_export(
        SimpleNamespace(
            project_dir=str(project_dir),
            owner="Ops Owner",
            format="csv",
            min_grade="warm",
            require_draft=False,
        )
    )

    assert export_result["ok"] is True
    assert export_result["leadCount"] == 1

    export_csv = project_dir / "docs" / "leads" / "crm-export-batch.csv"
    text = export_csv.read_text(encoding="utf-8")
    assert "track" in text.splitlines()[0]
    assert "active_nurture" in text
    assert "Ops Owner" in text



def test_approve_batch_actions_marks_selected_drafts_and_crm_rows_ready(tmp_path: Path) -> None:
    project_dir = create_strategy_project(tmp_path)
    csv_path = tmp_path / "leads.csv"
    write_sample_csv(csv_path)

    score_result = marketing_agency.batch_score_leads(
        SimpleNamespace(project_dir=str(project_dir), csv=str(csv_path), source="", channel="", limit=0)
    )
    assert score_result["ok"] is True

    draft_result = marketing_agency.batch_draft_outreach(
        SimpleNamespace(project_dir=str(project_dir), channel="email", tone="", cta="", min_grade="hot", limit=0)
    )
    assert draft_result["ok"] is True
    draft_id = draft_result["createdLeadIds"] and marketing_agency.json.loads(
        (project_dir / "docs" / "leads" / "outreach-drafts.json").read_text(encoding="utf-8")
    )[0]["id"]
    lead_id = draft_result["createdLeadIds"][0]

    result = marketing_agency.approve_batch_actions(
        SimpleNamespace(
            project_dir=str(project_dir),
            draft_ids=draft_id,
            lead_ids=lead_id,
            owner="Jian",
            approver="Jian",
            notes="Approved for operator import/send.",
            format="csv",
        )
    )

    assert result["ok"] is True
    assert result["approvedDraftCount"] == 1
    assert result["approvedLeadCount"] == 1
    assert result["approvalPackage"]["approvalStatus"] == "approved"
    assert result["approvalDecision"]["decision"] == "approved"

    package_json = project_dir / "docs" / "leads" / "approved-batch-actions.json"
    ready_drafts_json = project_dir / "docs" / "leads" / "ready-outreach-drafts.json"
    ready_crm_csv = project_dir / "docs" / "leads" / "ready-crm-import.csv"
    assert package_json.exists()
    assert ready_drafts_json.exists()
    assert ready_crm_csv.exists()

    drafts = marketing_agency.json.loads(ready_drafts_json.read_text(encoding="utf-8"))
    assert drafts[0]["approvalStatus"] == "approved"

    ready_csv_text = ready_crm_csv.read_text(encoding="utf-8")
    assert "approval_status" in ready_csv_text.splitlines()[0]
    assert "approved" in ready_csv_text

    state = marketing_agency.read_state(project_dir / marketing_agency.STATE_PATH)
    assert state["approvalPackages"][-1]["scope"] == "lead batch send/import"
    assert state["approvalDecisions"][-1]["decision"] == "approved"
    assert any(draft.get("approvalStatus") == "approved" for draft in state["outreachDrafts"])



def test_approve_batch_actions_can_infer_lead_selection_from_draft_ids(tmp_path: Path) -> None:
    project_dir = create_strategy_project(tmp_path)
    csv_path = tmp_path / "lead-list.csv"
    write_sample_csv(csv_path)

    score_result = marketing_agency.batch_score_leads(
        SimpleNamespace(project_dir=str(project_dir), csv=str(csv_path), source="", channel="", limit=0)
    )
    assert score_result["ok"] is True

    draft_result = marketing_agency.batch_draft_outreach(
        SimpleNamespace(project_dir=str(project_dir), channel="email", tone="", cta="", min_grade="hot", limit=0)
    )
    assert draft_result["ok"] is True

    drafts = marketing_agency.json.loads((project_dir / "docs" / "leads" / "outreach-drafts.json").read_text(encoding="utf-8"))
    draft_id = drafts[0]["id"]

    result = marketing_agency.approve_batch_actions(
        SimpleNamespace(
            project_dir=str(project_dir),
            draft_ids=draft_id,
            lead_ids="",
            owner="Jian",
            approver="Jian",
            notes="Approve linked lead rows too.",
            format="json",
        )
    )

    assert result["ok"] is True
    assert result["approvedDraftCount"] == 1
    assert result["approvedLeadCount"] == 1
    assert result["crmExport"]["rows"][0]["lead_id"] == drafts[0]["leadId"]



def test_approve_batch_actions_rejects_partial_invalid_ids(tmp_path: Path) -> None:
    project_dir = create_strategy_project(tmp_path)
    csv_path = tmp_path / "lead-list.csv"
    write_sample_csv(csv_path)

    score_result = marketing_agency.batch_score_leads(
        SimpleNamespace(project_dir=str(project_dir), csv=str(csv_path), source="", channel="", limit=0)
    )
    assert score_result["ok"] is True

    draft_result = marketing_agency.batch_draft_outreach(
        SimpleNamespace(project_dir=str(project_dir), channel="email", tone="", cta="", min_grade="hot", limit=0)
    )
    assert draft_result["ok"] is True

    drafts = marketing_agency.json.loads((project_dir / "docs" / "leads" / "outreach-drafts.json").read_text(encoding="utf-8"))
    valid_draft_id = drafts[0]["id"]
    valid_lead_id = drafts[0]["leadId"]

    result = marketing_agency.approve_batch_actions(
        SimpleNamespace(
            project_dir=str(project_dir),
            draft_ids=f"{valid_draft_id},missing-draft",
            lead_ids=f"{valid_lead_id},missing-lead",
            owner="Jian",
            approver="Jian",
            notes="Should fail on partial invalid IDs.",
            format="json",
        )
    )

    assert result["ok"] is False
    assert "missing-draft" in result["error"] or "missing-lead" in result["error"]
    state = marketing_agency.read_state(project_dir / marketing_agency.STATE_PATH)
    assert state.get("approvalPackages", []) == []



def test_prepare_integration_handoff_for_crm_keeps_approved_crm_rows(tmp_path: Path) -> None:
    project_dir = create_strategy_project(tmp_path)
    csv_path = tmp_path / "lead-list.csv"
    write_sample_csv(csv_path)

    score_result = marketing_agency.batch_score_leads(
        SimpleNamespace(project_dir=str(project_dir), csv=str(csv_path), source="", channel="", limit=0)
    )
    assert score_result["ok"] is True

    draft_result = marketing_agency.batch_draft_outreach(
        SimpleNamespace(project_dir=str(project_dir), channel="email", tone="", cta="", min_grade="hot", limit=0)
    )
    assert draft_result["ok"] is True

    drafts = marketing_agency.json.loads((project_dir / "docs" / "leads" / "outreach-drafts.json").read_text(encoding="utf-8"))
    approval_result = marketing_agency.approve_batch_actions(
        SimpleNamespace(
            project_dir=str(project_dir),
            draft_ids=drafts[0]["id"],
            lead_ids=drafts[0]["leadId"],
            owner="Jian",
            approver="Jian",
            notes="Approve for CRM import.",
            format="csv",
        )
    )
    assert approval_result["ok"] is True

    result = marketing_agency.prepare_integration_handoff(
        SimpleNamespace(
            project_dir=str(project_dir),
            package_id=approval_result["approvalPackage"]["id"],
            platform="crm",
            provider="Solo CRM",
            destination="owner queue",
            mode="import",
            force=False,
        )
    )

    assert result["ok"] is True
    items = result["integrationHandoff"]["items"]
    assert len(items) == 1
    assert items[0]["source"] == "crm-export-row"
    assert items[0]["recommendedAction"] == "Import or update CRM lead/task fields after approval."



def test_capture_execution_evidence_records_queue_item_title_for_approved_batch(tmp_path: Path) -> None:
    project_dir = create_strategy_project(tmp_path)
    csv_path = tmp_path / "lead-list.csv"
    write_sample_csv(csv_path)

    score_result = marketing_agency.batch_score_leads(
        SimpleNamespace(project_dir=str(project_dir), csv=str(csv_path), source="", channel="", limit=0)
    )
    assert score_result["ok"] is True

    draft_result = marketing_agency.batch_draft_outreach(
        SimpleNamespace(project_dir=str(project_dir), channel="email", tone="", cta="", min_grade="hot", limit=0)
    )
    assert draft_result["ok"] is True

    drafts = marketing_agency.json.loads((project_dir / "docs" / "leads" / "outreach-drafts.json").read_text(encoding="utf-8"))
    approval_result = marketing_agency.approve_batch_actions(
        SimpleNamespace(
            project_dir=str(project_dir),
            draft_ids=drafts[0]["id"],
            lead_ids=drafts[0]["leadId"],
            owner="Jian",
            approver="Jian",
            notes="Approve for evidence capture.",
            format="csv",
        )
    )
    assert approval_result["ok"] is True

    queue_item = approval_result["approvalPackage"]["publishingQueue"][0]
    result = marketing_agency.capture_execution_evidence(
        SimpleNamespace(
            project_dir=str(project_dir),
            item_id=queue_item["id"],
            platform="email",
            status="sent",
            url="https://mail.example/test-send",
            screenshot="screenshots/test-send.png",
            operator="ops team",
            notes="Sent after final review.",
        )
    )

    assert result["ok"] is True
    assert result["executionEvidence"]["itemTitle"] == queue_item["title"]
    evidence_json = project_dir / "docs" / "integrations" / "execution-evidence.json"
    payload = marketing_agency.json.loads(evidence_json.read_text(encoding="utf-8"))
    assert payload[-1]["itemTitle"] == queue_item["title"]



def test_prepare_integration_handoff_for_email_excludes_crm_rows(tmp_path: Path) -> None:
    project_dir = create_strategy_project(tmp_path)
    csv_path = tmp_path / "lead-list.csv"
    write_sample_csv(csv_path)

    score_result = marketing_agency.batch_score_leads(
        SimpleNamespace(project_dir=str(project_dir), csv=str(csv_path), source="", channel="", limit=0)
    )
    assert score_result["ok"] is True

    draft_result = marketing_agency.batch_draft_outreach(
        SimpleNamespace(project_dir=str(project_dir), channel="email", tone="", cta="", min_grade="hot", limit=0)
    )
    assert draft_result["ok"] is True

    drafts = marketing_agency.json.loads((project_dir / "docs" / "leads" / "outreach-drafts.json").read_text(encoding="utf-8"))
    approval_result = marketing_agency.approve_batch_actions(
        SimpleNamespace(
            project_dir=str(project_dir),
            draft_ids=drafts[0]["id"],
            lead_ids=drafts[0]["leadId"],
            owner="Jian",
            approver="Jian",
            notes="Approve for email handoff.",
            format="csv",
        )
    )
    assert approval_result["ok"] is True

    result = marketing_agency.prepare_integration_handoff(
        SimpleNamespace(
            project_dir=str(project_dir),
            package_id=approval_result["approvalPackage"]["id"],
            platform="email",
            provider="Brevo",
            destination="warm sequence",
            mode="draft",
            force=False,
        )
    )

    assert result["ok"] is True
    items = result["integrationHandoff"]["items"]
    assert len(items) == 1
    assert items[0]["source"] == "outreach-draft"



def test_create_monitor_query_and_schedule_monitor_write_state(tmp_path: Path) -> None:
    project_dir = create_strategy_project(tmp_path)

    query_result = marketing_agency.create_monitor_query(
        SimpleNamespace(
            project_dir=str(project_dir),
            name="Brand mention watch",
            type="brand",
            query='"Batch Score Brand" OR "AI automation audit"',
            channels="LinkedIn,X,Reddit",
            priority="high",
            notes="Track sales and reputation signals.",
        )
    )

    jobs_result = marketing_agency.schedule_monitor(
        SimpleNamespace(
            project_dir=str(project_dir),
            query_id="",
            cadence="weekly",
            owner="marketing ops",
            destination="weekly digest",
        )
    )

    summary_result = marketing_agency.status_summary(SimpleNamespace(project_dir=str(project_dir)))

    queries_md = Path(query_result["monitorQueriesPath"]).read_text(encoding="utf-8")
    jobs_md = Path(jobs_result["monitorJobsPath"]).read_text(encoding="utf-8")
    queries_json = marketing_agency.json.loads(Path(query_result["monitorQueriesJsonPath"]).read_text(encoding="utf-8"))
    state = marketing_agency.read_state(project_dir / marketing_agency.STATE_PATH)

    assert query_result["ok"] is True
    assert query_result["monitorQuery"]["id"] == "brand-mention-watch"
    assert any(item["id"] == "brand-mention-watch" for item in queries_json)
    assert "Monitor Queries" in queries_md
    assert "Track sales and reputation signals." in queries_md
    assert jobs_result["ok"] is True
    assert len(jobs_result["monitorJobs"]) == 1
    assert "Monitor Jobs" in jobs_md
    assert "no external scheduler is started" in jobs_md.lower()
    assert state["workflowState"] == "monitor_jobs_ready"
    assert state["lastMonitorJob"]["queryId"] == "brand-mention-watch"
    assert "Monitor jobs: `1` scheduled handoffs" in summary_result["summary"]



def test_record_monitor_alert_and_weekly_digest_summarize_monitoring(tmp_path: Path) -> None:
    project_dir = create_strategy_project(tmp_path)

    campaign_result = marketing_agency.create_campaign(
        SimpleNamespace(
            project_dir=str(project_dir),
            name="Reduce Loading Loss",
            objective="reduce loading losses by 5%",
            audience="aggregate operators",
            offer="AI automation audit",
            channels="LinkedIn,Email",
            duration="6 weeks",
            cta="Book an audit",
        )
    )
    assert campaign_result["ok"] is True

    competitor_result = marketing_agency.add_competitor(
        SimpleNamespace(
            project_dir=str(project_dir),
            name="MeasureMax",
            url="https://example.com/measuremax",
            category="analytics",
            positioning="Truck measurement dashboards for aggregates",
            strengths="Dashboards, reporting",
            weaknesses="Limited workflow automation",
            channels="Website,LinkedIn",
            notes="Competes on reporting depth.",
        )
    )
    assert competitor_result["ok"] is True

    track_result = marketing_agency.track_competitor(
        SimpleNamespace(
            project_dir=str(project_dir),
            competitor="measuremax",
            event_type="case study",
            summary="Published a new quarry case study emphasizing loading accuracy.",
            impact="high",
            channel="website",
            url="https://example.com/measuremax-case-study",
            tags="aggregates,case-study",
        )
    )
    assert track_result["ok"] is True

    score_result = marketing_agency.score_lead(
        SimpleNamespace(
            project_dir=str(project_dir),
            name="Jordan",
            company="North Ridge Aggregates",
            role="Procurement Manager",
            source="linkedin",
            channel="LinkedIn",
            url="https://linkedin.example/jordan",
            text="We are looking for truck volume measurement to reduce loading losses.",
        )
    )
    assert score_result["ok"] is True

    performance_result = marketing_agency.record_performance(
        SimpleNamespace(
            project_dir=str(project_dir),
            campaign="reduce-loading-loss",
            channel="LinkedIn",
            period="2026-W20",
            metrics="impressions=1000,engagements=80,clicks=35,leads=4",
            notes="Strong top-of-funnel interest.",
        )
    )
    assert performance_result["ok"] is True

    query_result = marketing_agency.create_monitor_query(
        SimpleNamespace(
            project_dir=str(project_dir),
            name="High intent lead watch",
            type="lead",
            query='"looking for truck volume measurement"',
            channels="LinkedIn",
            priority="medium",
            notes="Capture direct buying signals.",
        )
    )
    assert query_result["ok"] is True

    jobs_result = marketing_agency.schedule_monitor(
        SimpleNamespace(
            project_dir=str(project_dir),
            query_id="",
            cadence="weekly",
            owner="marketing ops",
            destination="weekly digest",
        )
    )
    assert jobs_result["ok"] is True

    alert_result = marketing_agency.record_monitor_alert(
        SimpleNamespace(
            project_dir=str(project_dir),
            query_id=query_result["monitorQuery"]["id"],
            title="Aggregate operator asks for vendor recommendations",
            summary="A procurement manager asked for truck volume measurement vendor recommendations.",
            severity="high",
            source="LinkedIn",
            url="https://linkedin.example/post/lead",
            tags="lead,aggregates,vendor",
        )
    )

    digest_result = marketing_agency.weekly_digest(
        SimpleNamespace(
            project_dir=str(project_dir),
            period="2026-W20",
            audience="founder and marketing team",
        )
    )

    summary_result = marketing_agency.status_summary(SimpleNamespace(project_dir=str(project_dir)))
    alerts_md = Path(alert_result["monitorAlertsPath"]).read_text(encoding="utf-8")
    digest_md = Path(digest_result["weeklyDigestPath"]).read_text(encoding="utf-8")
    state = marketing_agency.read_state(project_dir / marketing_agency.STATE_PATH)

    assert alert_result["ok"] is True
    assert alert_result["monitorAlert"]["severity"] == "high"
    assert alert_result["monitorAlert"]["queryName"] == "High intent lead watch"
    assert alert_result["monitorAlert"]["monitorType"] == "lead"
    assert "Score the signal with score-lead" in alerts_md
    assert digest_result["ok"] is True
    assert digest_result["weeklyDigest"]["alertSummary"]["high"] == 1
    assert digest_result["weeklyDigest"]["leadOpportunities"]
    assert digest_result["weeklyDigest"]["competitorMoves"]
    assert digest_result["weeklyDigest"]["performanceNotes"]
    assert "Weekly Marketing Digest" in digest_md
    assert "Aggregate operator asks for vendor recommendations" in digest_md
    assert "Lead Opportunities" in digest_md
    assert "Competitor Moves" in digest_md
    assert "Performance Notes" in digest_md
    assert state["workflowState"] == "weekly_digest_ready"
    assert state["lastWeeklyDigest"]["period"] == "2026-W20"
    assert "Weekly digest: `2026-W20` with `1` alerts" in summary_result["summary"]



def test_register_brand_and_brand_governance_create_workspace_artifacts(tmp_path: Path) -> None:
    project_dir = create_strategy_project(tmp_path / "brands")
    workspace_dir = tmp_path / "workspace"

    register_result = marketing_agency.register_brand(
        SimpleNamespace(
            workspace_dir=str(workspace_dir),
            project_dir=str(project_dir),
            owner="Jane",
            status="active",
            channels="LinkedIn,SEO blog,Email",
            permissions="draft_content,prepare_approval_package",
            approval_policy="Jane approval required before external action",
            notes="Industrial account.",
        )
    )

    governance_result = marketing_agency.brand_governance(
        SimpleNamespace(
            workspace_dir=str(workspace_dir),
            brand_id=register_result["brand"]["id"],
            channels="LinkedIn,YouTube demos",
            permissions="draft_content,capture_manual_evidence",
            approval_policy="Founder approval required before publishing.",
            notes="Refined channel defaults.",
        )
    )

    registry_md = Path(register_result["brandRegistryPath"]).read_text(encoding="utf-8")
    governance_md = Path(governance_result["brandGovernancePath"]).read_text(encoding="utf-8")
    registry_json = marketing_agency.json.loads(Path(register_result["brandRegistryJsonPath"]).read_text(encoding="utf-8"))
    governance_json = marketing_agency.json.loads(Path(governance_result["brandGovernanceJsonPath"]).read_text(encoding="utf-8"))
    workspace_state = marketing_agency.read_workspace_state(workspace_dir / marketing_agency.WORKSPACE_STATE_PATH)

    assert register_result["ok"] is True
    assert register_result["brand"]["id"] == "batch-score-brand"
    assert any(item["id"] == register_result["brand"]["id"] for item in registry_json)
    assert "Brand Registry" in registry_md
    assert "Industrial account." in registry_md
    assert governance_result["ok"] is True
    assert governance_result["governance"]["defaultChannels"] == ["LinkedIn", "YouTube demos"]
    assert any(item["id"] == governance_result["governance"]["id"] for item in governance_json)
    assert "Founder approval required before publishing." in governance_md
    assert workspace_state["workflowState"] == "brand_governance_ready"
    assert workspace_state["lastBrand"]["brand"] == "Batch Score Brand"



def test_portfolio_summary_and_cross_brand_digest_cover_registered_brands(tmp_path: Path) -> None:
    acme_dir = create_strategy_project(tmp_path / "brands" / "acme")
    beta_result = marketing_agency.create_strategy(
        SimpleNamespace(
            brand="Beta AI",
            business="AI workflow automation software for operations teams.",
            audience="operations leaders",
            goal="Book demos",
            offer="workflow automation platform",
            tone="practical",
            region="US",
            output_dir=str(tmp_path / "brands"),
            force=True,
        )
    )
    assert beta_result["ok"] is True
    beta_dir = Path(beta_result["projectDir"])
    workspace_dir = tmp_path / "workspace"

    campaign_result = marketing_agency.create_campaign(
        SimpleNamespace(
            project_dir=str(acme_dir),
            name="Reduce Loading Loss",
            objective="reduce loading losses by 5%",
            audience="aggregate operators",
            offer="AI automation audit",
            channels="LinkedIn,Email",
            duration="6 weeks",
            cta="Book an audit",
        )
    )
    assert campaign_result["ok"] is True

    signal_result = marketing_agency.define_lead_signals(
        SimpleNamespace(
            project_dir=str(acme_dir),
            signals="manual lead handling,website chatbot,partner package",
            channels="Email,LinkedIn,Website",
            negative_signals="student research",
        )
    )
    assert signal_result["ok"] is True

    score_result = marketing_agency.score_lead(
        SimpleNamespace(
            project_dir=str(acme_dir),
            name="Jordan",
            company="North Ridge Aggregates",
            role="Procurement Manager",
            source="linkedin",
            channel="LinkedIn",
            url="https://linkedin.example/jordan",
            text="We are looking for truck volume measurement to reduce loading losses.",
        )
    )
    assert score_result["ok"] is True

    performance_result = marketing_agency.record_performance(
        SimpleNamespace(
            project_dir=str(acme_dir),
            campaign="reduce-loading-loss",
            channel="LinkedIn",
            period="2026-W20",
            metrics="impressions=1000,engagements=80,clicks=35,leads=4",
            notes="Strong top-of-funnel interest.",
        )
    )
    assert performance_result["ok"] is True

    query_result = marketing_agency.create_monitor_query(
        SimpleNamespace(
            project_dir=str(acme_dir),
            name="Lead watch",
            type="lead",
            query='"looking for truck volume measurement"',
            channels="LinkedIn",
            priority="high",
            notes="Track live buying signals.",
        )
    )
    assert query_result["ok"] is True

    alert_result = marketing_agency.record_monitor_alert(
        SimpleNamespace(
            project_dir=str(acme_dir),
            query_id=query_result["monitorQuery"]["id"],
            title="Buyer asks for vendor recommendations",
            summary="Buyer asks for vendor recommendations.",
            severity="high",
            source="LinkedIn",
            url="https://linkedin.example/post/lead",
            tags="lead,vendor",
        )
    )
    assert alert_result["ok"] is True

    digest_result = marketing_agency.weekly_digest(
        SimpleNamespace(
            project_dir=str(acme_dir),
            period="2026-W20",
            audience="marketing team",
        )
    )
    assert digest_result["ok"] is True

    acme_register = marketing_agency.register_brand(
        SimpleNamespace(
            workspace_dir=str(workspace_dir),
            project_dir=str(acme_dir),
            owner="Jane",
            status="active",
            channels="",
            permissions="",
            approval_policy="",
            notes="Industrial account.",
        )
    )
    beta_register = marketing_agency.register_brand(
        SimpleNamespace(
            workspace_dir=str(workspace_dir),
            project_dir=str(beta_dir),
            owner="Max",
            status="active",
            channels="",
            permissions="",
            approval_policy="",
            notes="Automation account.",
        )
    )
    assert acme_register["ok"] is True
    assert beta_register["ok"] is True

    summary_result = marketing_agency.portfolio_summary(
        SimpleNamespace(
            workspace_dir=str(workspace_dir),
            period="2026-W20",
        )
    )
    digest_result = marketing_agency.cross_brand_digest(
        SimpleNamespace(
            workspace_dir=str(workspace_dir),
            period="2026-W20",
            audience="executive team",
        )
    )

    summary_md = Path(summary_result["portfolioSummaryPath"]).read_text(encoding="utf-8")
    digest_md = Path(digest_result["crossBrandDigestPath"]).read_text(encoding="utf-8")
    workspace_state = marketing_agency.read_workspace_state(workspace_dir / marketing_agency.WORKSPACE_STATE_PATH)

    assert summary_result["ok"] is True
    assert summary_result["portfolioSummary"]["totals"]["brands"] == 2
    assert summary_result["portfolioSummary"]["totals"]["campaigns"] == 1
    assert summary_result["portfolioSummary"]["totals"]["monitorAlerts"] == 1
    assert "Marketing Portfolio Summary" in summary_md
    assert "Batch Score Brand" in summary_md
    assert "Beta AI" in summary_md
    assert digest_result["ok"] is True
    assert digest_result["crossBrandDigest"]["brandCount"] == 2
    assert "Cross-Brand Marketing Digest" in digest_md
    assert "Buyer asks for vendor recommendations" in digest_md
    assert workspace_state["workflowState"] == "cross_brand_digest_ready"



def test_create_experiment_records_results_and_recommends_winner(tmp_path: Path) -> None:
    project_dir = create_strategy_project(tmp_path)

    campaign_result = marketing_agency.create_campaign(
        SimpleNamespace(
            project_dir=str(project_dir),
            name="Reduce Loading Loss",
            objective="reduce loading losses by 5%",
            audience="aggregate operators",
            offer="AI automation audit",
            channels="LinkedIn,Email",
            duration="6 weeks",
            cta="Book an audit",
        )
    )
    assert campaign_result["ok"] is True

    experiment_result = marketing_agency.create_experiment(
        SimpleNamespace(
            project_dir=str(project_dir),
            campaign="reduce-loading-loss",
            name="CTA test",
            hypothesis="ROI CTA will create more demo leads than technical CTA.",
            metric="lead_rate",
            channel="LinkedIn",
            variants="Technical CTA,ROI CTA",
            duration="2 weeks",
            owner="marketing ops",
        )
    )
    assert experiment_result["ok"] is True

    control_result = marketing_agency.record_experiment_result(
        SimpleNamespace(
            project_dir=str(project_dir),
            experiment_id=experiment_result["experiment"]["id"],
            variant="Technical CTA",
            metrics="impressions=1000,clicks=40,leads=2",
            notes="Control message.",
            status="complete",
        )
    )
    roi_result = marketing_agency.record_experiment_result(
        SimpleNamespace(
            project_dir=str(project_dir),
            experiment_id=experiment_result["experiment"]["id"],
            variant="ROI CTA",
            metrics="impressions=1000,clicks=55,leads=8",
            notes="ROI message.",
            status="complete",
        )
    )
    assert control_result["ok"] is True
    assert roi_result["ok"] is True

    report_result = marketing_agency.experiment_report(
        SimpleNamespace(
            project_dir=str(project_dir),
            experiment_id=experiment_result["experiment"]["id"],
            period="2026-W21",
        )
    )
    summary_result = marketing_agency.status_summary(SimpleNamespace(project_dir=str(project_dir)))

    plans_md = Path(experiment_result["experimentPlansPath"]).read_text(encoding="utf-8")
    plans_json = marketing_agency.json.loads(Path(experiment_result["experimentPlansJsonPath"]).read_text(encoding="utf-8"))
    results_json = marketing_agency.json.loads(Path(roi_result["experimentResultsJsonPath"]).read_text(encoding="utf-8"))
    report_md = Path(report_result["experimentReportPath"]).read_text(encoding="utf-8")
    report_json = marketing_agency.json.loads(Path(report_result["experimentReportJsonPath"]).read_text(encoding="utf-8"))
    state = marketing_agency.read_state(project_dir / marketing_agency.STATE_PATH)

    assert experiment_result["experiment"]["primaryMetric"] == "lead_rate"
    assert experiment_result["experiment"]["campaignSlug"] == "reduce-loading-loss"
    assert any(item["id"] == experiment_result["experiment"]["id"] for item in plans_json)
    assert "ROI CTA will create more demo leads" in plans_md
    assert len(results_json) == 2
    assert report_result["ok"] is True
    assert report_result["experimentReport"]["winner"]["variant"] == "ROI CTA"
    assert report_result["experimentReport"]["confidence"] == "directional_winner"
    assert report_json["winner"]["variant"] == "ROI CTA"
    assert "Use ROI CTA as the next control" in report_md
    assert state["workflowState"] == "experiment_report_ready"
    assert "Experiment winner: `ROI CTA`" in summary_result["summary"]



def test_portfolio_experiment_history_rolls_up_registered_brand_reports(tmp_path: Path) -> None:
    acme_dir = create_strategy_project(tmp_path / "brands" / "acme")
    beta_result = marketing_agency.create_strategy(
        SimpleNamespace(
            brand="Beta AI",
            business="AI workflow automation software for operations teams.",
            audience="operations leaders",
            goal="Book demos",
            offer="workflow automation platform",
            tone="practical",
            region="US",
            output_dir=str(tmp_path / "brands"),
            force=True,
        )
    )
    assert beta_result["ok"] is True
    beta_dir = Path(beta_result["projectDir"])
    workspace_dir = tmp_path / "workspace"

    campaign_result = marketing_agency.create_campaign(
        SimpleNamespace(
            project_dir=str(acme_dir),
            name="Reduce Loading Loss",
            objective="reduce loading losses by 5%",
            audience="aggregate operators",
            offer="AI automation audit",
            channels="LinkedIn,Email",
            duration="6 weeks",
            cta="Book an audit",
        )
    )
    assert campaign_result["ok"] is True

    experiment_result = marketing_agency.create_experiment(
        SimpleNamespace(
            project_dir=str(acme_dir),
            campaign="reduce-loading-loss",
            name="Hook test",
            hypothesis="Problem-led hook improves CTR.",
            metric="ctr",
            channel="LinkedIn",
            variants="Feature hook,Problem hook",
            duration="2 weeks",
            owner="marketing ops",
        )
    )
    assert experiment_result["ok"] is True

    feature_result = marketing_agency.record_experiment_result(
        SimpleNamespace(
            project_dir=str(acme_dir),
            experiment_id=experiment_result["experiment"]["id"],
            variant="Feature hook",
            metrics="impressions=1000,clicks=20",
            notes="Baseline variant.",
            status="complete",
        )
    )
    problem_result = marketing_agency.record_experiment_result(
        SimpleNamespace(
            project_dir=str(acme_dir),
            experiment_id=experiment_result["experiment"]["id"],
            variant="Problem hook",
            metrics="impressions=1000,clicks=50",
            notes="Problem-first variant.",
            status="complete",
        )
    )
    assert feature_result["ok"] is True
    assert problem_result["ok"] is True

    report_result = marketing_agency.experiment_report(
        SimpleNamespace(
            project_dir=str(acme_dir),
            experiment_id=experiment_result["experiment"]["id"],
            period="2026-W21",
        )
    )
    assert report_result["ok"] is True

    acme_register = marketing_agency.register_brand(
        SimpleNamespace(
            workspace_dir=str(workspace_dir),
            project_dir=str(acme_dir),
            owner="Jane",
            status="active",
            channels="",
            permissions="",
            approval_policy="",
            notes="Industrial account.",
        )
    )
    beta_register = marketing_agency.register_brand(
        SimpleNamespace(
            workspace_dir=str(workspace_dir),
            project_dir=str(beta_dir),
            owner="Max",
            status="active",
            channels="",
            permissions="",
            approval_policy="",
            notes="Automation account.",
        )
    )
    assert acme_register["ok"] is True
    assert beta_register["ok"] is True

    history_result = marketing_agency.portfolio_experiment_history(
        SimpleNamespace(
            workspace_dir=str(workspace_dir),
            period="2026-W21",
        )
    )

    history_md = Path(history_result["experimentHistoryPath"]).read_text(encoding="utf-8")
    history_json = marketing_agency.json.loads(Path(history_result["experimentHistoryJsonPath"]).read_text(encoding="utf-8"))
    workspace_state = marketing_agency.read_workspace_state(workspace_dir / marketing_agency.WORKSPACE_STATE_PATH)

    assert history_result["ok"] is True
    assert history_result["experimentHistory"]["brandCount"] == 2
    assert history_result["experimentHistory"]["experimentCount"] == 1
    assert history_result["experimentHistory"]["reportCount"] == 1
    assert history_json["reportCount"] == 1
    assert any(item.get("brand") == "Beta AI" for item in history_json.get("brands", []))
    assert "Portfolio Experiment History" in history_md
    assert "Problem hook" in history_md
    assert "Create the first campaign experiment for Beta AI." in history_md
    assert workspace_state["workflowState"] == "experiment_history_ready"



def test_create_budget_plan_record_spend_and_budget_report(tmp_path: Path) -> None:
    project_dir = create_strategy_project(tmp_path)

    campaign_result = marketing_agency.create_campaign(
        SimpleNamespace(
            project_dir=str(project_dir),
            name="Reduce Loading Loss",
            objective="reduce loading losses by 5%",
            audience="aggregate operators",
            offer="AI automation audit",
            channels="LinkedIn,SEO blog,Email",
            duration="6 weeks",
            cta="Book an audit",
        )
    )
    assert campaign_result["ok"] is True

    plan_result = marketing_agency.create_budget_plan(
        SimpleNamespace(
            project_dir=str(project_dir),
            campaign="reduce-loading-loss",
            name="Q2 demand budget",
            budget=3000,
            period="2026-Q2",
            channels="LinkedIn,SEO blog,Email",
            owner="marketing ops",
            goal="Generate qualified demo requests",
        )
    )
    assert plan_result["ok"] is True

    linkedin_spend = marketing_agency.record_spend(
        SimpleNamespace(
            project_dir=str(project_dir),
            plan_id=plan_result["budgetPlan"]["id"],
            channel="LinkedIn",
            period="2026-W21",
            metrics="spend=1000,revenue=2400,leads=8,conversions=2,impressions=10000,clicks=250",
            notes="Paid LinkedIn campaign.",
        )
    )
    seo_spend = marketing_agency.record_spend(
        SimpleNamespace(
            project_dir=str(project_dir),
            plan_id=plan_result["budgetPlan"]["id"],
            channel="SEO blog",
            period="2026-W21",
            metrics="spend=500,revenue=900,leads=6,conversions=1,impressions=5000,clicks=200",
            notes="Organic content support.",
        )
    )
    assert linkedin_spend["ok"] is True
    assert seo_spend["ok"] is True

    report_result = marketing_agency.budget_report(
        SimpleNamespace(
            project_dir=str(project_dir),
            plan_id=plan_result["budgetPlan"]["id"],
            period="2026-Q2",
        )
    )
    summary_result = marketing_agency.status_summary(SimpleNamespace(project_dir=str(project_dir)))

    plan_md = Path(plan_result["budgetPlansPath"]).read_text(encoding="utf-8")
    plan_json = marketing_agency.json.loads(Path(plan_result["budgetPlansJsonPath"]).read_text(encoding="utf-8"))
    spend_json = marketing_agency.json.loads(Path(seo_spend["spendSnapshotsJsonPath"]).read_text(encoding="utf-8"))
    report_md = Path(report_result["budgetReportPath"]).read_text(encoding="utf-8")
    report_json = marketing_agency.json.loads(Path(report_result["budgetReportJsonPath"]).read_text(encoding="utf-8"))
    state = marketing_agency.read_state(project_dir / marketing_agency.STATE_PATH)

    assert plan_result["budgetPlan"]["totalBudget"] == 3000.0
    assert plan_result["budgetPlan"]["campaignSlug"] == "reduce-loading-loss"
    assert len(plan_result["budgetPlan"]["allocations"]) == 3
    assert any(item["id"] == plan_result["budgetPlan"]["id"] for item in plan_json)
    assert "Q2 demand budget" in plan_md
    assert len(spend_json) == 2
    assert report_result["ok"] is True
    assert report_result["budgetReport"]["totalSpend"] == 1500.0
    assert report_result["budgetReport"]["remainingBudget"] == 1500.0
    assert report_result["budgetReport"]["totals"]["derivedMetrics"]["roi"] == 1.2
    assert report_json["totals"]["derivedMetrics"]["roi"] == 1.2
    assert "Cost per lead" in report_md
    assert "Best ROI channel so far" in report_md
    assert state["workflowState"] == "budget_report_ready"
    assert "Budget report: spend `1500.00`, ROI `120.0%`" in summary_result["summary"]



def test_budget_report_filters_snapshots_to_requested_period(tmp_path: Path) -> None:
    project_dir = create_strategy_project(tmp_path)

    campaign_result = marketing_agency.create_campaign(
        SimpleNamespace(
            project_dir=str(project_dir),
            name="Reduce Loading Loss",
            objective="reduce loading losses by 5%",
            audience="aggregate operators",
            offer="AI automation audit",
            channels="LinkedIn,Email",
            duration="6 weeks",
            cta="Book an audit",
        )
    )
    assert campaign_result["ok"] is True

    plan_result = marketing_agency.create_budget_plan(
        SimpleNamespace(
            project_dir=str(project_dir),
            campaign="reduce-loading-loss",
            name="Quarterly demand budget",
            budget=3000,
            period="2026-Q2",
            channels="LinkedIn,Email",
            owner="marketing ops",
            goal="Generate qualified demo requests",
        )
    )
    assert plan_result["ok"] is True

    q2_spend = marketing_agency.record_spend(
        SimpleNamespace(
            project_dir=str(project_dir),
            plan_id=plan_result["budgetPlan"]["id"],
            channel="LinkedIn",
            period="2026-W21",
            metrics="spend=700,revenue=1400,leads=4,conversions=1",
            notes="Late Q2 paid demand.",
        )
    )
    q3_spend = marketing_agency.record_spend(
        SimpleNamespace(
            project_dir=str(project_dir),
            plan_id=plan_result["budgetPlan"]["id"],
            channel="Email",
            period="2026-W31",
            metrics="spend=500,revenue=600,leads=3,conversions=1",
            notes="Q3 nurture follow-up.",
        )
    )
    assert q2_spend["ok"] is True
    assert q3_spend["ok"] is True

    report_result = marketing_agency.budget_report(
        SimpleNamespace(
            project_dir=str(project_dir),
            plan_id=plan_result["budgetPlan"]["id"],
            period="2026-Q2",
        )
    )

    assert report_result["ok"] is True
    assert report_result["budgetReport"]["totalSpend"] == 700.0
    assert report_result["budgetReport"]["totals"]["snapshotCount"] == 1
    assert [item["channel"] for item in report_result["budgetReport"]["byChannel"]] == ["LinkedIn"]



def test_portfolio_budget_review_filters_to_matching_report_period(tmp_path: Path) -> None:
    acme_dir = create_strategy_project(tmp_path / "brands" / "acme")
    beta_result = marketing_agency.create_strategy(
        SimpleNamespace(
            brand="Beta AI",
            business="AI workflow automation software for operations teams.",
            audience="operations leaders",
            goal="Book demos",
            offer="workflow automation platform",
            tone="practical",
            region="US",
            output_dir=str(tmp_path / "brands"),
            force=True,
        )
    )
    assert beta_result["ok"] is True
    beta_dir = Path(beta_result["projectDir"])
    workspace_dir = tmp_path / "workspace"

    campaign_result = marketing_agency.create_campaign(
        SimpleNamespace(
            project_dir=str(acme_dir),
            name="Reduce Loading Loss",
            objective="reduce loading losses by 5%",
            audience="aggregate operators",
            offer="AI automation audit",
            channels="LinkedIn,Email",
            duration="6 weeks",
            cta="Book an audit",
        )
    )
    assert campaign_result["ok"] is True

    plan_result = marketing_agency.create_budget_plan(
        SimpleNamespace(
            project_dir=str(acme_dir),
            campaign="reduce-loading-loss",
            name="Q2 demand budget",
            budget=2000,
            period="2026-Q2",
            channels="LinkedIn,Email",
            owner="marketing ops",
            goal="Generate qualified demo requests",
        )
    )
    assert plan_result["ok"] is True

    q2_spend_result = marketing_agency.record_spend(
        SimpleNamespace(
            project_dir=str(acme_dir),
            plan_id=plan_result["budgetPlan"]["id"],
            channel="LinkedIn",
            period="2026-W21",
            metrics="spend=800,revenue=1600,leads=5,conversions=1",
            notes="Paid demand capture.",
        )
    )
    q3_spend_result = marketing_agency.record_spend(
        SimpleNamespace(
            project_dir=str(acme_dir),
            plan_id=plan_result["budgetPlan"]["id"],
            channel="Email",
            period="2026-W31",
            metrics="spend=400,revenue=200,leads=2,conversions=0",
            notes="Q3 follow-up spend.",
        )
    )
    assert q2_spend_result["ok"] is True
    assert q3_spend_result["ok"] is True

    q2_report_result = marketing_agency.budget_report(
        SimpleNamespace(
            project_dir=str(acme_dir),
            plan_id=plan_result["budgetPlan"]["id"],
            period="2026-Q2",
        )
    )
    q3_report_result = marketing_agency.budget_report(
        SimpleNamespace(
            project_dir=str(acme_dir),
            plan_id=plan_result["budgetPlan"]["id"],
            period="2026-Q3",
        )
    )
    assert q2_report_result["ok"] is True
    assert q3_report_result["ok"] is True

    acme_register = marketing_agency.register_brand(
        SimpleNamespace(
            workspace_dir=str(workspace_dir),
            project_dir=str(acme_dir),
            owner="Jane",
            status="active",
            channels="",
            permissions="",
            approval_policy="",
            notes="Industrial account.",
        )
    )
    beta_register = marketing_agency.register_brand(
        SimpleNamespace(
            workspace_dir=str(workspace_dir),
            project_dir=str(beta_dir),
            owner="Max",
            status="active",
            channels="",
            permissions="",
            approval_policy="",
            notes="Automation account.",
        )
    )
    assert acme_register["ok"] is True
    assert beta_register["ok"] is True

    review_result = marketing_agency.portfolio_budget_review(
        SimpleNamespace(
            workspace_dir=str(workspace_dir),
            period="2026-Q2",
        )
    )

    review_md = Path(review_result["budgetReviewPath"]).read_text(encoding="utf-8")
    review_json = marketing_agency.json.loads(Path(review_result["budgetReviewJsonPath"]).read_text(encoding="utf-8"))
    workspace_state = marketing_agency.read_workspace_state(workspace_dir / marketing_agency.WORKSPACE_STATE_PATH)
    acme_row = next(item for item in review_result["budgetReview"]["brands"] if item.get("brand") == "Batch Score Brand")

    assert review_result["ok"] is True
    assert acme_row["latestReport"]["period"] == "2026-Q2"
    assert acme_row["totalSpend"] == 800.0
    assert review_result["budgetReview"]["brandCount"] == 2
    assert review_result["budgetReview"]["totalBudget"] == 2000.0
    assert review_result["budgetReview"]["totalSpend"] == 800.0
    assert review_json["totalSpend"] == 800.0
    assert any(item.get("brand") == "Beta AI" for item in review_json.get("brands", []))
    assert "Portfolio Budget Review" in review_md
    assert "Batch Score Brand" in review_md
    assert "Create a budget plan for Beta AI." in review_md
    assert workspace_state["workflowState"] == "budget_review_ready"



def test_budget_report_treats_iso_week_14_as_q1_calendar_time(tmp_path: Path) -> None:
    project_dir = create_strategy_project(tmp_path)

    campaign_result = marketing_agency.create_campaign(
        SimpleNamespace(
            project_dir=str(project_dir),
            name="Reduce Loading Loss",
            objective="reduce loading losses by 5%",
            audience="aggregate operators",
            offer="AI automation audit",
            channels="LinkedIn,Email",
            duration="6 weeks",
            cta="Book an audit",
        )
    )
    assert campaign_result["ok"] is True

    plan_result = marketing_agency.create_budget_plan(
        SimpleNamespace(
            project_dir=str(project_dir),
            campaign="reduce-loading-loss",
            name="Q1 demand budget",
            budget=2500,
            period="2026-Q1",
            channels="LinkedIn,Email",
            owner="marketing ops",
            goal="Generate qualified demo requests",
        )
    )
    assert plan_result["ok"] is True

    week_14_spend = marketing_agency.record_spend(
        SimpleNamespace(
            project_dir=str(project_dir),
            plan_id=plan_result["budgetPlan"]["id"],
            channel="LinkedIn",
            period="2026-W14",
            metrics="spend=600,revenue=1200,leads=4,conversions=1",
            notes="ISO week 14 starts on March 30, still in Q1.",
        )
    )
    week_15_spend = marketing_agency.record_spend(
        SimpleNamespace(
            project_dir=str(project_dir),
            plan_id=plan_result["budgetPlan"]["id"],
            channel="Email",
            period="2026-W15",
            metrics="spend=300,revenue=200,leads=2,conversions=0",
            notes="Week 15 is fully in April and should count toward Q2.",
        )
    )
    assert week_14_spend["ok"] is True
    assert week_15_spend["ok"] is True

    q1_report = marketing_agency.budget_report(
        SimpleNamespace(
            project_dir=str(project_dir),
            plan_id=plan_result["budgetPlan"]["id"],
            period="2026-Q1",
        )
    )

    assert q1_report["ok"] is True
    assert q1_report["budgetReport"]["totalSpend"] == 600.0
    assert q1_report["budgetReport"]["totals"]["snapshotCount"] == 1
    assert [item["channel"] for item in q1_report["budgetReport"]["byChannel"]] == ["LinkedIn"]


def test_budget_report_treats_iso_week_1_as_prior_calendar_q4_when_it_starts_in_december(tmp_path: Path) -> None:
    project_dir = create_strategy_project(tmp_path)

    campaign_result = marketing_agency.create_campaign(
        SimpleNamespace(
            project_dir=str(project_dir),
            name="Year Boundary Demand Capture",
            objective="capture demand across year-end handoff",
            audience="aggregate operators",
            offer="AI automation audit",
            channels="LinkedIn,Email",
            duration="6 weeks",
            cta="Book an audit",
        )
    )
    assert campaign_result["ok"] is True

    plan_result = marketing_agency.create_budget_plan(
        SimpleNamespace(
            project_dir=str(project_dir),
            campaign="year-boundary-demand-capture",
            name="Q4 demand budget",
            budget=2500,
            period="2025-Q4",
            channels="LinkedIn,Email",
            owner="marketing ops",
            goal="Generate qualified demo requests",
        )
    )
    assert plan_result["ok"] is True

    week_1_spend = marketing_agency.record_spend(
        SimpleNamespace(
            project_dir=str(project_dir),
            plan_id=plan_result["budgetPlan"]["id"],
            channel="LinkedIn",
            period="2026-W01",
            metrics="spend=450,revenue=900,leads=3,conversions=1",
            notes="ISO week 1 of 2026 starts on 2025-12-29 and should count toward calendar Q4 2025.",
        )
    )
    week_2_spend = marketing_agency.record_spend(
        SimpleNamespace(
            project_dir=str(project_dir),
            plan_id=plan_result["budgetPlan"]["id"],
            channel="Email",
            period="2026-W02",
            metrics="spend=200,revenue=100,leads=1,conversions=0",
            notes="Week 2 is in January 2026 and should not count toward calendar Q4 2025.",
        )
    )
    assert week_1_spend["ok"] is True
    assert week_2_spend["ok"] is True

    q4_report = marketing_agency.budget_report(
        SimpleNamespace(
            project_dir=str(project_dir),
            plan_id=plan_result["budgetPlan"]["id"],
            period="2025-Q4",
        )
    )

    assert q4_report["ok"] is True
    assert q4_report["budgetReport"]["totalSpend"] == 450.0
    assert q4_report["budgetReport"]["totals"]["snapshotCount"] == 1
    assert [item["channel"] for item in q4_report["budgetReport"]["byChannel"]] == ["LinkedIn"]
