# AGENTS.md

## Purpose
Free Japanese-first static web tool that estimates a BOSS compact pedal manufacture year/month and checks it against the model's known sales/availability period.

## Non-negotiable rules
- The only inputs are model and serial number.
- Do not add country, label, screw, adapter, IC, PCB, component date code, notes, photos, or other inputs.
- A successful result displays the estimated year/month and sales-period compatibility status.
- If the estimated date is outside the model period, explicitly display that the sales period and serial conflict.
- Distinguish an unknown model, invalid serial format, impossible date code, reserved O code, and future date code from a sales-period conflict.
- Never claim that a particular serial was definitely issued or that a pedal is counterfeit. The tool validates format, date code, and period compatibility only.
- Do not display confidence scores, detailed reasoning, candidate dates, component details, or marketplace search links.
- Keep a visible disclaimer that the result is an unofficial estimate and the site is not affiliated with Roland/BOSS.
- RETUNE WORKS attribution and X, Reverb, Instagram links stay in the footer and must be visually secondary.
- Do not place a large RETUNE WORKS logo or advertisement at the top.
- Keep the site static and deployable from docs/ on GitHub Pages.
- No paid APIs, databases, login, analytics, trackers, ads, or scraping.
- Process inputs only in the browser.

## Required checks
1. Run npm test.
2. Run npm run dev and check desktop/mobile.
3. Confirm only model and serial inputs exist.
4. Confirm a valid matching example shows date plus compatibility: BF-2 / 141100 → 1982年1月 / 整合性あり.
5. Confirm a valid-format conflicting example shows date plus warning: OD-1 / JG83100 → 1994年11月 / 整合性なし.
6. Confirm invalid model, invalid serial, reserved O, and future code produce input errors rather than compatibility warnings.
7. Test: 7100→1978-06, 141100→1982-01, 875683→1988-02, JG83100→1994-11, A0A0000→2010-11, A0P0000→2022-07.

## Development and release workflow
Follow this sequence for the official deployment workflow:

1. Update the local `main` branch to the latest `origin/main`.
2. Do not commit or push directly to `main`; create a working branch whose name starts with `agent/`.
3. Review the existing specification and tests, then make the requested changes without breaking existing BOSS manufacture-date results or sales-period and serial compatibility checks.
4. Run `npm test`.
5. Run `npm run generate-pages`.
6. Confirm that `docs/` has no unintended differences. If required generated files changed intentionally, commit those generated files as well.
7. Commit the intended files and push the working branch to GitHub.
8. Create a Pull Request targeting `main`.
9. Confirm that the Pull Request's GitHub Actions `validate` check succeeds.
10. Only after `validate` succeeds, merge with the normal GitHub CLI command `gh pr merge --merge`.
11. Never use `--admin` or any other method to bypass `main` branch protection rules.
12. Confirm that the `Validate` workflow triggered on `main` succeeds.
13. Confirm that the GitHub Pages deployment succeeds.
14. Confirm that the published site responds with HTTP 200.
15. After all checks succeed, delete the unnecessary `agent/` working branch locally and remotely.
16. If any problem occurs, stop without forcing a merge or deployment and report the cause.

GitHub's Auto Merge feature is optional and is not required by this workflow.
