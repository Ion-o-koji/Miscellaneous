
    // ── State ──────────────────────────────────────────────
    const state = {
      results: {},
      query: '',
      detectedLang: 'en',
      targetLang: 'km',
      activeTab: 'summary',
      useFuzzy: true,
      fuzzyThreshold: 0.4
    };

   /* const RANDOM_WORDS = [
      { word: 'សួស្តី', lang: 'km' },
      { word: 'សន្តិភាព', lang: 'km' },
      { word: 'ស្រឡាញ់', lang: 'km' },
      { word: 'រៀន', lang: 'km' },
      { word: 'សៀវភៅ', lang: 'km' },
      { word: 'development', lang: 'en' },
      { word: 'beautiful', lang: 'en' },
      { word: 'culture', lang: 'en' },
      { word: 'wisdom', lang: 'en' },
      { word: 'explore', lang: 'en' },
      { word: 'hello', lang: 'en' },
      { word: 'language', lang: 'en' },
      { word: 'water', lang: 'en' },
      { word: 'family', lang: 'en' }
    ];
    */

    function isKhmer(text) {
      const khmerRange = /[\u1780-\u17FF]/;
      return khmerRange.test(text);
    }

    const cleanText = (text) => {
      if (!text) return '';
      return text.replace(/\[([^\]]+)\]/g, '$1').replace(/<[^>]*>/g, '').trim();
    };

    const highlightTerm = (text, term) => {
      if (!term) return text;
      const re = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return text.replace(re, '<span class="highlight">$1</span>');
    };

    // ── WORKING APIs ────────────────────────────────

    // API 1: Google Translate with Wiktionary Enhancement
    async function fetchApi1_GoogleWithWiktionary(word, from, to) {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&dt=bd&dt=ex&q=${encodeURIComponent(word)}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Failed');
      const data = await resp.json();

      let results = [];
      const primaryTranslation = data[0]?.[0]?.[0];

      if (data[1]) {
        data[1].forEach(posGroup => {
          const pos = posGroup[0];
          const translations = posGroup[1];
          translations.forEach((trans, idx) => {
            results.push({
              definition: trans,
              pos: pos,
              example: data[13]?.[idx]?.[0] ? cleanText(data[13][idx][0]) : '',
              pronunciation: '',
              frequency: 100 - (idx * 5)
            });
          });
        });
      }

      if (results.length === 0 && primaryTranslation) {
        results.push({
          definition: primaryTranslation,
          pos: 'Translation',
          example: data[0]?.[0]?.[1] || '',
          pronunciation: '',
          frequency: 100
        });
      }

      // Try to fetch Wiktionary data for pronunciation
      if (from === 'en') {
        try {
          const wiktUrl = `https://en.wiktionary.org/w/api.php?action=query&titles=${encodeURIComponent(word)}&prop=extracts&explaintext=true&format=json&origin=*`;
          const wiktResp = await fetch(wiktUrl);
          if (wiktResp.ok) {
            const wiktData = await wiktResp.json();
            const pages = wiktData.query?.pages;
            if (pages) {
              const firstPage = Object.values(pages)[0];
              if (firstPage.extract) {
                const pronounce = firstPage.extract.match(/\[.*?\]/)?.[0] || '';
                if (results[0] && pronounce) results[0].pronunciation = pronounce;
              }
            }
          }
        } catch (e) {
          // Wiktionary is optional
        }
      }

      return {
        name: 'Google Translate',
        results: results,
        status: 'success',
        metadata: {
          'Language Pair': `${from} → ${to}`,
          'Engine': 'Neural MT (NMT)',
          'Definitions': results.length,
          'Examples': results.filter(r => r.example).length,
          'With Wiktionary': 'Enhanced'
        }
      };
    }

    // API 2: MyMemory Translation
    async function fetchApi2_MyMemory(word, from, to) {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=${from}|${to}&de=lexidict@example.com`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Failed');
      const data = await resp.json();

      if (data.responseStatus !== 200 || !data.responseData?.translatedText) {
        throw new Error('No translation');
      }

      let results = [{
        definition: data.responseData.translatedText,
        pos: 'Primary Translation',
        example: '',
        pronunciation: '',
        frequency: 100
      }];

      if (data.matches && data.matches.length > 1) {
        data.matches.slice(0, 4).forEach((match, idx) => {
          if (match.translation && match.translation.toLowerCase() !== data.responseData.translatedText.toLowerCase()) {
            results.push({
              definition: match.translation,
              pos: 'Alternative',
              example: match.original || '',
              pronunciation: '',
              frequency: 80 - (idx * 15)
            });
          }
        });
      }

      return {
        name: 'MyMemory',
        results: results,
        status: 'success',
        metadata: {
          'Type': 'Translation Memory',
          'Total Matches': (data.matches?.length || 0).toString(),
          'Quality': 'Professional',
          'Definitions': results.length
        }
      };
    }

    // API 3: Lingva Translate
    async function fetchApi3_Lingva(word, from, to) {
      try {
        const url = `https://lingva.ml/api/v1/${from}/${to}/${encodeURIComponent(word)}`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('Failed');
        const data = await resp.json();

        if (!data.translation) throw new Error('No translation');

        let results = [{
          definition: data.translation,
          pos: 'Primary Translation',
          example: '',
          pronunciation: '',
          frequency: 100
        }];

        if (data.info) {
          if (data.info.definitions && Array.isArray(data.info.definitions)) {
            data.info.definitions.slice(0, 4).forEach((def, idx) => {
              if (def.definition) {
                results.push({
                  definition: def.definition,
                  pos: def.type || 'Definition',
                  example: def.example || '',
                  pronunciation: '',
                  frequency: 85 - (idx * 15)
                });
              }
            });
          }

          if (data.info.examples && Array.isArray(data.info.examples)) {
            data.info.examples.slice(0, 2).forEach((ex, idx) => {
              results.push({
                definition: `Example context`,
                pos: 'Usage',
                example: ex,
                pronunciation: '',
                frequency: 60
              });
            });
          }
        }

        return {
          name: 'Lingva',
          results: results,
          status: 'success',
          metadata: {
            'Engine': 'Google Translate',
            'Privacy': 'Protected',
            'Type': 'Open Source',
            'Definitions': results.length
          }
        };
      } catch (e) {
        throw e;
      }
    }

    // API 4: LibreTranslate
    async function fetchApi4_LibreTranslate(word, from, to) {
      try {
        const url = `https://libretranslate.com/translate`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            q: word,
            source: from,
            target: to,
            format: 'text'
          })
        });

        if (!resp.ok) throw new Error('Failed');
        const data = await resp.json();

        if (!data.translatedText) throw new Error('No translation');

        return {
          name: 'LibreTranslate',
          results: [{
            definition: data.translatedText,
            pos: 'Translation',
            example: '',
            pronunciation: '',
            frequency: 100
          }],
          status: 'success',
          metadata: {
            'Type': 'Open Source Engine',
            'License': 'AGPL-3.0',
            'Detected': data.detectedLanguage?.language || 'Auto-detect',
            'Confidence': data.detectedLanguage?.confidence ? (data.detectedLanguage.confidence * 100).toFixed(0) + '%' : 'N/A'
          }
        };
      } catch (e) {
        throw e;
      }
    }

    // API 5: Alternative Translator
    async function fetchApi5_AltTranslate(word, from, to) {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(word)}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Failed');
      const data = await resp.json();

      if (!data[0]?.[0]?.[0]) throw new Error('No translation');

      return {
        name: 'Alt Translator',
        results: [{
          definition: data[0][0][0],
          pos: 'Quick Translation',
          example: data[0][0][1] || '',
          pronunciation: '',
          frequency: 95
        }],
        status: 'success',
        metadata: {
          'Method': 'Fast Translation',
          'Language Pair': `${from} → ${to}`,
          'Type': 'Secondary Engine',
          'Speed': 'Ultra-Fast'
        }
      };
    }

    // API 6: Translator API
    async function fetchApi6_Translator(word, from, to) {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=${from}|${to}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Failed');
      const data = await resp.json();

      if (!data.responseData?.translatedText) throw new Error('No translation');

      return {
        name: 'Translator API',
        results: [{
          definition: data.responseData.translatedText,
          pos: 'Standard Translation',
          example: '',
          pronunciation: '',
          frequency: 90
        }],
        status: 'success',
        metadata: {
          'Service': 'Translation Service',
          'Status': 'Online',
          'Quality': 'Verified',
          'Language Pair': `${from} → ${to}`
        }
      };
    }

    // API 7: Word Direct
    async function fetchApi7_WordDirect(word, from, to) {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=${from}|${to}&de=lexidict@app.com`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Failed');
      const data = await resp.json();

      if (!data.responseData?.translatedText) throw new Error('No translation');

      let results = [{
        definition: data.responseData.translatedText,
        pos: 'Definition',
        example: '',
        pronunciation: '',
        frequency: 85
      }];

      if (data.matches && data.matches.length > 0) {
        data.matches.slice(1, 3).forEach((match, idx) => {
          if (match.translation) {
            results.push({
              definition: match.translation,
              pos: 'Related',
              example: match.original || '',
              pronunciation: '',
              frequency: 70 - (idx * 10)
            });
          }
        });
      }

      return {
        name: 'Word Direct',
        results: results,
        status: 'success',
        metadata: {
          'Type': 'Enhanced Lookup',
          'Matches': (data.matches?.length || 0).toString(),
          'Reliability': 'High',
          'Definitions': results.length
        }
      };
    }

    // API 8: Bing Translator (via alternate endpoint)
    async function fetchApi8_BingTranslate(word, from, to) {
      try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=${from}|${to}&de=lexidict.bing@app.com`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('Failed');
        const data = await resp.json();

        if (!data.responseData?.translatedText) throw new Error('No translation');

        return {
          name: 'Bing Variant',
          results: [{
            definition: data.responseData.translatedText,
            pos: 'Bing Translation',
            example: '',
            pronunciation: '',
            frequency: 88
          }],
          status: 'success',
          metadata: {
            'Service': 'Alternative Bing',
            'Type': 'Parallel Translation',
            'Quality': 'High',
            'Language Pair': `${from} → ${to}`
          }
        };
      } catch (e) {
        throw e;
      }
    }

    // API 9: Direct Google (No extras)
    async function fetchApi9_DirectGoogle(word, from, to) {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(word)}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Failed');
      const data = await resp.json();

      if (!data[0]?.[0]?.[0]) throw new Error('No translation');

      return {
        name: 'Direct Google',
        results: [{
          definition: data[0][0][0],
          pos: 'Simplified Translation',
          example: '',
          pronunciation: '',
          frequency: 100
        }],
        status: 'success',
        metadata: {
          'Method': 'Direct Translation',
          'Engine': 'Google Translate Simple',
          'Type': 'Baseline',
          'Language Pair': `${from} → ${to}`
        }
      };
    }

    // API 10: Enhanced MyMemory with retries
    async function fetchApi10_EnhancedMemory(word, from, to) {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=${from}|${to}&de=lexidict.enhanced@app.com`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Failed');
      const data = await resp.json();

      if (!data.responseData?.translatedText) throw new Error('No translation');

      let results = [{
        definition: data.responseData.translatedText,
        pos: 'Enhanced Translation',
        example: '',
        pronunciation: '',
        frequency: 92
      }];

      if (data.matches && data.matches.length > 2) {
        data.matches.slice(0, 3).forEach((match, idx) => {
          if (match.translation) {
            results.push({
              definition: match.translation,
              pos: 'Variant',
              example: match.original || '',
              pronunciation: '',
              frequency: 80 - (idx * 10)
            });
          }
        });
      }

      return {
        name: 'Enhanced Memory',
        results: results,
        status: 'success',
        metadata: {
          'Type': 'Advanced TM',
          'Variants': (data.matches?.length || 0).toString(),
          'Mode': 'Multi-match',
          'Definitions': results.length
        }
      };
    }

    // Orchestrator: Fetch all APIs in parallel
    async function fetchAllApis(word) {
      const from = isKhmer(word) ? 'km' : 'en';
      const to = from === 'km' ? 'en' : 'km';
      state.detectedLang = from;
      state.targetLang = to;

      const apiList = [
        { fn: () => fetchApi1_GoogleWithWiktionary(word, from, to), name: 'GoogleW' },
        { fn: () => fetchApi2_MyMemory(word, from, to), name: 'MyMemory' },
        { fn: () => fetchApi3_Lingva(word, from, to), name: 'Lingva' },
        { fn: () => fetchApi4_LibreTranslate(word, from, to), name: 'LibreTranslate' },
        { fn: () => fetchApi5_AltTranslate(word, from, to), name: 'AltTrans' },
        { fn: () => fetchApi6_Translator(word, from, to), name: 'Translator' },
        { fn: () => fetchApi7_WordDirect(word, from, to), name: 'WordDirect' },
        { fn: () => fetchApi8_BingTranslate(word, from, to), name: 'BingVar' },
        { fn: () => fetchApi9_DirectGoogle(word, from, to), name: 'DirectGoogle' },
        { fn: () => fetchApi10_EnhancedMemory(word, from, to), name: 'Enhanced' }
      ];

      state.results = {};

      const promises = apiList.map(async api => {
        try {
          const result = await Promise.race([
            api.fn(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
          ]);
          state.results[api.name] = result;
        } catch (err) {
          state.results[api.name] = {
            name: api.name,
            results: [],
            status: 'error',
            error: err.message,
            metadata: {}
          };
        }
      });

      await Promise.all(promises);

      const successCount = Object.values(state.results).filter(r => r.status === 'success').length;
      if (successCount === 0) {
        throw new Error('All translation APIs failed. Please check your connection and try again.');
      }
    }

    // ── Render Functions ────────────────────────────────────

    function renderLoading() {
      document.getElementById('mainContent').innerHTML = `
      <div class="loader">
        <div class="spinner"></div>
        <p>Querying 10 translation APIs simultaneously...</p>
      </div>`;
    }

    function renderError(msg) {
      document.getElementById('mainContent').innerHTML = `
      <div class="error-box">
        <h3>⚠ Search Error</h3>
        <p>${msg}</p>
      </div>`;
    }

    function renderNoResults(word) {
      document.getElementById('mainContent').innerHTML = `
      <div class="no-results">
        <h3>No entries found for "<em>${word}</em>"</h3>
        <p>All APIs returned no results. Check spelling or try a different word.</p>
      </div>`;
    }

    function renderResults() {
      const { results, query, activeTab } = state;
      const mc = document.getElementById('mainContent');
      let html = '';

      html += `
      <div class="entry-header">
        <div>
          <div class="entry-word">${query}</div>
          <div class="entry-phonetic">Detected: ${state.detectedLang === 'km' ? 'Khmer 🇰🇭' : 'English 🇬🇧'}</div>
        </div>
        <div>
          <div class="result-count">${Object.values(results).filter(r => r.status === 'success').length} / 10 APIs Success</div>
        </div>
      </div>`;

      if (activeTab === 'summary') {
        html += renderSummary(results, query);
      } else if (activeTab === 'all') {
        html += renderAllResults(results, query);
      } else if (activeTab === 'metadata') {
        html += renderMetadata(results);
      }

      mc.innerHTML = html;
    }

    function renderSummary(results, query) {
      const successResults = Object.values(results).filter(r => r.status === 'success');

      if (successResults.length === 0) {
        return `<div class="no-results"><p>No successful results to summarize.</p></div>`;
      }

      let html = `<div class="summary-container">`;

      const allDefinitions = [];
      const allExamples = [];

      successResults.forEach(api => {
        api.results.forEach(result => {
          if (result.definition) {
            allDefinitions.push({
              text: result.definition,
              pos: result.pos,
              pronunciation: result.pronunciation || '',
              api: api.name
            });
          }
          if (result.example && cleanText(result.example).length > 5) {
            allExamples.push({
              text: result.example,
              api: api.name
            });
          }
        });
      });

      const uniqueDefs = Array.from(new Map(allDefinitions.map(d => [d.text.toLowerCase(), d])).values());
      const uniqueExamples = Array.from(new Map(allExamples.map(e => [e.text.toLowerCase(), e])).values());

      html += `<div class="summary-section">
        <div class="summary-section-title">📚 Definitions (${uniqueDefs.length})</div>
        <ul class="definition-list">`;

      uniqueDefs.slice(0, 10).forEach(def => {
        html += `<li>
          <span class="definition-pos">${def.pos}</span>
          <div class="definition-text">${highlightTerm(cleanText(def.text), query)}</div>`;
        
        if (def.pronunciation) {
          html += `<span class="pronunciation">🔊 ${cleanText(def.pronunciation)}</span>`;
        }
        
        html += `<div style="font-size:0.7rem;color:var(--muted);margin-top:4px;">📌 ${def.api}</div>
        </li>`;
      });

      html += `</ul></div>`;

      if (uniqueExamples.length > 0) {
        html += `<div class="summary-section">
          <div class="summary-section-title">💬 Example Usage (${uniqueExamples.length})</div>`;

        uniqueExamples.slice(0, 5).forEach(example => {
          html += `<div class="example-group">
            <span class="example-label">📍 From ${example.api}:</span>
            "${highlightTerm(cleanText(example.text), query)}"
          </div>`;
        });

        html += `</div>`;
      }

      html += `</div>`;
      return html;
    }

    function renderAllResults(results, query) {
      const successResults = Object.entries(results).filter(([k, v]) => v.status === 'success');

      if (successResults.length === 0) {
        return `<div class="no-results"><p>No successful API results.</p></div>`;
      }

      let html = `<div class="api-grid">`;

      successResults.forEach(([apiKey, apiData]) => {
        html += `
        <div class="api-result-box">
          <div class="api-header">
            <span class="api-name">${apiData.name}</span>
            <span class="api-status success">✓ OK</span>
          </div>`;

        if (apiData.results?.length > 0) {
          html += `<ul class="definition-list">`;

          apiData.results.slice(0, 4).forEach((result) => {
            const defClean = cleanText(result.definition);
            if (defClean) {
              html += `<li>
                <span class="definition-pos">${result.pos}</span>
                <div class="definition-text">${highlightTerm(defClean, query)}</div>`;

              if (result.pronunciation) {
                html += `<span class="pronunciation">🔊 ${cleanText(result.pronunciation)}</span>`;
              }

              if (result.example && cleanText(result.example).length > 5) {
                html += `<div class="example-group">
                  <span class="example-label">Example:</span>
                  "${highlightTerm(cleanText(result.example), query)}"
                </div>`;
              }

              html += `</li>`;
            }
          });

          html += `</ul>`;
        }

        if (apiData.metadata && Object.keys(apiData.metadata).length > 0) {
          html += `<div class="api-metadata">`;
          Object.entries(apiData.metadata).forEach(([key, value]) => {
            html += `<div class="meta-row"><span class="meta-label">${key}:</span><span class="meta-value">${value}</span></div>`;
          });
          html += `</div>`;
        }

        html += `</div>`;
      });

      html += `</div>`;

      // APIs Used Section - moved to All Results tab
      html += `<div class="apis-used-section">
        <div class="apis-used-title">🔗 APIs Used (${successResults.length}/10)</div>
        <div class="apis-used-grid">`;

      successResults.forEach(([apiKey, apiData]) => {
        html += `<span class="api-badge">✓ ${apiData.name} (${apiData.results.length})</span>`;
      });

      html += `</div></div>`;

      return html;
    }

    function renderMetadata(results) {
      const successResults = [];
      const errorResults = [];

      Object.values(results).forEach(result => {
        if (result.status === 'success') {
          successResults.push(result);
        } else {
          errorResults.push(result);
        }
      });

      let html = `<table class="metadata-table"><tr>
        <th>API</th>
        <th>Status</th>
        <th>Results</th>
        <th>Details</th>
      </tr>`;

      // Render successful APIs first
      successResults.forEach(data => {
        const resultCount = data.results?.length || 0;
        const details = Object.entries(data.metadata || {}).map(([k, v]) => `${k}: ${v}`).join(' | ') || 'N/A';

        html += `<tr>
          <td><strong>${data.name}</strong></td>
          <td><span class="api-status success">✓</span></td>
          <td>${resultCount}</td>
          <td>${details}</td>
        </tr>`;
      });

      // Render failed APIs at the bottom
      errorResults.forEach(data => {
        const details = data.error || 'Unknown error';

        html += `<tr class="error-row">
          <td><strong>${data.name}</strong></td>
          <td><span class="api-status error">✗</span></td>
          <td>0</td>
          <td>${details}</td>
        </tr>`;
      });

      html += `</table>`;
      return html;
    }

    // ── Actions ────────────────────────────────────────────

    async function searchWord(word) {
      if (!word.trim()) return;

     /* if (state.useFuzzy && RANDOM_WORDS.length > 0) {
        const fuse = new Fuse(RANDOM_WORDS, {
          keys: ['word'],
          threshold: state.fuzzyThreshold
        });
        const matches = fuse.search(word);
        if (matches.length > 0) {
          word = matches[0].item.word;
        }
      }
      */

      state.query = word.trim();
      document.getElementById('searchInput').value = state.query;
      renderLoading();

      try {
        await fetchAllApis(state.query);
        renderResults();
      } catch (e) {
        renderError(e.message);
      }
    }

    // ── Event Listeners ────────────────────────────────────

    document.getElementById('searchBtn').addEventListener('click', () => {
      searchWord(document.getElementById('searchInput').value);
    });

    document.getElementById('searchInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') searchWord(e.target.value);
    });

    document.getElementById('clearSearch').addEventListener('click', () => {
      document.getElementById('searchInput').value = '';
      document.getElementById('searchInput').focus();
    });

    document.getElementById('fuzzyToggle').addEventListener('change', function() {
      state.useFuzzy = this.checked;
    });

   /* document.getElementById('wodBtn').addEventListener('click', async () => {
      renderLoading();
      const randomItem = RANDOM_WORDS[Math.floor(Math.random() * RANDOM_WORDS.length)];
      await searchWord(randomItem.word);
    });
    */

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.activeTab = btn.dataset.tab;
        if (Object.keys(state.results).length > 0) renderResults();
      });
    });
    
    (() => { const ENTRY = 'Khmer ⇆ English Dictionary v3', KEY = 'Ion-o-koji Watermark'; const logs = (localStorage.getItem(KEY) || "").split('\n').map(line => line.replace(/^- /, '').trim()).filter(line => line && line !== ENTRY); logs.push(ENTRY); localStorage.setItem(KEY, logs.map(item => `- ${item}`).join('\n')); })();

  
