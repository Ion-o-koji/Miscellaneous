
    const STARTING_LIFE = 40;
    const LOCAL_STORAGE_KEY = 'mtgCommanderState';
    let playerCount = 2;
    let playerStates = [];
    let artHistory = [];
    let currentArtPlayerId = null;
    let activeEditorPlayerId = null;

    let longPressTimer;
    let adjustTimer = null;
    let adjustDidLongPress = false;

    // Base Opponent Tray Colors (Matches primary theme backgrounds slightly lightened for distinction)
    const OPPONENT_TRAY_COLORS = ['#133866', '#541515', '#124d1e', '#665918'];

    function saveGameState() {
      const stateToSave = {
        playerCount: playerCount,
        playerStates: playerStates,
        artHistory: artHistory
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    }

    function loadGameState() {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState);
          playerCount = parsedState.playerCount || 2;
          artHistory = parsedState.artHistory || [];

          playerStates = parsedState.playerStates.map(p => {
            if (!p.trackers) p.trackers = {
              commander: true,
              poison: false,
              energy: false,
              experience: false,
              mana: false
            };
            if (!p.counters) p.counters = {
              poison: 0,
              energy: 0,
              experience: 0,
              mana: {
                w: 0,
                u: 0,
                b: 0,
                r: 0,
                g: 0,
                c: 0
              }
            };
            return p;
          });

          document.getElementById('player-count-select').value = playerCount;
          buildUI(playerCount);
          updateDisplay();
          return true;
        } catch (e) {
          console.error("Failed to load saved game state", e);
        }
      }
      return false;
    }

    function toggleFullScreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.log(err.message));
      } else if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }

    function toggleSettingsModal() {
      const modal = document.getElementById('settings-modal');
      if (modal.classList.contains('hidden')) {
        const select = document.getElementById('tracker-player-select');
        select.innerHTML = '';
        for (let i = 0; i < playerCount; i++) {
          select.innerHTML += `<option value="${i}">Player ${i+1}</option>`;
        }
        updateTrackerCheckboxes();
      }
      modal.classList.toggle('hidden');
      document.getElementById('art-modal').classList.add('hidden');
      document.getElementById('counter-modal').classList.add('hidden');
    }

    function updateTrackerCheckboxes() {
      const pid = parseInt(document.getElementById('tracker-player-select').value);
      if (isNaN(pid) || !playerStates[pid]) return;
      const t = playerStates[pid].trackers;
      document.getElementById('toggle-commander').checked = t.commander;
      document.getElementById('toggle-poison').checked = t.poison;
      document.getElementById('toggle-energy').checked = t.energy;
      document.getElementById('toggle-experience').checked = t.experience;
      document.getElementById('toggle-mana').checked = t.mana;
    }

    function toggleTracker(type) {
      const pid = parseInt(document.getElementById('tracker-player-select').value);
      if (isNaN(pid) || !playerStates[pid]) return;
      playerStates[pid].trackers[type] = document.getElementById(`toggle-${type}`).checked;
      updateDisplay();
    }

    function promptForArt(playerId, event) {
      event.stopPropagation();
      currentArtPlayerId = playerId;
      document.getElementById('art-set').value = '';
      document.getElementById('art-num').value = '';
      updateArtHistoryUI();
      document.getElementById('settings-modal').classList.add('hidden');
      document.getElementById('counter-modal').classList.add('hidden');
      document.getElementById('art-modal').classList.remove('hidden');
    }

    function closeArtModal() {
      document.getElementById('art-modal').classList.add('hidden');
      currentArtPlayerId = null;
    }

    function applyNewArt() {
      const setCode = document.getElementById('art-set').value.trim().toLowerCase();
      const collectorNum = document.getElementById('art-num').value.trim().toLowerCase();
      if (!setCode || !collectorNum) return alert("Please provide set code and collector number.");

      const url = `https://api.scryfall.com/cards/${setCode}/${collectorNum}?format=image&version=art_crop`;
      if (!artHistory.some(item => item.url === url)) {
        artHistory.unshift({
          setCode,
          collectorNum,
          url,
          starred: false
        });
        pruneHistory();
        saveGameState();
      }
      setPlayerArt(url);
    }

    function toggleStar(index, event) {
      event.stopPropagation();
      artHistory[index].starred = !artHistory[index].starred;
      pruneHistory();
      saveGameState();
      updateArtHistoryUI();
    }

    function pruneHistory() {
      if (artHistory.length > 12) {
        for (let i = artHistory.length - 1; i >= 0; i--) {
          if (!artHistory[i].starred) {
            artHistory.splice(i, 1);
            break;
          }
        }
      }
    }

    function applyHistoryArt(url) {
      setPlayerArt(url);
    }

    function clearArt() {
      setPlayerArt(null);
    }

    function setPlayerArt(url) {
      if (currentArtPlayerId !== null) {
        playerStates[currentArtPlayerId].bgUrl = url;
        updateDisplay();
      }
      closeArtModal();
    }

    function updateArtHistoryUI() {
      const listEl = document.getElementById('art-history-list');
      listEl.innerHTML = '';
      if (artHistory.length === 0) {
        listEl.innerHTML = '<div style="opacity: 0.5; text-align: center; font-size: 3.5vmin; grid-column: span 2; padding: 20px;">No saved art presets found.</div>';
        return;
      }
      artHistory.forEach((art, index) => {
        const card = document.createElement('div');
        card.className = 'history-card-item';
        card.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.5)), url('${art.url}')`;
        card.onclick = () => applyHistoryArt(art.url);

        const star = document.createElement('div');
        star.className = `star-badge ${art.starred ? 'starred' : ''}`;
        star.innerHTML = '★';
        star.onclick = (e) => toggleStar(index, e);

        const label = document.createElement('div');
        label.className = 'history-card-info';
        label.textContent = `${art.setCode.toUpperCase()} #${art.collectorNum}`;

        card.appendChild(star);
        card.appendChild(label);
        listEl.appendChild(card);
      });
    }

    /* --- Counter Editor Logic --- */
    function openCounterModal(playerId, event) {
      event.stopPropagation();
      activeEditorPlayerId = playerId;
      document.getElementById('counter-modal-title').textContent = `P${playerId + 1} Counters`;
      renderCounterEditor();
      document.getElementById('settings-modal').classList.add('hidden');
      document.getElementById('art-modal').classList.add('hidden');
      document.getElementById('counter-modal').classList.remove('hidden');
    }

    function closeCounterModal() {
      document.getElementById('counter-modal').classList.add('hidden');
      activeEditorPlayerId = null;
    }

    function renderCounterEditor() {
      if (activeEditorPlayerId === null) return;
      const pId = activeEditorPlayerId;
      const player = playerStates[pId];
      const listEl = document.getElementById('counter-editor-list');
      let html = '';

      const createRow = (label, argsDown, argsUp) => `
                <div class="editor-row">
                    <button class="editor-btn" 
                        onmousedown="startAdjust(${argsDown}, event)" onmouseup="endAdjust(event)" onmouseleave="endAdjust(event)"
                        ontouchstart="startAdjust(${argsDown}, event)" ontouchend="endAdjust(event)">−</button>
                    <div class="editor-label">${label}</div>
                    <button class="editor-btn" 
                        onmousedown="startAdjust(${argsUp}, event)" onmouseup="endAdjust(event)" onmouseleave="endAdjust(event)"
                        ontouchstart="startAdjust(${argsUp}, event)" ontouchend="endAdjust(event)">+</button>
                </div>
            `;

      if (player.trackers.commander) {
        player.damage.forEach((dmg, oppId) => {
          if (pId !== oppId) {
            html += createRow(`🗡️ P${oppId+1} Dmg: <strong>${dmg}</strong>`, `${pId}, 'cmd', ${oppId}, -1`, `${pId}, 'cmd', ${oppId}, 1`);
          }
        });
      }
      if (player.trackers.poison) html += createRow(`☠️ Poison: <strong>${player.counters.poison}</strong>`, `${pId}, 'misc', 'poison', -1`, `${pId}, 'misc', 'poison', 1`);
      if (player.trackers.energy) html += createRow(`⚡ Energy: <strong>${player.counters.energy}</strong>`, `${pId}, 'misc', 'energy', -1`, `${pId}, 'misc', 'energy', 1`);
      if (player.trackers.experience) html += createRow(`🌟 Experience: <strong>${player.counters.experience}</strong>`, `${pId}, 'misc', 'experience', -1`, `${pId}, 'misc', 'experience', 1`);

      if (player.trackers.mana) {
        const m = player.counters.mana;
        const colors = [{
            k: 'w',
            sym: '☀️',
            name: 'White'
          }, {
            k: 'u',
            sym: '💧',
            name: 'Blue'
          }, {
            k: 'b',
            sym: '💀',
            name: 'Black'
          },
          {
            k: 'r',
            sym: '🔥',
            name: 'Red'
          }, {
            k: 'g',
            sym: '🌳',
            name: 'Green'
          }, {
            k: 'c',
            sym: '💎',
            name: 'Colorless'
          }
        ];
        colors.forEach(c => {
          html += createRow(`${c.sym} ${c.name}: <strong>${m[c.k]}</strong>`, `${pId}, 'mana', '${c.k}', -1`, `${pId}, 'mana', '${c.k}', 1`);
        });
      }

      if (html === '') html = '<div style="text-align:center; opacity:0.6; padding: 20px;">No trackers enabled.<br>Enable them in Settings ⚙️</div>';
      listEl.innerHTML = html;
    }

    function startAdjust(playerId, type, subType, amount, e) {
      if (e && e.type === 'touchstart') e.preventDefault();
      adjustDidLongPress = false;

      doActualAdjust(playerId, type, subType, amount);
      renderCounterEditor();

      adjustTimer = setTimeout(() => {
        adjustDidLongPress = true;
        doActualAdjust(playerId, type, subType, amount * 9);
        renderCounterEditor();

        adjustTimer = setInterval(() => {
          doActualAdjust(playerId, type, subType, amount * 10);
          renderCounterEditor();
        }, 400);
      }, 600);
    }

    function endAdjust(e) {
      if (e && e.type === 'touchend') e.preventDefault();
      clearTimeout(adjustTimer);
      clearInterval(adjustTimer);
    }

    function doActualAdjust(playerId, type, subType, amount) {
      if (type === 'cmd') adjustCommanderDamage(playerId, subType, amount);
      else if (type === 'misc') adjustMisc(playerId, subType, amount);
      else if (type === 'mana') adjustMana(playerId, subType, amount);
    }

    /* --- UI Building & Core Logic --- */
    function createPlayerCard(playerId) {
      return `
                <div class="player-card player-${playerId}" data-player-id="${playerId}">
                    <button class="action-icon-btn art-btn" onclick="promptForArt(${playerId}, event)" title="Set Card Art">🎨</button>
                    <button class="action-icon-btn edit-counters-btn" onclick="openCounterModal(${playerId}, event)" title="Edit Counters">🧮</button>
                    
                    <div class="life-main-area">
                        <div class="life-half life-subtract" data-player-id="${playerId}" data-amount="-1"
                             ontouchstart="handleTouchStart(event)" ontouchend="handleTouchEnd(event)"
                             onmousedown="handleTouchStart(event)" onmouseup="handleTouchEnd(event)" onmouseleave="handleTouchEnd(event)">
                             <div class="guide-hint">−</div>
                        </div>
                        <div class="life-half life-add" data-player-id="${playerId}" data-amount="1"
                             ontouchstart="handleTouchStart(event)" ontouchend="handleTouchEnd(event)"
                             onmousedown="handleTouchStart(event)" onmouseup="handleTouchEnd(event)" onmouseleave="handleTouchEnd(event)">
                             <div class="guide-hint">+</div>
                        </div>
                        <p class="life-total" id="life-${playerId}">${STARTING_LIFE}</p>
                    </div>
                    
                    <div class="bottom-tray-container">
                        <div class="floating-trackers" id="trackers-${playerId}">
                            </div>
                        
                        <div class="cmd-damage-tray" id="cmd-tray-${playerId}">
                            </div>
                    </div>
                </div>
            `;
    }

    function buildUI(count) {
      playerCount = count;
      const grid = document.getElementById('player-grid');
      grid.innerHTML = '';
      document.body.className = `players-${count}`;

      for (let i = 0; i < playerCount; i++) grid.innerHTML += createPlayerCard(i);

      for (let i = 0; i < Math.ceil(playerCount / 2); i++) {
        const card = document.querySelector(`.player-card[data-player-id="${i}"]`);
        if (card) card.classList.add('rotated');
      }
      for (let i = Math.ceil(playerCount / 2); i < playerCount; i++) {
        const card = document.querySelector(`.player-card[data-player-id="${i}"]`);
        if (card) card.classList.remove('rotated');
      }
    }

    function setupGame(count) {
      playerStates = [];
      for (let i = 0; i < count; i++) {
        playerStates.push({
          life: STARTING_LIFE,
          damage: new Array(count).fill(0),
          eliminated: false,
          bgUrl: null,
          trackers: {
            commander: true,
            poison: false,
            energy: false,
            experience: false,
            mana: false
          },
          counters: {
            poison: 0,
            energy: 0,
            experience: 0,
            mana: {
              w: 0,
              u: 0,
              b: 0,
              r: 0,
              g: 0,
              c: 0
            }
          }
        });
      }
      buildUI(count);
      updateDisplay();
    }

    function handleTouchStart(e) {
      if (e.type === 'touchstart') e.preventDefault();
      const half = e.currentTarget;
      const playerId = parseInt(half.dataset.playerId);
      const amount = parseInt(half.dataset.amount);

      adjustLife(playerId, amount);
      longPressTimer = setTimeout(() => {
        for (let i = 0; i < 9; i++) adjustLife(playerId, amount);
      }, 500);
    }

    function handleTouchEnd(e) {
      clearTimeout(longPressTimer);
    }

    function updateDisplay() {
      playerStates.forEach((player, i) => {
        const lifeEl = document.getElementById(`life-${i}`);
        if (!lifeEl) return;
        lifeEl.textContent = player.life;

        const cardEl = lifeEl.closest('.player-card');
        const commanderDamageLethal = player.damage.some(dmg => dmg >= 21);
        const poisonLethal = player.counters.poison >= 10;
        cardEl.classList.toggle('eliminated', player.life <= 0 || commanderDamageLethal || poisonLethal);

        cardEl.style.backgroundImage = player.bgUrl ?
          `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.8)), url('${player.bgUrl}')` :
          '';

        // Build Classic Commander Tray HTML
        const cmdTray = document.getElementById(`cmd-tray-${i}`);
        if (player.trackers.commander) {
          let cmdHTML = '';
          player.damage.forEach((dmg, oppId) => {
            if (i !== oppId) {
              let lethalCls = dmg >= 21 ? 'lethal' : '';
              let bgColor = OPPONENT_TRAY_COLORS[oppId] || '#333';
              cmdHTML += `
                                <div class="cmd-box ${lethalCls}" style="background-color: ${bgColor}" 
                                     onclick="adjustCommanderDamage(${i}, ${oppId}, 1, event)" 
                                     oncontextmenu="adjustCommanderDamage(${i}, ${oppId}, -1, event)">
                                    <span class="cmd-label">P${oppId+1}</span> ${dmg}
                                </div>
                            `;
            }
          });
          cmdTray.innerHTML = cmdHTML;
          cmdTray.style.display = 'flex';
        } else {
          cmdTray.innerHTML = '';
          cmdTray.style.display = 'none';
        }

        // Build Floating Symbols Trackers HTML (Misc)
        let trackersHTML = '';
        if (player.trackers.poison) {
          let cls = player.counters.poison >= 10 ? 'dmg-lethal' : '';
          trackersHTML += `<div class="floating-badge ${cls}" onclick="adjustMisc(${i}, 'poison', 1, event)" oncontextmenu="adjustMisc(${i}, 'poison', -1, event)">☠️ ${player.counters.poison}</div>`;
        }
        if (player.trackers.energy) {
          trackersHTML += `<div class="floating-badge" onclick="adjustMisc(${i}, 'energy', 1, event)" oncontextmenu="adjustMisc(${i}, 'energy', -1, event)">⚡ ${player.counters.energy}</div>`;
        }
        if (player.trackers.experience) {
          trackersHTML += `<div class="floating-badge" onclick="adjustMisc(${i}, 'experience', 1, event)" oncontextmenu="adjustMisc(${i}, 'experience', -1, event)">🌟 ${player.counters.experience}</div>`;
        }
        if (player.trackers.mana) {
          const m = player.counters.mana;
          const colors = [{
            k: 'w',
            s: '☀️'
          }, {
            k: 'u',
            s: '💧'
          }, {
            k: 'b',
            s: '💀'
          }, {
            k: 'r',
            s: '🔥'
          }, {
            k: 'g',
            s: '🌳'
          }, {
            k: 'c',
            s: '💎'
          }];
          colors.forEach(c => {
            if (m[c.k] > 0 || Object.values(m).every(v => v === 0)) {
              trackersHTML += `<div class="floating-badge" onclick="adjustMana(${i}, '${c.k}', 1, event)" oncontextmenu="adjustMana(${i}, '${c.k}', -1, event)">${c.s} ${m[c.k]}</div>`;
            }
          });
        }

        const trackersContainer = document.getElementById(`trackers-${i}`);
        if (trackersContainer) trackersContainer.innerHTML = trackersHTML;
      });

      saveGameState();
      if (activeEditorPlayerId !== null) renderCounterEditor();
    }

    function adjustLife(playerId, amount) {
      if (playerStates[playerId].eliminated) return;
      playerStates[playerId].life = Math.max(-99, playerStates[playerId].life + amount);
      updateDisplay();
    }

    function adjustCommanderDamage(playerId, opponentId, amount, e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (playerStates[playerId].eliminated) return;
      const oldDmg = playerStates[playerId].damage[opponentId];
      let newDmg = Math.max(0, oldDmg + amount);
      playerStates[playerId].damage[opponentId] = newDmg;
      if (newDmg - oldDmg !== 0) {
        playerStates[playerId].life = Math.max(-99, playerStates[playerId].life - (newDmg - oldDmg));
      }
      updateDisplay();
    }

    function adjustMisc(playerId, type, amount, e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (playerStates[playerId].eliminated) return;
      playerStates[playerId].counters[type] = Math.max(0, playerStates[playerId].counters[type] + amount);
      updateDisplay();
    }

    function adjustMana(playerId, color, amount, e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (playerStates[playerId].eliminated) return;
      playerStates[playerId].counters.mana[color] = Math.max(0, playerStates[playerId].counters.mana[color] + amount);
      updateDisplay();
    }

    function resetGame() {
      if (window.confirm(`Start a new game?\nCard art backgrounds and tracker settings will be kept.`)) {
        playerStates.forEach(player => {
          player.life = STARTING_LIFE;
          player.damage = new Array(playerCount).fill(0);
          player.eliminated = false;
          player.counters = {
            poison: 0,
            energy: 0,
            experience: 0,
            mana: {
              w: 0,
              u: 0,
              b: 0,
              r: 0,
              g: 0,
              c: 0
            }
          };
        });
        updateDisplay();
      }
    }

    document.addEventListener('DOMContentLoaded', () => {
      if (!loadGameState()) setupGame(2);
    });

    (() => {
      const ENTRY = 'MTG Life Counter v6',
        KEY = 'Ion-o-koji Watermark';
      const logs = (localStorage.getItem(KEY) || "").split('\n').map(line => line.replace(/^- /, '').trim()).filter(line => line && line !== ENTRY);
      logs.push(ENTRY);
      localStorage.setItem(KEY, logs.map(item => `- ${item}`).join('\n'));
    })();

  
