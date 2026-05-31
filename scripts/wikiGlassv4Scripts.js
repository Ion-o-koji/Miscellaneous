
    // ── State ──────────────────────────────────────────────────────
    const state = {
      lang: 'en',
      history: [],
      currentTitle: null,
      searchDebounce: null,
    };

    // ── Quick links by language ────────────────────────────────────
    const quickLinks = {
      en: ['Philosophy', 'Quantum mechanics', 'Renaissance', 'Black holes', 'Evolution', 'Ancient Rome', 'Artificial intelligence', 'Jazz music'],
      es: ['Filosofía', 'Mecánica cuántica', 'Renacimiento', 'Agujeros negros', 'Evolución', 'Roma antigua', 'Inteligencia artificial', 'Música jazz'],
    };

    // ── Init ───────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
      renderQuickLinks();
      setupHomeSearch();
      setupHeaderSearch();
    });

    // ── Language ───────────────────────────────────────────────────
    function setLang(lang) {
      state.lang = lang;
      document.getElementById('lang-en').classList.toggle('active', lang === 'en');
      document.getElementById('lang-es').classList.toggle('active', lang === 'es');
      renderQuickLinks();

      // Update placeholder
      const placeholder = lang === 'es' ? 'Buscar en Wikipedia…' : 'Search any topic…';
      document.getElementById('home-search').placeholder = placeholder;
      if (document.getElementById('header-search'))
        document.getElementById('header-search').placeholder = lang === 'es' ? 'Buscar…' : 'Search Wikipedia…';
    }

    // ── Quick Links ────────────────────────────────────────────────
    function renderQuickLinks() {
      const wrap = document.getElementById('quick-links');
      wrap.innerHTML = quickLinks[state.lang].map(t =>
        `<button class="quick-chip" onclick="loadArticle('${t.replace(/'/g,"\\'")}')">
      ${t}
    </button>`
      ).join('');
    }

    // ── Search Setup ───────────────────────────────────────────────
    function setupHomeSearch() {
      const input = document.getElementById('home-search');
      const clearBtn = document.getElementById('home-clear');
      const dropdown = document.getElementById('home-dropdown');

      input.addEventListener('input', () => {
        const q = input.value.trim();
        clearBtn.classList.toggle('visible', q.length > 0);
        if (!q) {
          closeDropdown(dropdown);
          return;
        }
        clearTimeout(state.searchDebounce);
        state.searchDebounce = setTimeout(() => doSearch(q, dropdown), 280);
      });

      input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && input.value.trim()) {
          const first = dropdown.querySelector('.search-result');
          if (first) first.click();
        }
        if (e.key === 'Escape') {
          clearHomeSearch();
          closeDropdown(dropdown);
        }
      });

      document.addEventListener('click', e => {
        if (!e.target.closest('.home-search-wrap')) closeDropdown(dropdown);
      });
    }

    function setupHeaderSearch() {
      const input = document.getElementById('header-search');
      const clearBtn = document.getElementById('header-clear');
      const dropdown = document.getElementById('header-dropdown');

      input.addEventListener('input', () => {
        const q = input.value.trim();
        clearBtn.classList.toggle('visible', q.length > 0);
        if (!q) {
          closeDropdown(dropdown);
          return;
        }
        clearTimeout(state.searchDebounce);
        state.searchDebounce = setTimeout(() => doSearch(q, dropdown), 280);
      });

      input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && input.value.trim()) {
          const first = dropdown.querySelector('.search-result');
          if (first) first.click();
        }
        if (e.key === 'Escape') {
          clearHeaderSearch();
          closeDropdown(dropdown);
        }
      });

      document.addEventListener('click', e => {
        if (!e.target.closest('.search-wrap')) closeDropdown(dropdown);
      });
    }

    function clearHomeSearch() {
      document.getElementById('home-search').value = '';
      document.getElementById('home-clear').classList.remove('visible');
      closeDropdown(document.getElementById('home-dropdown'));
    }

    function clearHeaderSearch() {
      document.getElementById('header-search').value = '';
      document.getElementById('header-clear').classList.remove('visible');
      closeDropdown(document.getElementById('header-dropdown'));
    }

    function closeDropdown(el) {
      el.classList.remove('open');
      el.innerHTML = '';
    }

    // ── Wikipedia Search API ───────────────────────────────────────
    async function doSearch(query, dropdownEl) {
      try {
        const url = `https://${state.lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=7&format=json&origin=*`;
        const res = await fetch(url);
        const [, titles, descs] = await res.json();
        renderDropdown(titles, descs, dropdownEl);
      } catch {
        closeDropdown(dropdownEl);
      }
    }

    function renderDropdown(titles, descs, dropdownEl) {
      if (!titles.length) {
        closeDropdown(dropdownEl);
        return;
      }
      dropdownEl.innerHTML = titles.map((title, i) => `
    <div class="search-result" onclick="loadArticle('${title.replace(/'/g,"\\'")}')">
      <svg class="result-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <div>
        <div class="result-title">${title}</div>
        ${descs[i] ? `<div class="result-desc">${descs[i]}</div>` : ''}
      </div>
    </div>
  `).join('');
      dropdownEl.classList.add('open');
    }

    // ── Article Loading ────────────────────────────────────────────
    async function loadArticle(title) {
      // Push to history
      if (state.currentTitle) state.history.push(state.currentTitle);

      state.currentTitle = title;
      clearHomeSearch();
      clearHeaderSearch();
      showReader();

      // Show spinner
      document.getElementById('article-content').innerHTML = `
    <div class="spinner-wrap">
      <div class="spinner"></div>
      <div class="spinner-label">Loading "${title}"…</div>
    </div>`;

      // Update breadcrumb & open-wiki link
      document.getElementById('breadcrumb').innerHTML =
        `<span>Wikipedia</span> <span>›</span> <span style="color:rgba(255,255,255,0.7)">${title}</span>`;

      try {
        const url = `https://${state.lang}.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json&origin=*&redirects=1`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.error || !data.parse) {
          showArticleError(title);
          return;
        }

        const html = data.parse.text['*'];
        const cleanedTitle = data.parse.title;
        state.currentTitle = cleanedTitle;

        renderArticle(cleanedTitle, html);
        buildTOC();
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });

      } catch (e) {
        showArticleError(title);
      }
    }

    function showReader() {
      document.getElementById('home').classList.add('hidden');
      document.getElementById('reader').classList.add('visible');
      document.getElementById('header-search-wrap').style.display = 'flex';
      document.getElementById('back-btn').style.display = 'flex';
      document.getElementById('pdf-btn').style.display = 'flex';
    }

    function goHome() {
      document.getElementById('home').classList.remove('hidden');
      document.getElementById('reader').classList.remove('visible');
      document.getElementById('header-search-wrap').style.display = 'none';
      document.getElementById('back-btn').style.display = 'none';
      document.getElementById('pdf-btn').style.display = 'none';
      state.currentTitle = null;
      state.history = [];
    }

    function goBack() {
      if (state.history.length) {
        const prev = state.history.pop();
        state.currentTitle = null;
        loadArticle(prev);
        state.history.pop(); // loadArticle pushes, remove duplicate
      } else {
        goHome();
      }
    }

    function openOriginal() {
      if (state.currentTitle) {
        window.open(`https://${state.lang}.wikipedia.org/wiki/${encodeURIComponent(state.currentTitle)}`, '_blank');
      }
    }

    // ── Render Article ─────────────────────────────────────────────
    function renderArticle(title, html) {
      const container = document.getElementById('article-content');

      // Parse and clean
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const body = doc.body;

      // Remove unwanted elements
      const removeSelectors = [
        '.mw-editsection', '.ambox', '.tmbox', '.cmbox', '.ombox', '.fmbox', '.imbox',
        '#toc', '.toc', '.navbox', '.navbox-styles', '.sistersitebox',
        '.mw-empty-elt', 'style', '.noprint', '.metadata',
        '.mbox-small', '.succession-box', '.wikitable.geography',
        '[style*="display:none"]', '.mw-references-wrap > h2',
      ];
      removeSelectors.forEach(sel => body.querySelectorAll(sel).forEach(el => el.remove()));

      // Fix image URLs
      body.querySelectorAll('img').forEach(img => {
        ['src', 'data-src'].forEach(attr => {
          const v = img.getAttribute(attr);
          if (v && v.startsWith('//')) img.setAttribute(attr, 'https:' + v);
        });
        const srcset = img.getAttribute('srcset');
        if (srcset) img.setAttribute('srcset', srcset.replace(/\/\//g, 'https://'));
        img.removeAttribute('width');
        img.removeAttribute('height');
        img.setAttribute('loading', 'lazy');
      });

      // Fix internal wiki links
      body.querySelectorAll('a[href^="/wiki/"]').forEach(a => {
        const href = a.getAttribute('href');
        if (href.includes(':')) { // Special pages — open in Wikipedia
          a.setAttribute('href', `https://${state.lang}.wikipedia.org${href}`);
          a.setAttribute('target', '_blank');
          a.setAttribute('rel', 'noopener');
          return;
        }
        const wikiTitle = decodeURIComponent(href.replace('/wiki/', '').replace(/_/g, ' '));
        a.setAttribute('href', '#');
        a.setAttribute('data-wiki', wikiTitle);
        a.classList.add('wiki-link');
        a.addEventListener('click', e => {
          e.preventDefault();
          loadArticle(wikiTitle);
        });
      });

      // Fix external links
      body.querySelectorAll('a[href^="http"]').forEach(a => {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      });

      // Fix relative href links
      body.querySelectorAll('a[href^="//"]').forEach(a => {
        a.setAttribute('href', 'https:' + a.getAttribute('href'));
        a.setAttribute('target', '_blank');
      });

      // Badge showing language
      const langLabel = state.lang === 'es' ? '🇪🇸 Español' : '🇬🇧 English';
      const badge = `<span class="article-lang-badge" style="display:none;">${langLabel}</span>`;

      // H1 title
      const h1 = `<h1>${title}</h1>`;

      container.innerHTML = `${h1}${badge}${body.innerHTML}`;

      // Attach click handlers to any remaining wiki-link elements
      container.querySelectorAll('.wiki-link').forEach(a => {
        if (!a.dataset.attached) {
          a.dataset.attached = '1';
          a.addEventListener('click', e => {
            e.preventDefault();
            loadArticle(a.getAttribute('data-wiki'));
          });
        }
      });
    }

    // ── Table of Contents ──────────────────────────────────────────
    function buildTOC() {
      const content = document.getElementById('article-content');
      const headings = content.querySelectorAll('h2, h3');
      if (headings.length < 3) return; // Not worth showing TOC

      const layout = document.getElementById('reader-layout');
      layout.className = 'reader-with-toc';

      let tocHTML = '<div class="toc-panel"><div class="toc-title">Contents</div>';
      headings.forEach((h, i) => {
        const id = `section-${i}`;
        h.id = id;
        const isH3 = h.tagName === 'H3';
        const text = h.textContent.replace(/\[edit\]/g, '').trim();
        tocHTML += `<a class="toc-item${isH3 ? ' h3' : ''}" href="#${id}" onclick="scrollToSection('${id}',event)">${text}</a>`;
      });
      tocHTML += '</div>';

      // Wrap layout in toc grid
      const articleCard = layout.querySelector('.article-card');
      const controls = layout.querySelector('.article-controls');

      layout.innerHTML = '';
      const leftCol = document.createElement('div');
      leftCol.appendChild(controls);
      leftCol.appendChild(articleCard);
      layout.appendChild(leftCol);
      layout.insertAdjacentHTML('beforeend', tocHTML);
    }

    function scrollToSection(id, e) {
      e && e.preventDefault();
      const el = document.getElementById(id);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({
          top,
          behavior: 'smooth'
        });
      }
    }

    // ── Error State ────────────────────────────────────────────────
    function showArticleError(title) {
      document.getElementById('article-content').innerHTML = `
    <div class="error-card">
      <div class="error-title">Article not found</div>
      <div class="error-sub">
        Could not load "<strong>${title}</strong>" from Wikipedia.<br>
        Try searching for a slightly different term.
      </div>
    </div>`;
    }

    // ── PDF Download ───────────────────────────────────────────────
    async function downloadPDF() {
      if (!state.currentTitle) return;
      showToast('📄', 'Preparing PDF…');

      // Use print dialog for best formatting
      window.print();
      showToast('✓', 'PDF dialog opened');
    }

    // ── Toast ──────────────────────────────────────────────────────
    let toastTimer = null;

    function showToast(icon, msg) {
      const toast = document.getElementById('toast');
      document.getElementById('toast-icon').textContent = icon;
      document.getElementById('toast-msg').textContent = msg;
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
    }

    (() => {
      const ENTRY = 'WikiGlass v4',
        KEY = 'Ion-o-koji Watermark';
      const logs = (localStorage.getItem(KEY) || "").split('\n').map(line => line.replace(/^- /, '').trim()).filter(line => line && line !== ENTRY);
      logs.push(ENTRY);
      localStorage.setItem(KEY, logs.map(item => `- ${item}`).join('\n'));
    })();

  
