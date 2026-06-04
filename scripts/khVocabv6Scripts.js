    // ════════════════════════════════════════════
    // STORAGE KEYS & STATE
    // ════════════════════════════════════════════
    var URL_KEY = 'kv_url';
    var MAINUSER_KEY = 'kv_main_user';
    var SKEY = 'kv_settings';
    var FAV_KEY = 'kv_favorites';
    var CONF_KEY = 'kv_confidence';
    var SRS_KEY = 'kv_srs';
    var CACHE_KEY = 'kv_cache';
    var SYNC_KEY = 'kv_last_sync';
    var CATS_KEY = 'kv_custom_cats';
    var SETS_KEY = 'kv_study_sets';
    var QUEUE_KEY = 'kv_pending_queue';

    var SCRIPT_URL = ls(URL_KEY) || '';
    var MAIN_USER = ls(MAINUSER_KEY) || '';
    var CURRENT_USER = MAIN_USER;
    var readOnlyMode = false;

    var allRows = [];
    var quickSort = 'date';
    var sortCol = -1;
    var sortAsc = true;
    var blurMode = '';
    var editRow = null;
    var bulkMode = false;
    var selectedKeys = new Set();
    var autoSyncTimer = null;
    var favSortCol = -1;
    var favSortAsc = true;
    var csvParsed = [];
    var studyDir = 'kh';

    var favorites = new Set(safeJsonParse(ls(FAV_KEY), []));
    var confidence = safeJsonParse(ls(CONF_KEY), {});
    var srsData = safeJsonParse(ls(SRS_KEY), {});
    var customCats = safeJsonParse(ls(CATS_KEY), []);
    var studySets = safeJsonParse(ls(SETS_KEY), []);
    var pendingQueue = safeJsonParse(ls(QUEUE_KEY), []);

    // Import state tracker
    var importState = {
      active: false,
      total: 0,
      sent: 0,
      failed: 0,
      label: ''
    };

    var DEFAULT_CATS = ['Words', 'Sentences', 'Level 1', 'Level 2', 'Level 3'];

    var S = {
      density: 'comfortable',
      highlight: true,
      autoSync: 0,
      studyDir: 'kh',
      studyRo: true,
      offlineMode: false,
      enFontSize: 14,
      khFontSize: 16,
      khFont: "'Noto Sans Khmer',system-ui,sans-serif",
      accent: 'purple',
      colEn: true,
      colKh: true,
      colRo: true,
      colNo: true,
      colCa: true,
      colDt: false,
      showRo: true,
      srs: true
    };

    var ACCENT_PRESETS = {
      purple: {
        acc: '#7c3aed',
        acc2: '#a855f7',
        acc3: '#c084fc'
      },
      blue: {
        acc: '#1d4ed8',
        acc2: '#3b82f6',
        acc3: '#93c5fd'
      },
      teal: {
        acc: '#0f766e',
        acc2: '#14b8a6',
        acc3: '#5eead4'
      },
      green: {
        acc: '#166534',
        acc2: '#22c55e',
        acc3: '#86efac'
      },
      rose: {
        acc: '#be123c',
        acc2: '#f43f5e',
        acc3: '#fda4af'
      },
      amber: {
        acc: '#92400e',
        acc2: '#f59e0b',
        acc3: '#fde68a'
      },
    };

    var MILESTONES_ADD = [{
        n: 1,
        icon: '🌱',
        name: 'First Word'
      }, {
        n: 10,
        icon: '📚',
        name: 'Bookworm'
      },
      {
        n: 25,
        icon: '🔥',
        name: 'On Fire'
      }, {
        n: 50,
        icon: '💪',
        name: 'Committed'
      },
      {
        n: 100,
        icon: '🎯',
        name: 'Century'
      }, {
        n: 250,
        icon: '🏆',
        name: 'Master'
      },
      {
        n: 500,
        icon: '👑',
        name: 'Legend'
      }, {
        n: 1000,
        icon: '🌟',
        name: 'Transcendent'
      },
    ];

    var MILESTONES_STUDY = [{
        n: 1,
        icon: '🎯',
        name: 'First Study'
      }, {
        n: 10,
        icon: '📖',
        name: 'Student'
      },
      {
        n: 25,
        icon: '🧠',
        name: 'Brain Power'
      }, {
        n: 50,
        icon: '⚡',
        name: 'Sparking'
      },
      {
        n: 100,
        icon: '🔥',
        name: 'On Fire'
      }, {
        n: 250,
        icon: '🏅',
        name: 'Expert'
      },
      {
        n: 500,
        icon: '💎',
        name: 'Diamond'
      }, {
        n: 1000,
        icon: '🌟',
        name: 'Legend'
      },
    ];

    // ════════════════════════════════════════════
    // UTILS
    // ════════════════════════════════════════════
    function ls(k) {
      try {
        return localStorage.getItem(k);
      } catch (e) {
        return null;
      }
    }

    function lsSet(k, v) {
      try {
        localStorage.setItem(k, v);
      } catch (e) {}
    }

    function safeJsonParse(str, def) {
      try {
        return str ? JSON.parse(str) : def;
      } catch (e) {
        return def;
      }
    }

    function esc(s) {
      var d = document.createElement('div');
      d.textContent = String(s || '');
      return d.innerHTML;
    }

    function el(id) {
      return document.getElementById(id);
    }

    function hlText(s, q) {
      if (!q) return esc(s);
      var sl = s.toLowerCase(),
        idx = sl.indexOf(q);
      if (idx === -1) return esc(s);
      return esc(s.slice(0, idx)) + '<span class="hl">' + esc(s.slice(idx, idx + q.length)) + '</span>' + hlText(s.slice(idx + q.length), q);
    }

    function bCls(cat) {
      var m = {
        Words: 'bw',
        Sentences: 'bs',
        'Level 1': 'b1',
        'Level 2': 'b2',
        'Level 3': 'b3'
      };
      return m[cat] || 'bc';
    }

    function wordKey(r) {
      return (r.khmer || '') + '§' + (r.english || '') + '§' + (r.romanization || '');
    }

    function isFav(r) {
      return favorites.has(wordKey(r));
    }

    function saveFavorites() {
      lsSet(FAV_KEY, JSON.stringify(Array.from(favorites)));
    }

    function saveStudySets() {
      lsSet(SETS_KEY, JSON.stringify(studySets));
    }

    function saveCustomCats() {
      lsSet(CATS_KEY, JSON.stringify(customCats));
    }

    function savePendingQueue() {
      lsSet(QUEUE_KEY, JSON.stringify(pendingQueue));
    }

    function getAllCats() {
      var cats = DEFAULT_CATS.slice();
      customCats.forEach(function(c) {
        if (cats.indexOf(c) === -1) cats.push(c);
      });
      return cats;
    }

    // ════════════════════════════════════════════
    // STATUS PILL
    // ════════════════════════════════════════════
    function setStatus(state, msg) {
      var sp = el('spill'),
        dot = el('dot'),
        stxt = el('stxt');
      if (!sp || !dot || !stxt) return;
      dot.className = 'dot' + (state ? ' ' + state : '');
      stxt.textContent = msg || '';
      sp.className = 'spill' + (
        state === 'spin-dot' ? ' syncing' :
        state === 'ok' ? ' s-ok' :
        state === 'err' ? ' s-err' :
        state === 'off' ? ' s-off' :
        state === 'imp' ? ' s-imp' : ''
      );
    }

    function onSpillClick() {
      if (importState.active) el('imp-prog-ovl').classList.add('open');
    }

    function updateImportProgress() {
      var pct = importState.total ? Math.round(importState.sent / importState.total * 100) : 0;
      var lbl = el('imp-label'),
        pctEl = el('imp-pct'),
        bar = el('imp-bar'),
        det = el('imp-detail');
      if (lbl) lbl.textContent = importState.label || 'Importing…';
      if (pctEl) pctEl.textContent = pct + '%';
      if (bar) bar.style.width = pct + '%';
      if (det) det.textContent = importState.sent + ' / ' + importState.total + ' words' +
        (importState.failed ? ' (' + importState.failed + ' failed)' : '');
      setStatus('imp', 'Importing ' + importState.sent + '/' + importState.total + '…');
    }

    // ════════════════════════════════════════════
    // CATEGORY DROPDOWNS
    // ════════════════════════════════════════════
    function populateCatDropdown(id, includeSpecial, currentVal) {
      var sel = el(id);
      if (!sel) return;
      var val = currentVal !== undefined ? currentVal : (sel.value || '');
      sel.innerHTML = '';
      if (includeSpecial) {
        addOpt(sel, 'All', 'All Categories');
        addOpt(sel, '__nosent__', 'All (except Sentences)');
      }
      getAllCats().forEach(function(c) {
        addOpt(sel, c, c);
      });
      sel.value = val;
    }

    function addOpt(sel, val, txt) {
      var opt = document.createElement('option');
      opt.value = val;
      opt.textContent = txt;
      sel.appendChild(opt);
    }

    function populateStudyFilter() {
      var sel = el('study-filter');
      if (!sel) return;
      var val = sel.value || 'All';
      sel.innerHTML = '';
      addOpt(sel, 'All', 'All Words');
      addOpt(sel, '__nosent__', 'All (except Sentences)');
      getAllCats().forEach(function(c) {
        addOpt(sel, c, c);
      });
      addOpt(sel, '__fav__', '⭐ Favourites only');
      addOpt(sel, '__weak__', '🔴 Weak words only');
      addOpt(sel, '__due__', '🔁 SRS Due today');
      if (studySets.length) {
        var sep = document.createElement('option');
        sep.disabled = true;
        sep.textContent = '── Study Sets ──';
        sel.appendChild(sep);
        studySets.forEach(function(s) {
          addOpt(sel, 'set:' + s.id, '📚 ' + s.name + ' (' + s.keys.length + ')');
        });
      }
      sel.value = val;
    }

    function refreshAllCatDropdowns() {
      var vc = (el('view-cat-filter') || {}).value || 'All';
      var fc = (el('f-cat') || {}).value || 'Words';
      var ec = (el('e-cat') || {}).value || 'Words';
      var bc = (el('bulkcat-sel') || {}).value || 'Words';
      populateCatDropdown('view-cat-filter', true, vc);
      populateCatDropdown('f-cat', false, fc);
      populateCatDropdown('e-cat', false, ec);
      populateCatDropdown('bulkcat-sel', false, bc);
      populateStudyFilter();
    }

    // ════════════════════════════════════════════
    // CUSTOM CATEGORIES (also synced to sheet)
    // ════════════════════════════════════════════
    function openNewCatModal() {
      var inp = el('newcat-inp');
      if (inp) inp.value = '';
      renderCustomCatList();
      el('newcat-ovl').classList.add('open');
      setTimeout(function() {
        if (inp) inp.focus();
      }, 100);
    }

    function addCustomCat() {
      var name = (el('newcat-inp').value || '').trim();
      if (!name) {
        toast('Enter a category name.', 'err');
        return;
      }
      if (getAllCats().map(function(c) {
          return c.toLowerCase();
        }).indexOf(name.toLowerCase()) !== -1) {
        toast('Category already exists.', 'err');
        return;
      }
      customCats.unshift(name); // add to top
      saveCustomCats();
      el('newcat-inp').value = '';
      renderCustomCatList();
      refreshAllCatDropdowns();
      toast('Category "' + name + '" created.', 'ok');
      syncCategoryToSheet('add', name, '');
    }

    function removeCustomCat(name) {
      if (!confirm('Remove category "' + name + '"?')) return;
      customCats = customCats.filter(function(c) {
        return c !== name;
      });
      saveCustomCats();
      renderCustomCatList();
      refreshAllCatDropdowns();
      toast('Category removed.', 'inf');
      syncCategoryToSheet('delete', name, '');
    }

    function startEditCat(name) {
      renderCustomCatList(name);
    }

    function finishEditCat(oldName) {
      var inp = el('cat-edit-inp-' + oldName.replace(/[^a-z0-9]/gi, '_'));
      if (!inp) return;
      var newName = (inp.value || '').trim();
      if (!newName) {
        toast('Name cannot be empty.', 'err');
        return;
      }
      if (newName === oldName) {
        renderCustomCatList();
        return;
      }
      if (getAllCats().filter(function(c) {
          return c !== oldName;
        }).map(function(c) {
          return c.toLowerCase();
        }).indexOf(newName.toLowerCase()) !== -1) {
        toast('That name already exists.', 'err');
        return;
      }
      var idx = customCats.indexOf(oldName);
      if (idx !== -1) customCats[idx] = newName;
      // Rename in existing words locally
      allRows.forEach(function(r) {
        if (r.category === oldName) r.category = newName;
      });
      saveCustomCats();
      saveCache(allRows);
      renderCustomCatList();
      refreshAllCatDropdowns();
      render();
      renderFav();
      toast('Renamed to "' + newName + '"', 'ok');
      syncCategoryToSheet('rename', oldName, newName);
    }

    function renderCustomCatList(editingName) {
      var box = el('custom-cat-list');
      if (!box) return;
      box.innerHTML = '';
      if (!customCats.length) {
        box.innerHTML = '<div style="font-size:.75rem;color:var(--dim);padding:8px">No custom categories yet. Type a name above and click Add.</div>';
        return;
      }
      customCats.forEach(function(c) {
        var safe = c.replace(/[^a-z0-9]/gi, '_');
        var row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:6px;padding:7px 10px;background:var(--surf2);border:1px solid var(--bdr);border-radius:10px';
        if (editingName === c) {
          row.innerHTML =
            '<input id="cat-edit-inp-' + safe + '" class="custom-cat-edit-row" style="flex:1;height:30px;background:var(--bg);border:1px solid var(--acc2);border-radius:6px;color:var(--text);padding:0 8px;font-size:.8rem;outline:none" value="' + esc(c) + '"/>' +
            '<button class="btn-s" style="padding:5px 10px;font-size:.75rem" onclick="finishEditCat(\'' + c.replace(/'/g, "\\'") + '\')" >✓</button>' +
            '<button class="btn-g" style="padding:5px 8px;font-size:.75rem" onclick="renderCustomCatList()">✕</button>';
        } else {
          row.innerHTML =
            '<span class="custom-cat-name">' + esc(c) + '</span>' +
            '<button class="custom-cat-edit" onclick="startEditCat(\'' + c.replace(/'/g, "\\'") + '\')" title="Rename">✏️</button>' +
            '<button class="custom-cat-del" onclick="removeCustomCat(\'' + c.replace(/'/g, "\\'") + '\')" title="Delete">✕</button>';
        }
        box.appendChild(row);
      });
    }

    function syncCategoryToSheet(action, name, newName) {
      if (!SCRIPT_URL) return;
      var url = new URL(SCRIPT_URL);
      url.searchParams.set('action', 'manageCategory');
      url.searchParams.set('op', action);
      url.searchParams.set('name', name);
      if (newName) url.searchParams.set('newName', newName);
      url.searchParams.set('user', MAIN_USER);
      fetch(url.toString()).catch(function() {});
    }

    function loadCategoriesFromSheet() {
      if (!SCRIPT_URL) return;
      fetch(SCRIPT_URL + '?action=getCategories&user=' + encodeURIComponent(MAIN_USER))
        .then(function(r) {
          return r.json();
        })
        .then(function(j) {
          if (j.success && Array.isArray(j.categories) && j.categories.length) {
            // Merge sheet cats with local (sheet is source of truth)
            j.categories.forEach(function(c) {
              if (DEFAULT_CATS.indexOf(c) === -1 && customCats.indexOf(c) === -1) customCats.push(c);
            });
            // Remove locals that aren't on sheet (sheet-deleted)
            customCats = customCats.filter(function(c) {
              return j.categories.indexOf(c) !== -1;
            });
            saveCustomCats();
            refreshAllCatDropdowns();
          }
        })
        .catch(function() {});
    }

    // ════════════════════════════════════════════
    // STUDY SETS
    // ════════════════════════════════════════════
    function openStudySetModal() {
      if (!selectedKeys.size) {
        toast('Select some entries first.', 'err');
        return;
      }
      el('sset-count').textContent = selectedKeys.size;
      el('sset-new-name').value = '';
      renderStudySetList();
      el('studyset-ovl').classList.add('open');
    }

    function renderStudySetList() {
      var box = el('sset-list');
      if (!box) return;
      box.innerHTML = '';
      if (!studySets.length) {
        box.innerHTML = '<div style="font-size:.75rem;color:var(--dim);text-align:center;padding:10px">No study sets yet. Create one below.</div>';
        return;
      }
      studySets.forEach(function(s) {
        var item = document.createElement('div');
        item.className = 'set-item';
        item.innerHTML = '<span class="set-item-name">' + esc(s.name) + '</span><span class="set-item-count">' + s.keys.length + ' words</span>';
        item.onclick = function() {
          addToSet(s.id);
        };
        box.appendChild(item);
      });
    }

    function createAndAddSet() {
      var name = (el('sset-new-name').value || '').trim();
      if (!name) {
        toast('Enter a set name.', 'err');
        return;
      }
      var id = 'set_' + Date.now();
      studySets.unshift({
        id: id,
        name: name,
        keys: []
      }); // add to top
      saveStudySets();
      addToSet(id);
    }

    function addToSet(id) {
      var s = studySets.find(function(s) {
        return s.id === id;
      });
      if (!s) {
        toast('Set not found.', 'err');
        return;
      }
      var added = 0;
      selectedKeys.forEach(function(k) {
        if (s.keys.indexOf(k) === -1) {
          s.keys.push(k);
          added++;
        }
      });
      saveStudySets();
      el('studyset-ovl').classList.remove('open');
      populateStudyFilter();
      toast('Added ' + added + ' words to "' + s.name + '"', 'ok');
      exitBulk();
    }

    // ════════════════════════════════════════════
    // SETTINGS
    // ════════════════════════════════════════════
    function loadSettings() {
      try {
        var r = ls(SKEY);
        if (r) Object.assign(S, safeJsonParse(r, {}));
      } catch (e) {}

      function g(id) {
        return el(id);
      }
      if (g('opt-density')) g('opt-density').value = S.density;
      if (g('opt-highlight')) g('opt-highlight').checked = S.highlight;
      if (g('opt-autosync')) g('opt-autosync').value = String(S.autoSync);
      if (g('opt-studydir')) g('opt-studydir').value = S.studyDir;
      if (g('opt-studyro')) g('opt-studyro').checked = S.studyRo;
      if (g('opt-offline')) g('opt-offline').checked = S.offlineMode;
      if (g('opt-enfontsize')) g('opt-enfontsize').value = S.enFontSize;
      if (g('opt-khfontsize')) g('opt-khfontsize').value = S.khFontSize;
      if (g('opt-khfont')) g('opt-khfont').value = S.khFont;
      if (g('opt-showro')) g('opt-showro').checked = S.showRo;
      if (g('opt-srs')) g('opt-srs').checked = S.srs !== false;
      if (g('col-en')) g('col-en').checked = S.colEn !== false;
      if (g('col-kh')) g('col-kh').checked = S.colKh !== false;
      if (g('col-ro')) g('col-ro').checked = S.colRo !== false;
      if (g('col-no')) g('col-no').checked = S.colNo !== false;
      if (g('col-ca')) g('col-ca').checked = S.colCa !== false;
      if (g('col-dt')) g('col-dt').checked = !!S.colDt;
      studyDir = S.studyDir || 'kh';
      buildAccentRow();
      applyAccent(S.accent, true);
      applyEnFontSize(true);
      applyKhFontSize(true);
      applyKhFont(true);
      applyDensity(true);
      applyColumns(true);
      applyShowRo(true);
      updateFsLabels();
    }

    function saveSettings() {
      function g(id) {
        return el(id);
      }
      if (g('opt-density')) S.density = g('opt-density').value;
      if (g('opt-highlight')) S.highlight = g('opt-highlight').checked;
      if (g('opt-autosync')) S.autoSync = parseInt(g('opt-autosync').value) || 0;
      if (g('opt-studydir')) S.studyDir = g('opt-studydir').value;
      if (g('opt-studyro')) S.studyRo = g('opt-studyro').checked;
      if (g('opt-offline')) S.offlineMode = g('opt-offline').checked;
      if (g('opt-enfontsize')) S.enFontSize = parseInt(g('opt-enfontsize').value) || 14;
      if (g('opt-khfontsize')) S.khFontSize = parseInt(g('opt-khfontsize').value) || 16;
      if (g('opt-khfont')) S.khFont = g('opt-khfont').value;
      if (g('opt-showro')) S.showRo = g('opt-showro').checked;
      if (g('opt-srs')) S.srs = g('opt-srs').checked;
      if (g('col-en')) S.colEn = g('col-en').checked;
      if (g('col-kh')) S.colKh = g('col-kh').checked;
      if (g('col-ro')) S.colRo = g('col-ro').checked;
      if (g('col-no')) S.colNo = g('col-no').checked;
      if (g('col-ca')) S.colCa = g('col-ca').checked;
      if (g('col-dt')) S.colDt = g('col-dt').checked;
      lsSet(SKEY, JSON.stringify(S));
    }

    function applyDensity(silent) {
      var v = el('opt-density');
      if (v) S.density = v.value;
      document.body.classList.toggle('compact', S.density === 'compact');
      if (!silent) saveSettings();
    }

    function applyEnFontSize(silent) {
      var v = parseInt((el('opt-enfontsize') || {}).value) || S.enFontSize || 14;
      S.enFontSize = v;
      document.documentElement.style.setProperty('--en-fs', v + 'px');
      document.documentElement.style.setProperty('--tbl-fs', v + 'px');
      var tp = el('tp-en');
      if (tp) tp.style.fontSize = v + 'px';
      if (!silent) {
        updateFsLabels();
        saveSettings();
      }
    }

    function applyKhFontSize(silent) {
      var v = parseInt((el('opt-khfontsize') || {}).value) || S.khFontSize || 16;
      S.khFontSize = v;
      document.documentElement.style.setProperty('--kh-fs', v + 'px');
      var tp = el('tp-kh');
      if (tp) tp.style.fontSize = v + 'px';
      if (!silent) {
        updateFsLabels();
        saveSettings();
      }
    }

    function applyKhFont(silent) {
      var v = (el('opt-khfont') || {}).value || S.khFont || "'Noto Sans Khmer',system-ui,sans-serif";
      S.khFont = v;
      document.documentElement.style.setProperty('--kh-font', v);
      var tp = el('tp-kh');
      if (tp) tp.style.fontFamily = v;
      if (!silent) saveSettings();
    }

    function applyShowRo(silent) {
      var v = el('opt-showro');
      if (v) S.showRo = v.checked;
      document.body.classList.toggle('hide-ro-global', !S.showRo);
      if (!silent) saveSettings();
    }

    function updateFsLabels() {
      var e1 = el('en-fs-label'),
        e2 = el('kh-fs-label');
      if (e1) e1.textContent = (parseInt((el('opt-enfontsize') || {}).value) || 14) + 'px';
      if (e2) e2.textContent = (parseInt((el('opt-khfontsize') || {}).value) || 16) + 'px';
    }

    function applyColumns(silent) {
      ['en', 'kh', 'ro', 'no', 'ca'].forEach(function(c) {
        var chk = el('col-' + c);
        if (chk) document.body.classList.toggle('hide-' + c, !chk.checked);
      });
      var dt = el('col-dt');
      if (dt) document.body.classList.toggle('show-dt', dt.checked);
      if (!silent) saveSettings();
    }

    function applyOffline() {
      saveSettings();
      if (S.offlineMode) loadFromCache();
      else loadData();
    }

    function applyAutoSync() {
      saveSettings();
      if (autoSyncTimer) {
        clearInterval(autoSyncTimer);
        autoSyncTimer = null;
      }
      if (S.autoSync > 0) autoSyncTimer = setInterval(function() {
        if (!S.offlineMode) loadData();
      }, S.autoSync * 1000);
    }

    function buildAccentRow() {
      var row = el('accent-row');
      if (!row) return;
      row.innerHTML = '';
      var colors = {
        purple: '#a855f7',
        blue: '#3b82f6',
        teal: '#14b8a6',
        green: '#22c55e',
        rose: '#f43f5e',
        amber: '#f59e0b'
      };
      Object.keys(ACCENT_PRESETS).forEach(function(key) {
        var sw = document.createElement('div');
        sw.className = 'acc-swatch' + (S.accent === key ? ' active' : '');
        sw.style.background = colors[key];
        sw.title = key.charAt(0).toUpperCase() + key.slice(1);
        sw.onclick = function() {
          applyAccent(key);
        };
        row.appendChild(sw);
      });
    }

    function applyAccent(key, silent) {
      S.accent = key;
      var p = ACCENT_PRESETS[key] || ACCENT_PRESETS.purple;
      document.documentElement.style.setProperty('--acc', p.acc);
      document.documentElement.style.setProperty('--acc2', p.acc2);
      document.documentElement.style.setProperty('--acc3', p.acc3);
      document.querySelectorAll('.acc-swatch').forEach(function(sw, i) {
        sw.classList.toggle('active', Object.keys(ACCENT_PRESETS)[i] === key);
      });
      if (!silent) saveSettings();
    }

    // ════════════════════════════════════════════
    // CACHE
    // ════════════════════════════════════════════
    function saveCache(rows) {
      try {
        lsSet(CACHE_KEY, JSON.stringify(rows));
        lsSet(SYNC_KEY, new Date().toISOString());
      } catch (e) {}
      updateCacheInfo();
    }

    function loadFromCache() {
      try {
        var raw = ls(CACHE_KEY);
        if (raw) {
          allRows = JSON.parse(raw);
          render();
          renderFav();
          renderProgress();
          setStatus('off', 'Offline');
        } else setStatus('off', 'No cache');
      } catch (e) {
        setStatus('err', 'Cache error');
      }
    }

    function clearCache() {
      lsSet(CACHE_KEY, '');
      lsSet(SYNC_KEY, '');
      var ci = el('cfg-cache-info');
      if (ci) ci.textContent = 'Cleared';
      toast('Cache cleared', 'inf');
    }

    function updateCacheInfo() {
      var t = ls(SYNC_KEY);
      var ci = el('cfg-cache-info'),
        sl = el('cfg-last-sync');
      if (ci) {
        if (t) {
          try {
            ci.textContent = 'Cached ' + new Date(t).toLocaleString();
          } catch (e) {
            ci.textContent = 'Cached';
          }
        } else ci.textContent = 'No cache yet';
      }
      if (sl) {
        if (t) {
          try {
            sl.textContent = new Date(t).toLocaleString();
          } catch (e) {
            sl.textContent = '—';
          }
        } else sl.textContent = 'Never';
      }
    }

    // ════════════════════════════════════════════
    // ACCOUNT SYSTEM
    // ════════════════════════════════════════════
    function applyUserBadge() {
      var b = el('ubadge');
      if (!b) return;
      var label = CURRENT_USER + (readOnlyMode ? ' 👁' : '');
      if (CURRENT_USER) {
        b.textContent = label;
        b.style.display = '';
      } else b.style.display = 'none';
    }

    function setReadOnly(name) {
      readOnlyMode = true;
      document.body.classList.add('read-only');
      var rbn = el('ro-banner-name');
      if (rbn) rbn.textContent = name;
    }

    function exitReadOnly() {
      readOnlyMode = false;
      document.body.classList.remove('read-only');
    }

    function returnToMyAccount() {
      CURRENT_USER = MAIN_USER;
      exitReadOnly();
      applyUserBadge();
      loadData();
      toast('Back to your account.', 'ok');
    }

    function openAccountQuick() {
      var aqn = el('aq-name');
      if (aqn) aqn.textContent = MAIN_USER || '—';
      el('acct-quick-ovl').classList.add('open');
      // Show cached user list
      buildAccountUserList();
    }

    function buildAccountUserList(names) {
      var box = el('aq-user-list');
      if (!box) return;
      if (!names) names = cachedOtherUsers || [];
      if (!names.length) {
        box.innerHTML = '<div style="font-size:.75rem;color:var(--dim);text-align:center;padding:10px">' + (SCRIPT_URL ? 'Click ↻ to load accounts' : 'Connect your sheet in ⚙️') + '</div>';
        return;
      }
      box.innerHTML = '';
      names.forEach(function(name) {
        var item = document.createElement('div');
        item.className = 'user-item' + (name === CURRENT_USER ? ' current' : '');
        item.innerHTML = '<span class="user-item-name">' + esc(name) + (name === '📋 All Words' ? ' <span style="font-size:.62rem;color:var(--dim)">(global)</span>' : '') + '</span>';
        if (name === MAIN_USER) {
          var tag = document.createElement('span');
          tag.className = 'user-item-tag';
          tag.textContent = 'Active';
          item.appendChild(tag);
        } else {
          var btn = document.createElement('button');
          btn.className = 'user-view-btn';
          btn.textContent = '👁 View';
          btn.onclick = function() {
            viewAsUser(name);
            el('acct-quick-ovl').classList.remove('open');
          };
          item.appendChild(btn);
        }
        box.appendChild(item);
      });
    }

    var cachedOtherUsers = [];

    function fetchOtherUsers() {
      if (!SCRIPT_URL) {
        toast('Connect your sheet first.', 'err');
        return;
      }
      fetch(SCRIPT_URL + '?action=getAllUsers')
        .then(function(r) {
          return r.json();
        })
        .then(function(j) {
          if (!j.success) throw new Error(j.error || 'Failed');
          // Include "📋 All Words" as a viewable account + all user tabs
          var list = ['📋 All Words'].concat((j.users || []).filter(function(u) {
            return u !== MAIN_USER;
          }));
          cachedOtherUsers = list;
          buildCfgUserList(list);
        })
        .catch(function(err) {
          toast('Could not load users: ' + err.message, 'err');
        });
    }

    function fetchOtherUsersForPopup() {
      var btn = el('aq-refresh-btn');
      if (btn) btn.classList.add('loading');
      if (!SCRIPT_URL) {
        toast('Connect your sheet in ⚙️ first.', 'err');
        if (btn) btn.classList.remove('loading');
        return;
      }
      fetch(SCRIPT_URL + '?action=getAllUsers')
        .then(function(r) {
          return r.json();
        })
        .then(function(j) {
          if (btn) btn.classList.remove('loading');
          if (!j.success) throw new Error(j.error || 'Failed');
          var list = ['📋 All Words'].concat((j.users || []).filter(function(u) {
            return u !== MAIN_USER;
          }));
          cachedOtherUsers = list;
          buildAccountUserList(list);
        })
        .catch(function(err) {
          if (btn) btn.classList.remove('loading');
          toast('Failed: ' + err.message, 'err');
        });
    }

    function buildCfgUserList(names) {
      var box = el('cfg-user-list');
      if (!box) return;
      box.innerHTML = '';
      if (!names || !names.length) {
        box.innerHTML = '<div style="font-size:.75rem;color:var(--dim);text-align:center;padding:10px">No other accounts found.</div>';
        return;
      }
      names.forEach(function(name) {
        var item = document.createElement('div');
        item.className = 'user-item';
        item.innerHTML = '<span class="user-item-name">' + esc(name) + '</span>';
        var btn = document.createElement('button');
        btn.className = 'user-view-btn';
        btn.textContent = '👁 View';
        btn.onclick = function() {
          viewAsUser(name);
        };
        item.appendChild(btn);
        box.appendChild(item);
      });
    }

    function viewAsUser(name) {
      closeCfg();
      CURRENT_USER = name;
      setReadOnly(name);
      applyUserBadge();
      loadData();
      toast('Viewing ' + name + ' (read-only)', 'inf');
    }

    // ════════════════════════════════════════════
    // INIT
    // ════════════════════════════════════════════
    function init() {
      loadSettings();
      refreshAllCatDropdowns();
      buildReferencePages();
      updateCacheInfo();
      processPendingQueue();

      if (!MAIN_USER) {
        el('user-ovl').classList.add('open');
        setTimeout(function() {
          var ui = el('user-inp');
          if (ui) ui.focus();
        }, 100);
        setStatus('off', 'Not signed in');
      } else {
        CURRENT_USER = MAIN_USER;
        applyUserBadge();
        var cu = el('cfg-uname');
        if (cu) cu.textContent = MAIN_USER;
        if (S.offlineMode) loadFromCache();
        else if (SCRIPT_URL) {
          loadData();
          loadCategoriesFromSheet();
        } else setStatus('off', 'Not connected');
      }
    }

    el('user-inp').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') saveUser();
    });
    el('sset-new-name').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') createAndAddSet();
    });
    el('newcat-inp').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') addCustomCat();
    });

    // ════════════════════════════════════════════
    // USERNAME — 2-STEP FLOW
    // ════════════════════════════════════════════
    function saveUser() {
      var name = (el('user-inp').value || '').trim();
      if (!name) {
        toast('Please enter your name.', 'err');
        return;
      }
      MAIN_USER = name;
      CURRENT_USER = name;
      lsSet(MAINUSER_KEY, name);
      el('user-ovl').classList.remove('open');
      exitReadOnly();
      applyUserBadge();
      el('user-step2-ovl').classList.add('open');
    }

    function closeStep2() {
      el('user-step2-ovl').classList.remove('open');
      onboardComplete();
    }

    function closeStep2AndImport() {
      el('user-step2-ovl').classList.remove('open');
      openImportModal();
    }

    function onboardComplete() {
      if (SCRIPT_URL) {
        setStatus('spin-dot', 'Setting up…');
        fetch(SCRIPT_URL + '?action=getOrCreateUser&name=' + encodeURIComponent(MAIN_USER))
          .then(function(r) {
            return r.json();
          })
          .then(function(j) {
            toast(j.created ? 'Account created for ' + MAIN_USER + '!' : 'Welcome back, ' + MAIN_USER + '!', 'ok');
            loadData();
            loadCategoriesFromSheet();
          })
          .catch(function() {
            loadData();
          });
      } else {
        setStatus('off', 'Not connected');
        toast('Welcome, ' + MAIN_USER + '! Connect your sheet in ⚙️.', 'inf');
      }
    }

    // ════════════════════════════════════════════
    // CONFIG
    // ════════════════════════════════════════════
    function openCfg() {
      var cu = el('cfg-url');
      if (cu) cu.value = SCRIPT_URL;
      var cus = el('cfg-uname');
      if (cus) cus.textContent = MAIN_USER || '—';
      var cs = el('cfg-url-status');
      if (cs) cs.textContent = SCRIPT_URL ? 'Connected' : 'Not connected';
      updateCacheInfo();
      el('cfg-ovl').classList.add('open');
    }

    function closeCfg() {
      el('cfg-ovl').classList.remove('open');
    }

    function cfgBg(e) {
      if (e.target === el('cfg-ovl')) closeCfg();
    }

    function saveCfg() {
      var u = (el('cfg-url').value || '').trim();
      if (!u) {
        toast('Enter a URL.', 'err');
        return;
      }
      SCRIPT_URL = u;
      lsSet(URL_KEY, u);
      var cs = el('cfg-url-status');
      if (cs) cs.textContent = 'Connected';
      toast('Saved! Connecting…', 'inf');
      if (MAIN_USER) {
        fetch(SCRIPT_URL + '?action=getOrCreateUser&name=' + encodeURIComponent(MAIN_USER))
          .then(function(r) {
            return r.json();
          })
          .then(function() {
            loadData();
            loadCategoriesFromSheet();
          })
          .catch(function() {
            loadData();
          });
      } else loadData();
    }

    // ════════════════════════════════════════════
    // LOAD DATA
    // ════════════════════════════════════════════
    function loadData() {
      if (!SCRIPT_URL) {
        setStatus('off', 'Not connected');
        return;
      }
      if (S.offlineMode) {
        loadFromCache();
        return;
      }
      var sb = el('sync-btn');
      if (sb) sb.classList.add('spin-icon');
      setStatus('spin-dot', 'Syncing…');
      var user = CURRENT_USER || MAIN_USER;
      fetch(SCRIPT_URL + '?action=getData&user=' + encodeURIComponent(user))
        .then(function(r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function(json) {
          if (sb) sb.classList.remove('spin-icon');
          if (!json.success) throw new Error(json.error || 'Error');
          var d = json.data || {};
          allRows = d[user] || mergeAll(d);
          saveCache(allRows);
          setStatus('ok', allRows.length + ' words');
          render();
          renderFav();
          renderProgress();
        })
        .catch(function(err) {
          if (sb) sb.classList.remove('spin-icon');
          setStatus('err', 'Sync failed');
          toast('Sync failed: ' + err.message, 'err');
        });
    }

    function mergeAll(data) {
      var out = [],
        seen = {};
      Object.values(data).forEach(function(rows) {
        if (!Array.isArray(rows)) return;
        rows.forEach(function(r) {
          var k = (r.khmer || '') + '|' + (r.english || '');
          if (!seen[k]) {
            seen[k] = 1;
            out.push(r);
          }
        });
      });
      return out;
    }

    // ════════════════════════════════════════════
    // PENDING QUEUE (fire-and-forget add)
    // ════════════════════════════════════════════
    function processPendingQueue() {
      if (!SCRIPT_URL || !pendingQueue.length || importState.active) return;
      var item = pendingQueue[0];
      setStatus('spin-dot', 'Saving word…');
      var url = buildAddUrl(item);
      fetch(url)
        .then(function(r) {
          return r.json();
        })
        .then(function(j) {
          if (j.success) {
            pendingQueue.shift();
            savePendingQueue();
            if (pendingQueue.length > 0) {
              setStatus('spin-dot', 'Saving (' + pendingQueue.length + ' left)…');
              setTimeout(processPendingQueue, 300);
            } else {
              setStatus('ok', allRows.length + ' words');
            }
          }
        })
        .catch(function() {
          setStatus('err', 'Sync failed');
        });
    }

    function buildAddUrl(data) {
      var url = new URL(SCRIPT_URL);
      url.searchParams.set('action', 'addWord');
      ['english', 'khmer', 'romanization', 'notes', 'category', 'tab', 'user'].forEach(function(f) {
        url.searchParams.set(f, data[f] || '');
      });
      return url.toString();
    }

    // ════════════════════════════════════════════
    // NAV
    // ════════════════════════════════════════════
    function goPage(id, navId) {
      document.querySelectorAll('.page').forEach(function(p) {
        p.classList.remove('active');
      });
      el('page-' + id).classList.add('active');
      document.querySelectorAll('.nav button').forEach(function(b) {
        b.classList.remove('active');
      });
      el(navId).classList.add('active');
      if (id !== 'view') exitBulk();
    }

    // ════════════════════════════════════════════
    // SORT
    // ════════════════════════════════════════════
    function setQuickSort(mode) {
      quickSort = mode;
      sortCol = -1;
      document.querySelectorAll('.sort-chip').forEach(function(c) {
        c.classList.remove('active');
      });
      var sc = el('sc-' + mode);
      if (sc) sc.classList.add('active');
      render();
    }

    function clickSort(col) {
      if (sortCol === col) sortAsc = !sortAsc;
      else {
        sortCol = col;
        sortAsc = true;
      }
      quickSort = '';
      document.querySelectorAll('.sort-chip').forEach(function(c) {
        c.classList.remove('active');
      });
      updateSortTH();
      render();
    }

    function updateSortTH() {
      document.querySelectorAll('#tbl thead th').forEach(function(th, i) {
        th.classList.remove('sa', 'sd');
        if (i - 1 === sortCol) th.classList.add(sortAsc ? 'sa' : 'sd');
      });
    }

    function clickFavSort(col) {
      if (favSortCol === col) favSortAsc = !favSortAsc;
      else {
        favSortCol = col;
        favSortAsc = true;
      }
      renderFav();
    }

    // ════════════════════════════════════════════
    // BLUR
    // ════════════════════════════════════════════
    function toggleBlur(which) {
      document.querySelectorAll('td.peeked').forEach(function(td) {
        td.classList.remove('peeked');
      });
      blurMode = (blurMode === which) ? '' : which;
      var tbl = el('tbl');
      if (!tbl) return;
      tbl.classList.remove('blur-en', 'blur-kh');
      if (blurMode === 'en') tbl.classList.add('blur-en');
      if (blurMode === 'kh') tbl.classList.add('blur-kh');
      var be = el('btn-en'),
        bk = el('btn-kh');
      if (be) be.classList.toggle('active', blurMode === 'en');
      if (bk) bk.classList.toggle('active', blurMode === 'kh');
    }

    // ════════════════════════════════════════════
    // BULK EDIT
    // ════════════════════════════════════════════
    function toggleBulk() {
      if (bulkMode) exitBulk();
      else enterBulk();
    }

    function enterBulk() {
      bulkMode = true;
      selectedKeys.clear();
      document.body.classList.add('bulk-mode');
      var bs = el('btn-sel');
      if (bs) bs.classList.add('sel-active');
      updateBulkBar();
      render();
    }

    function exitBulk() {
      bulkMode = false;
      selectedKeys.clear();
      document.body.classList.remove('bulk-mode');
      var bs = el('btn-sel');
      if (bs) bs.classList.remove('sel-active');
      var sa = el('sel-all');
      if (sa) sa.checked = false;
      render();
    }

    function updateBulkBar() {
      var bi = el('bulk-info');
      if (bi) bi.textContent = selectedKeys.size + ' selected';
    }

    function selectAll(checked) {
      var rows = getRows();
      selectedKeys.clear();
      if (checked) rows.forEach(function(r) {
        selectedKeys.add(wordKey(r));
      });
      updateBulkBar();
      render();
    }

    function bulkFav() {
      if (!selectedKeys.size) {
        toast('Select some entries first.', 'err');
        return;
      }
      var added = 0;
      selectedKeys.forEach(function(k) {
        if (!favorites.has(k)) {
          favorites.add(k);
          added++;
        } else favorites.delete(k);
      });
      saveFavorites();
      toast(added > 0 ? added + ' starred' : 'Unstarred selected', 'ok');
      render();
      renderFav();
    }

    function openBulkCat() {
      if (!selectedKeys.size) {
        toast('Select some entries first.', 'err');
        return;
      }
      populateCatDropdown('bulkcat-sel', false, 'Words');
      var bc = el('bulkcat-count');
      if (bc) bc.textContent = selectedKeys.size;
      el('bulkcat-ovl').classList.add('open');
    }

    function applyBulkCat() {
      var cat = (el('bulkcat-sel') || {}).value || 'Words';
      var keys = Array.from(selectedKeys);
      keys.forEach(function(k) {
        var r = allRows.find(function(r) {
          return wordKey(r) === k;
        });
        if (r) r.category = cat;
      });
      el('bulkcat-ovl').classList.remove('open');
      toast('Category updated for ' + keys.length + ' entries — syncing…', 'ok');
      saveCache(allRows);
      if (SCRIPT_URL) {
        // Batch update - send all in sequence (fire-and-forget each)
        keys.forEach(function(k) {
          var r = allRows.find(function(r) {
            return wordKey(r) === k;
          });
          if (r && r.rowIndex > 0) {
            var url = new URL(SCRIPT_URL);
            url.searchParams.set('action', 'updateWord');
            ['english', 'khmer', 'romanization', 'notes', 'category', 'rowIndex'].forEach(function(f) {
              url.searchParams.set(f, r[f] || '');
            });
            url.searchParams.set('tab', CURRENT_USER || MAIN_USER);
            url.searchParams.set('user', CURRENT_USER || MAIN_USER);
            fetch(url.toString()).catch(function() {});
          }
        });
      }
      exitBulk();
      render();
    }

    function bulkDelete() {
      if (!selectedKeys.size) {
        toast('Select some entries first.', 'err');
        return;
      }
      if (!confirm('Delete ' + selectedKeys.size + ' entries? This cannot be undone.')) return;
      var toDelete = allRows.filter(function(r) {
        return selectedKeys.has(wordKey(r));
      });
      allRows = allRows.filter(function(r) {
        return !selectedKeys.has(wordKey(r));
      });
      toDelete.forEach(function(r) {
        favorites.delete(wordKey(r));
      });
      saveFavorites();
      if (SCRIPT_URL) {
        toDelete.forEach(function(r) {
          if (r.rowIndex > 0) {
            var url = new URL(SCRIPT_URL);
            url.searchParams.set('action', 'deleteWord');
            url.searchParams.set('tab', CURRENT_USER || MAIN_USER);
            url.searchParams.set('rowIndex', r.rowIndex);
            fetch(url.toString()).catch(function() {});
          }
        });
      }
      toast(toDelete.length + ' entries deleted', 'ok');
      exitBulk();
      render();
      renderFav();
      renderProgress();
    }

    // ════════════════════════════════════════════
    // FAVOURITES
    // ════════════════════════════════════════════
    function toggleFav(r) {
      var k = wordKey(r);
      if (favorites.has(k)) favorites.delete(k);
      else favorites.add(k);
      saveFavorites();
    }

    function toggleEditStar() {
      if (!editRow) return;
      toggleFav(editRow);
      var btn = el('sheet-star');
      if (btn) btn.classList.toggle('fav', isFav(editRow));
      render();
      renderFav();
    }

    function renderFav() {
      var q = ((el('fq') || {}).value || '').trim().toLowerCase();
      var rows = allRows.filter(function(r) {
        return isFav(r);
      });
      if (q) rows = rows.filter(function(r) {
        return ((r.english || '') + (r.khmer || '') + (r.romanization || '') + (r.notes || '')).toLowerCase().indexOf(q) !== -1;
      });
      if (favSortCol >= 0) {
        var flds = ['english', 'khmer', 'romanization', 'notes', 'category'];
        var f = flds[favSortCol];
        rows.sort(function(a, b) {
          var va = (a[f] || '').toLowerCase(),
            vb = (b[f] || '').toLowerCase();
          if (!va && vb) return 1;
          if (va && !vb) return -1;
          return favSortAsc ? (va < vb ? -1 : va > vb ? 1 : 0) : (va < vb ? 1 : va > vb ? -1 : 0);
        });
      }
      var tbody = el('fav-tbody');
      if (!tbody) return;
      tbody.innerHTML = '';
      rows.forEach(function(r) {
        var tr = document.createElement('tr');
        addRowHandlers(tr, r);
        var ten = mkTd('col-en en-cell', '');
        ten.innerHTML = (q ? hlText(r.english || '', q) : esc(r.english || ''));
        var tkh = mkTd('col-kh kh-cell kh', '');
        tkh.innerHTML = (q ? hlText(r.khmer || '', q) : esc(r.khmer || ''));
        var tro = mkTd('col-ro ro-cell', '');
        tro.innerHTML = (q ? hlText(r.romanization || '', q) : esc(r.romanization || ''));
        var tno = mkTd('col-no no-cell', r.notes || '');
        var tca = mkTd('col-ca', '');
        var bdg = document.createElement('span');
        bdg.className = 'badge ' + bCls(r.category);
        bdg.textContent = r.category || '—';
        tca.appendChild(bdg);
        [ten, tkh, tro, tno, tca].forEach(function(td) {
          addCellHandlers(td);
        });
        tr.appendChild(ten);
        tr.appendChild(tkh);
        tr.appendChild(tro);
        tr.appendChild(tno);
        tr.appendChild(tca);
        tbody.appendChild(tr);
      });
      var fe = el('fav-empty');
      if (fe) fe.style.display = rows.length === 0 ? 'block' : 'none';
    }

    // ════════════════════════════════════════════
    // VISIBLE ROWS
    // ════════════════════════════════════════════
    function getRows() {
      var q = ((el('q') || {}).value || '').trim().toLowerCase();
      var cat = ((el('view-cat-filter') || {}).value) || 'All';
      var rows = allRows.slice();
      if (cat === 'All') {} else if (cat === '__nosent__') rows = rows.filter(function(r) {
        return (r.category || '') !== 'Sentences';
      });
      else rows = rows.filter(function(r) {
        return r.category === cat;
      });
      if (q) rows = rows.filter(function(r) {
        return ((r.english || '') + (r.khmer || '') + (r.romanization || '') + (r.notes || '') + (r.category || '')).toLowerCase().indexOf(q) !== -1;
      });
      if (quickSort === 'date') {
        rows.sort(function(a, b) {
          var da = a.dateAdded || '',
            db = b.dateAdded || '';
          if (!da && db) return 1;
          if (da && !db) return -1;
          return da < db ? 1 : da > db ? -1 : 0;
        });
      } else if (sortCol >= 0) {
        var flds = ['english', 'khmer', 'romanization', 'notes', 'category'];
        var f = flds[sortCol];
        rows.sort(function(a, b) {
          var va = (a[f] || '').toLowerCase(),
            vb = (b[f] || '').toLowerCase();
          if (!va && vb) return 1;
          if (va && !vb) return -1;
          return sortAsc ? (va < vb ? -1 : va > vb ? 1 : 0) : (va < vb ? 1 : va > vb ? -1 : 0);
        });
      }
      return rows;
    }

    // ════════════════════════════════════════════
    // RENDER TABLE
    // ════════════════════════════════════════════
    function render() {
      var rows = getRows();
      var q = S.highlight ? ((el('q') || {}).value || '').trim().toLowerCase() : '';
      var tbody = el('tbody');
      if (!tbody) return;
      tbody.innerHTML = '';
      rows.forEach(function(r) {
        var k = wordKey(r);
        var tr = document.createElement('tr');
        if (selectedKeys.has(k)) tr.classList.add('selected');
        addRowHandlers(tr, r);
        var tsel = mkTd('col-sel', '');
        var chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.className = 'row-chk';
        chk.checked = selectedKeys.has(k);
        chk.addEventListener('change', function(e) {
          e.stopPropagation();
          if (chk.checked) selectedKeys.add(k);
          else selectedKeys.delete(k);
          tr.classList.toggle('selected', chk.checked);
          updateBulkBar();
        });
        tsel.appendChild(chk);
        var ten = mkTd('col-en en-cell', '');
        var star = document.createElement('span');
        star.className = 'row-star' + (isFav(r) ? ' fav' : '');
        star.textContent = '★ ';
        star.onclick = function(e) {
          e.stopPropagation();
          toggleFav(r);
          star.className = 'row-star' + (isFav(r) ? ' fav' : '');
          renderFav();
        };
        ten.appendChild(star);
        var enSpan = document.createElement('span');
        enSpan.innerHTML = q ? hlText(r.english || '', q) : esc(r.english || '');
        ten.appendChild(enSpan);
        var tkh = mkTd('col-kh kh-cell kh', '');
        tkh.innerHTML = q ? hlText(r.khmer || '', q) : esc(r.khmer || '');
        var tro = mkTd('col-ro ro-cell', '');
        tro.innerHTML = q ? hlText(r.romanization || '', q) : esc(r.romanization || '');
        var tno = mkTd('col-no no-cell', '');
        var notes = r.notes || '';
        if (notes.length > 55) {
          tno.innerHTML = '<span class="note-short">' + esc(notes.slice(0, 55)) + '…</span><span class="note-full" style="display:none;white-space:normal">' + (q ? hlText(notes, q) : esc(notes)) + '</span> <button class="note-btn" onclick="expandNote(event,this)">▾</button>';
        } else {
          tno.innerHTML = q ? hlText(notes, q) : esc(notes);
        }
        var tca = mkTd('col-ca', '');
        var bdg = document.createElement('span');
        bdg.className = 'badge ' + bCls(r.category);
        bdg.textContent = r.category || '—';
        tca.appendChild(bdg);
        var tdt = mkTd('col-dt dt-cell', r.dateAdded || '');
        [ten, tkh, tro, tno, tca, tdt].forEach(function(td) {
          addCellHandlers(td);
        });
        tr.appendChild(tsel);
        tr.appendChild(ten);
        tr.appendChild(tkh);
        tr.appendChild(tro);
        tr.appendChild(tno);
        tr.appendChild(tca);
        tr.appendChild(tdt);
        tbody.appendChild(tr);
      });
      var emp = el('empty');
      if (emp) emp.style.display = rows.length === 0 ? 'block' : 'none';
      var emm = el('empty-msg');
      if (emm) emm.textContent = allRows.length === 0 ? 'Add some words or if you have already, make sure your name is correct and Tap ↻ to sync, or ⚙️ to connect.' : 'No entries match.';
      var bar = el('bar');
      if (bar) {
        var cv = (el('view-cat-filter') || {}).value || 'All';
        var lbl = cv === 'All' ? '' : (cv === '__nosent__' ? ' · All exc. Sentences' : ' · ' + cv);
        bar.textContent = 'Showing ' + rows.length + ' of ' + allRows.length + ' entries' + lbl;
      }
    }

    function mkTd(cls, txt) {
      var td = document.createElement('td');
      if (cls) td.className = cls;
      if (txt) td.textContent = txt;
      return td;
    }

    // ════════════════════════════════════════════
    // ROW / CELL HANDLERS
    // ════════════════════════════════════════════
    function addRowHandlers(tr, row) {
      var timer = null,
        didLong = false;

      function onStart() {
        didLong = false;
        timer = setTimeout(function() {
          didLong = true;
          openEditSheet(row);
        }, 520);
      }

      function onCancel() {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      }
      tr.addEventListener('touchstart', onStart, {
        passive: true
      });
      tr.addEventListener('touchmove', onCancel, {
        passive: true
      });
      tr.addEventListener('touchend', onCancel);
      tr.addEventListener('mousedown', onStart);
      tr.addEventListener('mouseup', onCancel);
      tr.addEventListener('mouseleave', onCancel);
      tr._didLong = function() {
        return didLong;
      };
      tr._clearLong = function() {
        didLong = false;
      };
    }

    function addCellHandlers(td) {
      td.addEventListener('click', function() {
        var tr = td.parentElement;
        if (bulkMode) {
          var chk = tr.querySelector('.row-chk');
          if (chk) {
            chk.checked = !chk.checked;
            chk.dispatchEvent(new Event('change'));
          }
          return;
        }
        if (tr._didLong && tr._didLong()) {
          tr._clearLong();
          return;
        }
        if (isCellBlurred(td)) {
          td.classList.toggle('peeked');
          return;
        }
        var nb = td.querySelector('.note-btn');
        if (nb) {
          expandNote({
            stopPropagation: function() {}
          }, nb);
          return;
        }
        if (td.classList.contains('expanded')) td.classList.remove('expanded');
        else if (td.scrollWidth > td.clientWidth + 2) td.classList.add('expanded');
      });
    }

    function isCellBlurred(td) {
      if (!blurMode || td.classList.contains('peeked')) return false;
      if (blurMode === 'en') return td.classList.contains('col-en') || td.classList.contains('col-ro') || td.classList.contains('col-no') || td.classList.contains('col-ca');
      if (blurMode === 'kh') return td.classList.contains('col-kh') || td.classList.contains('col-ro') || td.classList.contains('col-no') || td.classList.contains('col-ca');
      return false;
    }

    function expandNote(e, btn) {
      e.stopPropagation();
      var td = btn.parentElement,
        sh = td.querySelector('.note-short'),
        fu = td.querySelector('.note-full');
      if (!sh || !fu) return;
      var open = fu.style.display !== 'none';
      sh.style.display = open ? '' : 'none';
      fu.style.display = open ? 'none' : '';
      btn.textContent = open ? '▾' : '▴';
      td.classList.toggle('expanded', !open);
    }

    // ════════════════════════════════════════════
    // EDIT SHEET
    // ════════════════════════════════════════════
    function openEditSheet(row) {
      editRow = row;
      var een = el('e-en'),
        ekh = el('e-kh'),
        ero = el('e-ro'),
        eno = el('e-no');
      if (een) een.value = row.english || '';
      if (ekh) ekh.value = row.khmer || '';
      if (ero) ero.value = row.romanization || '';
      if (eno) eno.value = row.notes || '';
      populateCatDropdown('e-cat', false, row.category || 'Words');
      var starBtn = el('sheet-star');
      if (starBtn) starBtn.classList.toggle('fav', isFav(row));
      el('sovl').classList.add('open');
    }

    function closeSheet() {
      el('sovl').classList.remove('open');
      editRow = null;
    }

    function sovlBg(e) {
      if (e.target === el('sovl')) closeSheet();
    }

    function saveEdit() {
      if (!editRow) return;
      if (readOnlyMode) {
        toast('Read-only mode.', 'err');
        return;
      }
      if (!SCRIPT_URL) {
        toast('Connect your sheet in ⚙️ first.', 'err');
        return;
      }
      var cat = (el('e-cat') || {}).value || 'Words';
      var data = {
        english: (el('e-en').value || '').trim(),
        khmer: (el('e-kh').value || '').trim(),
        romanization: (el('e-ro').value || '').trim(),
        notes: (el('e-no').value || '').trim(),
        category: cat,
        rowIndex: editRow.rowIndex,
        tab: CURRENT_USER || MAIN_USER,
        user: CURRENT_USER || MAIN_USER
      };
      setEditBusy(true);
      setStatus('spin-dot', 'Saving…');
      var url = new URL(SCRIPT_URL);
      url.searchParams.set('action', 'updateWord');
      Object.keys(data).forEach(function(k) {
        url.searchParams.set(k, data[k]);
      });
      fetch(url.toString()).then(function(r) {
        return r.json();
      }).then(function(json) {
        setEditBusy(false);
        if (!json.success) throw new Error(json.error || 'Failed');
        Object.assign(editRow, data);
        setStatus('ok', allRows.length + ' words');
        toast('Saved ✓', 'ok');
        closeSheet();
        loadData();
      }).catch(function(err) {
        setEditBusy(false);
        setStatus('err', 'Save failed');
        toast('Save failed: ' + err.message, 'err');
      });
    }

    function deleteEntry() {
      if (!editRow) return;
      if (readOnlyMode) {
        toast('Read-only mode.', 'err');
        return;
      }
      if (!confirm('Delete "' + (editRow.english || editRow.khmer) + '"? Cannot be undone.')) return;
      if (!SCRIPT_URL) {
        allRows = allRows.filter(function(r) {
          return wordKey(r) !== wordKey(editRow);
        });
        favorites.delete(wordKey(editRow));
        saveFavorites();
        closeSheet();
        render();
        renderFav();
        renderProgress();
        return;
      }
      setEditBusy(true);
      setStatus('spin-dot', 'Deleting…');
      var url = new URL(SCRIPT_URL);
      url.searchParams.set('action', 'deleteWord');
      url.searchParams.set('tab', CURRENT_USER || MAIN_USER);
      url.searchParams.set('rowIndex', editRow.rowIndex);
      fetch(url.toString()).then(function(r) {
        return r.json();
      }).then(function(json) {
        setEditBusy(false);
        if (!json.success) throw new Error(json.error || 'Failed');
        allRows = allRows.filter(function(r) {
          return wordKey(r) !== wordKey(editRow);
        });
        favorites.delete(wordKey(editRow));
        saveFavorites();
        setStatus('ok', allRows.length + ' words');
        toast('Deleted', 'ok');
        closeSheet();
        loadData();
      }).catch(function(err) {
        setEditBusy(false);
        setStatus('err', 'Error');
        toast('Delete failed: ' + err.message, 'err');
      });
    }

    function setEditBusy(v) {
      var btn = el('edit-btn'),
        lbl = el('edit-lbl'),
        sp = el('edit-spin');
      if (btn) btn.disabled = v;
      if (lbl) lbl.style.display = v ? 'none' : '';
      if (sp) sp.style.display = v ? '' : 'none';
    }

    // ════════════════════════════════════════════
    // ADD ENTRY — fire-and-forget with queue
    // ════════════════════════════════════════════
    function submitAdd(e) {
      e.preventDefault();
      if (readOnlyMode) {
        toast('Read-only mode.', 'err');
        return;
      }
      var en = (el('f-en').value || '').trim();
      var kh = (el('f-kh').value || '').trim();
      if (!SCRIPT_URL) {
        toast('Connect your sheet in ⚙️ first.', 'err');
        return;
      }
      // Prevent exact-duplicate queue entries (same en + kh)
      var alreadyQueued = pendingQueue.some(function(q) {
        return q.english === en && q.khmer === kh;
      });
      if (alreadyQueued) {
        toast('Already queued — it will sync shortly!', 'inf');
        return;
      }
      var ro = (el('f-ro').value || '').trim();
      var no = (el('f-no').value || '').trim();
      var cat = (el('f-cat') || {}).value || 'Words';
      var item = {
        english: en,
        khmer: kh,
        romanization: ro,
        notes: no,
        category: cat,
        tab: CURRENT_USER || MAIN_USER,
        user: CURRENT_USER || MAIN_USER
      };
      // Optimistic: add to local view immediately
      var optRow = Object.assign({}, item, {
        dateAdded: new Date().toISOString().slice(0, 16).replace('T', ' '),
        rowIndex: 0
      });
      allRows.unshift(optRow);
      saveCache(allRows);
      // Clear form right away — safe to add another
      el('add-form').reset();
      populateCatDropdown('f-cat', false, 'Words');
      var notice = el('add-notice');
      if (notice) {
        notice.style.display = 'block';
        setTimeout(function() {
          notice.style.display = 'none';
        }, 3000);
      }
      render();
      renderFav();
      renderProgress();
      toast('Sending in background… safe to add more! ✓', 'inf');
      // Fire-and-forget
      pendingQueue.push(item);
      savePendingQueue();
      processPendingQueue();
    }

    // ════════════════════════════════════════════
    // SRS
    // ════════════════════════════════════════════
    function saveSrs() {
      lsSet(SRS_KEY, JSON.stringify(srsData));
    }

    function getSrsEntry(k) {
      if (!srsData[k]) srsData[k] = {
        interval: 0,
        reps: 0,
        ease: 2.5,
        nextReview: null
      };
      return srsData[k];
    }

    function updateSrs(k, rating) {
      var d = getSrsEntry(k),
        now = Date.now();
      if (rating === 0) {
        d.reps = 0;
        d.interval = 0;
        d.nextReview = now;
      } else if (rating === 1) {
        d.reps = Math.max(0, d.reps - 1);
        d.interval = 1;
        d.nextReview = now + 86400000;
      } else {
        d.reps++;
        if (d.reps === 1) d.interval = 1;
        else if (d.reps === 2) d.interval = 3;
        else d.interval = Math.round(d.interval * d.ease);
        d.nextReview = now + d.interval * 86400000;
      }
      srsData[k] = d;
      saveSrs();
    }

    function isSrsDue(k) {
      var d = srsData[k];
      if (!d || d.nextReview === null) return true;
      return Date.now() >= d.nextReview;
    }

    function countDue() {
      return allRows.filter(function(r) {
        return isSrsDue(wordKey(r));
      }).length;
    }

    // ════════════════════════════════════════════
    // STUDY / FLASHCARDS
    // ════════════════════════════════════════════
    var studyDeck = [],
      studyIdx = 0,
      cardFlipped = false,
      sessionK = 0,
      sessionM = 0,
      sessionU = 0;

    function toggleStudyDir() {
      studyDir = (studyDir === 'kh' ? 'en' : 'kh');
      updateDirBtn();
      showCard();
    }

    function updateDirBtn() {
      var btn = el('study-dir-btn');
      if (btn) btn.textContent = studyDir === 'kh' ? 'KH → EN' : 'EN → KH';
    }

    function initStudy() {
      populateStudyFilter();
      updateDirBtn();
      var filter = (el('study-filter') || {}).value || 'All';
      var len = parseInt((el('study-len') || {}).value) || 20;
      var pool = allRows.slice();
      if (filter === '__fav__') pool = pool.filter(function(r) {
        return isFav(r);
      });
      else if (filter === '__nosent__') pool = pool.filter(function(r) {
        return (r.category || '') !== 'Sentences';
      });
      else if (filter === '__weak__') pool = pool.filter(function(r) {
        var c = confidence[wordKey(r)];
        return c === 0 || c === undefined;
      });
      else if (filter === '__due__') pool = pool.filter(function(r) {
        return isSrsDue(wordKey(r));
      });
      else if (filter.indexOf('set:') === 0) {
        var sid = filter.slice(4);
        var sset = studySets.find(function(s) {
          return s.id === sid;
        });
        if (sset) pool = pool.filter(function(r) {
          return sset.keys.indexOf(wordKey(r)) !== -1;
        });
        else pool = [];
      } else if (filter !== 'All') pool = pool.filter(function(r) {
        return r.category === filter;
      });
      if (S.srs) {
        pool.sort(function(a, b) {
          var ad = isSrsDue(wordKey(a)) ? 0 : 1,
            bd = isSrsDue(wordKey(b)) ? 0 : 1;
          if (ad !== bd) return ad - bd;
          return Math.random() - .5;
        });
      } else {
        pool.sort(function() {
          return Math.random() - .5;
        });
      }
      studyDeck = pool.slice(0, len);
      studyIdx = 0;
      cardFlipped = false;
      sessionK = 0;
      sessionM = 0;
      sessionU = 0;
      var ss = el('session-summary'),
        sn = el('study-nav'),
        se = el('study-empty'),
        fc = el('flashcard');
      if (ss) ss.style.display = 'none';
      if (sn) sn.style.display = 'flex';
      if (se) se.style.display = studyDeck.length === 0 ? 'block' : 'none';
      if (fc) fc.style.display = studyDeck.length === 0 ? 'none' : 'flex';
      if (studyDeck.length > 0) showCard();
    }

    function showCard() {
      var r = studyDeck[studyIdx];
      if (!r) return;
      cardFlipped = false;
      var cb = el('conf-btns'),
        sn = el('study-nav');
      if (cb) cb.style.display = 'none';
      if (sn) sn.style.display = 'flex';
      var k = wordKey(r),
        srsBadge = '';
      if (S.srs) {
        var se = srsData[k];
        if (!se || se.nextReview === null) srsBadge = '<span class="srs-badge srs-new">New</span>';
        else if (isSrsDue(k)) srsBadge = '<span class="srs-badge srs-due">Due</span>';
        else srsBadge = '<span class="srs-badge srs-review">Review</span>';
      }
      var cfb = el('fc-conf-badge');
      if (cfb) {
        var cf = confidence[k];
        if (cf !== undefined) {
          cfb.style.display = '';
          cfb.className = 'fc-conf-badge' + (cf === 2 ? ' conf-k-bg' : cf === 1 ? ' conf-m-bg' : ' conf-u-bg');
          cfb.textContent = cf === 2 ? '✓ Know' : cf === 1 ? '~ Kinda' : '✗ Unknown';
        } else cfb.style.display = 'none';
      }
      var cbdg = el('fc-badge');
      if (cbdg) cbdg.innerHTML = '<span class="badge ' + bCls(r.category) + '">' + esc(r.category || '—') + '</span>';
      var html = '';
      if (studyDir === 'kh') {
        html += srsBadge + '<div class="fc-kh kh">' + esc(r.khmer || '?') + '</div><div class="fc-hint">Tap to reveal English</div>';
      } else {
        html += srsBadge + '<div class="fc-en">' + esc(r.english || '?') + '</div><div class="fc-hint">Tap to reveal Khmer</div>';
      }
      var fcc = el('fc-content');
      if (fcc) fcc.innerHTML = html;
      var pct = studyDeck.length ? Math.round(studyIdx / studyDeck.length * 100) : 0;
      var spf = el('spf');
      if (spf) spf.style.width = pct + '%';
      var sp = el('study-prog');
      if (sp) sp.textContent = (studyIdx + 1) + ' / ' + studyDeck.length;
    }

    function flipCard() {
      if (cardFlipped) return;
      cardFlipped = true;
      var r = studyDeck[studyIdx];
      if (!r) return;
      var k = wordKey(r),
        srsBadge = '';
      if (S.srs) {
        var se = srsData[k];
        if (!se || se.nextReview === null) srsBadge = '<span class="srs-badge srs-new">New</span>';
        else if (isSrsDue(k)) srsBadge = '<span class="srs-badge srs-due">Due</span>';
        else srsBadge = '<span class="srs-badge srs-review">Review</span>';
      }
      var html = srsBadge;
      if (studyDir === 'kh') {
        html += '<div class="fc-kh kh">' + esc(r.khmer || '') + '</div><div class="fc-en">' + esc(r.english || '') + '</div>';
        if (S.studyRo && r.romanization) html += '<div class="fc-ro">' + esc(r.romanization) + '</div>';
      } else {
        html += '<div class="fc-en">' + esc(r.english || '') + '</div><div class="fc-kh kh">' + esc(r.khmer || '') + '</div>';
        if (S.studyRo && r.romanization) html += '<div class="fc-ro">' + esc(r.romanization) + '</div>';
      }
      if (r.notes) html += '<div class="fc-no">' + esc(r.notes) + '</div>';
      var fcc = el('fc-content');
      if (fcc) fcc.innerHTML = html;
      var cb = el('conf-btns');
      if (cb) cb.style.display = 'flex';
      var sn = el('study-nav');
      if (sn) sn.style.display = 'none';
    }

    function rateCard(rating) {
      var r = studyDeck[studyIdx];
      if (!r) return;
      var k = wordKey(r);
      confidence[k] = rating;
      lsSet(CONF_KEY, JSON.stringify(confidence));
      if (S.srs) updateSrs(k, rating);
      if (rating === 2) sessionK++;
      else if (rating === 1) sessionM++;
      else sessionU++;
      if (rating === 0 && S.srs && studyDeck.length < 50) studyDeck.push(r);
      nextCard();
    }

    function prevCard() {
      if (studyIdx > 0) {
        studyIdx--;
        showCard();
      }
    }

    function nextCard() {
      if (studyIdx < studyDeck.length - 1) {
        studyIdx++;
        showCard();
      } else showSessionSummary();
    }

    function studyWeak() {
      if (el('study-filter')) el('study-filter').value = '__weak__';
      initStudy();
    }

    function showSessionSummary() {
      var fc = el('flashcard'),
        sn = el('study-nav'),
        cb = el('conf-btns'),
        ss = el('session-summary');
      if (fc) fc.style.display = 'none';
      if (sn) sn.style.display = 'none';
      if (cb) cb.style.display = 'none';
      if (ss) ss.style.display = 'block';
      var ssk = el('ss-k'),
        ssm = el('ss-m'),
        ssu = el('ss-u');
      if (ssk) ssk.textContent = sessionK;
      if (ssm) ssm.textContent = sessionM;
      if (ssu) ssu.textContent = sessionU;
      var swb = el('ss-weak-btn');
      if (swb) swb.style.display = sessionU > 0 ? 'flex' : 'none';
    }

    // ════════════════════════════════════════════
    // PROGRESS
    // ════════════════════════════════════════════
    function renderProgress() {
      var total = allRows.length;
      var favCount = 0;
      allRows.forEach(function(r) {
        if (isFav(r)) favCount++;
      });
      var mastered = 0;
      allRows.forEach(function(r) {
        if (confidence[wordKey(r)] === 2) mastered++;
      });
      var studiedCount = 0;
      allRows.forEach(function(r) {
        if (confidence[wordKey(r)] !== undefined) studiedCount++;
      });

      function sv(id, v) {
        var e = el(id);
        if (e) e.textContent = v;
      }
      sv('pg-total', total);
      sv('pg-fav', favCount);
      sv('pg-mastered', mastered);
      sv('pg-due', countDue());
      sv('pg-studied', studiedCount);
      sv('pg-sets', studySets.length);
      var knew = 0,
        kinda = 0,
        unkn = 0,
        unstudied = 0;
      allRows.forEach(function(r) {
        var v = confidence[wordKey(r)];
        if (v === 2) knew++;
        else if (v === 1) kinda++;
        else if (v === 0) unkn++;
        else unstudied++;
      });
      sv('pg-knew', knew);
      sv('pg-kinda', kinda);
      sv('pg-unkn', unkn);
      sv('pg-unstudied', unstudied);
      // Milestones — Words Added
      function buildMilestoneShelf(shelfId, count, milestones) {
        var shelf = el(shelfId);
        if (!shelf) return;
        shelf.innerHTML = '';
        milestones.forEach(function(m) {
          var card = document.createElement('div');
          card.className = 'ms-card' + (count >= m.n ? ' unlocked' : '');
          card.innerHTML = '<div class="ms-icon">' + m.icon + '</div><div class="ms-name">' + m.name + '</div><div class="ms-req">' + (count >= m.n ? '✓' : m.n + ' words') + '</div>';
          shelf.appendChild(card);
        });
      }
      buildMilestoneShelf('milestone-shelf-add', total, MILESTONES_ADD);
      buildMilestoneShelf('milestone-shelf-study', studiedCount, MILESTONES_STUDY);
      // Category bars
      var bars = el('pg-cat-bars');
      if (bars) {
        bars.innerHTML = '';
        var cats = {};
        allRows.forEach(function(r) {
          var c = r.category || '?';
          cats[c] = (cats[c] || 0) + 1;
        });
        var t2 = total || 1;
        Object.keys(cats).forEach(function(cat) {
          var pct = Math.round(cats[cat] / t2 * 100);
          var row = document.createElement('div');
          row.className = 'cat-row';
          row.innerHTML = '<div class="cat-row-top"><span>' + esc(cat) + '</span><span>' + cats[cat] + ' (' + pct + '%)</span></div><div class="cat-bar-bg"><div class="cat-bar-fill" style="width:' + pct + '%"></div></div>';
          bars.appendChild(row);
        });
        if (!Object.keys(cats).length) bars.innerHTML = '<div style="font-size:.78rem;color:var(--dim)">No data yet.</div>';
      }
      // Study sets
      var ssets = el('pg-study-sets');
      if (ssets) {
        ssets.innerHTML = '';
        if (!studySets.length) {
          ssets.innerHTML = '<div style="font-size:.78rem;color:var(--dim)">No study sets yet. Use Select → 📚 Study Set on the View page.</div>';
        } else {
          studySets.forEach(function(s) {
            var row = document.createElement('div');
            row.className = 'cat-row';
            row.innerHTML = '<div class="cat-row-top"><span>📚 ' + esc(s.name) + '</span><span>' + s.keys.length + ' words</span></div>';
            ssets.appendChild(row);
          });
        }
      }
      // Heatmap
      var hm = el('heatmap');
      if (hm) {
        hm.innerHTML = '';
        var today = new Date(),
          dc = {};
        allRows.forEach(function(r) {
          if (r.dateAdded) {
            var d = String(r.dateAdded).slice(0, 10);
            dc[d] = (dc[d] || 0) + 1;
          }
        });
        for (var i = 27; i >= 0; i--) {
          var d2 = new Date(today);
          d2.setDate(d2.getDate() - i);
          var key = d2.toISOString().slice(0, 10);
          var cnt = dc[key] || 0;
          var cell = document.createElement('div');
          cell.className = 'hm-cell' + (cnt === 0 ? '' : cnt < 3 ? ' hm1' : cnt < 7 ? ' hm2' : ' hm3');
          cell.title = key + ': ' + cnt + ' words';
          hm.appendChild(cell);
        }
      }
    }

    // ════════════════════════════════════════════
    // REFERENCE PAGE
    // ════════════════════════════════════════════
    function buildReferencePages() {
      var allCons = [{
        kh: 'ក',
        ro: 'k',
        s: 1
      }, {
        kh: 'ខ',
        ro: 'kh',
        s: 1
      }, {
        kh: 'គ',
        ro: 'k/g',
        s: 2
      }, {
        kh: 'ឃ',
        ro: 'kh',
        s: 2
      }, {
        kh: 'ង',
        ro: 'ng',
        s: 2
      }, {
        kh: 'ច',
        ro: 'ch',
        s: 1
      }, {
        kh: 'ឆ',
        ro: 'chh',
        s: 1
      }, {
        kh: 'ជ',
        ro: 'ch/j',
        s: 2
      }, {
        kh: 'ឈ',
        ro: 'chh',
        s: 2
      }, {
        kh: 'ញ',
        ro: 'ny',
        s: 2
      }, {
        kh: 'ដ',
        ro: 'd',
        s: 1
      }, {
        kh: 'ឋ',
        ro: 'th',
        s: 1
      }, {
        kh: 'ឌ',
        ro: 'd',
        s: 2
      }, {
        kh: 'ឍ',
        ro: 'th',
        s: 2
      }, {
        kh: 'ណ',
        ro: 'n',
        s: 1
      }, {
        kh: 'ត',
        ro: 't',
        s: 1
      }, {
        kh: 'ថ',
        ro: 'th',
        s: 1
      }, {
        kh: 'ទ',
        ro: 't/d',
        s: 2
      }, {
        kh: 'ធ',
        ro: 'th',
        s: 2
      }, {
        kh: 'ន',
        ro: 'n',
        s: 2
      }, {
        kh: 'ប',
        ro: 'b/p',
        s: 1
      }, {
        kh: 'ផ',
        ro: 'ph',
        s: 1
      }, {
        kh: 'ព',
        ro: 'p/b',
        s: 2
      }, {
        kh: 'ភ',
        ro: 'ph',
        s: 2
      }, {
        kh: 'ម',
        ro: 'm',
        s: 2
      }, {
        kh: 'យ',
        ro: 'y',
        s: 2
      }, {
        kh: 'រ',
        ro: 'r',
        s: 2
      }, {
        kh: 'ល',
        ro: 'l',
        s: 2
      }, {
        kh: 'វ',
        ro: 'v/w',
        s: 2
      }, {
        kh: 'ស',
        ro: 's',
        s: 1
      }, {
        kh: 'ហ',
        ro: 'h',
        s: 1
      }, {
        kh: 'ឡ',
        ro: 'l',
        s: 1
      }, {
        kh: 'អ',
        ro: "'",
        s: 1
      }];
      var depVow = [{
        kh: '◌ា',
        s1: 'aa',
        s2: 'ie',
        ex: 'ការ = work'
      }, {
        kh: '◌ិ',
        s1: 'e',
        s2: 'i',
        ex: ''
      }, {
        kh: '◌ី',
        s1: 'ei',
        s2: 'i',
        ex: 'ស្ត្រី = woman'
      }, {
        kh: '◌ឹ',
        s1: 'eu',
        s2: 'eu',
        ex: ''
      }, {
        kh: '◌ឺ',
        s1: 'eu (long)',
        s2: 'eu (long)',
        ex: 'ខ្ញុំ = I/me'
      }, {
        kh: '◌ុ',
        s1: 'o',
        s2: 'u',
        ex: 'ពុក = father'
      }, {
        kh: '◌ូ',
        s1: 'ou',
        s2: 'uu',
        ex: ''
      }, {
        kh: '◌ួ',
        s1: 'ua',
        s2: 'ua',
        ex: ''
      }, {
        kh: '◌ើ',
        s1: 'ae',
        s2: 'oe',
        ex: 'ខ្មែរ = Khmer'
      }, {
        kh: '◌ែ',
        s1: 'ae',
        s2: 'ae',
        ex: ''
      }, {
        kh: '◌ៃ',
        s1: 'ai',
        s2: 'e',
        ex: ''
      }, {
        kh: '◌ោ',
        s1: 'ao',
        s2: 'oo',
        ex: 'ចោរ = thief'
      }, {
        kh: '◌ំ',
        s1: 'om',
        s2: 'um',
        ex: ''
      }, {
        kh: '◌ះ',
        s1: 'ah',
        s2: 'eh',
        ex: ''
      }, {
        kh: '◌ាំ',
        s1: 'am',
        s2: 'eam',
        ex: ''
      }];
      var indVow = [{
        kh: 'ឣ',
        ro: 'a'
      }, {
        kh: 'ឤ',
        ro: 'aa'
      }, {
        kh: 'ឥ',
        ro: 'i'
      }, {
        kh: 'ឦ',
        ro: 'ii'
      }, {
        kh: 'ឧ',
        ro: 'u'
      }, {
        kh: 'ឩ',
        ro: 'uu'
      }, {
        kh: 'ឪ',
        ro: 'uv'
      }, {
        kh: 'ឫ',
        ro: 'ri'
      }, {
        kh: 'ឬ',
        ro: 'rii'
      }, {
        kh: 'ឭ',
        ro: 'le'
      }, {
        kh: 'ឮ',
        ro: 'lee'
      }, {
        kh: 'ឯ',
        ro: 'ae'
      }, {
        kh: 'ឰ',
        ro: 'ai'
      }, {
        kh: 'ឱ',
        ro: 'ao'
      }, {
        kh: 'ឲ',
        ro: 'au'
      }];
      var nums = [{
        kh: '០',
        n: '0'
      }, {
        kh: '១',
        n: '1'
      }, {
        kh: '២',
        n: '2'
      }, {
        kh: '៣',
        n: '3'
      }, {
        kh: '៤',
        n: '4'
      }, {
        kh: '៥',
        n: '5'
      }, {
        kh: '៦',
        n: '6'
      }, {
        kh: '៧',
        n: '7'
      }, {
        kh: '៨',
        n: '8'
      }, {
        kh: '៩',
        n: '9'
      }];
      var phrases = [{
        kh: 'ជំរាបសួរ',
        ro: 'jum reap suor',
        en: 'Hello (formal)'
      }, {
        kh: 'សួស្ដី',
        ro: 'suos dei',
        en: 'Hello (informal)'
      }, {
        kh: 'អរគុណ',
        ro: 'aw kun',
        en: 'Thank you'
      }, {
        kh: 'សូមទោស',
        ro: 'som tooh',
        en: 'Sorry / Excuse me'
      }, {
        kh: 'មិនអីទេ',
        ro: 'min ei te',
        en: 'No problem'
      }, {
        kh: 'ជំរាបលា',
        ro: 'jum reap lea',
        en: 'Goodbye (formal)'
      }, {
        kh: 'លា​ហើយ',
        ro: 'lea haey',
        en: 'Bye (informal)'
      }, {
        kh: 'ចាស',
        ro: 'jas',
        en: 'Yes (polite female)'
      }, {
        kh: 'បាទ',
        ro: 'baat',
        en: 'Yes (polite male)'
      }, {
        kh: 'ទេ',
        ro: 'te',
        en: 'No'
      }, {
        kh: 'ខ្ញុំ',
        ro: "kh'nyom",
        en: 'I / me'
      }, {
        kh: 'អ្នក',
        ro: 'neak',
        en: 'You'
      }, {
        kh: 'ភាសាខ្មែរ',
        ro: 'phiesa khmer',
        en: 'Khmer language'
      }, {
        kh: 'ខ្ញុំមិនយល់ទេ',
        ro: "kh'nyom min yol te",
        en: "I don't understand"
      }, {
        kh: 'ប៉ុន្មាន?',
        ro: 'ponmaan?',
        en: 'How much?'
      }, {
        kh: 'អ្វី?',
        ro: 'avei?',
        en: 'What?'
      }, {
        kh: 'ណា?',
        ro: 'na?',
        en: 'Which/Where?'
      }, {
        kh: 'ទីនេះ',
        ro: 'ti nih',
        en: 'Here'
      }, {
        kh: 'ទីនោះ',
        ro: 'ti noh',
        en: 'There'
      }];

      function buildGrid5(id, items) {
        var g = el(id);
        if (!g) return;
        g.innerHTML = '';
        items.forEach(function(c) {
          var card = document.createElement('div');
          card.className = 'ref-card';
          var s1 = (c.s === 1) ? '<div class="ref-ro" style="color:rgba(165,180,252,.5);font-size:.56rem">S1</div>' : (c.s === 2) ? '<div class="ref-ro" style="color:rgba(192,132,252,.5);font-size:.56rem">S2</div>' : '';
          card.innerHTML = '<div class="ref-kh kh">' + c.kh + '</div><div class="ref-ro">' + c.ro + '</div>' + s1;
          g.appendChild(card);
        });
      }
      buildGrid5('ref-all-cons', allCons);
      var dvb = el('ref-dep-vowels');
      if (dvb) {
        dvb.innerHTML = '';
        depVow.forEach(function(v) {
          var tr = document.createElement('tr');
          tr.innerHTML = '<td class="vt-kh kh">' + v.kh + '</td><td class="vt-ro">' + v.s1 + '</td><td class="vt-ro">' + v.s2 + '</td><td class="vt-ex">' + esc(v.ex) + '</td>';
          dvb.appendChild(tr);
        });
      }
      var ivg = el('ref-ind-vowels');
      if (ivg) {
        ivg.innerHTML = '';
        indVow.forEach(function(v) {
          var card = document.createElement('div');
          card.className = 'ref-card';
          card.innerHTML = '<div class="ref-kh kh">' + v.kh + '</div><div class="ref-ro">' + v.ro + '</div>';
          ivg.appendChild(card);
        });
      }
      var ng = el('ref-numbers');
      if (ng) {
        ng.innerHTML = '';
        nums.forEach(function(n) {
          var card = document.createElement('div');
          card.className = 'ref-card';
          card.innerHTML = '<div class="ref-kh kh">' + n.kh + '</div><div class="ref-ro">' + n.n + '</div>';
          ng.appendChild(card);
        });
      }
      buildGrid5('ref-sing-khmer', allCons);
      var pb = el('ref-phrases');
      if (pb) {
        pb.innerHTML = '';
        phrases.forEach(function(p) {
          var tr = document.createElement('tr');
          tr.innerHTML = '<td class="vt-kh kh" style="min-width:120px">' + p.kh + '</td><td class="vt-ro">' + p.ro + '</td><td class="vt-ex">' + esc(p.en) + '</td>';
          pb.appendChild(tr);
        });
      }
    }

    // ════════════════════════════════════════════
    // CSV IMPORT — batch mode
    // ════════════════════════════════════════════
    function openImportModal() {
      el('csv-file-name').textContent = '';
      el('csv-preview').style.display = 'none';
      el('csv-err').style.display = 'none';
      el('csv-file-input').value = '';
      el('csv-import-btn').disabled = true;
      el('csv-import-btn').style.opacity = '.5';
      el('csv-loading').classList.remove('active');
      el('csv-main-area').style.display = '';
      el('csv-import-lbl').textContent = 'Import';
      csvParsed = [];
      el('import-ovl').classList.add('open');
    }

    function closeImportModal() {
      el('import-ovl').classList.remove('open');
      if (MAIN_USER && !SCRIPT_URL) onboardComplete();
    }

    function handleCsvFile(event) {
      var file = event.target.files[0];
      if (!file) return;
      el('csv-file-name').textContent = file.name;
      el('csv-err').style.display = 'none';
      el('csv-preview').style.display = 'none';
      el('csv-import-btn').disabled = true;
      el('csv-import-btn').style.opacity = '.5';
      csvParsed = [];
      el('csv-loading').classList.add('active');
      el('csv-loading-txt').textContent = 'Reading file…';
      el('csv-main-area').style.display = 'none';
      var reader = new FileReader();
      reader.onload = function(e) {
        setTimeout(function() {
          el('csv-loading-txt').textContent = 'Parsing rows…';
          setTimeout(function() {
            try {
              var rows = parseCSV(e.target.result);
              el('csv-loading').classList.remove('active');
              el('csv-main-area').style.display = '';
              if (!rows.length) {
                showCsvErr('File is empty or unreadable.');
                return;
              }
              var header = rows[0].map(function(h) {
                return (h || '').trim();
              });

              function findCol(name) {
                return header.findIndex(function(h) {
                  return h.toLowerCase() === name.toLowerCase();
                });
              }
              var enIdx = findCol('english'),
                khIdx = findCol('khmer');
              if (enIdx === -1 && khIdx === -1) {
                showCsvErr('Missing "English" or "Khmer" header in row 1. Make sure you followed the steps above.');
                return;
              }
              var roIdx = findCol('romanization'),
                noIdx = findCol('notes'),
                caIdx = findCol('category'),
                dtIdx = findCol('date added');
              csvParsed = [];
              var skipped = 0,
                today = new Date().toISOString().slice(0, 10);
              rows.slice(1).forEach(function(row) {
                var en = enIdx >= 0 ? (row[enIdx] || '').trim() : '';
                var kh = khIdx >= 0 ? (row[khIdx] || '').trim() : '';
                if (!en && !kh) {
                  skipped++;
                  return;
                }
                var isDup = allRows.some(function(r) {
                  return (en && (r.english || '').trim().toLowerCase() === en.toLowerCase()) || (kh && (r.khmer || '').trim() === kh);
                });
                if (isDup) {
                  skipped++;
                  return;
                }
                csvParsed.push({
                  english: en,
                  khmer: kh,
                  romanization: roIdx >= 0 ? (row[roIdx] || '').trim() : '',
                  notes: noIdx >= 0 ? (row[noIdx] || '').trim() : '',
                  category: caIdx >= 0 && (row[caIdx] || '').trim() ? row[caIdx].trim() : 'Words',
                  dateAdded: dtIdx >= 0 && (row[dtIdx] || '').trim() ? row[dtIdx].trim() : today
                });
              });
              if (!csvParsed.length) {
                showCsvErr('No valid new rows found.' + (skipped ? ' ' + skipped + ' rows skipped (duplicates or empty).' : ''));
                return;
              }
              var prev = el('csv-preview');
              prev.style.display = 'block';
              el('csv-preview-title').textContent = 'Ready to import ' + csvParsed.length + ' entries' + (skipped ? ' (' + skipped + ' skipped)' : '');
              var list = el('csv-preview-list');
              list.innerHTML = '';
              csvParsed.slice(0, 6).forEach(function(r) {
                var d = document.createElement('div');
                d.style.cssText = 'font-size:.73rem;padding:4px 0;border-bottom:1px solid var(--bdr)';
                d.innerHTML = '<span class="kh" style="color:var(--acc3)">' + esc(r.khmer || '—') + '</span> — ' + esc(r.english || '—') + ' <span style="color:var(--dim);font-size:.65rem">[' + esc(r.category) + ']</span>';
                list.appendChild(d);
              });
              if (csvParsed.length > 6) {
                var more = document.createElement('div');
                more.style.cssText = 'font-size:.7rem;color:var(--dim);margin-top:4px';
                more.textContent = '…and ' + (csvParsed.length - 6) + ' more';
                list.appendChild(more);
              }
              el('csv-import-btn').disabled = false;
              el('csv-import-btn').style.opacity = '1';
            } catch (err) {
              el('csv-loading').classList.remove('active');
              el('csv-main-area').style.display = '';
              showCsvErr('Could not read file: ' + err.message);
            }
          }, 400);
        }, 200);
      };
      reader.readAsText(file, 'UTF-8');
    }

    function showCsvErr(msg) {
      var e = el('csv-err');
      if (e) {
        e.textContent = '⚠️ ' + msg;
        e.style.display = 'block';
      }
      el('csv-import-btn').disabled = true;
      el('csv-import-btn').style.opacity = '.5';
    }

    function parseCSV(text) {
      var rows = [],
        row = [],
        cur = '',
        inQ = false;
      text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      for (var i = 0; i < text.length; i++) {
        var c = text[i];
        if (inQ) {
          if (c === '"' && text[i + 1] === '"') {
            cur += '"';
            i++;
          } else if (c === '"') inQ = false;
          else cur += c;
        } else if (c === '"') inQ = true;
        else if (c === ',') {
          row.push(cur);
          cur = '';
        } else if (c === '\n') {
          row.push(cur);
          rows.push(row);
          row = [];
          cur = '';
        } else cur += c;
      }
      if (cur || row.length) {
        row.push(cur);
        rows.push(row);
      }
      return rows.filter(function(r) {
        return r.some(function(c) {
          return (c || '').trim();
        });
      });
    }

    function confirmImport() {
      if (!csvParsed.length) return;
      var words = csvParsed.slice();
      csvParsed = [];
      el('import-ovl').classList.remove('open');
      toast('Importing ' + words.length + ' words… tap the status bar for progress.', 'inf');
      words.forEach(function(w) {
        allRows.unshift(Object.assign({}, w, {
          rowIndex: 0
        }));
      });
      saveCache(allRows);
      render();
      renderFav();
      renderProgress();

      if (!SCRIPT_URL || !MAIN_USER) {
        toast('Saved locally (' + words.length + ' words). Connect sheet to sync.', 'inf');
        return;
      }

      // Chunked import — send in batches of 20 to stay within URL length limits
      var CHUNK_SIZE = 20;
      var chunks = [];
      for (var i = 0; i < words.length; i += CHUNK_SIZE) chunks.push(words.slice(i, i + CHUNK_SIZE));

      importState = {
        active: true,
        total: words.length,
        sent: 0,
        failed: 0,
        label: 'Sending batch 1/' + chunks.length + '…'
      };
      updateImportProgress();
      setStatus('imp', 'Importing 0/' + words.length + '…');

      function sendChunk(ci) {
        if (ci >= chunks.length) {
          importState.active = false;
          if (importState.failed === 0) {
            toast('✓ ' + importState.sent + ' words imported to sheet!', 'ok');
          } else {
            toast(importState.sent + ' imported, ' + importState.failed + ' failed.', 'err');
          }
          setStatus('ok', allRows.length + ' words');
          loadData();
          return;
        }
        var chunk = chunks[ci];
        importState.label = 'Sending batch ' + (ci + 1) + '/' + chunks.length + '…';
        updateImportProgress();
        setStatus('imp', 'Importing ' + importState.sent + '/' + importState.total + '…');
        var url = new URL(SCRIPT_URL);
        url.searchParams.set('action', 'importWords');
        url.searchParams.set('user', MAIN_USER);
        url.searchParams.set('tab', MAIN_USER);
        url.searchParams.set('words', JSON.stringify(chunk));
        fetch(url.toString())
          .then(function(r) {
            return r.json();
          })
          .then(function(j) {
            if (j.success) {
              importState.sent += (j.imported || chunk.length);
            } else {
              importState.failed += chunk.length;
            }
            updateImportProgress();
            setTimeout(function() {
              sendChunk(ci + 1);
            }, 600);
          })
          .catch(function() {
            importState.failed += chunk.length;
            updateImportProgress();
            setTimeout(function() {
              sendChunk(ci + 1);
            }, 600);
          });
      }
      sendChunk(0);
    }

    // ════════════════════════════════════════════
    // EXPORT CSV — File System Access API
    // ════════════════════════════════════════════
    async function exportCSV() {
      if (!allRows.length) {
        toast('No data to export.', 'err');
        return;
      }
      var lines = [
        ['English', 'Khmer', 'Romanization', 'Notes', 'Category', 'Date Added'].join(',')
      ];
      allRows.forEach(function(r) {
        var cols = [r.english, r.khmer, r.romanization, r.notes, r.category, r.dateAdded];
        lines.push(cols.map(function(c) {
          var s = String(c || '').replace(/"/g, '""');
          return (s.indexOf(',') !== -1 || s.indexOf('"') !== -1 || s.indexOf('\n') !== -1) ? '"' + s + '"' : s;
        }).join(','));
      });
      var csv = lines.join('\n');
      var filename = 'khmer-vocab-' + new Date().toISOString().slice(0, 10) + '.csv';
      if ('showSaveFilePicker' in window) {
        try {
          var handle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: 'CSV files',
              accept: {
                'text/csv': ['.csv']
              }
            }]
          });
          var writable = await handle.createWritable();
          await writable.write(csv);
          await writable.close();
          toast('CSV saved! ✓', 'ok');
        } catch (e) {
          if (e.name !== 'AbortError') blobDownload(csv, filename);
        }
      } else {
        blobDownload(csv, filename);
      }
    }

    function blobDownload(content, filename) {
      var blob = new Blob([content], {
        type: 'text/csv;charset=utf-8'
      });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(function() {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);
      toast('CSV downloaded. ✓', 'ok');
    }

    function resetConfidence() {
      if (!confirm('Reset all confidence and SRS ratings?')) return;
      confidence = {};
      srsData = {};
      lsSet(CONF_KEY, '{}');
      lsSet(SRS_KEY, '{}');
      toast('Reset.', 'ok');
      renderProgress();
    }

    // ════════════════════════════════════════════
    // TOAST
    // ════════════════════════════════════════════
    function toast(msg, type) {
      var box = el('tbox');
      if (!box) return;
      var div = document.createElement('div');
      div.className = 'toast ' + (type || 'inf');
      div.textContent = msg;
      box.appendChild(div);
      setTimeout(function() {
        if (div.parentNode) div.parentNode.removeChild(div);
      }, 3500);
    }

    // ════════════════════════════════════════════
    // START
    // ════════════════════════════════════════════
    // init();
    document.addEventListener('DOMContentLoaded', init);

    (() => {
      const ENTRY = 'Khmer Vocabulary v6',
        KEY = 'Ion-o-koji Watermark';
      const logs = (localStorage.getItem(KEY) || "").split('\n').map(line => line.replace(/^- /, '').trim()).filter(line => line && line !== ENTRY);
      logs.push(ENTRY);
      localStorage.setItem(KEY, logs.map(item => `- ${item}`).join('\n'));
    })();

  
