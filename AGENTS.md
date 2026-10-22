# Instructions for AI assistants editing this repo

This is a static, no-build resume site. **Content lives only in `resumes/*.js`.** Don't edit `index.html`, `app.js` or `styles.css` to change wording or colors.

## Making a variant for a job
0. Save the posting first: copy `jobs/_template/` to `jobs/<company-slug>/` and paste the full job description into `posting.md` (fill the front matter). Read that posting when tailoring.
1. Create `resumes/<company-slug>.js`:
   ```js
   defineResume("<company-slug>", {
     "extends": "base",
     "meta": { "label": "Acme Corp", "company": "Acme Corp", "pdfName": "Jonathan_Randall_Resume_Acme" },
     "theme": "teal",
     "summary": "…",
     "experience": [ … ]
   });
   ```
2. Add `"<company-slug>"` to the `resumes` array in `resumes/manifest.js`.
3. The id in `defineResume(...)`, the filename, the manifest entry and the `jobs/` folder name must all match.

## Merge rules
- `"extends"` inherits everything from the parent variant (chains are allowed).
- Top-level keys you include replace the parent's. Objects (`meta`, `contact`, `layout`, `labels`, `colors`, `references`) merge key by key; **arrays replace wholesale** — to change one bullet, include that variant's whole `experience` array.
- Include only what changes. Keep the object valid JSON (double quotes, no comments, no trailing commas).

## Content rules
- Never invent employers, titles, dates, degrees, metrics, certifications or tools. Rephrase and re-emphasize what exists; ask about gaps.
- One US Letter page. The page auto-shrinks text down to `layout.minScale` (default 0.88); beyond that it overflows. Keep total length close to `base`. `node scripts/build-pdfs.mjs` warns on overflow.
- `**bold**` and `*italic*` work in summary, blurbs, bullets and the references note. Use bold sparingly.

## Schema (all optional except `name`)
- `meta`: `label` (dropdown name), `company`, `pdfName` (PDF filename, no extension)
- `theme`: one of the keys in `themes.js`; `colors`: override any of `primary, dark, light, border, accent, text, muted` (hex)
- `layout`: `font` (a key in `RESUME_FONTS`), `scale` (0.7–1.3), `autoFit` (bool), `minScale`, `hide` (any of `"summary","skills","education","references"`)
- `labels`: section headings `experience, skills, education, references`
- `name`, `title`, `summary`
- `contact`: `location, phone, email, website {label,url} | string, linkedin {label,url} | string`
- `experience[]`: `company, role, location, start, end, blurb, bullets[]`
- `skills[]`: `group, items[]`
- `education[]`: `school, degree, start, end, badge`
- `references`: `items[] {name, role, phone, email}`, `note`
