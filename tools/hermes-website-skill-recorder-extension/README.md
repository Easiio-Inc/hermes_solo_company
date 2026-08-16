# Hermes Website Skill Recorder Extension

Chrome Extension MVP for recording approved website workflows and converting them into Hermes-ready skill drafts.

## What it does

- records website actions in the active tab
- generates selector candidates for each action
- redacts sensitive values before export
- builds a markdown skill draft after approval
- exports a JSON bundle that can later be handed to Hermes or a publication workflow

## MVP status

This is a local review-first scaffold. It does **not** upload data to Hermes automatically yet.

## Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this folder: `tools/hermes-website-skill-recorder-extension`

## Files

- `manifest.json` — MV3 extension manifest
- `src/background/service-worker.js` — recording session state
- `src/content/recorder.js` — page event capture
- `src/panel/panel.html` — operator approval UI
- `src/shared/skill-builder.js` — redaction and skill-draft generation logic
- `tests/skill-builder.test.mjs` — node tests for core transformation logic

## Run tests

```bash
cd tools/hermes-website-skill-recorder-extension
npm test
```

## Notes

- This scaffold keeps recordings local in extension storage.
- Never use real secrets while demoing the extension.
- Review the exported markdown and JSON before sharing them with Hermes or another bot.
