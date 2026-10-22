# Resume maker

A static, single-page resume site. Each company gets its own small data file that inherits from a base resume, so you can swap wording, colors and fonts per application and get a clean one-page PDF of each.

```
index.html  app.js  styles.css     the renderer (rarely touched)
themes.js                          color presets + fonts
resumes/manifest.js                list of committed variants
resumes/base.js                    your full resume
resumes/kimberly-clark.js          a variant: extends base, K-C blue
scripts/build-pdfs.mjs             renders every variant to PDF
.github/workflows/deploy.yml       builds PDFs + deploys on every push
AGENTS.md / CLAUDE.md              rules for AI editing this repo
jobs/<company>/posting.md          saved job posting + status (not published)
```

## Host it (GitHub Pages)
1. Create a repo and upload these files (keep the folder structure, including `.github/`).
2. **Settings → Pages → Source: GitHub Actions.**
3. Push to `main`. The Action builds the site plus `pdf/<pdfName>.pdf` for every variant, published at `https://<you>.github.io/<repo>/`.

Links:
- `…/?r=kimberly-clark` opens that variant in the editor.
- `…/?r=kimberly-clark&view` is a clean read-only view (no toolbar tools, just print/download) — safe to share.
- `…/pdf/Jonathan_Randall_Resume_Kimberly-Clark.pdf` is the built PDF.

Opening `index.html` by double-clicking also works locally (no server needed).

## Variants = branches, git = revisions
- **Branch:** a variant `"extends"` another and overrides only what's different. Change `base.js` and every variant picks it up, except the fields it overrides.
- **Revisions:** git history on each file. Tag a commit when you send an application (`git tag sent/kimberly-clark-2026-10`) to keep exactly what they received.
- **Drafts:** edits in the browser are saved in that browser only until you download the `.js` and commit it. The dropdown marks drafts with ✎ and browser-only variants with "(local)".

## Tailoring a resume
**In the browser (works from your phone):** *Tailor with AI* → enter the company, paste the job posting → *Copy prompt* → paste into Claude → paste Claude's whole reply back → *Import as variant*. Review it, then *Print / Save PDF*, or *Edit data → Download .js* to commit it.

**In the repo:** save the posting to `jobs/<company>/posting.md`, then point Claude Code (or any agent) at the repo and say "make a variant for this job: …". It follows `AGENTS.md`.

Theme dropdown changes are saved as a draft of the current variant. Fine-tune individual colors with `"colors": { "primary": "#…" }`.

## PDFs
- **Best:** the PDFs the Action builds (identical every time, real selectable text for applicant tracking systems).
- **Manual:** *Print / Save PDF* in desktop Chrome or Edge → Destination "Save as PDF", Margins "None", Background graphics on. The filename defaults to `meta.pdfName`. Mobile Safari's print-to-PDF ignores some of the page settings, so prefer the built PDF on a phone.
- **Locally:** `npm i -D playwright && npx playwright install chromium && node scripts/build-pdfs.mjs pdf`

The toolbar badge shows whether the page fits. It shrinks text to as little as 88% before flagging an overflow.

## Privacy
Free GitHub Pages requires a **public** repo, so your phone number and your references' phone numbers would be public. Options: use `"layout": { "hide": ["references"] }` (or keep only the note) in the hosted version, or host from a private repo on Cloudflare Pages / Netlify (both free; set the build command to the same steps as the workflow). The page sets `noindex` to keep it out of search results.
