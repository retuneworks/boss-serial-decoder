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
