
    var DEFAULT_VIEWS = {
      main: {
        name: "Sacrament Attendance",
        categories: [{
            id: "sacrament",
            label: "Sacrament"
          },
          {
            id: "eq",
            label: "Elders Quorum (EQ)"
          },
          {
            id: "rs",
            label: "Relief Society (RS)"
          },
          {
            id: "ym",
            label: "Young Men's (YM)"
          },
          {
            id: "yw",
            label: "Young Women's (YW)"
          },
          {
            id: "primary",
            label: "Primary"
          }
        ]
      },
      secondary: {
        name: "KI's / Custom",
        categories: [{
            id: "rc",
            label: "Recent Converts (RC)"
          },
          {
            id: "tf",
            label: "Teaching Friends (TF)"
          }
        ]
      }
    };

    var activeView = "main";
    var locked = false;
    var todaySunday = getSundayStr(new Date());
    var currentDate = todaySunday;
    var views = deepClone(DEFAULT_VIEWS);
    var hist = {};

    var _catIdCounter = 0;

    function newCatId() {
      return "cat-" + Date.now() + "-" + (++_catIdCounter);
    }

    loadState();

    renderFace("main");
    renderFace("secondary");
    updateHeader();
    renderTotal();

    function localYMD(d) {
      var y = d.getFullYear();
      var m = String(d.getMonth() + 1).padStart(2, "0");
      var day = String(d.getDate()).padStart(2, "0");
      return y + "-" + m + "-" + day;
    }

    function getSundayStr(d) {
      var copy = new Date(d);
      copy.setDate(copy.getDate() - copy.getDay());
      return localYMD(copy);
    }

    function prevSunday(str) {
      var d = new Date(str + "T12:00:00");
      d.setDate(d.getDate() - 7);
      return getSundayStr(d);
    }

    function nextSunday(str) {
      var d = new Date(str + "T12:00:00");
      d.setDate(d.getDate() + 7);
      return getSundayStr(d);
    }

    function fmtDate(str) {
      var d = new Date(str + "T12:00:00");
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    }

    function fmtDateShort(str) {
      var d = new Date(str + "T12:00:00");
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    }

    function getCounts(date, viewId) {
      return (hist[date] && hist[date][viewId]) ? hist[date][viewId] : {};
    }

    function setCount(date, viewId, catId, val) {
      if (!hist[date]) hist[date] = {};
      if (!hist[date][viewId]) hist[date][viewId] = {};
      hist[date][viewId][catId] = val;
      saveState();
    }

    function getCount(date, viewId, catId) {
      return (getCounts(date, viewId)[catId]) || 0;
    }

    function viewTotal(date, viewId) {
      var cats = views[viewId] ? views[viewId].categories : [];
      var c = getCounts(date, viewId);
      return cats.reduce(function(s, cat) {
        return s + (c[cat.id] || 0);
      }, 0);
    }

    function isRowLocked(viewId, catId) {
      if (locked) return true;
      var cats = views[viewId] ? views[viewId].categories : [];
      for (var i = 0; i < cats.length; i++) {
        if (cats[i].id === catId) return !!cats[i].locked;
      }
      return false;
    }

    function catLockSvg(isLocked) {
      if (isLocked) {
        return '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
      }
      return '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 6.63-4.95"/></svg>';
    }

    function toggleCatLock(viewId, catId) {
      var cats = views[viewId] ? views[viewId].categories : [];
      for (var i = 0; i < cats.length; i++) {
        if (cats[i].id === catId) {
          cats[i].locked = !cats[i].locked;
          saveState();
          var row = document.getElementById("row-" + viewId + "-" + catId);
          if (row) row.className = "counter-row" + (isRowLocked(viewId, catId) ? " locked" : "");
          var btn = document.getElementById("clk-" + viewId + "-" + catId);
          if (btn) {
            btn.classList.toggle("cat-locked", !!cats[i].locked);
            btn.title = cats[i].locked ? "Unlock row" : "Lock row";
            btn.innerHTML = catLockSvg(cats[i].locked);
          }
          var spBtn = document.getElementById("sp-clk-" + viewId + "-" + catId);
          if (spBtn) {
            spBtn.classList.toggle("cat-item-locked", !!cats[i].locked);
            spBtn.title = cats[i].locked ? "Unlock row" : "Lock row";
            spBtn.innerHTML = catLockSvg(cats[i].locked);
          }
          showToast(cats[i].locked ? esc(cats[i].label) + " locked" : esc(cats[i].label) + " unlocked");
          return;
        }
      }
    }

    function renderFace(viewId) {
      var face = document.getElementById("face-" + viewId);
      face.innerHTML = "";
      var cats = views[viewId] ? views[viewId].categories : [];
      cats.forEach(function(cat) {
        var isLocked = isRowLocked(viewId, cat.id);
        var row = document.createElement("div");
        row.className = "counter-row" + (isLocked ? " locked" : "");
        row.id = "row-" + viewId + "-" + cat.id;

        var count = getCount(currentDate, viewId, cat.id);
        row.innerHTML =
          '<span class="sym minus">&minus;</span>' +
          '<div class="center-block">' +
          '<div class="cat-label">' + esc(cat.label) + '</div>' +
          '<div class="count-display" id="cnt-' + viewId + '-' + cat.id + '">' + count + '</div>' +
          '<button class="cat-lock-btn' + (cat.locked ? ' cat-locked' : '') + '" id="clk-' + viewId + '-' + cat.id + '" title="' + (cat.locked ? 'Unlock row' : 'Lock row') + '">' +
          catLockSvg(cat.locked) +
          '</button>' +
          '</div>' +
          '<span class="sym plus">+</span>' +
          '<div class="divider"></div>' +
          '<div class="lock-overlay">' +
          '<svg class="lock-icon-sm" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
          '</div>';

        var lockBtn = row.querySelector(".cat-lock-btn");
        (function(vid, cid) {
          lockBtn.addEventListener("touchstart", function(e) {
            e.stopPropagation();
          }, {
            passive: true
          });
          lockBtn.addEventListener("touchend", function(e) {
            e.stopPropagation();
            e.preventDefault();
            toggleCatLock(vid, cid);
          }, {
            passive: false
          });
          lockBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            toggleCatLock(vid, cid);
          });
        })(viewId, cat.id);

        (function(vid, cid) {
          var tapped = false;
          var holdTimer = null;
          var holdFired = false;
          var startX = 0,
            startY = 0;

          row.addEventListener("touchstart", function(e) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            holdFired = false;
            holdTimer = setTimeout(function() {
              holdFired = true;
              openNumpad(vid, cid);
            }, 500);
          }, {
            passive: true
          });

          row.addEventListener("touchmove", function(e) {
            if (!holdTimer) return;
            var dx = e.touches[0].clientX - startX;
            var dy = e.touches[0].clientY - startY;
            if (Math.sqrt(dx * dx + dy * dy) > 10) {
              clearTimeout(holdTimer);
              holdTimer = null;
            }
          }, {
            passive: true
          });

          row.addEventListener("touchend", function(e) {
            clearTimeout(holdTimer);
            holdTimer = null;
            if (holdFired) {
              holdFired = false;
              tapped = true;
              setTimeout(function() {
                tapped = false;
              }, 400);
              e.preventDefault();
              return;
            }
            if (isRowLocked(vid, cid)) return;
            var t = e.changedTouches[0];
            var rect = row.getBoundingClientRect();
            var isRight = (t.clientX - rect.left) >= rect.width / 2;
            spawnRipple(row, t, isRight);
            change(vid, cid, isRight ? 1 : -1);
            tapped = true;
            setTimeout(function() {
              tapped = false;
            }, 400);
            e.preventDefault();
          }, {
            passive: false
          });

          row.addEventListener("touchcancel", function() {
            clearTimeout(holdTimer);
            holdTimer = null;
          }, {
            passive: true
          });

          row.addEventListener("click", function(e) {
            if (isRowLocked(vid, cid) || tapped) return;
            var rect = row.getBoundingClientRect();
            var isRight = (e.clientX - rect.left) >= rect.width / 2;
            spawnRipple(row, e, isRight);
            change(vid, cid, isRight ? 1 : -1);
          });
        })(viewId, cat.id);

        face.appendChild(row);
      });
    }

    function change(viewId, catId, delta) {
      var cur = getCount(currentDate, viewId, catId);
      var val = Math.max(0, cur + delta);
      setCount(currentDate, viewId, catId, val);
      var el = document.getElementById("cnt-" + viewId + "-" + catId);
      if (el) {
        el.textContent = val;
        el.classList.remove("bump");
        void el.offsetWidth;
        el.classList.add("bump");
      }
      renderTotal();
      if (document.getElementById("settings-overlay").classList.contains("open")) {
        renderHistorySection();
      }
    }

    function flipView() {
      activeView = (activeView === "main") ? "secondary" : "main";
      document.getElementById("flip-inner").classList.toggle("flipped", activeView === "secondary");
      saveState();
      updateHeader();
      renderTotal();
    }

    function updateHeader() {
      var v = views[activeView];
      document.getElementById("title-text").textContent = v ? v.name : "Attendance";
      document.getElementById("title-sub").textContent = activeView === "main" ?
        "Tap to switch view \u2194" :
        "\u2194 Tap to switch view";
    }

    function firstRowTotal(date, viewId) {
      var cats = views[viewId] ? views[viewId].categories : [];
      if (!cats.length) return 0;
      return getCount(date, viewId, cats[0].id);
    }

    function restRowsTotal(date, viewId) {
      var cats = views[viewId] ? views[viewId].categories : [];
      var s = 0;
      for (var i = 1; i < cats.length; i++) s += getCount(date, viewId, cats[i].id);
      return s;
    }

    function renderTotal() {
      var cats = views[activeView] ? views[activeView].categories : [];
      var v1 = firstRowTotal(currentDate, activeView);
      var v2 = restRowsTotal(currentDate, activeView);

      var lbl1, lbl2;
      if (activeView === "main") {
        lbl1 = "Sacrament Attendance";
        lbl2 = "Classes Attendance";
      } else {
        lbl1 = cats.length > 0 ? cats[0].label : "First Row";
        lbl2 = "Classes";
      }

      var l1 = document.getElementById("total-label-1");
      var l2 = document.getElementById("total-label-2");
      var t1 = document.getElementById("total-sacrament");
      var t2 = document.getElementById("total-classes");
      if (l1) l1.textContent = lbl1;
      if (l2) l2.textContent = lbl2;
      if (t1) t1.textContent = v1;
      if (t2) t2.textContent = v2;
    }

    function toggleLock() {
      locked = !locked;
      if (!locked) {
        ["main", "secondary"].forEach(function(vid) {
          var cats = views[vid] ? views[vid].categories : [];
          cats.forEach(function(cat) {
            cat.locked = false;
          });
        });
      }
      saveState();
      ["main", "secondary"].forEach(function(vid) {
        var cats = views[vid] ? views[vid].categories : [];
        cats.forEach(function(cat) {
          var row = document.getElementById("row-" + vid + "-" + cat.id);
          if (row) row.className = "counter-row" + (isRowLocked(vid, cat.id) ? " locked" : "");
          var btn = document.getElementById("clk-" + vid + "-" + cat.id);
          if (btn) {
            btn.classList.remove("cat-locked");
            btn.innerHTML = catLockSvg(false);
            btn.title = "Lock row";
          }
        });
      });
      showToast(locked ? "All rows locked" : "All rows unlocked");
      var tog = document.getElementById("lock-toggle-input");
      if (tog) tog.checked = locked;
      renderCatsSection();
    }

    function openSettings() {
      renderSettings();
      document.getElementById("settings-overlay").classList.add("open");
    }

    function closeSettings() {
      document.getElementById("settings-overlay").classList.remove("open");
    }

    function overlayClick(e) {
      if (e.target === document.getElementById("settings-overlay")) closeSettings();
    }

    function renderSettings() {
      var body = document.getElementById("sp-body");
      body.innerHTML = "";

      var ds = mkSection("Date");
      var nav = document.createElement("div");
      nav.className = "date-nav";
      nav.innerHTML =
        '<button class="date-nav-btn" onclick="shiftDate(-1)">\u2039</button>' +
        '<div id="date-display" style="flex:1;text-align:center">' + dateLabelHTML(currentDate) + '</div>' +
        '<button class="date-nav-btn" onclick="shiftDate(1)">\u203a</button>';
      ds.appendChild(nav);
      body.appendChild(ds);

      var ls = mkSection("Lock Mode");
      var tr = document.createElement("div");
      tr.className = "toggle-row";
      tr.innerHTML =
        '<div><div class="toggle-row-label">Lock All Taps</div>' +
        '<div class="toggle-row-sub">Turning off also clears per-row locks</div></div>' +
        '<label class="toggle-switch">' +
        '<input type="checkbox" id="lock-toggle-input" onchange="toggleLock()"' + (locked ? ' checked' : '') + '>' +
        '<div class="toggle-track"></div>' +
        '</label>';
      ls.appendChild(tr);
      body.appendChild(ls);

      var dts = mkSection("Data");
      var btnRow = document.createElement("div");
      btnRow.className = "data-btn-row";
      var exportBtn = document.createElement("button");
      exportBtn.className = "data-btn";
      exportBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export CSV';
      exportBtn.addEventListener("click", exportCSV);
      var importBtn = document.createElement("button");
      importBtn.className = "data-btn import-btn";
      importBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Import CSV';
      importBtn.addEventListener("click", importCSV);
      btnRow.appendChild(exportBtn);
      btnRow.appendChild(importBtn);
      dts.appendChild(btnRow);
      body.appendChild(dts);

      var rs = mkSection("Reset");
      var resetRow = document.createElement("div");
      resetRow.className = "data-btn-row";

      var resetViewBtn = document.createElement("button");
      resetViewBtn.className = "data-btn";
      resetViewBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg> Reset This View';
      resetViewBtn.style.cssText = "border-color:rgba(255,79,79,0.3);color:#ff7070;";
      resetViewBtn.addEventListener("click", function() {
        var viewName = views[activeView] ? views[activeView].name : "this view";
        if (!confirm("Reset all counts for \"" + viewName + "\" on " + fmtDateShort(currentDate) + "?\n\nThis only affects the currently visible date.")) return;
        var cats = views[activeView] ? views[activeView].categories : [];
        cats.forEach(function(cat) {
          setCount(currentDate, activeView, cat.id, 0);
        });
        renderFace(activeView);
        renderTotal();
        renderHistorySection();
        showToast("View reset for " + fmtDateShort(currentDate));
      });

      var resetAllBtn = document.createElement("button");
      resetAllBtn.className = "data-btn";
      resetAllBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg> Clear All Data';
      resetAllBtn.style.cssText = "border-color:rgba(255,79,79,0.45);color:#ff5050;background:rgba(255,79,79,0.08);";
      resetAllBtn.addEventListener("click", function() {
        if (!confirm("\u26A0\uFE0F Delete ALL attendance history for every date and both views?\n\nThis cannot be undone.")) return;
        if (!confirm("Are you absolutely sure? Every week of recorded data will be permanently erased.")) return;
        hist = {};
        saveState();
        ["main", "secondary"].forEach(function(v) {
          renderFace(v);
        });
        renderTotal();
        renderHistorySection();
        showToast("All data cleared");
      });

      resetRow.appendChild(resetViewBtn);
      resetRow.appendChild(resetAllBtn);
      rs.appendChild(resetRow);
      body.appendChild(rs);

      var label = views[activeView] ? views[activeView].name : "Current View";
      var cs = mkSection("Categories \u2014 " + label);
      cs.id = "cats-section";
      renderCatsSection(cs);
      body.appendChild(cs);

      var chs = mkSection("Chart \u2014 " + (views[activeView] ? views[activeView].name : ""));
      renderChart(chs);
      body.appendChild(chs);

      var hs = mkSection("History");
      hs.id = "history-section";
      body.appendChild(hs);
      renderHistorySection();
    }

    function mkSection(title) {
      var sec = document.createElement("div");
      sec.className = "sp-section";
      var lbl = document.createElement("div");
      lbl.className = "sp-section-label";
      lbl.textContent = title;
      sec.appendChild(lbl);
      return sec;
    }

    function renderCatsSection(container) {
      container = container || document.getElementById("cats-section");
      if (!container) return;
      var lbl = container.querySelector(".sp-section-label");
      container.innerHTML = "";
      if (lbl) container.appendChild(lbl);

      var viewId = activeView;
      var isSecondary = (viewId === "secondary");
      var cats = views[viewId] ? views[viewId].categories : [];

      var list = document.createElement("div");
      list.className = "cat-list";

      cats.forEach(function(cat, idx) {
        var item = document.createElement("div");
        item.className = "cat-item";

        var lockBtn = document.createElement("button");
        lockBtn.className = "cat-item-lock" + (cat.locked ? " cat-item-locked" : "");
        lockBtn.id = "sp-clk-" + viewId + "-" + cat.id;
        lockBtn.title = cat.locked ? "Unlock row" : "Lock row";
        lockBtn.innerHTML = catLockSvg(cat.locked);
        (function(cid) {
          lockBtn.addEventListener("click", function() {
            toggleCatLock(viewId, cid);
          });
        })(cat.id);

        item.appendChild(lockBtn);

        if (isSecondary) {
          var input = document.createElement("input");
          input.className = "cat-item-input";
          input.value = cat.label;
          input.placeholder = "Category name";
          (function(i) {
            var save = function() {
              var v = input.value.trim();
              if (v && v !== views[viewId].categories[i].label) {
                views[viewId].categories[i].label = v;
                saveState();
                renderFace(viewId);
              }
            };
            input.addEventListener("change", save);
            input.addEventListener("blur", save);
          })(idx);

          var del = document.createElement("button");
          del.className = "cat-delete";
          del.innerHTML = "&times;";
          del.title = "Delete";
          (function(i) {
            del.addEventListener("click", function() {
              if (views[viewId].categories.length <= 1) {
                showToast("Need at least one category");
                return;
              }
              views[viewId].categories.splice(i, 1);
              saveState();
              renderFace(viewId);
              renderCatsSection();
              renderTotal();
            });
          })(idx);

          item.appendChild(input);
          item.appendChild(del);
        } else {
          var labelEl = document.createElement("span");
          labelEl.className = "cat-item-label";
          labelEl.textContent = cat.label;
          item.appendChild(labelEl);
        }

        list.appendChild(item);
      });

      container.appendChild(list);

      if (isSecondary) {
        var addBtn = document.createElement("button");
        addBtn.className = "cat-add-btn";
        addBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add category';
        addBtn.addEventListener("click", function() {
          var newId = newCatId();
          views[viewId].categories.push({
            id: newId,
            label: "New",
            locked: false
          });
          saveState();
          renderFace(viewId);
          renderCatsSection();
          setTimeout(function() {
            var inputs = document.querySelectorAll(".cat-item-input");
            var last = inputs[inputs.length - 1];
            if (last) {
              last.focus();
              last.select();
            }
          }, 50);
        });
        container.appendChild(addBtn);
      }
    }

    function renderHistorySection() {
      var sec = document.getElementById("history-section");
      if (!sec) return;
      var label = sec.querySelector(".sp-section-label");
      sec.innerHTML = "";
      if (label) sec.appendChild(label);

      if (Object.keys(hist).length === 0) {
        var empty = document.createElement("div");
        empty.className = "history-empty";
        empty.textContent = "No history yet";
        sec.appendChild(empty);
        return;
      }

      var dates = {};
      dates[currentDate] = true;
      dates[todaySunday] = true;
      Object.keys(hist).forEach(function(d) {
        dates[d] = true;
      });

      var sorted = Object.keys(dates).sort().reverse().slice(0, 12);

      var list = document.createElement("div");
      list.className = "history-list";

      sorted.forEach(function(d) {
        var isCurrent = d === currentDate;
        var isToday = d === todaySunday;
        var item = document.createElement("div");
        item.className = "history-item" + (isCurrent ? " current-date" : "");

        var total = viewTotal(d, activeView);
        var badges = "";
        if (isToday) badges += ' <span class="today-badge">Today</span>';
        if (isCurrent) badges += ' <span style="font-size:11px;color:var(--accent);font-weight:700">&middot; viewing</span>';

        item.innerHTML =
          '<span class="history-date">' + fmtDateShort(d) + badges + '</span>' +
          '<span class="history-total">' + total + '</span>';

        (function(date) {
          item.addEventListener("click", function() {
            currentDate = date;
            saveState();
            ["main", "secondary"].forEach(function(vid) {
              var cats = views[vid] ? views[vid].categories : [];
              cats.forEach(function(cat) {
                var el = document.getElementById("cnt-" + vid + "-" + cat.id);
                if (el) el.textContent = getCount(currentDate, vid, cat.id);
              });
            });
            renderTotal();
            var dd = document.getElementById("date-display");
            if (dd) dd.innerHTML = dateLabelHTML(currentDate);
            renderHistorySection();
            showToast("Loaded " + fmtDateShort(date));
          });
        })(d);

        list.appendChild(item);
      });

      sec.appendChild(list);
    }

    function shiftDate(dir) {
      currentDate = dir < 0 ? prevSunday(currentDate) : nextSunday(currentDate);
      saveState();
      var dd = document.getElementById("date-display");
      if (dd) dd.innerHTML = dateLabelHTML(currentDate);
      ["main", "secondary"].forEach(function(vid) {
        var cats = views[vid] ? views[vid].categories : [];
        cats.forEach(function(cat) {
          var el = document.getElementById("cnt-" + vid + "-" + cat.id);
          if (el) el.textContent = getCount(currentDate, vid, cat.id);
        });
      });
      renderTotal();
      renderHistorySection();
    }

    function dateLabelHTML(str) {
      var isToday = str === todaySunday;
      return '<div style="font-size:14px;font-weight:600;color:var(--text)">' + fmtDate(str) + '</div>' +
        (isToday ? '<div style="font-size:11px;color:var(--accent);font-weight:700;margin-top:2px">Today</div>' : '');
    }

    function copyToClipboard() {
      var cats = views[activeView] ? views[activeView].categories : [];
      var lines = cats.map(function(c) {
        return String(getCount(currentDate, activeView, c.id));
      });
      var text = lines.join("\n");

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(onCopied, function() {
          fallbackCopy(text);
        });
      } else {
        fallbackCopy(text);
      }
    }

    function fallbackCopy(text) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;top:0;left:0;width:2em;height:2em;opacity:0;";
      ta.setAttribute("readonly", "");
      document.body.appendChild(ta);
      if (/ipad|iphone/i.test(navigator.userAgent)) {
        var r = document.createRange();
        r.selectNodeContents(ta);
        var s = window.getSelection();
        if (s) {
          s.removeAllRanges();
          s.addRange(r);
        }
        ta.setSelectionRange(0, 999999);
      } else {
        ta.select();
      }
      var ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (e) {}
      document.body.removeChild(ta);
      if (ok) {
        onCopied();
      } else {
        window.prompt("Copy this:", text);
      }
    }

    var copyTimer;

    function onCopied() {
      var btn = document.getElementById("copy-btn");
      var icon = document.getElementById("copy-icon");
      var label = document.getElementById("copy-label");
      btn.classList.add("copied");
      icon.innerHTML = '<polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
      label.textContent = "Copied!";
      showToast("Copied \u2014 paste into Sheets \u2713");
      clearTimeout(copyTimer);
      copyTimer = setTimeout(function() {
        btn.classList.remove("copied");
        icon.innerHTML = '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>';
        label.textContent = "Copy";
      }, 2500);
    }

    function spawnRipple(row, point, isRight) {
      var rect = row.getBoundingClientRect();
      var x = point.clientX - rect.left;
      var y = point.clientY - rect.top;
      var size = Math.max(rect.width, rect.height) * 1.4;
      var r = document.createElement("span");
      r.className = "ripple";
      r.style.cssText = "left:" + (x - size / 2) + "px;top:" + (y - size / 2) + "px;width:" + size + "px;height:" + size + "px;" +
        "background:" + (isRight ? "rgba(79,124,255,0.17)" : "rgba(255,79,79,0.17)") + ";";
      row.appendChild(r);
      var cleanup = function() {
        if (r.parentNode) r.parentNode.removeChild(r);
      };
      r.addEventListener("animationend", cleanup);
      setTimeout(cleanup, 500);
      row.classList.add(isRight ? "flash-plus" : "flash-minus");
      setTimeout(function() {
        row.classList.remove("flash-plus", "flash-minus");
      }, 260);
    }

    function saveState() {
      try {
        localStorage.setItem("att2-views", JSON.stringify(views));
        localStorage.setItem("att2-history", JSON.stringify(hist));
        localStorage.setItem("att2-date", currentDate);
        localStorage.setItem("att2-locked", locked ? "1" : "0");
        localStorage.setItem("att2-view", activeView);
      } catch (e) {}
    }

    function loadState() {
      try {
        var sv = localStorage.getItem("att2-views");
        if (sv) views = JSON.parse(sv);
        var sh = localStorage.getItem("att2-history");
        if (sh) hist = JSON.parse(sh);
        var sd = localStorage.getItem("att2-date");
        if (sd) currentDate = sd;
        if (currentDate < todaySunday) currentDate = todaySunday;
        locked = localStorage.getItem("att2-locked") === "1";
        var sav = localStorage.getItem("att2-view");
        if (sav === "secondary") {
          activeView = "secondary";
          var fi = document.getElementById("flip-inner");
          if (fi) {
            fi.style.transition = "none";
            fi.classList.add("flipped");
            fi.offsetWidth;
            fi.style.transition = "";
          }
        }
      } catch (e) {}
    }

    var toastTimer;

    function showToast(msg) {
      var t = document.getElementById("toast");
      t.textContent = msg;
      t.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function() {
        t.classList.remove("show");
      }, 2500);
    }

    function esc(s) {
      return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function deepClone(o) {
      return JSON.parse(JSON.stringify(o));
    }

    var numpadState = {
      viewId: null,
      catId: null,
      value: "0"
    };

    function openNumpad(viewId, catId) {
      if (isRowLocked(viewId, catId)) return;
      var cats = views[viewId] ? views[viewId].categories : [];
      var cat = null;
      for (var i = 0; i < cats.length; i++) {
        if (cats[i].id === catId) {
          cat = cats[i];
          break;
        }
      }
      var cur = getCount(currentDate, viewId, catId);
      numpadState.viewId = viewId;
      numpadState.catId = catId;
      numpadState.value = String(cur);
      document.getElementById("numpad-label").textContent = cat ? cat.label : "";
      document.getElementById("numpad-display").textContent = numpadState.value;
      document.getElementById("numpad-overlay").classList.add("open");
    }

    function closeNumpad() {
      document.getElementById("numpad-overlay").classList.remove("open");
      numpadState.viewId = null;
      numpadState.catId = null;
      numpadState.value = "0";
    }

    function numpadOverlayClick(e) {
      if (e.target === document.getElementById("numpad-overlay")) closeNumpad();
    }

    function numpadKey(key) {
      if (key === "back") {
        numpadState.value = numpadState.value.length > 1 ? numpadState.value.slice(0, -1) : "0";
      } else {
        if (numpadState.value !== "0" && numpadState.value.length >= 4) {
          var disp = document.getElementById("numpad-display");
          disp.classList.remove("numpad-shake");
          void disp.offsetWidth;
          disp.classList.add("numpad-shake");
          return;
        }
        numpadState.value = numpadState.value === "0" ? key : numpadState.value + key;
      }
      document.getElementById("numpad-display").textContent = numpadState.value;
    }

    function numpadConfirm() {
      var val = Math.max(0, parseInt(numpadState.value, 10) || 0);
      if (numpadState.viewId && numpadState.catId) {
        setCount(currentDate, numpadState.viewId, numpadState.catId, val);
        var el = document.getElementById("cnt-" + numpadState.viewId + "-" + numpadState.catId);
        if (el) {
          el.textContent = val;
          el.classList.remove("bump");
          void el.offsetWidth;
          el.classList.add("bump");
        }
        renderTotal();
        if (document.getElementById("settings-overlay").classList.contains("open")) renderHistorySection();
        showToast("Set to " + val);
      }
      closeNumpad();
    }

    function csvEscape(s) {
      s = String(s).replace(/[\r\n]/g, " ");
      if (s.search(/[,"]/) >= 0) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    }

    function buildCSV() {
      var allDates = {};
      Object.keys(hist).forEach(function(d) {
        allDates[d] = true;
      });
      allDates[currentDate] = true;
      var dates = Object.keys(allDates).sort();

      var rows = [];
      rows.push([""].concat(dates).map(csvEscape).join(","));

      ["main", "secondary"].forEach(function(vid) {
        var v = views[vid];
        if (!v) return;
        rows.push(csvEscape(v.name));
        v.categories.forEach(function(cat) {
          var row = [cat.label];
          dates.forEach(function(d) {
            row.push(getCount(d, vid, cat.id));
          });
          rows.push(row.map(csvEscape).join(","));
        });
        rows.push("");
      });
      return rows.join("\n");
    }

    function parseCsvText(text) {
      var lines = text.split(/\r?\n/);
      return lines.map(function(line) {
        var fields = [],
          field = "",
          inQ = false;
        for (var i = 0; i < line.length; i++) {
          var c = line[i];
          if (inQ) {
            if (c === '"') {
              if (line[i + 1] === '"') {
                field += '"';
                i++;
              } else inQ = false;
            } else field += c;
          } else {
            if (c === '"') inQ = true;
            else if (c === ',') {
              fields.push(field);
              field = "";
            } else field += c;
          }
        }
        fields.push(field);
        return fields;
      });
    }

    function applyCSVImport(text) {
      try {
        var rows = parseCsvText(text);
        if (rows.length < 2) {
          showToast("Invalid CSV");
          return;
        }
        var dates = rows[0].slice(1).map(function(d) {
          return d.trim();
        }).filter(Boolean);
        var curVid = null,
          catIdx = 0;
        for (var i = 1; i < rows.length; i++) {
          var row = rows[i];
          var first = (row[0] || "").trim();
          if (!first) continue;
          var isHeader = row.length === 1 || row.slice(1).every(function(c) {
            return !c.trim();
          });
          if (isHeader) {
            if (views.main && views.main.name === first) {
              curVid = "main";
              catIdx = 0;
            } else if (views.secondary && views.secondary.name === first) {
              curVid = "secondary";
              catIdx = 0;
            } else curVid = null;
            continue;
          }
          if (!curVid) continue;
          var cats = views[curVid].categories;
          var cat = null;
          var matchedByLabel = false;
          for (var c = 0; c < cats.length; c++) {
            if (cats[c].label === first) {
              cat = cats[c];
              matchedByLabel = true;
              break;
            }
          }
          if (!matchedByLabel) {
            if (catIdx < cats.length) cat = cats[catIdx];
          }
          catIdx++;
          if (!cat) continue;
          dates.forEach(function(d, di) {
            var v = parseInt(row[di + 1], 10);
            if (!isNaN(v) && v >= 0) setCount(d, curVid, cat.id, v);
          });
        }
        saveState();
        ["main", "secondary"].forEach(function(v) {
          renderFace(v);
        });
        renderTotal();
        renderHistorySection();
        showToast("Imported \u2713");
      } catch (e) {
        showToast("Import failed");
      }
    }

    async function exportCSV() {
      var text = buildCSV();
      var name = "attendance-" + localYMD(new Date()) + ".csv";
      if (window.showSaveFilePicker) {
        try {
          var fh = await window.showSaveFilePicker({
            suggestedName: name,
            types: [{
              description: "CSV",
              accept: {
                "text/csv": [".csv"]
              }
            }]
          });
          var w = await fh.createWritable();
          await w.write(text);
          await w.close();
          showToast("Exported \u2713");
          return;
        } catch (e) {
          if (e.name === "AbortError") return;
        }
      }
      var blob = new Blob([text], {
        type: "text/csv"
      });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(function() {
        URL.revokeObjectURL(url);
        a.remove();
      }, 1000);
      showToast("Downloaded \u2713");
    }

    async function importCSV() {
      if (window.showOpenFilePicker) {
        try {
          var [fh] = await window.showOpenFilePicker({
            types: [{
              description: "CSV",
              accept: {
                "text/csv": [".csv"],
                "text/plain": [".csv", ".txt"]
              }
            }]
          });
          var file = await fh.getFile();
          applyCSVImport(await file.text());
          return;
        } catch (e) {
          if (e.name === "AbortError") return;
        }
      }
      var inp = document.createElement("input");
      inp.type = "file";
      inp.accept = ".csv,text/csv";
      inp.addEventListener("change", function() {
        if (!inp.files[0]) return;
        var r = new FileReader();
        r.onload = function(ev) {
          applyCSVImport(ev.target.result);
        };
        r.onerror = function() {
          showToast("File read failed");
        };
        r.readAsText(inp.files[0]);
      });
      inp.click();
    }

    function renderChart(container) {
      var allDates = {};
      Object.keys(hist).forEach(function(d) {
        allDates[d] = true;
      });
      allDates[todaySunday] = true;
      allDates[currentDate] = true;
      var dates = Object.keys(allDates).sort();

      var pairs = [];
      dates.forEach(function(d) {
        var v1 = firstRowTotal(d, activeView);
        var v2 = restRowsTotal(d, activeView);
        if (v1 > 0 || v2 > 0 || d === todaySunday || d === currentDate) {
          pairs.push({
            d: d,
            v1: v1,
            v2: v2
          });
        }
      });

      if (pairs.length < 2) {
        var em = document.createElement("div");
        em.className = "chart-empty";
        em.textContent = pairs.length < 1 ? "No data yet" : "Record 2+ weeks to see the chart";
        container.appendChild(em);
        return;
      }

      var cats = views[activeView] ? views[activeView].categories : [];
      var lbl1 = activeView === "main" ? "Sacrament" : (cats.length > 0 ? cats[0].label : "First");
      var lbl2 = "Classes";

      var W = 280,
        H = 172,
        pL = 34,
        pR = 10,
        pT = 12,
        pB = 50;
      var cW = W - pL - pR,
        cH = H - pT - pB,
        n = pairs.length;
      var maxV = Math.max(1, Math.max.apply(null, pairs.map(function(p) {
        return Math.max(p.v1, p.v2);
      })));

      function xp(i) {
        return pL + (n < 2 ? cW / 2 : i / (n - 1) * cW);
      }

      function yp(v) {
        return pT + cH - (v / maxV * cH);
      }

      var pts1 = pairs.map(function(p, i) {
        return xp(i) + "," + yp(p.v1);
      }).join(" ");
      var pts2 = pairs.map(function(p, i) {
        return xp(i) + "," + yp(p.v2);
      }).join(" ");
      var area1 = pts1 + " " + xp(n - 1) + "," + (pT + cH) + " " + pL + "," + (pT + cH);
      var area2 = pts2 + " " + xp(n - 1) + "," + (pT + cH) + " " + pL + "," + (pT + cH);

      var step = Math.max(1, Math.ceil(n / 5));
      var xlbls = "";
      for (var i = 0; i < n; i += step) {
        var d2 = new Date(pairs[i].d + "T12:00:00");
        xlbls += '<text x="' + xp(i) + '" y="' + (pT + cH + 14) + '" fill="#8890b0" font-size="9" text-anchor="middle">' +
          (d2.getMonth() + 1) + "/" + d2.getDate() + "</text>";
      }

      var ylbls = [0, Math.round(maxV / 2), maxV].map(function(v) {
        return '<text x="' + (pL - 5) + '" y="' + (yp(v) + 3) + '" fill="#8890b0" font-size="9" text-anchor="end">' + v + "</text>";
      }).join("");

      var dots = "";
      pairs.forEach(function(p, i) {
        var isC = p.d === currentDate,
          isT = p.d === todaySunday;
        var r = (isC || isT) ? 4.5 : 3,
          op = (isC || isT) ? 1 : 0.7;
        dots += '<circle cx="' + xp(i) + '" cy="' + yp(p.v1) + '" r="' + r + '" fill="#4f7cff" opacity="' + op + '"/>';
        dots += '<circle cx="' + xp(i) + '" cy="' + yp(p.v2) + '" r="' + r + '" fill="#3ecf8e" opacity="' + op + '"/>';
      });

      var ly = pT + cH + 30;
      var cx = W / 2;
      var l1short = lbl1.length > 12 ? lbl1.slice(0, 11) + "\u2026" : lbl1;
      var legend =
        '<rect x="' + (cx - 60) + '" y="' + (ly - 4) + '" width="8" height="8" rx="2" fill="#4f7cff"/>' +
        '<text x="' + (cx - 49) + '" y="' + (ly + 3) + '" fill="#8890b0" font-size="9">' + esc(l1short) + '</text>' +
        '<rect x="' + (cx + 18) + '" y="' + (ly - 4) + '" width="8" height="8" rx="2" fill="#3ecf8e"/>' +
        '<text x="' + (cx + 29) + '" y="' + (ly + 3) + '" fill="#8890b0" font-size="9">' + esc(lbl2) + '</text>';

      var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto">' +
        '<defs>' +
        '<linearGradient id="ag1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4f7cff" stop-opacity="0.25"/><stop offset="100%" stop-color="#4f7cff" stop-opacity="0"/></linearGradient>' +
        '<linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3ecf8e" stop-opacity="0.18"/><stop offset="100%" stop-color="#3ecf8e" stop-opacity="0"/></linearGradient>' +
        '</defs>' +
        '<line x1="' + pL + '" y1="' + (pT + cH) + '" x2="' + (pL + cW) + '" y2="' + (pT + cH) + '" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>' +
        '<line x1="' + pL + '" y1="' + yp(maxV / 2) + '" x2="' + (pL + cW) + '" y2="' + yp(maxV / 2) + '" stroke="rgba(255,255,255,0.05)" stroke-width="1" stroke-dasharray="3 3"/>' +
        '<polygon points="' + area2 + '" fill="url(#ag2)"/>' +
        '<polygon points="' + area1 + '" fill="url(#ag1)"/>' +
        '<polyline points="' + pts2 + '" fill="none" stroke="#3ecf8e" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
        '<polyline points="' + pts1 + '" fill="none" stroke="#4f7cff" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
        dots + ylbls + xlbls + legend + '</svg>';

      var wrap = document.createElement("div");
      wrap.className = "chart-wrap";
      wrap.innerHTML = svg;
      container.appendChild(wrap);
    }

    (() => {
      const ENTRY = 'Sacrament Attendance v4',
        KEY = 'Ion-o-koji Watermark';
      const logs = (localStorage.getItem(KEY) || "").split('\n').map(line => line.replace(/^- /, '').trim()).filter(line => line && line !== ENTRY);
      logs.push(ENTRY);
      localStorage.setItem(KEY, logs.map(item => `- ${item}`).join('\n'));
    })();

  
