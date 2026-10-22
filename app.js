/* Resume maker — renders resumes/<id>.js data onto a single US Letter page.
   No build step, no framework. Works from GitHub Pages or by double-clicking index.html. */
(() => {
  'use strict';

  // ---------- registry ----------
  const registry = {};
  window.defineResume = (id, data) => { registry[id] = data; };

  const THEMES = window.RESUME_THEMES || {};
  const FONTS = window.RESUME_FONTS || {};
  const params = new URLSearchParams(location.search);
  const viewMode = params.has('view');        // ?view = clean link for recruiters (no editing UI, no drafts)
  const $ = (s) => document.querySelector(s);
  const sheet = $('#sheet');

  let manifest = { default: null, resumes: [] };
  let currentId = null;
  let resolved = null;
  let renderSeq = 0;

  // ---------- storage (drafts live in this browser only) ----------
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
  };
  const draftKey = (id) => 'resume:draft:' + id;
  const LOCAL_IDS = 'resume:local-ids';
  const getDraft = (id) => { if (viewMode) return null; try { return JSON.parse(store.get(draftKey(id)) || 'null'); } catch { return null; } };
  const setDraft = (id, data) => store.set(draftKey(id), JSON.stringify(data));
  const localIds = () => { try { return JSON.parse(store.get(LOCAL_IDS) || '[]'); } catch { return []; } };
  const addLocalId = (id) => { const ids = localIds(); if (!ids.includes(id)) store.set(LOCAL_IDS, JSON.stringify([...ids, id])); };
  const removeLocalId = (id) => store.set(LOCAL_IDS, JSON.stringify(localIds().filter((x) => x !== id)));
  const inManifest = (id) => manifest.resumes.includes(id);
  const allIds = () => [...new Set([...manifest.resumes.filter((id) => registry[id]), ...localIds().filter((id) => getDraft(id))])];

  // ---------- data resolution: "extends" = branch off a parent ----------
  const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
  function merge(base, over) {
    const out = { ...base };
    for (const k of Object.keys(over)) {
      if (k === 'extends') continue;
      out[k] = isObj(base[k]) && isObj(over[k]) ? merge(base[k], over[k]) : over[k]; // objects merge, arrays replace
    }
    return out;
  }
  const raw = (id) => getDraft(id) || registry[id] || null;
  function resolve(id, seen = new Set()) {
    if (seen.has(id)) throw new Error(`Circular "extends" involving "${id}".`);
    seen.add(id);
    const r = raw(id);
    if (!r) throw new Error(`Unknown resume "${id}". Is it listed in resumes/manifest.js and does the file call defineResume("${id}", …)?`);
    if (!r.extends) { const { extends: _x, ...rest } = r; return rest; }
    return merge(resolve(r.extends, seen), r);
  }
  const resolveSafe = (id) => { try { return resolve(id); } catch { return null; } };

  // ---------- helpers ----------
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*]+?)\*/g, '$1<em>$2</em>');
  const slug = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const safeName = (s) => String(s || 'Resume').trim().replace(/[^\w.-]+/g, '_');
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const dates = (a, b) => (a && b ? `${a} – ${b}` : a || b || '');
  const sepJoin = (arr) => arr.filter(Boolean).join('<span class="sep">|</span>');

  function toast(msg, ms = 3200) {
    const t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), ms);
  }
  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = () => rej(new Error('Failed to load ' + src));
      document.head.appendChild(s);
    });
  }

  // ---------- rendering ----------
  function render(d) {
    const L = { experience: 'Professional Experience', skills: 'Technical Skills & Competencies', education: 'Education', references: 'References', ...(d.labels || {}) };
    const hide = new Set((d.layout && d.layout.hide) || []);
    const c = d.contact || {};
    const web = typeof c.website === 'string' ? { url: c.website, label: c.website.replace(/^https?:\/\//, '') } : c.website;

    const contact = `
      <div class="row">${sepJoin([
        c.location && `<span class="r-loc">${esc(c.location)}</span>`,
        c.phone && `<a class="plain" href="tel:${esc(String(c.phone).replace(/[^\d+]/g, ''))}">${esc(c.phone)}</a>`,
        c.email && `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`,
        c.linkedin && `<a href="${esc(c.linkedin.url || c.linkedin)}">${esc(c.linkedin.label || 'LinkedIn')}</a>`,
      ])}</div>
      ${web && web.url ? `<div class="row web"><a href="${esc(web.url)}">${esc(web.label || web.url)}</a></div>` : ''}`;

    const list = (items) => (items && items.length ? `<ul class="bullets">${items.map((b) => `<li>${md(b)}</li>`).join('')}</ul>` : '');

    const jobs = (d.experience || []).map((j) => `
      <div class="job">
        <div class="job-head">
          <div><span class="job-company">${esc(j.company)}</span>${j.role ? `<span class="job-dot">•</span><span class="job-role">${esc(j.role)}</span>` : ''}</div>
          <div class="job-meta">${sepJoin([j.location && esc(j.location), esc(dates(j.start, j.end))])}</div>
        </div>
        ${j.blurb ? `<p class="job-blurb">${md(j.blurb)}</p>` : ''}
        ${list(j.bullets)}
      </div>`).join('');

    const skills = hide.has('skills') || !(d.skills || []).length ? '' : `
      <section>
        <h2 class="r-section-title">${esc(L.skills)}</h2>
        ${d.skills.map((g) => `
          <div class="skill-group">
            ${g.group ? `<p class="skill-label">${esc(g.group)}</p>` : ''}
            <div>${(g.items || []).map((i) => `<span class="tag">${esc(i)}</span>`).join('')}</div>
          </div>`).join('')}
      </section>`;

    const education = hide.has('education') || !(d.education || []).length ? '' : `
      <section>
        <h2 class="r-section-title">${esc(L.education)}</h2>
        ${d.education.map((e) => `
          <div class="edu">
            <div class="edu-top">
              <div><p class="edu-school">${esc(e.school)}</p><p class="edu-degree">${esc(e.degree)}</p></div>
              ${e.badge ? `<span class="edu-badge">${esc(e.badge)}</span>` : ''}
            </div>
            ${dates(e.start, e.end) ? `<p class="edu-dates">${esc(dates(e.start, e.end))}</p>` : ''}
          </div>`).join('')}
      </section>`;

    const r = d.references || {};
    const references = hide.has('references') || !((r.items || []).length || r.note) ? '' : `
      <section>
        <h2 class="r-section-title">${esc(L.references)}</h2>
        ${(r.items || []).length ? `<div class="refs">${r.items.map((p) => `
          <div class="ref">
            <p class="ref-name">${esc(p.name)}</p>
            ${p.role ? `<p class="ref-role">${esc(p.role)}</p>` : ''}
            ${p.phone ? `<p class="ref-phone">${esc(p.phone)}</p>` : ''}
            ${p.email ? `<p class="ref-role">${esc(p.email)}</p>` : ''}
          </div>`).join('')}</div>` : ''}
        ${r.note ? `<p class="ref-note">${md(r.note)}</p>` : ''}
      </section>`;

    const right = education + references;
    const bottom = skills || right
      ? `<div class="bottom${skills && right ? '' : ' single'}">${skills ? `<div>${skills}</div>` : ''}${right ? `<div class="col-right">${right}</div>` : ''}</div>`
      : '';

    return `
      <div class="topbar"></div>
      <header class="r-header">
        <div class="r-head-row">
          <div>
            <h1 class="r-name">${esc(d.name)}</h1>
            ${d.title ? `<p class="r-title">${esc(d.title)}</p>` : ''}
          </div>
          <div class="r-contact">${contact}</div>
        </div>
        ${d.summary && !hide.has('summary') ? `<p class="r-summary">${md(d.summary)}</p>` : ''}
      </header>
      <div class="r-main">
        <section>
          <h2 class="r-section-title">${esc(L.experience)}</h2>
          ${jobs}
        </section>
        ${bottom}
      </div>
      <div class="footbar"></div>`;
  }

  const fontOf = (d) => (d.layout && d.layout.font) || 'Inter';

  function applyTheme(d) {
    const base = typeof d.theme === 'string' ? THEMES[d.theme] : isObj(d.theme) ? d.theme : null;
    const tokens = { ...(THEMES.navy || {}), ...(base || {}), ...(d.colors || {}) };
    for (const k of ['primary', 'dark', 'light', 'border', 'accent', 'text', 'muted']) {
      if (tokens[k]) sheet.style.setProperty('--' + k, tokens[k]); else sheet.style.removeProperty('--' + k);
    }
    sheet.style.setProperty('--font', `'${fontOf(d).replace(/'/g, '')}'`);
  }

  const fontLinks = {};
  async function ensureFont(font) {
    if (FONTS[font] && !fontLinks[font]) {
      fontLinks[font] = new Promise((res) => {
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = `https://fonts.googleapis.com/css2?family=${FONTS[font]}&display=swap`;
        l.onload = l.onerror = () => res();
        document.head.appendChild(l);
      });
    }
    await fontLinks[font];
    try { await Promise.all(['400', '600', '700', '800'].map((w) => document.fonts.load(`${w} 13px "${font}"`))); } catch { /* offline */ }
    try { await document.fonts.ready; } catch { /* ignore */ }
  }

  // Shrink text a little at a time until the page fits (down to layout.minScale).
  function fit(d) {
    const lay = d.layout || {};
    const main = sheet.querySelector('.r-main');
    const over = () => main.scrollHeight - main.clientHeight > 1;
    let scale = clamp(Number(lay.scale) || 1, 0.7, 1.3);
    const min = clamp(Number(lay.minScale) || 0.88, 0.7, scale);
    sheet.style.setProperty('--scale', scale);
    if (lay.autoFit !== false) {
      while (over() && scale - 0.01 >= min - 1e-9) {
        scale = Math.round((scale - 0.01) * 100) / 100;
        sheet.style.setProperty('--scale', scale);
      }
    }
    return { scale, base: clamp(Number(lay.scale) || 1, 0.7, 1.3), overflow: over() };
  }

  function updateStatus(f) {
    const b = $('#fitStatus');
    if (f.overflow) { b.className = 'fit-badge bad'; b.textContent = 'Overflows page — trim content'; }
    else if (f.scale < f.base) { b.className = 'fit-badge warn'; b.textContent = `Fits (text at ${Math.round(f.scale * 100)}%)`; }
    else { b.className = 'fit-badge ok'; b.textContent = 'Fits on one page'; }
  }

  function fitPreview() {
    const avail = $('.preview').clientWidth - 24;
    const s = Math.min(1, avail / 816);
    sheet.style.transform = s < 1 ? `scale(${s})` : '';
    const wrap = $('#sheetWrap');
    wrap.style.width = 816 * s + 'px';
    wrap.style.height = 1056 * s + 'px';
  }

  function renderError(msg) {
    sheet.innerHTML = `<div class="r-error">${esc(msg)}</div>`;
    window.__resumeError = msg;
  }

  async function show(id) {
    const seq = ++renderSeq;
    try { resolved = resolve(id); } catch (e) { renderError(e.message); return false; }
    currentId = id;
    window.__resumeError = null;
    sheet.innerHTML = render(resolved);
    applyTheme(resolved);
    await ensureFont(fontOf(resolved));
    if (seq !== renderSeq) return true;
    const f = fit(resolved);
    const meta = resolved.meta || {};
    const pdfName = safeName(meta.pdfName || `${resolved.name || 'Resume'} Resume`);
    document.title = pdfName; // browsers use this as the default "Save as PDF" file name
    window.__resumeInfo = { id, pdfName, overflow: f.overflow, scale: f.scale };
    updateStatus(f);
    syncControls();
    fitPreview();
    updatePdfLink(pdfName);
    window.__resumeReady = true;
    return true;
  }

  // When hosted, the GitHub Action publishes pdf/<pdfName>.pdf for every committed resume.
  async function updatePdfLink(name) {
    const a = $('#pdfLink');
    a.hidden = true;
    if (!/^https?:$/.test(location.protocol) || getDraft(currentId)) return;
    const href = `pdf/${encodeURIComponent(name)}.pdf`;
    try {
      const r = await fetch(href, { method: 'HEAD', cache: 'no-store' });
      if (r.ok) { a.href = href; a.setAttribute('download', name + '.pdf'); a.hidden = false; }
    } catch { /* not built yet */ }
  }

  // ---------- controls ----------
  function syncControls() {
    const sel = $('#variantSelect');
    sel.innerHTML = allIds().map((id) => {
      const label = (resolveSafe(id)?.meta?.label) || id;
      const mark = !inManifest(id) ? ' (local)' : getDraft(id) ? ' ✎' : '';
      return `<option value="${esc(id)}">${esc(label + mark)}</option>`;
    }).join('');
    sel.value = currentId;

    const key = typeof resolved.theme === 'string' && THEMES[resolved.theme] ? resolved.theme : '';
    const ts = $('#themeSelect');
    ts.innerHTML = (key ? '' : '<option value="">Custom</option>') +
      Object.entries(THEMES).map(([k, t]) => `<option value="${esc(k)}">${esc(t.name || k)}</option>`).join('');
    ts.value = key;

    $('#draftBadge').hidden = !getDraft(currentId);
    $('#resetBtn').textContent = inManifest(currentId) ? 'Discard draft' : 'Delete local variant';
    $('#resetBtn').disabled = !getDraft(currentId);
  }

  const fileText = (id, data) => `defineResume(${JSON.stringify(id)}, ${JSON.stringify(data, null, 2)});\n`;

  function download(id) {
    const blob = new Blob([fileText(id, raw(id))], { type: 'text/javascript' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = id + '.js';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast(inManifest(id)
      ? `Saved ${id}.js — replace resumes/${id}.js and commit.`
      : `Saved ${id}.js — put it in resumes/ and add "${id}" to resumes/manifest.js.`, 6000);
  }

  function fillEditor() {
    $('#editorId').textContent = currentId;
    $('#editorText').value = JSON.stringify(raw(currentId), null, 2);
    $('#editorError').hidden = true;
  }
  function openEditor() { $('#editor').hidden = false; document.body.classList.add('editing'); fillEditor(); fitPreview(); }
  function closePanel(id) { $('#' + id).hidden = true; if (id === 'editor') { document.body.classList.remove('editing'); fitPreview(); } }

  async function switchTo(id) {
    const url = new URL(location.href);
    url.searchParams.set('r', id);
    history.replaceState(null, '', url);
    await show(id);
    if (!$('#editor').hidden) fillEditor();
  }

  function createVariant(id, data) {
    if (!inManifest(id)) addLocalId(id);
    setDraft(id, data);
    return switchTo(id);
  }

  // ---------- AI tailoring ----------
  function buildPrompt(company, job) {
    const id = slug(company) || 'tailored';
    const name = safeName(resolved.name || 'Resume');
    return `I'm tailoring my resume for a specific job. My resume is a JSON object that a static web app renders onto ONE US Letter page.

TASK
Tailor the resume below to the job description: retitle and rewrite the summary for this role, reorder and reword bullets so the most relevant work leads, mirror the posting's terminology where it truthfully applies, and choose the most relevant skills. Optionally pick a color theme that suits the company.

RULES
- Do not invent employers, titles, dates, degrees, metrics, certifications or tools that aren't already in the resume. Rephrase and re-emphasize only. If something the job wants seems missing, ask about it after the code block instead of adding it.
- It must still fit on one page: keep roughly the same total length (similar number and length of bullets).
- Use **double asterisks** for bold, sparingly (lead-in phrases, key figures).
- Themes: ${Object.keys(THEMES).join(', ')}. Or keep a theme and override any of these with "colors": {"primary","dark","light","border","accent","text","muted"} as hex values. Keep it professional and readable.
- Fonts ("layout": {"font": ...}): ${Object.keys(FONTS).join(', ')}.
- Merge rules: "extends" inherits everything from the parent. Any top-level key you include replaces the parent's value; objects merge key by key, arrays replace wholesale. Include only keys you change, plus "meta".

OUTPUT
One code block containing exactly one call, in this shape:
defineResume("${id}", {
  "extends": "${currentId}",
  "meta": { "label": "${company || 'Company'}", "company": "${company || ''}", "pdfName": "${name}_Resume_${safeName(company || 'Company')}" },
  ...changed keys...
});
The object must be valid JSON: double-quoted keys and strings, no comments, no trailing commas.
After the code block, list what you changed in a few bullets and any questions.

JOB DESCRIPTION
"""
${job.trim() || '[paste the job description here]'}
"""

CURRENT RESUME ("${currentId}", fully resolved)
${JSON.stringify(resolved, null, 2)}
`;
  }

  function extractObject(s, start) {
    let depth = 0, inStr = false, escNext = false;
    for (let i = start; i < s.length; i++) {
      const ch = s[i];
      if (inStr) { if (escNext) escNext = false; else if (ch === '\\') escNext = true; else if (ch === '"') inStr = false; continue; }
      if (ch === '"') inStr = true;
      else if (ch === '{') depth++;
      else if (ch === '}' && --depth === 0) return s.slice(start, i + 1);
    }
    return null;
  }

  function parseImport(text, fallbackId) {
    const m = text.match(/defineResume\(\s*["']([^"']+)["']\s*,/);
    const from = m ? m.index + m[0].length : 0;
    const b = text.indexOf('{', from);
    if (b < 0) throw new Error('Couldn\'t find a JSON object in that text.');
    const obj = extractObject(text, b);
    if (!obj) throw new Error('The JSON object looks cut off — make sure you pasted the whole thing.');
    let data;
    try { data = JSON.parse(obj); } catch (e) { throw new Error('That isn\'t valid JSON: ' + e.message); }
    if (!isObj(data)) throw new Error('Expected a JSON object.');
    return { id: slug(m ? m[1] : fallbackId) || 'tailored', data };
  }

  // ---------- wiring ----------
  function bind() {
    $('#variantSelect').addEventListener('change', (e) => switchTo(e.target.value));

    $('#themeSelect').addEventListener('change', (e) => {
      if (!e.target.value) return;
      const d = structuredClone(raw(currentId));
      d.theme = e.target.value;
      delete d.colors;
      setDraft(currentId, d);
      show(currentId).then(() => { if (!$('#editor').hidden) fillEditor(); });
    });

    $('#printBtn').addEventListener('click', () => window.print());
    $('#editBtn').addEventListener('click', () => ($('#editor').hidden ? openEditor() : closePanel('editor')));
    $('#aiBtn').addEventListener('click', () => { $('#aiModal').hidden = false; $('#aiError').hidden = true; });
    document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => closePanel(b.dataset.close)));
    $('#aiModal').addEventListener('click', (e) => { if (e.target.id === 'aiModal') closePanel('aiModal'); });

    let t;
    $('#editorText').addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(async () => {
        const err = $('#editorError');
        let data;
        try { data = JSON.parse($('#editorText').value); if (!isObj(data)) throw new Error('Top level must be an object { … }'); }
        catch (e) { err.textContent = 'Not applied — ' + e.message; err.hidden = false; return; }
        const prev = store.get(draftKey(currentId));
        setDraft(currentId, data);
        if (!(await show(currentId))) {   // e.g. bad "extends": roll back so the page stays usable
          const msg = window.__resumeError;
          if (prev) store.set(draftKey(currentId), prev); else store.del(draftKey(currentId));
          await show(currentId);
          err.textContent = 'Not applied — ' + msg; err.hidden = false; return;
        }
        err.hidden = true;
      }, 350);
    });

    $('#downloadBtn').addEventListener('click', () => download(currentId));

    $('#newVariantBtn').addEventListener('click', () => {
      const label = prompt('Name for the new variant (e.g. the company):');
      if (!label) return;
      let id = slug(label);
      if (!id) return;
      if (allIds().includes(id) || registry[id]) id = `${id}-${Date.now().toString(36).slice(-4)}`;
      createVariant(id, {
        extends: currentId,
        meta: { label, company: label, pdfName: `${safeName(resolved.name)}_Resume_${safeName(label)}` },
      }).then(() => toast(`Created "${id}". It inherits everything from ${resolved.meta?.label || 'its parent'} — override what you want.`, 5000));
    });

    $('#resetBtn').addEventListener('click', async () => {
      if (inManifest(currentId)) {
        if (!confirm('Discard your draft and go back to the committed file?')) return;
        store.del(draftKey(currentId));
        await switchTo(currentId);
      } else {
        if (!confirm(`Delete the local variant "${currentId}"? Download it first if you want to keep it.`)) return;
        store.del(draftKey(currentId)); removeLocalId(currentId);
        await switchTo(manifest.default || allIds()[0]);
      }
    });

    $('#aiCopyBtn').addEventListener('click', async () => {
      const text = buildPrompt($('#aiCompany').value.trim(), $('#aiJob').value);
      const ta = $('#aiPrompt');
      ta.value = text;
      try { await navigator.clipboard.writeText(text); toast('Prompt copied — paste it into Claude.'); }
      catch { ta.hidden = false; ta.focus(); ta.select(); toast('Select-all and copy the prompt below.'); }
    });

    $('#aiImportBtn').addEventListener('click', async () => {
      const err = $('#aiError');
      try {
        const { id, data } = parseImport($('#aiOutput').value, $('#aiCompany').value);
        if (data.extends && !raw(data.extends)) throw new Error(`It extends "${data.extends}", which doesn't exist here.`);
        let finalId = id;
        if (registry[id] || getDraft(id)) {
          if (!confirm(`"${id}" already exists. Replace it with this version (as a draft)?`)) finalId = `${id}-${Date.now().toString(36).slice(-4)}`;
        }
        await createVariant(finalId, data);
        closePanel('aiModal');
        $('#aiOutput').value = '';
        toast(`Imported "${finalId}". Review it, then Print or Edit data → Download .js.`, 6000);
      } catch (e) { err.textContent = e.message; err.hidden = false; }
    });

    window.addEventListener('resize', fitPreview);
  }

  async function boot() {
    if (viewMode) document.body.classList.add('view-mode');
    try { await loadScript('resumes/manifest.js'); }
    catch { renderError('Could not load resumes/manifest.js'); return; }
    manifest = { ...manifest, ...(window.RESUME_MANIFEST || {}) };
    const loaded = await Promise.allSettled(manifest.resumes.map((id) => loadScript(`resumes/${id}.js`)));
    const failed = manifest.resumes.filter((_, i) => loaded[i].status === 'rejected');
    if (failed.length) toast('Missing files: ' + failed.map((f) => `resumes/${f}.js`).join(', '), 6000);

    bind();
    const ids = allIds();
    const want = params.get('r');
    const id = ids.includes(want) ? want : ids.includes(manifest.default) ? manifest.default : ids[0];
    if (!id) { renderError('No resumes found. Add one to resumes/ and list it in resumes/manifest.js.'); return; }
    await show(id);
    fitPreview();
  }

  boot();
})();
