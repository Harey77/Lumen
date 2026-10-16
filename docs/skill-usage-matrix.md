# Skill usage matrix

The audit used the skill listing exposed to Claude Code in this session. "Available" means the skill appeared in the session's skill list. Skills listed in the master prompt as `name` appear here as `anthropic-skills:name`.

| Skill | Availability | Intended use | Actual evidence | Status |
|---|---|---|---|---|
| anthropic-skills:docx | Available | Read the three source .docx files | Invoked. Its default reader (pandoc) was not installed, so text was extracted directly from `word/document.xml` with `unzip`. All three documents were read in full. | Used |
| claude-in-chrome (also listed: anthropic-skills:chrome-browser) | Available | Inspect the rendered app in real Chrome | `claude-in-chrome` was invoked. It inspected Today, the mode chooser and explainer steps 1, 4 and 6, and ran the three-miss adaptation story. It found: a blob-morph runtime exception, the recall highlight giving away the answer, invisible cell outline lines, and highlight not refocusing after simplification. All fixed. Window resize did not take effect (window maximized), so responsive checks moved to Playwright. | Used |
| playwright-cli (project skill) | Available | Browser automation | Not invoked. `@playwright/test` was used directly for 39 e2e tests and screenshot and measurement scripts. | Not used (alternative used) |
| anthropic-skills:built-in-browser | Available | Validate browser workflows | Not invoked. Chrome plus Playwright covered it. | Not applicable |
| anthropic-skills:computer-use | Available | Desktop UI interaction | Not invoked. All interaction ran inside the browser through Playwright and Chrome. | Not applicable |
| anthropic-skills:deep-research | Available | Research open questions | Not invoked. No unresolved question required it. Scientific citations are standard references and are flagged for human expert review. | Not used |
| anthropic-skills:docs | Available | Organize documentation | Not invoked. Docs were written as Markdown in `docs/` so both agents can read them in the repo. | Not used |
| anthropic-skills:google-workspace | Available | Only if materials live in Google Workspace | The source documents were local files in Downloads. | Not applicable |
| anthropic-skills:import-memory | Available | Prior project context | Not invoked. There was no prior Lumen context to import, and the brief warns against importing unrelated personal context. | Not applicable |
| anthropic-skills:morning | Available | Unclear fit | Not invoked. Its name suggests a daily-briefing workflow, which this build does not need. | Not applicable |
| anthropic-skills:pdf | Available | PDFs | No PDF was needed. | Not applicable |
| anthropic-skills:pptx | Available | Pitch deck | No deck was requested yet. | Not applicable (deferred) |
| anthropic-skills:skill-creator | Available | Project skills such as add-explainer | Not invoked. The Tech Stack doc lists six project skills. Deferred until a second explainer exists to generalize from. | Deferred |
| anthropic-skills:xlsx | Available | Test matrices | The test matrix is Markdown in `docs/test-matrix.md`, and no spreadsheet is needed. | Not applicable |
| cowork-plugin-management:cowork-plugin-customizer | Available (full name resolved from the session listing) | Plugin customization | Not needed for this build. | Not applicable |
| cowork-plugin-management:create-cowork-plugin | Available (full name resolved from the session listing) | Package a lumen-dev plugin | The Tech Stack doc proposes a `lumen-dev` plugin. Deferred. | Deferred |
| data:analyze, build-dashboard, create-viz, data-context-extractor, data-visualization, explore-data, sql-queries, statistical-analysis, validate-data, write-query | Listed in the session (the brief reported them as locked; their lock state was not tested) | Data work | No dataset exists. Pilot metrics in the PRD need real cohorts. No dataset was invented to justify these. | Not applicable |
| Antigravity | External tool | Independent verification | Not run from this session. The review brief is in `docs/antigravity-review.md`. | Blocked (outside this environment) |
