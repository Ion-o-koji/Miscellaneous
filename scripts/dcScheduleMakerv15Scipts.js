
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

    const scheduleTable = document.getElementById('scheduleTable');
    document.getElementById('addScheduleRow').addEventListener('click', () => {
      const tbody = scheduleTable.tBodies[0];
      const rows = tbody.querySelectorAll('tr').length;
      const i = rows + 1;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><div class="cell" contenteditable="true" data-pos="${i}-1"></div></td><td><div class="cell" contenteditable="true" data-pos="${i}-2"></div></td>`;
      tbody.appendChild(tr);
    });

    document.getElementById('removeScheduleRow').addEventListener('click', () => {
      const tbody = scheduleTable.tBodies[0];
      const rows = tbody.querySelectorAll('tr');
      if (rows.length > 1) {
        rows[rows.length - 1].remove();
      } else {
        alert('Cannot remove the last row');
      }
    });

    const keyGrid = document.getElementById('keyGrid');
    document.getElementById('addKIrow').addEventListener('click', () => {
      const tbody = keyGrid.tBodies[0];
      const rows = tbody.querySelectorAll('tr').length;
      const i = rows + 1;
      const tr = document.createElement('tr');
      tr.innerHTML = Array.from({
        length: 7
      }, (_, c) => `<td><div class="cell" contenteditable="true" data-pos="KI-${i}-${c+1}"></div></td>`).join('');
      tbody.appendChild(tr);
    });

    document.getElementById('removeKIrow').addEventListener('click', () => {
      const tbody = keyGrid.tBodies[0];
      const rows = tbody.querySelectorAll('tr');
      if (rows.length > 1) {
        rows[rows.length - 1].remove();
      } else {
        alert('Cannot remove the last row');
      }
    });

    const mediaGrid = document.getElementById('mediaGrid');
    document.getElementById('addMediaRow').addEventListener('click', () => {
      const tbody = mediaGrid.tBodies[0];
      const rows = tbody.querySelectorAll('tr').length;
      const i = rows + 1;
      const tr = document.createElement('tr');
      tr.innerHTML = Array.from({
        length: 4
      }, (_, c) => `<td><div class="cell" contenteditable="true" data-pos="M-${i}-${c+1}"></div></td>`).join('');
      tbody.appendChild(tr);
    });

    document.getElementById('removeMediaRow').addEventListener('click', () => {
      const tbody = mediaGrid.tBodies[0];
      const rows = tbody.querySelectorAll('tr');
      if (rows.length > 1) {
        rows[rows.length - 1].remove();
      } else {
        alert('Cannot remove the last row');
      }
    });

    function attachGoalHandlers(wrapper, isTask = false) {
      const mark = wrapper.querySelector('.goal-mark');
      if (mark) {
        mark.onclick = (e) => {
          e.stopPropagation();
          toggleMark(mark);
        };
        mark.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            toggleMark(mark);
          }
        };
      }

      const addNoteBtn = wrapper.querySelector('.small-add-note');
      if (addNoteBtn && !addNoteBtn._addNoteSetup) {
        addNoteBtn._addNoteSetup = true;
        addNoteBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const detailsEl = wrapper.querySelector('.goal-details');
          const ulEl = detailsEl.querySelector('ul');
          const newLi = document.createElement('li');
          newLi.contentEditable = 'true';
          newLi.setAttribute('data-placeholder', 'Optional note');
          ulEl.appendChild(newLi);
          if (detailsEl.classList.contains('hidden')) {
            detailsEl.classList.remove('hidden');
          }
          attachRemoveNoteHandler(newLi);
          setTimeout(() => newLi.focus(), 50);
        };
      }

      const removeNoteBtn = wrapper.querySelector('.small-remove-note');
      if (removeNoteBtn && !removeNoteBtn._removeNoteSetup) {
        removeNoteBtn._removeNoteSetup = true;
        removeNoteBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const detailsEl = wrapper.querySelector('.goal-details');
          const ulEl = detailsEl.querySelector('ul');
          const items = ulEl.querySelectorAll('li');
          if (items.length > 0) {
            items[items.length - 1].remove();
          } else {
            alert('No notes to remove');
          }
        };
      }

      const removeBtn = wrapper.querySelector('.small-remove');
      if (removeBtn && !removeBtn._removeSetup) {
        removeBtn._removeSetup = true;
        removeBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (confirm('Remove this item?')) wrapper.remove();
        };
      }

      wrapper.querySelectorAll('li').forEach(li => {
        attachRemoveNoteHandler(li);
      });

      wrapper.ondragstart = (e) => {
        e.dataTransfer.effectAllowed = 'move';
        wrapper.classList.add('dragging-item');
      };

      wrapper.ondragend = (e) => {
        wrapper.classList.remove('dragging-item');
        document.querySelectorAll('.goal-item').forEach(g => g.classList.remove('drag-over'));
      };

      wrapper.ondragover = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const list = wrapper.closest('.goals-list');
        if (list && list.querySelector('.dragging-item') !== wrapper) {
          wrapper.classList.add('drag-over');
        }
      };

      wrapper.ondragleave = (e) => {
        wrapper.classList.remove('drag-over');
      };

      wrapper.ondrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const list = wrapper.closest('.goals-list');
        const dragging = list.querySelector('.dragging-item');
        if (dragging && dragging !== wrapper) {
          wrapper.parentNode.insertBefore(dragging, wrapper);
        }
        wrapper.classList.remove('drag-over');
      };
    }

    function attachRemoveNoteHandler(li) {
      if (li._removeNoteHandlerSetup) return;
      li._removeNoteHandlerSetup = true;

      li.oncontextmenu = (e) => {
        e.preventDefault();
        if (confirm('Delete this note?')) {
          li.remove();
        }
      };
    }

    function toggleMark(markEl) {
      if (markEl.classList.contains('checked')) {
        markEl.classList.remove('checked');
        markEl.textContent = 'X';
      } else {
        markEl.classList.add('checked');
        markEl.textContent = '✔';
      }
    }

    function createGoalItem(text = '', mark = 'X', details = [], isTask = false) {
      const wrapper = document.createElement('div');
      wrapper.className = 'goal-item';
      wrapper.dataset.id = (isTask ? 't-' : 'g-') + Date.now();
      wrapper.draggable = true;
      const textClass = isTask ? 'task-text' : 'goal-text';
      const removeLabel = isTask ? 'Remove task' : 'Remove goal';
      const placeholder = isTask ? 'Example task — click and edit' : 'Example goal — click and edit';
      const div = document.createElement('div');
      div.className = textClass;
      div.contentEditable = 'true';
      div.setAttribute('data-placeholder', placeholder);
      if (text) {
        div.innerText = text;
      }

      const wrapper2 = document.createElement('div');
      wrapper2.className = 'goal-item-content';
      wrapper2.appendChild(div);

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
      wrapper2.appendChild(detailsDiv);

      const footerDiv = document.createElement('div');
      footerDiv.className = 'goal-item-footer';
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

      footerDiv.appendChild(footerTop);

      const footerBottom = document.createElement('div');
      footerBottom.className = 'goal-item-footer-bottom';
      const removeBtn = document.createElement('button');
      removeBtn.className = 'small-remove ghost';
      removeBtn.innerText = removeLabel;
      footerBottom.appendChild(removeBtn);
      footerDiv.appendChild(footerBottom);

      wrapper2.appendChild(footerDiv);

      const mark2 = document.createElement('div');
      mark2.className = 'goal-mark' + (mark === '✔' ? ' checked' : '');
      mark2.setAttribute('role', 'button');
      mark2.setAttribute('tabindex', '0');
      mark2.innerText = mark;

      wrapper.appendChild(mark2);
      wrapper.appendChild(wrapper2);

      attachGoalHandlers(wrapper, isTask);
      return wrapper;
    }

    document.getElementById('addGoalBtn').addEventListener('click', () => {
      document.getElementById('goalsList').appendChild(createGoalItem('', 'X', [], false));
    });

    document.getElementById('addTaskBtn').addEventListener('click', () => {
      document.getElementById('tasksList').appendChild(createGoalItem('', 'X', [], true));
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
      if (!confirm('Clear all editable fields?')) return;
      document.querySelectorAll('.cell').forEach(c => c.innerText = '');
      document.getElementById('districtInput').value = '';
      const goalsList = document.getElementById('goalsList');
      goalsList.innerHTML = '';
      goalsList.appendChild(createGoalItem('', 'X', [], false));
      const tasksList = document.getElementById('tasksList');
      tasksList.innerHTML = '';
      tasksList.appendChild(createGoalItem('', 'X', [], true));
    });

    function getDateStamp() {
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);
      return `${month}_${day}_${year}`;
    }

    const exportBtn = document.getElementById('exportBtn'),
      exportModal = document.getElementById('exportModal'),
      exportOutput = document.getElementById('exportOutput'),
      closeExport = document.getElementById('closeExport'),
      downloadExport = document.getElementById('downloadExport');

    function hideExportModal() {
      exportModal.classList.add('hidden');
      exportModal.setAttribute('aria-hidden', 'true');
    }

    function showExportModal() {
      exportModal.classList.remove('hidden');
      exportModal.setAttribute('aria-hidden', 'false');
    }

    exportBtn.addEventListener('click', () => {
      exportOutput.value = buildExportHtml();
      showExportModal();
    });

    closeExport.addEventListener('click', hideExportModal);

    downloadExport.addEventListener('click', async (e) => {
      e.preventDefault();
      const content = buildExportHtml();
      const districtName = (document.getElementById('districtInput').value || 'District').trim();
      const dateStamp = getDateStamp();
      const filename = `${districtName} District Council ${dateStamp}.html`;

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
          alert('File saved');
          hideExportModal();
          return;
        } catch (err) {
          console.warn('File Save API error', err);
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
        console.warn('Blob download failed', err);
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
        console.warn('Web Share failed', err);
      }

      const w = window.open();
      if (w) {
        w.document.open();
        w.document.write(content);
        w.document.close();
        alert('Export opened in new tab — save it from there.');
      } else {
        alert('Unable to download; copy the HTML from the export box.');
      }
    });

    function escapeHtml(s) {
      return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function buildExportHtml() {
      const districtName = (document.getElementById('districtInput').value || 'District').trim();
      const fullHeading = districtName ? `${districtName} District Council` : 'District Council';
      const css = `body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;margin:14px;background:#fff;color:#111;font-size:18px}.notice{font-weight:900;font-size:18px;text-align:center;margin-bottom:8px}.heading{font-weight:900;font-size:22px;text-align:center;margin-bottom:10px;text-decoration:underline}.divider{border-bottom:1px solid #000;margin:16px 0}.goals-section{margin-bottom:80px}.tasks-section{margin-top:80px}table{border-collapse:collapse;width:100%;table-layout:fixed;margin-bottom:12px;border:2px solid #000}table td{border:2px solid #000;padding:8px;vertical-align:middle;word-break:break-word}table td.schedule{text-align:left}table td.center{text-align:center;vertical-align:middle;height:68px;overflow:hidden}.title{font-weight:900;font-size:20px;margin:8px 0}.goal{margin-bottom:4px;font-weight:900;font-size:18px}.goal-notes{margin-left:20px;margin-top:-2px;font-weight:normal;padding-top:0px;margin-bottom:12px}.goal-notes li{margin:0px 0;}.watermark{font-size:0.75rem;color:#999;margin-top:20px;text-align:center}`;

      function gatherTableRows(selector) {
        const rows = Array.from(document.querySelectorAll(selector + ' tbody tr'));
        return rows.map(tr => Array.from(tr.querySelectorAll('td')).map(td => {
          const c = td.querySelector('.cell');
          return escapeHtml(c ? c.innerText.trim() : '');
        }));
      }

      const schedRows = gatherTableRows('#scheduleTable');
      let scheduleHtml = `<div class="divider"></div><div><div class="title">Schedule</div><table>` + schedRows.map(r => `<tr>${r.map(c=>`<td class="schedule">${c}</td>`).join('')}</tr>`).join('') + `</table></div>`;

      const keyRows = gatherTableRows('#keyGrid');
      let kiHtml = `<div class="divider"></div><div><div class="title">Key Indicators</div><table>` + keyRows.map(r => `<tr>${r.map(c=>`<td class="center">${c}</td>`).join('')}</tr>`).join('') + `</table></div>`;

      const mediaRows = gatherTableRows('#mediaGrid');
      let mHtml = `<div class="divider"></div><div><div class="title">Media Referrals</div><table>` + mediaRows.map(r => `<tr>${r.map(c=>`<td class="center">${c}</td>`).join('')}</tr>`).join('') + `</table></div>`;

      const goalsEls = Array.from(document.querySelectorAll('#goalsList .goal-item'));
      let goalsHtml = `<div class="goals-section"><div class="divider"></div><div><div class="title">Goals</div>` + goalsEls.map(g => {
        const markEl = g.querySelector('.goal-mark');
        const mark = markEl ? markEl.textContent : 'X';
        const textEl = g.querySelector('.goal-text');
        const text = textEl ? textEl.innerText.trim() : '';
        const detailsEl = g.querySelector('.goal-details');
        let detailsHTML = '';
        if (detailsEl && !detailsEl.classList.contains('hidden') && detailsEl.innerText.trim()) {
          const items = Array.from(detailsEl.querySelectorAll('li')).map(li => {
            let liText = li.innerText.trim();
            if (liText === 'Optional note') return '';
            return `<li>${escapeHtml(liText)}</li>`;
          }).filter(i => i).join('');
          if (items) detailsHTML = `<ul class="goal-notes">${items}</ul>`;
        }
        return `<div class="goal">${escapeHtml(mark)} ${escapeHtml(text === 'Example goal — click and edit' ? '' : text)}</div>${detailsHTML}`;
      }).join('') + `</div></div>`;

      const taskEls = Array.from(document.querySelectorAll('#tasksList .goal-item'));
      let tasksHtml = `<div class="tasks-section"><div><div class="title">Tasks</div>` + taskEls.map(t => {
        const markEl = t.querySelector('.goal-mark');
        const mark = markEl ? markEl.textContent : 'X';
        const textEl = t.querySelector('.task-text');
        const text = textEl ? textEl.innerText.trim() : '';
        const detailsEl = t.querySelector('.goal-details');
        let detailsHTML = '';
        if (detailsEl && !detailsEl.classList.contains('hidden') && detailsEl.innerText.trim()) {
          const items = Array.from(detailsEl.querySelectorAll('li')).map(li => {
            let liText = li.innerText.trim();
            if (liText === 'Optional note') return '';
            return `<li>${escapeHtml(liText)}</li>`;
          }).filter(i => i).join('');
          if (items) detailsHTML = `<ul class="goal-notes">${items}</ul>`;
        }
        return `<div class="goal">${escapeHtml(mark)} ${escapeHtml(text === 'Example task — click and edit' ? '' : text)}</div>${detailsHTML}`;
      }).join('') + `</div></div>`;

      const watermark = `<div class="watermark"><!-- By Ion-o-koji --><br><!-- By Olsen --></div>`;

      const full = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(fullHeading)} — Export</title><meta name="viewport" content="width=device-width,initial-scale=1"/><style>${css}</style></head><body><div class="notice">Rotate your phone to landscape</div><div class="heading">${escapeHtml(fullHeading)}</div>${scheduleHtml}${kiHtml}${mHtml}${goalsHtml}${tasksHtml}${watermark}</body></html>`;
      return full;
    }

    const importBtn = document.getElementById('importBtn'),
      fileImport = document.getElementById('fileImport');

    importBtn.addEventListener('click', () => fileImport.click());

    fileImport.addEventListener('change', async (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const text = await f.text();
      try {
        parseAndLoadHtml(text);
        alert(`Imported ${f.name}`);
      } catch (err) {
        console.error(err);
        alert('Import failed: ' + err.message);
      }
      fileImport.value = '';
    });

    function parseAndLoadHtml(htmlText) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');

      // Extract district name from heading or title
      const heading = doc.querySelector('.heading') || doc.querySelector('title');
      if (heading && heading.textContent.trim()) {
        const headingText = heading.textContent.trim();
        // Remove the "— Export" suffix if present
        const cleanName = headingText.replace(/\s*—\s*Export\s*$/, '').trim();

        // Extract just the district part (everything before " District Council")
        const districtMatch = cleanName.match(/^(.+?)\s+District\s+Council/i);
        const districtNameOnly = districtMatch ? districtMatch[1].trim() : cleanName;

        document.getElementById('siteName').innerText = cleanName;
        document.getElementById('districtInput').value = districtNameOnly;
      }

      function tableAfterTitleText(text) {
        const el = Array.from(doc.querySelectorAll('.title')).find(t => t.textContent.trim().toLowerCase().includes(text.toLowerCase()));
        if (!el) return null;
        let sib = el.nextElementSibling;
        while (sib && sib.tagName && sib.tagName.toLowerCase() !== 'table') sib = sib.nextElementSibling;
        return sib;
      }

      let scheduleTableParsed = tableAfterTitleText('Schedule') || doc.querySelector('table');
      if (scheduleTableParsed) loadParsedTableIntoLocal(scheduleTableParsed, '#scheduleTable');

      const keyParsed = tableAfterTitleText('Key Indicators');
      if (keyParsed) loadParsedTableIntoLocal(keyParsed, '#keyGrid');

      let mediaParsed = tableAfterTitleText('Media Referrals');
      if (!mediaParsed && keyParsed) {
        let s = keyParsed.nextElementSibling;
        while (s && s.tagName && s.tagName.toLowerCase() !== 'table') s = s.nextElementSibling;
        mediaParsed = s;
      }
      if (!mediaParsed) {
        const allTables = Array.from(doc.querySelectorAll('table'));
        if (allTables.length >= 3) mediaParsed = allTables[2];
      }
      if (mediaParsed) loadParsedTableIntoLocal(mediaParsed, '#mediaGrid');

      // Parse goals with better note extraction
      const goalTitle = Array.from(doc.querySelectorAll('.title')).find(t => /goals?/i.test(t.textContent));
      let goalEls = [];
      if (goalTitle) {
        let s = goalTitle.nextElementSibling;
        while (s) {
          if (s.classList && s.classList.contains('goal')) goalEls.push(s);
          const inside = s.querySelectorAll && s.querySelectorAll('.goal');
          if (inside && inside.length) goalEls.push(...inside);
          if (s.classList && s.classList.contains('tasks-section')) break;
          s = s.nextElementSibling;
        }
      }
      if (goalEls.length === 0) {
        // Fallback: find all .goal elements before tasks section
        const allGoals = Array.from(doc.querySelectorAll('.goal'));
        goalEls = allGoals.slice(0, Math.ceil(allGoals.length / 2));
      }

      const goalsList = document.getElementById('goalsList');
      goalsList.innerHTML = '';
      if (goalEls && goalEls.length) {
        goalEls.forEach(g => {
          const text = g.textContent.replace(/^[\s✔X\u2713\u2715]+/, '').trim();
          const raw = g.textContent.trim();
          const markChar = raw[0] && (raw[0] === '✔' || raw[0] === 'X' || raw[0] === '✓') ? raw[0] : 'X';

          // Extract notes from following ul.goal-notes
          let details = [];
          let nextEl = g.nextElementSibling;
          if (nextEl && nextEl.classList && nextEl.classList.contains('goal-notes')) {
            details = Array.from(nextEl.querySelectorAll('li')).map(li => li.textContent.trim()).filter(Boolean);
          }

          const item = createGoalItem(text, markChar, details, false);
          goalsList.appendChild(item);
        });
      }
      if (goalsList.children.length === 0) {
        goalsList.appendChild(createGoalItem('', 'X', [], false));
      }

      // Parse tasks with better note extraction
      const taskTitle = Array.from(doc.querySelectorAll('.title')).find(t => /tasks?/i.test(t.textContent));
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
      if (taskEls.length === 0) {
        // Fallback: find all .goal elements after halfway point
        const allGoals = Array.from(doc.querySelectorAll('.goal'));
        taskEls = allGoals.slice(Math.ceil(allGoals.length / 2));
      }

      const tasksList = document.getElementById('tasksList');
      tasksList.innerHTML = '';
      if (taskEls && taskEls.length) {
        taskEls.forEach(t => {
          const text = t.textContent.replace(/^[\s✔X\u2713\u2715]+/, '').trim();
          const raw = t.textContent.trim();
          const markChar = raw[0] && (raw[0] === '✔' || raw[0] === 'X' || raw[0] === '✓') ? raw[0] : 'X';

          // Extract notes from following ul.goal-notes
          let details = [];
          let nextEl = t.nextElementSibling;
          if (nextEl && nextEl.classList && nextEl.classList.contains('goal-notes')) {
            details = Array.from(nextEl.querySelectorAll('li')).map(li => li.textContent.trim()).filter(Boolean);
          }

          const item = createGoalItem(text, markChar, details, true);
          tasksList.appendChild(item);
        });
      }
      if (tasksList.children.length === 0) {
        tasksList.appendChild(createGoalItem('', 'X', [], true));
      }
    }

    function loadParsedTableIntoLocal(parsedTable, localSelector) {
      const localTable = document.querySelector(localSelector);
      if (!localTable) return;
      const parsedRows = Array.from(parsedTable.querySelectorAll('tr'));
      const tbody = localTable.tBodies[0] || localTable.appendChild(document.createElement('tbody'));
      tbody.innerHTML = '';
      parsedRows.forEach((pr) => {
        const tr = document.createElement('tr');
        const cells = Array.from(pr.querySelectorAll('td, th'));
        if (cells.length === 0) {
          const txt = pr.textContent || '';
          const parts = txt.split('\t').filter(Boolean);
          if (parts.length) parts.forEach(p => tr.appendChild(tdCell(p)));
        } else {
          cells.forEach((pc) => tr.appendChild(tdCell(pc.innerText || pc.textContent || '')));
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

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const active = document.activeElement;
        if (active && active.isContentEditable) {
          e.preventDefault();
          const edits = Array.from(document.querySelectorAll('[contenteditable="true"]'));
          const idx = edits.indexOf(active);
          const next = edits[(idx + 1) % edits.length];
          if (next) next.focus();
        }
      }
    });

    function initializeGoalsAndTasks() {
      const goalsList = document.getElementById('goalsList');
      if (goalsList.children.length === 0) {
        goalsList.appendChild(createGoalItem('', 'X', [], false));
      }

      const tasksList = document.getElementById('tasksList');
      if (tasksList.children.length === 0) {
        tasksList.appendChild(createGoalItem('', 'X', [], true));
      }
    }

    initializeGoalsAndTasks();
    showPage('mainPage');

    (() => {
      const ENTRY = 'District Council Schedule Maker v15',
        KEY = 'Ion-o-koji Watermark';
      const logs = (localStorage.getItem(KEY) || "").split('\n').map(line => line.replace(/^- /, '').trim()).filter(line => line && line !== ENTRY);
      logs.push(ENTRY);
      localStorage.setItem(KEY, logs.map(item => `- ${item}`).join('\n'));
    })();

  
