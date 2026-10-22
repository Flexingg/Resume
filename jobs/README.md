# Job postings

One folder per company/role, named to match the resume variant id in `resumes/` (e.g. `jobs/kimberly-clark/` ↔ `resumes/kimberly-clark.js`).

```
jobs/<company-slug>/
  posting.md        the job description + status/notes (copy _template/posting.md)
  *.pdf / *.png     optional: saved copy or screenshots of the original listing
```

Postings get taken down after they close, so save the full text when you apply. To apply to a second role at the same company, use `<company>-<role>` (e.g. `acme-reliability`).

This folder is **not** published to the website — the deploy workflow only copies the site files — but it is visible in the repo if the repo is public.
