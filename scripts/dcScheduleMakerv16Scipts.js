
    // ─── Nearest Tuesday ─────────────────────────────────────────────────────
    function getNearestTuesday() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const day = today.getDay(); // 0=Sun,1=Mon,2=Tue,...
      const prevDiff = (day - 2 + 7) % 7; // days since last Tuesday
      const nextDiff = (2 - day + 7) % 7; // days until next Tuesday
      const offset = (prevDiff === 0) ? 0 : (prevDiff <= nextDiff ? -prevDiff : nextDiff);
      const d = new Date(today);
      d.setDate(today.getDate() + offset);
      return d;
    }

    function formatDate(d) {
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }

    function getDateStamp(d) {
      d = d || getNearestTuesday();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const year = String(d.getFullYear()).slice(-2);
      return `${month}_${day}_${year}`;
    }

    // Show nearest Tuesday in header
    document.getElementById('headerDate').textContent = 'Week of ' + formatDate(getNearestTuesday());

    // ─── Prevent pull-to-refresh & Android back ───────────────────────────────
    document.addEventListener('touchmove', function(e) {
      if (e.touches.length === 1 && document.scrollingElement && document.scrollingElement.scrollTop === 0) {
        // suppress pull-to-refresh gesture at top
      }
    }, {
      passive: false
    });

    // Push multiple history states so back button doesn't close the tab
    (function preventBackClose() {
      history.pushState({
        page: 1
      }, '', location.href);
      history.pushState({
        page: 2
      }, '', location.href);
      window.addEventListener('popstate', function(e) {
        history.pushState({
          page: 2
        }, '', location.href);
      });
    })();

    // ─── Page navigation ──────────────────────────────────────────────────────
    const pages = {
      mainPage: document.getElementById('mainPage'),
      schedulePage: document.getElementById('schedulePage'),
      keyIndicatorsPage: document.getElementById('keyIndicatorsPage'),
      goalsPage: document.getElementById('goalsPage')
    };

    function showPage(id) {
      Object.values(pages).forEach(p => p.classList.add('hidden'));
      const el = document.getElementById(id);
      if (el) el.classList.remove('hidden');
      hideExportModal();
      window.scrollTo(0, 0);
    }

    document.querySelectorAll('.big-btn').forEach(btn => btn.addEventListener('click', () => showPage(btn.dataset.target)));
    document.querySelectorAll('[data-action="back"]').forEach(b => b.addEventListener('click', () => showPage('mainPage')));

    // ─── Schedule table ───────────────────────────────────────────────────────
    const scheduleTable = document.getElementById('scheduleTable');
    document.getElementById('addScheduleRow').addEventListener('click', () => {
      const tbody = scheduleTable.tBodies[0];
      const i = tbody.querySelectorAll('tr').length + 1;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><div class="cell" contenteditable="true" data-pos="${i}-1"></div></td><td><div class="cell" contenteditable="true" data-pos="${i}-2"></div></td>`;
      tbody.appendChild(tr);
    });

    document.getElementById('removeScheduleRow').addEventListener('click', () => {
      const tbody = scheduleTable.tBodies[0];
      const rows = tbody.querySelectorAll('tr');
      if (rows.length > 1) rows[rows.length - 1].remove();
      else alert('Cannot remove the last row');
    });

    // ─── Key Indicators table ─────────────────────────────────────────────────
    const keyGrid = document.getElementById('keyGrid');
    document.getElementById('addKIrow').addEventListener('click', () => {
      const tbody = keyGrid.tBodies[0];
      const i = tbody.querySelectorAll('tr').length + 1;
      const tr = document.createElement('tr');
      tr.innerHTML = Array.from({
        length: 7
      }, (_, c) => `<td><div class="cell" contenteditable="true" data-pos="KI-${i}-${c+1}"></div></td>`).join('');
      tbody.appendChild(tr);
    });

    document.getElementById('removeKIrow').addEventListener('click', () => {
      const tbody = keyGrid.tBodies[0];
      const rows = tbody.querySelectorAll('tr');
      if (rows.length > 1) rows[rows.length - 1].remove();
      else alert('Cannot remove the last row');
    });

    // ─── Media Referrals table ────────────────────────────────────────────────
    const mediaGrid = document.getElementById('mediaGrid');
    document.getElementById('addMediaRow').addEventListener('click', () => {
      const tbody = mediaGrid.tBodies[0];
      const i = tbody.querySelectorAll('tr').length + 1;
      const tr = document.createElement('tr');
      tr.innerHTML = Array.from({
        length: 4
      }, (_, c) => `<td><div class="cell" contenteditable="true" data-pos="M-${i}-${c+1}"></div></td>`).join('');
      tbody.appendChild(tr);
    });

    document.getElementById('removeMediaRow').addEventListener('click', () => {
      const tbody = mediaGrid.tBodies[0];
      const rows = tbody.querySelectorAll('tr');
      if (rows.length > 1) rows[rows.length - 1].remove();
      else alert('Cannot remove the last row');
    });

    // ─── Goals & Tasks ────────────────────────────────────────────────────────
    function attachGoalHandlers(wrapper, isTask) {
      const mark = wrapper.querySelector('.goal-mark');
      if (mark) {
        mark.onclick = (e) => {
          e.stopPropagation();
          toggleMark(mark, wrapper);
        };
        mark.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            toggleMark(mark, wrapper);
          }
        };
      }

      const addNoteBtn = wrapper.querySelector('.small-add-note');
      if (addNoteBtn && !addNoteBtn._setup) {
        addNoteBtn._setup = true;
        addNoteBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const detailsEl = wrapper.querySelector('.goal-details');
          const ulEl = detailsEl.querySelector('ul');
          const newLi = document.createElement('li');
          newLi.contentEditable = 'true';
          newLi.setAttribute('data-placeholder', 'Optional note');
          ulEl.appendChild(newLi);
          detailsEl.classList.remove('hidden');
          attachRemoveNoteHandler(newLi);
          setTimeout(() => newLi.focus(), 50);
        };
      }

      const removeNoteBtn = wrapper.querySelector('.small-remove-note');
      if (removeNoteBtn && !removeNoteBtn._setup) {
        removeNoteBtn._setup = true;
        removeNoteBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const ulEl = wrapper.querySelector('.goal-details ul');
          const items = ulEl.querySelectorAll('li');
          if (items.length > 0) items[items.length - 1].remove();
          else alert('No notes to remove');
        };
      }

      const removeBtn = wrapper.querySelector('.small-remove');
      if (removeBtn && !removeBtn._setup) {
        removeBtn._setup = true;
        removeBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (confirm('Remove this item?')) wrapper.remove();
        };
      }

      wrapper.querySelectorAll('li').forEach(li => attachRemoveNoteHandler(li));

      wrapper.ondragstart = (e) => {
        e.dataTransfer.effectAllowed = 'move';
        wrapper.classList.add('dragging-item');
      };
      wrapper.ondragend = () => {
        wrapper.classList.remove('dragging-item');
        document.querySelectorAll('.goal-item').forEach(g => g.classList.remove('drag-over'));
      };
      wrapper.ondragover = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const list = wrapper.closest('.goals-list');
        if (list && list.querySelector('.dragging-item') !== wrapper) wrapper.classList.add('drag-over');
      };
      wrapper.ondragleave = () => wrapper.classList.remove('drag-over');
      wrapper.ondrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const list = wrapper.closest('.goals-list');
        const dragging = list ? list.querySelector('.dragging-item') : null;
        if (dragging && dragging !== wrapper) wrapper.parentNode.insertBefore(dragging, wrapper);
        wrapper.classList.remove('drag-over');
      };
    }

    function attachRemoveNoteHandler(li) {
      if (li._rmSetup) return;
      li._rmSetup = true;
      li.oncontextmenu = (e) => {
        e.preventDefault();
        if (confirm('Delete this note?')) li.remove();
      };
    }

    function toggleMark(markEl, wrapper) {
      const list = wrapper.closest('.goals-list');
      if (markEl.classList.contains('checked')) {
        // Unchecking → move to top of list
        markEl.classList.remove('checked');
        markEl.textContent = 'X';
        wrapper.classList.remove('is-checked');
        if (list) list.prepend(wrapper);
      } else {
        // Checking → move to top of checked group (first among checked at bottom)
        markEl.classList.add('checked');
        markEl.textContent = '✔';
        wrapper.classList.add('is-checked');
        if (list) {
          const firstChecked = Array.from(list.querySelectorAll('.goal-item.is-checked')).find(item => item !== wrapper);
          if (firstChecked) list.insertBefore(wrapper, firstChecked);
          else list.appendChild(wrapper);
        }
      }
    }

    function createGoalItem(text = '', mark = 'X', details = [], isTask = false) {
      const wrapper = document.createElement('div');
      wrapper.className = 'goal-item' + (mark === '✔' ? ' is-checked' : '');
      wrapper.dataset.id = (isTask ? 't-' : 'g-') + Date.now() + Math.random();
      wrapper.draggable = true;

      const textClass = isTask ? 'task-text' : 'goal-text';
      const placeholder = isTask ? 'New task — tap to edit' : 'New goal — tap to edit';

      const div = document.createElement('div');
      div.className = textClass;
      div.contentEditable = 'true';
      div.setAttribute('data-placeholder', placeholder);
      if (text) div.innerText = text;

      const content = document.createElement('div');
      content.className = 'goal-item-content';
      content.appendChild(div);

      const detailsDiv = document.createElement('div');
      detailsDiv.className = 'goal-details' + (details.length === 0 ? ' hidden' : '');
      const ul = document.createElement('ul');
      details.forEach(d => {
        const li = document.createElement('li');
        li.contentEditable = 'true';
        li.setAttribute('data-placeholder', 'Optional note');
        li.innerText = d;
        ul.appendChild(li);
      });
      detailsDiv.appendChild(ul);
      content.appendChild(detailsDiv);

      const footer = document.createElement('div');
      footer.className = 'goal-item-footer';

      const footerTop = document.createElement('div');
      footerTop.className = 'goal-item-footer-top';

      const addBtn = document.createElement('button');
      addBtn.className = 'small-add-note secondary';
      addBtn.innerText = 'Add note';
      footerTop.appendChild(addBtn);

      const removeNoteBtn = document.createElement('button');
      removeNoteBtn.className = 'small-remove-note secondary';
      removeNoteBtn.innerText = 'Remove note';
      footerTop.appendChild(removeNoteBtn);
      footer.appendChild(footerTop);

      const footerBottom = document.createElement('div');
      footerBottom.className = 'goal-item-footer-bottom';
      const removeBtn = document.createElement('button');
      removeBtn.className = 'small-remove ghost';
      removeBtn.innerText = isTask ? 'Remove task' : 'Remove goal';
      footerBottom.appendChild(removeBtn);
      footer.appendChild(footerBottom);
      content.appendChild(footer);

      const markEl = document.createElement('div');
      markEl.className = 'goal-mark' + (mark === '✔' ? ' checked' : '');
      markEl.setAttribute('role', 'button');
      markEl.setAttribute('tabindex', '0');
      markEl.innerText = mark;

      wrapper.appendChild(markEl);
      wrapper.appendChild(content);
      attachGoalHandlers(wrapper, isTask);
      return wrapper;
    }

    // New items added to TOP of list
    document.getElementById('addGoalBtn').addEventListener('click', () => {
      const list = document.getElementById('goalsList');
      const newItem = createGoalItem('', 'X', [], false);
      list.prepend(newItem);
      newItem.querySelector('.goal-text').focus();
    });

    document.getElementById('addTaskBtn').addEventListener('click', () => {
      const list = document.getElementById('tasksList');
      const newItem = createGoalItem('', 'X', [], true);
      list.prepend(newItem);
      newItem.querySelector('.task-text').focus();
    });

    // ─── Reset ────────────────────────────────────────────────────────────────
    document.getElementById('resetBtn').addEventListener('click', () => {
      if (!confirm('Clear all data and start fresh?')) return;
      document.querySelectorAll('.cell').forEach(c => c.innerText = '');
      document.getElementById('districtInput').value = '';
      const goalsList = document.getElementById('goalsList');
      goalsList.innerHTML = '';
      goalsList.appendChild(createGoalItem('', 'X', [], false));
      const tasksList = document.getElementById('tasksList');
      tasksList.innerHTML = '';
      tasksList.appendChild(createGoalItem('', 'X', [], true));
    });

    // ─── Export ───────────────────────────────────────────────────────────────
    let _currentExportHtml = '';

    const exportBtn = document.getElementById('exportBtn');
    const exportModal = document.getElementById('exportModal');
    const closeExport = document.getElementById('closeExport');
    const downloadExport = document.getElementById('downloadExport');
    const exportFrame = document.getElementById('exportPreviewFrame');

    function hideExportModal() {
      exportModal.classList.add('hidden');
      exportModal.setAttribute('aria-hidden', 'true');
      // Clear iframe src to free memory
      exportFrame.srcdoc = '';
    }

    function showExportModal() {
      exportModal.classList.remove('hidden');
      exportModal.setAttribute('aria-hidden', 'false');
    }

    exportBtn.addEventListener('click', () => {
      _currentExportHtml = buildExportHtml();
      // Save to localStorage for "Import Last" feature
      try {
        localStorage.setItem('lastExportHtml', _currentExportHtml);
      } catch (e) {}
      exportFrame.srcdoc = _currentExportHtml;
      showExportModal();
    });

    closeExport.addEventListener('click', hideExportModal);

    exportModal.addEventListener('click', (e) => {
      if (e.target === exportModal) hideExportModal();
    });

    downloadExport.addEventListener('click', async (e) => {
      e.preventDefault();
      const content = _currentExportHtml || buildExportHtml();
      const districtName = (document.getElementById('districtInput').value || 'District').trim();
      const filename = `${districtName} District Council ${getDateStamp()}.html`;

      if ('showSaveFilePicker' in window) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: 'HTML Files',
              accept: {
                'text/html': ['.html']
              }
            }]
          });
          const writable = await handle.createWritable();
          await writable.write(new Blob([content], {
            type: 'text/html'
          }));
          await writable.close();
          hideExportModal();
          return;
        } catch (err) {
          /* fall through */
        }
      }

      try {
        const blob = new Blob([content], {
          type: 'text/html'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 500);
        hideExportModal();
        return;
      } catch (err) {
        /* fall through */
      }

      try {
        const file = new File([content], filename, {
          type: 'text/html'
        });
        if (navigator.canShare && navigator.canShare({
            files: [file]
          })) {
          await navigator.share({
            files: [file],
            title: filename
          });
          hideExportModal();
          return;
        }
      } catch (err) {
        /* fall through */
      }

      const w = window.open();
      if (w) {
        w.document.open();
        w.document.write(content);
        w.document.close();
        alert('Export opened in new tab — save from there.');
      } else {
        alert('Could not download. Try a different browser.');
      }
    });

    function escapeHtml(s) {
      return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function buildExportHtml() {
      const districtName = (document.getElementById('districtInput').value || 'District').trim();
      const fullHeading = districtName ? `${districtName} District Council` : 'District Council';
      const tuesdayDate = formatDate(getNearestTuesday());

      const mpEN = "Invite others to come unto Christ by helping them receive the restored gospel through faith in Jesus Christ and His Atonement, repentance, baptism, receiving the gift of the Holy Ghost, and enduring to the end";
      const mpKH = "អញ្ជើញ\u200bមនុស្ស\u200bដទៃ\u200bមក\u200bកាន់\u200bព្រះគ្រីស្ទ ដោយ\u200bការជួយ\u200bពួកគេ\u200bឲ្យ\u200bទទួលយក\u200bដំណឹងល្អ\u200bដែល\u200bបាន\u200bស្ដារឡើងវិញ តាមរយៈ\u200bសេចក្ដី\u200bជំនឿ\u200bនៅ\u200bលើ\u200bព្រះយេស៊ូវគ្រីស្ទ និង\u200bដង្វាយធួន\u200bរបស់\u200bទ្រង់ ការប្រែចិត្ត ពិធីបុណ្យ\u200bជ្រមុជទឹក ការទទួល\u200bអំណោយទាន\u200bនៃ\u200bព្រះវិញ្ញាណ\u200bបរិសុទ្ធ និង\u200bការកាន់ខ្ជាប់\u200bដរាប\u200bដល់\u200bចុង\u200bបំផុត";

      const css = `
        *{box-sizing:border-box}
        body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;margin:16px;background:#fff;color:#111;font-size:17px}
        .heading{font-weight:900;font-size:22px;text-align:center;margin-bottom:4px;text-decoration:underline}
        .subheading{text-align:center;font-size:13px;color:#666;margin-bottom:12px}
        .divider{border-bottom:1px solid #000;margin:14px 0}
        .section-title{font-weight:900;font-size:18px;margin:8px 0 6px}
        table{border-collapse:collapse;width:100%;table-layout:fixed;margin-bottom:10px;border:2px solid #000}
        table td{border:2px solid #000;padding:7px;vertical-align:middle;word-break:break-word}
        table td.left{text-align:left;vertical-align:top}
        table td.center{text-align:center;vertical-align:middle;height:60px;overflow:hidden}
        .goal{margin-bottom:3px;font-weight:700;font-size:17px}
        .goal-notes{margin-left:18px;margin-top:0;margin-bottom:10px;font-weight:normal;font-size:15px}
        .goal-notes li{margin:1px 0}
        .goals-section{margin-bottom:30px}
        .tasks-section{margin-top:30px}
        .mp-link{text-decoration:underline;cursor:pointer;color:#1a56db}
        #mp-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;align-items:center;justify-content:center}
        #mp-overlay.show{display:flex}
        #mp-box{background:white;border-radius:12px;padding:20px 18px;max-width:92%;max-height:85vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.3)}
        #mp-box h3{margin:0 0 10px;font-size:16px}
        #mp-text{line-height:1.7;font-size:15px}
        #mp-btns{margin-top:14px;display:flex;gap:8px;flex-wrap:wrap}
        #mp-btns button{padding:8px 16px;border-radius:8px;border:0;cursor:pointer;font-weight:700;font-size:14px}
        .btn-en{background:#2b6cb0;color:white}
        .btn-kh{background:#2b6cb0;color:white}
        .btn-close{background:#e2e8f0;color:#111}
        a{color:#1a56db}
      `.replace(/\s+/g, ' ').trim();

      function gatherTableRows(selector) {
        return Array.from(document.querySelectorAll(selector + ' tbody tr')).map(tr =>
          Array.from(tr.querySelectorAll('td')).map(td => {
            const c = td.querySelector('.cell');
            return escapeHtml(c ? c.innerText.trim() : '');
          })
        );
      }

      const schedRows = gatherTableRows('#scheduleTable');
      const scheduleHtml = `<div class="divider"></div><div class="section-title">Schedule</div><table>${schedRows.map(r => `<tr>${r.map(c => `<td class="left">${c}</td>`).join('')}</tr>`).join('')}</table>`;

      const keyRows = gatherTableRows('#keyGrid');
      const kiHtml = `<div class="divider"></div><div class="section-title">Key Indicators</div><table>${keyRows.map(r => `<tr>${r.map(c => `<td class="center">${c}</td>`).join('')}</tr>`).join('')}</table>`;

      const mediaRows = gatherTableRows('#mediaGrid');
      const mHtml = `<div class="divider"></div><div class="section-title">Media Referrals</div><table>${mediaRows.map(r => `<tr>${r.map(c => `<td class="center">${c}</td>`).join('')}</tr>`).join('')}</table>`;

      function buildItemsHtml(selector, textSel, placeholder) {
        return Array.from(document.querySelectorAll(selector + ' .goal-item')).map(g => {
          const markEl = g.querySelector('.goal-mark');
          const mark = markEl ? markEl.textContent : 'X';
          const textEl = g.querySelector(textSel);
          const text = textEl ? textEl.innerText.trim() : '';
          const detailsEl = g.querySelector('.goal-details');
          let notesHtml = '';
          if (detailsEl && !detailsEl.classList.contains('hidden')) {
            const items = Array.from(detailsEl.querySelectorAll('li'))
              .map(li => li.innerText.trim())
              .filter(t => t && t !== 'Optional note')
              .map(t => `<li>${escapeHtml(t)}</li>`)
              .join('');
            if (items) notesHtml = `<ul class="goal-notes">${items}</ul>`;
          }
          const displayText = (text === placeholder) ? '' : text;
          return `<div class="goal">${escapeHtml(mark)} ${escapeHtml(displayText)}</div>${notesHtml}`;
        }).join('');
      }

      const goalsHtml = `<div class="goals-section"><div class="divider"></div><div class="section-title">Goals</div>${buildItemsHtml('#goalsList', '.goal-text', 'New goal — tap to edit')}</div>`;
      const tasksHtml = `<div class="tasks-section"><div class="section-title">Tasks</div>${buildItemsHtml('#tasksList', '.task-text', 'New task — tap to edit')}</div>`;

      const exportedScript = `
<script>
var _mpEN="${mpEN.replace(/"/g,'\\"')}";
var _mpKH="${mpKH.replace(/"/g,'\\"')}";
function showMPOverlay(){document.getElementById('mp-overlay').classList.add('show');}
function closeMPOverlay(){document.getElementById('mp-overlay').classList.remove('show');}
function showMPLang(lang){
  document.getElementById('mp-text').textContent=(lang==='en'?_mpEN:_mpKH);
}
document.addEventListener('DOMContentLoaded',function(){
  showMPLang('en');
  // Process MP links
  function wrapNode(node){
    if(node.nodeType===3){
      var t=node.nodeValue;
      if(/\\b(missionary purpose|mp)\\b/i.test(t)){
        var sp=document.createElement('span');
        sp.innerHTML=t.replace(/\\b(missionary purpose|mp)\\b/gi,function(m){
          return '<span class="mp-link" onclick="showMPOverlay()">'+m+'</span>';
        });
        node.parentNode.replaceChild(sp,node);
      }
    } else if(node.nodeType===1&&node.tagName!=='SCRIPT'&&node.tagName!=='STYLE'&&node.tagName!=='A'){
      Array.from(node.childNodes).forEach(wrapNode);
    }
  }
  wrapNode(document.body);
  // Process hymn links
  function wrapHymns(node){
    if(node.nodeType===3){
      var t=node.nodeValue;
      if(/\\b(\\d{1,3})\\b/.test(t)&&/\\d+\\./.test(t)){
        var sp=document.createElement('span');
        sp.innerHTML=t.replace(/(^|\\s)(\\d{1,3})\\.(\\s|$)/g,function(match,pre,num,post){
          var n=parseInt(num,10);
          if(n>=1&&n<=341){
            return pre+'<a href="https://www.churchofjesuschrist.org/music/library/hymns/'+n+'?lang=eng" target="_blank">'+n+'.</a>'+post;
          }
          return match;
        });
        if(sp.innerHTML!==t)node.parentNode.replaceChild(sp,node);
      }
    } else if(node.nodeType===1&&node.tagName!=='SCRIPT'&&node.tagName!=='STYLE'&&node.tagName!=='A'){
      Array.from(node.childNodes).forEach(wrapHymns);
    }
  }
  wrapHymns(document.body);
  // Prevent pull-to-refresh on exported page too
  document.documentElement.style.overscrollBehaviorY='none';
  // Usage tracking
  (function(){
    var ENTRY='District Council Schedule v16',KEY='Ion-o-koji Watermark';
    var logs=(localStorage.getItem(KEY)||'').split('\\n').map(function(l){return l.replace(/^- /,'').trim();}).filter(function(l){return l&&l!==ENTRY;});
    logs.push(ENTRY);
    localStorage.setItem(KEY,logs.map(function(i){return '- '+i;}).join('\\n'));
  })();
});

<\/script>`;

      const mpOverlay = `
<div id="mp-overlay" onclick="if(event.target===this)closeMPOverlay()">
  <div id="mp-box">
    <h3>Missionary Purpose</h3>
    <div id="mp-text"></div>
    <div id="mp-btns">
      <button class="btn-en" onclick="showMPLang('en')">English</button>
      <button class="btn-kh" onclick="showMPLang('kh')">ខ្មែរ</button>
      <button class="btn-close" onclick="closeMPOverlay()">Close</button>
    </div>
  </div>
</div>`;

      return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(fullHeading)}</title><style>${css}</style></head><body>${mpOverlay}<div class="heading">${escapeHtml(fullHeading)}</div><div class="subheading">${escapeHtml(tuesdayDate)}</div>${scheduleHtml}${kiHtml}${mHtml}${goalsHtml}${tasksHtml}${exportedScript}</body></html>`;
    }

    // ─── Import ───────────────────────────────────────────────────────────────
    const importBtn = document.getElementById('importBtn');
    const fileImport = document.getElementById('fileImport');

    importBtn.addEventListener('click', () => fileImport.click());

    fileImport.addEventListener('change', async (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      try {
        const text = await f.text();
        parseAndLoadHtml(text);
        alert(`Imported: ${f.name}`);
      } catch (err) {
        alert('Import failed: ' + err.message);
      }
      fileImport.value = '';
    });

    // Import Last Exported
    document.getElementById('importLastBtn').addEventListener('click', () => {
      try {
        const lastHtml = localStorage.getItem('lastExportHtml');
        if (!lastHtml) {
          alert('No previous export found. Export first to save one.');
          return;
        }
        if (!confirm('Import from the last exported file? This will overwrite current data.')) return;
        parseAndLoadHtml(lastHtml);
        alert('Imported from last export.');
      } catch (err) {
        alert('Could not load last export: ' + err.message);
      }
    });

    function parseAndLoadHtml(htmlText) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');

      const heading = doc.querySelector('.heading') || doc.querySelector('title');
      if (heading) {
        const headingText = heading.textContent.trim().replace(/\s*—\s*Export\s*$/, '').trim();
        const districtMatch = headingText.match(/^(.+?)\s+District\s+Council/i);
        const districtNameOnly = districtMatch ? districtMatch[1].trim() : headingText;
        document.getElementById('siteName').innerText = headingText;
        document.getElementById('districtInput').value = districtNameOnly;
      }

      function tableAfterTitle(text) {
        const el = Array.from(doc.querySelectorAll('.section-title, .title')).find(t => t.textContent.trim().toLowerCase().includes(text.toLowerCase()));
        if (!el) return null;
        let sib = el.nextElementSibling;
        while (sib && sib.tagName && sib.tagName.toLowerCase() !== 'table') sib = sib.nextElementSibling;
        return sib;
      }

      const schedParsed = tableAfterTitle('Schedule') || doc.querySelector('table');
      if (schedParsed) loadTableIntoLocal(schedParsed, '#scheduleTable');

      const keyParsed = tableAfterTitle('Key Indicators');
      if (keyParsed) loadTableIntoLocal(keyParsed, '#keyGrid');

      let mediaParsed = tableAfterTitle('Media Referrals');
      if (!mediaParsed && keyParsed) {
        let s = keyParsed.nextElementSibling;
        while (s && s.tagName && s.tagName.toLowerCase() !== 'table') s = s.nextElementSibling;
        mediaParsed = s;
      }
      if (!mediaParsed) {
        const allTables = Array.from(doc.querySelectorAll('table'));
        if (allTables.length >= 3) mediaParsed = allTables[2];
      }
      if (mediaParsed) loadTableIntoLocal(mediaParsed, '#mediaGrid');

      // Parse goals
      const goalTitle = Array.from(doc.querySelectorAll('.section-title, .title')).find(t => /goal/i.test(t.textContent));
      let goalEls = [];
      if (goalTitle) {
        let s = goalTitle.nextElementSibling;
        while (s) {
          if (s.classList && s.classList.contains('goal')) goalEls.push(s);
          const inside = s.querySelectorAll && s.querySelectorAll('.goal');
          if (inside && inside.length) goalEls.push(...inside);
          if (s.classList && (s.classList.contains('tasks-section') || (s.querySelector && s.querySelector('.title')))) break;
          s = s.nextElementSibling;
        }
      }
      if (!goalEls.length) {
        const allGoals = Array.from(doc.querySelectorAll('.goal'));
        goalEls = allGoals.slice(0, Math.ceil(allGoals.length / 2));
      }

      const goalsList = document.getElementById('goalsList');
      goalsList.innerHTML = '';
      goalEls.forEach(g => {
        const raw = g.textContent.trim();
        const markChar = (raw[0] === '✔' || raw[0] === 'X' || raw[0] === '✓') ? raw[0] : 'X';
        const text = raw.replace(/^[✔✓X\s]+/, '').trim();
        let details = [];
        const next = g.nextElementSibling;
        if (next && next.classList && next.classList.contains('goal-notes')) {
          details = Array.from(next.querySelectorAll('li')).map(li => li.textContent.trim()).filter(Boolean);
        }
        goalsList.appendChild(createGoalItem(text, markChar, details, false));
      });
      if (!goalsList.children.length) goalsList.appendChild(createGoalItem('', 'X', [], false));

      // Parse tasks
      const taskTitle = Array.from(doc.querySelectorAll('.section-title, .title')).find(t => /task/i.test(t.textContent));
      let taskEls = [];
      if (taskTitle) {
        let s = taskTitle.nextElementSibling;
        while (s) {
          if (s.classList && s.classList.contains('goal')) taskEls.push(s);
          const inside = s.querySelectorAll && s.querySelectorAll('.goal');
          if (inside && inside.length) taskEls.push(...inside);
          s = s.nextElementSibling;
        }
      }
      if (!taskEls.length) {
        const allGoals = Array.from(doc.querySelectorAll('.goal'));
        taskEls = allGoals.slice(Math.ceil(allGoals.length / 2));
      }

      const tasksList = document.getElementById('tasksList');
      tasksList.innerHTML = '';
      taskEls.forEach(t => {
        const raw = t.textContent.trim();
        const markChar = (raw[0] === '✔' || raw[0] === 'X' || raw[0] === '✓') ? raw[0] : 'X';
        const text = raw.replace(/^[✔✓X\s]+/, '').trim();
        let details = [];
        const next = t.nextElementSibling;
        if (next && next.classList && next.classList.contains('goal-notes')) {
          details = Array.from(next.querySelectorAll('li')).map(li => li.textContent.trim()).filter(Boolean);
        }
        tasksList.appendChild(createGoalItem(text, markChar, details, true));
      });
      if (!tasksList.children.length) tasksList.appendChild(createGoalItem('', 'X', [], true));
    }

    function loadTableIntoLocal(parsedTable, localSelector) {
      const localTable = document.querySelector(localSelector);
      if (!localTable) return;
      const parsedRows = Array.from(parsedTable.querySelectorAll('tr'));
      const tbody = localTable.tBodies[0] || localTable.appendChild(document.createElement('tbody'));
      tbody.innerHTML = '';
      parsedRows.forEach(pr => {
        const tr = document.createElement('tr');
        const cells = Array.from(pr.querySelectorAll('td, th'));
        if (cells.length === 0) {
          pr.textContent.split('\t').filter(Boolean).forEach(p => tr.appendChild(tdCell(p)));
        } else {
          cells.forEach(pc => tr.appendChild(tdCell(pc.innerText || pc.textContent || '')));
        }
        tbody.appendChild(tr);
      });

      function tdCell(text) {
        const td = document.createElement('td');
        const div = document.createElement('div');
        div.className = 'cell';
        div.contentEditable = 'true';
        div.innerText = text || '';
        td.appendChild(div);
        return td;
      }
    }

    // ─── Tab key navigation ───────────────────────────────────────────────────
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && document.activeElement && document.activeElement.isContentEditable) {
        e.preventDefault();
        const edits = Array.from(document.querySelectorAll('[contenteditable="true"]'));
        const idx = edits.indexOf(document.activeElement);
        const next = edits[(idx + 1) % edits.length];
        if (next) next.focus();
      }
    });

    // ─── Init ─────────────────────────────────────────────────────────────────
    function initGoalsAndTasks() {
      const goalsList = document.getElementById('goalsList');
      if (!goalsList.children.length) goalsList.appendChild(createGoalItem('', 'X', [], false));
      const tasksList = document.getElementById('tasksList');
      if (!tasksList.children.length) tasksList.appendChild(createGoalItem('', 'X', [], true));
    }

    initGoalsAndTasks();
    showPage('mainPage');

    (() => {
      const ENTRY = 'District Council Schedule Maker v16',
        KEY = 'Ion-o-koji Watermark';
      const logs = (localStorage.getItem(KEY) || "").split('\n').map(line => line.replace(/^- /, '').trim()).filter(line => line && line !== ENTRY);
      logs.push(ENTRY);
      localStorage.setItem(KEY, logs.map(item => `- ${item}`).join('\n'));
    })();

  
