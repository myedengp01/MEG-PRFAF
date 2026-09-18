# MEG Universal Claim Management V1.0 — PRFAF release acceptance
Target UVN: `v2026.09.17-14:30`. Feature branch only; DO NOT MERGE OR DEPLOY until the acceptance gates pass.

## Verified source finding (2026-09-18)
`index.html` contains `<div id="app" style="display:none;">` and an existing toolbar link `<a class="dash-link" href="https://myedengp01.github.io/DB-MEG-FORMS/">← Dashboard</a>`. Therefore the earlier report that PRFAF has no Back to Dashboard control *in source* is incorrect; actual user visibility/navigation is **unverified** and may be affected by the hidden app/auth state, deployment mismatch, or device cache. Do not add a duplicate link before authenticated browser inspection. Rename to explicit `Back to Dashboard` only after checking the deployed screen and all relevant views.

## Universal six-form acceptance (SCF, OTCF, MTCF, TEC, TEC-V2, PRFAF)
- Authorized Admin Delete is visible on each applicable claim row/detail only to users with that form's server-side admin permission. It calls `meg_forms_admin_delete_claim` with a required reason, retains audit, refuses paid/ledger-linked claims, and does not bypass any form's existing owner/draft deletion rights. Test actual authenticated roles and never delete live claims as a test.
- `Claim Paid` is the action label; `Claim Paid`/`Pending Payment` are canonical statuses consistently displayed in Dashboard, Action Center, Approved Claims, Browse, details, and form views. An unavailable or hidden status is not interpreted as unpaid. Preserve existing approval/payment authority and SCF 60-day undo rule.
- Payment date is a separate business date from system confirmation timestamp. A manually editable payment date is **NOT IMPLEMENTED OR VERIFIED**. Before enabling edits, design a server-authorized correction RPC with old/new date, actor, timestamp, reason, and ledger reconciliation; verify existing schema and accounting rules first. No direct client-side table update or silent overwrite.
- `Back to Dashboard` is visible and navigates to the correct Dashboard URL in every form after login and in all relevant views, with mobile and desktop browser checks.
- Confirm UVN synchronized across index, version.json and caches, all six forms, real authenticated roles, isolated test records, PRFAF ledger and SCF 60-day boundary before merging any feature PR.

Current status: PRFAF dashboard link exists in source, **not confirmed in deployed UI**. All other universal PRFAF controls remain unverified/incomplete. VAPID parked.
