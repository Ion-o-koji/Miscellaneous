/* ========== VERSION CHECK & CACHE BUSTER ========== */
(function() {
  var CURRENT_VERSION = '8.6.2'; // UPDATE THIS WHEN YOU RELEASE A NEW VERSION
  var VERSION_KEY = 'khmerVocab_version';
  var lastVersion = localStorage.getItem(VERSION_KEY);
  
  // Only clear cache if version changed
  if (lastVersion !== CURRENT_VERSION) {
    console.log('Version update detected: ' + (lastVersion || 'fresh install') + ' → ' + CURRENT_VERSION);
    
    // Clear old caches
    if ('caches' in window) {
      caches.keys().then(function(cacheNames) {
        cacheNames.forEach(function(cacheName) {
          caches.delete(cacheName);
        });
      });
    }
    
    // Add cache buster to CSS
    var cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
    cssLinks.forEach(function(link) {
      var href = link.getAttribute('href');
      if (href && href.includes('khmerVocabularyStyles')) {
        link.setAttribute('href', href + (href.includes('?') ? '&' : '?') + 'v=' + CURRENT_VERSION);
      }
    });
    
    // Add cache buster to JS
    var scriptTags = document.querySelectorAll('script[src]');
    scriptTags.forEach(function(script) {
      var src = script.getAttribute('src');
      if (src && src.includes('khmerVocabularyScripts')) {
        script.setAttribute('src', src + (src.includes('?') ? '&' : '?') + 'v=' + CURRENT_VERSION);
      }
    });
    
    // Save new version
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    console.log('Cache cleared and version updated to ' + CURRENT_VERSION);
  } else {
    console.log('Version ' + CURRENT_VERSION + ' already loaded');
  }
})();
/* ========== END VERSION CHECK & CACHE BUSTER ========== */

    // ── Build UI ──────────────────────────────────────────────────────
    (function() {
      var _app = document.getElementById('app');
      if (_app) _app.innerHTML = `
<div id="fs-overlay" onclick="enterFsFromOverlay()">
  <div class="fso-icon">⛶</div>
  <div class="fso-title">Tap to Enter Full Screen</div>
  <div class="fso-sub">This app is set to open in full screen</div>
  <div class="fso-btn">&#9654; Enter Full Screen</div>
</div>

  <header>
    <h1>Kh Vocab</h1>
    <span class="user-badge" id="ubadge" onclick="openAccountQuick()" style="display:none"></span>
    <div class="spill" id="spill" onclick="onSpillClick()">
      <span class="dot" id="dot"></span>
      <span class="spill-txt" id="stxt">Loading…</span>
    </div>
    <button class="ibtn" id="sync-btn" onclick="doSyncClick()" title="Sync now"><span class="rib">↻</span></button>
    <button class="ibtn" onclick="openCfg()" title="Settings">⚙️</button>
  </header>

  <div class="ro-banner" id="ro-banner">
    <span>👁 Viewing <strong id="ro-banner-name"></strong> — read-only</span>
    <button class="ro-return-btn" onclick="returnToMyAccount()">Return to my account</button>
  </div>

  <nav class="nav">
    <button id="nav-view" onclick="goPage('view','nav-view')">📋 View</button>
    <button id="nav-add" onclick="goPage('add','nav-add')" class="write-only">➕ Add</button>
    <button id="nav-trans" onclick="goPage('trans','nav-trans')">🔤 Translate</button>
    <button id="nav-fav" onclick="goPage('fav','nav-fav')">⭐ Faves</button>
    <button id="nav-study" onclick="goPage('study','nav-study');initStudyPage()">🎴 Study</button>
    <button id="nav-progress" onclick="goPage('progress','nav-progress');renderProgress()">📊 Progress</button>
    <button id="nav-ref" onclick="goPage('ref','nav-ref')">📚 Ref</button>
    <button id="nav-dash" onclick="goPage('dash','nav-dash');loadDashboard()">🌐 Dash</button>
  </nav>

  <!-- ═══ VIEW PAGE ═══ -->
  <div id="page-view" class="page">
    <div class="srow">
      <div class="srch-wrap"><input type="text" id="q" placeholder="🔍 Search…" oninput="_srchClear('q','q-clr');render()" autocomplete="off" /><button class="srch-clear" id="q-clr" onclick="el('q').value='';_srchClear('q','q-clr');el('q').focus();render()" title="Clear">×</button></div>
      <button class="bbtn write-only" id="btn-sel" onclick="toggleBulk()">✓ Select</button>
    </div>
    <div class="sort-row">
      <select class="sort-cat-sel" id="view-cat-filter" onchange="lsSet('kv_view_cat',this.value);render()"></select>
      <button type="button" class="add-cat-btn" onclick="openNewCatModal()" title="Add category">+</button>
      <button class="bbtn" id="btn-kh" onclick="toggleBlur('kh')">🙈 KH</button>
      <button class="bbtn" id="btn-en" onclick="toggleBlur('en')">🙈 EN</button>
      <button class="sort-chip active" id="sc-date" onclick="setQuickSort('date')">🕐 Newest</button>
    </div>
    <div class="twrap">
      <table id="tbl">
        <thead>
          <tr>
            <th class="col-sel nosort"><input type="checkbox" id="sel-all" onchange="selectAll(this.checked)" style="accent-color:var(--acc2)"></th>
            <th class="col-en" onclick="clickSort(0)">English</th>
            <th class="col-kh" onclick="clickSort(1)">Khmer</th>
            <th class="col-ro" onclick="clickSort(2)">Romanization</th>
            <th class="col-no" onclick="clickSort(3)">Notes</th>
            <th class="col-ca" onclick="clickSort(4)">Category</th>
            <th class="col-dt nosort">Date Added</th>
          </tr>
        </thead>
        <tbody id="tbody"></tbody>
      </table>
      <div id="empty" class="empty-st" style="display:none">
        <div class="ico">📭</div>
        <p id="empty-msg">No entries yet.</p>
      </div>
    </div>
  </div>

  <!-- ═══ ADD PAGE ═══ -->
  <div id="page-add" class="page">
    <div class="form-wrap">
      <h2>Add New Entry</h2>
      <p class="sub">Entries sync to your sheet tab in the background — safe to add more right away.</p>
      <div class="form-card">
        <form id="add-form" onsubmit="submitAdd(event)">
          <div class="pair-row">
            <div class="fg">
              <label>English</label>
              <input id="f-en" type="text" placeholder="country" autocomplete="off" />
            </div>
            <div class="fg">
              <label>Khmer <span class="hint">ភាសាខ្មែរ</span></label>
              <input id="f-kh" class="khi kh" type="text" placeholder="ស្រុក" autocomplete="off" />
            </div>
          </div>
          <div class="fg"><label>Romanization</label><input id="f-ro" type="text" placeholder="srok" autocomplete="off" /></div>
          <div class="fg"><label>Notes</label><textarea id="f-no" placeholder="Context, memory tips…"></textarea></div>
          <div class="fg"><label>Category</label><div style="display:flex;gap:6px;align-items:center"><select id="f-cat" style="flex:1"></select><button type="button" class="add-cat-btn" onclick="openNewCatModal()" title="Add/edit categories">+</button></div></div>
          <button type="submit" class="prim-btn" id="add-btn">
            <span id="add-lbl">✈️ Send to Sheet</span><span class="spin" id="add-spin"></span>
          </button>
          <div class="add-sent-notice" id="add-notice"></div>
        </form>
      </div>
    </div>
  </div>

  <!-- ═══ TRANSLATION PAGE ═══ -->
  <div id="page-trans" class="page">
    <div class="trans-wrap">
      <div class="trans-sticky-header">
        <div class="trans-subtabs">
          <button class="trans-subtab active" data-dtab="summary">Summary</button>
          <button class="trans-subtab" data-dtab="all">All Results</button>
          <button class="trans-subtab" data-dtab="metadata">Metadata</button>
        </div>
        <div class="trans-search-bar" style="position:relative">
          <input class="trans-search-input" id="dict-input" type="text" placeholder="Type English or វាយពាក្យខ្មែរ…" autocomplete="off" autocorrect="off" spellcheck="false" />
          <button class="trans-clear-btn" id="dict-clear" title="Clear">✕</button>
          <button class="trans-search-btn" id="dict-search-btn">Search</button>
        </div>
      </div>
      <div class="trans-content" id="dict-content">
        <div class="trans-landing">
          <div class="tl-icon">🇰🇭 ⇆ 🇬🇧</div>
          <h3>Khmer ⇆ English Dictionary</h3>
          <p>Search using 10 simultaneous translation APIs.<br>Find meanings, examples, pronunciations, and more.</p>
        </div>
      </div>
    </div>
  </div>

  <!-- ═══ FAVES PAGE ═══ -->
  <div id="page-fav" class="page">
    <div class="srow">
      <div class="srch-wrap"><input type="text" id="fq" placeholder="🔍 Search favourites…" oninput="_srchClear('fq','fq-clr');renderFav()" autocomplete="off" /><button class="srch-clear" id="fq-clr" onclick="el('fq').value='';_srchClear('fq','fq-clr');el('fq').focus();renderFav()" title="Clear">×</button></div>
      <button class="bbtn write-only" id="btn-fav-sel" onclick="toggleBulk()">✓ Select</button>
    </div>
    <div class="twrap">
      <table id="fav-tbl">
        <thead>
          <tr>
            <th class="col-en" onclick="clickFavSort(0)">English</th>
            <th class="col-kh" onclick="clickFavSort(1)">Khmer</th>
            <th class="col-ro" onclick="clickFavSort(2)">Romanization</th>
            <th class="col-no" onclick="clickFavSort(3)">Notes</th>
            <th class="col-ca" onclick="clickFavSort(4)">Category</th>
          </tr>
        </thead>
        <tbody id="fav-tbody"></tbody>
      </table>
      <div id="fav-empty" class="empty-st" style="display:none">
        <div class="ico">⭐</div>
        <p>No favourites yet. Long-press any word to star it.</p>
      </div>
    </div>
  </div>

  <!-- ═══ STUDY PAGE ═══ -->
  <div id="page-study" class="page">
    <div class="study-wrap">
      <div class="study-method-label" style="margin-bottom:10px">🎴 Flashcard</div>
      <div class="study-controls">
        <div class="study-ctrl-row">
          <select id="study-filter" class="study-cat-sel active-sel" onchange="onStudyCatChange('user');initStudy()"></select>
          <select id="study-preset-filter" class="study-cat-sel" onchange="onStudyCatChange('preset');initStudy()"></select>
        </div>
        <div class="study-ctrl-row">
          <select id="study-conf-filter" onchange="initStudy()" style="min-width:110px">
            <option value="all">All Levels</option>
            <option value="weak">&#x1F534; Weak (Unknown+)</option>
            <option value="got">✅ Got It only</option>
            <option value="kinda">🤔 Kind Of only</option>
            <option value="unknown">❌ Unknown only</option>
            <option value="unstudied">📖 Unstudied only</option>
          </select>
          <button class="bbtn" style="height:38px" onclick="initStudy()">🔀 Shuffle</button>
          <button class="study-dir-btn" id="study-dir-btn" onclick="toggleStudyDir()">Khmer → English</button>
          <select id="study-len" onchange="initStudy()">
            <option value="10">10 cards</option>
            <option value="20" selected>20 cards</option>
            <option value="50">50 cards</option>
            <option value="9999">All cards</option>
          </select>
        </div>
        <div class="study-ctrl-row" style="justify-content:flex-end;gap:16px;padding-top:2px">
          <label class="study-opt-lbl"><span>SRS</span><label class="tog" style="margin-left:6px"><input type="checkbox" id="opt-srs" checked onchange="saveSettings()"><span class="tog-sl"></span></label></label>
          <label class="study-opt-lbl"><span>Romanized</span><label class="tog" style="margin-left:6px"><input type="checkbox" id="opt-studyro" checked onchange="saveSettings()"><span class="tog-sl"></span></label></label>
          <label class="study-opt-lbl"><span>Multi Choice</span><label class="tog" style="margin-left:6px"><input type="checkbox" id="opt-mc" onchange="saveSettings()"><span class="tog-sl"></span></label></label>
        </div>
      </div>
      <div class="study-prog-row">
        <div class="study-prog-bar">
          <div class="study-prog-fill" id="spf" style="width:0%"></div>
        </div>
        <div class="study-prog-txt" id="study-prog">0 / 0</div>
      </div>
      <div class="flashcard" id="flashcard" onclick="flipCard()">
        <div class="fc-badge" id="fc-badge"></div>
        <div class="fc-conf-badge" id="fc-conf-badge" style="display:none"></div>
        <div id="fc-content">
          <div class="fc-hint">Tap to start</div>
        </div>
      </div>
      <button class="fc-speak-btn" id="fc-speak-btn" onclick="speakCurrentCard()" style="display:none">🔊 Hear Word</button>
      <div class="conf-btns" id="conf-btns" style="display:none">
        <button class="conf-btn cb-u" onclick="rateCard(0)">✗ Didn't know</button>
        <button class="conf-btn cb-m" onclick="rateCard(1)">~ Kind of</button>
        <button class="conf-btn cb-k" onclick="rateCard(2)">✓ Got it</button>
      </div>
      <div class="study-nav" id="study-nav">
        <button class="s-prev" onclick="prevCard()">← Prev</button>
        <button class="s-next" onclick="nextCard()">Next →</button>
      </div>
      <div class="session-summary" id="session-summary" style="display:none">
        <h3>Session Complete 🎉</h3>
        <div class="ss-stats">
          <div class="ss-item ss-k">
            <div class="ss-num" id="ss-k">0</div>
            <div class="ss-lbl">Got it</div>
          </div>
          <div class="ss-item ss-m">
            <div class="ss-num" id="ss-m">0</div>
            <div class="ss-lbl">Kind of</div>
          </div>
          <div class="ss-item ss-u">
            <div class="ss-num" id="ss-u">0</div>
            <div class="ss-lbl">Didn't know</div>
          </div>
        </div>
        <div class="ss-btns">
          <button class="prim-btn" onclick="studyWeak()" id="ss-weak-btn" style="margin-top:0;font-size:.88rem;height:44px">🔴 Study weak words again</button>
          <button class="prim-btn" onclick="initStudy()" style="margin-top:0;font-size:.88rem;height:44px;background:linear-gradient(135deg,#1d4ed8,#3b82f6)">🔀 New session</button>
        </div>
      </div>
      <div class="empty-st" id="study-empty" style="display:none">
        <div class="ico">📭</div>
        <p>No cards to study. Add some words first!</p>
      </div>

      <hr class="study-divider">
      <div class="study-method-block">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <div class="study-method-label" style="margin-bottom:0" id="write-head">✍️ Writing &amp; Spelling</div>
          <button class="bbtn" style="padding:3px 9px;font-size:.72rem;height:26px;border-radius:7px;line-height:1" onclick="startWriting()" title="Reshuffle cards">🔀</button>
        </div>
        <div class="study-sub-desc" id="write-desc">See the English word — type the Khmer from memory.</div>
        <div class="write-prompt" id="write-prompt">Loading…</div>
        <div class="write-progress" id="write-progress"></div>
        <button class="prim-btn" id="write-speak-btn" onclick="speakWriteCard()" style="width:100%;font-size:.85rem;height:42px;margin-bottom:10px;display:none">&#x1F50A; Tap to Hear</button>
        <input class="write-input" id="write-input" type="text" placeholder="Type here…" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" onkeydown="if(event.key==='Enter')checkWriting()">
        <div class="write-result" id="write-result" style="display:none"></div>
        <div class="study-action-row">
          <div style="flex:1;display:flex;gap:5px">
            <button class="study-skip-btn" style="flex:1;font-size:.76rem" onclick="prevWriting()">← Prev</button>
            <button class="study-skip-btn" style="flex:1;font-size:.76rem" onclick="skipWriting()">Next →</button>
          </div>
          <button class="study-check-btn" id="write-check-btn" onclick="checkWriting()">✓ Check</button>
        </div>
      </div>

      <hr class="study-divider">
      <div class="study-method-block">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <div class="study-method-label" style="margin-bottom:0" id="listen-head">🔊 Listening</div>
          <button class="bbtn" style="padding:3px 9px;font-size:.72rem;height:26px;border-radius:7px;line-height:1" onclick="startListening()" title="Reshuffle cards">🔀</button>
        </div>
        <div class="study-sub-desc" id="listen-desc">Hear the Khmer word — type the Khmer spelling.</div>
        <div class="write-prompt" id="listen-prompt">Loading…</div>
        <div class="write-progress" id="listen-progress"></div>
        <button class="prim-btn" id="listen-play-btn" onclick="playCurrentListenCard()" style="width:100%;font-size:.85rem;height:42px;margin-bottom:10px;display:none">🔊 Tap to Hear</button>
        <input class="write-input" id="listen-input" type="text" placeholder="Type here…" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" onkeydown="if(event.key==='Enter')checkListening()">
        <div class="write-result" id="listen-result" style="display:none"></div>
        <div class="study-action-row">
          <div style="flex:1;display:flex;gap:5px">
            <button class="study-skip-btn" style="flex:1;font-size:.76rem" onclick="prevListening()">← Prev</button>
            <button class="study-skip-btn" style="flex:1;font-size:.76rem" onclick="skipListening()">Next →</button>
          </div>
          <button class="study-check-btn" id="listen-check-btn" onclick="checkListening()">✓ Check</button>
        </div>
      </div>
    </div>
  </div>

  <!-- ═══ PROGRESS PAGE ═══ -->
  <div id="page-progress" class="page">
    <div class="pg-wrap">
      <h2>📊 Progress &amp; Milestones</h2>
      <div id="pg-stats-note" style="display:none;font-size:.72rem;color:var(--dim);margin-bottom:8px;text-align:center;padding:4px 0"></div>
      <div class="stat-cards">
        <div class="stat-card">
          <div class="sc-val" id="pg-total">0</div>
          <div class="sc-lbl">Total Words</div>
        </div>
        <div class="stat-card">
          <div class="sc-val" id="pg-fav">0</div>
          <div class="sc-lbl">Favourites ⭐</div>
        </div>
        <div class="stat-card">
          <div class="sc-val" id="pg-mastered">0</div>
          <div class="sc-lbl">Mastered ✓</div>
        </div>
        <div class="stat-card">
          <div class="sc-val" id="pg-studied">0</div>
          <div class="sc-lbl">Words Studied</div>
        </div>
        <div class="stat-card">
          <div class="sc-val" id="pg-streak">0</div>
          <div class="sc-lbl">🔥 Day Streak</div>
        </div>
        <div class="stat-card">
          <div class="sc-val" id="pg-best-streak">0</div>
          <div class="sc-lbl">🏆 Best Streak</div>
        </div>
      </div>
      <div class="section-card">
        <h3>Confidence Breakdown <span style="font-size:.68rem;color:var(--dim);font-weight:400">— tap to study</span></h3>
        <div class="conf-bars">
          <div class="conf-item" style="cursor:pointer" title="Study words you Got It" onclick="openConfStudy(2)">
            <div class="conf-val cv-k" id="pg-knew">0</div>
            <div class="conf-lbl">Got it</div>
            <div style="font-size:.58rem;color:var(--dim);margin-top:2px">▶ Study</div>
          </div>
          <div class="conf-item" style="cursor:pointer" title="Study words you Kinda Know" onclick="openConfStudy(1)">
            <div class="conf-val cv-m" id="pg-kinda">0</div>
            <div class="conf-lbl">Kinda</div>
            <div style="font-size:.58rem;color:var(--dim);margin-top:2px">▶ Study</div>
          </div>
          <div class="conf-item" style="cursor:pointer" title="Study words marked Unknown" onclick="openConfStudy(0)">
            <div class="conf-val cv-u" id="pg-unkn">0</div>
            <div class="conf-lbl">Unknown</div>
            <div style="font-size:.58rem;color:var(--dim);margin-top:2px">▶ Study</div>
          </div>
          <div class="conf-item" style="cursor:pointer" title="Study words not yet studied" onclick="openConfStudy(-1)">
            <div class="conf-val cv-n" id="pg-unstudied">0</div>
            <div class="conf-lbl">Unstudied</div>
            <div style="font-size:.58rem;color:var(--dim);margin-top:2px">▶ Study</div>
          </div>
        </div>
      </div>
      <div class="section-card">
        <h3>By Category</h3>
        <div id="pg-cat-bars"></div>
      </div>
      <div class="section-card">
        <h3>Activity Heatmap (Last 28 Days)</h3>
        <div class="heatmap" id="heatmap"></div>
      </div>
      <div class="section-card">
        <h3>🏆 Achievements</h3>
        <div style="font-size:.72rem;color:var(--dim);margin-bottom:10px">Tap a card for a hint — or to see what you did to unlock it.</div>
        <div class="milestone-shelf" id="achv-shelf"></div>
      </div>
      <div class="section-card">
        <div class="ms-shelf-title">Words Added</div>
        <div class="milestone-shelf" id="milestone-shelf-add"></div>
        <div class="ms-shelf-title">Words Studied</div>
        <div class="milestone-shelf" id="milestone-shelf-study"></div>
        <div class="ms-shelf-title">Words Mastered</div>
        <div class="milestone-shelf" id="milestone-shelf-master"></div>
        <div class="ms-shelf-title">Study Streak</div>
        <div class="milestone-shelf" id="milestone-shelf-streak"></div>
      </div>
    </div>
  </div>

  <!-- ═══ REF PAGE ═══ -->
  <div id="page-ref" class="page">
    <div class="ref-wrap">
      <h2>📚 Khmer Reference</h2>
      <div class="ref-section">
        <h3>All Consonants (33)</h3>
        <div class="ref-grid-5" id="ref-all-cons"></div>
        <div class="ref-note">S1 = Series 1 (inherent vowel "a") · S2 = Series 2 (inherent vowel "o")</div>
      </div>
      <div class="ref-section">
        <h3>Dependent Vowels</h3>
        <table class="vowel-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>S1 sound</th>
              <th>S2 sound</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody id="ref-dep-vowels"></tbody>
        </table>
      </div>
      <div class="ref-section">
        <h3>Pronunciation Guide</h3>
        <div class="ref-phonetic-grid" id="ref-phonetic-grid"></div>
      </div>
      <div class="ref-section">
        <h3>Independent Vowels</h3>
        <div class="ref-grid-5" id="ref-ind-vowels"></div>
      </div>
      <div class="ref-section">
        <h3>Numbers 0–100</h3>
        <div class="ref-num-grid" id="ref-numbers"></div>
      </div>
      <div class="ref-section">
        <h3>Essential Phrases</h3>
        <table class="vowel-table">
          <thead>
            <tr>
              <th>Khmer</th>
              <th>Romanization</th>
              <th>English</th>
            </tr>
          </thead>
          <tbody id="ref-phrases"></tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- ═══ DASHBOARD PAGE ═══ -->
  <div id="page-dash" class="page">
    <div class="dash-wrap">
      <h2>🌐 Dashboard</h2>
      <div id="dash-loading">
        <div class="stat-cards" style="margin-bottom:16px">
          <div class="skel skel-block" style="border-radius:12px"></div>
          <div class="skel skel-block" style="border-radius:12px"></div>
          <div class="skel skel-block" style="border-radius:12px"></div>
          <div class="skel skel-block" style="border-radius:12px"></div>
        </div>
        <div class="section-card">
          <div class="skel skel-h" style="width:40%;margin-bottom:14px"></div>
          <div class="skel skel-bar"></div>
          <div class="skel skel-bar" style="width:75%"></div>
          <div class="skel skel-bar" style="width:55%"></div>
        </div>
        <div class="section-card">
          <div class="skel skel-h" style="width:35%;margin-bottom:14px"></div>
          <div class="skel skel-h"></div>
          <div class="skel skel-h" style="width:90%"></div>
          <div class="skel skel-h" style="width:80%"></div>
        </div>
      </div>
      <div id="dash-error" style="display:none;text-align:center;padding:40px;color:var(--bad)">
        <div style="font-size:2rem;margin-bottom:12px">⚠️</div>
        <p id="dash-error-msg">Could not load. Connect your sheet in ⚙️.</p>
      </div>
      <div id="dash-content" style="display:none">
        <div class="stat-cards" id="dash-stat-cards"></div>
        <div class="section-card">
          <h3>Users &amp; Word Counts</h3>
          <div id="dash-users"></div>
        </div>
        <div class="section-card">
          <h3>Recent Activity (All Words)</h3>
          <div id="dash-recent"></div>
        </div>
        <div style="font-size:.68rem;color:var(--dim);text-align:center;padding-bottom:80px" id="dash-updated"></div>
      </div>
    </div>
  </div>

  <!-- BOTTOM BARS -->
  <div class="bar" id="bar">Showing 0 entries</div>
  <div class="bulk-bar" id="bulk-bar">
    <span class="bulk-info" id="bulk-info">0 selected</span>
    <button class="bulk-act ba-fav" onclick="bulkFav()">⭐ Star</button>
    <button class="bulk-act ba-cat write-only" onclick="openBulkCat()">📂 Category</button>
    <button class="bulk-act ba-del write-only" onclick="bulkDelete()">🗑 Delete</button>
    <button class="bulk-act ba-clr" onclick="exitBulk()">✕</button>
  </div>
  <div class="tbox" id="tbox"></div>

  <!-- EDIT SHEET -->
  <div class="sovl" id="sovl" onclick="sovlBg(event)">
    <div class="esheet">
      <div class="sheet-handle"></div>
      <div class="sheet-top">
        <h3 id="sheet-title">✏️ Edit Entry</h3>
        <div class="sheet-top-btns">
          <button class="star-toggle" id="sheet-star" onclick="toggleEditStar()" title="Favourite">⭐</button>
          <button class="sclose" onclick="closeSheet()">✕</button>
        </div>
      </div>
      <div class="sheet-body">
        <div class="pair-row">
          <div class="fg"><label>English</label><input id="e-en" type="text" autocomplete="off" /></div>
          <div class="fg"><label>Khmer <span class="hint">ភាសាខ្មែរ</span></label><input id="e-kh" class="khi kh" type="text" autocomplete="off" /></div>
        </div>
        <div class="fg"><label>Romanization</label><input id="e-ro" type="text" autocomplete="off" /></div>
        <div class="fg"><label>Notes</label><textarea id="e-no" style="min-height:60px"></textarea></div>
        <div class="fg"><label>Category</label><div style="display:flex;gap:6px;align-items:center"><select id="e-cat" style="flex:1"></select><button type="button" class="add-cat-btn" onclick="openNewCatModal()" title="Add/edit categories">+</button></div></div>
        <button class="prim-btn write-only" id="edit-btn" onclick="saveEdit()">
          <span id="edit-lbl">💾 Save to Sheet</span><span class="spin" id="edit-spin" style="display:none"></span>
        </button>
        <button class="add-from-other-btn" id="add-from-other-btn" onclick="addWordFromOtherSheet()" style="display:none">➕ Add to My Sheet</button>
        <button class="del-btn write-only" onclick="deleteEntry()">🗑 Delete Entry</button>
      </div>
    </div>
  </div>

  <!-- ═══ MODAL: Login ═══ -->
  <div class="movl" id="user-ovl">
    <div class="mcard">
      <h3>👋 Khmer Vocab — Log In</h3>
      <p style="font-size:.79rem;color:var(--dim);margin-bottom:14px;line-height:1.5">Enter your name and password to log in. If you're new, this will create your account.</p>
      <p style="font-size:.79rem;color:var(--dim);margin-bottom:14px;line-height:1.5">Be careful. You can only recover this if you forgotten, or change this by contacting me here:<br>Email: <a href="mailto:olsen.porter@missionary.org" style="color:#6b9bd1;text-decoration:underline">olsen.porter@missionary.org</a><br>Messenger: <a href="https://m.me/olsen.porter" target="_blank" rel="noopener noreferrer" style="color:#6b9bd1;text-decoration:underline">m.me/olsen.porter</a></p>
      <label style="font-size:.7rem;font-weight:700;color:var(--dim);text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:6px">Name</label>
      <input class="minput" id="user-inp" type="text" placeholder="Enter your name…" autocomplete="username" />
      <label style="font-size:.7rem;font-weight:700;color:var(--dim);text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:6px">Password</label>
      <input class="minput" id="user-pass" type="password" placeholder="Enter your password…" autocomplete="current-password" />
      <div id="user-login-msg" style="display:none;font-size:.78rem;margin:8px 0 8px;padding:9px 11px;border-radius:8px;line-height:1.4"></div>
      <button class="user-start" id="user-start-btn" onclick="handleLogin()">Log In →</button>
    </div>
  </div>

  <!-- ═══ MODAL: New User Step 2 ═══ -->
  <div class="movl" id="user-step2-ovl">
    <div class="mcard">
      <h3>📂 Do you have a vocabulary CSV file?</h3>
      <p>If you already have a CSV file of Khmer vocabulary, you can import it now. You can also do this later from Settings. If you press "Yes, import CSV now" there will be step by step instructions on how to do it, and you can still choose to cancel.</p>
      <div style="display:flex;flex-direction:column;gap:9px;margin-top:6px">
        <button class="prim-btn" style="margin-top:0" onclick="closeStep2AndImport()">📂 Yes, import CSV now</button>
        <button class="btn-g" style="width:100%;height:46px;font-size:.9rem" onclick="closeStep2()">No thanks, start fresh</button>
      </div>
    </div>
  </div>

  <!-- ═══ MODAL: Account Quick ═══ -->
  <div class="movl" id="acct-quick-ovl" onclick="if(event.target===this)this.classList.remove('open')">
    <div class="mcard" style="max-width:380px">
      <h3>👤 Your Account</h3>
      <div style="background:rgba(168,85,247,.1);border:1px solid rgba(168,85,247,.3);border-radius:10px;padding:10px 13px;margin-bottom:14px;display:flex;align-items:center;gap:10px">
        <div style="flex:1">
          <div style="font-size:.85rem;font-weight:700;color:var(--acc3)" id="aq-name">—</div>
          <div style="font-size:.7rem;color:var(--dim);margin-top:2px">Main account</div>
        </div>
        <span style="font-size:.65rem;color:var(--ok);background:rgba(34,197,94,.1);border-radius:10px;padding:2px 8px">Active</span>
      </div>
      <div style="font-size:.7rem;font-weight:700;color:var(--dim);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">View other accounts (read-only)</div>
      <div class="user-list" id="aq-user-list">
        <div style="font-size:.75rem;color:var(--dim);text-align:center;padding:10px">Connect your sheet to see other accounts</div>
      </div>
      <button class="btn-g refresh-users-btn" style="width:100%;font-size:.76rem;margin-bottom:10px" id="aq-refresh-btn" onclick="fetchOtherUsersForPopup()"><span class="rib-txt">↻ Refresh from sheet</span></button>
      <div class="macts">
        <button class="btn-danger" onclick="logout()" style="font-size:.78rem">🚪 Log Out</button>
        <button class="btn-g" onclick="el('acct-quick-ovl').classList.remove('open')">Close</button>
      </div>
    </div>
  </div>

  <!-- ═══ MODAL: Progress ═══ -->
  <div class="movl" id="imp-prog-ovl" onclick="if(event.target===this)this.classList.remove('open')">
    <div class="mcard" style="max-width:360px">
      <h3 id="imp-prog-title">📥 Progress</h3>
      <div class="imp-prog-card" id="imp-bar-section-1">
        <div style="display:flex;justify-content:space-between;font-size:.82rem;margin-bottom:6px">
          <span id="imp-label">Preparing…</span><span id="imp-pct" style="color:var(--acc3);font-weight:700">0%</span>
        </div>
        <div class="imp-prog-bar-bg">
          <div class="imp-prog-bar-fill" id="imp-bar" style="width:0%"></div>
        </div>
        <div style="font-size:.72rem;color:var(--dim);margin-top:4px" id="imp-detail"></div>
      </div>
      <div class="imp-prog-card" id="imp-bar-section-2" style="display:none;margin-top:8px">
        <div style="display:flex;justify-content:space-between;font-size:.82rem;margin-bottom:6px">
          <span id="save-label">Saving…</span><span id="save-pct" style="color:var(--acc3);font-weight:700">0%</span>
        </div>
        <div class="imp-prog-bar-bg">
          <div class="imp-prog-bar-fill" id="save-bar" style="width:0%"></div>
        </div>
        <div style="font-size:.72rem;color:var(--dim);margin-top:4px" id="save-detail"></div>
      </div>
      <div class="macts" style="margin-top:12px"><button class="btn-g" onclick="el('imp-prog-ovl').classList.remove('open')">Close</button></div>
    </div>
  </div>

  <!-- ═══ MODAL: Settings ═══ -->
  <div class="movl" id="cfg-ovl" onclick="if(event.target===this)closeCfg()">
    <div class="mcard" style="max-width:520px">
      <h3>⚙️ Settings</h3>

      <div class="cfg-section">
        <div class="cfg-section-title">Appearance</div>
        <div class="cfg-row">
          <div class="cfg-row-left">
            <div class="cr-title">Theme</div>
            <div class="cr-sub">Switch between dark and light mode</div>
          </div>
          <button class="btn-g" id="theme-toggle-btn" onclick="toggleTheme()" style="font-size:.8rem;padding:7px 13px">☀️ Light mode</button>
        </div>
        <div class="cfg-row">
          <div class="cfg-row-left">
            <div class="cr-title">Full screen</div>
            <div class="cr-sub">Toggle browser full screen</div>
          </div>
          <button class="btn-g" id="fullscreen-btn" onclick="toggleFullscreen()" style="font-size:.8rem;padding:7px 13px">⛶ Full Screen</button>
        </div>
        <div class="cfg-row">
          <div class="cfg-row-left">
            <div class="cr-title">Full screen on open</div>
            <div class="cr-sub">Show overlay to enter full screen when opened</div>
          </div>
          <label class="tog"><input type="checkbox" id="opt-auto-fullscreen" onchange="saveSettings()"><span class="tog-sl"></span></label>
        </div>
        <div class="cfg-row">
          <div class="cfg-row-left">
            <div class="cr-title">Accent colour</div>
          </div>
        </div>
        <div class="accent-row" id="accent-row"></div>
      </div>

      <div class="cfg-section">
        <div class="cfg-section-title">Display</div>
        <div class="cfg-row">
          <div class="cfg-row-left">
            <div class="cr-title">Default page on open</div>
          </div>
          <select id="opt-default-page" onchange="saveSettings()">
            <option value="add">➕ Add Word</option>
            <option value="view">📋 View</option>
            <option value="fav">⭐ Faves</option>
            <option value="study">🎴 Study</option>
            <option value="progress">📊 Progress</option>
            <option value="ref">📚 Reference</option>
            <option value="trans">🔤 Translate</option>
            <option value="dash">🌐 Dashboard</option>
          </select>
        </div>
        <div class="cfg-row">
          <div class="cfg-row-left">
            <div class="cr-title">Row density</div>
          </div>
          <select id="opt-density" onchange="applyDensity()">
            <option value="comfortable">Comfortable</option>
            <option value="compact" selected>Compact</option>
          </select>
        </div>
        <div class="cfg-row">
          <div class="cfg-row-left">
            <div class="cr-title">Highlight search matches</div>
          </div>
          <label class="tog"><input type="checkbox" id="opt-highlight" checked onchange="saveSettings()"><span class="tog-sl"></span></label>
        </div>
        <div class="cfg-row">
          <div class="cfg-row-left">
            <div class="cr-title">Visible columns</div>
            <div class="col-toggle-grid" style="margin-top:6px">
              <label class="col-tog-lbl"><input type="checkbox" id="col-en" checked onchange="applyColumns()">English</label>
              <label class="col-tog-lbl"><input type="checkbox" id="col-kh" checked onchange="applyColumns()">Khmer</label>
              <label class="col-tog-lbl"><input type="checkbox" id="col-ro" checked onchange="applyColumns()">Romanization</label>
              <label class="col-tog-lbl"><input type="checkbox" id="col-no" checked onchange="applyColumns()">Notes</label>
              <label class="col-tog-lbl"><input type="checkbox" id="col-ca" checked onchange="applyColumns()">Category</label>
              <label class="col-tog-lbl"><input type="checkbox" id="col-dt" onchange="applyColumns()">Date</label>
            </div>
          </div>
        </div>
        <div class="cfg-row" style="flex-wrap:wrap;gap:4px">
          <div class="cfg-row-left">
            <div class="cr-title">English font size <span id="en-fs-label" style="color:var(--acc3);font-size:.72rem"></span></div>
          </div>
          <div style="display:flex;align-items:center;gap:5px">
            <input type="number" id="opt-enfontsize-num" min="10" max="24" value="14" disabled style="width:52px;padding:3px 5px;border:1px solid var(--bdr);border-radius:5px;background:var(--surf);color:var(--text);font-size:.8rem" oninput="if(!el('fs-en-lock').checked){el('opt-enfontsize').value=this.value;applyEnFontSize()}">
            <input type="range" id="opt-enfontsize" min="10" max="24" value="14" disabled oninput="applyEnFontSize();el('opt-enfontsize-num').value=this.value">
            <label title="Lock font size" style="display:flex;align-items:center;gap:3px;cursor:pointer;font-size:.8rem;white-space:nowrap"><input type="checkbox" id="fs-en-lock" checked onchange="var d=this.checked;el('opt-enfontsize').disabled=d;el('opt-enfontsize-num').disabled=d"> 🔒</label>
          </div>
        </div>
        <div class="cfg-row" style="flex-wrap:wrap;gap:4px">
          <div class="cfg-row-left">
            <div class="cr-title">Khmer font size <span id="kh-fs-label" style="color:var(--acc3);font-size:.72rem"></span></div>
          </div>
          <div style="display:flex;align-items:center;gap:5px">
            <input type="number" id="opt-khfontsize-num" min="12" max="28" value="16" disabled style="width:52px;padding:3px 5px;border:1px solid var(--bdr);border-radius:5px;background:var(--surf);color:var(--text);font-size:.8rem" oninput="if(!el('fs-kh-lock').checked){el('opt-khfontsize').value=this.value;applyKhFontSize()}">
            <input type="range" id="opt-khfontsize" min="12" max="28" value="16" disabled oninput="applyKhFontSize();el('opt-khfontsize-num').value=this.value">
            <label title="Lock font size" style="display:flex;align-items:center;gap:3px;cursor:pointer;font-size:.8rem;white-space:nowrap"><input type="checkbox" id="fs-kh-lock" checked onchange="var d=this.checked;el('opt-khfontsize').disabled=d;el('opt-khfontsize-num').disabled=d"> 🔒</label>
          </div>
        </div>
        <div class="cfg-row">
          <div class="cfg-row-left">
            <div class="cr-title">Khmer font</div>
            <div class="text-preview">
              <div class="tp-row"><span class="tp-label">English</span><span class="tp-en" id="tp-en">Hello, good morning</span></div>
              <div class="tp-row"><span class="tp-label">Khmer</span><span class="tp-kh kh" id="tp-kh">ជំរាបសួរ</span></div>
              <div class="tp-row"><span class="tp-label">Ro</span><span class="tp-ro" id="tp-ro">jum reap suor</span></div>
            </div>
          </div>
        </div>
        <div class="cfg-row">
          <div class="cfg-row-left">
            <div class="cr-title">Khmer font style</div>
          </div>
          <select id="opt-khfont" onchange="applyKhFont()">
            <option value="'Noto Sans Khmer',system-ui,sans-serif">Noto Sans Khmer</option>
            <option value="'Noto Serif Khmer',serif">Noto Serif Khmer</option>
            <option value="'Battambang',serif">Battambang</option>
            <option value="'Hanuman',serif">Hanuman</option>
            <option value="'Moul',serif">Moul</option>
            <option value="system-ui,sans-serif">System Default</option>
          </select>
        </div>
        <div class="cfg-row">
          <div class="cfg-row-left">
            <div class="cr-title">English font style</div>
          </div>
          <select id="opt-enfont" onchange="applyEnFont()">
            <option value="system-ui,-apple-system,'Segoe UI',sans-serif">System Default</option>
            <option value="'Georgia',Georgia,serif">Georgia</option>
            <option value="'Times New Roman',Times,serif">Times New Roman</option>
            <option value="'Palatino Linotype',Palatino,serif">Palatino</option>
            <option value="'Helvetica Neue',Helvetica,Arial,sans-serif">Helvetica / Arial</option>
            <option value="Verdana,Geneva,sans-serif">Verdana</option>
            <option value="'Trebuchet MS',Helvetica,sans-serif">Trebuchet MS</option>
            <option value="'Courier New',Courier,monospace">Courier New (Mono)</option>
            <option value="'Comic Sans MS','Comic Sans',cursive">Comic Sans</option>
          </select>
        </div>
      </div>

      <div class="cfg-section">
        <div class="cfg-section-title">Column Widths</div>
        <div style="font-size:.74rem;color:var(--dim);margin-bottom:10px">Drag to resize each column. For reference the total width of your screen is probably around 375px if it's similar to mine.</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <div class="cfg-row" style="flex-wrap:wrap;gap:4px"><div class="cfg-row-left"><div class="cr-title">English <span id="cw-en-lbl" style="color:var(--acc3);font-size:.72rem"></span></div></div><div style="display:flex;align-items:center;gap:5px"><input type="number" id="cw-en-num" min="80" max="400" value="160" style="width:58px;padding:3px 5px;border:1px solid var(--bdr);border-radius:5px;background:var(--surf);color:var(--text);font-size:.8rem" oninput="if(!el('cw-en-lock').checked){applyColWidth('en',this.value);el('cw-en').value=this.value}"><input type="range" id="cw-en" min="80" max="400" value="160" oninput="applyColWidth('en',this.value);el('cw-en-num').value=this.value"><label title="Lock column width" style="display:flex;align-items:center;gap:3px;cursor:pointer;font-size:.8rem;white-space:nowrap"><input type="checkbox" id="cw-en-lock" checked onchange="el('cw-en').disabled=this.checked;el('cw-en-num').disabled=this.checked"> 🔒</label></div></div>
          <div class="cfg-row" style="flex-wrap:wrap;gap:4px"><div class="cfg-row-left"><div class="cr-title">Khmer <span id="cw-kh-lbl" style="color:var(--acc3);font-size:.72rem"></span></div></div><div style="display:flex;align-items:center;gap:5px"><input type="number" id="cw-kh-num" min="80" max="400" value="180" style="width:58px;padding:3px 5px;border:1px solid var(--bdr);border-radius:5px;background:var(--surf);color:var(--text);font-size:.8rem" oninput="if(!el('cw-kh-lock').checked){applyColWidth('kh',this.value);el('cw-kh').value=this.value}"><input type="range" id="cw-kh" min="80" max="400" value="180" oninput="applyColWidth('kh',this.value);el('cw-kh-num').value=this.value"><label title="Lock column width" style="display:flex;align-items:center;gap:3px;cursor:pointer;font-size:.8rem;white-space:nowrap"><input type="checkbox" id="cw-kh-lock" checked onchange="el('cw-kh').disabled=this.checked;el('cw-kh-num').disabled=this.checked"> 🔒</label></div></div>
          <div class="cfg-row" style="flex-wrap:wrap;gap:4px"><div class="cfg-row-left"><div class="cr-title">Romanization <span id="cw-ro-lbl" style="color:var(--acc3);font-size:.72rem"></span></div></div><div style="display:flex;align-items:center;gap:5px"><input type="number" id="cw-ro-num" min="60" max="400" value="150" style="width:58px;padding:3px 5px;border:1px solid var(--bdr);border-radius:5px;background:var(--surf);color:var(--text);font-size:.8rem" oninput="if(!el('cw-ro-lock').checked){applyColWidth('ro',this.value);el('cw-ro').value=this.value}"><input type="range" id="cw-ro" min="60" max="400" value="150" oninput="applyColWidth('ro',this.value);el('cw-ro-num').value=this.value"><label title="Lock column width" style="display:flex;align-items:center;gap:3px;cursor:pointer;font-size:.8rem;white-space:nowrap"><input type="checkbox" id="cw-ro-lock" checked onchange="el('cw-ro').disabled=this.checked;el('cw-ro-num').disabled=this.checked"> 🔒</label></div></div>
          <div class="cfg-row" style="flex-wrap:wrap;gap:4px"><div class="cfg-row-left"><div class="cr-title">Notes <span id="cw-no-lbl" style="color:var(--acc3);font-size:.72rem"></span></div></div><div style="display:flex;align-items:center;gap:5px"><input type="number" id="cw-no-num" min="60" max="400" value="170" style="width:58px;padding:3px 5px;border:1px solid var(--bdr);border-radius:5px;background:var(--surf);color:var(--text);font-size:.8rem" oninput="if(!el('cw-no-lock').checked){applyColWidth('no',this.value);el('cw-no').value=this.value}"><input type="range" id="cw-no" min="60" max="400" value="170" oninput="applyColWidth('no',this.value);el('cw-no-num').value=this.value"><label title="Lock column width" style="display:flex;align-items:center;gap:3px;cursor:pointer;font-size:.8rem;white-space:nowrap"><input type="checkbox" id="cw-no-lock" checked onchange="el('cw-no').disabled=this.checked;el('cw-no-num').disabled=this.checked"> 🔒</label></div></div>
          <div class="cfg-row" style="flex-wrap:wrap;gap:4px"><div class="cfg-row-left"><div class="cr-title">Category <span id="cw-ca-lbl" style="color:var(--acc3);font-size:.72rem"></span></div></div><div style="display:flex;align-items:center;gap:5px"><input type="number" id="cw-ca-num" min="60" max="300" value="110" style="width:58px;padding:3px 5px;border:1px solid var(--bdr);border-radius:5px;background:var(--surf);color:var(--text);font-size:.8rem" oninput="if(!el('cw-ca-lock').checked){applyColWidth('ca',this.value);el('cw-ca').value=this.value}"><input type="range" id="cw-ca" min="60" max="300" value="110" oninput="applyColWidth('ca',this.value);el('cw-ca-num').value=this.value"><label title="Lock column width" style="display:flex;align-items:center;gap:3px;cursor:pointer;font-size:.8rem;white-space:nowrap"><input type="checkbox" id="cw-ca-lock" checked onchange="el('cw-ca').disabled=this.checked;el('cw-ca-num').disabled=this.checked"> 🔒</label></div></div>
        </div>
        <button class="btn-g" style="font-size:.74rem;padding:7px 12px;margin-top:6px" onclick="resetColWidths()">Reset widths</button>
      </div>

      <div class="cfg-section">
        <div class="cfg-section-title">Account &amp; Identity</div>
        <div class="cfg-row">
          <div class="cfg-row-left">
            <div class="cr-title">Logged in as</div>
            <div class="cr-sub" id="cfg-uname">—</div>
          </div>
          <button class="btn-danger" onclick="logout();closeCfg();" style="font-size:.74rem;padding:6px 11px;height:auto">🚪 Log Out</button>
        </div>
      </div>

      
      <div class="cfg-section">
        <div class="cfg-section-title">View Other Accounts</div>
        <div style="background:rgba(168,85,247,.1);border:1px solid rgba(168,85,247,.3);border-radius:10px;padding:10px 13px;margin-bottom:12px;display:flex;align-items:center;gap:10px">
          <div style="flex:1">
            <div style="font-size:.85rem;font-weight:700;color:var(--acc3)" id="cfg-aq-name">—</div>
            <div style="font-size:.7rem;color:var(--dim);margin-top:2px">Main account</div>
          </div>
          <span style="font-size:.65rem;color:var(--ok);background:rgba(34,197,94,.1);border-radius:10px;padding:2px 8px">Active</span>
        </div>
        <div style="font-size:.7rem;font-weight:700;color:var(--dim);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Other accounts (read-only)</div>
        <div class="user-list" id="cfg-user-list">
          <div style="font-size:.75rem;color:var(--dim);text-align:center;padding:10px">Connect your sheet to see other accounts</div>
        </div>
        <button class="btn-g refresh-users-btn" style="width:100%;font-size:.76rem;margin-bottom:0" id="cfg-refresh-btn" onclick="fetchOtherUsersForSettings()"><span class="rib-txt">↻ Refresh from sheet</span></button>
      </div>

      <div class="cfg-section">
        <div class="cfg-section-title">Sheet Connection</div>
        <div class="cfg-row">
          <div class="cfg-row-left">
            <div class="cr-title">Last synced</div>
            <div class="cr-sub sync-time" id="cfg-last-sync">Never</div>
          </div>
          <button class="btn-s" onclick="doSyncClick();closeCfg()" style="font-size:.76rem;padding:7px 12px">Sync Now</button>
        </div>
        <div class="cfg-row">
          <div class="cfg-row-left">
            <div class="cr-title">Cache</div>
            <div class="cr-sub" id="cfg-cache-info">No cache yet</div>
          </div>
          <button class="btn-g" onclick="clearCache()" style="font-size:.76rem;padding:7px 11px">Clear</button>
        </div>
      </div>

      <div class="cfg-section">
        <div class="cfg-section-title">Data</div>
        <div style="margin-bottom:10px">
          <button class="import-btn-big" onclick="openImportModal()">📂 Import from CSV File</button>
          <div style="font-size:.7rem;color:var(--dim);text-align:center">Bulk-add words from a Google Sheets export</div>
        </div>
        <div class="cfg-row">
          <div class="cfg-row-left">
            <div class="cr-title">Export to CSV</div>
            <div class="cr-sub">Download all vocabulary as a spreadsheet file</div>
          </div>
          <button class="btn-s" onclick="exportCSV()" style="font-size:.76rem;padding:7px 12px">Export</button>
        </div>
        <div class="cfg-row">
          <div class="cfg-row-left">
            <div class="cr-title">Export all data</div>
            <div class="cr-sub">Backup vocab, settings &amp; progress as JSON</div>
          </div>
          <button class="btn-s" onclick="exportAllData()" style="font-size:.76rem;padding:7px 12px">Export JSON</button>
        </div>
        <div class="cfg-row">
          <div class="cfg-row-left">
            <div class="cr-title">Import all data</div>
            <div class="cr-sub">Restore vocab, settings &amp; progress from JSON</div>
          </div>
          <button onclick="importAllData()" style="font-size:.76rem;padding:7px 12px;background:var(--surf2);border:2px dashed var(--bdr);border-radius:var(--r);color:var(--dim);cursor:pointer;font-family:inherit;touch-action:manipulation;transition:all .18s" onmouseover="this.style.borderColor='var(--acc2)';this.style.color='var(--acc3)'" onmouseout="this.style.borderColor='var(--bdr)';this.style.color='var(--dim)'">📂 Import JSON</button>
        </div>
        <div class="cfg-row">
          <div class="cfg-row-left">
            <div class="cr-title">Reset confidence &amp; SRS</div>
          </div>
          <button class="btn-danger" onclick="resetConfidence()" style="font-size:.76rem;padding:7px 11px">Reset</button>
        </div>
      </div>

      

      <div class="cfg-section">
        <div class="cfg-section-title">Tab Order</div>
        <div style="font-size:.74rem;color:var(--dim);margin-bottom:10px">Drag or use the arrows to reorder navigation tabs.</div>
        <div id="tab-order-list" style="display:flex;flex-direction:column;gap:5px"></div>
        <div style="height:6px"></div>
        <button class="btn-g" style="font-size:.74rem;padding:7px 12px" onclick="resetTabOrder()">Reset to default</button>
      </div>

      <div class="cfg-section">
        <div class="cfg-section-title">About</div>
        <div class="cfg-row">
          <div class="cfg-row-left">
            <div class="cr-title">Support</div>
            <div class="cr-sub">
              <div class="cr-sub">1. <a href="olsen.porter@missionary.org" style="text-decoration:underline;color:#6b9bd1">olsen.porter@missionary.org</a></div>
              <div class="cr-sub">2. <a href="https://m.me/olsen.porter" style="text-decoration:underline;color:#6b9bd1">https://m.me/olsen.porter</a></div>
            </div>
          </div>
          <span style="font-size:.72rem;color:var(--dim)">Email &<br>Messenger</span>
        </div>
        <div class="cfg-row">
          <div class="cfg-row-left">
            <div class="cr-title">Links</div>
            <div class="cr-sub">
              <div class="cr-sub">1. <a href="https://docs.google.com/document/d/1ynpcFYYxTFDjj9exho4jvJZeWI55VQJDmJutVzQgH30/edit?usp=drivesdk" style="text-decoration:underline;color:#6b9bd1">KV CHANGELOG</a></div>
              <div class="cr-sub">2. <a href="https://docs.google.com/document/d/1s1HbAuR1h9jH_MAjnk0gMCkzKoHNU9Sa1DiXR61RpgU/edit?usp=drivesdk" style="text-decoration:underline;color:#6b9bd1">KV FEATURE REQUESTS & BUG REPORTS</a></div>
            </div>
          </div>
          <span style="font-size:.72rem;color:var(--dim)">Extenal<br>Docs</span>
        </div>
        <div class="cfg-row">
          <div class="cfg-row-left">
            <div class="cr-title">Khmer Vocabulary</div>
            <div class="cr-sub">Personal or Social learning tool</div>
          </div>
          <span style="font-size:.72rem;color:var(--dim)">v8.6.2</span>
        </div>
        <div class="cfg-row">
          <div class="cfg-row-left">
            <div class="cr-title">Made By:</div>
            <div class="cr-sub">Porter Olsen</div>
          </div>
          <span style="font-size:.72rem;color:var(--dim)">(Ion-o-koji)</span>
        </div>
      </div>
      <div class="macts" style="margin-top:4px"><button class="btn-g" onclick="closeCfg()">Close</button></div>
    </div>
  </div>

  <!-- ═══ MODAL: Confidence Word List ═══ -->
  <div class="movl" id="conf-words-ovl" onclick="if(event.target===this)this.classList.remove('open')">
    <div class="mcard" style="max-width:480px">
      <h3 id="conf-words-title">Words</h3>
      <div id="conf-words-list" style="max-height:55vh;overflow-y:auto;padding-right:4px"></div>
      <div class="macts" style="margin-top:14px">
        <button class="btn-g" onclick="el('conf-words-ovl').classList.remove('open')">Close</button>
        <button id="conf-words-study-btn" class="btn-s" onclick="_studyConfWords()" style="background:var(--acc3)">&#x1F4DA; Study These</button>
      </div>
    </div>
  </div>

  <!-- ═══ MODAL: Import CSV ═══ -->
  <div class="movl" id="import-ovl" onclick="if(event.target===this)closeImportModal()">
    <div class="mcard">
      <h3>📂 Import from Google Sheets CSV</h3>

      <div class="step-box">
        <div class="step-title">How to prepare and download your CSV:</div>
        <div class="step-row">
          <div class="step-num">1</div>
          <div class="step-text">Open <strong>Google Sheets</strong> Create a new spreadsheet.</div>
        </div>
        <div class="step-row">
          <div class="step-num">2</div>
          <div class="step-text">In <strong>Row 1</strong>, type these headers exactly in columns A through D:<br><code>English</code> &nbsp; <code>Khmer</code> &nbsp; <code>Romanization</code> &nbsp; <code>Notes</code></div>
        </div>
        <div class="step-row">
          <div class="step-num">3</div>
          <div class="step-text">Fill in your words starting from <strong>Row 2</strong>. English in column A, Khmer script in column B. All columns are optional except English or Khmer.</div>
        </div>
        <div class="step-row">
          <div class="step-num">4</div>
          <div class="step-text">Make sure you are <strong>in the Google Sheets</strong> then go to:<br><strong>The 3 lines, top right (⋮) → Shere & Export → Save As → CSV (current sheet) → Upload</strong></div>
        </div>
        <div class="step-row">
          <div class="step-num">5</div>
          <div class="step-text">Go back to the main <strong>Google Sheets</strong> page and download the <strong>CSV</strong> sheet</div>
        </div>
        <div class="step-row">
          <div class="step-num">6</div>
          <div class="step-text">Choose that .csv file when you press the button below (It should be in you download folder). Duplicates are skipped. Date defaults to today if blank.</div>
        </div>
      </div>

      <div class="csv-example">
        <div class="ex-label">Example of what your filled Google Sheet should look like:</div>
        <table class="ex-table">
          <thead>
            <tr>
              <th>English</th>
              <th>Khmer</th>
              <th>Romanization</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>water</td>
              <td class="kh">ទឹក</td>
              <td>tuk</td>
              <td>drinking water</td>
            </tr>
            <tr>
              <td>house</td>
              <td class="kh"></td>
              <td>pteah</td>
              <td></td>
            </tr>
            <tr>
              <td>country</td>
              <td class="kh">ស្រុក</td>
              <td></td>
              <td>also means village</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="csv-dl-note">
        📍 <strong>Important:</strong> You must follow the steps <strong>exactly</strong>, you must also be in the sheet and save to CSV.<br>
        - You must also format the sheet <strong>exactly</strong>
      </div>

      <div class="csv-err" id="csv-err"></div>

      <div id="csv-main-area">
        <input type="file" id="csv-file-input" accept=".csv,text/csv" style="display:none" onchange="handleCsvFile(event)">
        <button class="import-btn-big" onclick="el('csv-file-input').click()">📁 Choose CSV File</button>
        <div id="csv-file-name" style="font-size:.72rem;color:var(--dim);text-align:center;margin-top:4px"></div>
      </div>

      <div class="csv-loading" id="csv-loading">
        <div class="csv-spinner"></div>
        <div class="csv-loading-txt" id="csv-loading-txt">Reading file…</div>
      </div>

      <div id="csv-preview" style="display:none;margin-bottom:12px">
        <div style="font-size:.75rem;font-weight:700;color:var(--text);margin-bottom:6px" id="csv-preview-title"></div>
        <div style="background:var(--surf2);border-radius:8px;padding:10px;max-height:140px;overflow-y:auto" id="csv-preview-list"></div>
      </div>

      <div class="macts">
        <button class="btn-g" onclick="closeImportModal()">Cancel</button>
        <button class="btn-s" id="csv-import-btn" onclick="confirmImport()" disabled style="opacity:.5">
          <span id="csv-import-lbl">Import</span>
        </button>
      </div>
    </div>
  </div>

  <!-- ═══ MODAL: Bulk Category ═══ -->
  <div class="movl" id="bulkcat-ovl" onclick="if(event.target===this)this.classList.remove('open')">
    <div class="mcard">
      <h3>📂 Change Category</h3>
      <p>Move <span id="bulkcat-count">0</span> selected entries to:</p>
      <div style="display:flex;gap:6px;align-items:center"><select class="minput" id="bulkcat-sel" style="height:46px;margin-bottom:14px"></select><button type="button" class="add-cat-btn" onclick="openNewCatModal()" title="Add/edit categories">+</button></div>
      <div class="macts">
        <button class="btn-g" onclick="el('bulkcat-ovl').classList.remove('open')">Cancel</button>
        <button class="btn-s" onclick="applyBulkCat()">Apply &amp; Sync</button>
      </div>
    </div>
  </div>
  </div>

  <!-- ═══ MODAL: Custom Category ═══ -->
  <div class="movl" id="newcat-ovl" onclick="if(event.target===this)this.classList.remove('open')">
    <div class="mcard">
      <h3>🏷 Manage Categories</h3>
      <p>Custom categories appear in all dropdowns and sync to your sheet.</p>
      <div style="display:flex;gap:7px;margin-bottom:12px">
        <input class="minput" id="newcat-inp" type="text" placeholder="New category name…" style="flex:1;margin-bottom:0" />
        <button class="btn-s" onclick="addCustomCat()">Add</button>
      </div>
      <div id="custom-cat-list" style="display:flex;flex-direction:column;gap:7px;margin-bottom:8px;max-height:260px;overflow-y:auto"></div>
      <div class="macts"><button class="btn-g" onclick="el('newcat-ovl').classList.remove('open')">Done</button></div>
    </div>
  </div>
  `;
    })();
    // ── App logic ──────────────────────────────────────────────────────

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
      QUEUE_KEY = 'kv_pending_queue',
      DELETED_CATS_KEY = 'kv_deleted_cats',
      CAT_ORDER_KEY = 'kv_cat_order',
      COL_WIDTHS_KEY = 'kv_col_widths',
      STREAK_KEY = 'kv_streak',
      ACHV_KEY = 'kv_achievements',
      COMEBACK_KEY = 'kv_comeback_count',
      WEEKLY_ADD_KEY = 'kv_weekly_adds',
      BURGLAR_KEY = 'kv_burglar_count',
      EXPLORER_KEY = 'kv_explorer_count',
      THEME_KEY = 'kv_theme',
      BEST_STREAK_KEY = 'kv_best_streak';

    var SCRIPT_URL = ls(URL_KEY) || 'https://script.google.com/macros/s/AKfycbwANcenl0L59PHfjo50yoIp-0iwvV8sC6mlFzg3hVsKOJFffrW4lce5nB3DQGpecVK9/exec';
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
    var lastWriteTime = 0;

    var favorites = new Set(safeJsonParse(ls(FAV_KEY), []));
    var confidence = safeJsonParse(ls(CONF_KEY), {});
    var srsData = safeJsonParse(ls(SRS_KEY), {});
    var customCats = safeJsonParse(ls(CATS_KEY), []);
    var tempGuestCats = [];
    var deletedCats = safeJsonParse(ls(DELETED_CATS_KEY), []);
    var catOrder = safeJsonParse(ls(CAT_ORDER_KEY), []);
    var colWidths = safeJsonParse(ls(COL_WIDTHS_KEY), {});
    var studySets = safeJsonParse(ls(SETS_KEY), []);
    var pendingQueue = safeJsonParse(ls(QUEUE_KEY), []);
    var achievements = safeJsonParse(ls(ACHV_KEY), {});
    var importState = {
      active: false,
      total: 0,
      sent: 0,
      failed: 0,
      label: ''
    };

    var deleteState = {
      active: false,
      total: 0,
      done: 0
    };

    var saveState = {
      active: false,
      total: 0,
      done: 0
    };

    var DEFAULT_CATS = ['Words', 'Sentences'];
    var S = {
      density: 'compact',
      highlight: true,
      autoSync: 0,
      studyDir: 'kh',
      studyRo: true,
      offlineMode: false,
      enFontSize: 14,
      enFont: "system-ui,-apple-system,'Segoe UI',sans-serif",
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
        acc: '#6d31d4',
        acc2: '#9333ea',
        acc3: '#b06ef5'
      },
      blue: {
        acc: '#1840c2',
        acc2: '#2f72e8',
        acc3: '#7ab3f8'
      },
      teal: {
        acc: '#0d6660',
        acc2: '#0fa89a',
        acc3: '#4dd8c8'
      },
      green: {
        acc: '#105528',
        acc2: '#18a84e',
        acc3: '#6edc94'
      },
      rose: {
        acc: '#9c161f',
        acc2: '#c91d28',
        acc3: '#d8535c'
      },
      amber: {
        acc: '#7c350a',
        acc2: '#d98a08',
        acc3: '#f5cc60'
      },
      white: {
        acc: '#8899aa',
        acc2: '#c8d4df',
        acc3: '#f0f4f8'
      },
      black: {
        acc: '#080810',
        acc2: '#181824',
        acc3: '#383850'
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
      name: 'Commit'
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
      name: 'Transcend'
    }];
    var MILESTONES_STUDY = [{
      n: 1,
      icon: '🎯',
      name: '1st Study'
    }, {
      n: 10,
      icon: '📖',
      name: 'Student'
    }, {
      n: 25,
      icon: '🧠',
      name: 'Brain Pwr'
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

    var MILESTONES_MASTER = [{
      n: 5,
      icon: '✨',
      name: '5 Mastered'
    }, {
      n: 20,
      icon: '🎖️',
      name: '20 Mastered'
    }, {
      n: 50,
      icon: '🥈',
      name: '50 Mastered'
    }, {
      n: 100,
      icon: '🥇',
      name: '100 Mastered'
    }, {
      n: 250,
      icon: '🏆',
      name: '250 Mastered'
    }, {
      n: 500,
      icon: '💎',
      name: '500 Mastered'
    }];

    var MILESTONES_STREAK = [{
      n: 3,
      icon: '🔔',
      name: '3 Days'
    }, {
      n: 7,
      icon: '📅',
      name: '1 Week'
    }, {
      n: 14,
      icon: '💪',
      name: '2 Weeks'
    }, {
      n: 30,
      icon: '🗓️',
      name: '1 Month'
    }, {
      n: 60,
      icon: '🏅',
      name: '2 Months'
    }, {
      n: 100,
      icon: '👑',
      name: '100 Days'
    }];

    var ACHIEVEMENTS = [{
        id: 'star_collector',
        icon: '⭐',
        name: 'Star Collector',
        hint: 'Some words deserve a little extra love — start collecting them.',
        secret: false,
        desc: 'Added 25 words to your favourites.'
      },
      {
        id: 'broad_learner',
        icon: '🌍',
        name: 'Broad Learner',
        hint: 'Don\'t stay in one lane — knowledge has many shapes.',
        secret: false,
        desc: 'Added words across 4 or more different categories.'
      },
      {
        id: 'organiser',
        icon: '🗂️',
        name: 'Organiser',
        hint: 'Structure and variety go hand in hand.',
        secret: false,
        desc: 'Created and used 5 or more different categories.'
      },
      {
        id: 'word_hoarder',
        icon: '🏦',
        name: 'Word Hoarder',
        hint: 'A truly large collection takes patience to build.',
        secret: false,
        desc: 'Added 500 or more words to your sheet.'
      },
      {
        id: 'reset_button',
        icon: '🔴',
        name: 'Reset Button',
        hint: 'Facing your weaknesses is how you get stronger.',
        secret: true,
        desc: 'Used "Study weak words again" after finishing a session.'
      },
      {
        id: 'daily_habit',
        icon: '🔔',
        name: 'Daily Habit',
        hint: 'Come back each day and something will grow...',
        secret: true,
        desc: 'Studied 3 days in a row.'
      },
      {
        id: 'comeback',
        icon: '🔄',
        name: 'Comeback',
        hint: 'What once stumped you may surprise you.',
        secret: true,
        desc: 'Promoted 20 words from Unknown to Got it.'
      },
      {
        id: 'tortoise',
        icon: '🐢',
        name: 'Tortoise',
        hint: 'Slow and steady wins the race.',
        secret: true,
        desc: 'Added at least one word every week for 4 weeks in a row.'
      },
      {
        id: 'explorer',
        icon: '🗺️',
        name: 'Explorer',
        hint: 'Other pages hold secrets worth discovering.',
        secret: true,
        desc: 'Completed a 20+ card study session on someone else\'s page.'
      },
      {
        id: 'burglar',
        icon: '🥷',
        name: 'Burglar',
        hint: '...you didn\'t hear this from us.',
        secret: true,
        desc: 'Quietly borrowed 10 or more words from another person\'s sheet.'
      }
    ];

    // ── Achievement system ────────────────────────────────────────────────

    function todayKH() {
      var d = new Date(Date.now() + 7 * 3600000);
      var p = function(x) {
        return x < 10 ? '0' + x : String(x);
      };
      return d.getUTCFullYear() + '-' + p(d.getUTCMonth() + 1) + '-' + p(d.getUTCDate());
    }

    function isoWeekKey() {
      var d = new Date(Date.now() + 7 * 3600000);
      var day = d.getUTCDay() || 7;
      var monday = new Date(d.getTime() - (day - 1) * 86400000);
      var p = function(x) {
        return x < 10 ? '0' + x : String(x);
      };
      return monday.getUTCFullYear() + '-' + p(monday.getUTCMonth() + 1) + '-' + p(monday.getUTCDate());
    }

    function trackWeeklyAdd() {
      var weeks = safeJsonParse(ls(WEEKLY_ADD_KEY), []);
      var wk = isoWeekKey();
      if (!weeks.length || weeks[weeks.length - 1] !== wk) {
        weeks.push(wk);
        if (weeks.length > 20) weeks = weeks.slice(-20);
        lsSet(WEEKLY_ADD_KEY, JSON.stringify(weeks));
      }
      checkAndUnlock('tortoise');
    }

    function unlockAchievement(id) {
      if (achievements[id] && achievements[id].unlocked) return false;
      achievements[id] = {
        unlocked: true,
        date: todayKH()
      };
      lsSet(ACHV_KEY, JSON.stringify(achievements));
      var a = ACHIEVEMENTS.filter(function(x) {
        return x.id === id;
      })[0];
      if (a) showAchievementToast(a);
      return true;
    }

    function checkAndUnlock(id) {
      if (achievements[id] && achievements[id].unlocked) return;
      var unlock = false;
      if (id === 'star_collector') {
        unlock = favorites.size >= 25;
      } else if (id === 'broad_learner') {
        var cats1 = {};
        allRows.forEach(function(r) {
          cats1[r.category || 'Words'] = 1;
        });
        unlock = Object.keys(cats1).length >= 4;
      } else if (id === 'organiser') {
        var cats2 = {};
        allRows.forEach(function(r) {
          cats2[r.category || 'Words'] = 1;
        });
        unlock = Object.keys(cats2).length >= 5;
      } else if (id === 'daily_habit') {
        var sd = safeJsonParse(ls(STREAK_KEY), {
          count: 0
        });
        unlock = (sd.count || 0) >= 3;
      } else if (id === 'comeback') {
        unlock = (parseInt(ls(COMEBACK_KEY) || '0')) >= 20;
      } else if (id === 'tortoise') {
        var weeks = safeJsonParse(ls(WEEKLY_ADD_KEY), []);
        // Require 4 *consecutive* week entries (each adjacent pair is 1 week apart)
        if (weeks.length >= 4) {
          var tail = weeks.slice(-4);
          var consec = true;
          for (var wi = 0; wi < 3; wi++) {
            var partsA = tail[wi].split('-W'),
              partsB = tail[wi + 1].split('-W');
            var yrA = parseInt(partsA[0], 10),
              wkA = parseInt(partsA[1], 10);
            var yrB = parseInt(partsB[0], 10),
              wkB = parseInt(partsB[1], 10);
            var diffWeeks = (yrB - yrA) * 53 + (wkB - wkA);
            if (diffWeeks !== 1) {
              consec = false;
              break;
            }
          }
          unlock = consec;
        }
      } else if (id === 'explorer') {
        unlock = (parseInt(ls(EXPLORER_KEY) || '0')) >= 1;
      } else if (id === 'burglar') {
        unlock = (parseInt(ls(BURGLAR_KEY) || '0')) >= 10;
      } else if (id === 'word_hoarder') {
        unlock = allRows.length >= 500;
      } else if (id === 'reset_button') {
        unlock = (parseInt(ls('kv_reset_btn') || '0')) >= 1;
      }
      if (unlock) unlockAchievement(id);
    }

    function showAchievementToast(a) {
      var box = el('tbox');
      if (!box) return;
      var div = document.createElement('div');
      div.className = 'toast achv-toast';
      div.innerHTML = '<span class="achv-toast-icon">' + a.icon + '</span><span><strong>Achievement!</strong> ' + esc(a.name) + '</span>';
      box.appendChild(div);
      setTimeout(function() {
        if (div.parentNode) div.parentNode.removeChild(div);
      }, 5500);
    }

    function renderAchvShelf() {
      var shelf = el('achv-shelf');
      if (!shelf) return;
      shelf.innerHTML = '';
      var firstLocked = null;
      ACHIEVEMENTS.forEach(function(a) {
        var data = achievements[a.id];
        var unlocked = !!(data && data.unlocked);
        var card = document.createElement('div');
        card.className = 'ms-card achv-card' + (unlocked ? ' unlocked' : '');
        card.style.cursor = 'pointer';
        card.innerHTML = '<div class="ms-icon">' + a.icon + '</div>' +
          '<div class="ms-name">' + (a.secret && !unlocked ? '???' : esc(a.name)) + '</div>' +
          '<div class="ms-req">' + (unlocked ? '✓' : '🔒') + '</div>';
        (function(aRef, dataRef, unlockedRef) {
          card.onclick = function() {
            if (unlockedRef) {
              toast(aRef.icon + ' ' + aRef.name + ': ' + aRef.desc + (dataRef && dataRef.date ? ' (' + dataRef.date + ')' : ''), 'ok');
            } else {
              toast('\uD83D\uDCA1 ' + aRef.hint, 'inf');
            }
          };
        })(a, data, unlocked);
        shelf.appendChild(card);
        if (!unlocked && !firstLocked) firstLocked = card;
      });
      if (firstLocked) {
        setTimeout(function() {
          var cw = firstLocked.offsetWidth || 70;
          shelf.scrollLeft = Math.max(0, firstLocked.offsetLeft + cw - shelf.clientWidth + 6);
        }, 60);
      }
    }

    // ── Theme ─────────────────────────────────────────────────────────────

    function applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme || 'dark');
      var btn = el('theme-toggle-btn');
      if (btn) btn.textContent = (theme === 'light') ? '\uD83C\uDF19 Dark mode' : '\u2600\uFE0F Light mode';
      lsSet(THEME_KEY, theme || 'dark');
    }

    function toggleTheme() {
      var current = document.documentElement.getAttribute('data-theme') || 'dark';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    }

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

    function applyColWidth(col, val) {
      val = parseInt(val);
      if (isNaN(val)) return;
      colWidths[col] = val;
      lsSet(COL_WIDTHS_KEY, JSON.stringify(colWidths));
      document.documentElement.style.setProperty('--col-w-' + col, val + 'px');
      var lbl = el('cw-' + col + '-lbl');
      if (lbl) lbl.textContent = val + 'px';
      var numEl = el('cw-' + col + '-num');
      if (numEl && document.activeElement !== numEl) numEl.value = val;
    }

    function loadColWidths() {
      ['en', 'kh', 'ro', 'no', 'ca'].forEach(function(c) {
        var locked = el('cw-' + c + '-lock');
        var sl = el('cw-' + c);
        var num = el('cw-' + c + '-num');
        var isLocked = locked ? locked.checked : true;
        if (sl) sl.disabled = isLocked;
        if (num) num.disabled = isLocked;
      });
      var defs = {
        en: 160,
        kh: 180,
        ro: 150,
        no: 170,
        ca: 110
      };
      Object.keys(defs).forEach(function(col) {
        var val = colWidths[col] || defs[col];
        document.documentElement.style.setProperty('--col-w-' + col, val + 'px');
        var sl = el('cw-' + col);
        if (sl) sl.value = val;
        var lb = el('cw-' + col + '-lbl');
        if (lb) lb.textContent = val + 'px';
      });
    }

    function resetColWidths() {
      if (!confirm('Reset all column widths to default?')) return;
      colWidths = {};
      lsSet(COL_WIDTHS_KEY, JSON.stringify(colWidths));
      ['en', 'kh', 'ro', 'no', 'ca'].forEach(function(c) {
        var lock = el('cw-' + c + '-lock');
        var sl = el('cw-' + c);
        var num = el('cw-' + c + '-num');
        if (lock) lock.checked = true;
        if (sl) sl.disabled = true;
        if (num) num.disabled = true;
      });
      loadColWidths();
      toast('Column widths reset.', 'ok');
    }

    function nowKH() {
      var d = new Date();
      var kh = new Date(d.getTime() + 7 * 3600000);
      var p = function(x) {
        return x < 10 ? '0' + x : String(x);
      };
      return kh.getUTCFullYear() + '-' + p(kh.getUTCMonth() + 1) + '-' + p(kh.getUTCDate()) + ' ' + p(kh.getUTCHours()) + ':' + p(kh.getUTCMinutes());
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
      checkAndUnlock('star_collector');
    }

    function saveStudySets() {
      lsSet(SETS_KEY, JSON.stringify(studySets));
    }

    function saveCatOrder() {
      lsSet(CAT_ORDER_KEY, JSON.stringify(catOrder));
    }

    function initCatOrder() {
      var all = getAllCats();
      catOrder = catOrder.filter(function(c) {
        return all.indexOf(c) !== -1;
      });
      all.forEach(function(c) {
        if (catOrder.indexOf(c) === -1) catOrder.push(c);
      });
      saveCatOrder();
    }

    function moveCatItem(idx, dir) {
      initCatOrder();
      var newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= catOrder.length) return;
      var tmp = catOrder[idx];
      catOrder[idx] = catOrder[newIdx];
      catOrder[newIdx] = tmp;
      saveCatOrder();
      renderCustomCatList();
      refreshAllCatDropdowns();
    }

    function resetCatOrder() {
      catOrder = [];
      saveCatOrder();
      refreshAllCatDropdowns();
      renderCustomCatList();
      toast('Category order reset.', 'ok');
    }

    function saveCustomCats() {
      lsSet(CATS_KEY, JSON.stringify(customCats));
    }

    function savePendingQueue() {
      lsSet(QUEUE_KEY, JSON.stringify(pendingQueue));
    }

    function getAllCats() {
      var raw = DEFAULT_CATS.slice();
      customCats.forEach(function(c) {
        if (raw.indexOf(c) === -1) raw.push(c);
      });
      var cats;
      if (catOrder && catOrder.length) {
        cats = catOrder.filter(function(c) {
          return raw.indexOf(c) !== -1;
        });
        raw.forEach(function(c) {
          if (cats.indexOf(c) === -1) cats.push(c);
        });
      } else {
        cats = raw;
      }
      cats = cats.filter(function(c) {
        return deletedCats.indexOf(c) === -1;
      });
      if (readOnlyMode) {
        tempGuestCats.forEach(function(c) {
          if (cats.indexOf(c) === -1) cats.push(c);
        });
      }
      return cats;
    }

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
      if (!SCRIPT_URL) return 'new_user';
      try {
        var url = new URL(SCRIPT_URL);
        url.searchParams.set('action', 'verifyCredential');
        url.searchParams.set('username', name);
        url.searchParams.set('password', pass);
        var resp = await fetch(url.toString());
        var json = await resp.json();
        if (!json.success) return 'new_user';
        return json.result;
      } catch (e) {
        return 'new_user';
      }
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
      performLogout();
    }

    function performLogout() {
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
      if (SCRIPT_URL) loadData();
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

    function setBusy(delta) {
      activeTasks = Math.max(0, activeTasks + delta);
      updateSyncBtn();
    }

    function updateSyncBtn() {
      var sb = el('sync-btn');
      if (!sb) return;
      var canSync = !!SCRIPT_URL && activeTasks === 0 && !readOnlyMode && !(S && S.offlineMode);
      sb.disabled = !canSync;
      sb.title = !SCRIPT_URL ? 'Connect your sheet in ⚙️ Settings first' :
        readOnlyMode ? 'Viewing read-only — return to your account to sync' :
        (S && S.offlineMode) ? 'Offline mode is on — disable it to sync' :
        activeTasks > 0 ? 'Busy — wait for current action to finish' : 'Sync now';
    }

    function doSyncClick() {
      if (activeTasks > 0) {
        toast('Please wait for the current action to finish first.', 'inf');
        return;
      }
      loadData(true);
    }

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
      var ttsTimeout = setTimeout(function() {
        tryWebSpeech(text, 'km-KH');
      }, 5000);
      audio.addEventListener('canplay', function() {
        clearTimeout(ttsTimeout);
      });
      audio.addEventListener('error', function() {
        clearTimeout(ttsTimeout);
        tryWebSpeech(text, 'km-KH');
      });
      ttsAudio = audio;
      audio.play().catch(function() {
        clearTimeout(ttsTimeout);
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
      if (importState.active || deleteState.active || saveState.active) el('imp-prog-ovl').classList.add('open');
    }

    function updateImportProgress() {
      var pct = importState.total ? Math.round(importState.sent / importState.total * 100) : 0;
      var lb = el('imp-label'),
        pc = el('imp-pct'),
        bar = el('imp-bar'),
        det = el('imp-detail'),
        ttl = el('imp-prog-title');
      if (ttl) ttl.textContent = '📥 Import Progress';
      if (lb) lb.textContent = importState.label || 'Importing…';
      if (pc) pc.textContent = pct + '%';
      if (bar) bar.style.width = pct + '%';
      if (det) det.textContent = importState.sent + '/' + importState.total + ' words' + (importState.failed ? ' (' + importState.failed + ' failed)' : '');
      setStatus('imp', 'Importing ' + importState.sent + '/' + importState.total + '…');
    }

    function updateDeleteProgress() {
      var pct = deleteState.total ? Math.round(deleteState.done / deleteState.total * 100) : 0;
      var lb = el('imp-label'),
        pc = el('imp-pct'),
        bar = el('imp-bar'),
        det = el('imp-detail'),
        ttl = el('imp-prog-title');
      if (ttl) ttl.textContent = saveState.active ? '🗑️ Delete + 💾 Save' : '🗑️ Delete Progress';
      if (lb) lb.textContent = 'Deleting from sheet…';
      if (pc) pc.textContent = pct + '%';
      if (bar) bar.style.width = pct + '%';
      if (det) det.textContent = deleteState.done + '/' + deleteState.total + ' word' + (deleteState.total !== 1 ? 's' : '') + ' deleted';
      var deleteRemaining = deleteState.active ? deleteState.total - deleteState.done : 0;
      var totalTasks = deleteRemaining + (saveState.active ? saveState.total - saveState.done : 0);
      if (totalTasks > 0) setStatus('imp', deleteRemaining + ' word' + (deleteRemaining !== 1 ? 's' : '') + ' deleting…');
    }

    function triggerSaveState() {
      if (!saveState.active) {
        saveState.done = 0;
        saveState.total = pendingQueue.length;
        saveState.active = true;
      } else {
        saveState.total = saveState.done + pendingQueue.length;
      }
      updateSaveProgress();
    }

    function updateSaveProgress() {
      var pct = saveState.total ? Math.round(saveState.done / saveState.total * 100) : 0;
      var label = 'Saving to sheet…';
      var detail = saveState.done + '/' + saveState.total + ' word' + (saveState.total !== 1 ? 's' : '') + ' saved';
      var hasOther = importState.active || deleteState.active;
      var sec2 = el('imp-bar-section-2');
      if (hasOther) {
        var lb2 = el('save-label'),
          pc2 = el('save-pct'),
          bar2 = el('save-bar'),
          det2 = el('save-detail');
        if (lb2) lb2.textContent = label;
        if (pc2) pc2.textContent = pct + '%';
        if (bar2) bar2.style.width = pct + '%';
        if (det2) det2.textContent = detail;
        if (sec2) sec2.style.display = saveState.active ? 'block' : 'none';
      } else {
        var lb = el('imp-label'),
          pc = el('imp-pct'),
          bar = el('imp-bar'),
          det = el('imp-detail'),
          ttl = el('imp-prog-title');
        if (ttl) ttl.textContent = '💾 Saving Progress';
        if (lb) lb.textContent = label;
        if (pc) pc.textContent = pct + '%';
        if (bar) bar.style.width = pct + '%';
        if (det) det.textContent = detail;
        if (sec2) sec2.style.display = 'none';
        var remaining = saveState.total - saveState.done;
        setStatus('imp', remaining + ' word' + (remaining !== 1 ? 's' : '') + ' saving…');
      }
    }

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
      sel.value = val;
    }

    function populateStudyPresetFilter() {
      var sel = el('study-preset-filter');
      if (!sel) return;
      var val = sel.value || 'none';
      sel.innerHTML = '';
      addOpt(sel, 'none', '— No preset —');
      addOpt(sel, '__weak__', '🔴 Weak words only');
      addOpt(sel, '__due__', '🔁 SRS Due today');
      addOpt(sel, '__cons__', '🔤 Consonants');
      addOpt(sel, '__depvow__', '🔡 Dep. Vowels');
      addOpt(sel, '__indvow__', '🔠 Ind. Vowels');
      addOpt(sel, '__nums__', '🔢 Numbers (0–100)');
      sel.value = val;
    }

    function onStudyCatChange(which) {
      var userSel = el('study-filter');
      var presetSel = el('study-preset-filter');
      if (!userSel || !presetSel) return;
      if (which === 'user') {
        presetSel.value = 'none';
        userSel.classList.add('active-sel');
        presetSel.classList.remove('active-sel');
      } else {
        if (presetSel.value === 'none') {
          userSel.classList.add('active-sel');
          presetSel.classList.remove('active-sel');
        } else {
          userSel.value = 'All';
          presetSel.classList.add('active-sel');
          userSel.classList.remove('active-sel');
        }
      }
    }

    function refreshAllCatDropdowns() {
      var vc = (el('view-cat-filter') || {}).value || ls('kv_view_cat') || 'All',
        fc = (el('f-cat') || {}).value || 'Words',
        ec = (el('e-cat') || {}).value || 'Words',
        bc = (el('bulkcat-sel') || {}).value || 'Words';
      populateCatDropdown('view-cat-filter', true, vc);
      populateCatDropdown('f-cat', false, fc);
      populateCatDropdown('e-cat', false, ec);
      populateCatDropdown('bulkcat-sel', false, bc);
      populateStudyFilter();
      populateStudyPresetFilter();
    }

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
      var PROTECTED = ['Words', 'Sentences'];
      var allCatsToShow = getAllCats();
      if (!allCatsToShow.length) {
        box.innerHTML = '<div style="font-size:.75rem;color:var(--dim);padding:8px">No categories yet.</div>';
        return;
      }
      allCatsToShow.forEach(function(c) {
        var safe = c.replace(/[^a-z0-9]/gi, '_'),
          row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:6px;padding:7px 10px;background:var(--surf2);border:1px solid var(--bdr);border-radius:10px';
        var isProtected = PROTECTED.indexOf(c) !== -1;
        if (editingName === c && !isProtected) {
          row.innerHTML = '<input id="cat-edit-inp-' + safe + '" style="flex:1;height:30px;background:var(--bg);border:1px solid var(--acc2);border-radius:6px;color:var(--text);padding:0 8px;font-size:.8rem;outline:none" value="' + esc(c) + '"/>' +
            '<button class="btn-s" style="padding:5px 10px;font-size:.75rem" onclick="finishEditCat(\'' + c.replace(/'/g, "\\'") + '\')" >✓</button>' +
            '<button class="btn-g" style="padding:5px 8px;font-size:.75rem" onclick="renderCustomCatList()">✕</button>';
        } else {
          var ci = allCatsToShow.indexOf(c);
          row.innerHTML = '<span style="flex:1;font-size:.82rem;color:var(--text)">' + esc(c) + (isProtected ? ' <span style="font-size:.65rem;color:var(--dim)">(protected)</span>' : '') + '</span>' +
            '<button type="button" style="padding:3px 7px;font-size:.7rem;background:var(--surf);border:1px solid var(--bdr);border-radius:5px;color:var(--dim)" onclick="moveCatItem(' + ci + ',-1)" ' + (ci === 0 ? 'disabled' : '') + '>↑</button>' +
            '<button type="button" style="padding:3px 7px;font-size:.7rem;background:var(--surf);border:1px solid var(--bdr);border-radius:5px;color:var(--dim)" onclick="moveCatItem(' + ci + ',1)" ' + (ci === allCatsToShow.length - 1 ? 'disabled' : '') + '>↓</button>' +
            (isProtected ? '' : '<button class="custom-cat-edit" onclick="startEditCat(\'' + c.replace(/'/g, "\\'") + '\')" title="Rename">✏️</button>') +
            (isProtected ? '' : '<button class="custom-cat-del" onclick="removeCatAny(\'' + c.replace(/'/g, "\\'") + '\')" title="Delete">✕</button>');
        }
        box.appendChild(row);
      });
    }

    function removeCatAny(name) {
      var PROTECTED = ['Words', 'Sentences'];
      if (PROTECTED.indexOf(name) !== -1) {
        toast('Cannot delete protected category.', 'err');
        return;
      }
      if (!confirm('⚠️ Delete category "' + name + '"?\n\nThis will permanently remove the category and move all words in it to "Words". This cannot be undone.')) return;
      if (deletedCats.indexOf(name) === -1) {
        deletedCats.push(name);
        lsSet(DELETED_CATS_KEY, JSON.stringify(deletedCats));
      }
      customCats = customCats.filter(function(c) {
        return c !== name;
      });
      DEFAULT_CATS = DEFAULT_CATS.filter(function(c) {
        return c !== name;
      });
      allRows.forEach(function(r) {
        if (r.category === name) r.category = 'Words';
      });
      saveCustomCats();
      saveCache(allRows);
      refreshAllCatDropdowns();
      renderCustomCatList();
      render();
      renderFav();
      syncCategoryToSheet('delete', name);
      toast('Category "' + name + '" deleted. Words moved to "Words".', 'ok');
    }

    function syncCategoryToSheet(action, name, newName) {
      if (!SCRIPT_URL) return Promise.resolve();
      var url = new URL(SCRIPT_URL);
      url.searchParams.set('action', 'manageCategory');
      url.searchParams.set('op', action);
      url.searchParams.set('name', name);
      if (newName) url.searchParams.set('newName', newName);
      url.searchParams.set('user', MAIN_USER);
      return fetch(url.toString()).then(function(r) {
        return r.json();
      }).then(function(j) {
        if (j.success && Array.isArray(j.categories)) {
          applyCategoriesFromSheet(j.categories);
        }
      }).catch(function() {});
    }

    function applyCategoriesFromSheet(sheetCats) {
      customCats = sheetCats.filter(function(c) {
        return DEFAULT_CATS.indexOf(c) === -1;
      });
      deletedCats = [];
      lsSet(DELETED_CATS_KEY, '[]');
      saveCustomCats();
      refreshAllCatDropdowns();
      renderCustomCatList();
    }

    function loadCategoriesFromSheet() {
      if (!SCRIPT_URL || !MAIN_USER) return;
      fetch(SCRIPT_URL + '?action=getCategories&user=' + encodeURIComponent(MAIN_USER))
        .then(function(r) {
          return r.json();
        })
        .then(function(j) {
          if (j.success && Array.isArray(j.categories)) {
            applyCategoriesFromSheet(j.categories);
          }
        }).catch(function() {});
    }

    var DEFAULT_TAB_ORDER = ['view', 'add', 'trans', 'fav', 'study', 'progress', 'ref', 'dash'];
    var TAB_ORDER_KEY = 'kv_tab_order';
    var tabOrder = safeJsonParse(ls(TAB_ORDER_KEY), null) || DEFAULT_TAB_ORDER.slice();

    function applyTabOrder() {
      var nav = document.querySelector('.nav');
      if (!nav) return;
      tabOrder.forEach(function(id) {
        var btn = el('nav-' + id);
        if (btn) nav.appendChild(btn);
      });
    }

    function buildTabOrderList() {
      var box = el('tab-order-list');
      if (!box) return;
      box.innerHTML = '';
      tabOrder.forEach(function(id, idx) {
        var btn = el('nav-' + id);
        var label = btn ? btn.textContent.trim() : id;
        var row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:7px 10px;background:var(--surf2);border:1px solid var(--bdr);border-radius:8px';
        row.innerHTML = '<span style="flex:1;font-size:.82rem">' + esc(label) + '</span>' +
          '<button class="btn-g" style="padding:4px 9px;font-size:.75rem" onclick="moveTab(' + idx + ',-1)" ' + (idx === 0 ? 'disabled' : '') + '>↑</button>' +
          '<button class="btn-g" style="padding:4px 9px;font-size:.75rem" onclick="moveTab(' + idx + ',1)" ' + (idx === tabOrder.length - 1 ? 'disabled' : '') + '>↓</button>';
        box.appendChild(row);
      });
    }

    function moveTab(idx, dir) {
      var newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= tabOrder.length) return;
      var tmp = tabOrder[idx];
      tabOrder[idx] = tabOrder[newIdx];
      tabOrder[newIdx] = tmp;
      lsSet(TAB_ORDER_KEY, JSON.stringify(tabOrder));
      applyTabOrder();
      buildTabOrderList();
    }

    function resetTabOrder() {
      if (!confirm('Reset tab order to default?')) return;
      tabOrder = DEFAULT_TAB_ORDER.slice();
      lsSet(TAB_ORDER_KEY, JSON.stringify(tabOrder));
      applyTabOrder();
      buildTabOrderList();
      toast('Tab order reset.', 'ok');
    }

    function openStudySetModal() {
      toast("Study sets removed.", "inf");
    }

    function renderStudySetList() {}

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

      populateStudyFilter();
      toast('Added ' + added + ' words to "' + s.name + '"', 'ok');
      exitBulk();
    }

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
      if (g('opt-studydir')) g('opt-studydir').value = S.studyDir;
      if (g('opt-studyro')) g('opt-studyro').checked = S.studyRo;
      if (g('opt-offline')) g('opt-offline').checked = S.offlineMode;
      if (g('opt-enfontsize')) g('opt-enfontsize').value = S.enFontSize;
      if (g('opt-khfontsize')) g('opt-khfontsize').value = S.khFontSize;
      if (g('opt-khfont')) g('opt-khfont').value = S.khFont;
      if (g('opt-enfont')) g('opt-enfont').value = S.enFont || "system-ui,-apple-system,'Segoe UI',sans-serif";
      if (g('opt-showro')) g('opt-showro').checked = S.showRo;
      if (g('opt-srs')) g('opt-srs').checked = S.srs !== false;
      if (g('opt-mc')) g('opt-mc').checked = !!S.mc;
      if (g('opt-default-page')) g('opt-default-page').value = S.defaultPage || 'add';
      if (g('col-en')) g('col-en').checked = S.colEn !== false;
      if (g('col-kh')) g('col-kh').checked = S.colKh !== false;
      if (g('col-ro')) g('col-ro').checked = S.colRo !== false;
      if (g('col-no')) g('col-no').checked = S.colNo !== false;
      if (g('col-ca')) g('col-ca').checked = S.colCa !== false;
      if (g('col-dt')) g('col-dt').checked = !!S.colDt;
      if (g('opt-auto-fullscreen')) g('opt-auto-fullscreen').checked = !!S.autoFullscreen;
      studyDir = S.studyDir || 'kh';
      updateStudyMethodDescs();
      buildAccentRow();
      applyAccent(S.accent, true);
      applyEnFontSize(true);
      applyEnFont(true);
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
      if (g('opt-studydir')) S.studyDir = g('opt-studydir').value;
      if (g('opt-studyro')) S.studyRo = g('opt-studyro').checked;
      if (g('opt-offline')) S.offlineMode = g('opt-offline').checked;
      if (g('opt-enfontsize')) S.enFontSize = parseInt(g('opt-enfontsize').value) || 14;
      if (g('opt-khfontsize')) S.khFontSize = parseInt(g('opt-khfontsize').value) || 16;
      if (g('opt-khfont')) S.khFont = g('opt-khfont').value;
      if (g('opt-enfont')) S.enFont = g('opt-enfont').value;
      if (g('opt-showro')) S.showRo = g('opt-showro').checked;
      if (g('opt-srs')) S.srs = g('opt-srs').checked;
      if (g('opt-mc')) S.mc = g('opt-mc').checked;
      if (g('opt-default-page')) S.defaultPage = g('opt-default-page').value || 'add';
      if (g('col-en')) S.colEn = g('col-en').checked;
      if (g('col-kh')) S.colKh = g('col-kh').checked;
      if (g('col-ro')) S.colRo = g('col-ro').checked;
      if (g('col-no')) S.colNo = g('col-no').checked;
      if (g('col-ca')) S.colCa = g('col-ca').checked;
      if (g('col-dt')) S.colDt = g('col-dt').checked;
      if (g('opt-auto-fullscreen')) S.autoFullscreen = g('opt-auto-fullscreen').checked;
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
      var numEl = el('opt-enfontsize-num');
      if (numEl && document.activeElement !== numEl) numEl.value = v;
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
      var numEl = el('opt-khfontsize-num');
      if (numEl && document.activeElement !== numEl) numEl.value = v;
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

    function applyEnFont(silent) {
      var v = (el('opt-enfont') || {}).value || S.enFont || "system-ui,-apple-system,'Segoe UI',sans-serif";
      S.enFont = v;
      document.documentElement.style.setProperty('--en-font', v);
      if (!silent) saveSettings();
    }

    function playClickSound() {
      try {
        var ctx = new(window.AudioContext || window.webkitAudioContext)();
        var buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.06), ctx.sampleRate);
        var d = buf.getChannelData(0);
        for (var i = 0; i < d.length; i++) {
          d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.007));
        }
        var src = ctx.createBufferSource();
        src.buffer = buf;
        var gain = ctx.createGain();
        gain.gain.setValueAtTime(0.22, ctx.currentTime);
        src.connect(gain);
        gain.connect(ctx.destination);
        src.start();
        setTimeout(function() {
          try {
            ctx.close();
          } catch (e2) {}
        }, 400);
      } catch (e) {}
    }

    function skipWriting() {
      if (typeof writeIdx !== 'undefined' && typeof writeDeck !== 'undefined' && writeDeck && writeDeck.length) {
        writeIdx = (writeIdx + 1) % writeDeck.length;
        showWriteCard();
      }
    }

    function skipListening() {
      if (typeof listenIdx !== 'undefined' && typeof listenDeck !== 'undefined' && listenDeck && listenDeck.length) {
        listenIdx = (listenIdx + 1) % listenDeck.length;
        showListenCard();
      }
    }

    function initStudyPage() {
      initStudy();
      startWriting();
      startListening();
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
        purple: '#9333ea',
        blue: '#2f72e8',
        teal: '#0fa89a',
        green: '#18a84e',
        rose: '#c91d28',
        amber: '#d98a08',
        white: '#f0f4f8',
        black: '#000000'
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
      var can = el('cfg-aq-name');
      if (can) can.textContent = MAIN_USER || '—';
      buildCfgUserList(cachedOtherUsers);
      buildTabOrderList();
      updateCfgUsername();
      var urlEl = el('cfg-url');
      var urlStatus = el('cfg-url-status');
      if (urlEl) urlEl.value = SCRIPT_URL || '';
      if (urlStatus) urlStatus.textContent = SCRIPT_URL ? 'Connected' : 'Not connected';
      el('cfg-ovl').classList.add('open');
    }

    function closeCfg() {
      el('cfg-ovl').classList.remove('open');
    }

    function saveCfg() {
      setTimeout(updateSyncBtn, 100);
      var urlEl = el('cfg-url');
      var urlStatus = el('cfg-url-status');
      var url = ((urlEl && urlEl.value) || '').trim();
      if (url) {
        SCRIPT_URL = url;
        lsSet(URL_KEY, url);
        if (urlStatus) urlStatus.textContent = 'Connected';
        toast('URL saved. Syncing…', 'ok');
        loadData();
        loadCategoriesFromSheet();
      } else toast('Enter a valid URL.', 'err');
    }

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
          if (studyDeck.length === 0 && allRows.length > 0) initStudy();
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
      tempGuestCats = [];
      applyUserBadge();
      refreshAllCatDropdowns();
      if (Date.now() - lastWriteTime >= 8000) loadData();
      toast('Back to your account.', 'ok');
    }

    function openAccountQuick() {
      var aqn = el('aq-name');
      if (aqn) aqn.textContent = MAIN_USER || '—';
      el('acct-quick-ovl').classList.add('open');
      buildAccountUserList();
    }
    var cachedOtherUsers = [];

    function buildCfgUserList(names) {
      var box = el('cfg-user-list');
      if (!box) return;
      if (!names || !names.length) {
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
            closeCfg();
          };
          item.appendChild(btn);
        }
        box.appendChild(item);
      });
    }

    function fetchOtherUsersForSettings() {
      var btn = el('cfg-refresh-btn');
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
        buildCfgUserList(list);
        buildAccountUserList(list);
      }).catch(function(err) {
        if (btn) btn.classList.remove('loading');
        toast('Failed: ' + err.message, 'err');
      });
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

    function checkStreakReset() {
      var sd = safeJsonParse(ls(STREAK_KEY), {
        count: 0,
        lastDate: ''
      });
      if (!sd.lastDate || !sd.count) return;
      var _p = function(x) {
        return x < 10 ? '0' + x : String(x);
      };
      var _dn = new Date(Date.now() + 7 * 3600000);
      var _today = _dn.getUTCFullYear() + '-' + _p(_dn.getUTCMonth() + 1) + '-' + _p(_dn.getUTCDate());
      var _yn = new Date(Date.now() + 7 * 3600000 - 86400000);
      var _yest = _yn.getUTCFullYear() + '-' + _p(_yn.getUTCMonth() + 1) + '-' + _p(_yn.getUTCDate());
      if (sd.lastDate !== _today && sd.lastDate !== _yest) {
        sd.count = 0;
        lsSet(STREAK_KEY, JSON.stringify(sd));
      }
    }

    function init() {
      checkStreakReset();
      updateStudyStreak();
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
        if (dp === 'study') initStudyPage();
        if (dp === 'progress') renderProgress();
        if (dp === 'dash') loadDashboard();
        if (S.offlineMode) loadFromCache();
        else if (SCRIPT_URL) {
          loadData();
          loadCategoriesFromSheet();
        } else setStatus('off', 'Not connected');
      }
      var _di = el('dict-input'),
        _dsb = el('dict-search-btn'),
        _dc = el('dict-clear');
      if (_di) _di.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') dictSearch(e.target.value);
      });
      if (_dsb) _dsb.addEventListener('click', function() {
        if (_di) dictSearch(_di.value);
      });
      if (_dc) _dc.addEventListener('click', function() {
        if (_di) {
          _di.value = '';
          _di.focus();
        }
        _dc.style.display = 'none';
      });
      if (_di) _di.addEventListener('input', function() {
        if (_dc) _dc.style.display = this.value ? 'block' : 'none';
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
    var _ssn = el('sset-new-name');
    if (_ssn) _ssn.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') createAndAddSet();
    });
    el('newcat-inp').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') addCustomCat();
    });

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
            // C11: mark session verified once sheet connection is confirmed
            lsSet('kv_verified', '1');
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

    function loadData(force) {
      var user = CURRENT_USER || MAIN_USER;
      if (!force && Date.now() - lastWriteTime < 8000) {
        return;
      }
      if (!SCRIPT_URL || !user) {
        setStatus('off', 'Not connected');
        return;
      }
      if (S.offlineMode) {
        loadFromCache();
        return;
      }
      var sb = el('sync-btn');
      if (sb) {
        sb.classList.add('spin-icon');
        sb.disabled = true;
      }
      setBusy(1);
      setStatus('spin-dot', 'Syncing…');
      fetch(SCRIPT_URL + '?action=getData&user=' + encodeURIComponent(user))
        .then(function(r) {
          return r.json();
        }).then(function(json) {
          setBusy(-1);
          if (sb) {
            sb.classList.remove('spin-icon');
            sb.disabled = false;
          }
          if (!json.success) throw new Error(json.error || 'Error');
          var d = json.data || {};
          allRows = d[user] || mergeAll(d);
          saveCache(allRows);
          setStatus('ok', allRows.length + ' words');
          if (studyDeck.length === 0 && allRows.length > 0) initStudy();
          if (readOnlyMode) {
            tempGuestCats = [];
            allRows.forEach(function(r) {
              var c = r.category;
              if (c && DEFAULT_CATS.indexOf(c) === -1 && customCats.indexOf(c) === -1 && tempGuestCats.indexOf(c) === -1) tempGuestCats.push(c);
            });
            refreshAllCatDropdowns();
          }
          render();
          renderFav();
          renderProgress();
        }).catch(function(err) {
          setBusy(-1);
          if (sb) {
            sb.classList.remove('spin-icon');
            sb.disabled = false;
          }
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
          var k = (r.khmer || '').trim() + '|' + (r.english || '').trim().toLowerCase();
          if (!seen[k]) {
            seen[k] = 1;
            out.push(r);
          }
        });
      });
      return out;
    }

    var queueRunning = false;
    var _queueBatchSaved = 0;
    var _queueWasEmpty = true;

    function processPendingQueue() {
      if (queueRunning || !SCRIPT_URL || !pendingQueue.length || importState.active) return;
      if (_queueWasEmpty) {
        _queueBatchSaved = 0;
        _queueWasEmpty = false;
        if (!saveState.active) {
          saveState.done = 0;
          saveState.total = pendingQueue.length;
          saveState.active = true;
          updateSaveProgress();
        }
      }
      queueRunning = true;
      var item = pendingQueue[0];
      var _dupKey = (item.khmer || '').trim() + '|' + (item.english || '').trim().toLowerCase();
      // FIX: skip the allRows check when in readOnly mode — allRows is the *other user's* words,
      // not MAIN_USER's, so it would incorrectly mark every borrowed word as a duplicate and drop it.
      var _alreadyOnSheet = !readOnlyMode && allRows.some(function(r) {
        return r.id &&
          ((r.khmer || '').trim() + '|' + (r.english || '').trim().toLowerCase()) === _dupKey;
      });
      if (_alreadyOnSheet) {
        pendingQueue.shift();
        savePendingQueue();
        queueRunning = false;
        saveState.done++;
        if (!pendingQueue.length) {
          saveState.active = false;
          var _sec2a = el('imp-bar-section-2');
          if (_sec2a) _sec2a.style.display = 'none';
        } else {
          updateSaveProgress();
        }
        toast('✓ Word already saved — skipped duplicate.', 'inf');
        if (pendingQueue.length) setTimeout(processPendingQueue, 200);
        return;
      }
      setBusy(1);
      updateSaveProgress();
      var url = buildAddUrl(item);
      fetch(url).then(function(r) {
        return r.json();
      }).then(function(j) {
        setBusy(-1);
        if (j.success) {
          lastWriteTime = Date.now();
          pendingQueue.shift();
          savePendingQueue();
          _queueBatchSaved++;
          saveState.done++;
          if (pendingQueue.length > 0) {
            updateSaveProgress();
            queueRunning = false;
            setTimeout(processPendingQueue, 50);
          } else {
            saveState.active = false;
            var _sec2b = el('imp-bar-section-2');
            if (_sec2b) _sec2b.style.display = 'none';
            setStatus('ok', allRows.length + ' words');
            queueRunning = false;
            _queueWasEmpty = true;
            toast('✓ ' + _queueBatchSaved + ' word' + (_queueBatchSaved !== 1 ? 's' : '') + ' saved!', 'ok');
          }
        } else {
          queueRunning = false;
          setTimeout(processPendingQueue, 3000);
        }
      }).catch(function() {
        setBusy(-1);
        queueRunning = false;
        setStatus('err', 'Sync failed');
        setTimeout(processPendingQueue, 5000);
      });
    }

    function buildAddUrl(data) {
      var url = new URL(SCRIPT_URL);
      url.searchParams.set('action', 'addWord');
      // FIX: include dateAdded so queued words land with the user's add-time, not the send-time
      ['english', 'khmer', 'romanization', 'notes', 'category', 'tab', 'user', 'reqId', 'dateAdded'].forEach(function(f) {
        url.searchParams.set(f, data[f] || '');
      });
      return url.toString();
    }

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
          if (r && (r.rowIndex > 0 || r.id)) {
            var url = new URL(SCRIPT_URL);
            url.searchParams.set('action', 'updateWord');
            // FIX: pass id so Apps Script uses ID-based lookup, not stale rowIndex
            ['english', 'khmer', 'romanization', 'notes', 'category', 'rowIndex'].forEach(function(f) {
              url.searchParams.set(f, r[f] || '');
            });
            url.searchParams.set('id', r.id || '');
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
      saveCache(allRows);
      saveFavorites();
      exitBulk();
      render();
      renderFav();
      renderProgress();
      if (SCRIPT_URL) {
        var dq = toDelete.filter(function(r) {
          return !!r.id;
        });
        if (!dq.length) {
          toast(toDelete.length + ' entr' + (toDelete.length === 1 ? 'y' : 'ies') + ' deleted', 'ok');
        } else {
          var _delTotal = dq.length,
            _delDone = 0;
          deleteState = {
            active: true,
            total: _delTotal,
            done: 0
          };
          updateDeleteProgress();

          function runNextDel() {
            if (!dq.length) {
              deleteState.active = false;
              if (!saveState.active) setStatus('ok', allRows.length + ' words');
              toast('✓ ' + _delDone + ' entr' + (_delDone === 1 ? 'y' : 'ies') + ' deleted from sheet', 'ok');
              return;
            }
            var r2 = dq.shift();
            var durl = new URL(SCRIPT_URL);
            durl.searchParams.set('action', 'deleteWord');
            durl.searchParams.set('tab', CURRENT_USER || MAIN_USER);
            durl.searchParams.set('id', r2.id);
            fetch(durl.toString()).catch(function() {}).finally(function() {
              _delDone++;
              deleteState.done = _delDone;
              if (_delDone < _delTotal) {
                updateDeleteProgress();
                setTimeout(runNextDel, 300);
              } else {
                runNextDel();
              }
            });
          }
          runNextDel();
        }
      } else {
        toast(toDelete.length + ' entr' + (toDelete.length === 1 ? 'y' : 'ies') + ' deleted', 'ok');
      }
    }

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
        (function(row, khTd) {
          spkBtn.onclick = function(e) {
            e.stopPropagation();
            if (blurMode === 'kh') {
              if (khTd.classList.contains('peeked')) {
                speakKhmer(row.khmer || '');
              } else {
                khTd.classList.add('peeked');
              }
              return;
            }
            speakKhmer(row.khmer || '');
          };
        })(r, tkh);
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
            if (blurMode === 'kh') {
              var _favTd = e.currentTarget ? e.currentTarget.closest('td') : null;
              if (_favTd && _favTd.classList.contains('peeked')) {
                speakKhmer(row.khmer || '');
              } else if (_favTd) {
                _favTd.classList.add('peeked');
              }
              return;
            }
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

    function addRowHandlers(tr, row) {
      var timer = null,
        didLong = false;

      function onStart() {
        didLong = false;
        timer = setTimeout(function() {
          didLong = true;
          /* prevent text selection on long press */
          if (window.getSelection) window.getSelection().removeAllRanges();
          document.body.style.webkitUserSelect = 'none';
          document.body.style.userSelect = 'none';
          setTimeout(function() {
            document.body.style.webkitUserSelect = '';
            document.body.style.userSelect = '';
          }, 400);
          document.addEventListener('touchend', function _preventLongTouchEnd(ev) {
            ev.preventDefault();
            document.removeEventListener('touchend', _preventLongTouchEnd, true);
          }, {
            capture: true,
            once: true
          });
          openEditSheet(row);
          /* blur any auto-focused input that the sheet may have opened */
          setTimeout(function() {
            var a = document.activeElement;
            if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT')) a.blur();
          }, 60);
        }, 520);
      }

      function onCancel() {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      }
      tr.addEventListener('touchstart', function(e) {
        onStart();
      }, {
        passive: false
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
      // FIX: catch unsynced words (rowIndex=0) before sending — they have no sheet row yet
      if (!editRow.rowIndex && !editRow.id) {
        toast('Word not yet synced to sheet — wait a moment then try again.', 'inf');
        return;
      }
      var en = (el('e-en').value || '').trim(),
        kh = (el('e-kh').value || '').trim();
      var ro = (el('e-ro').value || '').trim(),
        no = (el('e-no').value || '').trim(),
        cat = (el('e-cat') || {}).value || 'Words';
      editRow.english = en;
      editRow.khmer = kh;
      editRow.romanization = ro;
      editRow.notes = no;
      editRow.category = cat;
      // Capture id/tab before closeSheet() nulls editRow
      var _queueItem = {
        id: editRow.id || '',
        rowIndex: editRow.rowIndex || '',
        english: en,
        khmer: kh,
        romanization: ro,
        notes: no,
        category: cat,
        tab: CURRENT_USER || MAIN_USER,
        user: CURRENT_USER || MAIN_USER
      };
      // C1: background-save — commit locally & close immediately (mirrors delete/send-all UX)
      saveCache(allRows);
      render();
      renderFav();
      closeSheet();
      // editRow is now null — use _queueItem
      setStatus('imp', '1 edit saving\u2026');
      setBusy(1);
      _editQueue.push(_queueItem);
      _editBatchTotal++;
      processEditQueue();
    }

    var _editQueue = [];
    var _editQueueRunning = false;
    var _editBatchTotal = 0;

    function processEditQueue() {
      if (_editQueueRunning || !_editQueue.length || !SCRIPT_URL) return;
      _editQueueRunning = true;
      var rem = _editQueue.length;
      if (rem > 1) setStatus('imp', rem + ' edits saving\u2026');
      var item = _editQueue[0];
      var url = new URL(SCRIPT_URL);
      url.searchParams.set('action', 'updateWord');
      ['english', 'khmer', 'romanization', 'notes', 'category', 'rowIndex'].forEach(function(f) {
        url.searchParams.set(f, item[f] || '');
      });
      url.searchParams.set('id', item.id || '');
      url.searchParams.set('tab', item.tab || '');
      url.searchParams.set('user', item.user || '');
      fetch(url.toString()).then(function(r) {
        return r.json();
      }).then(function(j) {
        setBusy(-1);
        _editQueueRunning = false;
        if (!j.success) throw new Error(j.error || 'Error');
        _editQueue.shift();
        if (_editQueue.length > 0) {
          setTimeout(processEditQueue, 50);
        } else {
          setStatus('ok', allRows.length + ' words');
          toast('✓ ' + _editBatchTotal + ' edit' + (_editBatchTotal !== 1 ? 's' : '') + ' saved!', 'ok');
          _editBatchTotal = 0;
        }
      }).catch(function(err) {
        setBusy(-1);
        _editQueueRunning = false;
        setStatus('err', 'Edit save failed');
        toast('Edit failed — retrying in 5s…', 'err');
        setTimeout(processEditQueue, 5000);
      });
    }

    function setAddLoading(v) {
      var btn = el('add-btn'),
        lbl = el('add-lbl'),
        sp = el('add-spin');
      if (btn) btn.disabled = v;
      if (lbl) lbl.style.display = v ? 'none' : '';
      if (sp) sp.style.display = v ? '' : 'none';
    }

    function setEditLoading(v) {
      var btn = el('edit-btn'),
        lbl = el('edit-lbl'),
        sp = el('edit-spin');
      if (btn) btn.disabled = v;
      if (lbl) lbl.textContent = v ? 'Saving\u2026' : '\uD83D\uDCBE Save to Sheet';
      if (sp) sp.style.display = 'none';
    }

    function deleteEntry() {
      if (!editRow || readOnlyMode) return;
      if (!confirm('Delete this entry?')) return;
      var rowToDelete = editRow;
      var k = wordKey(rowToDelete);
      allRows = allRows.filter(function(r) {
        return wordKey(r) !== k;
      });
      favorites.delete(k);
      saveFavorites();
      saveCache(allRows);
      render();
      renderFav();
      renderProgress();
      closeSheet();
      if (SCRIPT_URL && rowToDelete.id) {
        if (deleteState.active) {
          deleteState.total++;
        } else {
          deleteState = {
            active: true,
            total: 1,
            done: 0
          };
        }
        updateDeleteProgress();
        var url = new URL(SCRIPT_URL);
        url.searchParams.set('action', 'deleteWord');
        url.searchParams.set('tab', CURRENT_USER || MAIN_USER);
        url.searchParams.set('id', rowToDelete.id);
        fetch(url.toString()).catch(function() {}).finally(function() {
          deleteState.done++;
          if (deleteState.done >= deleteState.total) {
            deleteState.active = false;
            if (!saveState.active) setStatus('ok', allRows.length + ' words');
          } else {
            updateDeleteProgress();
          }
          toast('Deleted.', 'ok');
        });
      } else {
        setStatus('ok', allRows.length + ' words');
        toast('Deleted.', 'ok');
      }
    }

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
      // FIX: do NOT check alreadyLocal against allRows here — in readOnly mode allRows is the
      // *other user's* words, so every word in their sheet would appear to "already exist locally"
      // and the borrow would always be silently blocked. The queue's own duplicate check and the
      // server-side reqId idempotency are sufficient guards.
      var item = {
        english: en,
        khmer: kh,
        romanization: editRow.romanization || '',
        notes: editRow.notes || '',
        category: editRow.category || 'Words',
        tab: MAIN_USER,
        user: MAIN_USER,
        reqId: 'R' + Date.now() + '_' + Math.floor(Math.random() * 99999),
        dateAdded: nowKH()
      };
      pendingQueue.push(item);
      savePendingQueue();
      triggerSaveState();
      var bc = (parseInt(ls(BURGLAR_KEY) || '0')) + 1;
      lsSet(BURGLAR_KEY, String(bc));
      checkAndUnlock('burglar');
      toast('Added "' + esc(en || kh) + '" to your sheet queue!', 'ok');
      closeSheet();
      processPendingQueue();
    }

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
      setAddLoading(true);
      var en = (el('f-en').value || '').trim(),
        kh = (el('f-kh').value || '').trim();
      if (!SCRIPT_URL) {
        toast('Connect your sheet in ⚙️ first.', 'err');
        setAddLoading(false);
        return;
      }
      var alreadyQueued = pendingQueue.some(function(q) {
        return q.english === en && q.khmer === kh;
      });
      if (alreadyQueued) {
        toast('Already queued — will sync shortly!', 'inf');
        setAddLoading(false);
        return;
      }
      var alreadyLocal = allRows.some(function(r) {
        var enMatch = en ? (r.english || '').trim().toLowerCase() === en.toLowerCase() : true;
        var khMatch = kh ? (r.khmer || '').trim() === kh : true;
        return (en && kh) ? (enMatch && khMatch) : (en ? enMatch : khMatch);
      });
      if (alreadyLocal) {
        toast('This word is already in your list!', 'inf');
        setAddLoading(false);
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
        user: CURRENT_USER || MAIN_USER,
        reqId: 'R' + Date.now() + '_' + Math.floor(Math.random() * 99999),
        dateAdded: nowKH() // FIX: capture add-time now so it's preserved through the queue
      };
      allRows.unshift(Object.assign({}, item, {
        rowIndex: 0
      }));
      saveCache(allRows);
      el('add-form').reset();
      populateCatDropdown('f-cat', false, 'Words');
      var notice = el('add-notice');
      if (notice) {
        notice.textContent = '✓ Word queued — safe to add another!';
        notice.style.display = 'block';
        clearTimeout(window._noticeTimer);
        window._noticeTimer = setTimeout(function() {
          notice.style.display = 'none';
        }, 4000);
      }
      render();
      renderFav();
      renderProgress();
      setAddLoading(false);
      trackWeeklyAdd();
      checkAndUnlock('broad_learner');
      checkAndUnlock('organiser');
      checkAndUnlock('word_hoarder');
      submitLock = true;
      if (submitLockTimer) clearTimeout(submitLockTimer);
      submitLockTimer = setTimeout(function() {
        submitLock = false;
      }, 800);
      pendingQueue.push(item);
      savePendingQueue();
      triggerSaveState();
      processPendingQueue();
    }

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

    var studyDeck = [],
      studyIdx = 0,
      pendingMcRating = null,
      cardFlipped = false,
      sessionK = 0,
      sessionM = 0,
      sessionU = 0;

    function toggleStudyDir() {
      studyDir = (studyDir === 'kh' ? 'en' : 'kh');
      S.studyDir = studyDir;
      lsSet(SKEY, JSON.stringify(S));
      updateDirBtn();
      showCard();
    }

    function updateStudyMethodDescs() {}

    function updateDirBtn() {
      var btn = el('study-dir-btn');
      if (btn) btn.textContent = studyDir === 'kh' ? 'Khmer → English' : 'English → Khmer';
    }

    var _dictAddItems = [];
    var _confStudyLevel = null;
    var _confStudyPool = [];

    function buildMcChoices(correct, pool, dir) {
      var wrong = pool.filter(function(x) {
          return x !== correct;
        })
        .sort(function() {
          return Math.random() - .5;
        }).slice(0, 3);
      if (wrong.length < 3) {
        var extra = allRows.filter(function(x) {
          return x !== correct && pool.indexOf(x) === -1;
        }).sort(function() {
          return Math.random() - .5;
        });
        wrong = wrong.concat(extra).slice(0, 3);
      }
      var choices = wrong.concat([correct]).sort(function() {
        return Math.random() - .5;
      });
      var html = '<div class="mc-choices" onclick="event.stopPropagation()">';
      choices.forEach(function(c) {
        var txt = dir === 'kh' ? (c.english || '?') : (c.khmer || '?');
        var isCorr = c === correct;
        html += '<button class="mc-btn" data-corr="' + (isCorr ? '1' : '0') + '" onclick="mcSelect(this)">' + esc(txt) + '</button>';
      });
      html += '</div>';
      return html;
    }

    function mcSelect(btn) {
      if (cardFlipped) return;
      cardFlipped = true;
      var isCorr = btn.dataset.corr === '1';
      document.querySelectorAll('.mc-btn').forEach(function(b) {
        b.disabled = true;
        if (b.dataset.corr === '1') b.classList.add('mc-ok');
        else if (b === btn && !isCorr) b.classList.add('mc-bad');
      });
      pendingMcRating = isCorr ? 2 : 0;
    }

    function addFromTranslation(en, kh) {
      goPage('add', 'nav-add');
      var fe = el('f-en');
      if (fe) fe.value = en || '';
      var fk = el('f-kh');
      if (fk) fk.value = kh || '';
      toast('Word pre-filled — review and send! ✓', 'ok');
    }

    async function exportAllData() {
      var EXPORT_KEYS = [
        SKEY, FAV_KEY, CONF_KEY, SRS_KEY, CATS_KEY, CAT_ORDER_KEY,
        SETS_KEY, ACHV_KEY, STREAK_KEY, COMEBACK_KEY, WEEKLY_ADD_KEY,
        BURGLAR_KEY, EXPLORER_KEY, THEME_KEY, TAB_ORDER_KEY, COL_WIDTHS_KEY,
        DELETED_CATS_KEY, BEST_STREAK_KEY, 'kv_reset_btn'
      ];
      var data = {
        _version: 1,
        _exportedAt: nowKH(),
        _user: MAIN_USER
      };
      EXPORT_KEYS.forEach(function(k) {
        var v = ls(k);
        if (v !== null && v !== undefined && v !== '') data[k] = v;
      });
      var json = JSON.stringify(data, null, 2);
      var filename = 'khmer-vocab-backup-' + todayKH() + '.json';
      if ('showSaveFilePicker' in window) {
        try {
          var handle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: 'JSON Backup',
              accept: {
                'application/json': ['.json']
              }
            }]
          });
          var w = await handle.createWritable();
          await w.write(json);
          await w.close();
          toast('Backup saved ✓ (words stay on your sheet)', 'ok');
          return;
        } catch (e) {
          if (e.name === 'AbortError') return;
        }
      }
      var blob = new Blob([json], {
        type: 'application/json;charset=utf-8'
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
      toast('Backup downloaded ✓ (words stay on your sheet)', 'ok');
    }

    function importAllData() {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) {
          try {
            var data = JSON.parse(ev.target.result);
            var count = 0;
            var SAFE_KEYS = [SKEY, FAV_KEY, CONF_KEY, SRS_KEY, CATS_KEY, CAT_ORDER_KEY,
              SETS_KEY, ACHV_KEY, STREAK_KEY, COMEBACK_KEY, WEEKLY_ADD_KEY,
              BURGLAR_KEY, EXPLORER_KEY, THEME_KEY, TAB_ORDER_KEY, COL_WIDTHS_KEY,
              DELETED_CATS_KEY, BEST_STREAK_KEY, 'kv_reset_btn'
            ];
            Object.keys(data).forEach(function(k) {
              if (k[0] === '_') return;
              if (SAFE_KEYS.indexOf(k) === -1) return;
              try {
                localStorage.setItem(k, data[k]);
                count++;
              } catch (e2) {}
            });
            toast('Imported ' + count + ' items — reload to apply ✓', 'ok');
          } catch (e) {
            toast('Could not read file — is it a valid JSON backup?', 'err');
          }
        };
        reader.readAsText(file);
      };
      input.click();
    }

    function initStudy() {
      populateStudyFilter();
      populateStudyPresetFilter();
      updateDirBtn();
      var userFilter = (el('study-filter') || {}).value || 'All',
        presetFilter = (el('study-preset-filter') || {}).value || 'none',
        filter = (presetFilter !== 'none') ? presetFilter : userFilter,
        confFilter = (el('study-conf-filter') || {}).value || 'all',
        len = parseInt((el('study-len') || {}).value) || 20;
      var userSel = el('study-filter'),
        presetSel = el('study-preset-filter');
      if (userSel && presetSel) {
        var presetActive = presetFilter !== 'none';
        userSel.classList.toggle('active-sel', !presetActive);
        presetSel.classList.toggle('active-sel', presetActive);
      }
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
      } else if (filter === '__cons__') {
        var _cons = window._refCons || [];
        pool = _cons.map(function(c) {
          return {
            english: c.ro,
            khmer: c.kh,
            romanization: c.ro,
            notes: 'Series ' + (c.s || ''),
            category: 'Consonants',
            id: 'ref_' + c.kh
          };
        });
      } else if (filter === '__depvow__') {
        var _dvs = window._refDepVow || [];
        pool = _dvs.map(function(v) {
          return {
            english: (v.s1 || '') + ' / ' + (v.s2 || ''),
            khmer: v.kh,
            romanization: v.s1 || '',
            notes: v.ex || '',
            category: 'Dep. Vowels',
            id: 'ref_' + v.kh
          };
        });
      } else if (filter === '__indvow__') {
        var _ivs = window._refIndVow || [];
        pool = _ivs.map(function(v) {
          return {
            english: v.ro,
            khmer: v.kh,
            romanization: v.ro,
            notes: '',
            category: 'Ind. Vowels',
            id: 'ref_' + v.kh
          };
        });
      } else if (filter === '__nums__') {
        var _nums = window._refNums || [];
        pool = _nums.map(function(n) {
          return {
            english: String(n.n),
            khmer: n.kh,
            romanization: String(n.n),
            notes: n.word ? ('Word: ' + n.word) : '',
            category: 'Numbers',
            id: 'ref_' + n.n
          };
        });
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
      // Apply confidence filter from second dropdown
      if (confFilter === 'got') pool = pool.filter(function(r) {
        return confidence[wordKey(r)] === 2;
      });
      else if (confFilter === 'kinda') pool = pool.filter(function(r) {
        return confidence[wordKey(r)] === 1;
      });
      else if (confFilter === 'unknown') pool = pool.filter(function(r) {
        return confidence[wordKey(r)] === 0;
      });
      else if (confFilter === 'unstudied') pool = pool.filter(function(r) {
        return confidence[wordKey(r)] === undefined;
      });
      else if (confFilter === 'weak') pool = pool.filter(function(r) {
        var c = confidence[wordKey(r)];
        return c === 0 || c === undefined;
      });
      studyDeck = pool.slice(0, len);
      studyIdx = 0;
      cardFlipped = false;
      pendingMcRating = null;
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
      if (studyDir === 'kh') {
        html += srsBadge + '<div class="fc-kh kh">' + esc(r.khmer || '?') + '</div>';
        html += S.mc ? buildMcChoices(r, studyDeck, 'kh') : '<div class="fc-hint">Tap to reveal English</div>';
      } else {
        html += srsBadge + '<div class="fc-en">' + esc(r.english || '?') + '</div>';
        html += S.mc ? buildMcChoices(r, studyDeck, 'en') : '<div class="fc-hint">Tap to reveal Khmer</div>';
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
      if (S.mc) return;
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
      var prevConf = confidence[k];
      confidence[k] = rating;
      lsSet(CONF_KEY, JSON.stringify(confidence));
      if (S.srs) updateSrs(k, rating);
      if (rating === 2 && prevConf === 0) {
        var cc = (parseInt(ls(COMEBACK_KEY) || '0')) + 1;
        lsSet(COMEBACK_KEY, String(cc));
        checkAndUnlock('comeback');
      }
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
      if (pendingMcRating !== null) {
        var _r = pendingMcRating;
        pendingMcRating = null;
        rateCard(_r);
        return;
      }
      if (studyIdx < studyDeck.length - 1) {
        studyIdx++;
        showCard();
      } else showSessionSummary();
    }

    function studyWeak() {
      var rb = (parseInt(ls('kv_reset_btn') || '0')) + 1;
      lsSet('kv_reset_btn', String(rb));
      checkAndUnlock('reset_button');
      if (el('study-filter')) el('study-filter').value = 'All';
      if (el('study-preset-filter')) el('study-preset-filter').value = '__weak__';
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
      if (readOnlyMode && (sessionK + sessionM + sessionU) >= 20) {
        var ec = (parseInt(ls(EXPLORER_KEY) || '0')) + 1;
        lsSet(EXPLORER_KEY, String(ec));
        checkAndUnlock('explorer');
      }
    }

    function updateStudyStreak() {
      function khDate(offsetDays) {
        var d = new Date(Date.now() + 7 * 3600000 + (offsetDays || 0) * 86400000);
        var p = function(x) {
          return x < 10 ? '0' + x : String(x);
        };
        return d.getUTCFullYear() + '-' + p(d.getUTCMonth() + 1) + '-' + p(d.getUTCDate());
      }
      var today = khDate(0);
      var sd = safeJsonParse(ls(STREAK_KEY), {
        count: 0,
        lastDate: ''
      });
      if (sd.lastDate === today) return;
      var yesterday = khDate(-1);
      sd.count = (sd.lastDate === yesterday) ? (sd.count || 0) + 1 : 1;
      sd.lastDate = today;
      lsSet(STREAK_KEY, JSON.stringify(sd));
      var curBest = parseInt(ls(BEST_STREAK_KEY) || '0', 10);
      if (sd.count > curBest) lsSet(BEST_STREAK_KEY, String(sd.count));
      checkAndUnlock('daily_habit');
    }

    var STATS_SAVED_DATE_KEY = 'kv_stats_saved_date';

    function renderProgress() {
      var pgNote = el('pg-stats-note');
      if (pgNote) {
        if (readOnlyMode) {
          pgNote.textContent = 'Viewing ' + CURRENT_USER + '\'s stats — last saved to sheet';
          pgNote.style.display = 'block';
          loadUserStatsFromSheet(CURRENT_USER);
        } else {
          pgNote.style.display = 'none';
        }
      }
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
      sv('pg-fav', readOnlyMode ? '——' : favCount);
      sv('pg-mastered', readOnlyMode ? '——' : mastered);
      sv('pg-due', readOnlyMode ? '——' : countDue());
      sv('pg-studied', readOnlyMode ? '——' : studiedCount);
      var streakData = safeJsonParse(ls(STREAK_KEY), {
        count: 0,
        lastDate: ''
      });
      sv('pg-streak', readOnlyMode ? '——' : (streakData.count || 0));
      var _storedBest = parseInt(ls(BEST_STREAK_KEY) || '0', 10);
      var _currentStreak = readOnlyMode ? 0 : (streakData.count || 0);
      if (!readOnlyMode && _currentStreak > _storedBest) {
        _storedBest = _currentStreak;
        lsSet(BEST_STREAK_KEY, String(_storedBest));
      }
      sv('pg-best-streak', readOnlyMode ? '——' : _storedBest);
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
      sv('pg-knew', readOnlyMode ? '——' : knew);
      sv('pg-kinda', readOnlyMode ? '——' : kinda);
      sv('pg-unkn', readOnlyMode ? '——' : unkn);
      sv('pg-unstudied', readOnlyMode ? '——' : unstudied);

      function buildShelf(sid, count, milestones) {
        var shelf = el(sid);
        if (!shelf) return;
        shelf.innerHTML = '';
        var firstLocked = null;
        milestones.forEach(function(m) {
          var card = document.createElement('div');
          var unlocked = count >= m.n;
          card.className = 'ms-card' + (unlocked ? ' unlocked' : '');
          card.innerHTML = '<div class="ms-icon">' + m.icon + '</div><div class="ms-name">' + m.name + '</div><div class="ms-req">' + (unlocked ? '✓' : m.n + ' words') + '</div>';
          shelf.appendChild(card);
          if (!unlocked && !firstLocked) firstLocked = card;
        });
        if (firstLocked) {
          setTimeout(function() {
            var cardWidth = firstLocked.offsetWidth || 64;
            var gap = 6;
            var shelfWidth = shelf.clientWidth;
            var cardLeft = firstLocked.offsetLeft;
            shelf.scrollLeft = Math.max(0, cardLeft + cardWidth - shelfWidth + gap);
          }, 50);
        }
      }
      renderAchvShelf();
      buildShelf('milestone-shelf-add', total, MILESTONES_ADD);
      buildShelf('milestone-shelf-study', studiedCount, MILESTONES_STUDY);
      buildShelf('milestone-shelf-master', mastered, MILESTONES_MASTER);
      var streakSnap = safeJsonParse(ls(STREAK_KEY), {
        count: 0
      });
      buildShelf('milestone-shelf-streak', streakSnap.count || 0, MILESTONES_STREAK);
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
        // C8: anchor all date math to Cambodia time (UTC+7) so heatmap matches sheet dates
        var _hmOff = 7 * 3600000;
        var today = new Date(Date.now() + _hmOff),
          dc = {};
        allRows.forEach(function(r) {
          if (r.dateAdded) {
            var d = String(r.dateAdded).slice(0, 10);
            dc[d] = (dc[d] || 0) + 1;
          }
        });
        for (var i = 27; i >= 0; i--) {
          var d2 = new Date(Date.now() + _hmOff);
          d2.setUTCDate(d2.getUTCDate() - i);
          var key = (function(dt) {
              var p = function(x) {
                return x < 10 ? '0' + x : String(x);
              };
              return dt.getUTCFullYear() + '-' + p(dt.getUTCMonth() + 1) + '-' + p(dt.getUTCDate());
            })(d2),
            cnt = dc[key] || 0,
            cell = document.createElement('div');
          cell.className = 'hm-cell' + (cnt === 0 ? '' : cnt < 3 ? ' hm1' : cnt < 7 ? ' hm2' : ' hm3');
          cell.title = key + ': ' + cnt + ' words';
          hm.appendChild(cell);
        }
      }
      if (!readOnlyMode) saveUserStatsToSheet();
    }

    function saveUserStatsToSheet() {
      if (!SCRIPT_URL || !MAIN_USER) return;
      var _p = function(x) {
        return x < 10 ? '0' + x : String(x);
      };
      var _dn = new Date(Date.now() + 7 * 3600000);
      var _today = _dn.getUTCFullYear() + '-' + _p(_dn.getUTCMonth() + 1) + '-' + _p(_dn.getUTCDate());
      if (ls(STATS_SAVED_DATE_KEY) === _today) return;
      lsSet(STATS_SAVED_DATE_KEY, _today);
      var total = allRows.length;
      var mastered = 0,
        studied = 0,
        knew = 0,
        kinda = 0,
        unkn = 0;
      allRows.forEach(function(r) {
        var c = confidence[wordKey(r)];
        if (c === 2) {
          mastered++;
          knew++;
          studied++;
        } else if (c === 1) {
          kinda++;
          studied++;
        } else if (c === 0) {
          unkn++;
          studied++;
        }
      });
      var streakSnap = safeJsonParse(ls(STREAK_KEY), {
        count: 0
      });
      var unlockedIds = ACHIEVEMENTS.filter(function(a) {
        return achievements[a.id] && achievements[a.id].unlocked;
      }).map(function(a) {
        return a.id;
      });
      var stats = {
        streak: streakSnap.count || 0,
        bestStreak: Math.max(parseInt(ls(BEST_STREAK_KEY) || '0', 10), streakSnap.count || 0),
        totalWords: total,
        mastered: mastered,
        studied: studied,
        knew: knew,
        kinda: kinda,
        unkn: unkn,
        favCount: favorites.size,
        achievements: unlockedIds
      };
      var url = SCRIPT_URL + '?action=saveUserStats&user=' + encodeURIComponent(MAIN_USER) + '&stats=' + encodeURIComponent(JSON.stringify(stats));
      fetch(url).catch(function() {});
    }

    function loadUserStatsFromSheet(userName) {
      if (!SCRIPT_URL || !userName) return;
      fetch(SCRIPT_URL + '?action=getUserStats&user=' + encodeURIComponent(userName))
        .then(function(r) {
          return r.json();
        })
        .then(function(j) {
          if (!j.success || !j.stats) return;
          var s = j.stats;

          function sv2(id, v) {
            var e = el(id);
            if (e && v !== undefined && v !== null) e.textContent = v;
          }
          if (s.favCount !== undefined) sv2('pg-fav', s.favCount);
          if (s.mastered !== undefined) sv2('pg-mastered', s.mastered);
          if (s.studied !== undefined) sv2('pg-studied', s.studied);
          if (s.streak !== undefined) sv2('pg-streak', s.streak);
          if (s.bestStreak !== undefined) sv2('pg-best-streak', s.bestStreak);
          if (s.knew !== undefined) sv2('pg-knew', s.knew);
          if (s.kinda !== undefined) sv2('pg-kinda', s.kinda);
          if (s.unkn !== undefined) sv2('pg-unkn', s.unkn);
          if (Array.isArray(s.achievements)) renderAchvShelfForUser(s.achievements);
          if (s.savedAt) {
            var note = el('pg-stats-note');
            if (note) note.textContent = 'Viewing ' + userName + '\'s stats — last saved ' + s.savedAt + ' (Cambodia time)';
          }
        }).catch(function() {});
    }

    function renderAchvShelfForUser(unlockedIds) {
      var shelf = el('achv-shelf');
      if (!shelf) return;
      shelf.innerHTML = '';
      ACHIEVEMENTS.forEach(function(a) {
        var unlocked = unlockedIds.indexOf(a.id) !== -1;
        var card = document.createElement('div');
        card.className = 'ms-card achv-card' + (unlocked ? ' unlocked' : '');
        card.innerHTML = '<div class="ms-icon">' + a.icon + '</div>' +
          '<div class="ms-name">' + (a.secret && !unlocked ? '???' : esc(a.name)) + '</div>' +
          '<div class="ms-req">' + (unlocked ? '✓' : '🔒') + '</div>';
        shelf.appendChild(card);
      });
    }

    var _dashLoadInFlight = false;

    function loadDashboard() {
      if (!SCRIPT_URL) {
        el('dash-loading').style.display = 'none';
        el('dash-content').style.display = 'none';
        el('dash-error').style.display = 'block';
        el('dash-error-msg').textContent = 'Connect your sheet in ⚙️ first.';
        return;
      }
      // C10: ignore duplicate/overlapping loads (e.g. double-tapping the Dash tab) so the
      // Top Streak card can't be raced between two in-flight refreshes.
      if (_dashLoadInFlight) return;
      _dashLoadInFlight = true;
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
      }).finally(function() {
        _dashLoadInFlight = false;
      });
    }

    function renderDashboard(stats, awData) {
      var cards = el('dash-stat-cards');
      if (cards) {
        // C2: compute top adder this week from full word list (Cambodia UTC+7)
        var _recentRows = (awData && awData.data && awData.data['📋 All Words']) || [];
        var _khNow = Date.now() + 7 * 3600000;
        var _weekMs = 7 * 86400000;
        var _wc = {};
        _recentRows.forEach(function(r) {
          if (!r.dateAdded || !r.addedBy) return;
          var _rd = new Date(r.dateAdded).getTime();
          if (!isNaN(_rd) && (_khNow - _rd) < _weekMs) _wc[r.addedBy] = (_wc[r.addedBy] || 0) + 1;
        });
        var _topAdder = '',
          _topAdderCnt = 0;
        Object.keys(_wc).forEach(function(u) {
          if (_wc[u] > _topAdderCnt) {
            _topAdderCnt = _wc[u];
            _topAdder = u;
          }
        });
        // Shared leadercard template: name line 1 (ellipsis), "(N unit)" line 2 — both cards use identical markup
        function _mkCard(name, count, unit) {
          return '<span style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.88em;max-width:100%">' + esc(name) + '</span>' +
            '<span style="display:block;font-size:.72em;opacity:.65">(' + count + ' ' + unit + ')</span>';
        }
        var _topAdderVal = _topAdder ? _mkCard(_topAdder, _topAdderCnt, 'words') : ((stats.wordsThisWeek || 0) + ' words this week');
        // C4: streak card uses same _mkCard template as Top Adder — name line 1, "(N days)" line 2
        var _streakVal = stats.topStreakUser ? _mkCard(stats.topStreakUser, stats.topStreakCount || 0, 'days') : '—';
        cards.innerHTML = [
          ['Total Words', stats.totalWords || 0],
          ['Total Users', stats.userCount || 0],
          ['Top Adder This Week 📅', _topAdderVal],
          ['Top current streak 🔥', _streakVal]
        ].map(function(d) {
          return '<div class="stat-card"><div class="sc-val">' + d[1] + '</div><div class="sc-lbl">' + d[0] + '</div></div>';
        }).join('');
      }
      var usersEl = el('dash-users');
      if (usersEl) {
        usersEl.innerHTML = '';
        // Sort by word count descending, but always pin MAIN_USER (Porter Olsen) at the top
        var users = (stats.users || []).slice().sort(function(a, b) {
          if (a.name === MAIN_USER && b.name !== MAIN_USER) return -1;
          if (b.name === MAIN_USER && a.name !== MAIN_USER) return 1;
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
          if (u.name !== MAIN_USER) {
            row.style.cursor = 'pointer';
            row.title = 'View ' + u.name + '\u2019s sheet';
            row.onclick = function() {
              viewAsUser(u.name);
              goPage('progress', 'nav-progress');
              renderProgress();
            };
          }
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
        } else recentRows.slice(0, 20).forEach(function(r) {
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
                  user: MAIN_USER,
                  reqId: 'R' + Date.now() + '_' + Math.floor(Math.random() * 99999), // FIX: add reqId for idempotency on retry
                  dateAdded: nowKH() // FIX: capture add-time at click
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
                triggerSaveState();
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
          kh: '◌ា',
          s1: 'aa',
          s2: 'ie',
          ex: '"aa" like sp*a* / "ie" like p*ie*r'
        },
        {
          kh: '◌ិ',
          s1: 'e',
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
        word: 'សូន្យ',
        n: '0'
      }, {
        kh: '១',
        word: 'មួយ',
        n: '1'
      }, {
        kh: '២',
        word: 'ពីរ',
        n: '2'
      }, {
        kh: '៣',
        word: 'បី',
        n: '3'
      }, {
        kh: '៤',
        word: 'បួន',
        n: '4'
      }, {
        kh: '៥',
        word: 'ប្រាំ',
        n: '5'
      }, {
        kh: '៦',
        word: 'ប្រាំមួយ',
        n: '6'
      }, {
        kh: '៧',
        word: 'ប្រាំពីរ',
        n: '7'
      }, {
        kh: '៨',
        word: 'ប្រាំបី',
        n: '8'
      }, {
        kh: '៩',
        word: 'ប្រាំបួន',
        n: '9'
      }, {
        kh: '១០',
        word: 'ដប័',
        n: '10'
      }, {
        kh: '២០',
        word: 'ម្ភែ',
        n: '20'
      }, {
        kh: '៣០',
        word: 'សាមសិប',
        n: '30'
      }, {
        kh: '៤០',
        word: 'សែសិប',
        n: '40'
      }, {
        kh: '៥០',
        word: 'ហាសិប',
        n: '50'
      }, {
        kh: '៦០',
        word: 'ហុកសិប',
        n: '60'
      }, {
        kh: '៧០',
        word: 'ចិតសិប',
        n: '70'
      }, {
        kh: '៨០',
        word: 'ប័ែតសិប',
        n: '80'
      }, {
        kh: '៩០',
        word: 'កែសិប',
        n: '90'
      }, {
        kh: '១០០',
        word: 'មួយរយ',
        n: '100'
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
          (function(kh) {
            card.addEventListener('click', function() {
              speakKhmer(kh);
            });
          })(c.kh);
          card.title = 'Tap to hear';
          g.appendChild(card);
        });
      }
      window._refCons = allCons;
      window._refDepVow = depVow;
      window._refIndVow = indVow;
      window._refNums = nums;
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
          (function(kh) {
            card.addEventListener('click', function() {
              speakKhmer(kh);
            });
          })(v.kh);
          card.title = 'Tap to hear';
          ivg.appendChild(card);
        });
      }
      var ng = el('ref-numbers');
      if (ng) {
        ng.innerHTML = '';
        nums.forEach(function(n) {
          var card = document.createElement('div');
          card.className = 'ref-card';
          card.innerHTML = '<div class="ref-kh kh">' + n.kh + '</div>' + (n.word ? '<div class="ref-word kh">' + n.word + '</div>' : '') + '<div class="ref-ro">' + n.n + '</div>';
          (function(kh) {
            card.addEventListener('click', function() {
              speakKhmer(kh);
            });
          })(n.kh);
          card.title = 'Tap to hear';
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
      var url = 'https://lingva.garudalinux.org/api/v1/' + from + '/' + to + '/' + encodeURIComponent(word);
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
      var resp = await fetch('https://libretranslate.de/translate', {
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
      if (ok === 0) throw new Error('All 5 APIs failed. Check your internet connection.');
    }

    function dictRenderLoading() {
      el('dict-content').innerHTML = '<div class="trans-loading"><div class="trans-spinner"></div><p>Querying 5 translation APIs simultaneously…</p></div>';
    }

    function dictRenderError(msg) {
      el('dict-content').innerHTML = '<div class="trans-error-box"><h3>⚠ Search Error</h3><p>' + esc(msg) + '</p></div>';
    }

    function dictRenderResults() {
      _dictAddItems = [];
      var results = dictState.results,
        query = dictState.query,
        tab = dictState.activeTab;
      var ok = Object.values(results).filter(function(r) {
        return r.status === 'success';
      }).length;
      var html = '<div class="trans-entry-header"><div><div class="trans-word">' + esc(query) + '</div><div class="trans-detected">Detected: ' + (dictState.detectedLang === 'km' ? 'Khmer 🇰🇭' : 'English 🇬🇧') + '</div></div><div class="trans-result-count">' + ok + ' / 5 APIs</div></div>';
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
        var _ai = _dictAddItems.length;
        var _en = dictState.detectedLang === 'km' ? dictClean(def.text) : query;
        var _kh = dictState.detectedLang === 'km' ? query : dictClean(def.text);
        _dictAddItems.push({
          en: _en,
          kh: _kh
        });
        html += '<li style="display:flex;align-items:flex-start;gap:6px"><div style="flex:1"><span class="trans-def-pos">' + esc(def.pos) + '</span><div class="trans-def-text">' + dictHL(dictClean(def.text), query) + '</div><div class="trans-def-source">📌 ' + esc(def.api) + '</div></div><div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0"><button class="trans-add-btn" onclick="dictSpeakItem(_dictAddItems[' + _ai + '])" title="Hear pronunciation" style="background:rgba(99,102,241,.13);border-color:rgba(99,102,241,.28);color:#a5b4fc">🔊</button><button class="trans-add-btn" onclick="addFromTranslation(_dictAddItems[' + _ai + '].en,_dictAddItems[' + _ai + '].kh)" title="Add to vocabulary">➕ Add</button></div></li>';
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
              var _ai = _dictAddItems.length;
              var _en = dictState.detectedLang === 'km' ? c : query;
              var _kh = dictState.detectedLang === 'km' ? query : c;
              _dictAddItems.push({
                en: _en,
                kh: _kh
              });
              html += '<li style="display:flex;align-items:flex-start;gap:6px"><div style="flex:1"><span class="trans-def-pos">' + esc(r.pos) + '</span><div class="trans-def-text">' + dictHL(c, query) + '</div>';
              if (r.example && dictClean(r.example).length > 5) html += '<div class="trans-example">"' + dictHL(dictClean(r.example), query) + '"</div>';
              html += '</div><div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0"><button class="trans-add-btn" onclick="dictSpeakItem(_dictAddItems[' + _ai + '])" title="Hear pronunciation" style="background:rgba(99,102,241,.13);border-color:rgba(99,102,241,.28);color:#a5b4fc">🔊</button><button class="trans-add-btn" onclick="addFromTranslation(_dictAddItems[' + _ai + '].en,_dictAddItems[' + _ai + '].kh)" title="Add to vocabulary">➕ Add</button></div></li>';
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

    function dictSpeakItem(item) {
      // C10: speak the translation result (Khmer preferred, English fallback)
      var kh = (item && item.kh) || '';
      var en = (item && item.en) || '';
      if (kh && /[ក-៿]/.test(kh)) {
        speakKhmer(kh);
        return;
      }
      if (en) {
        var utt = new SpeechSynthesisUtterance(en);
        utt.lang = 'en-US';
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utt);
      }
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
              var _p = function(x) {
                return x < 10 ? '0' + x : String(x);
              };
              // FIX: use Cambodia time (UTC+7) so imported dates are consistent with the sheet timezone
              var _khNow = new Date(Date.now() + 7 * 3600000);
              csvParsed = [];
              var skipped = 0,
                today = _khNow.getUTCFullYear() + '-' + _p(_khNow.getUTCMonth() + 1) + '-' + _p(_khNow.getUTCDate()) + ' ' + _p(_khNow.getUTCHours()) + ':' + _p(_khNow.getUTCMinutes());
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
      var CHUNK = 5,
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

    function openConfStudy(confLevel) {
      // C5: show word list modal first; user can then press Study
      var labels = {
        '2': 'Got It',
        '1': 'Kinda',
        '0': 'Unknown',
        '-1': 'Unstudied'
      };
      var pool = allRows.filter(function(r) {
        var c = confidence[wordKey(r)];
        if (confLevel === -1) return c === undefined;
        return c === confLevel;
      });
      var label = labels[String(confLevel)] || 'Words';
      var ovl = el('conf-words-ovl');
      var titleEl = el('conf-words-title');
      var listEl = el('conf-words-list');
      if (!ovl || !listEl) return;
      if (titleEl) titleEl.textContent = label + ' — ' + pool.length + ' word' + (pool.length !== 1 ? 's' : '');
      listEl.innerHTML = '';
      if (!pool.length) {
        listEl.innerHTML = '<div style="font-size:.8rem;color:var(--dim);padding:12px 0">No words in this category yet.</div>';
      } else {
        pool.forEach(function(r) {
          var row = document.createElement('div');
          row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--bdr);gap:12px';
          row.innerHTML = '<span style="font-size:.85rem;color:var(--text)">' + esc(r.english || '—') + '</span>' +
            '<span class="kh" style="font-size:1rem;color:var(--acc3)">' + esc(r.khmer || '—') + '</span>';
          listEl.appendChild(row);
        });
      }
      _confStudyLevel = confLevel;
      _confStudyPool = pool;
      ovl.classList.add('open');
    }

    function _studyConfWords() {
      var ovl = el('conf-words-ovl');
      if (!ovl) return;
      var confLevel = _confStudyLevel;
      var pool = _confStudyPool || [];
      ovl.classList.remove('open');
      if (!pool.length) {
        toast('No words to study.', 'inf');
        return;
      }
      var map = {
        '2': 'got',
        '1': 'kinda',
        '0': 'unknown',
        '-1': 'unstudied'
      };
      var filterVal = map[String(confLevel)] || 'all';
      goPage('study', 'nav-study');
      var userSel = el('study-filter'),
        presetSel = el('study-preset-filter'),
        cf = el('study-conf-filter');
      if (userSel) userSel.value = 'All';
      if (presetSel) presetSel.value = 'none';
      if (cf) cf.value = filterVal;
      initStudyPage();
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

    function _srchClear(inpId, btnId) {
      var inp = el(inpId);
      var btn = el(btnId);
      if (btn) btn.style.display = (inp && inp.value.length > 0) ? 'block' : 'none';
    }

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

    // ── Writing / Spelling mode ───────────────────────────────────────────

    var writeDeck = [],
      writeIdx = 0,
      writeChecked = false;
    var listenDeck = [],
      listenIdx = 0,
      listenChecked = false;

    function startWriting() {
      var src = (studyDeck && studyDeck.length > 0) ? studyDeck : allRows;
      writeDeck = src.filter(function(r) {
          return !!r.english && !!r.khmer;
        })
        .slice().sort(function() {
          return Math.random() - 0.5;
        });
      writeIdx = 0;
      // C3: show speak button when deck is ready
      var _wsb = el('write-speak-btn');
      if (_wsb) _wsb.style.display = writeDeck.length > 0 ? 'block' : 'none';
      showWriteCard();
    }

    function speakWriteCard() {
      // C3: speak the Khmer side of the current writing card
      var r = writeDeck[writeIdx];
      if (r && r.khmer) speakKhmer(r.khmer);
    }

    function showWriteCard() {
      writeChecked = false;
      var btn = el('write-check-btn');
      if (btn) btn.textContent = '\u2713 Check';
      var r = writeDeck[writeIdx];
      var prompt = el('write-prompt');
      var prog = el('write-progress');
      var inp = el('write-input');
      var res = el('write-result');
      if (!prompt) return;
      if (!r) {
        prompt.innerHTML = '\u2705 Done! Tap \uD83D\uDD00 to shuffle again.';
        if (prog) prog.textContent = '';
        if (res) res.style.display = 'none';
        var _wsb2 = el('write-speak-btn');
        if (_wsb2) _wsb2.style.display = 'none';
        return;
      }
      prompt.innerHTML = '<span style="font-size:.68rem;color:var(--dim);display:block;margin-bottom:6px">Type the Khmer:</span>' +
        '<strong style="font-size:1.05rem">' + esc(r.english || '?') + '</strong>';
      if (prog) prog.textContent = (writeIdx + 1) + ' / ' + writeDeck.length;
      if (inp) {
        inp.value = '';
        inp.placeholder = 'Type Khmer\u2026';
      }
      if (res) res.style.display = 'none';
    }

    function checkWriting() {
      var r = writeDeck[writeIdx];
      if (!r) {
        startWriting();
        return;
      }
      var btn = el('write-check-btn');
      if (writeChecked) {
        writeChecked = false;
        writeIdx++;
        showWriteCard();
        return;
      }
      var inp = el('write-input');
      var res = el('write-result');
      if (!inp || !res) return;
      var ans = inp.value.trim();
      var correctRaw = (r.khmer || '').trim();
      res.style.display = 'block';
      if (!correctRaw) {
        res.className = 'write-result wrong';
        res.textContent = '\u2139 No Khmer saved for this word.';
      } else if (ans === correctRaw) {
        res.className = 'write-result correct';
        res.textContent = '\u2713 Correct! ' + correctRaw;
      } else {
        res.className = 'write-result wrong';
        res.textContent = '\u2717 Answer: ' + correctRaw;
      }
      writeChecked = true;
      if (btn) btn.textContent = 'Next Word \u2192';
    }

    function prevWriting() {
      writeChecked = false;
      var btn = el('write-check-btn');
      if (btn) btn.textContent = '\u2713 Check';
      if (writeDeck.length === 0) return;
      writeIdx = (writeIdx - 1 + writeDeck.length) % writeDeck.length;
      showWriteCard();
    }

    // ── Listening mode ────────────────────────────────────────────────────

    function startListening() {
      var src = (studyDeck && studyDeck.length > 0) ? studyDeck : allRows;
      listenDeck = src.filter(function(r) {
          return !!r.khmer;
        })
        .slice().sort(function() {
          return Math.random() - 0.5;
        });
      listenIdx = 0;
      showListenCard();
      var pb = el('listen-play-btn');
      if (pb) pb.style.display = 'block';
    }

    function showListenCard() {
      listenChecked = false;
      var cbtn = el('listen-check-btn');
      if (cbtn) cbtn.textContent = '\u2713 Check';
      var r = listenDeck[listenIdx];
      var prompt = el('listen-prompt');
      var prog = el('listen-progress');
      var inp = el('listen-input');
      var res = el('listen-result');
      if (!prompt) return;
      if (!r) {
        prompt.innerHTML = '\u2705 Done! Tap \uD83D\uDD00 to shuffle again.';
        if (prog) prog.textContent = '';
        if (res) res.style.display = 'none';
        var pb = el('listen-play-btn');
        if (pb) pb.style.display = 'none';
        return;
      }
      prompt.innerHTML = '<span style="font-size:.68rem;color:var(--dim);display:block;margin-bottom:6px">Tap \u201cHear\u201d then spell the Khmer word:</span>' +
        '<span style="opacity:.45;font-size:.9rem">\uD83D\uDD0A tap below to hear\u2026</span>';
      if (prog) prog.textContent = (listenIdx + 1) + ' / ' + listenDeck.length;
      if (inp) {
        inp.value = '';
        inp.placeholder = 'Type Khmer\u2026';
      }
      if (res) res.style.display = 'none';
    }

    function playCurrentListenCard() {
      var r = listenDeck[listenIdx];
      if (!r || !r.khmer) return;
      speakKhmer(r.khmer);
      var prompt = el('listen-prompt');
      if (prompt) {
        prompt.innerHTML = '<span style="font-size:.68rem;color:var(--dim);display:block;margin-bottom:6px">Spell the Khmer word you heard:</span>' +
          '<span style="opacity:.55;font-size:.85rem">\uD83D\uDD0A playing\u2026 type what you hear</span>';
      }
      var inp = el('listen-input');
      if (inp) setTimeout(function() {
        try {
          inp.focus();
        } catch (e) {}
      }, 80);
    }

    function checkListening() {
      var r = listenDeck[listenIdx];
      if (!r) {
        startListening();
        return;
      }
      var cbtn = el('listen-check-btn');
      if (listenChecked) {
        listenChecked = false;
        listenIdx++;
        showListenCard();
        return;
      }
      var inp = el('listen-input');
      var res = el('listen-result');
      if (!inp || !res) return;
      var ans = inp.value.trim();
      var correctRaw = (r.khmer || '').trim();
      res.style.display = 'block';
      if (!correctRaw) {
        res.className = 'write-result wrong';
        res.textContent = '\u2139 No Khmer saved for this word.';
      } else if (ans === correctRaw) {
        res.className = 'write-result correct';
        res.textContent = '\u2713 Correct! ' + correctRaw;
      } else {
        res.className = 'write-result wrong';
        res.textContent = '\u2717 Answer: ' + correctRaw;
      }
      listenChecked = true;
      if (cbtn) cbtn.textContent = 'Next Word \u2192';
    }

    function prevListening() {
      listenChecked = false;
      var cbtn = el('listen-check-btn');
      if (cbtn) cbtn.textContent = '\u2713 Check';
      if (listenDeck.length === 0) return;
      listenIdx = (listenIdx - 1 + listenDeck.length) % listenDeck.length;
      showListenCard();
    }

    function enterFsFromOverlay() {
      var ov = el('fs-overlay');
      if (ov) ov.style.display = 'none';
      var de = document.documentElement;
      var req = de.requestFullscreen || de.webkitRequestFullscreen;
      if (req) req.call(de).catch(function() {
        toast('Full screen not supported here.', 'inf');
      });
    }

    function toggleFullscreen() {
      var de = document.documentElement;
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        var req = de.requestFullscreen || de.webkitRequestFullscreen;
        if (req) req.call(de).catch(function() {
          toast('Full screen not supported here.', 'inf');
        });
      } else {
        var exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) exit.call(document).catch(function() {});
      }
    }

    function _updateFsBtn() {
      var btn = el('fullscreen-btn');
      if (btn) btn.textContent = (document.fullscreenElement || document.webkitFullscreenElement) ? '\u2715 Exit Full Screen' : '\u26F6 Full Screen';
    }
    document.addEventListener('fullscreenchange', _updateFsBtn);
    document.addEventListener('webkitfullscreenchange', _updateFsBtn);

    document.addEventListener('DOMContentLoaded', function() {
      applyTheme(ls(THEME_KEY) || 'dark');
      // C11: boot stale/incomplete (unverified) sessions — treat exactly like pressing Log Out
      if (ls(MAINUSER_KEY) && !ls('kv_verified')) {
        MAIN_USER = ls(MAINUSER_KEY) || '';
        lsSet('kv_verified', '');
        performLogout();
      }
      init();
      if (S.autoFullscreen) {
        var ov = el('fs-overlay');
        if (ov) ov.style.display = 'flex';
      }
      applyTabOrder();
      loadColWidths();
    });

    (() => {
      const ENTRY = 'Khmer Vocabularv8.6.2',
        KEY = 'Ion-o-koji Watermark';
      const logs = (localStorage.getItem(KEY) || "").split('\n').map(line => line.replace(/^- /, '').trim()).filter(line => line && line !== ENTRY);
      logs.push(ENTRY);
      localStorage.setItem(KEY, logs.map(item => `- ${item}`).join('\n'));
    })();

  
