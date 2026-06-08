
    // ════════════════════════════════════════
    // STORAGE KEYS & GLOBAL STATE
    // ════════════════════════════════════════
    var URL_KEY = 'kv_url',
      MAINUSER_KEY = 'kv_main_user',
      SKEY = 'kv_settings',
      FAV_KEY = 'kv_favorites',
      CONF_KEY = 'kv_confidence',
      SRS_KEY = 'kv_srs',
      CACHE_KEY = 'kv_cache',
      SYNC_KEY = 'kv_last_sync',
      CATS_KEY = 'kv_custom_cats',
      SETS_KEY = 'kv_study_sets',
      QUEUE_KEY = 'kv_pending_queue';

    var SCRIPT_URL = ls(URL_KEY) || 'https://script.google.com/macros/s/AKfycbzHjW1pf0_VBTcWYXgU6h-6YbDCHanNPA83bpqPkPQ11L6lWxmsZ1ku2d5hUaQoaW1A/exec';
    var MAIN_USER = ls(MAINUSER_KEY) || '';
    var CURRENT_USER = MAIN_USER;
    var readOnlyMode = false;
    var allRows = [],
      quickSort = 'date',
      sortCol = -1,
      sortAsc = true,
      blurMode = '';
    var editRow = null,
      bulkMode = false,
      selectedKeys = new Set();
    var autoSyncTimer = null,
      favSortCol = -1,
      favSortAsc = true,
      csvParsed = [];
    var studyDir = 'kh',
      submitLock = false,
      submitLockTimer = null,
      ttsAudio = null;
    var activeTasks = 0;

    var favorites = new Set(safeJsonParse(ls(FAV_KEY), []));
    var confidence = safeJsonParse(ls(CONF_KEY), {});
    var srsData = safeJsonParse(ls(SRS_KEY), {});
    var customCats = safeJsonParse(ls(CATS_KEY), []);
    var studySets = safeJsonParse(ls(SETS_KEY), []);
    var pendingQueue = safeJsonParse(ls(QUEUE_KEY), []);
    var importState = {
      active: false,
      total: 0,
      sent: 0,
      failed: 0,
      label: ''
    };

    var DEFAULT_CATS = ['Words', 'Sentences', 'Level 1', 'Level 2', 'Level 3'];
    var S = {
      density: 'compact',
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
      srs: true,
      defaultPage: 'add'
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
      }
    };
    var MILESTONES_ADD = [{
      n: 1,
      icon: '🌱',
      name: 'First Word'
    }, {
      n: 10,
      icon: '📚',
      name: 'Bookworm'
    }, {
      n: 25,
      icon: '🔥',
      name: 'On Fire'
    }, {
      n: 50,
      icon: '💪',
      name: 'Committed'
    }, {
      n: 100,
      icon: '🎯',
      name: 'Century'
    }, {
      n: 250,
      icon: '🏆',
      name: 'Master'
    }, {
      n: 500,
      icon: '👑',
      name: 'Legend'
    }, {
      n: 1000,
      icon: '🌟',
      name: 'Transcendent'
    }];
    var MILESTONES_STUDY = [{
      n: 1,
      icon: '🎯',
      name: 'First Study'
    }, {
      n: 10,
      icon: '📖',
      name: 'Student'
    }, {
      n: 25,
      icon: '🧠',
      name: 'Brain Power'
    }, {
      n: 50,
      icon: '⚡',
      name: 'Sparking'
    }, {
      n: 100,
      icon: '🔥',
      name: 'On Fire'
    }, {
      n: 250,
      icon: '🏅',
      name: 'Expert'
    }, {
      n: 500,
      icon: '💎',
      name: 'Diamond'
    }, {
      n: 1000,
      icon: '🌟',
      name: 'Legend'
    }];

    // ════════════════════════════════════════
    // UTILS
    // ════════════════════════════════════════
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

    function safeJsonParse(s, d) {
      try {
        return s ? JSON.parse(s) : d;
      } catch (e) {
        return d;
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

    // ════════════════════════════════════════
    // AUTH — Password-based login (stored in ⚙️ Config tab)
    // ════════════════════════════════════════
    async function fetchCredentials() {
      if (!SCRIPT_URL) return [];
      try {
        var resp = await fetch(SCRIPT_URL + '?action=getCredentials');
        var json = await resp.json();
        if (!json.success) return [];
        return json.credentials || [];
      } catch (e) {
        return [];
      }
    }

    async function verifyLogin(name, pass) {
      var creds = await fetchCredentials();
      var nameMatch = creds.find(function(c) {
        return c.username.toLowerCase() === name.toLowerCase();
      });
      if (nameMatch) {
        if (nameMatch.password === pass) return 'ok';
        return 'wrong_password';
      }
      var passMatch = creds.find(function(c) {
        return c.password === pass;
      });
      if (passMatch) return 'wrong_name';
      return 'new_user';
    }

    function registerUserCredentials(name, pass) {
      if (!SCRIPT_URL || !name || !pass) return;
      var url = new URL(SCRIPT_URL);
      url.searchParams.set('action', 'setCredential');
      url.searchParams.set('username', name);
      url.searchParams.set('password', pass);
      fetch(url.toString()).catch(function() {});
    }

    async function deleteCredentials(name) {
      if (!SCRIPT_URL || !name) return;
      try {
        var url = new URL(SCRIPT_URL);
        url.searchParams.set('action', 'deleteCredential');
        url.searchParams.set('username', name);
        await fetch(url.toString());
      } catch (e) {}
    }

    async function handleLogin() {
      var name = (el('user-inp').value || '').trim();
      var pass = (el('user-pass').value || '').trim();
      var msgEl = el('user-login-msg');

      function showMsg(msg, isErr) {
        if (!msgEl) return;
        msgEl.textContent = msg;
        msgEl.style.display = msg ? 'block' : 'none';
        msgEl.style.background = isErr ? 'rgba(239,68,68,.12)' : 'rgba(34,197,94,.1)';
        msgEl.style.color = isErr ? 'var(--bad)' : 'var(--ok)';
        msgEl.style.border = '1px solid ' + (isErr ? 'rgba(239,68,68,.3)' : 'rgba(34,197,94,.25)');
      }
      if (!name) {
        showMsg('Please enter your name.', true);
        return;
      }
      if (!pass) {
        showMsg('Please enter a password.', true);
        return;
      }

      var btn = el('user-start-btn');
      if (btn) {
        btn.textContent = 'Checking…';
        btn.disabled = true;
      }

      if (!SCRIPT_URL) {
        MAIN_USER = name;
        CURRENT_USER = name;
        lsSet(MAINUSER_KEY, name);
        window._pendingPassword = pass;
        el('user-ovl').classList.remove('open');
        showMsg('', false);
        applyUserBadge();
        updateCfgUsername();
        if (btn) {
          btn.textContent = 'Log In →';
          btn.disabled = false;
        }
        el('user-step2-ovl').classList.add('open');
        return;
      }

      var result = await verifyLogin(name, pass);
      if (btn) {
        btn.textContent = 'Log In →';
        btn.disabled = false;
      }

      if (result === 'ok') {
        MAIN_USER = name;
        CURRENT_USER = name;
        lsSet(MAINUSER_KEY, name);
        el('user-ovl').classList.remove('open');
        showMsg('', false);
        applyUserBadge();
        updateCfgUsername();
        toast('Welcome back, ' + name + '!', 'ok');
        onboardComplete(false);
      } else if (result === 'wrong_password') {
        showMsg('Password is incorrect.', true);
      } else if (result === 'wrong_name') {
        showMsg('Name is incorrect.', true);
      } else {
        if (confirm('No account found for "' + name + '". Create a new account?')) {
          MAIN_USER = name;
          CURRENT_USER = name;
          lsSet(MAINUSER_KEY, name);
          window._pendingPassword = pass;
          el('user-ovl').classList.remove('open');
          showMsg('', false);
          applyUserBadge();
          updateCfgUsername();
          el('user-step2-ovl').classList.add('open');
        }
      }
    }

    function logout() {
      if (!confirm('Log out? You will need to enter your name and password next time.')) return;
      MAIN_USER = '';
      CURRENT_USER = '';
      lsSet(MAINUSER_KEY, '');
      readOnlyMode = false;
      document.body.classList.remove('read-only');
      allRows = [];
      render();
      renderFav();
      applyUserBadge();
      ['cfg-ovl', 'acct-quick-ovl'].forEach(function(id) {
        var e = el(id);
        if (e) e.classList.remove('open');
      });
      el('user-ovl').classList.add('open');
      setStatus('off', 'Not signed in');
      setTimeout(function() {
        var ui = el('user-inp');
        if (ui) {
          ui.value = '';
          ui.focus();
        }
        var up = el('user-pass');
        if (up) up.value = '';
        var msg = el('user-login-msg');
        if (msg) msg.style.display = 'none';
      }, 50);
    }

    async function changeUsername() {
      var oldPass = ((el('cfg-change-pass-for-name') || {}).value || '').trim();
      var newName = ((el('cfg-new-username') || {}).value || '').trim();
      if (!oldPass || !newName) {
        toast('Fill in all fields.', 'err');
        return;
      }
      if (!MAIN_USER) {
        toast('Not logged in.', 'err');
        return;
      }
      if (newName === MAIN_USER) {
        toast('New name is the same as current name.', 'inf');
        return;
      }
      var result = await verifyLogin(MAIN_USER, oldPass);
      if (result !== 'ok') {
        toast('Current password is incorrect.', 'err');
        return;
      }
      await deleteCredentials(MAIN_USER);
      registerUserCredentials(newName, oldPass);
      var oldName = MAIN_USER;
      MAIN_USER = newName;
      CURRENT_USER = newName;
      lsSet(MAINUSER_KEY, newName);
      applyUserBadge();
      updateCfgUsername();
      if (el('cfg-change-pass-for-name')) el('cfg-change-pass-for-name').value = '';
      if (el('cfg-new-username')) el('cfg-new-username').value = '';
      toast('Username changed to "' + newName + '". Re-sync recommended.', 'ok');
    }

    async function changePassword() {
      var oldPass = ((el('cfg-old-password') || {}).value || '').trim();
      var newPass = ((el('cfg-new-password') || {}).value || '').trim();
      if (!oldPass || !newPass) {
        toast('Fill in all fields.', 'err');
        return;
      }
      if (!MAIN_USER) {
        toast('Not logged in.', 'err');
        return;
      }
      if (newPass === oldPass) {
        toast('New password is the same as current.', 'inf');
        return;
      }
      var result = await verifyLogin(MAIN_USER, oldPass);
      if (result !== 'ok') {
        toast('Current password is incorrect.', 'err');
        return;
      }
      await deleteCredentials(MAIN_USER);
      registerUserCredentials(MAIN_USER, newPass);
      if (el('cfg-old-password')) el('cfg-old-password').value = '';
      if (el('cfg-new-password')) el('cfg-new-password').value = '';
      toast('Password changed successfully.', 'ok');
    }

    function updateCfgUsername() {
      var e2 = el('cfg-uname');
      if (e2) e2.textContent = MAIN_USER || '—';
    }

    function renderDeviceInfo() {
      updateCfgUsername();
    }

    // ════════════════════════════════════════
    // BUSY LOCK
    // ════════════════════════════════════════
    function setBusy(delta) {
      activeTasks = Math.max(0, activeTasks + delta);
      var sb = el('sync-btn');
      if (sb) {
        sb.disabled = activeTasks > 0;
        sb.title = activeTasks > 0 ? 'Busy — wait for current action to finish' : 'Sync now';
      }
    }

    function doSyncClick() {
      if (activeTasks > 0) {
        toast('Please wait for the current action to finish first.', 'inf');
        return;
      }
      loadData();
    }

    // ════════════════════════════════════════
    // TTS
    // ════════════════════════════════════════
    function speakKhmer(text) {
      text = (text || '').trim();
      if (!text) {
        toast('No Khmer text to speak.', 'inf');
        return;
      }
      if (ttsAudio) {
        ttsAudio.pause();
        ttsAudio = null;
      }
      var src = 'https://translate.google.com/translate_tts?ie=UTF-8&q=' + encodeURIComponent(text) + '&tl=km&client=tw-ob&ttsspeed=0.9';
      var audio = new Audio(src);
      audio.addEventListener('error', function() {
        tryWebSpeech(text, 'km-KH');
      });
      ttsAudio = audio;
      audio.play().catch(function() {
        tryWebSpeech(text, 'km-KH');
      });
    }

    function speakEnglish(text) {
      text = (text || '').trim();
      if (!text) return;
      tryWebSpeech(text, 'en-US');
    }

    function tryWebSpeech(text, lang) {
      if (!('speechSynthesis' in window)) {
        toast('TTS not supported.', 'err');
        return;
      }
      window.speechSynthesis.cancel();
      var utt = new SpeechSynthesisUtterance(text);
      utt.lang = lang;
      window.speechSynthesis.speak(utt);
    }

    function speakCurrentCard() {
      var r = studyDeck[studyIdx];
      if (r) speakKhmer(r.khmer || '');
    }

    // ════════════════════════════════════════
    // STATUS PILL
    // ════════════════════════════════════════
    function setStatus(state, msg) {
      var sp = el('spill'),
        dot = el('dot'),
        stxt = el('stxt');
      if (!sp) return;
      dot.className = 'dot' + (state ? ' ' + state : '');
      stxt.textContent = msg || '';
      sp.className = 'spill' + (state === 'spin-dot' ? ' syncing' : state === 'ok' ? ' s-ok' : state === 'err' ? ' s-err' : state === 'off' ? ' s-off' : state === 'imp' ? ' s-imp' : '');
    }

    function onSpillClick() {
      if (importState.active) el('imp-prog-ovl').classList.add('open');
    }

    function updateImportProgress() {
      var pct = importState.total ? Math.round(importState.sent / importState.total * 100) : 0;
      var lb = el('imp-label'),
        pc = el('imp-pct'),
        bar = el('imp-bar'),
        det = el('imp-detail');
      if (lb) lb.textContent = importState.label || 'Importing…';
      if (pc) pc.textContent = pct + '%';
      if (bar) bar.style.width = pct + '%';
      if (det) det.textContent = importState.sent + '/' + importState.total + ' words' + (importState.failed ? ' (' + importState.failed + ' failed)' : '');
      setStatus('imp', 'Importing ' + importState.sent + '/' + importState.total + '…');
    }

    // ════════════════════════════════════════
    // CATEGORY DROPDOWNS
    // ════════════════════════════════════════
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
      var vc = (el('view-cat-filter') || {}).value || 'All',
        fc = (el('f-cat') || {}).value || 'Words',
        ec = (el('e-cat') || {}).value || 'Words',
        bc = (el('bulkcat-sel') || {}).value || 'Words';
      populateCatDropdown('view-cat-filter', true, vc);
      populateCatDropdown('f-cat', false, fc);
      populateCatDropdown('e-cat', false, ec);
      populateCatDropdown('bulkcat-sel', false, bc);
      populateStudyFilter();
    }

    // ════════════════════════════════════════
    // CUSTOM CATEGORIES
    // ════════════════════════════════════════
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
      if (getAllCats().indexOf(name) !== -1) {
        toast('"' + name + '" already exists.', 'inf');
        return;
      }
      customCats.unshift(name);
      saveCustomCats();
      refreshAllCatDropdowns();
      renderCustomCatList();
      el('newcat-inp').value = '';
      syncCategoryToSheet('add', name);
      toast('Category "' + name + '" added.', 'ok');
    }

    function removeCustomCat(name) {
      if (!confirm('Delete category "' + name + '"?')) return;
      customCats = customCats.filter(function(c) {
        return c !== name;
      });
      saveCustomCats();
      refreshAllCatDropdowns();
      renderCustomCatList();
      syncCategoryToSheet('delete', name);
      toast('Category deleted.', 'ok');
    }

    function startEditCat(name) {
      renderCustomCatList(name);
    }

    function finishEditCat(oldName) {
      var safe = oldName.replace(/[^a-z0-9]/gi, '_'),
        inp = el('cat-edit-inp-' + safe);
      if (!inp) return;
      var newName = (inp.value || '').trim();
      if (!newName || newName === oldName) {
        renderCustomCatList();
        return;
      }
      var idx = customCats.indexOf(oldName);
      if (idx !== -1) customCats[idx] = newName;
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
        box.innerHTML = '<div style="font-size:.75rem;color:var(--dim);padding:8px">No custom categories yet.</div>';
        return;
      }
      customCats.forEach(function(c) {
        var safe = c.replace(/[^a-z0-9]/gi, '_'),
          row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:6px;padding:7px 10px;background:var(--surf2);border:1px solid var(--bdr);border-radius:10px';
        if (editingName === c) {
          row.innerHTML = '<input id="cat-edit-inp-' + safe + '" style="flex:1;height:30px;background:var(--bg);border:1px solid var(--acc2);border-radius:6px;color:var(--text);padding:0 8px;font-size:.8rem;outline:none" value="' + esc(c) + '"/>' +
            '<button class="btn-s" style="padding:5px 10px;font-size:.75rem" onclick="finishEditCat(\'' + c.replace(/'/g, "\\'") + '\')" >✓</button>' +
            '<button class="btn-g" style="padding:5px 8px;font-size:.75rem" onclick="renderCustomCatList()">✕</button>';
        } else {
          row.innerHTML = '<span style="flex:1;font-size:.82rem;color:var(--text)">' + esc(c) + '</span>' +
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
        }).then(function(j) {
          if (j.success && Array.isArray(j.categories) && j.categories.length) {
            j.categories.forEach(function(c) {
              if (DEFAULT_CATS.indexOf(c) === -1 && customCats.indexOf(c) === -1) customCats.push(c);
            });
            customCats = customCats.filter(function(c) {
              return j.categories.indexOf(c) !== -1;
            });
            saveCustomCats();
            refreshAllCatDropdowns();
          }
        }).catch(function() {});
    }

    // ════════════════════════════════════════
    // STUDY SETS
    // ════════════════════════════════════════
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
        box.innerHTML = '<div style="font-size:.75rem;color:var(--dim);text-align:center;padding:10px">No study sets yet.</div>';
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
      });
      saveStudySets();
      addToSet(id);
    }

    function addToSet(id) {
      var s = studySets.find(function(s) {
        return s.id === id;
      });
      if (!s) return;
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

    // ════════════════════════════════════════
    // SETTINGS
    // ════════════════════════════════════════
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
      if (g('opt-default-page')) g('opt-default-page').value = S.defaultPage || 'add';
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
      if (g('opt-default-page')) S.defaultPage = g('opt-default-page').value || 'add';
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
        sw.title = key;
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

    function openCfg() {
      updateCfgUsername();
      el('cfg-url').value = SCRIPT_URL || '';
      el('cfg-url-status').textContent = SCRIPT_URL ? 'Connected' : 'Not connected';
      el('cfg-ovl').classList.add('open');
    }

    function closeCfg() {
      el('cfg-ovl').classList.remove('open');
    }

    function saveCfg() {
      var url = (el('cfg-url').value || '').trim();
      if (url) {
        SCRIPT_URL = url;
        lsSet(URL_KEY, url);
        el('cfg-url-status').textContent = 'Connected';
        toast('URL saved. Syncing…', 'ok');
        loadData();
        loadCategoriesFromSheet();
      } else toast('Enter a valid URL.', 'err');
    }

    // ════════════════════════════════════════
    // CACHE
    // ════════════════════════════════════════
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
      var t = ls(SYNC_KEY),
        ci = el('cfg-cache-info'),
        sl = el('cfg-last-sync');
      if (ci) ci.textContent = t ? ('Cached ' + new Date(t).toLocaleString()) : 'No cache yet';
      if (sl) sl.textContent = t ? new Date(t).toLocaleString() : 'Never';
    }

    // ════════════════════════════════════════
    // ACCOUNT
    // ════════════════════════════════════════
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
      buildAccountUserList();
    }
    var cachedOtherUsers = [];

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
        item.innerHTML = '<span class="user-item-name">' + esc(name) + '</span>';
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

    function fetchOtherUsersForPopup() {
      var btn = el('aq-refresh-btn');
      if (btn) btn.classList.add('loading');
      if (!SCRIPT_URL) {
        toast('Connect your sheet in ⚙️ first.', 'err');
        if (btn) btn.classList.remove('loading');
        return;
      }
      fetch(SCRIPT_URL + '?action=getAllUsers').then(function(r) {
        return r.json();
      }).then(function(j) {
        if (btn) btn.classList.remove('loading');
        if (!j.success) throw new Error(j.error || 'Failed');
        var list = ['📋 All Words'].concat((j.users || []).filter(function(u) {
          return u !== MAIN_USER;
        }));
        cachedOtherUsers = list;
        buildAccountUserList(list);
      }).catch(function(err) {
        if (btn) btn.classList.remove('loading');
        toast('Failed: ' + err.message, 'err');
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

    // ════════════════════════════════════════
    // INIT
    // ════════════════════════════════════════
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
        goPage('view', 'nav-view');
      } else {
        CURRENT_USER = MAIN_USER;
        applyUserBadge();
        updateCfgUsername();
        var dp = S.defaultPage || 'add';
        var navMap = {
          view: 'nav-view',
          add: 'nav-add',
          trans: 'nav-trans',
          fav: 'nav-fav',
          study: 'nav-study',
          progress: 'nav-progress',
          ref: 'nav-ref',
          dash: 'nav-dash'
        };
        goPage(dp, navMap[dp] || 'nav-add');
        if (dp === 'study') initStudy();
        if (dp === 'progress') renderProgress();
        if (dp === 'dash') loadDashboard();
        if (S.offlineMode) loadFromCache();
        else if (SCRIPT_URL) {
          loadData();
          loadCategoriesFromSheet();
        } else setStatus('off', 'Not connected');
      }
      el('dict-input').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') dictSearch(e.target.value);
      });
      el('dict-search-btn').addEventListener('click', function() {
        dictSearch(el('dict-input').value);
      });
      el('dict-clear').addEventListener('click', function() {
        el('dict-input').value = '';
        el('dict-clear').style.display = 'none';
        el('dict-input').focus();
      });
      el('dict-input').addEventListener('input', function() {
        el('dict-clear').style.display = this.value ? 'block' : 'none';
      });
      document.querySelectorAll('.trans-subtab').forEach(function(btn) {
        btn.addEventListener('click', function() {
          document.querySelectorAll('.trans-subtab').forEach(function(b) {
            b.classList.remove('active');
          });
          btn.classList.add('active');
          dictState.activeTab = btn.dataset.dtab;
          if (Object.keys(dictState.results).length > 0) dictRenderResults();
        });
      });
    }

    el('user-inp').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        var p = el('user-pass');
        if (p && !p.value) p.focus();
        else handleLogin();
      }
    });
    el('user-pass').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') handleLogin();
    });
    el('sset-new-name').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') createAndAddSet();
    });
    el('newcat-inp').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') addCustomCat();
    });

    // ════════════════════════════════════════
    // NEW USER FLOW
    // ════════════════════════════════════════
    function closeStep2() {
      el('user-step2-ovl').classList.remove('open');
      onboardComplete(true);
    }

    function closeStep2AndImport() {
      el('user-step2-ovl').classList.remove('open');
      openImportModal();
    }

    function onboardComplete(registerNew) {
      if (registerNew !== false) {
        if (window._pendingPassword) {
          registerUserCredentials(MAIN_USER, window._pendingPassword);
          window._pendingPassword = null;
        }
      }
      if (SCRIPT_URL) {
        setStatus('spin-dot', 'Setting up…');
        fetch(SCRIPT_URL + '?action=getOrCreateUser&name=' + encodeURIComponent(MAIN_USER))
          .then(function(r) {
            return r.json();
          }).then(function(j) {
            toast(j.created ? 'Account created for ' + MAIN_USER + '!' : 'Welcome back, ' + MAIN_USER + '!', 'ok');
            loadData();
            loadCategoriesFromSheet();
            var dp = S.defaultPage || 'add',
              navMap = {
                view: 'nav-view',
                add: 'nav-add',
                trans: 'nav-trans',
                fav: 'nav-fav',
                study: 'nav-study',
                progress: 'nav-progress',
                ref: 'nav-ref',
                dash: 'nav-dash'
              };
            goPage(dp, navMap[dp] || 'nav-add');
          }).catch(function(err) {
            toast('Setup error: ' + err.message, 'err');
            loadData();
          });
      } else {
        setStatus('off', 'Not connected');
        goPage('add', 'nav-add');
      }
    }

    // ════════════════════════════════════════
    // DATA LOAD
    // ════════════════════════════════════════
    function loadData() {
      var user = CURRENT_USER || MAIN_USER;
      if (!SCRIPT_URL || !user) {
        setStatus('off', 'Not connected');
        return;
      }
      if (S.offlineMode) {
        loadFromCache();
        return;
      }
      var sb = el('sync-btn');
      if (sb) sb.classList.add('spin-icon');
      setBusy(1);
      setStatus('spin-dot', 'Syncing…');
      fetch(SCRIPT_URL + '?action=getData&user=' + encodeURIComponent(user))
        .then(function(r) {
          return r.json();
        }).then(function(json) {
          setBusy(-1);
          if (sb) sb.classList.remove('spin-icon');
          if (!json.success) throw new Error(json.error || 'Error');
          var d = json.data || {};
          allRows = d[user] || mergeAll(d);
          saveCache(allRows);
          setStatus('ok', allRows.length + ' words');
          render();
          renderFav();
          renderProgress();
        }).catch(function(err) {
          setBusy(-1);
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

    // ════════════════════════════════════════
    // PENDING QUEUE
    // ════════════════════════════════════════
    function processPendingQueue() {
      if (!SCRIPT_URL || !pendingQueue.length || importState.active) return;
      var item = pendingQueue[0];
      setBusy(1);
      setStatus('spin-dot', 'Saving word…');
      var url = buildAddUrl(item);
      fetch(url).then(function(r) {
        return r.json();
      }).then(function(j) {
        setBusy(-1);
        if (j.success) {
          pendingQueue.shift();
          savePendingQueue();
          if (pendingQueue.length > 0) {
            setStatus('spin-dot', 'Saving (' + pendingQueue.length + ' left)…');
            setTimeout(processPendingQueue, 400);
          } else setStatus('ok', allRows.length + ' words');
        } else setTimeout(processPendingQueue, 3000);
      }).catch(function() {
        setBusy(-1);
        setStatus('err', 'Sync failed');
        setTimeout(processPendingQueue, 5000);
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

    // ════════════════════════════════════════
    // NAV
    // ════════════════════════════════════════
    function goPage(id, navId) {
      document.querySelectorAll('.page').forEach(function(p) {
        p.classList.remove('active');
      });
      var page = el('page-' + id);
      if (page) page.classList.add('active');
      document.querySelectorAll('.nav button').forEach(function(b) {
        b.classList.remove('active');
      });
      var navBtn = el(navId);
      if (navBtn) navBtn.classList.add('active');
      if (id !== 'view') exitBulk();
      if (id === 'study') {
        var fsb = el('fc-speak-btn');
        if (fsb) fsb.style.display = studyDeck.length > 0 ? 'block' : 'none';
      }
    }

    // ════════════════════════════════════════
    // SORT
    // ════════════════════════════════════════
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

    // ════════════════════════════════════════
    // BLUR
    // ════════════════════════════════════════
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

    // ════════════════════════════════════════
    // BULK
    // ════════════════════════════════════════
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
      var cat = (el('bulkcat-sel') || {}).value || 'Words',
        keys = Array.from(selectedKeys);
      keys.forEach(function(k) {
        var r = allRows.find(function(r) {
          return wordKey(r) === k;
        });
        if (r) r.category = cat;
      });
      el('bulkcat-ovl').classList.remove('open');
      toast('Category updated for ' + keys.length + ' entries — syncing…', 'ok');
      saveCache(allRows);
      setBusy(1);
      var done = 0;
      if (SCRIPT_URL) {
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
            fetch(url.toString()).catch(function() {}).finally(function() {
              done++;
              if (done >= keys.length) setBusy(-1);
            });
          } else {
            done++;
            if (done >= keys.length) setBusy(-1);
          }
        });
      } else setBusy(-1);
      exitBulk();
      render();
    }

    function bulkDelete() {
      if (!selectedKeys.size) {
        toast('Select some entries first.', 'err');
        return;
      }
      if (!confirm('Delete ' + selectedKeys.size + ' entries? Cannot be undone.')) return;
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
      setBusy(1);
      var done = 0;
      if (SCRIPT_URL) {
        toDelete.forEach(function(r) {
          if (r.rowIndex > 0) {
            var url = new URL(SCRIPT_URL);
            url.searchParams.set('action', 'deleteWord');
            url.searchParams.set('tab', CURRENT_USER || MAIN_USER);
            url.searchParams.set('rowIndex', r.rowIndex);
            fetch(url.toString()).catch(function() {}).finally(function() {
              done++;
              if (done >= toDelete.length) setBusy(-1);
            });
          } else {
            done++;
            if (done >= toDelete.length) setBusy(-1);
          }
        });
      } else setBusy(-1);
      toast(toDelete.length + ' entries deleted', 'ok');
      exitBulk();
      render();
      renderFav();
      renderProgress();
    }

    // ════════════════════════════════════════
    // FAVOURITES
    // ════════════════════════════════════════
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
        var flds = ['english', 'khmer', 'romanization', 'notes', 'category'],
          f = flds[favSortCol];
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
        ten.innerHTML = q ? hlText(r.english || '', q) : esc(r.english || '');
        var tkh = mkTd('col-kh kh-cell kh', '');
        var khSpan = document.createElement('span');
        khSpan.innerHTML = q ? hlText(r.khmer || '', q) : esc(r.khmer || '');
        var spkBtn = document.createElement('button');
        spkBtn.className = 'row-speak-btn';
        spkBtn.textContent = ' 🔊';
        spkBtn.title = 'Hear Khmer';
        (function(row) {
          spkBtn.onclick = function(e) {
            e.stopPropagation();
            speakKhmer(row.khmer || '');
          };
        })(r);
        tkh.appendChild(khSpan);
        tkh.appendChild(spkBtn);
        var tro = mkTd('col-ro ro-cell', '');
        tro.innerHTML = q ? hlText(r.romanization || '', q) : esc(r.romanization || '');
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

    // ════════════════════════════════════════
    // VISIBLE ROWS
    // ════════════════════════════════════════
    function getRows() {
      var q = ((el('q') || {}).value || '').trim().toLowerCase(),
        cat = ((el('view-cat-filter') || {}).value) || 'All';
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
        var flds = ['english', 'khmer', 'romanization', 'notes', 'category'],
          f = flds[sortCol];
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

    // ════════════════════════════════════════
    // RENDER TABLE
    // ════════════════════════════════════════
    function render() {
      var rows = getRows(),
        q = S.highlight ? ((el('q') || {}).value || '').trim().toLowerCase() : '';
      var tbody = el('tbody');
      if (!tbody) return;
      tbody.innerHTML = '';
      rows.forEach(function(r) {
        var k = wordKey(r),
          tr = document.createElement('tr');
        if (selectedKeys.has(k)) tr.classList.add('selected');
        addRowHandlers(tr, r);
        var tsel = mkTd('col-sel', ''),
          chk = document.createElement('input');
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
        var khSpan = document.createElement('span');
        khSpan.innerHTML = q ? hlText(r.khmer || '', q) : esc(r.khmer || '');
        var spkBtn = document.createElement('button');
        spkBtn.className = 'row-speak-btn';
        spkBtn.textContent = ' 🔊';
        spkBtn.title = 'Hear Khmer';
        (function(row) {
          spkBtn.onclick = function(e) {
            e.stopPropagation();
            speakKhmer(row.khmer || '');
          };
        })(r);
        tkh.appendChild(khSpan);
        tkh.appendChild(spkBtn);
        var tro = mkTd('col-ro ro-cell', '');
        tro.innerHTML = q ? hlText(r.romanization || '', q) : esc(r.romanization || '');
        var tno = mkTd('col-no no-cell', ''),
          notes = r.notes || '';
        if (notes.length > 55) {
          tno.innerHTML = '<span class="note-short">' + esc(notes.slice(0, 55)) + '…</span><span class="note-full" style="display:none;white-space:normal">' + (q ? hlText(notes, q) : esc(notes)) + '</span> <button class="note-btn" onclick="expandNote(event,this)">▾</button>';
        } else tno.innerHTML = q ? hlText(notes, q) : esc(notes);
        var tca = mkTd('col-ca', ''),
          bdg = document.createElement('span');
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
      if (emm) emm.textContent = allRows.length === 0 ? 'Add some words or tap ↻ to sync.' : 'No entries match.';
      var bar = el('bar');
      if (bar) {
        var cv = (el('view-cat-filter') || {}).value || 'All',
          lbl = cv === 'All' ? '' : (cv === '__nosent__' ? ' · All exc. Sentences' : ' · ' + cv);
        bar.textContent = 'Showing ' + rows.length + ' of ' + allRows.length + ' entries' + lbl;
      }
    }

    function mkTd(cls, txt) {
      var td = document.createElement('td');
      if (cls) td.className = cls;
      if (txt) td.textContent = txt;
      return td;
    }

    // ════════════════════════════════════════
    // ROW / CELL HANDLERS
    // ════════════════════════════════════════
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

    // ════════════════════════════════════════
    // EDIT SHEET
    // ════════════════════════════════════════
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
      var addOtherBtn = el('add-from-other-btn');
      if (addOtherBtn) addOtherBtn.style.display = readOnlyMode ? 'block' : 'none';
      var titleEl = el('sheet-title');
      if (titleEl) titleEl.textContent = readOnlyMode ? '👁 Word Details' : '✏️ Edit Entry';
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
      if (!editRow || readOnlyMode) {
        if (readOnlyMode) toast('Read-only mode.', 'err');
        return;
      }
      if (!SCRIPT_URL) {
        toast('Connect your sheet in ⚙️ first.', 'err');
        return;
      }
      var en = (el('e-en').value || '').trim(),
        kh = (el('e-kh').value || '').trim();
      if (!en && !kh) {
        toast('English or Khmer required.', 'err');
        return;
      }
      var ro = (el('e-ro').value || '').trim(),
        no = (el('e-no').value || '').trim(),
        cat = (el('e-cat') || {}).value || 'Words';
      editRow.english = en;
      editRow.khmer = kh;
      editRow.romanization = ro;
      editRow.notes = no;
      editRow.category = cat;
      setEditLoading(true);
      setBusy(1);
      var url = new URL(SCRIPT_URL);
      url.searchParams.set('action', 'updateWord');
      ['english', 'khmer', 'romanization', 'notes', 'category', 'rowIndex'].forEach(function(f) {
        url.searchParams.set(f, editRow[f] || '');
      });
      url.searchParams.set('tab', CURRENT_USER || MAIN_USER);
      url.searchParams.set('user', CURRENT_USER || MAIN_USER);
      fetch(url.toString()).then(function(r) {
        return r.json();
      }).then(function(j) {
        setEditLoading(false);
        setBusy(-1);
        if (!j.success) throw new Error(j.error || 'Error');
        saveCache(allRows);
        render();
        renderFav();
        toast('Saved!', 'ok');
        closeSheet();
      }).catch(function(err) {
        setEditLoading(false);
        setBusy(-1);
        toast('Save failed: ' + err.message, 'err');
      });
    }

    function setEditLoading(v) {
      var btn = el('edit-btn'),
        lbl = el('edit-lbl'),
        sp = el('edit-spin');
      if (btn) btn.disabled = v;
      if (lbl) lbl.style.display = v ? 'none' : '';
      if (sp) sp.style.display = v ? '' : 'none';
    }

    function deleteEntry() {
      if (!editRow || !editRow.rowIndex || readOnlyMode) return;
      if (!confirm('Delete this entry?')) return;
      setBusy(1);
      if (SCRIPT_URL && editRow.rowIndex > 0) {
        var url = new URL(SCRIPT_URL);
        url.searchParams.set('action', 'deleteWord');
        url.searchParams.set('tab', CURRENT_USER || MAIN_USER);
        url.searchParams.set('rowIndex', editRow.rowIndex);
        fetch(url.toString()).catch(function() {}).finally(function() {
          setBusy(-1);
        });
      } else setBusy(-1);
      var k = wordKey(editRow);
      allRows = allRows.filter(function(r) {
        return wordKey(r) !== k;
      });
      favorites.delete(k);
      saveFavorites();
      saveCache(allRows);
      render();
      renderFav();
      renderProgress();
      toast('Deleted.', 'ok');
      closeSheet();
    }

    // ════════════════════════════════════════
    // ADD FROM OTHER'S SHEET
    // ════════════════════════════════════════
    function addWordFromOtherSheet() {
      if (!editRow || !MAIN_USER) {
        toast('Not signed in.', 'err');
        return;
      }
      var en = editRow.english || '',
        kh = editRow.khmer || '';
      if (!en && !kh) {
        toast('Nothing to add.', 'err');
        return;
      }
      var alreadyQueued = pendingQueue.some(function(q) {
        return q.english === en && q.khmer === kh;
      });
      if (alreadyQueued) {
        toast('Already in your queue!', 'inf');
        return;
      }
      var item = {
        english: en,
        khmer: kh,
        romanization: editRow.romanization || '',
        notes: editRow.notes || '',
        category: editRow.category || 'Words',
        tab: MAIN_USER,
        user: MAIN_USER
      };
      pendingQueue.push(item);
      savePendingQueue();
      toast('Added "' + esc(en || kh) + '" to your sheet queue!', 'ok');
      closeSheet();
      processPendingQueue();
    }

    // ════════════════════════════════════════
    // ADD ENTRY — rapid-send protected
    // ════════════════════════════════════════
    function submitAdd(e) {
      e.preventDefault();
      if (readOnlyMode) {
        toast('Read-only mode.', 'err');
        return;
      }
      if (submitLock) {
        toast('Please wait a moment before adding another word.', 'inf');
        return;
      }
      var en = (el('f-en').value || '').trim(),
        kh = (el('f-kh').value || '').trim();
      if (!en && !kh) {
        toast('Enter English or Khmer (or both).', 'err');
        return;
      }
      if (!SCRIPT_URL) {
        toast('Connect your sheet in ⚙️ first.', 'err');
        return;
      }
      var alreadyQueued = pendingQueue.some(function(q) {
        return q.english === en && q.khmer === kh;
      });
      if (alreadyQueued) {
        toast('Already queued — will sync shortly!', 'inf');
        return;
      }
      var alreadyLocal = allRows.some(function(r) {
        var enMatch = en ? (r.english || '').trim().toLowerCase() === en.toLowerCase() : true;
        var khMatch = kh ? (r.khmer || '').trim() === kh : true;
        return (en && kh) ? (enMatch && khMatch) : (en ? enMatch : khMatch);
      });
      if (alreadyLocal) {
        toast('This word is already in your list!', 'inf');
        return;
      }
      var ro = (el('f-ro').value || '').trim(),
        no = (el('f-no').value || '').trim(),
        cat = (el('f-cat') || {}).value || 'Words';
      var item = {
        english: en,
        khmer: kh,
        romanization: ro,
        notes: no,
        category: cat,
        tab: CURRENT_USER || MAIN_USER,
        user: CURRENT_USER || MAIN_USER
      };
      allRows.unshift(Object.assign({}, item, {
        dateAdded: new Date().toISOString().slice(0, 16).replace('T', ' '),
        rowIndex: 0
      }));
      saveCache(allRows);
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
      submitLock = true;
      if (submitLockTimer) clearTimeout(submitLockTimer);
      submitLockTimer = setTimeout(function() {
        submitLock = false;
      }, 700);
      pendingQueue.push(item);
      savePendingQueue();
      processPendingQueue();
    }

    // ════════════════════════════════════════
    // SRS
    // ════════════════════════════════════════
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

    // ════════════════════════════════════════
    // STUDY
    // ════════════════════════════════════════
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
      var filter = (el('study-filter') || {}).value || 'All',
        len = parseInt((el('study-len') || {}).value) || 20;
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
        var sid = filter.slice(4),
          sset = studySets.find(function(s) {
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
      } else pool.sort(function() {
        return Math.random() - .5;
      });
      studyDeck = pool.slice(0, len);
      studyIdx = 0;
      cardFlipped = false;
      sessionK = 0;
      sessionM = 0;
      sessionU = 0;
      var ss = el('session-summary'),
        sn = el('study-nav'),
        se = el('study-empty'),
        fc = el('flashcard'),
        fsb = el('fc-speak-btn');
      if (ss) ss.style.display = 'none';
      if (sn) sn.style.display = 'flex';
      if (se) se.style.display = studyDeck.length === 0 ? 'block' : 'none';
      if (fc) fc.style.display = studyDeck.length === 0 ? 'none' : 'flex';
      if (fsb) fsb.style.display = studyDeck.length > 0 ? 'block' : 'none';
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
      if (studyDir === 'kh') html += srsBadge + '<div class="fc-kh kh">' + esc(r.khmer || '?') + '</div><div class="fc-hint">Tap to reveal English</div>';
      else html += srsBadge + '<div class="fc-en">' + esc(r.english || '?') + '</div><div class="fc-hint">Tap to reveal Khmer</div>';
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
      if (r.khmer) speakKhmer(r.khmer);
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
        ss = el('session-summary'),
        fsb = el('fc-speak-btn');
      if (fc) fc.style.display = 'none';
      if (sn) sn.style.display = 'none';
      if (cb) cb.style.display = 'none';
      if (ss) ss.style.display = 'block';
      if (fsb) fsb.style.display = 'none';
      var ssk = el('ss-k'),
        ssm = el('ss-m'),
        ssu = el('ss-u');
      if (ssk) ssk.textContent = sessionK;
      if (ssm) ssm.textContent = sessionM;
      if (ssu) ssu.textContent = sessionU;
      var swb = el('ss-weak-btn');
      if (swb) swb.style.display = sessionU > 0 ? 'flex' : 'none';
    }

    // ════════════════════════════════════════
    // PROGRESS
    // ════════════════════════════════════════
    function renderProgress() {
      var total = allRows.length,
        favCount = 0,
        mastered = 0,
        studiedCount = 0;
      allRows.forEach(function(r) {
        if (isFav(r)) favCount++;
        if (confidence[wordKey(r)] === 2) mastered++;
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

      function buildShelf(sid, count, milestones) {
        var shelf = el(sid);
        if (!shelf) return;
        shelf.innerHTML = '';
        milestones.forEach(function(m) {
          var card = document.createElement('div');
          card.className = 'ms-card' + (count >= m.n ? ' unlocked' : '');
          card.innerHTML = '<div class="ms-icon">' + m.icon + '</div><div class="ms-name">' + m.name + '</div><div class="ms-req">' + (count >= m.n ? '✓' : m.n + ' words') + '</div>';
          shelf.appendChild(card);
        });
      }
      buildShelf('milestone-shelf-add', total, MILESTONES_ADD);
      buildShelf('milestone-shelf-study', studiedCount, MILESTONES_STUDY);
      var bars = el('pg-cat-bars');
      if (bars) {
        bars.innerHTML = '';
        var cats = {};
        allRows.forEach(function(r) {
          var c = r.category || '?';
          cats[c] = (cats[c] || 0) + 1;
        });
        var sorted = Object.keys(cats).sort(function(a, b) {
          return cats[b] - cats[a];
        });
        var t2 = total || 1;
        if (!sorted.length) {
          bars.innerHTML = '<div style="font-size:.78rem;color:var(--dim)">No data yet.</div>';
        }
        sorted.forEach(function(cat) {
          var pct = Math.round(cats[cat] / t2 * 100),
            row = document.createElement('div');
          row.className = 'cat-row';
          row.innerHTML = '<div class="cat-row-top"><span>' + esc(cat) + '</span><span>' + cats[cat] + ' (' + pct + '%)</span></div><div class="cat-bar-bg"><div class="cat-bar-fill" style="width:' + pct + '%"></div></div>';
          bars.appendChild(row);
        });
      }
      var ssets = el('pg-study-sets');
      if (ssets) {
        ssets.innerHTML = '';
        if (!studySets.length) ssets.innerHTML = '<div style="font-size:.78rem;color:var(--dim)">No study sets yet.</div>';
        else studySets.forEach(function(s) {
          var row = document.createElement('div');
          row.className = 'cat-row';
          row.innerHTML = '<div class="cat-row-top"><span>📚 ' + esc(s.name) + '</span><span>' + s.keys.length + ' words</span></div>';
          ssets.appendChild(row);
        });
      }
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
          var key = d2.toISOString().slice(0, 10),
            cnt = dc[key] || 0,
            cell = document.createElement('div');
          cell.className = 'hm-cell' + (cnt === 0 ? '' : cnt < 3 ? ' hm1' : cnt < 7 ? ' hm2' : ' hm3');
          cell.title = key + ': ' + cnt + ' words';
          hm.appendChild(cell);
        }
      }
    }

    // ════════════════════════════════════════
    // DASHBOARD
    // ════════════════════════════════════════
    function loadDashboard() {
      if (!SCRIPT_URL) {
        el('dash-loading').style.display = 'none';
        el('dash-content').style.display = 'none';
        el('dash-error').style.display = 'block';
        el('dash-error-msg').textContent = 'Connect your sheet in ⚙️ first.';
        return;
      }
      el('dash-loading').style.display = 'block';
      el('dash-content').style.display = 'none';
      el('dash-error').style.display = 'none';
      Promise.all([
        fetch(SCRIPT_URL + '?action=getStats').then(function(r) {
          return r.json();
        }),
        fetch(SCRIPT_URL + '?action=getData&user=' + encodeURIComponent('📋 All Words')).then(function(r) {
          return r.json();
        })
      ]).then(function(results) {
        el('dash-loading').style.display = 'none';
        el('dash-content').style.display = 'block';
        if (!results[0].success) throw new Error(results[0].error || 'Failed');
        renderDashboard(results[0], results[1]);
      }).catch(function(err) {
        el('dash-loading').style.display = 'none';
        el('dash-error').style.display = 'block';
        el('dash-error-msg').textContent = 'Error: ' + err.message + '. Check your sheet connection.';
      });
    }

    function renderDashboard(stats, awData) {
      var cards = el('dash-stat-cards');
      if (cards) cards.innerHTML = [
        ['Total Words', stats.totalWords || 0],
        ['Total Users', stats.userCount || 0]
      ].map(function(d) {
        return '<div class="stat-card"><div class="sc-val">' + d[1] + '</div><div class="sc-lbl">' + d[0] + '</div></div>';
      }).join('');
      var usersEl = el('dash-users');
      if (usersEl) {
        usersEl.innerHTML = '';
        var users = (stats.users || []).slice().sort(function(a, b) {
          return b.wordCount - a.wordCount;
        });
        if (!users.length) {
          usersEl.innerHTML = '<div style="font-size:.78rem;color:var(--dim)">No users yet.</div>';
        } else users.forEach(function(u) {
          var row = document.createElement('div');
          row.className = 'cat-row';
          var pct = stats.totalWords ? Math.round(u.wordCount / stats.totalWords * 100) : 0;
          var youTag = u.name === MAIN_USER ? ' <span style="color:var(--acc3);font-size:.65rem;font-weight:700">(you)</span>' : '';
          row.innerHTML = '<div class="cat-row-top"><span>' + esc(u.name) + youTag + '</span><span>' + u.wordCount + ' (' + pct + '%)</span></div><div class="cat-bar-bg"><div class="cat-bar-fill" style="width:' + pct + '%"></div></div>';
          usersEl.appendChild(row);
        });
      }
      var recentEl = el('dash-recent');
      if (recentEl) {
        recentEl.innerHTML = '';
        var tabData = awData && awData.data ? awData.data : {};
        var recentRows = tabData['📋 All Words'] || [];
        if (!recentRows.length) {
          recentEl.innerHTML = '<div style="font-size:.78rem;color:var(--dim)">No recent activity.</div>';
        } else recentRows.slice(0, 10).forEach(function(r) {
          var item = document.createElement('div');
          item.className = 'dash-row-item';
          item.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span class="kh" style="color:var(--acc3);font-size:1rem">' + esc(r.khmer || '—') + '</span><span style="color:var(--dim);font-size:.68rem">' + esc(r.dateAdded || '') + '</span></div><div style="font-size:.78rem;color:var(--text)">' + esc(r.english || '—') + ' <span style="color:var(--dim);font-size:.68rem">by ' + esc(r.addedBy || '?') + '</span></div>';
          if (r.addedBy !== MAIN_USER) {
            var addBtn = document.createElement('button');
            addBtn.style.cssText = 'margin-top:4px;padding:3px 8px;font-size:.7rem;background:rgba(20,184,166,.1);border:1px solid rgba(20,184,166,.3);border-radius:6px;color:#5eead4;cursor:pointer';
            addBtn.textContent = '➕ Add to my sheet';
            (function(row) {
              addBtn.onclick = function() {
                var item2 = {
                  english: row.english || '',
                  khmer: row.khmer || '',
                  romanization: row.romanization || '',
                  notes: row.notes || '',
                  category: row.category || 'Words',
                  tab: MAIN_USER,
                  user: MAIN_USER
                };
                var dupe = pendingQueue.some(function(q) {
                  return q.english === item2.english && q.khmer === item2.khmer;
                });
                if (dupe) {
                  toast('Already queued!', 'inf');
                  return;
                }
                pendingQueue.push(item2);
                savePendingQueue();
                toast('Added "' + esc(item2.english || item2.khmer) + '" to your queue!', 'ok');
                addBtn.textContent = '✓ Queued';
                addBtn.disabled = true;
                processPendingQueue();
              };
            })(r);
            item.appendChild(addBtn);
          }
          recentEl.appendChild(item);
        });
      }
      var updEl = el('dash-updated');
      if (updEl) updEl.textContent = 'Last refreshed: ' + new Date().toLocaleString();
    }

    // ════════════════════════════════════════
    // REFERENCE
    // ════════════════════════════════════════
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
        },
        {
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
        },
        {
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
        },
        {
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
        },
        {
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
        },
        {
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
        },
        {
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
        }
      ];
      var depVow = [{
          kh: '◌ (none)',
          s1: 'a',
          s2: 'o',
          ex: '"a" like f*a*ther / "o" like b*o*ne'
        },
        {
          kh: '◌ា',
          s1: 'aa',
          s2: 'ie',
          ex: '"aa" like sp*a* / "ie" like p*ie*r'
        },
        {
          kh: '◌ិ',
          s16: 'e',
          s2: 'i',
          ex: '"e" like b*e*t / "i" like f*ee*t'
        },
        {
          kh: '◌ី',
          s1: 'ey',
          s2: 'ii',
          ex: '"ey" like h*ey* / "ii" like s*ee*'
        },
        {
          kh: '◌ឹ',
          s1: 'eu',
          s2: 'eu',
          ex: '"eu" like h*er* (no English match)'
        },
        {
          kh: '◌ឺ',
          s1: 'eu (long)',
          s2: 'eu (long)',
          ex: '"eu" like h*er*, held longer'
        },
        {
          kh: '◌ុ',
          s1: 'o',
          s2: 'u',
          ex: '"o" like b*oo*k / "u" like b*oo*t'
        },
        {
          kh: '◌ូ',
          s1: 'ou',
          s2: 'uu',
          ex: '"ou" like b*oa*t / "uu" like b*oo*t'
        },
        {
          kh: '◌ួ',
          s1: 'ua',
          s2: 'ua',
          ex: '"ua" like t*ou*r'
        },
        {
          kh: '◌ើ',
          s1: 'ae',
          s2: 'oe',
          ex: '"ae" like wh*ere* / "oe" like h*er*'
        },
        {
          kh: '◌ែ',
          s1: 'ae',
          s2: 'ae',
          ex: '"ae" like b*are*'
        },
        {
          kh: '◌ៃ',
          s1: 'ai',
          s2: 'e',
          ex: '"ai" like Th*ai* / "e" like b*ed*'
        },
        {
          kh: '◌ោ',
          s1: 'ao',
          s2: 'oo',
          ex: '"ao" like M*ao* / "oo" like b*oo*t'
        },
        {
          kh: '◌ំ',
          s1: 'om',
          s2: 'um',
          ex: '"om" like b*om*b / "um" like g*um*'
        },
        {
          kh: '◌ះ',
          s1: 'ah',
          s2: 'eh',
          ex: 'Short final — cut off quickly'
        },
        {
          kh: '◌ាំ',
          s1: 'am',
          s2: 'eam',
          ex: '"am" like h*um* / "eam" like st*eam*'
        }
      ];
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
        },
        {
          kh: 'អរគុណ',
          ro: 'aw kun',
          en: 'Thank you'
        }, {
          kh: 'សូមទោស',
          ro: 'som tooh',
          en: 'Sorry / Excuse me'
        },
        {
          kh: 'មិនអីទេ',
          ro: 'min ei te',
          en: 'No problem'
        }, {
          kh: 'ជំរាបលា',
          ro: 'jum reap lea',
          en: 'Goodbye (formal)'
        },
        {
          kh: 'លា​ហើយ',
          ro: 'lea haey',
          en: 'Bye (informal)'
        }, {
          kh: 'ចាស',
          ro: 'jas',
          en: 'Yes (female polite)'
        },
        {
          kh: 'បាទ',
          ro: 'baat',
          en: 'Yes (male polite)'
        }, {
          kh: 'ទេ',
          ro: 'te',
          en: 'No'
        },
        {
          kh: 'ខ្ញុំ',
          ro: "kh'nyom",
          en: 'I / me'
        }, {
          kh: 'អ្នក',
          ro: 'neak',
          en: 'You'
        },
        {
          kh: 'ភាសាខ្មែរ',
          ro: 'phiesa khmer',
          en: 'Khmer language'
        }, {
          kh: 'ខ្ញុំមិនយល់ទេ',
          ro: "kh'nyom min yol te",
          en: "I don't understand"
        },
        {
          kh: 'ប៉ុន្មាន?',
          ro: 'ponmaan?',
          en: 'How much?'
        }, {
          kh: 'ទីនេះ',
          ro: 'ti nih',
          en: 'Here'
        }, {
          kh: 'ទីនោះ',
          ro: 'ti noh',
          en: 'There'
        }
      ];
      var phoneticGroups = [{
          header: 'Long Vowels',
          rows: [{
              sym: 'ូ / oo',
              sound: 'oo',
              ex: 'like "b*oo*t"'
            },
            {
              sym: 'ី / ii',
              sound: 'ee',
              ex: 'like "f*ee*t"'
            },
            {
              sym: 'ា / aa',
              sound: 'aa',
              ex: 'like "f*a*ther"'
            },
            {
              sym: 'ែ / ae',
              sound: 'air',
              ex: 'like "*air*"'
            },
            {
              sym: 'ួ / ua',
              sound: 'oo-a',
              ex: 'like "t*ou*r"'
            }
          ]
        },
        {
          header: 'Short Vowels',
          rows: [{
              sym: 'ុ / o',
              sound: 'oo',
              ex: 'like "b*oo*k"'
            },
            {
              sym: 'ិ / e',
              sound: 'eh',
              ex: 'like "b*e*t"'
            },
            {
              sym: 'ឹ / eu',
              sound: 'er',
              ex: 'like "h*er*" (no lip rounding)'
            },
            {
              sym: 'ំ / om',
              sound: 'um',
              ex: 'like "g*um*" (nasal)'
            }
          ]
        },
        {
          header: 'Consonants — Stops',
          rows: [{
              sym: 'ក / k',
              sound: 'k',
              ex: 'hard "k" like "k*e*y"'
            },
            {
              sym: 'ប / p',
              sound: 'p/b',
              ex: '"p" at start, unreleased at end'
            },
            {
              sym: 'ត / t',
              sound: 't',
              ex: 'like "*t*op"'
            },
            {
              sym: 'ដ / d',
              sound: 'd',
              ex: 'like "*d*oor"'
            },
            {
              sym: 'ច / ch',
              sound: 'ch',
              ex: 'like "*ch*air"'
            }
          ]
        },
        {
          header: 'Consonants — Nasals & Approx.',
          rows: [{
              sym: 'ម / m',
              sound: 'm',
              ex: 'like "*m*oon"'
            },
            {
              sym: 'ន / n',
              sound: 'n',
              ex: 'like "*n*ow"'
            },
            {
              sym: 'ង / ng',
              sound: 'ng',
              ex: 'like "ri*ng*" — CAN start syllables!'
            },
            {
              sym: 'ញ / ny',
              sound: 'ny',
              ex: 'like "ca*ny*on"'
            },
            {
              sym: 'យ / y',
              sound: 'y',
              ex: 'like "*y*es"'
            },
            {
              sym: 'រ / r',
              sound: 'r',
              ex: 'soft "r" — sometimes silent at end'
            }
          ]
        },
        {
          header: 'Consonants — Fricatives',
          rows: [{
              sym: 'ស / s',
              sound: 's',
              ex: 'always sharp "s" like "*s*un" — never "z"'
            },
            {
              sym: 'ហ / h',
              sound: 'h',
              ex: 'like "*h*ello"'
            },
            {
              sym: 'វ / w',
              sound: 'w/v',
              ex: 'between English "w" and "v"'
            }
          ]
        },
        {
          header: 'Aspirated Consonants',
          rows: [{
              sym: 'ខ / kh',
              sound: 'kh',
              ex: '"k" + puff of air like "*kh*aki"'
            },
            {
              sym: 'ថ / th',
              sound: 'th',
              ex: 'NOT English "the" — say "t" + air, like "*T*hai"'
            },
            {
              sym: 'ភ / ph',
              sound: 'ph',
              ex: 'NOT "f" — say "p" + air, like "*P*hilip"'
            },
            {
              sym: 'ឆ / chh',
              sound: 'chh',
              ex: '"ch" + puff of air'
            }
          ]
        }
      ];

      function buildGrid5(id, items) {
        var g = el(id);
        if (!g) return;
        g.innerHTML = '';
        items.forEach(function(c) {
          var card = document.createElement('div');
          card.className = 'ref-card';
          var s1 = c.s === 1 ? '<div class="ref-ro" style="color:rgba(165,180,252,.5);font-size:.56rem">S1</div>' : c.s === 2 ? '<div class="ref-ro" style="color:rgba(192,132,252,.5);font-size:.56rem">S2</div>' : '';
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
          tr.innerHTML = '<td class="vt-kh kh">' + v.kh + '</td><td class="vt-ro">' + v.s1 + '</td><td class="vt-ro">' + v.s2 + '</td><td class="vt-ex" style="white-space:normal;line-height:1.5">' + esc(v.ex) + '</td>';
          dvb.appendChild(tr);
        });
      }
      var pg = el('ref-phonetic-grid');
      if (pg) {
        pg.innerHTML = '';
        phoneticGroups.forEach(function(grp) {
          var card = document.createElement('div');
          card.className = 'ref-phonetic-card';
          var rowsHtml = grp.rows.map(function(r) {
            return '<div class="rpc-row"><span class="rpc-sym kh">' + r.sym.split(' / ')[0] + '</span><span class="rpc-sound">' + r.sound + '</span><span class="rpc-ex">' + esc(r.ex) + '</span></div>';
          }).join('');
          card.innerHTML = '<div class="rpc-header">' + esc(grp.header) + '</div>' + rowsHtml;
          pg.appendChild(card);
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

    // ════════════════════════════════════════
    // TRANSLATION TAB — 10-API Dictionary
    // ════════════════════════════════════════
    var dictState = {
      results: {},
      query: '',
      detectedLang: 'en',
      targetLang: 'km',
      activeTab: 'summary'
    };

    function dictIsKhmer(text) {
      return /[\u1780-\u17FF]/.test(text);
    }

    function dictClean(text) {
      if (!text) return '';
      return text.replace(/\[([^\]]+)\]/g, '$1').replace(/<[^>]*>/g, '').trim();
    }

    function dictHL(text, term) {
      if (!term) return text;
      var re = new RegExp('(' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      return text.replace(re, '<span class="trans-hl">$1</span>');
    }

    async function dictFetchApi1(word, from, to) {
      var url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=' + from + '&tl=' + to + '&dt=t&dt=bd&dt=ex&q=' + encodeURIComponent(word);
      var resp = await fetch(url);
      if (!resp.ok) throw new Error('Failed');
      var data = await resp.json();
      var results = [],
        primary = data[0]?.[0]?.[0];
      if (data[1]) data[1].forEach(function(pg) {
        pg[1].forEach(function(trans, idx) {
          results.push({
            definition: trans,
            pos: pg[0],
            example: data[13]?.[idx]?.[0] ? dictClean(data[13][idx][0]) : '',
            frequency: 100 - (idx * 5)
          });
        });
      });
      if (!results.length && primary) results.push({
        definition: primary,
        pos: 'Translation',
        example: data[0]?.[0]?.[1] || '',
        frequency: 100
      });
      return {
        name: 'Google Translate',
        results: results,
        status: 'success',
        metadata: {
          'Pair': from + '→' + to,
          'Definitions': results.length
        }
      };
    }
    async function dictFetchApi2(word, from, to) {
      var url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(word) + '&langpair=' + from + '|' + to + '&de=lexidict@example.com';
      var resp = await fetch(url);
      if (!resp.ok) throw new Error('Failed');
      var data = await resp.json();
      if (data.responseStatus !== 200 || !data.responseData?.translatedText) throw new Error('No translation');
      var results = [{
        definition: data.responseData.translatedText,
        pos: 'Primary Translation',
        example: '',
        frequency: 100
      }];
      if (data.matches && data.matches.length > 1) data.matches.slice(0, 4).forEach(function(m, idx) {
        if (m.translation && m.translation.toLowerCase() !== data.responseData.translatedText.toLowerCase()) results.push({
          definition: m.translation,
          pos: 'Alternative',
          example: m.original || '',
          frequency: 80 - (idx * 15)
        });
      });
      return {
        name: 'MyMemory',
        results: results,
        status: 'success',
        metadata: {
          'Matches': (data.matches?.length || 0).toString()
        }
      };
    }
    async function dictFetchApi3(word, from, to) {
      var url = 'https://lingva.ml/api/v1/' + from + '/' + to + '/' + encodeURIComponent(word);
      var resp = await fetch(url);
      if (!resp.ok) throw new Error('Failed');
      var data = await resp.json();
      if (!data.translation) throw new Error('No translation');
      var results = [{
        definition: data.translation,
        pos: 'Primary',
        example: '',
        frequency: 100
      }];
      if (data.info?.definitions) data.info.definitions.slice(0, 3).forEach(function(d) {
        if (d.definition) results.push({
          definition: d.definition,
          pos: d.type || 'Definition',
          example: d.example || '',
          frequency: 85
        });
      });
      return {
        name: 'Lingva',
        results: results,
        status: 'success',
        metadata: {
          'Type': 'Open Source'
        }
      };
    }
    async function dictFetchApi4(word, from, to) {
      var resp = await fetch('https://libretranslate.com/translate', {
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
      var data = await resp.json();
      if (!data.translatedText) throw new Error('No translation');
      return {
        name: 'LibreTranslate',
        results: [{
          definition: data.translatedText,
          pos: 'Translation',
          example: '',
          frequency: 100
        }],
        status: 'success',
        metadata: {
          'License': 'AGPL-3.0'
        }
      };
    }
    async function dictFetchApi5(word, from, to) {
      var url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=' + from + '&tl=' + to + '&dt=t&q=' + encodeURIComponent(word);
      var resp = await fetch(url);
      if (!resp.ok) throw new Error('Failed');
      var data = await resp.json();
      if (!data[0]?.[0]?.[0]) throw new Error('No translation');
      return {
        name: 'Alt Translator',
        results: [{
          definition: data[0][0][0],
          pos: 'Quick Translation',
          example: data[0][0][1] || '',
          frequency: 95
        }],
        status: 'success',
        metadata: {
          'Speed': 'Ultra-Fast'
        }
      };
    }
    async function dictFetchApi6(word, from, to) {
      var url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(word) + '&langpair=' + from + '|' + to;
      var resp = await fetch(url);
      if (!resp.ok) throw new Error('Failed');
      var data = await resp.json();
      if (!data.responseData?.translatedText) throw new Error('No translation');
      return {
        name: 'Translator API',
        results: [{
          definition: data.responseData.translatedText,
          pos: 'Standard',
          example: '',
          frequency: 90
        }],
        status: 'success',
        metadata: {
          'Quality': 'Verified'
        }
      };
    }
    async function dictFetchApi7(word, from, to) {
      var url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(word) + '&langpair=' + from + '|' + to + '&de=lexidict.app@app.com';
      var resp = await fetch(url);
      if (!resp.ok) throw new Error('Failed');
      var data = await resp.json();
      if (!data.responseData?.translatedText) throw new Error('No translation');
      var results = [{
        definition: data.responseData.translatedText,
        pos: 'Definition',
        example: '',
        frequency: 85
      }];
      if (data.matches) data.matches.slice(1, 3).forEach(function(m) {
        if (m.translation) results.push({
          definition: m.translation,
          pos: 'Related',
          example: m.original || '',
          frequency: 70
        });
      });
      return {
        name: 'Word Direct',
        results: results,
        status: 'success',
        metadata: {
          'Matches': (data.matches?.length || 0).toString()
        }
      };
    }
    async function dictFetchApi8(word, from, to) {
      var url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(word) + '&langpair=' + from + '|' + to + '&de=lexidict.bing@app.com';
      var resp = await fetch(url);
      if (!resp.ok) throw new Error('Failed');
      var data = await resp.json();
      if (!data.responseData?.translatedText) throw new Error('No translation');
      return {
        name: 'Bing Variant',
        results: [{
          definition: data.responseData.translatedText,
          pos: 'Bing Translation',
          example: '',
          frequency: 88
        }],
        status: 'success',
        metadata: {
          'Type': 'Parallel'
        }
      };
    }
    async function dictFetchApi9(word, from, to) {
      var url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=' + from + '&tl=' + to + '&dt=t&q=' + encodeURIComponent(word);
      var resp = await fetch(url);
      if (!resp.ok) throw new Error('Failed');
      var data = await resp.json();
      if (!data[0]?.[0]?.[0]) throw new Error('No translation');
      return {
        name: 'Direct Google',
        results: [{
          definition: data[0][0][0],
          pos: 'Simplified',
          example: '',
          frequency: 100
        }],
        status: 'success',
        metadata: {
          'Method': 'Direct'
        }
      };
    }
    async function dictFetchApi10(word, from, to) {
      var url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(word) + '&langpair=' + from + '|' + to + '&de=lexidict.enhanced@app.com';
      var resp = await fetch(url);
      if (!resp.ok) throw new Error('Failed');
      var data = await resp.json();
      if (!data.responseData?.translatedText) throw new Error('No translation');
      var results = [{
        definition: data.responseData.translatedText,
        pos: 'Enhanced',
        example: '',
        frequency: 92
      }];
      if (data.matches && data.matches.length > 2) data.matches.slice(0, 3).forEach(function(m) {
        if (m.translation) results.push({
          definition: m.translation,
          pos: 'Variant',
          example: m.original || '',
          frequency: 80
        });
      });
      return {
        name: 'Enhanced Memory',
        results: results,
        status: 'success',
        metadata: {
          'Mode': 'Multi-match',
          'Variants': (data.matches?.length || 0).toString()
        }
      };
    }

    async function dictFetchAll(word) {
      var from = dictIsKhmer(word) ? 'km' : 'en',
        to = from === 'km' ? 'en' : 'km';
      dictState.detectedLang = from;
      dictState.targetLang = to;
      var apis = [{
          fn: function() {
            return dictFetchApi1(word, from, to);
          },
          name: 'API1'
        },
        {
          fn: function() {
            return dictFetchApi2(word, from, to);
          },
          name: 'API2'
        },
        {
          fn: function() {
            return dictFetchApi3(word, from, to);
          },
          name: 'API3'
        },
        {
          fn: function() {
            return dictFetchApi4(word, from, to);
          },
          name: 'API4'
        },
        {
          fn: function() {
            return dictFetchApi5(word, from, to);
          },
          name: 'API5'
        },
        {
          fn: function() {
            return dictFetchApi6(word, from, to);
          },
          name: 'API6'
        },
        {
          fn: function() {
            return dictFetchApi7(word, from, to);
          },
          name: 'API7'
        },
        {
          fn: function() {
            return dictFetchApi8(word, from, to);
          },
          name: 'API8'
        },
        {
          fn: function() {
            return dictFetchApi9(word, from, to);
          },
          name: 'API9'
        },
        {
          fn: function() {
            return dictFetchApi10(word, from, to);
          },
          name: 'API10'
        }
      ];
      dictState.results = {};
      await Promise.all(apis.map(async function(api) {
        try {
          var result = await Promise.race([api.fn(), new Promise(function(_, reject) {
            setTimeout(function() {
              reject(new Error('Timeout'));
            }, 8000);
          })]);
          dictState.results[api.name] = result;
        } catch (err) {
          dictState.results[api.name] = {
            name: api.name,
            results: [],
            status: 'error',
            error: err.message,
            metadata: {}
          };
        }
      }));
      var ok = Object.values(dictState.results).filter(function(r) {
        return r.status === 'success';
      }).length;
      if (ok === 0) throw new Error('All 10 APIs failed. Check your internet connection.');
    }

    function dictRenderLoading() {
      el('dict-content').innerHTML = '<div class="trans-loading"><div class="trans-spinner"></div><p>Querying 10 translation APIs simultaneously…</p></div>';
    }

    function dictRenderError(msg) {
      el('dict-content').innerHTML = '<div class="trans-error-box"><h3>⚠ Search Error</h3><p>' + esc(msg) + '</p></div>';
    }

    function dictRenderResults() {
      var results = dictState.results,
        query = dictState.query,
        tab = dictState.activeTab;
      var ok = Object.values(results).filter(function(r) {
        return r.status === 'success';
      }).length;
      var html = '<div class="trans-entry-header"><div><div class="trans-word">' + esc(query) + '</div><div class="trans-detected">Detected: ' + (dictState.detectedLang === 'km' ? 'Khmer 🇰🇭' : 'English 🇬🇧') + '</div></div><div class="trans-result-count">' + ok + ' / 10 APIs</div></div>';
      if (tab === 'summary') html += dictRenderSummary(results, query);
      else if (tab === 'all') html += dictRenderAll(results, query);
      else html += dictRenderMeta(results);
      el('dict-content').innerHTML = html;
    }

    function dictRenderSummary(results, query) {
      var success = Object.values(results).filter(function(r) {
        return r.status === 'success';
      });
      if (!success.length) return '<div class="trans-no-results"><p>No successful results.</p></div>';
      var allDefs = [],
        allEx = [];
      success.forEach(function(api) {
        api.results.forEach(function(r) {
          if (r.definition) allDefs.push({
            text: r.definition,
            pos: r.pos,
            api: api.name
          });
          if (r.example && dictClean(r.example).length > 5) allEx.push({
            text: r.example,
            api: api.name
          });
        });
      });
      var uniqDefs = Array.from(new Map(allDefs.map(function(d) {
        return [d.text.toLowerCase(), d];
      })).values());
      var uniqEx = Array.from(new Map(allEx.map(function(e) {
        return [e.text.toLowerCase(), e];
      })).values());
      var html = '<div class="trans-summary-box"><div class="trans-def-title">📚 Definitions (' + uniqDefs.length + ')</div><ul class="trans-def-list">';
      uniqDefs.slice(0, 10).forEach(function(def) {
        html += '<li><span class="trans-def-pos">' + esc(def.pos) + '</span><div class="trans-def-text">' + dictHL(dictClean(def.text), query) + '</div><div class="trans-def-source">📌 ' + esc(def.api) + '</div></li>';
      });
      html += '</ul>';
      if (uniqEx.length) {
        html += '<div class="trans-def-title" style="margin-top:14px">💬 Examples (' + uniqEx.length + ')</div>';
        uniqEx.slice(0, 5).forEach(function(ex) {
          html += '<div class="trans-example"><strong style="font-size:.65rem;color:var(--dim)">From ' + esc(ex.api) + ':</strong><br>"' + dictHL(dictClean(ex.text), query) + '"</div>';
        });
      }
      html += '</div>';
      return html;
    }

    function dictRenderAll(results, query) {
      var success = Object.entries(results).filter(function(x) {
        return x[1].status === 'success';
      });
      if (!success.length) return '<div class="trans-no-results"><p>No successful API results.</p></div>';
      var html = '<div class="trans-api-grid">';
      success.forEach(function(x) {
        var apiData = x[1];
        html += '<div class="trans-api-card"><div class="trans-api-hdr"><span class="trans-api-name">' + esc(apiData.name) + '</span><span class="trans-api-ok">✓ OK</span></div>';
        if (apiData.results?.length) {
          html += '<ul class="trans-def-list">';
          apiData.results.slice(0, 4).forEach(function(r) {
            var c = dictClean(r.definition);
            if (c) {
              html += '<li><span class="trans-def-pos">' + esc(r.pos) + '</span><div class="trans-def-text">' + dictHL(c, query) + '</div>';
              if (r.example && dictClean(r.example).length > 5) html += '<div class="trans-example">"' + dictHL(dictClean(r.example), query) + '"</div>';
              html += '</li>';
            }
          });
          html += '</ul>';
        }
        if (apiData.metadata && Object.keys(apiData.metadata).length) {
          html += '<div class="trans-meta-box">';
          Object.entries(apiData.metadata).forEach(function(m) {
            html += esc(m[0]) + ': <strong>' + esc(m[1]) + '</strong> &nbsp;';
          });
          html += '</div>';
        }
        html += '</div>';
      });
      html += '</div>';
      return html;
    }

    function dictRenderMeta(results) {
      var html = '<div style="overflow-x:auto"><table class="trans-meta-table"><tr><th>API</th><th>Status</th><th>Results</th><th>Details</th></tr>';
      var success = [],
        errors = [];
      Object.values(results).forEach(function(r) {
        if (r.status === 'success') success.push(r);
        else errors.push(r);
      });
      success.forEach(function(d) {
        html += '<tr><td><strong>' + esc(d.name) + '</strong></td><td><span class="trans-api-ok" style="padding:2px 6px;border-radius:3px;font-size:.7rem;font-weight:700">✓</span></td><td>' + (d.results?.length || 0) + '</td><td style="font-size:.72rem;color:var(--dim)">' + Object.entries(d.metadata || {}).map(function(x) {
          return esc(x[0]) + ': ' + esc(x[1]);
        }).join(' · ') + '</td></tr>';
      });
      errors.forEach(function(d) {
        html += '<tr style="opacity:.6"><td><strong>' + esc(d.name) + '</strong></td><td><span class="trans-api-err" style="padding:2px 6px;border-radius:3px;font-size:.7rem;font-weight:700">✗</span></td><td>0</td><td style="font-size:.72rem;color:var(--bad)">' + esc(d.error || 'Unknown error') + '</td></tr>';
      });
      html += '</table></div>';
      return html;
    }

    async function dictSearch(word) {
      word = (word || '').trim();
      if (!word) return;
      dictState.query = word;
      el('dict-input').value = word;
      dictRenderLoading();
      try {
        await dictFetchAll(word);
        dictRenderResults();
      } catch (e) {
        dictRenderError(e.message);
      }
    }

    // ════════════════════════════════════════
    // CSV IMPORT / EXPORT
    // ════════════════════════════════════════
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
      if (MAIN_USER && !SCRIPT_URL) onboardComplete(true);
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

              function fc(name) {
                return header.findIndex(function(h) {
                  return h.toLowerCase() === name.toLowerCase();
                });
              }
              var enIdx = fc('english'),
                khIdx = fc('khmer');
              if (enIdx === -1 && khIdx === -1) {
                showCsvErr('Missing "English" or "Khmer" header.');
                return;
              }
              var roIdx = fc('romanization'),
                noIdx = fc('notes'),
                caIdx = fc('category'),
                dtIdx = fc('date added');
              var _n = new Date(),
                _p = function(x) {
                  return x < 10 ? '0' + x : String(x);
                };
              csvParsed = [];
              var skipped = 0,
                today = _n.getFullYear() + '-' + _p(_n.getMonth() + 1) + '-' + _p(_n.getDate()) + ' ' + _p(_n.getHours()) + ':' + _p(_n.getMinutes());
              rows.slice(1).forEach(function(row) {
                var en = enIdx >= 0 ? (row[enIdx] || '').trim() : '',
                  kh = khIdx >= 0 ? (row[khIdx] || '').trim() : '';
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
                showCsvErr('No valid new rows found.' + (skipped ? ' ' + skipped + ' skipped.' : ''));
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
      toast('Importing ' + words.length + ' words…', 'inf');
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
      var CHUNK = 20,
        chunks = [];
      for (var i = 0; i < words.length; i += CHUNK) chunks.push(words.slice(i, i + CHUNK));
      importState = {
        active: true,
        total: words.length,
        sent: 0,
        failed: 0,
        label: 'Sending batch 1/' + chunks.length + '…'
      };
      setBusy(1);
      updateImportProgress();

      function sendChunk(ci) {
        if (ci >= chunks.length) {
          importState.active = false;
          setBusy(-1);
          toast(importState.failed === 0 ? '✓ ' + importState.sent + ' words imported!' : importState.sent + ' imported, ' + importState.failed + ' failed.', importState.failed === 0 ? 'ok' : 'err');
          setStatus('ok', allRows.length + ' words');
          loadData();
          return;
        }
        var chunk = chunks[ci];
        importState.label = 'Sending batch ' + (ci + 1) + '/' + chunks.length + '…';
        updateImportProgress();
        var url = new URL(SCRIPT_URL);
        url.searchParams.set('action', 'importWords');
        url.searchParams.set('user', MAIN_USER);
        url.searchParams.set('tab', MAIN_USER);
        url.searchParams.set('words', JSON.stringify(chunk));
        fetch(url.toString()).then(function(r) {
          return r.json();
        }).then(function(j) {
          if (j.success) importState.sent += (j.imported || chunk.length);
          else importState.failed += chunk.length;
          updateImportProgress();
          setTimeout(function() {
            sendChunk(ci + 1);
          }, 600);
        }).catch(function() {
          importState.failed += chunk.length;
          updateImportProgress();
          setTimeout(function() {
            sendChunk(ci + 1);
          }, 600);
        });
      }
      sendChunk(0);
    }
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
      var csv = lines.join('\n'),
        filename = 'khmer-vocab-' + new Date().toISOString().slice(0, 10) + '.csv';
      if ('showSaveFilePicker' in window) {
        try {
          var handle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: 'CSV',
              accept: {
                'text/csv': ['.csv']
              }
            }]
          });
          var w = await handle.createWritable();
          await w.write(csv);
          await w.close();
          toast('CSV saved! ✓', 'ok');
          return;
        } catch (e) {
          if (e.name === 'AbortError') return;
        }
      }
      blobDownload(csv, filename);
    }

    function blobDownload(content, filename) {
      var blob = new Blob([content], {
        type: 'text/csv;charset=utf-8'
      });
      var url = URL.createObjectURL(blob),
        a = document.createElement('a');
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

    // ════════════════════════════════════════
    // TOAST
    // ════════════════════════════════════════
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

    // ════════════════════════════════════════
    // START
    // ════════════════════════════════════════
    document.addEventListener('DOMContentLoaded', init);

    (() => {
      const ENTRY = 'Khmer Vocabulary v7',
        KEY = 'Ion-o-koji Watermark';
      const logs = (localStorage.getItem(KEY) || "").split('\n').map(line => line.replace(/^- /, '').trim()).filter(line => line && line !== ENTRY);
      logs.push(ENTRY);
      localStorage.setItem(KEY, logs.map(item => `- ${item}`).join('\n'));
    })();

  
