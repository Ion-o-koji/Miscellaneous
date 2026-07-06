
    firebase.initializeApp({
      apiKey: "AIzaSyBXzgRojYdr9HF_qbsiMSkbu3psVxQ0h-8",
      authDomain: "delve-65f2c.firebaseapp.com",
      databaseURL: "https://delve-65f2c-default-rtdb.firebaseio.com/",
      projectId: "delve-65f2c",
      storageBucket: "delve-65f2c.firebasestorage.app",
      messagingSenderId: "303378998797",
      appId: "1:303378998797:web:77fc4e09b6d9643f29d744"
    });
    var fbDB = firebase.database();

    function getDevicePlayerId() {
      var pid = localStorage.getItem('scrytable_device_pid');
      if (!pid) {
        pid = 'dev_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        localStorage.setItem('scrytable_device_pid', pid);
      }
      return pid;
    }

    function genSessionPid() {
      return getDevicePlayerId() + '_' + Date.now().toString(36);
    }

    var G = {
      decks: [],
      screen: 'home',
      handCollapsed: false,
      _noSync: false,
      game: {
        roomCode: null,
        playerId: null,
        playerName: null,
        format: 'commander',
        deckId: null,
        players: {},
        myState: {
          library: [],
          hand: [],
          battlefield: [],
          graveyard: [],
          exile: [],
          command: [],
          life: 40,
          poison: 0,
          experience: 0,
          energy: 0,
          customCounters: {},
          commanderDamage: {},
          tokenTrackers: [],
          emblems: []
        },
        currentTurn: null,
        turnCycle: 1,
        startingLife: 40,
        isHost: false,
        maxPlayers: 4,
        mulligansLeft: 4
      },
      listeners: [],
      cachedPublicZones: {},
      zoomedCard: null,
      currentZone: 'battlefield',
      actionLog: [],
      chatMessages: [],
      chatUnread: 0,
      scryState: null,
      surveilState: null,
      rules: {
        sections: []
      },
      topRevealed: false,
      _cascadePending: null
    };

    function uid() {
      return Math.random().toString(36).slice(2) + Date.now().toString(36);
    }

    function shuffle(arr) {
      for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = arr[i];
        arr[i] = arr[j];
        arr[j] = t;
      }
      return arr;
    }
    // ── IndexedDB Storage ─────────────────────────────────────────
    var _idb = null;
    var IDB_NAME = 'scrytable_db';
    var IDB_VERSION = 1;
    var STORE_DECKS = 'decks';
    var STORE_BOARDSTATE = 'boardstate';
    var STORE_KV = 'kv';

    function openIDB() {
      return new Promise(function(resolve, reject) {
        if (_idb) {
          resolve(_idb);
          return;
        }
        var req = indexedDB.open(IDB_NAME, IDB_VERSION);
        req.onupgradeneeded = function(e) {
          var db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_DECKS)) db.createObjectStore(STORE_DECKS, {
            keyPath: 'id'
          });
          if (!db.objectStoreNames.contains(STORE_BOARDSTATE)) db.createObjectStore(STORE_BOARDSTATE, {
            keyPath: 'deckId'
          });
          if (!db.objectStoreNames.contains(STORE_KV)) db.createObjectStore(STORE_KV, {
            keyPath: 'k'
          });
        };
        req.onsuccess = function(e) {
          _idb = e.target.result;
          resolve(_idb);
        };
        req.onerror = function(e) {
          reject(e.target.error);
        };
      });
    }

    function idbGetAll(storeName) {
      return openIDB().then(function(db) {
        return new Promise(function(resolve, reject) {
          var tx = db.transaction(storeName, 'readonly');
          var req = tx.objectStore(storeName).getAll();
          req.onsuccess = function() {
            resolve(req.result);
          };
          req.onerror = function() {
            reject(req.error);
          };
        });
      });
    }

    function idbGet(storeName, key) {
      return openIDB().then(function(db) {
        return new Promise(function(resolve, reject) {
          var tx = db.transaction(storeName, 'readonly');
          var req = tx.objectStore(storeName).get(key);
          req.onsuccess = function() {
            resolve(req.result);
          };
          req.onerror = function() {
            reject(req.error);
          };
        });
      });
    }

    function idbPut(storeName, value) {
      return openIDB().then(function(db) {
        return new Promise(function(resolve, reject) {
          var tx = db.transaction(storeName, 'readwrite');
          var req = tx.objectStore(storeName).put(value);
          req.onsuccess = function() {
            resolve();
          };
          req.onerror = function() {
            reject(req.error);
          };
        });
      });
    }

    function idbDelete(storeName, key) {
      return openIDB().then(function(db) {
        return new Promise(function(resolve, reject) {
          var tx = db.transaction(storeName, 'readwrite');
          var req = tx.objectStore(storeName).delete(key);
          req.onsuccess = function() {
            resolve();
          };
          req.onerror = function() {
            reject(req.error);
          };
        });
      });
    }

    function idbPutAll(storeName, items) {
      return openIDB().then(function(db) {
        return new Promise(function(resolve, reject) {
          var tx = db.transaction(storeName, 'readwrite');
          var store = tx.objectStore(storeName);
          var pending = items.length;
          if (!pending) {
            resolve();
            return;
          }
          items.forEach(function(item) {
            var req = store.put(item);
            req.onsuccess = function() {
              if (--pending === 0) resolve();
            };
            req.onerror = function() {
              reject(req.error);
            };
          });
        });
      });
    }

    function idbClearStore(storeName) {
      return openIDB().then(function(db) {
        return new Promise(function(resolve, reject) {
          var tx = db.transaction(storeName, 'readwrite');
          var req = tx.objectStore(storeName).clear();
          req.onsuccess = function() {
            resolve();
          };
          req.onerror = function() {
            reject(req.error);
          };
        });
      });
    }

    function saveDecks() {
      var toSave = G.decks.map(function(d) {
        return Object.assign({}, d, {
          cards: d.cards.map(function(c) {
            var cc = Object.assign({}, c);
            delete cc.prices;
            return cc;
          })
        });
      });
      openIDB().then(function(db) {
        var tx = db.transaction(STORE_DECKS, 'readwrite');
        var store = tx.objectStore(STORE_DECKS);
        store.clear();
        toSave.forEach(function(d) {
          store.put(d);
        });
      }).catch(function(e) {
        toast('⚠ Failed to save decks: ' + e.message, 5000);
      });
    }

    function loadDecksAsync() {
      return idbGetAll(STORE_DECKS).then(function(decks) {
        G.decks = decks || [];
      });
    }

    // ── Legacy localStorage → IndexedDB deck recovery ────────────
    async function recoverLocalStorageDecks() {
      var raw = localStorage.getItem('scrytable_decks');
      var legacy = [];
      if (raw) {
        try {
          legacy = JSON.parse(raw);
        } catch (e) {
          legacy = [];
        }
        if (!Array.isArray(legacy)) legacy = [];
      }
      // Also scan for any individual deck keys like scrytable_deck_<id>
      Object.keys(localStorage).forEach(function(k) {
        if (k.startsWith('scrytable_deck_')) {
          try {
            var d = JSON.parse(localStorage.getItem(k));
            if (d && d.id && d.name) legacy.push(d);
          } catch (e) {}
        }
      });
      // Deduplicate by id
      var seen = new Set();
      legacy = legacy.filter(function(d) {
        if (!d || !d.id) return false;
        if (seen.has(d.id)) return false;
        seen.add(d.id);
        return true;
      });

      if (!legacy.length) {
        openModal('<div class="modal-title">&#128190; Recover Decks</div><div style="text-align:center;padding:1.25rem 0"><div style="font-size:2rem;opacity:.35">&#128263;</div><div style="margin-top:.6rem;font-size:.85rem">No legacy decks found in localStorage.</div><div style="font-size:.72rem;color:hsl(var(--muted-fg));margin-top:.4rem">Your decks are already safely stored in IndexedDB, or no older-format data exists on this device.</div></div><button class="btn w-full" onclick="closeModal()">Close</button>', '400px');
        return;
      }

      // Find which ones aren't already in IndexedDB
      var existingIds = new Set(G.decks.map(function(d) {
        return d.id;
      }));
      var newDecks = legacy.filter(function(d) {
        return !existingIds.has(d.id);
      });
      var dupDecks = legacy.filter(function(d) {
        return existingIds.has(d.id);
      });

      openModal(
        '<div class="modal-title">&#128190; Recover Legacy Decks</div>' +
        '<div style="font-size:.78rem;color:hsl(var(--muted-fg));margin-bottom:.75rem">Found <strong>' + legacy.length + '</strong> deck' + (legacy.length !== 1 ? 's' : '') + ' in localStorage.</div>' +
        '<div style="display:flex;flex-direction:column;gap:.35rem;max-height:220px;overflow-y:auto;margin-bottom:.85rem">' +
        legacy.map(function(d) {
          var isNew = !existingIds.has(d.id);
          return '<div style="display:flex;align-items:center;gap:.6rem;padding:.35rem .6rem;border-radius:7px;background:hsl(var(--muted))">' +
            '<span style="font-size:.78rem;flex:1;font-weight:600">' + escH(d.name || 'Untitled') + '</span>' +
            '<span style="font-size:.65rem;color:hsl(var(--muted-fg))">' + (d.cards ? d.cards.length : 0) + ' cards</span>' +
            '<span style="font-size:.65rem;padding:.12rem .4rem;border-radius:4px;font-weight:700;' + (isNew ? 'background:hsl(120 40% 22%);color:#7ecf7e' : 'background:hsl(var(--muted));color:hsl(var(--muted-fg))') + '">' + (isNew ? 'NEW' : 'Already saved') + '</span>' +
            '</div>';
        }).join('') +
        '</div>' +
        (newDecks.length ?
          '<button class="btn btn-gold w-full" id="ls-recover-btn">&#128229; Import ' + newDecks.length + ' new deck' + (newDecks.length !== 1 ? 's' : '') + ' into IndexedDB</button>' :
          '<div style="text-align:center;font-size:.8rem;color:hsl(var(--muted-fg));padding:.5rem">All found decks are already saved in IndexedDB.</div>'
        ) +
        '<button class="btn w-full" style="margin-top:.4rem" onclick="closeModal()">Close</button>',
        '460px'
      );

      if (newDecks.length) {
        document.getElementById('ls-recover-btn').addEventListener('click', async function() {
          try {
            newDecks.forEach(function(d) {
              if (!d.cards) d.cards = [];
              if (!d.categories) d.categories = [];
            });
            await idbPutAll(STORE_DECKS, newDecks);
            newDecks.forEach(function(d) {
              G.decks.push(d);
            });
            // Clean up localStorage now that migration succeeded
            localStorage.removeItem('scrytable_decks');
            newDecks.forEach(function(d) {
              localStorage.removeItem('scrytable_deck_' + d.id);
            });
            renderDeckList();
            updateLobbySelects();
            closeModal();
            toast('&#10003; ' + newDecks.length + ' deck' + (newDecks.length !== 1 ? 's' : '') + ' recovered into IndexedDB!', 3500);
          } catch (e) {
            toast('Recovery failed: ' + e.message, 4000);
          }
        });
      }
    }

    function saveName(n) {
      localStorage.setItem('scrytable_name', n);
    }

    function loadName() {
      return localStorage.getItem('scrytable_name') || '';
    }

    function isCommanderType(t) {
      t = t || '';
      return t.includes('Legendary') && (t.includes('Creature') || t.includes('Planeswalker'));
    }

    function isAuraType(t) {
      t = t || '';
      return t.includes('Aura');
    }

    function isEquipmentType(t) {
      t = t || '';
      return t.includes('Equipment');
    }

    function getCW() {
      return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cw')) || 88;
    }

    function getCH() {
      return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--ch')) || 123;
    }

    function escH(s) {
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function toArr(v) {
      if (!v) return [];
      if (Array.isArray(v)) return v;
      return Object.keys(v).sort(function(a, b) {
        return a - b;
      }).map(function(k) {
        return v[k];
      });
    }

    function logAction(text, player) {
      var now = new Date();
      var time = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      G.actionLog.unshift({
        time: time,
        player: player || G.game.playerName || '—',
        text: text
      });
      if (G.actionLog.length > 200) G.actionLog.length = 200;
    }

    function showScreen(name) {
      document.querySelectorAll('.screen').forEach(function(s) {
        s.classList.add('hidden');
      });
      var el = document.getElementById('screen-' + name);
      if (el) el.classList.remove('hidden');
      G.screen = name;
      document.getElementById('game-fab').style.display = name === 'game' ? 'flex' : 'none';
      if (name === 'decks') renderDeckList();
      if (name === 'lobby') initLobby();
    }

    function toast(msg, dur) {
      dur = dur || 2500;
      var tc = document.getElementById('toast-container');
      var t = document.createElement('div');
      t.className = 'toast';
      t.textContent = msg;
      tc.appendChild(t);
      setTimeout(function() {
        t.style.opacity = '0';
        t.style.transition = 'opacity .3s';
        setTimeout(function() {
          t.remove();
        }, 300);
      }, dur);
    }

    function openModal(html, maxW) {
      maxW = maxW || '500px';
      document.getElementById('modal-container').innerHTML =
        '<div class="modal-backdrop" onclick="closeModalBg(event)">' +
        '<div class="modal" style="max-width:' + maxW + '"><button class="modal-close" onclick="closeModal()">&#10005;</button>' + html + '</div></div>';
    }

    function closeModalBg(e) {
      if (e.target.classList.contains('modal-backdrop')) closeModal();
    }

    function closeModal() {
      // Cascade safety: if cascade cards were revealed and modal is closed without a button, shuffle all back
      if (G._cascadePending) {
        var cp = G._cascadePending;
        G._cascadePending = null;
        var all = cp.revealed.slice();
        if (cp.hit) all.push(cp.hit);
        for (var _i = all.length - 1; _i > 0; _i--) {
          var _j = Math.floor(Math.random() * (_i + 1));
          var _t = all[_i];
          all[_i] = all[_j];
          all[_j] = _t;
        }
        all.forEach(function(c) {
          cp.lib.push(c);
        });
        updateMyStats();
        syncPublicZones();
        syncPrivateState();
        toast('Cascade cancelled — ' + all.length + ' card' + (all.length !== 1 ? 's' : '') + ' shuffled back.', 3000);
      }
      document.getElementById('modal-container').innerHTML = '';
    }

    var _zoomFlipCard = null,
      _zoomFlipZone = null,
      _zoomOpenedAt = 0;

    function zoomCard(card, zone) {
      _zoomFlipCard = card;
      _zoomFlipZone = zone || null;
      var img = getCardDisplayImage(card) || card.image || null;
      var zoomEl = document.getElementById('card-zoom');
      var zoomImg = document.getElementById('zoom-img');
      var zoomName = document.getElementById('zoom-name');
      var flipWrap = document.getElementById('zoom-flip-wrap');
      zoomImg.src = img || '';
      zoomName.textContent = card.name || '';
      var _sfz = sfCache[card.name];
      if (_sfz && isDFC(_sfz)) {
        if (!card.isDFC) card.isDFC = true;
        if (!card.backImage) card.backImage = cardImg(_sfz, 1) || null;
      }
      flipWrap.style.display = (card.isDFC && !card.facedown) ? 'block' : 'none';
      document.getElementById('zoom-flip-btn').onclick = function() {
        if (!_zoomFlipCard || !_zoomFlipZone) return;
        var zc = _zoomFlipCard;
        flipCardFace(zc.id, _zoomFlipZone, function() {
          zoomImg.src = getCardDisplayImage(zc) || zc.image || '';
        });
      };
      zoomEl.classList.remove('hidden');
      _zoomOpenedAt = Date.now();
      zoomEl.onclick = function(e) {
        if (Date.now() - _zoomOpenedAt < 400) return;
        if (e.target === zoomEl || e.target === zoomImg) closeZoom();
      };
    }

    function closeZoom() {
      document.getElementById('card-zoom').classList.add('hidden');
      _zoomFlipCard = null;
      _zoomFlipZone = null;
    }

    var sfCache = {};
    async function fetchCard(name) {
      if (sfCache[name]) return sfCache[name];
      try {
        var r = await fetch('https://api.scryfall.com/cards/named?fuzzy=' + encodeURIComponent(name));
        if (!r.ok) return null;
        var c = await r.json();
        sfCache[name] = c;
        return c;
      } catch (e) {
        return null;
      }
    }

    // Batch-fetch up to 75 cards per request using Scryfall's collection endpoint.
    // Returns a map of { name → scryfall card object } for all found cards.
    // Falls back to individual fetchCard for anything not found in the batch.
    async function fetchCardsBatch(names) {
      var result = {};
      // Deduplicate and filter already cached
      var unique = [];
      names.forEach(function(n) {
        if (sfCache[n]) {
          result[n] = sfCache[n];
        } else if (unique.indexOf(n) < 0) {
          unique.push(n);
        }
      });
      if (!unique.length) return result;

      var CHUNK = 75;
      for (var i = 0; i < unique.length; i += CHUNK) {
        var chunk = unique.slice(i, i + CHUNK);
        try {
          var r = await fetch('https://api.scryfall.com/cards/collection', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              identifiers: chunk.map(function(n) {
                return {
                  name: n
                };
              })
            })
          });
          if (r.ok) {
            var body = await r.json();
            (body.data || []).forEach(function(c) {
              var key = c.name;
              sfCache[key] = c;
              result[key] = c;
            });
            // For not_found cards, try individual fuzzy fetch as fallback
            var notFound = (body.not_found || []).map(function(nf) {
              return nf.name;
            });
            for (var j = 0; j < notFound.length; j++) {
              var fallback = await fetchCard(notFound[j]);
              if (fallback) result[notFound[j]] = fallback;
            }
          }
        } catch (e) {
          console.warn('Batch fetch failed, falling back individually');
        }
        // Brief pause between batches to respect rate limits
        if (i + CHUNK < unique.length) await new Promise(function(res) {
          setTimeout(res, 100);
        });
      }

      // Any still missing: try individual fuzzy fetch (handles typos via fuzzy matching)
      for (var k = 0; k < unique.length; k++) {
        if (!result[unique[k]]) {
          var c2 = await fetchCard(unique[k]);
          if (c2) result[unique[k]] = c2;
        }
      }
      return result;
    }

    function cardImg(c, fi) {
      if (!c) return null;
      fi = fi || 0;
      if (c.card_faces && c.card_faces[fi] && c.card_faces[fi].image_uris) return c.card_faces[fi].image_uris.normal || c.card_faces[fi].image_uris.large;
      if (c.image_uris) return c.image_uris.normal || c.image_uris.large;
      return null;
    }

    var DFC_EXCLUDED = {
      split: 1,
      adventure: 1,
      aftermath: 1,
      flip: 1,
      leveler: 1
    };

    function isDFC(c) {
      if (!c || !c.card_faces || c.card_faces.length < 2) return false;
      if (!c.card_faces.some(function(f) {
          return f && f.image_uris;
        })) return false;
      if (c.layout && DFC_EXCLUDED[c.layout]) return false;
      return true;
    }

    function getCardDisplayImage(card) {
      if (!card || card.facedown) return null;
      if (card.isDFC && card.currentFace === 1 && card.backImage) return card.backImage;
      return card.image || null;
    }

    async function scryfallSearch() {
      var q = document.getElementById('home-scry-input');
      if (!q || !q.value.trim()) return;
      q = q.value.trim();
      var el = document.getElementById('home-scry-results');
      el.innerHTML = '<div class="flex items-center justify-center" style="padding:.5rem"><div class="spinner"></div></div>';
      try {
        var r = await fetch('https://api.scryfall.com/cards/search?q=' + encodeURIComponent(q) + '&limit=20');
        var data = await r.json();
        if (!data.data || !data.data.length) {
          el.innerHTML = '<div style="color:hsl(var(--muted-fg));font-size:.8rem;text-align:center;padding:.5rem">No results</div>';
          return;
        }
        var cards = data.data.slice(0, 10);
        el.innerHTML = cards.map(function(c) {
          var img = cardImg(c);
          return '<div class="scry-result">' + (img ? '<img src="' + img + '" loading="lazy"/>' : '<div style="width:48px;height:67px;background:hsl(var(--muted));border-radius:5px;display:flex;align-items:center;justify-content:center;color:var(--gold)">&#10022;</div>') +
            '<div class="scry-result-info"><div class="font-semibold text-sm truncate">' + escH(c.name) + '</div><div class="text-xs text-muted truncate">' + escH(c.type_line || '') + '</div><div class="text-xs text-muted">' + (c.mana_cost || '') + '</div></div></div>';
        }).join('');
        el.querySelectorAll('.scry-result').forEach(function(row, i) {
          row.addEventListener('click', function() {
            openCardInfo(cards[i]);
          });
        });
      } catch (e) {
        el.innerHTML = '<div style="color:hsl(var(--muted-fg));font-size:.8rem;text-align:center;padding:.5rem">Search failed</div>';
      }
    }

    function openCardInfo(c) {
      var img = cardImg(c, 0),
        back = cardImg(c, 1),
        cf = 0;
      var oText = c.oracle_text || (c.card_faces && c.card_faces[0] && c.card_faces[0].oracle_text) || '';
      var mc = c.mana_cost || (c.card_faces && c.card_faces[0] && c.card_faces[0].mana_cost) || '—';
      openModal(
        '<div class="modal-title">' + escH(c.name) + '</div>' +
        '<div class="flex gap-3" style="flex-wrap:wrap">' +
        (img ? '<div style="display:flex;flex-direction:column;gap:.4rem;align-items:center;flex-shrink:0"><img id="ci-face-img" src="' + img + '" style="width:145px;border-radius:9px"/>' + (back ? '<button class="btn btn-xs btn-gold" id="ci-flip-btn">&#8991; Flip</button>' : '') + '</div>' : '') +
        '<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:.3rem">' +
        '<div class="text-sm"><span class="text-muted">Type: </span>' + escH(c.type_line || '—') + '</div>' +
        '<div class="text-sm"><span class="text-muted">Mana: </span>' + mc + '</div>' +
        (c.power ? '<div class="text-sm"><span class="text-muted">P/T: </span>' + c.power + '/' + c.toughness + '</div>' : '') +
        (c.loyalty ? '<div class="text-sm"><span class="text-muted">Loyalty: </span>' + c.loyalty + '</div>' : '') +
        '<div class="text-sm"><span class="text-muted">Set: </span>' + escH(c.set_name || '—') + '</div>' +
        (c.prices && c.prices.usd ? '<div class="text-sm"><span class="text-muted">Price: </span>$' + c.prices.usd + '</div>' : '') +
        '</div></div>' +
        (oText ? '<div style="margin-top:.7rem;font-size:.8rem;line-height:1.65;background:hsl(var(--muted));border-radius:var(--radius);padding:.7rem">' + escH(oText).replace(/\n/g, '<br>') + '</div>' : '') +
        (c.flavor_text ? '<div style="margin-top:.45rem;font-size:.73rem;font-style:italic;color:hsl(var(--muted-fg))">' + escH(c.flavor_text) + '</div>' : '')
      );
      if (back) {
        var fb = document.getElementById('ci-flip-btn');
        if (fb) fb.addEventListener('click', function() {
          cf = cf === 0 ? 1 : 0;
          document.getElementById('ci-face-img').src = cf === 0 ? img : back;
        });
      }
    }

    // ── Add Card to Battlefield ───────────────────────────────────
    async function openAddCardToBattlefield() {
      closeModal();
      openModal(
        '<div class="modal-title">&#128270; Add Card to Battlefield</div>' +
        '<div class="flex flex-col gap-3">' +
        '<div class="flex gap-2"><input id="atbf-input" placeholder="Card name…" style="flex:1" onkeydown="if(event.key===\'Enter\')searchAtbf()" /><button class="btn btn-gold btn-xs" onclick="searchAtbf()">Search</button></div>' +
        '<div id="atbf-results"></div>' +
        '</div>',
        '460px'
      );
      document.getElementById('atbf-input').focus();
    }

    async function searchAtbf() {
      var q = (document.getElementById('atbf-input').value || '').trim();
      if (!q) return;
      var el = document.getElementById('atbf-results');
      el.innerHTML = '<div class="flex items-center justify-center" style="padding:.75rem"><div class="spinner"></div></div>';
      try {
        var r = await fetch('https://api.scryfall.com/cards/search?q=' + encodeURIComponent(q) + '&limit=10');
        var data = await r.json();
        if (!data.data || !data.data.length) {
          el.innerHTML = '<div style="color:hsl(var(--muted-fg));font-size:.8rem;text-align:center;padding:.5rem">No results</div>';
          return;
        }
        el.innerHTML = data.data.slice(0, 8).map(function(c, i) {
          var img = cardImg(c, 0);
          return '<div class="scry-result atbf-row" data-idx="' + i + '">' + (img ? '<img src="' + img + '" loading="lazy"/>' : '<div style="width:48px;height:67px;background:hsl(var(--muted));border-radius:5px;display:flex;align-items:center;justify-content:center;color:var(--gold)">&#10022;</div>') +
            '<div class="scry-result-info"><div class="font-semibold text-sm truncate">' + escH(c.name) + '</div><div class="text-xs text-muted truncate">' + escH(c.type_line || '') + '</div></div>' +
            '<button class="btn btn-xs btn-gold atbf-add" data-idx="' + i + '">Add</button></div>';
        }).join('');
        var cards = data.data.slice(0, 8);
        el.querySelectorAll('.atbf-add').forEach(function(btn) {
          btn.addEventListener('click', function() {
            var c = cards[parseInt(btn.dataset.idx)];
            var hasDFC = isDFC(c);
            var token = {
              id: uid(),
              name: c.name,
              image: cardImg(c, 0) || null,
              backImage: cardImg(c, 1) || null,
              isDFC: hasDFC,
              currentFace: 0,
              type: (c.type_line) || (c.card_faces && c.card_faces[0] && c.card_faces[0].type_line) || '',
              counters: {},
              facedown: false,
              attachedTo: null,
              attachments: [],
              tapped: false,
              bfPlaced: false,
              x: null,
              y: null
            };
            sfCache[c.name] = c;
            G.game.myState.battlefield.push(token);
            updateGameUI();
            switchZone('battlefield');
            sendAction('play_card', {
              cardName: c.name
            });
            logAction('Added ' + c.name + ' to battlefield');
            toast(c.name + ' added to battlefield!');
            closeModal();
          });
        });
      } catch (e) {
        el.innerHTML = '<div style="color:hsl(var(--muted-fg));font-size:.8rem;text-align:center;padding:.5rem">Search failed</div>';
      }
    }

    // ── Deck Import ───────────────────────────────────────────────
    function openImportDeckModal() {
      openModal(
        '<div class="modal-title">Import Deck</div>' +
        '<div class="flex flex-col gap-3">' +
        '<div><label>Deck Name</label><input id="imp-name" placeholder="My Commander Deck"/></div>' +
        '<div><label>Format</label><select id="imp-format"><option value="commander">Commander / EDH</option><option value="standard">Standard</option><option value="modern">Modern</option><option value="legacy">Legacy</option><option value="casual">Casual</option></select></div>' +
        '<div><label>Paste deck list (one card per line)</label><textarea id="import-deck-text" placeholder="1 Command Tower&#10;1 Sol Ring&#10;4 Lightning Bolt&#10;..."></textarea></div>' +
        '<button class="btn btn-gold" id="imp-btn" onclick="importDeck()">Import Deck</button>' +
        '</div>', '520px'
      );
    }

    async function importDeck() {
      var name = (document.getElementById('imp-name').value || '').trim() || 'Unnamed Deck';
      var format = document.getElementById('imp-format').value;
      var raw = (document.getElementById('import-deck-text').value || '').trim();
      if (!raw) {
        toast('Paste your deck list first');
        return;
      }
      var lines = raw.split('\n').map(function(l) {
        return l.trim();
      }).filter(function(l) {
        return l && !l.startsWith('//') && !l.startsWith('#');
      });
      var parsed = [];
      var isSb = false;
      for (var li = 0; li < lines.length; li++) {
        var line = lines[li];
        if (line.toLowerCase() === 'deck' || line.toLowerCase() === 'sideboard') {
          isSb = line.toLowerCase() === 'sideboard';
          continue;
        }
        var m = line.match(/^(\d+)\s+(.+?)(?:\s+\(\w+\)\s+\S+)?$/);
        if (m) parsed.push({
          qty: parseInt(m[1]),
          name: m[2].trim(),
          sideboard: isSb
        });
      }
      if (!parsed.length) {
        toast('Could not parse deck list');
        return;
      }
      var btn = document.getElementById('imp-btn');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Fetching cards…';
      }
      // Batch-fetch all cards in 1-2 requests instead of one per card
      var mainboardNames = parsed.filter(function(e) {
        return !e.sideboard;
      }).map(function(e) {
        return e.name;
      });
      var cardMap = await fetchCardsBatch(mainboardNames);
      if (btn) btn.textContent = 'Building deck…';
      // Build a lowercase lookup so minor name differences still resolve
      var cardMapLower = {};
      Object.keys(cardMap).forEach(function(k) {
        cardMapLower[k.toLowerCase()] = cardMap[k];
      });
      var cards = [];
      for (var pi = 0; pi < parsed.length; pi++) {
        var e = parsed[pi];
        if (e.sideboard) continue;
        var c = cardMap[e.name] || cardMapLower[e.name.toLowerCase()] || null;
        var hasDFC = c ? isDFC(c) : false;
        var typeLine = (c && c.type_line) || (c && c.card_faces && c.card_faces[0] && c.card_faces[0].type_line) || '';
        cards.push({
          name: e.name,
          qty: e.qty,
          image: c ? cardImg(c, 0) : null,
          backImage: c ? cardImg(c, 1) : null,
          isDFC: hasDFC,
          type: typeLine,
          cmc: (c && c.cmc) || 0,
          colors: (c && c.color_identity) || [],
          inCommandZone: false,
          prices: c && c.prices || null
        });
      }
      if (format === 'commander') {
        var cmd = cards.find(function(c) {
          return c.qty === 1 && isCommanderType(c.type);
        });
        if (cmd) cmd.inCommandZone = true;
      }
      cards.forEach(function(c) {
        c.category = getAutoCategory(c);
      });
      var deck = {
        id: Date.now().toString(),
        name: name,
        format: format,
        cards: cards,
        categories: [...DEFAULT_DECK_CATS],
        commander: null
      };
      var cmdCard = cards.find(function(c) {
        return c.inCommandZone && isCommanderType(c.type);
      });
      deck.commander = cmdCard ? cmdCard.name : null;
      G.decks.push(deck);
      saveDecks();
      closeModal();
      renderDeckList();
      updateLobbySelects();
      toast('"' + name + '" imported' + (deck.commander ? ' · Commander: ' + deck.commander : ''));
    }

    function deleteDeck(id) {
      if (!confirm('Delete this deck?')) return;
      G.decks = G.decks.filter(function(d) {
        return d.id !== id;
      });
      saveDecks();
      renderDeckList();
      updateLobbySelects();
      toast('Deck deleted');
    }

    // ── Deck Editor ───────────────────────────────────────────────
    var DEFAULT_DECK_CATS = ['Commander', 'Creatures', 'Instants', 'Sorceries', 'Enchantments', 'Artifacts', 'Planeswalkers', 'Lands', 'Other'];
    var DE = {
      deckId: null,
      inspectIdx: -1,
      overlap: -65
    };

    function getAutoCategory(card) {
      if (card.inCommandZone) return 'Commander';
      var t = card.type || '';
      if (t.includes('Land')) return 'Lands';
      if (t.includes('Creature')) return 'Creatures';
      if (t.includes('Instant')) return 'Instants';
      if (t.includes('Sorcery')) return 'Sorceries';
      if (t.includes('Enchantment')) return 'Enchantments';
      if (t.includes('Artifact')) return 'Artifacts';
      if (t.includes('Planeswalker')) return 'Planeswalkers';
      return 'Other';
    }

    function migrateDeck(deck) {
      if (!deck.categories) deck.categories = [...DEFAULT_DECK_CATS];
      deck.cards.forEach(function(c) {
        if (!c.category) c.category = getAutoCategory(c);
        if (deck.categories.indexOf(c.category) < 0) deck.categories.push(c.category);
      });
    }

    function updateDeOverlap(val) {
      DE.overlap = parseInt(val);
      var pct = Math.abs(DE.overlap);
      document.getElementById('de-overlap-val').textContent = pct + '%';
      document.documentElement.style.setProperty('--de-overlap', val + '%');
    }

    function renderDeckList() {
      var el = document.getElementById('deck-list-container');
      if (!el) return;
      if (!G.decks.length) {
        el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">&#127183;</div><div style="font-size:.83rem">No decks yet.</div><div class="flex gap-2" style="margin-top:.5rem"><button class="btn btn-gold" onclick="newBlankDeck()">+ New Deck</button><button class="btn" onclick="openImportDeckModal()">+ Import</button></div></div>';
        return;
      }
      el.innerHTML = G.decks.map(function(d) {
        var total = d.cards.reduce(function(a, c) {
          return a + c.qty;
        }, 0);
        var fmt = d.format || 'casual';
        var cmdCards = d.cards.filter(function(c) {
          return c.inCommandZone;
        });
        return '<div class="deck-item">' +
          '<div class="deck-item-info"><div class="deck-item-name">' + escH(d.name) + '</div>' +
          '<div class="deck-item-meta">' + total + ' cards' + (cmdCards.length ? ' · &#128081; ' + cmdCards.map(function(c) {
            return c.name;
          }).join(', ') : '') + ' · <span class="format-badge ' + fmt + '">' + fmt + '</span></div></div>' +
          '<div class="deck-item-actions">' +
          '<button class="btn btn-xs btn-gold" data-deck-id="' + d.id + '" data-action="edit">&#9998; Edit</button>' +
          '<button class="btn btn-xs btn-danger" data-deck-id="' + d.id + '" data-action="del">&#128465;</button>' +
          '</div></div>';
      }).join('');
      el.querySelectorAll('[data-action]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var id = btn.dataset.deckId,
            action = btn.dataset.action;
          if (action === 'edit') openDeckEditor(id);
          else if (action === 'del') deleteDeck(id);
        });
      });
    }

    function newBlankDeck() {
      var name = (prompt('Deck Name:') || '').trim();
      if (!name) return;
      var deck = {
        id: Date.now().toString(),
        name: name,
        format: 'commander',
        cards: [],
        categories: [...DEFAULT_DECK_CATS],
        commander: null
      };
      G.decks.push(deck);
      saveDecks();
      renderDeckList();
      updateLobbySelects();
      openDeckEditor(deck.id);
    }

    function openDeckEditor(id) {
      var deck = G.decks.find(function(d) {
        return d.id === id;
      });
      if (!deck) return;
      migrateDeck(deck);
      saveDecks();
      DE.deckId = id;
      document.getElementById('decks-list-view').style.display = 'none';
      var ed = document.getElementById('deck-editor');
      ed.style.display = 'flex';
      document.documentElement.style.setProperty('--de-overlap', DE.overlap + '%');
      var slider = document.getElementById('de-overlap-slider');
      if (slider) slider.value = DE.overlap;
      updateDeTitle();
      switchDeTab('board');
    }

    function closeDeckEditor() {
      DE.deckId = null;
      document.getElementById('deck-editor').style.display = 'none';
      document.getElementById('de-sg-panel').style.display = 'none';
      document.getElementById('de-art-panel').style.display = 'none';
      document.getElementById('de-inspect-panel').style.display = 'none';
      document.getElementById('decks-list-view').style.display = 'flex';
      renderDeckList();
      updateLobbySelects();
    }

    function updateDeTitle() {
      var deck = G.decks.find(function(d) {
        return d.id === DE.deckId;
      });
      if (!deck) return;
      var total = deck.cards.reduce(function(a, c) {
        return a + c.qty;
      }, 0);
      document.getElementById('de-title').textContent = deck.name + ' (' + total + ')';
    }

    function switchDeTab(tab) {
      document.querySelectorAll('.de-tab').forEach(function(t) {
        t.classList.toggle('active', t.dataset.detab === tab);
      });
      document.getElementById('de-board-view').style.display = tab === 'board' ? 'flex' : 'none';
      document.getElementById('de-stats-view').style.display = tab === 'stats' ? 'flex' : 'none';
      if (tab === 'board') renderDeckEditorBoard();
      if (tab === 'stats') renderDeckEditorStats();
    }

    function renderDeckEditorBoard() {
      var deck = G.decks.find(function(d) {
        return d.id === DE.deckId;
      });
      if (!deck) return;
      var scroll = document.getElementById('de-col-scroll');
      scroll.innerHTML = '';
      deck.categories.forEach(function(cat) {
        var cards = deck.cards.filter(function(c) {
          return c.category === cat;
        });
        var count = cards.reduce(function(a, c) {
          return a + c.qty;
        }, 0);
        var col = document.createElement('div');
        col.className = 'de-col';
        var hdr = document.createElement('div');
        hdr.className = 'de-col-header';
        hdr.innerHTML = '<div class="de-col-name">' + escH(cat) + '</div><div class="de-col-count">' + count + '</div>';
        col.appendChild(hdr);
        var content = document.createElement('div');
        content.className = 'de-col-content';
        if (!cards.length) {
          content.innerHTML = '<div class="de-empty-col">Empty</div>';
        } else {
          cards.forEach(function(card) {
            var idx = deck.cards.indexOf(card);
            var stack = document.createElement('div');
            stack.className = 'de-stack';
            var qtyBadge = card.qty > 1 ? '<div class="de-stack-qty">' + card.qty + '</div>' : '';
            if (card.image) {
              stack.innerHTML = '<img src="' + card.image + '" loading="lazy"/>' + qtyBadge;
            } else {
              stack.innerHTML = '<img src="" data-cardname="' + escH(card.name) + '" loading="lazy" style="width:100%;aspect-ratio:5/7;border-radius:7px;background:linear-gradient(135deg,hsl(215 30% 20%),hsl(215 20% 12%));display:block"/>' + qtyBadge;
            }
            (function(ci) {
              stack.addEventListener('click', function() {
                openDeckInspect(ci);
              });
            })(idx);
            content.appendChild(stack);
          });
        }
        col.appendChild(content);
        scroll.appendChild(col);
      });
      updateDeTitle();
      loadDeckEditorImages();
    }

    function loadDeckEditorImages() {
      var deck = G.decks.find(function(d) {
        return d.id === DE.deckId;
      });
      document.querySelectorAll('#de-col-scroll img[data-cardname]').forEach(function(img) {
        var name = img.dataset.cardname;
        if (!name) return;
        var cached = sfCache[name];
        if (cached) {
          var url = cardImg(cached, 0);
          if (url) {
            img.src = url;
            delete img.dataset.cardname;
            if (deck) {
              var card = deck.cards.find(function(c) {
                return c.name === name;
              });
              if (card && !card.image) {
                card.image = url;
                saveDecks();
              }
            }
            return;
          }
        }
        fetchCard(name).then(function(sf) {
          if (!sf) return;
          var url = cardImg(sf, 0);
          if (!url) return;
          img.src = url;
          delete img.dataset.cardname;
          if (deck) {
            var card = deck.cards.find(function(c) {
              return c.name === name;
            });
            if (card && !card.image) {
              card.image = url;
              saveDecks();
            }
          }
        });
      });
    }

    // ── FIX: Total price calculation — reads from sfCache AND card.prices ──
    function buildStatsHtml(deck) {
      var fmt = deck.format || 'casual';
      var isCmd = (fmt === 'commander');
      var curve = Array(8).fill(0);
      var colors = {
        W: 0,
        U: 0,
        B: 0,
        R: 0,
        G: 0,
        C: 0
      };
      var total = deck.cards.reduce(function(a, c) {
        return a + c.qty;
      }, 0) || 1;
      var landCount = 0,
        creatureCount = 0,
        instantCount = 0,
        sorceryCount = 0,
        enchantCount = 0,
        artifactCount = 0,
        planesCount = 0;
      var totalCmc = 0,
        cmcCards = 0;
      var totalPrice = 0;
      var cardPrices = [];
      var warnings = [];
      deck.cards.forEach(function(c) {
        var isLand = (c.type || '').includes('Land');
        var qty = c.qty;
        if (isLand) {
          landCount += qty;
        } else {
          var cmc = Math.min(Math.floor(c.cmc || 0), 7);
          curve[cmc] += qty;
          totalCmc += (c.cmc || 0) * qty;
          cmcCards += qty;
        }
        if ((c.type || '').includes('Creature')) creatureCount += qty;
        else if ((c.type || '').includes('Instant')) instantCount += qty;
        else if ((c.type || '').includes('Sorcery')) sorceryCount += qty;
        else if ((c.type || '').includes('Enchantment')) enchantCount += qty;
        else if ((c.type || '').includes('Artifact')) artifactCount += qty;
        else if ((c.type || '').includes('Planeswalker')) planesCount += qty;
        (c.colors || []).forEach(function(col) {
          if (colors[col] !== undefined) colors[col] += qty;
        });
        if (!(c.colors || []).length) colors['C'] += qty;
        var priceUsd = 0;
        var sf = sfCache[c.name];
        if (sf && sf.prices && sf.prices.usd) {
          priceUsd = parseFloat(sf.prices.usd) || 0;
        } else if (c.prices && c.prices.usd) {
          priceUsd = parseFloat(c.prices.usd) || 0;
        }
        totalPrice += priceUsd * qty;
        if (priceUsd > 0) cardPrices.push({
          name: c.name,
          price: priceUsd,
          qty: qty
        });
        // Legality checks
        var basicLandNames = ['Plains', 'Island', 'Swamp', 'Mountain', 'Forest', 'Wastes', 'Snow-Covered Plains', 'Snow-Covered Island', 'Snow-Covered Swamp', 'Snow-Covered Mountain', 'Snow-Covered Forest'];
        var isBasicLand = isLand && basicLandNames.some(function(n) {
          return c.name === n;
        });
        if (isCmd && !isBasicLand && qty > 1) warnings.push('⚠ ' + c.name + ' has ' + qty + ' copies (Commander: singleton)');
        if (!isCmd && !isLand && qty > 4) warnings.push('⚠ ' + c.name + ' has ' + qty + ' copies (max 4 in most formats)');
      });
      // Size check
      var targetSize = isCmd ? 100 : 60;
      var sizeOk = isCmd ? (total === 100) : (total >= 60);
      if (!sizeOk) {
        if (isCmd) warnings.push((total < 100 ? '⬇ Deck is ' + (100 - total) + ' cards short of 100' : '⬆ Deck has ' + (total - 100) + ' extra cards (Commander needs exactly 100)'));
        else if (total < 60) warnings.push('⬇ Deck has ' + total + ' cards (minimum 60)');
      }
      // Land ratio advice
      var landPct = Math.round((landCount / total) * 100);
      var idealLowPct = isCmd ? 35 : 36,
        idealHighPct = isCmd ? 42 : 42;
      var landNote = '';
      if (landPct < idealLowPct) landNote = '⬇ Low (' + landPct + '%) — consider adding more lands';
      else if (landPct > idealHighPct) landNote = '⬆ High (' + landPct + '%) — you may be over-landed';
      else landNote = '✓ Good (' + landPct + '%)';
      // Avg CMC assessment
      var avgCmc = cmcCards > 0 ? (totalCmc / cmcCards).toFixed(2) : '—';
      var avgCmcNum = cmcCards > 0 ? (totalCmc / cmcCards) : 0;
      var cmcNote = '';
      if (avgCmcNum > 0 && avgCmcNum <= 2.2) cmcNote = '⚡ Very fast (aggro/tempo)';
      else if (avgCmcNum <= 2.8) cmcNote = '✓ Efficient';
      else if (avgCmcNum <= 3.5) cmcNote = '✓ Balanced';
      else if (avgCmcNum <= 4.2) cmcNote = '🐢 Heavy — ensure enough ramp';
      else if (avgCmcNum > 4.2) cmcNote = '⚠ Very heavy — plan your mana curve';
      // Health grade
      var score = 100;
      if (!sizeOk) score -= 30;
      if (landPct < idealLowPct) score -= Math.min(20, (idealLowPct - landPct) * 2);
      if (landPct > idealHighPct) score -= Math.min(10, (landPct - idealHighPct) * 1);
      score -= warnings.filter(function(w) {
        return w.startsWith('⚠');
      }).length * 8;
      score = Math.max(0, Math.min(100, score));
      var grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 65 ? 'C' : score >= 50 ? 'D' : 'F';
      var gradeColor = score >= 80 ? '#4ade80' : score >= 65 ? '#fbbf24' : score >= 50 ? '#fb923c' : '#f87171';
      // Top 5 most expensive
      cardPrices.sort(function(a, b) {
        return b.price - a.price;
      });
      var topCards = cardPrices.slice(0, 5);
      // Mana curve
      var maxC = Math.max.apply(null, curve) || 1;
      var curveHtml = '';
      for (var i = 0; i <= 7; i++) {
        var h = Math.max(3, Math.round((curve[i] / maxC) * 100));
        curveHtml += '<div class="de-curve-bar" style="height:' + h + '%">' + (curve[i] ? '<div class="de-curve-top">' + curve[i] + '</div>' : '') + '<div class="de-curve-bot">' + (i === 7 ? '7+' : i) + '</div></div>';
      }
      // Colors
      var COLOR_CSS = {
        W: '#f0f2c0',
        U: '#b5cde3',
        B: '#aca29a',
        R: '#db8664',
        G: '#93b483',
        C: '#ccc'
      };
      var COLOR_LABEL = {
        W: 'White',
        U: 'Blue',
        B: 'Black',
        R: 'Red',
        G: 'Green',
        C: 'Colorless'
      };
      var colorTotal = Object.values(colors).reduce(function(a, b) {
        return a + b;
      }, 0) || 1;
      var colorHtml = Object.entries(colors).filter(function(e) {
        return e[1] > 0;
      }).map(function(e) {
        var pct = Math.max(5, Math.round((e[1] / colorTotal) * 100));
        return '<div style="display:flex;align-items:center;gap:.45rem;margin-bottom:.25rem"><div style="width:12px;height:12px;border-radius:2px;background:' + COLOR_CSS[e[0]] + ';flex-shrink:0"></div><div style="font-size:.72rem;min-width:65px">' + COLOR_LABEL[e[0]] + '</div><div style="flex:1;background:hsl(var(--muted));border-radius:3px;height:12px;overflow:hidden"><div style="width:' + pct + '%;height:100%;background:' + COLOR_CSS[e[0]] + '"></div></div><div style="font-size:.68rem;font-family:\'JetBrains Mono\',monospace;color:var(--gold);min-width:22px;text-align:right">' + e[1] + '</div></div>';
      }).join('');
      // Categories
      var catHtml = deck.categories.map(function(cat) {
        var cnt = deck.cards.filter(function(c) {
          return c.category === cat;
        }).reduce(function(a, c) {
          return a + c.qty;
        }, 0);
        if (!cnt) return '';
        var pct = Math.max(3, Math.round((cnt / total) * 100));
        return '<div style="display:flex;align-items:center;gap:.45rem;margin-bottom:.28rem"><div style="font-size:.7rem;min-width:90px;color:hsl(var(--muted-fg));overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escH(cat) + '</div><div style="flex:1;background:hsl(var(--muted));border-radius:3px;height:14px;overflow:hidden"><div style="width:' + pct + '%;height:100%;background:rgba(200,168,75,.5)"></div></div><div style="font-size:.68rem;font-family:\'JetBrains Mono\',monospace;color:var(--gold);min-width:22px;text-align:right">' + cnt + '</div></div>';
      }).join('');
      // Interaction estimate (instants + sorceries)
      var interactPct = total > 0 ? Math.round(((instantCount + sorceryCount) / total) * 100) : 0;
      var interactNote = interactPct >= 15 ? '✓ Good interaction density' : interactPct >= 8 ? 'Consider more instants/sorceries' : '⚠ Very few instants/sorceries';
      return {
        html:
          // Grade + Quick Summary
          '<div class="de-chart-section"><div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.6rem">' +
          '<div style="text-align:center;background:hsl(var(--muted));border-radius:.5rem;padding:.5rem .9rem;flex-shrink:0">' +
          '<div style="font-family:Cinzel,serif;font-size:2rem;font-weight:900;color:' + gradeColor + '">' + grade + '</div>' +
          '<div style="font-size:.58rem;color:hsl(var(--muted-fg));margin-top:.1rem">SCORE ' + score + '/100</div></div>' +
          '<div style="flex:1;font-size:.72rem;display:flex;flex-direction:column;gap:.22rem">' +
          '<div style="color:hsl(var(--muted-fg))">Format: <span style="color:hsl(var(--fg));font-weight:600">' + fmt + ' — ' + total + '/' + targetSize + ' cards</span></div>' +
          '<div style="color:hsl(var(--muted-fg))">Land ratio: <span style="color:hsl(var(--fg))">' + landNote + '</span></div>' +
          '<div style="color:hsl(var(--muted-fg))">Avg CMC: <span style="color:hsl(var(--fg))">' + avgCmc + (cmcNote ? ' — ' + cmcNote : '') + '</span></div>' +
          '<div style="color:hsl(var(--muted-fg))">Interaction: <span style="color:hsl(var(--fg))">' + (instantCount + sorceryCount) + ' cards (' + interactPct + '%) — ' + interactNote + '</span></div>' +
          '</div></div></div>' +
          // Warnings
          (warnings.length ? '<div class="de-chart-section"><div class="de-chart-title">⚠ Deck Check</div>' + warnings.slice(0, 6).map(function(w) {
            return '<div style="font-size:.72rem;color:#fbbf24;margin-bottom:.3rem;line-height:1.4">' + escH(w) + '</div>';
          }).join('') + (warnings.length > 6 ? '<div style="font-size:.65rem;color:hsl(var(--muted-fg))">&hellip; and ' + (warnings.length - 6) + ' more</div>' : '') + '</div>' : '') +
          // Overview stats
          '<div class="de-chart-section"><div class="de-chart-title">Overview</div>' +
          '<div class="de-stat-grid"><div class="de-stat-box"><div class="de-stat-box-val">' + total + '</div><div class="de-stat-box-lbl">Total Cards</div></div>' +
          '<div class="de-stat-box"><div class="de-stat-box-val">' + landCount + '</div><div class="de-stat-box-lbl">Lands</div></div>' +
          '<div class="de-stat-box"><div class="de-stat-box-val">' + (total - landCount) + '</div><div class="de-stat-box-lbl">Non-Lands</div></div>' +
          '<div class="de-stat-box"><div class="de-stat-box-val">' + avgCmc + '</div><div class="de-stat-box-lbl">Avg CMC</div></div></div>' +
          '<div class="de-stat-box" style="margin-bottom:.45rem" id="stats-price-box"><div class="de-stat-box-val" style="color:#4ade80;font-size:1.1rem" id="stats-price-val">$' + totalPrice.toFixed(2) + '</div><div class="de-stat-box-lbl">Est. Total Price (USD)</div><div id="stats-price-status" style="font-size:.65rem;color:hsl(var(--muted-fg));margin-top:.3rem"></div></div>' +
          '<div class="de-stat-grid" style="margin-top:.45rem">' +
          (creatureCount ? '<div class="de-stat-box"><div class="de-stat-box-val" style="font-size:1rem">' + creatureCount + '</div><div class="de-stat-box-lbl">Creatures</div></div>' : '') +
          (instantCount ? '<div class="de-stat-box"><div class="de-stat-box-val" style="font-size:1rem">' + instantCount + '</div><div class="de-stat-box-lbl">Instants</div></div>' : '') +
          (sorceryCount ? '<div class="de-stat-box"><div class="de-stat-box-val" style="font-size:1rem">' + sorceryCount + '</div><div class="de-stat-box-lbl">Sorceries</div></div>' : '') +
          (enchantCount ? '<div class="de-stat-box"><div class="de-stat-box-val" style="font-size:1rem">' + enchantCount + '</div><div class="de-stat-box-lbl">Enchantments</div></div>' : '') +
          (artifactCount ? '<div class="de-stat-box"><div class="de-stat-box-val" style="font-size:1rem">' + artifactCount + '</div><div class="de-stat-box-lbl">Artifacts</div></div>' : '') +
          (planesCount ? '<div class="de-stat-box"><div class="de-stat-box-val" style="font-size:1rem">' + planesCount + '</div><div class="de-stat-box-lbl">Planeswalkers</div></div>' : '') +
          '</div></div>' +
          // Mana curve
          '<div class="de-chart-section"><div class="de-chart-title">Mana Curve (non-lands)</div><div class="de-curve">' + curveHtml + '</div></div>' +
          // Top expensive cards
          (topCards.length ? '<div class="de-chart-section"><div class="de-chart-title">💰 Most Valuable Cards</div>' +
            topCards.map(function(cp, i) {
              return '<div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.3rem"><div style="font-size:.68rem;color:hsl(var(--muted-fg));min-width:14px">#' + (i + 1) + '</div><div style="flex:1;font-size:.75rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escH(cp.name) + '</div>' +
                (cp.qty > 1 ? '<div style="font-size:.65rem;color:hsl(var(--muted-fg))">×' + cp.qty + '</div>' : '') +
                '<div style="font-size:.75rem;color:#4ade80;font-family:\'JetBrains Mono\',monospace;font-weight:600">$' + cp.price.toFixed(2) + '</div>' +
                (cp.qty > 1 ? '<div style="font-size:.65rem;color:hsl(var(--muted-fg))">($' + (cp.price * cp.qty).toFixed(2) + ')</div>' : '') +
                '</div>';
            }).join('') + '</div>' : '') +
          // Color identity
          '<div class="de-chart-section"><div class="de-chart-title">Color Identity</div>' + (colorTotal > 1 ? colorHtml : '<div style="color:hsl(var(--muted-fg));font-size:.8rem">No colored cards</div>') + '</div>' +
          // Categories
          '<div class="de-chart-section"><div class="de-chart-title">By Category</div>' + (catHtml || '<div style="color:hsl(var(--muted-fg));font-size:.8rem">No cards yet</div>') + '</div>'
      };
    }

    async function renderDeckEditorStats() {
      var deck = G.decks.find(function(d) {
        return d.id === DE.deckId;
      });
      if (!deck) return;
      var statsEl = document.getElementById('de-stats-view');
      // Render immediately with whatever prices we have
      statsEl.innerHTML = buildStatsHtml(deck).html;
      // Find cards missing prices (not in sfCache and no card.prices)
      var missing = deck.cards.filter(function(c) {
        var sf = sfCache[c.name];
        return !(sf && sf.prices && sf.prices.usd) && !(c.prices && c.prices.usd);
      });
      if (!missing.length) return; // All prices already loaded
      var statusEl = document.getElementById('stats-price-status');
      if (statusEl) statusEl.textContent = 'Loading prices… (' + missing.length + ' cards)';
      // Batch fetch all missing — 3 at a time to be polite to Scryfall
      var BATCH = 3;
      for (var i = 0; i < missing.length; i += BATCH) {
        var batch = missing.slice(i, i + BATCH);
        await Promise.all(batch.map(function(c) {
          return fetchCard(c.name).then(function(sf) {
            if (sf && sf.prices) {
              c.prices = sf.prices;
            }
          });
        }));
        // Re-render with updated prices after each batch
        if (DE.deckId === deck.id) {
          var result = buildStatsHtml(deck);
          statsEl.innerHTML = result.html;
          var st = document.getElementById('stats-price-status');
          var loaded = Math.min(i + BATCH, missing.length);
          if (st && loaded < missing.length) st.textContent = 'Loading prices… (' + loaded + '/' + missing.length + ' done)';
        }
      }
      saveDecks();
    }

    function deCloseSearch() {
      document.getElementById('de-sg-panel').style.display = 'none';
    }

    async function deSearch() {
      var q = (document.getElementById('de-search-input').value || '').trim();
      if (!q) return;
      document.getElementById('de-sg-search-input').value = q;
      await deRunSearch(q);
    }

    async function deSearchFromPanel() {
      var q = (document.getElementById('de-sg-search-input').value || '').trim();
      if (!q) return;
      await deRunSearch(q);
    }

    async function deRunSearch(q) {
      var panel = document.getElementById('de-sg-panel');
      var grid = document.getElementById('de-sg-grid');
      var titleEl = document.getElementById('de-sg-title');
      panel.style.display = 'flex';
      grid.innerHTML = '<div style="grid-column:1/-1;padding:1rem;text-align:center;color:hsl(var(--muted-fg));font-size:.8rem">Searching…</div>';
      titleEl.textContent = '';
      try {
        var r = await fetch('https://api.scryfall.com/cards/search?q=' + encodeURIComponent(q) + '&limit=175');
        var data = await r.json();
        if (!data.data || !data.data.length) {
          grid.innerHTML = '<div style="grid-column:1/-1;padding:1.5rem;text-align:center;color:hsl(var(--muted-fg));font-size:.8rem">No results found</div>';
          return;
        }
        titleEl.textContent = 'Showing ' + data.data.length + (data.total_cards > data.data.length ? ' of ' + data.total_cards : '') + ' results';
        grid.innerHTML = '';
        data.data.forEach(function(sf) {
          var img = cardImg(sf, 0);
          var wrap = document.createElement('div');
          wrap.className = 'de-sg-card';
          var addBtn = document.createElement('button');
          addBtn.className = 'de-sg-add';
          addBtn.textContent = '+ Add';
          addBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            addCardToDeckEditor(sf);
            addBtn.textContent = '\u2713';
            addBtn.classList.add('added');
            addBtn.disabled = true;
          });
          if (img) {
            var im = document.createElement('img');
            im.src = img;
            im.loading = 'lazy';
            wrap.appendChild(im);
          } else {
            var ph = document.createElement('div');
            ph.className = 'de-sg-placeholder';
            wrap.appendChild(ph);
          }
          wrap.appendChild(addBtn);
          var nm = document.createElement('div');
          nm.className = 'de-sg-name';
          nm.textContent = sf.name;
          wrap.appendChild(nm);
          var tp = document.createElement('div');
          tp.className = 'de-sg-type';
          tp.textContent = (sf.type_line || '').replace(/\s*\/\/.*$/, '');
          wrap.appendChild(tp);
          grid.appendChild(wrap);
        });
      } catch (e) {
        grid.innerHTML = '<div style="grid-column:1/-1;padding:1rem;text-align:center;color:hsl(var(--muted-fg));font-size:.8rem">Search failed</div>';
      }
    }

    function addCardToDeckEditor(sf) {
      var deck = G.decks.find(function(d) {
        return d.id === DE.deckId;
      });
      if (!deck) return;
      var hasDFC = isDFC(sf);
      var type = (sf.type_line) || (sf.card_faces && sf.card_faces[0] && sf.card_faces[0].type_line) || '';
      var cat = getAutoCategory({
        type: type,
        inCommandZone: false
      });
      var existing = deck.cards.find(function(c) {
        return c.name === sf.name;
      });
      if (existing) {
        existing.qty++;
        toast(sf.name + ' \xd7' + existing.qty);
      } else {
        deck.cards.push({
          id: uid(),
          name: sf.name,
          qty: 1,
          image: cardImg(sf, 0) || null,
          backImage: cardImg(sf, 1) || null,
          isDFC: hasDFC,
          type: type,
          cmc: sf.cmc || 0,
          colors: sf.color_identity || [],
          inCommandZone: false,
          category: cat,
          prices: sf.prices || null
        });
        toast('Added ' + sf.name + ' \u2192 ' + cat);
      }
      sfCache[sf.name] = sf;
      saveDecks();
      renderDeckEditorBoard();
    }

    function openDeckInspect(cardIdx) {
      var deck = G.decks.find(function(d) {
        return d.id === DE.deckId;
      });
      if (!deck || !deck.cards[cardIdx]) return;
      var card = deck.cards[cardIdx];
      DE.inspectIdx = cardIdx;
      var panel = document.getElementById('de-inspect-panel');
      panel.style.display = 'flex';
      document.getElementById('de-inspect-name').textContent = card.name;
      var img = document.getElementById('de-inspect-img');
      var artBtn = document.getElementById('de-inspect-art-btn');
      if (card.image) {
        img.src = card.image;
        img.style.display = '';
        artBtn.style.display = '';
      } else {
        img.src = '';
        img.style.display = '';
        artBtn.style.display = 'none';
        var _inspectIdx = cardIdx;
        fetchCard(card.name).then(function(sf) {
          if (!sf) return;
          var url = cardImg(sf, 0);
          if (!url) return;
          var imgEl2 = document.getElementById('de-inspect-img');
          if (imgEl2 && DE.inspectIdx === _inspectIdx) {
            imgEl2.src = url;
            artBtn.style.display = '';
          }
          var d2 = G.decks.find(function(d) {
            return d.id === DE.deckId;
          });
          if (d2 && d2.cards[_inspectIdx] && !d2.cards[_inspectIdx].image) {
            d2.cards[_inspectIdx].image = url;
            saveDecks();
            renderDeckEditorBoard();
          }
        });
      }
      document.getElementById('de-inspect-type').textContent = card.type || '';
      document.getElementById('de-inspect-qty').textContent = card.qty;
      document.getElementById('de-inspect-cmd').checked = card.inCommandZone || false;
      var catSel = document.getElementById('de-inspect-cat');
      catSel.innerHTML = deck.categories.map(function(c) {
        return '<option value="' + escH(c) + '"' + (c === card.category ? ' selected' : '') + '>' + escH(c) + '</option>';
      }).join('');
      var priceEl = document.getElementById('de-inspect-price');
      priceEl.textContent = '';
      // FIX: Check sfCache first for price, then fall back to card.prices
      var sf = sfCache[card.name];
      if (sf && sf.prices && sf.prices.usd) {
        priceEl.textContent = 'Market: $' + sf.prices.usd + ' \xd7' + card.qty + ' = $' + (parseFloat(sf.prices.usd) * card.qty).toFixed(2);
      } else if (card.prices && card.prices.usd) {
        priceEl.textContent = 'Market: $' + card.prices.usd + ' \xd7' + card.qty + ' = $' + (parseFloat(card.prices.usd) * card.qty).toFixed(2);
      } else {
        fetchCard(card.name).then(function(sf2) {
          if (sf2 && sf2.prices && sf2.prices.usd && DE.inspectIdx === cardIdx) {
            // Also store on the card so stats tab picks it up
            deck.cards[cardIdx].prices = sf2.prices;
            saveDecks();
            priceEl.textContent = 'Market: $' + sf2.prices.usd + ' \xd7' + card.qty + ' = $' + (parseFloat(sf2.prices.usd) * card.qty).toFixed(2);
          }
        });
      }
      document.getElementById('de-qty-minus').onclick = function() {
        var d2 = G.decks.find(function(d) {
          return d.id === DE.deckId;
        });
        if (!d2 || !d2.cards[cardIdx]) return;
        d2.cards[cardIdx].qty = Math.max(1, d2.cards[cardIdx].qty - 1);
        document.getElementById('de-inspect-qty').textContent = d2.cards[cardIdx].qty;
        saveDecks();
      };
      document.getElementById('de-qty-plus').onclick = function() {
        var d2 = G.decks.find(function(d) {
          return d.id === DE.deckId;
        });
        if (!d2 || !d2.cards[cardIdx]) return;
        d2.cards[cardIdx].qty++;
        document.getElementById('de-inspect-qty').textContent = d2.cards[cardIdx].qty;
        saveDecks();
      };
      document.getElementById('de-inspect-save').onclick = function() {
        var d2 = G.decks.find(function(d) {
          return d.id === DE.deckId;
        });
        if (!d2 || !d2.cards[cardIdx]) return;
        d2.cards[cardIdx].category = document.getElementById('de-inspect-cat').value;
        d2.cards[cardIdx].inCommandZone = document.getElementById('de-inspect-cmd').checked;
        var c2 = d2.cards.find(function(c) {
          return c.inCommandZone && isCommanderType(c.type);
        });
        d2.commander = c2 ? c2.name : null;
        saveDecks();
        closeDeckInspect();
        renderDeckEditorBoard();
        toast('Saved');
      };
      document.getElementById('de-inspect-remove').onclick = function() {
        var d2 = G.decks.find(function(d) {
          return d.id === DE.deckId;
        });
        if (!d2) return;
        var nm = d2.cards[cardIdx] ? d2.cards[cardIdx].name : 'card';
        d2.cards.splice(cardIdx, 1);
        saveDecks();
        closeDeckInspect();
        renderDeckEditorBoard();
        toast('Removed ' + nm);
      };
    }

    function closeDeckInspect() {
      document.getElementById('de-inspect-panel').style.display = 'none';
      DE.inspectIdx = -1;
    }

    async function openArtSelector() {
      var deck = G.decks.find(function(d) {
        return d.id === DE.deckId;
      });
      if (!deck) return;
      var cardIdx = DE.inspectIdx;
      if (cardIdx < 0 || !deck.cards[cardIdx]) return;
      var card = deck.cards[cardIdx];
      var artPanel = document.getElementById('de-art-panel');
      var artGrid = document.getElementById('de-art-grid');
      document.getElementById('de-art-title').textContent = card.name;
      document.getElementById('de-art-count').textContent = '';
      artGrid.innerHTML = '<div style="grid-column:1/-1;padding:1.5rem;text-align:center;color:hsl(var(--muted-fg));font-size:.8rem">Loading printings…</div>';
      artPanel.style.display = 'flex';
      try {
        var r = await fetch('https://api.scryfall.com/cards/search?q=!%22' + encodeURIComponent(card.name) + '%22&unique=prints&order=released');
        if (!r.ok) {
          throw new Error('HTTP ' + r.status);
        }
        var data = await r.json();
        if (!data.data || !data.data.length) {
          artGrid.innerHTML = '<div style="grid-column:1/-1;padding:1.5rem;text-align:center;color:hsl(var(--muted-fg));font-size:.8rem">No printings found</div>';
          return;
        }
        document.getElementById('de-art-count').textContent = data.data.length + ' printing' + (data.data.length !== 1 ? 's' : '');
        artGrid.innerHTML = '';
        data.data.forEach(function(sf) {
          var img = cardImg(sf, 0);
          if (!img) return;
          var backImg = cardImg(sf, 1) || null;
          var thumb = document.createElement('div');
          thumb.className = 'de-art-thumb';
          if (card.image === img) thumb.classList.add('selected');
          var im = document.createElement('img');
          im.src = img;
          im.loading = 'lazy';
          thumb.appendChild(im);
          var setEl = document.createElement('div');
          setEl.className = 'de-art-set';
          setEl.textContent = (sf.set_name || sf.set || '').slice(0, 22) + (sf.collector_number ? ' #' + sf.collector_number : '');
          thumb.appendChild(setEl);
          if (sf.prices && sf.prices.usd) {
            var pe = document.createElement('div');
            pe.className = 'de-art-price';
            pe.textContent = '$' + sf.prices.usd;
            thumb.appendChild(pe);
          }
          thumb.addEventListener('click', function() {
            var d2 = G.decks.find(function(d) {
              return d.id === DE.deckId;
            });
            if (!d2 || !d2.cards[cardIdx]) return;
            d2.cards[cardIdx].image = img;
            if (backImg) d2.cards[cardIdx].backImage = backImg;
            if (sf.prices) d2.cards[cardIdx].prices = sf.prices;
            saveDecks();
            var imgEl = document.getElementById('de-inspect-img');
            if (imgEl) imgEl.src = img;
            artGrid.querySelectorAll('.de-art-thumb').forEach(function(t) {
              t.classList.remove('selected');
            });
            thumb.classList.add('selected');
            renderDeckEditorBoard();
            toast('Art updated');
            setTimeout(function() {
              closeArtPanel();
            }, 400);
          });
          artGrid.appendChild(thumb);
        });
      } catch (e) {
        artGrid.innerHTML = '<div style="grid-column:1/-1;padding:1.5rem;text-align:center;color:hsl(var(--muted-fg));font-size:.8rem">Failed to load printings</div>';
      }
    }

    function closeArtPanel() {
      document.getElementById('de-art-panel').style.display = 'none';
    }

    function renameDeckEditor() {
      var deck = G.decks.find(function(d) {
        return d.id === DE.deckId;
      });
      if (!deck) return;
      var name = (prompt('Rename deck:', deck.name) || '').trim();
      if (!name) return;
      deck.name = name;
      saveDecks();
      updateDeTitle();
      renderDeckList();
      toast('Renamed to "' + name + '"');
    }

    function exportDeckEditor() {
      var deck = G.decks.find(function(d) {
        return d.id === DE.deckId;
      });
      if (!deck) return;
      var text = deck.cards.map(function(c) {
        return c.qty + ' ' + c.name;
      }).join('\n');
      openModal('<div class="modal-title">Export: ' + escH(deck.name) + '</div><textarea id="de-export-text" style="font-family:\'JetBrains Mono\',monospace;font-size:.72rem;height:200px;line-height:1.6;width:100%;box-sizing:border-box" readonly>' + escH(text) + '</textarea><div class="flex gap-2" style="margin-top:.6rem"><button class="btn btn-gold flex-1" id="de-export-copy">Copy</button><button class="btn flex-1" onclick="closeModal()">Close</button></div>');
      document.getElementById('de-export-copy').addEventListener('click', function() {
        var ta = document.getElementById('de-export-text');
        if (navigator.clipboard) {
          navigator.clipboard.writeText(ta.value).then(function() {
            toast('Copied to clipboard');
          });
        } else {
          ta.select();
          document.execCommand('copy');
          toast('Copied');
        }
      });
    }

    function deAddCategory() {
      var deck = G.decks.find(function(d) {
        return d.id === DE.deckId;
      });
      if (!deck) return;
      openModal('<div class="modal-title">Add Category</div><div class="flex flex-col gap-3"><div><label>Category Name</label><input id="de-cat-name" placeholder="e.g. Ramp, Draw, Removal…" /></div><button class="btn btn-gold" id="de-cat-add-btn">Add</button></div>');
      var doAdd = function() {
        var name = (document.getElementById('de-cat-name').value || '').trim();
        if (!name) return;
        if (deck.categories.indexOf(name) < 0) {
          deck.categories.push(name);
          saveDecks();
        }
        closeModal();
        renderDeckEditorBoard();
        toast('Added category "' + name + '"');
      };
      document.getElementById('de-cat-add-btn').addEventListener('click', doAdd);
      document.getElementById('de-cat-name').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') doAdd();
      });
    }

    // ── Lobby ─────────────────────────────────────────────────────
    var lobbyRoomsRef = null,
      lobbyRoomsCallback = null,
      ROOM_EXPIRY_MS = 86400000;

    function initLobby() {
      updateLobbySelects();
      var n = loadName();
      if (n) {
        ['host-name', 'join-name'].forEach(function(id) {
          var el = document.getElementById(id);
          if (el) el.value = n;
        });
      }
      detachLobbyListener();
      lobbyRoomsRef = fbDB.ref('rooms').orderByChild('isPublic').equalTo(true);
      lobbyRoomsCallback = lobbyRoomsRef.on('value', function(snap) {
        var el = document.getElementById('active-rooms-list');
        if (!el) return;
        if (G.screen !== 'lobby') return;
        var rooms = snap.val();
        var now = Date.now();
        var open = rooms ? Object.entries(rooms).filter(function(e) {
          var r = e[1];
          if (!r.open) return false;
          return (now - (r.lastActive || r.created || 0)) < ROOM_EXPIRY_MS;
        }) : [];
        if (!open.length) {
          el.innerHTML = '<div style="color:hsl(var(--muted-fg));font-size:.8rem;text-align:center;padding:.5rem">No public rooms open</div>';
          return;
        }
        el.innerHTML = open.slice(0, 10).map(function(entry) {
          var code = entry[0],
            r = entry[1];
          var specs = Object.keys(r.spectators || {}).length;
          var meta = (r.format || 'casual') + ' &middot; ' + Object.keys(r.players || {}).length + '/' + (r.maxPlayers || 4) + (specs ? ' &middot; &#128065; ' + specs : '') + (r.bracket ? ' &middot; ' + escH(r.bracket) : '');
          return '<div class="scry-result"><div style="font-size:1.2rem">&#127760;</div>' +
            '<div class="scry-result-info"><div class="font-semibold text-sm">' + escH(r.hostName || '?') + '\'s Room <span class="game-room-code" style="margin-left:.3rem">' + code + '</span></div>' +
            '<div class="text-xs text-muted">' + meta + '</div>' +
            (r.description ? '<div class="text-xs text-muted truncate" style="margin-top:.1rem;font-style:italic">' + escH(r.description) + '</div>' : '') +
            '</div><div style="display:flex;flex-direction:column;gap:.3rem;flex-shrink:0">' +
            '<button class="btn btn-xs btn-primary lobby-join-btn" data-code="' + code + '">Join</button>' +
            '<button class="btn btn-xs lobby-watch-btn" data-code="' + code + '" style="background:rgba(139,92,246,.12);color:#a78bfa;border:1px solid rgba(139,92,246,.3)">&#128065; Watch</button>' +
            '</div></div>';
        }).join('');
        el.querySelectorAll('.lobby-join-btn').forEach(function(btn) {
          btn.addEventListener('click', function(e) {
            e.stopPropagation();
            quickJoin(btn.dataset.code);
          });
        });
        el.querySelectorAll('.lobby-watch-btn').forEach(function(btn) {
          btn.addEventListener('click', function(e) {
            e.stopPropagation();
            doSpectateRoom(btn.dataset.code);
          });
        });
      });
    }

    function detachLobbyListener() {
      if (lobbyRoomsRef && lobbyRoomsCallback) {
        lobbyRoomsRef.off('value', lobbyRoomsCallback);
      }
      lobbyRoomsRef = null;
      lobbyRoomsCallback = null;
    }

    function updateLobbySelects() {
      ['host-deck-select', 'join-deck-select'].forEach(function(id) {
        var el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = '<option value="">-- Choose a deck --</option>' + G.decks.map(function(d) {
          return '<option value="' + d.id + '">' + escH(d.name) + ' (' + d.format + ')</option>';
        }).join('');
      });
    }

    function quickJoin(code) {
      var jname = (document.getElementById('join-name') && document.getElementById('join-name').value.trim()) || '';
      var jdeck = (document.getElementById('join-deck-select') && document.getElementById('join-deck-select').value) || '';
      if (!jname) {
        toast('Enter your name first');
        return;
      }
      if (!jdeck) {
        toast('Select a deck first');
        return;
      }
      doJoinRoom(code);
    }

    function genCode() {
      return 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'.split('').sort(function() {
        return Math.random() - .5;
      }).slice(0, 6).join('');
    }

    async function hostRoom() {
      var hostName = (document.getElementById('host-name').value || '').trim() || 'Host';
      var format = document.getElementById('host-format').value;
      var maxPlayers = parseInt(document.getElementById('host-players').value);
      var deckId = document.getElementById('host-deck-select').value;
      var startingLife = parseInt(document.getElementById('host-life').value);
      var isPublic = document.getElementById('host-public').checked;
      var bracket = (document.getElementById('host-bracket').value || '').trim() || null;
      var description = (document.getElementById('host-desc').value || '').trim().slice(0, 80) || null;
      if (!deckId) {
        toast('Please select a deck');
        return;
      }
      saveName(hostName);
      var code = genCode();
      var playerId = genSessionPid();
      Object.assign(G.game, {
        roomCode: code,
        playerId: playerId,
        playerName: hostName,
        format: format,
        deckId: deckId,
        isHost: true,
        maxPlayers: maxPlayers,
        startingLife: startingLife
      });
      try {
        var pd = {};
        pd[playerId] = {
          name: hostName,
          life: startingLife,
          poison: 0,
          experience: 0,
          energy: 0,
          customCounters: {},
          joined: Date.now(),
          devicePid: getDevicePlayerId()
        };
        await fbDB.ref('rooms/' + code).set({
          code: code,
          hostId: playerId,
          hostName: hostName,
          format: format,
          maxPlayers: maxPlayers,
          startingLife: startingLife,
          open: true,
          isPublic: isPublic,
          bracket: bracket,
          description: description,
          created: Date.now(),
          lastActive: Date.now(),
          currentTurn: playerId,
          turnCycle: 1,
          players: pd,
          spectators: {}
        });
        detachLobbyListener();
        initGame(code, playerId, false);
        toast('Room created! Code: ' + code);
      } catch (e) {
        toast('Failed: ' + e.message);
      }
    }

    function joinRoomPrompt() {
      var joinName = (document.getElementById('join-name').value || '').trim();
      var deckId = (document.getElementById('join-deck-select').value) || '';
      if (!joinName) {
        toast('Enter your name');
        return;
      }
      if (!deckId) {
        toast('Select a deck');
        return;
      }
      openModal('<div class="modal-title">Join Room</div><div class="flex flex-col gap-3"><div><label>Room Code</label><input id="join-code-input" placeholder="ABC123" maxlength="6" style="font-family:\'JetBrains Mono\',monospace;font-size:1.5rem;text-align:center;letter-spacing:.3em;text-transform:uppercase;font-weight:700"/></div><button class="btn btn-gold" id="join-confirm-btn">Join</button></div>');
      document.getElementById('join-confirm-btn').addEventListener('click', function() {
        var btn = document.getElementById('join-confirm-btn');
        if (btn) {
          btn.disabled = true;
          btn.textContent = 'Joining…';
        }
        var code = (document.getElementById('join-code-input').value || '').trim().toUpperCase();
        doJoinRoom(code).catch(function(err) {
          console.error('Join error:', err);
          toast('Join failed');
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Join';
          }
        });
      });
      document.getElementById('join-code-input').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          var btn = document.getElementById('join-confirm-btn');
          if (btn && !btn.disabled) btn.click();
        }
      });
    }

    async function doJoinRoom(code) {
      var joinName = (document.getElementById('join-name') && document.getElementById('join-name').value.trim()) || 'Player';
      var deckId = (document.getElementById('join-deck-select') && document.getElementById('join-deck-select').value) || '';
      if (!code || code.length < 4) {
        toast('Enter a valid room code');
        return;
      }
      if (!deckId) {
        toast('Please select a deck');
        return;
      }
      saveName(joinName);
      var snap;
      try {
        snap = await fbDB.ref('rooms/' + code).get();
      } catch (e) {
        toast('Connection error: ' + e.message);
        return;
      }
      if (!snap.exists()) {
        toast('Room not found: ' + code);
        return;
      }
      var room = snap.val();
      if (!room.open) {
        toast('Room is closed');
        return;
      }
      if (Date.now() - (room.lastActive || room.created || 0) > ROOM_EXPIRY_MS) {
        toast('Room expired');
        return;
      }
      var devPid = getDevicePlayerId();
      var existing = Object.entries(room.players || {}).find(function(e) {
        return e[1].devicePid === devPid;
      });
      var playerId;
      var isRejoin = false;
      if (existing) {
        playerId = existing[0];
        isRejoin = true;
      } else {
        if (Object.keys(room.players || {}).length >= room.maxPlayers) {
          toast('Room is full');
          return;
        }
        playerId = genSessionPid();
        try {
          await fbDB.ref('rooms/' + code + '/players/' + playerId).set({
            name: joinName,
            life: room.startingLife || 20,
            poison: 0,
            experience: 0,
            energy: 0,
            customCounters: {},
            joined: Date.now(),
            devicePid: devPid
          });
        } catch (e) {
          toast('Failed to join: ' + e.message);
          return;
        }
      }
      Object.assign(G.game, {
        roomCode: code,
        playerId: playerId,
        playerName: joinName,
        format: room.format,
        deckId: deckId,
        isHost: (room.hostId === playerId),
        startingLife: room.startingLife || 20,
        maxPlayers: room.maxPlayers || 4
      });
      detachLobbyListener();
      closeModal();
      showScreen('game');
      document.getElementById('game-room-code').textContent = code;
      try {
        initGame(code, playerId, isRejoin);
      } catch (e) {
        console.error('initGame error:', e);
        toast('Game init error');
      }
      toast(isRejoin ? 'Reconnected to room ' + code + '!' : 'Joined room ' + code + '!');
    }

    async function doSpectateRoom(code) {
      var specName = prompt('Your name (spectating):');
      if (!specName || !specName.trim()) {
        return;
      }
      specName = specName.trim();
      var snap;
      try {
        snap = await fbDB.ref('rooms/' + code).get();
      } catch (e) {
        toast('Connection error');
        return;
      }
      if (!snap.exists()) {
        toast('Room not found: ' + code);
        return;
      }
      var room = snap.val();
      if (Date.now() - (room.lastActive || room.created || 0) > ROOM_EXPIRY_MS) {
        toast('Room expired');
        return;
      }
      var pid = genSessionPid();
      try {
        await fbDB.ref('rooms/' + code + '/spectators/' + pid).set({
          name: specName,
          devicePid: getDevicePlayerId(),
          joined: Date.now()
        });
      } catch (e) {
        toast('Failed to join as spectator');
        return;
      }
      G.game.isSpectator = true;
      Object.assign(G.game, {
        roomCode: code,
        playerId: pid,
        playerName: specName,
        format: room.format,
        deckId: null,
        isHost: false,
        startingLife: room.startingLife || 20,
        maxPlayers: room.maxPlayers || 4
      });
      detachLobbyListener();
      closeModal();
      initSpectatorGame(code, pid);
      toast('Watching room ' + code + ' as ' + specName);
    }

    function initSpectatorGame(roomCode, pid) {
      G.listeners.forEach(function(f) {
        try {
          f();
        } catch (e) {}
      });
      G.listeners = [];
      G.cachedPublicZones = {};
      G.actionLog = [];
      G.chatMessages = [];
      G.chatUnread = 0;
      showScreen('game');
      document.getElementById('game-room-code').textContent = roomCode;
      G.currentZone = 'opponents';
      document.querySelectorAll('.zone-tab').forEach(function(t) {
        var z = t.dataset.zone;
        var allowed = (z === 'opponents' || z === 'chat');
        t.classList.toggle('hidden', !allowed);
        t.classList.toggle('active', z === 'opponents');
      });
      document.querySelectorAll('.zone-pane').forEach(function(p) {
        p.classList.toggle('active', p.id === 'zone-opponents');
      });
      var statsBar = document.getElementById('my-stats-bar');
      if (statsBar) statsBar.style.display = 'none';
      var handBar = document.getElementById('hand-bar');
      if (handBar) handBar.style.display = 'none';
      var endBtn = document.getElementById('end-turn-btn');
      if (endBtn) endBtn.style.display = 'none';
      var turnLbl = document.getElementById('game-turn-label');
      if (turnLbl) {
        turnLbl.innerHTML = '&#128065; Spectating';
        turnLbl.style.color = '#a78bfa';
      }
      var tcb = document.getElementById('turn-cycle-badge');
      if (tcb) tcb.style.display = 'none';
      var fab = document.getElementById('game-fab');
      if (fab) fab.style.display = 'none';
      var roomRef = fbDB.ref('rooms/' + roomCode);
      var u1 = roomRef.on('value', function(snap) {
        var r = snap.val();
        if (!r) return;
        G.game.players = r.players || {};
        G.game.currentTurn = r.currentTurn || null;
        G.game.turnCycle = r.turnCycle || 1;
        updatePlayersStrip();
        if (G.currentZone === 'opponents') renderOpponentsZone();
      });
      G.listeners.push(function() {
        roomRef.off('value', u1);
      });
      var bfRef = fbDB.ref('rooms/' + roomCode + '/publicZones');
      var u2 = bfRef.on('value', function(snap) {
        G.cachedPublicZones = snap.val() || {};
        updatePlayersStrip();
        if (G.currentZone === 'opponents') renderOpponentsZone();
      });
      G.listeners.push(function() {
        bfRef.off('value', u2);
      });
      var joinTs = Date.now();
      var chatRef = fbDB.ref('rooms/' + roomCode + '/chat');
      var u3 = chatRef.limitToLast(100).on('child_added', function(snap) {
        var msg = snap.val();
        if (!msg) return;
        if ((msg.ts || 0) < joinTs - 5000) return;
        if (G.chatMessages.find(function(m) {
            return m.ts === msg.ts && m.pid === msg.pid;
          })) return;
        if (!msg.time) {
          var d = new Date(msg.ts || Date.now());
          msg.time = d.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
          });
        }
        msg.isMe = false;
        G.chatMessages.push(msg);
        if (G.currentZone === 'chat') renderChatMessages();
        else {
          G.chatUnread++;
          var ct = document.getElementById('chat-tab');
          if (ct) ct.classList.add('chat-tab-unread');
        }
      });
      G.listeners.push(function() {
        chatRef.off('child_added', u3);
      });
      renderOpponentsZone();
    }

    function openSoloGame() {
      if (!G.decks.length) {
        toast('Import a deck first');
        showScreen('decks');
        return;
      }
      openModal('<div class="modal-title">Start Solo Game</div><div class="flex flex-col gap-3"><div><label>Select Deck</label><select id="solo-deck">' + G.decks.map(function(d) {
        return '<option value="' + d.id + '">' + escH(d.name) + ' (' + d.format + ')</option>';
      }).join('') + '</select></div><div><label>Starting Life</label><select id="solo-life"><option value="20">20</option><option value="40" selected>40</option><option value="30">30</option></select></div><button class="btn btn-gold" id="solo-start-btn">Start Game</button></div>');
      document.getElementById('solo-start-btn').addEventListener('click', startSoloGame);
    }
    async function startSoloGame() {
      var deckId = document.getElementById('solo-deck').value;
      var life = parseInt(document.getElementById('solo-life').value);
      var saved = await loadBoardstateLocal(deckId);
      if (saved && saved.savedAt) {
        var ageMin = Math.round((Date.now() - saved.savedAt) / 60000);
        var ageStr = ageMin < 60 ? ageMin + 'm ago' : Math.round(ageMin / 60) + 'h ago';
        if (confirm('Resume saved game (' + ageStr + ')?\n\nOK = Resume  |  Cancel = Start Fresh')) {
          _pendingLocalRestore = saved;
        } else {
          clearBoardstateLocal(deckId);
          _pendingLocalRestore = null;
        }
      }
      var playerId = 'solo_' + Date.now();
      var deck = G.decks.find(function(d) {
        return d.id === deckId;
      });
      Object.assign(G.game, {
        roomCode: 'LOCAL',
        playerId: playerId,
        playerName: loadName() || 'You',
        format: deck ? deck.format : 'casual',
        deckId: deckId,
        isHost: true,
        startingLife: life,
        players: {}
      });
      closeModal();
      showScreen('game');
      document.getElementById('game-room-code').textContent = 'LOCAL';
      initGame(null, playerId, false);
    }
    var _pendingLocalRestore = null;

    // ── Game Init ─────────────────────────────────────────────────
    var _lastTurn = null;

    function initGame(roomCode, playerId, isRejoin) {
      var _wasLocalRestore = false;
      _lastTurn = null;
      G.game.isSpectator = false;
      G.listeners.forEach(function(f) {
        try {
          f();
        } catch (e) {}
      });
      G.listeners = [];
      G.cachedPublicZones = {};
      G.actionLog = [];
      G.chatMessages = [];
      G.chatUnread = 0;
      _dfcFetchPending = {};
      G.topRevealed = false;
      var deck = G.decks.find(function(d) {
        return d.id === G.game.deckId;
      });
      if (!deck) {
        toast('Deck not found');
        showScreen('lobby');
        return;
      }
      var ms = G.game.myState;
      ms.library = [];
      ms.hand = [];
      ms.battlefield = [];
      ms.graveyard = [];
      ms.exile = [];
      ms.command = [];
      ms.emblems = [];
      ms.life = G.game.startingLife;
      ms.poison = 0;
      ms.experience = 0;
      ms.energy = 0;
      ms.customCounters = {};
      ms.commanderDamage = {};
      ms.tokenTrackers = [];
      G.game.turnCycle = 1;
      G.game.mulligansLeft = 4;
      G.scryState = null;
      G.surveilState = null;
      var bfInner = document.getElementById('bf-inner');
      if (bfInner) bfInner.innerHTML = '';
      var deckMap = {};
      deck.cards.forEach(function(c) {
        deckMap[c.name] = c;
      });
      var cmdNames = new Set(deck.cards.filter(function(c) {
        return c.inCommandZone;
      }).map(function(c) {
        return c.name;
      }));
      deck.cards.forEach(function(c) {
        var inCmd = cmdNames.has(c.name);
        for (var i = 0; i < (inCmd ? 0 : c.qty); i++) {
          ms.library.push({
            id: uid(),
            name: c.name,
            image: c.image || null,
            backImage: c.backImage || null,
            isDFC: c.isDFC || false,
            currentFace: 0,
            type: c.type || '',
            cmc: c.cmc || 0,
            counters: {},
            facedown: false,
            attachedTo: null,
            attachments: [],
            x: null,
            y: null,
            bfPlaced: false,
            tapped: false
          });
        }
        if (inCmd) {
          ms.command.push({
            id: uid(),
            name: c.name,
            image: c.image || null,
            backImage: c.backImage || null,
            isDFC: c.isDFC || false,
            currentFace: 0,
            type: c.type || '',
            castCost: 0,
            counters: {},
            facedown: false,
            attachedTo: null,
            attachments: [],
            role: isCommanderType(c.type) ? 'Commander' : 'Command Zone',
            x: null,
            y: null,
            bfPlaced: false,
            tapped: false
          });
        }
      });
      if (isRejoin && roomCode) {
        G._noSync = true;
        fbDB.ref('rooms/' + roomCode + '/privateStates/' + playerId).get().then(function(snap) {
          var saved = snap.val();

          function rc(arr) {
            return toArr(arr).map(function(c) {
              var dk = deckMap[c.name] || {};
              return {
                id: c.id || uid(),
                name: c.name,
                type: c.type || dk.type || '',
                image: dk.image || c.image || null,
                backImage: c.backImage || dk.backImage || null,
                isDFC: c.isDFC || dk.isDFC || false,
                currentFace: c.currentFace || 0,
                counters: c.counters || {},
                facedown: c.facedown || false,
                attachedTo: c.attachedTo || null,
                attachments: c.attachments || [],
                tapped: c.tapped || false,
                castCost: c.castCost || 0,
                x: c.x !== undefined ? c.x : null,
                y: c.y !== undefined ? c.y : null,
                bfPlaced: c.bfPlaced || false
              };
            });
          }
          if (saved) {
            if (saved.hand) ms.hand = rc(toArr(saved.hand));
            if (saved.library) ms.library = rc(toArr(saved.library));
            if (saved.commanderDamage) ms.commanderDamage = saved.commanderDamage;
            if (saved.tokenTrackers) ms.tokenTrackers = saved.tokenTrackers;
            if (saved.life != null) ms.life = saved.life;
            if (saved.poison != null) ms.poison = saved.poison;
            if (saved.customCounters) ms.customCounters = saved.customCounters;
          }
          fbDB.ref('rooms/' + roomCode + '/publicZones/' + playerId).get().then(function(psnap) {
            var pz = psnap.val();
            if (pz) {
              function rp(arr, extra) {
                return toArr(arr).map(function(c) {
                  var dk = deckMap[c.name] || {};
                  var obj = {
                    id: c.id || uid(),
                    name: c.name,
                    type: c.type || dk.type || '',
                    image: c.image || dk.image || null,
                    backImage: c.backImage || dk.backImage || null,
                    isDFC: c.isDFC || dk.isDFC || false,
                    currentFace: c.currentFace || 0,
                    counters: decodeCounters(c.counters || {}),
                    facedown: c.facedown || false,
                    attachedTo: c.attachedTo || null,
                    attachments: toArr(c.attachments),
                    tapped: c.tapped || false,
                    x: (c.x != null) ? c.x : null,
                    y: (c.y != null) ? c.y : null,
                    bfPlaced: c.bfPlaced || false,
                    isToken: c.isToken || false,
                    morphName: c.morphName || null
                  };
                  if (extra) Object.assign(obj, extra(c, dk));
                  return obj;
                });
              }
              ms.battlefield = rp(pz.battlefield);
              ms.graveyard = rp(pz.graveyard);
              ms.exile = rp(pz.exile, function(c) {
                return {
                  isImpulse: c.isImpulse || false
                };
              });
              if (pz.command && pz.command.length) {
                ms.command = rp(pz.command, function(c, dk) {
                  return {
                    castCost: c.castCost || 0,
                    role: c.role || dk.role || 'Command Zone'
                  };
                });
              }
            }
            G._noSync = false;
            updateGameUI();
            renderBattlefield();
            _doSyncPublicZones();
            _doSyncPrivateState();
            syncStats();
            logAction('Reconnected — boardstate restored');
          }).catch(function(e) {
            G._noSync = false;
            console.error('Rejoin publicZones error', e);
          });
        }).catch(function(e) {
          G._noSync = false;
          console.error('Rejoin privateState error', e);
        });
      } else if (_pendingLocalRestore) {
        _wasLocalRestore = true;
        var ls = _pendingLocalRestore;
        _pendingLocalRestore = null;

        function rcLocal(arr) {
          return (arr || []).map(function(c) {
            var dk = deckMap[c.name] || {};
            return {
              id: c.id || uid(),
              name: c.name,
              type: c.type || dk.type || '',
              image: c.image || dk.image || null,
              backImage: c.backImage || dk.backImage || null,
              isDFC: c.isDFC || dk.isDFC || false,
              currentFace: c.currentFace || 0,
              counters: decodeCounters(c.counters || {}),
              facedown: c.facedown || false,
              attachedTo: c.attachedTo || null,
              attachments: c.attachments || [],
              tapped: c.tapped || false,
              castCost: c.castCost || 0,
              x: (c.x !== undefined && c.x !== null) ? c.x : null,
              y: (c.y !== undefined && c.y !== null) ? c.y : null,
              bfPlaced: c.bfPlaced || false,
              isToken: c.isToken || false,
              isEmblem: c.isEmblem || false,
              isImpulse: c.isImpulse || false,
              role: c.role || null,
              morphName: c.morphName || null
            };
          });
        }
        ms.hand = rcLocal(ls.hand);
        ms.library = rcLocal(ls.library);
        ms.battlefield = rcLocal(ls.battlefield);
        ms.graveyard = rcLocal(ls.graveyard);
        ms.exile = rcLocal(ls.exile);
        ms.command = rcLocal(ls.command);
        ms.life = (ls.life != null) ? ls.life : ms.life;
        ms.poison = ls.poison || 0;
        ms.experience = ls.experience || 0;
        ms.energy = ls.energy || 0;
        ms.customCounters = ls.customCounters || {};
        ms.commanderDamage = ls.commanderDamage || {};
        ms.tokenTrackers = ls.tokenTrackers || [];
        G.game.turnCycle = ls.turnCycle || 1;
        logAction('Boardstate restored from local save');
      } else {
        shuffle(ms.library);
        for (var i = 0; i < 7 && ms.library.length > 0; i++) ms.hand.push(ms.library.shift());
      }
      if (roomCode) {
        var roomRef = fbDB.ref('rooms/' + roomCode);
        var myPid = playerId;
        var u1 = roomRef.on('value', function(snap) {
          var room = snap.val();
          if (!room) return;
          if (G.screen !== 'game') return;
          if (room.kicked && room.kicked[myPid]) {
            G._noSync = false;
            G.listeners.forEach(function(f) {
              try {
                f();
              } catch (e) {}
            });
            G.listeners = [];
            showScreen('home');
            document.getElementById('game-fab').style.display = 'none';
            toast('You were kicked from the game.', 5000);
            return;
          }
          var prevMsLife = G.game.myState.life;
          var prevMsPoison = G.game.myState.poison;
          var prevMsExp = G.game.myState.experience;
          var prevMsEnergy = G.game.myState.energy;
          var prevMsCC = G.game.myState.customCounters;
          G.game.players = room.players || {};
          if (G.game.players[myPid]) {
            G.game.players[myPid].life = prevMsLife;
            G.game.players[myPid].poison = prevMsPoison;
            G.game.players[myPid].experience = prevMsExp;
            G.game.players[myPid].energy = prevMsEnergy;
            G.game.players[myPid].customCounters = prevMsCC;
          }
          G.game.currentTurn = room.currentTurn || myPid;
          G.game.turnCycle = room.turnCycle || 1;
          checkTurnTransition();
          updatePlayersStrip();
          updateTurnUI();
          updateZoneCounts();
          if (G.currentZone === 'opponents') renderOpponentsZone();
        });
        G.listeners.push(function() {
          roomRef.off('value', u1);
        });
        var bfRef = fbDB.ref('rooms/' + roomCode + '/publicZones');
        var u2 = bfRef.on('value', function(snap) {
          G.cachedPublicZones = snap.val() || {};
          updatePlayersStrip();
          if (G.screen === 'game' && G.currentZone === 'opponents') renderOpponentsZone();
        });
        G.listeners.push(function() {
          bfRef.off('value', u2);
        });
        var joinTs = Date.now();
        var actRef = fbDB.ref('rooms/' + roomCode + '/actions');
        // Suppress individual action toasts during the reconnect burst — they flood otherwise
        var u3 = actRef.limitToLast(30).on('child_added', function(snap) {
          var a = snap.val();
          if (!a || a.pid === myPid) return;
          if (a.ts && a.ts < joinTs - 5000) return;
          if (G.screen !== 'game') return;
          if (G._reconnecting) {
            G._reconnectBurst = (G._reconnectBurst || 0) + 1;
            logAction(getActionText(a), a.name);
            return;
          }
          handleRemote(a);
        });
        G.listeners.push(function() {
          actRef.off('child_added', u3);
        });
        var chatRef = fbDB.ref('rooms/' + roomCode + '/chat');
        var u4 = chatRef.limitToLast(100).on('child_added', function(snap) {
          var msg = snap.val();
          if (!msg) return;
          if ((msg.pid === myPid) && ((Date.now() - (msg.ts || 0)) < 5000)) return;
          if (G.chatMessages.find(function(m) {
              return m.ts === msg.ts && m.pid === msg.pid;
            })) return;
          if (!msg.time) {
            var d = new Date(msg.ts || Date.now());
            msg.time = d.toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit'
            });
          }
          msg.isMe = (msg.pid === myPid);
          G.chatMessages.push(msg);
          if (G.screen === 'game') {
            if (G.currentZone === 'chat') {
              renderChatMessages();
            } else {
              G.chatUnread++;
              var ct = document.getElementById('chat-tab');
              if (ct) ct.classList.add('chat-tab-unread');
              if (!msg.isMe && !G._reconnecting) toast('\u{1F4AC} ' + escH(msg.name) + ': ' + msg.msg, 4000);
            }
          }
        });
        G.listeners.push(function() {
          chatRef.off('child_added', u4);
        });
        // Monitor Firebase connection state — show offline dot and suppress reconnect toast floods
        G._wasOffline = false;
        G._reconnecting = false;
        G._reconnectBurst = 0;
        var connRef = fbDB.ref('.info/connected');
        var connCb = connRef.on('value', function(snap) {
          if (G.screen !== 'game') return;
          var isOnline = snap.val() === true;
          var dot = document.getElementById('conn-status');
          if (dot) {
            if (isOnline) dot.classList.add('hidden');
            else dot.classList.remove('hidden');
          }
          if (isOnline && G._wasOffline) {
            G._wasOffline = false;
            G._reconnecting = true;
            // Give Firebase 2 s to flush the backlog, then show a single summary toast
            setTimeout(function() {
              var burst = G._reconnectBurst || 0;
              if (burst > 0) toast('Reconnected \u2713 \u2014 ' + burst + ' action' + (burst !== 1 ? 's' : '') + ' synced', 3000);
              else toast('Reconnected \u2713', 2000);
              G._reconnecting = false;
              G._reconnectBurst = 0;
            }, 2000);
          } else if (!isOnline && !G._wasOffline) {
            G._wasOffline = true;
            G._reconnecting = false;
            G._reconnectBurst = 0;
            toast('Connection lost \u2014 reconnecting\u2026', 4000);
          }
        });
        G.listeners.push(function() {
          connRef.off('value', connCb);
        });
        syncStats();
        if (!isRejoin) {
          syncPublicZones();
          syncPrivateState();
        }
        fbDB.ref('rooms/' + roomCode + '/lastActive').set(Date.now());
      } else {
        var p = {};
        p[playerId] = {
          name: G.game.playerName,
          life: ms.life,
          poison: 0,
          experience: 0,
          energy: 0,
          customCounters: {}
        };
        G.game.players = p;
        G.game.currentTurn = playerId;
      }
      if (G.screen !== 'game') {
        showScreen('game');
      }
      document.getElementById('game-room-code').textContent = roomCode || 'LOCAL';
      G.currentZone = 'battlefield';
      document.querySelectorAll('.zone-pane').forEach(function(z) {
        z.classList.remove('active');
      });
      document.querySelectorAll('.zone-tab').forEach(function(t) {
        t.classList.remove('active');
        t.classList.remove('hidden');
      });
      var zbf = document.getElementById('zone-battlefield');
      if (zbf) zbf.classList.add('active');
      var ztbf = document.querySelector('.zone-tab[data-zone="battlefield"]');
      if (ztbf) ztbf.classList.add('active');
      var cmdTab = document.getElementById('command-tab');
      if (G.game.format === 'commander' || ms.command.length > 0) cmdTab.classList.remove('hidden');
      else cmdTab.classList.add('hidden');
      updateGameUI();
      updatePlayersStrip();
      updateTurnUI();
      renderCommandZone();
      updateTopRevealedUI();
      if (!isRejoin && !_wasLocalRestore) setTimeout(function() {
        offerMulligan();
      }, 400);
      logAction(isRejoin ? 'Reconnected to game' : 'Game started');
    }

    // ── Mulligan ──────────────────────────────────────────────────
    function offerMulligan() {
      var ms = G.game.myState;
      var cardImgsHtml = ms.hand.map(function(c) {
        if (c.image) return '<img src="' + c.image + '" style="width:60px;height:84px;border-radius:5px;object-fit:cover" loading="lazy"/>';
        return '<img src="" data-cardname="' + escH(c.name) + '" style="width:60px;height:84px;border-radius:5px;background:hsl(var(--muted));display:block" loading="lazy"/>';
      }).join('');
      var _mulUsed = 4 - G.game.mulligansLeft;
      var _mullBtn = _mulUsed === 0 ? 'Mulligan (Free)' : 'Mulligan (' + G.game.mulligansLeft + ')';
      var _mullHint = _mulUsed === 0 ? 'Free — keep all 7!' : 'London mulligan — put ' + _mulUsed + ' card' + (_mulUsed === 1 ? '' : 's') + ' on bottom';
      openModal('<div class="modal-title">Opening Hand</div><div style="text-align:center;margin-bottom:.75rem;font-size:.85rem;color:hsl(var(--muted-fg))">You drew ' + ms.hand.length + ' cards. Keep or mulligan?</div><div style="display:flex;flex-wrap:wrap;gap:.4rem;justify-content:center;margin-bottom:1rem">' + cardImgsHtml + '</div><div class="flex gap-2"><button class="btn btn-gold flex-1" id="mull-keep-btn">\u2713 Keep</button>' + (G.game.mulligansLeft > 0 ? '<button class="btn btn-danger flex-1" id="mull-do-btn">\u21B7 ' + _mullBtn + '</button>' : '') + '</div><div style="font-size:.72rem;color:hsl(var(--muted-fg));text-align:center;margin-top:.5rem">' + _mullHint + '</div>');
      loadMulliganImages();
      var kb = document.getElementById('mull-keep-btn');
      if (kb) kb.addEventListener('click', function() {
        closeModal();
        toast('Hand kept!');
      });
      var mb = document.getElementById('mull-do-btn');
      if (mb) mb.addEventListener('click', doMulligan);
    }

    function loadMulliganImages() {
      document.querySelectorAll('#modal-container img[data-cardname]').forEach(function(img) {
        var name = img.dataset.cardname;
        if (!name) return;
        var cached = sfCache[name];
        if (cached) {
          var url = cardImg(cached, 0);
          if (url) {
            img.src = url;
            delete img.dataset.cardname;
            return;
          }
        }
        fetchCard(name).then(function(sf) {
          if (!sf) return;
          var url = cardImg(sf, 0);
          if (!url) return;
          if (img.dataset.cardname === name) img.src = url;
        });
      });
    }

    function doMulligan() {
      var ms = G.game.myState;
      var mulUsed = 4 - G.game.mulligansLeft;
      var keepCount = mulUsed === 0 ? 7 : Math.max(0, 7 - mulUsed);
      ms.library.push.apply(ms.library, ms.hand);
      ms.hand = [];
      shuffle(ms.library);
      for (var i = 0; i < 7 && ms.library.length > 0; i++) ms.hand.push(ms.library.shift());
      G.game.mulligansLeft--;
      updateGameUI();
      closeModal();
      if (keepCount < 7) setTimeout(function() {
        offerMulliganBottom(keepCount);
      }, 200);
      else setTimeout(offerMulligan, 200);
    }

    function offerMulliganBottom(keepCount) {
      var ms = G.game.myState;
      var toBottom = ms.hand.length - keepCount;
      if (toBottom <= 0) {
        setTimeout(offerMulligan, 200);
        return;
      }
      openModal('<div class="modal-title">Choose ' + toBottom + ' to Put on Bottom</div><div style="font-size:.8rem;color:hsl(var(--muted-fg));margin-bottom:.75rem">Select ' + toBottom + ' card' + (toBottom > 1 ? 's' : '') + ' to put on the bottom.</div><div id="mull-hand" style="display:flex;flex-wrap:wrap;gap:.4rem;justify-content:center;margin-bottom:1rem"></div><div id="mull-status" style="font-size:.78rem;text-align:center;margin-bottom:.5rem;color:hsl(var(--muted-fg))">0 / ' + toBottom + ' selected</div><button class="btn btn-gold w-full" id="mull-confirm-btn" disabled>Confirm</button>');
      var hand = document.getElementById('mull-hand');
      var selected = new Set();
      ms.hand.forEach(function(c, i) {
        var el = document.createElement('div');
        el.style.cssText = 'cursor:pointer;border-radius:5px;border:2px solid transparent;transition:border-color .15s';
        if (c.image) {
          el.innerHTML = '<img src="' + c.image + '" style="width:65px;height:91px;border-radius:5px;object-fit:cover" loading="lazy"/>';
        } else {
          el.innerHTML = '<img src="" data-cardname="' + escH(c.name) + '" style="width:65px;height:91px;border-radius:5px;background:hsl(var(--muted));display:block" loading="lazy"/>';
        }
        el.addEventListener('click', function() {
          if (selected.has(i)) {
            selected.delete(i);
            el.style.borderColor = 'transparent';
          } else if (selected.size < toBottom) {
            selected.add(i);
            el.style.borderColor = 'var(--gold)';
          }
          document.getElementById('mull-status').textContent = selected.size + ' / ' + toBottom + ' selected';
          document.getElementById('mull-confirm-btn').disabled = selected.size !== toBottom;
        });
        hand.appendChild(el);
      });
      loadMulliganImages();
      document.getElementById('mull-confirm-btn').addEventListener('click', function() {
        var idxs = Array.from(selected).sort(function(a, b) {
          return b - a;
        });
        var bottomed = idxs.map(function(i) {
          return ms.hand.splice(i, 1)[0];
        });
        ms.library.push.apply(ms.library, bottomed);
        updateGameUI();
        closeModal();
        setTimeout(offerMulligan, 200);
      });
    }

    // ── Sync ──────────────────────────────────────────────────────
    function encodeCounters(obj) {
      var out = {};
      Object.keys(obj || {}).forEach(function(k) {
        out[k.replace(/\//g, '|')] = obj[k];
      });
      return out;
    }

    function decodeCounters(obj) {
      var out = {};
      Object.keys(obj || {}).forEach(function(k) {
        out[k.replace(/\|/g, '/')] = obj[k];
      });
      return out;
    }

    function serializeCard(c) {
      return {
        id: c.id,
        name: c.name,
        type: c.type || '',
        cmc: c.cmc || 0,
        isDFC: c.isDFC || false,
        currentFace: c.currentFace || 0,
        facedown: c.facedown || false,
        tapped: c.tapped || false,
        counters: encodeCounters(c.counters || {}),
        attachedTo: c.attachedTo || null,
        attachments: c.attachments || [],
        castCost: c.castCost || 0,
        x: (c.x !== undefined && c.x !== null) ? c.x : null,
        y: (c.y !== undefined && c.y !== null) ? c.y : null,
        bfPlaced: c.bfPlaced || false,
        backImage: c.backImage || null
      };
    }

    // ── LOCAL Boardstate Persistence ──────────────────────────────
    var _bsSaveTimer = null;
    var _syncPubTimer = null;
    var _syncPrivTimer = null;

    function scheduleSyncPublicZones() {
      clearTimeout(_syncPubTimer);
      _syncPubTimer = setTimeout(function() {
        _doSyncPublicZones();
      }, 200);
    }

    function scheduleSyncPrivateState() {
      clearTimeout(_syncPrivTimer);
      _syncPrivTimer = setTimeout(function() {
        _doSyncPrivateState();
      }, 200);
    }

    function scheduleBoardstateSave() {
      if (!G.game.roomCode || G.game.roomCode !== 'LOCAL') return;
      clearTimeout(_bsSaveTimer);
      _bsSaveTimer = setTimeout(saveBoardstateLocal, 600);
    }

    function saveBoardstateLocal() {
      if (!G.game.deckId || G.game.roomCode !== 'LOCAL') return;
      var ms = G.game.myState;

      function fullCard(c) {
        var s = serializeCard(c);
        s.image = c.image || null;
        s.backImage = c.backImage || null;
        s.isDFC = c.isDFC || false;
        s.type = c.type || '';
        s.isToken = c.isToken || false;
        s.isEmblem = c.isEmblem || false;
        s.isImpulse = c.isImpulse || false;
        s.role = c.role || null;
        s.morphName = c.morphName || null;
        return s;
      }
      var state = {
        deckId: G.game.deckId,
        format: G.game.format,
        startingLife: G.game.startingLife,
        turnCycle: G.game.turnCycle || 1,
        life: ms.life,
        poison: ms.poison,
        experience: ms.experience,
        energy: ms.energy,
        customCounters: ms.customCounters || {},
        commanderDamage: ms.commanderDamage || {},
        tokenTrackers: ms.tokenTrackers || [],
        hand: ms.hand.map(fullCard),
        library: ms.library.map(fullCard),
        battlefield: ms.battlefield.map(fullCard),
        graveyard: ms.graveyard.map(fullCard),
        exile: ms.exile.map(fullCard),
        command: ms.command.map(fullCard),
        savedAt: Date.now()
      };
      idbPut(STORE_BOARDSTATE, state).catch(function(e) {
        console.warn('Failed to save boardstate:', e);
      });
    }

    function loadBoardstateLocal(deckId) {
      return idbGet(STORE_BOARDSTATE, deckId).then(function(r) {
        return r || null;
      }).catch(function() {
        return null;
      });
    }

    function clearBoardstateLocal(deckId) {
      idbDelete(STORE_BOARDSTATE, deckId).catch(function() {});
    }

    function syncStats() {
      if (!G.game.roomCode || G.game.roomCode === 'LOCAL') {
        scheduleBoardstateSave();
        return;
      }
      if (G._noSync) return;
      var ms = G.game.myState;
      fbDB.ref('rooms/' + G.game.roomCode + '/players/' + G.game.playerId).update({
        life: ms.life,
        poison: ms.poison,
        experience: ms.experience,
        energy: ms.energy,
        customCounters: ms.customCounters,
        name: G.game.playerName
      });
      fbDB.ref('rooms/' + G.game.roomCode + '/lastActive').set(Date.now());
    }

    function _doSyncPrivateState() {
      if (!G.game.roomCode || G.game.roomCode === 'LOCAL') return;
      if (G._noSync) return;
      var ms = G.game.myState;
      fbDB.ref('rooms/' + G.game.roomCode + '/privateStates/' + G.game.playerId).set({
        hand: ms.hand.map(serializeCard),
        library: ms.library.map(serializeCard),
        commanderDamage: ms.commanderDamage || {},
        tokenTrackers: ms.tokenTrackers || [],
        life: ms.life,
        poison: ms.poison,
        customCounters: ms.customCounters || {},
        savedAt: Date.now()
      });
    }

    function syncPrivateState() {
      if (!G.game.roomCode || G.game.roomCode === 'LOCAL') {
        scheduleBoardstateSave();
        return;
      }
      scheduleSyncPrivateState();
    }

    function _doSyncPublicZones() {
      if (!G.game.roomCode || G.game.roomCode === 'LOCAL') return;
      if (G._noSync) return;
      var ms = G.game.myState;
      fbDB.ref('rooms/' + G.game.roomCode + '/publicZones/' + G.game.playerId).set({
        battlefield: ms.battlefield.map(function(c) {
          return {
            id: c.id,
            name: c.name,
            type: c.type || '',
            image: c.image || null,
            backImage: c.backImage || null,
            isToken: c.isToken || false,
            isDFC: c.isDFC || false,
            currentFace: c.currentFace || 0,
            tapped: c.tapped || false,
            facedown: c.facedown || false,
            counters: encodeCounters(c.counters || {}),
            attachedTo: c.attachedTo || null,
            attachments: c.attachments || [],
            x: (c.x != null) ? c.x : null,
            y: (c.y != null) ? c.y : null,
            bfPlaced: c.bfPlaced || false,
            morphName: c.morphName || null
          };
        }),
        graveyard: ms.graveyard.map(function(c) {
          return {
            id: c.id,
            name: c.name,
            image: c.image || null,
            type: c.type || '',
            facedown: c.facedown || false
          };
        }),
        exile: ms.exile.map(function(c) {
          return {
            id: c.id,
            name: c.name,
            image: c.image || null,
            type: c.type || '',
            facedown: c.facedown || false,
            isImpulse: c.isImpulse || false
          };
        }),
        command: ms.command.map(function(c) {
          return {
            id: c.id,
            name: c.name,
            image: c.image || null,
            backImage: c.backImage || null,
            isDFC: c.isDFC || false,
            type: c.type || '',
            castCost: c.castCost || 0,
            role: c.role || 'Command Zone'
          };
        }),
        handCount: ms.hand.length,
        topCard: (G.topRevealed && ms.library.length ? {
          name: ms.library[0].name,
          image: ms.library[0].image || null
        } : null)
      });
    }

    function syncPublicZones() {
      if (!G.game.roomCode || G.game.roomCode === 'LOCAL') {
        scheduleBoardstateSave();
        return;
      }
      scheduleSyncPublicZones();
    }

    function sendAction(type, data) {
      if (!G.game.roomCode || G.game.roomCode === 'LOCAL') return;
      fbDB.ref('rooms/' + G.game.roomCode + '/actions').push({
        pid: G.game.playerId,
        name: G.game.playerName,
        type: type,
        data: data,
        ts: Date.now()
      });
    }

    function sendChatToFirebase(msg) {
      if (!G.game.roomCode || G.game.roomCode === 'LOCAL') return;
      var now = new Date();
      var time = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });
      fbDB.ref('rooms/' + G.game.roomCode + '/chat').push({
        pid: G.game.playerId,
        name: G.game.playerName,
        msg: msg,
        ts: Date.now(),
        time: time
      });
    }

    function handleRemote(a) {
      logAction(getActionText(a), a.name);
      switch (a.type) {
        case 'play_card':
          toast(a.data.facedown ? a.name + ' played a card face down' : a.name + ' played ' + a.data.cardName);
          break;
        case 'draw':
          toast(a.name + ' drew ' + a.data.n + ' card' + (a.data.n > 1 ? 's' : ''));
          break;
        case 'shuffle':
          toast(a.name + ' shuffled');
          break;
        case 'tap':
          toast(a.name + ' ' + (a.data.tapped ? 'tapped' : 'untapped') + ' ' + a.data.cardName);
          break;
        case 'flip':
          toast(a.name + ' flipped ' + a.data.cardName);
          break;
        case 'token':
          toast(a.name + ' created ' + a.data.qty + 'x ' + a.data.tokenName);
          break;
        case 'flip_coin':
          toast(a.name + ' flipped: ' + a.data.result);
          break;
        case 'roll_dice':
          toast(a.name + ' rolled d' + a.data.sides + ': ' + a.data.result);
          break;
        case 'end_turn':
          toast(a.name + ' ended their turn');
          break;
        case 'reset_game':
          toast(a.name + ' reset the game — fresh start!', 5000);
          break;
      }
    }

    function getActionText(a) {
      switch (a.type) {
        case 'play_card':
          return a.data.facedown ? 'played a card face down' : 'played ' + a.data.cardName;
        case 'draw':
          return 'drew ' + a.data.n + ' card' + (a.data.n > 1 ? 's' : '');
        case 'shuffle':
          return 'shuffled their library';
        case 'tap':
          return (a.data.tapped ? 'tapped' : 'untapped') + ' ' + a.data.cardName;
        case 'flip':
          return 'flipped ' + a.data.cardName;
        case 'token':
          return 'created ' + a.data.qty + 'x ' + a.data.tokenName;
        case 'flip_coin':
          return 'flipped a coin: ' + a.data.result;
        case 'roll_dice':
          return 'rolled d' + a.data.sides + ': ' + a.data.result;
        case 'end_turn':
          return 'ended their turn';
        case 'reset_game':
          return 'reset the game';
        default:
          return a.type;
      }
    }

    // ── Chat ──────────────────────────────────────────────────────
    function renderChatMessages() {
      var el = document.getElementById('chat-messages');
      if (!el) return;
      el.innerHTML = G.chatMessages.map(function(m) {
        return '<div class="chat-msg ' + (m.isMe ? 'mine' : '') + '"><div><span class="chat-msg-name">' + escH(m.name) + '</span><span class="chat-msg-time">' + (m.time || '') + '</span></div><div>' + escH(m.msg) + '</div></div>';
      }).join('');
      el.scrollTop = el.scrollHeight;
    }

    function sendChatMessage() {
      var input = document.getElementById('chat-input');
      var msg = input && input.value && input.value.trim();
      if (!msg) return;
      input.value = '';
      var now = new Date();
      var time = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });
      var ts = Date.now();
      G.chatMessages.push({
        pid: G.game.playerId,
        name: G.game.playerName,
        msg: msg,
        isMe: true,
        time: time,
        ts: ts
      });
      renderChatMessages();
      sendChatToFirebase(msg);
      logAction('\u{1F4AC} ' + msg);
    }

    function sendChatPrompt() {
      openModal('<div class="modal-title">Chat</div><div class="flex flex-col gap-3"><input id="chat-msg-prompt" placeholder="Message\u2026" autocomplete="off"/><button class="btn btn-gold" id="chat-send-btn">Send</button></div>');

      function send() {
        var el = document.getElementById('chat-msg-prompt');
        var msg = el && el.value.trim();
        if (!msg) return;
        closeModal();
        var now = new Date();
        var time = now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit'
        });
        G.chatMessages.push({
          pid: G.game.playerId,
          name: G.game.playerName,
          msg: msg,
          isMe: true,
          time: time,
          ts: Date.now()
        });
        sendChatToFirebase(msg);
        logAction('\u{1F4AC} ' + msg);
        toast('You: ' + msg, 3000);
      }
      document.getElementById('chat-send-btn').addEventListener('click', send);
      document.getElementById('chat-msg-prompt').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') send();
      });
    }

    // ── Game UI ───────────────────────────────────────────────────
    function updateGameUI() {
      updateZoneCounts();
      renderBattlefield();
      renderHandBar();
      renderZoneGrid('graveyard');
      renderZoneGrid('exile');
      updateMyStats();
      updateLibraryDisplay();
      syncPublicZones();
      syncPrivateState();
    }

    function updateZoneCounts() {
      var ms = G.game.myState;
      var el;
      if ((el = document.getElementById('cnt-battlefield'))) el.textContent = ms.battlefield.length;
      if ((el = document.getElementById('cnt-library'))) el.textContent = ms.library.length;
      if ((el = document.getElementById('cnt-graveyard'))) el.textContent = ms.graveyard.length;
      if ((el = document.getElementById('cnt-exile'))) el.textContent = ms.exile.length;
      if ((el = document.getElementById('cnt-command'))) el.textContent = ms.command.length;
      if ((el = document.getElementById('hand-count-label'))) el.textContent = '(' + ms.hand.length + ' card' + (ms.hand.length !== 1 ? 's' : '') + ')';
    }

    function updateMyStats() {
      var ms = G.game.myState;
      var lv = document.getElementById('my-life-val');
      if (lv) {
        lv.textContent = ms.life;
        lv.style.color = ms.life <= 5 ? '#f87171' : ms.life <= 10 ? '#fbbf24' : '';
      }
      var pv = document.getElementById('my-poison-val');
      if (pv) pv.textContent = ms.poison;
      var ev = document.getElementById('my-exp-val');
      if (ev) ev.textContent = ms.experience;
      var se = document.getElementById('stat-exp');
      if (se && ms.experience > 0) se.style.display = '';
      var ccEl = document.getElementById('custom-counter-stats');
      if (ccEl) {
        ccEl.innerHTML = Object.entries(ms.customCounters).map(function(entry) {
          var k = entry[0],
            v = entry[1];
          return '<div class="stat-group"><div class="stat-label">' + escH(k.slice(0, 6)) + '</div><div class="life-edit"><button class="life-btn" data-counter="' + k + '" data-delta="-1">&minus;</button><div class="stat-num">' + v + '</div><button class="life-btn" data-counter="' + k + '" data-delta="1">+</button></div></div>';
        }).join('');
        ccEl.querySelectorAll('[data-counter]').forEach(function(btn) {
          btn.addEventListener('click', function() {
            changeMyCounter(btn.dataset.counter, parseInt(btn.dataset.delta));
          });
        });
      }
    }

    function updateLibraryDisplay() {
      var el = document.getElementById('library-count-display');
      if (el) el.textContent = G.game.myState.library.length;
      updateTopRevealedUI();
    }

    function updateTopRevealedUI() {
      var btn = document.getElementById('reveal-top-btn');
      if (btn) {
        btn.style.background = G.topRevealed ? 'rgba(200,168,75,.2)' : '';
        btn.style.color = G.topRevealed ? 'var(--gold)' : '';
      }
      var banner = document.getElementById('top-library-banner');
      var libReveal = document.getElementById('lib-top-reveal');
      if (G.topRevealed && G.game.myState.library.length) {
        var top = G.game.myState.library[0];
        var img = top.image || (sfCache[top.name] ? cardImg(sfCache[top.name], 0) : null);
        if (banner) {
          banner.textContent = 'Top of library: ' + top.name;
          banner.classList.remove('hidden');
        }
        if (libReveal) {
          libReveal.innerHTML = '<div style="font-size:.62rem;color:var(--gold);text-transform:uppercase;letter-spacing:.07em;margin-bottom:.35rem;font-family:\'JetBrains Mono\',monospace">👁 Revealed Top Card</div>' +
            (img ? '<img src="' + escH(img) + '" style="width:145px;border-radius:10px;box-shadow:0 4px 18px rgba(0,0,0,.55);cursor:zoom-in" onclick="zoomCard({name:' + JSON.stringify(top.name) + ',image:' + JSON.stringify(img) + ',isDFC:false,facedown:false})">' : '<div style="font-size:.85rem;color:hsl(var(--fg));font-weight:600">' + escH(top.name) + '</div>');
          if (!img) {
            fetchCard(top.name).then(function(sf) {
              if (sf) {
                var u = cardImg(sf, 0);
                if (u && G.topRevealed && G.game.myState.library[0] && G.game.myState.library[0].name === top.name) {
                  var lr = document.getElementById('lib-top-reveal');
                  if (lr) lr.querySelector('img,div.font-size') && (updateTopRevealedUI());
                }
              }
            });
          }
        }
      } else {
        if (banner) banner.classList.add('hidden');
        if (libReveal) libReveal.innerHTML = '';
      }
    }

    function toggleTopRevealed() {
      G.topRevealed = !G.topRevealed;
      updateTopRevealedUI();
      syncPublicZones();
      if (G.topRevealed && G.game.myState.library.length) {
        toast('Revealing top: ' + G.game.myState.library[0].name);
      }
    }

    function initBfPinchZoom() {
      var bfEl = document.getElementById('zone-battlefield');
      if (!bfEl || bfEl._pinchInit) return;
      bfEl._pinchInit = true;
      var scale = 1,
        startDist = 0,
        startScale = 1;

      function ptDist(t1, t2) {
        var dx = t1.clientX - t2.clientX,
          dy = t1.clientY - t2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
      }
      bfEl.addEventListener('touchstart', function(e) {
        if (e.touches.length === 2) {
          startDist = ptDist(e.touches[0], e.touches[1]);
          startScale = scale;
          e.preventDefault();
        }
      }, {
        passive: false
      });
      bfEl.addEventListener('touchmove', function(e) {
        if (e.touches.length === 2) {
          e.preventDefault();
          scale = Math.min(3, Math.max(0.25, startScale * (ptDist(e.touches[0], e.touches[1]) / startDist)));
          var inner = document.getElementById('bf-inner');
          if (inner) {
            inner.style.transformOrigin = 'top left';
            inner.style.transform = 'scale(' + scale + ')';
          }
        }
      }, {
        passive: false
      });
      // Double-tap to reset zoom
      var lastTap = 0;
      bfEl.addEventListener('touchend', function(e) {
        var now = Date.now();
        if (now - lastTap < 300 && e.touches.length === 0) {
          scale = 1;
          var inner = document.getElementById('bf-inner');
          if (inner) inner.style.transform = '';
        }
        lastTap = now;
      }, {
        passive: true
      });
    }

    function updateTurnUI() {
      var isMyTurn = G.game.currentTurn === G.game.playerId;
      var tp = G.game.players && G.game.currentTurn ? G.game.players[G.game.currentTurn] : null;
      var lbl = document.getElementById('game-turn-label');
      if (lbl) lbl.innerHTML = isMyTurn ? '\u2605 Your Turn' : escH(tp ? tp.name : '&mdash;') + "'s Turn";
      if (lbl) lbl.style.color = isMyTurn ? 'var(--gold)' : '';
      var tcb = document.getElementById('turn-cycle-badge');
      if (tcb) tcb.textContent = 'Turn ' + (G.game.turnCycle || 1);
      var btn = document.getElementById('end-turn-btn');
      if (btn) {
        btn.disabled = !isMyTurn;
        btn.style.opacity = isMyTurn ? '1' : '0.4';
        btn.style.cursor = isMyTurn ? 'pointer' : 'not-allowed';
      }
    }

    function updatePlayersStrip() {
      var el = document.getElementById('players-strip');
      if (!el) return;
      var pz = G.cachedPublicZones || {};
      el.innerHTML = Object.entries(G.game.players || {}).map(function(entry) {
        var pid = entry[0],
          p = entry[1];
        var isMe = pid === G.game.playerId,
          isTurn = pid === G.game.currentTurn;
        var hc = (!isMe && pz[pid] && pz[pid].handCount != null) ? pz[pid].handCount : null;
        return '<div class="player-card ' + (isTurn ? 'active-turn ' : '' + (isMe ? 'me' : '')) + '" data-pid="' + pid + '"><div class="player-card-name">' + escH(p.name) + (isMe ? ' (You)' : '') + '</div><div class="player-life ' + (p.life <= 5 ? 'low' : '') + '">' + p.life + '</div><div class="player-counters">' + (p.poison ? '<div class="counter-chip">\u2620' + p.poison + '</div>' : '') + (hc != null ? '<div class="counter-chip" title="Cards in hand">\u270B' + hc + '</div>' : '') + '</div></div>';
      }).join('');
      el.querySelectorAll('[data-pid]').forEach(function(card) {
        card.addEventListener('click', function() {
          openPlayerDetail(card.dataset.pid);
        });
      });
      updateTurnUI();
    }

    function openPlayerDetail(pid) {
      var p = G.game.players[pid];
      if (!p) return;
      var isMe = pid === G.game.playerId;
      var ms = G.game.myState;
      var cmdDmg = (!isMe && ms.commanderDamage) ? ms.commanderDamage[pid] || 0 : null;
      var stats = [
        ['Life', '\u2764\uFE0F', 'life'],
        ['Poison', '\u2620', 'poison'],
        ['Experience', '\u2605', 'experience'],
        ['Energy', '\u26A1', 'energy']
      ];
      openModal('<div class="modal-title">' + escH(p.name) + (isMe ? ' (You)' : '') + '</div>' +
        '<div class="flex flex-col gap-1">' + stats.map(function(s) {
          var lbl = s[0],
            icon = s[1],
            key = s[2];
          var val = key === 'life' ? p.life : (p[key] || 0);
          return '<div class="counter-row"><div class="counter-name">' + icon + ' ' + lbl + '</div><div class="counter-controls">' + (isMe ? '<button class="life-btn pd-minus" data-key="' + key + '">&minus;</button>' : '') + '<div class="counter-val" style="font-size:1.3rem">' + val + '</div>' + (isMe ? '<button class="life-btn pd-plus" data-key="' + key + '">+</button>' : '') + '</div></div>';
        }).join('') +
        (cmdDmg !== null && G.game.format === 'commander' ? '<div class="counter-row"><div class="counter-name" style="color:var(--gold)">\u2694 Cmdr Dmg from them</div><div class="counter-controls"><button class="life-btn pd-cmd-minus" data-pid="' + pid + '">&minus;</button><div class="counter-val" style="font-size:1.3rem;color:' + (cmdDmg >= 21 ? '#f87171' : 'var(--gold)') + '">' + cmdDmg + '</div><button class="life-btn pd-cmd-plus" data-pid="' + pid + '">+</button></div></div>' : '') +
        '</div>' + (isMe ? '<hr class="divider"><div class="flex gap-2" style="flex-wrap:wrap"><button class="btn btn-xs" id="pd-set-life">Set Life</button><button class="btn btn-xs" id="pd-counters">\u{1F4C4} Add Counter</button>' + (G.game.format === 'commander' ? '<button class="btn btn-xs btn-gold" id="pd-cmd-dmg">\u2694 Cmdr Dmg</button>' : '') + '<button class="btn btn-xs" id="pd-coin">Flip Coin</button><button class="btn btn-xs" id="pd-dice">Roll Die</button><button class="btn btn-xs" id="pd-chat">\u{1F4AC} Chat</button></div>' : '<hr class="divider"><button class="btn btn-sm" id="pd-view-opp">\u{1F441} View Their Zones</button>')
      );
      document.querySelectorAll('.pd-minus').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var k = btn.dataset.key;
          if (k === 'life') changeMyLife(-1);
          else changeMyCounter(k, -1);
          closeModal();
          openPlayerDetail(pid);
        });
      });
      document.querySelectorAll('.pd-plus').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var k = btn.dataset.key;
          if (k === 'life') changeMyLife(1);
          else changeMyCounter(k, 1);
          closeModal();
          openPlayerDetail(pid);
        });
      });
      document.querySelectorAll('.pd-cmd-minus').forEach(function(btn) {
        btn.addEventListener('click', function() {
          changeCommanderDamage(btn.dataset.pid, -1);
          closeModal();
          openPlayerDetail(pid);
        });
      });
      document.querySelectorAll('.pd-cmd-plus').forEach(function(btn) {
        btn.addEventListener('click', function() {
          changeCommanderDamage(btn.dataset.pid, 1);
          closeModal();
          openPlayerDetail(pid);
        });
      });
      var pdsl = document.getElementById('pd-set-life');
      if (pdsl) pdsl.addEventListener('click', openLifeModal);
      var pdco = document.getElementById('pd-counters');
      if (pdco) pdco.addEventListener('click', openCounterModal);
      var pdcd = document.getElementById('pd-cmd-dmg');
      if (pdcd) pdcd.addEventListener('click', openCommanderDamageModal);
      var pdcn = document.getElementById('pd-coin');
      if (pdcn) pdcn.addEventListener('click', flipCoin);
      var pddi = document.getElementById('pd-dice');
      if (pddi) pddi.addEventListener('click', rollDice);
      var pdch = document.getElementById('pd-chat');
      if (pdch) pdch.addEventListener('click', sendChatPrompt);
      var pdvo = document.getElementById('pd-view-opp');
      if (pdvo) pdvo.addEventListener('click', function() {
        openOpponentZonesModal(pid);
      });
    }

    function openOpponentZonesModal(pid) {
      var p = G.game.players[pid];
      if (!p) return;
      var pz = (G.cachedPublicZones || {})[pid] || {};
      var bf = toArr(pz.battlefield),
        gy = toArr(pz.graveyard),
        ex = toArr(pz.exile),
        cmd = toArr(pz.command);
      var BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

      function cardHtml(c, dim) {
        var face = c.currentFace || 0;
        var ci = (c.isDFC && face === 1 && c.backImage) ? c.backImage : (c.image || null);
        if (c.facedown && !dim) return '<div style="width:var(--cw);height:var(--ch);background:linear-gradient(135deg,hsl(215 30% 20%),hsl(215 20% 12%));border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;color:var(--gold);border:1px solid hsl(var(--border));flex-shrink:0">\u2605</div>';
        return '<div class="card-thumb opp-zone-card" data-name="' + escH(c.name || '') + '" data-img="' + (ci || '') + '" data-face="' + face + '" style="opacity:' + (dim ? '.75' : '1') + '">' +
          '<img src="' + BLANK + '" class="opp-lazy-modal" data-cardname="' + escH(c.name || '') + '" data-face="' + face + '" data-img="' + (ci || '') + '">' +
          (c.tapped ? '<div class="facedown-label">TAP</div>' : '') +
          '</div>';
      }

      function section(title, icon, arr, dim) {
        if (!arr.length) return '<div style="color:hsl(var(--muted-fg));font-size:.78rem;margin-bottom:.6rem">' + icon + ' ' + title + ': empty</div>';
        return '<div style="margin-bottom:.85rem">' +
          '<div class="panel-title">' + icon + ' ' + title + ' <span class="zone-count" style="display:inline-block;margin-left:.2rem">' + arr.length + '</span></div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:.45rem;max-height:40vh;overflow-y:auto;padding:.15rem .05rem">' + arr.map(function(c) {
            return cardHtml(c, dim);
          }).join('') + '</div>' +
          '</div>';
      }
      openModal(
        '<div class="modal-title">\uD83D\uDC41 ' + escH(p.name) + "'s Public Zones</div>" +
        section('Battlefield', '\u2694', bf, false) +
        section('Graveyard', '\uD83D\uDC80', gy, true) +
        section('Exile', '\uD83C\uDF05', ex, false) +
        (cmd.length ? '<div style="margin-bottom:.5rem"><div class="panel-title">\uD83D\uDC51 Command Zone</div><div style="font-size:.78rem;color:var(--gold)">' + cmd.map(function(c) {
          return escH(c.name || '') + (c.castCost ? '<span style="font-size:.65rem;opacity:.7"> (+' + (c.castCost * 2) + ')</span>' : '');
        }).join(', ') + '</div></div>' : ''),
        '500px'
      );
      // Attach zoom on click
      var modal = document.querySelector('.modal');
      if (!modal) return;
      modal.querySelectorAll('.opp-zone-card').forEach(function(th) {
        th.addEventListener('click', function() {
          var name = th.dataset.name,
            img = th.dataset.img,
            face = parseInt(th.dataset.face || '0') || 0;
          zoomCard({
            name: name,
            image: img || null,
            isDFC: false,
            facedown: false
          });
        });
      });
      // Load images
      modal.querySelectorAll('img.opp-lazy-modal').forEach(function(img) {
        if (img.dataset.img) {
          img.src = img.dataset.img;
          return;
        }
        var name = img.dataset.cardname;
        var face = parseInt(img.dataset.face || '0') || 0;
        var fc = oppCardImgFromCache(name, face);
        if (fc) {
          img.src = fc;
          img.dataset.img = fc;
          return;
        }
        fetchCard(name).then(function(c) {
          if (c) {
            var url = cardImg(c, face) || cardImg(c, 0);
            if (url) {
              img.src = url;
              img.dataset.img = url;
            }
          }
        });
      });
    }

    // ── Commander Damage ──────────────────────────────────────────
    function changeCommanderDamage(pid, delta) {
      var ms = G.game.myState;
      if (!ms.commanderDamage) ms.commanderDamage = {};
      ms.commanderDamage[pid] = Math.max(0, (ms.commanderDamage[pid] || 0) + delta);
      var dmg = ms.commanderDamage[pid];
      updatePlayersStrip();
      if (dmg >= 21) toast('\u26A0\uFE0F 21+ cmdr damage from ' + (G.game.players[pid] ? G.game.players[pid].name : 'opponent') + '!', 4000);
    }

    function openCommanderDamageModal() {
      var ms = G.game.myState;
      var opponents = Object.entries(G.game.players).filter(function(e) {
        return e[0] !== G.game.playerId;
      });
      if (!opponents.length) {
        toast('No opponents to track');
        return;
      }
      openModal('<div class="modal-title">\u2694 Commander Damage</div><div style="font-size:.78rem;color:hsl(var(--muted-fg));margin-bottom:.75rem">21+ combat damage from same commander = loss.</div><div id="cdm-rows" class="flex flex-col gap-3"></div>', '440px');

      function renderRows() {
        var el = document.getElementById('cdm-rows');
        if (!el) return;
        el.innerHTML = opponents.map(function(entry) {
          var pid = entry[0],
            p = entry[1];
          var dmg = ms.commanderDamage[pid] || 0;
          return '<div style="background:hsl(var(--muted));border-radius:var(--radius);padding:.6rem"><div style="font-size:.75rem;font-weight:600;margin-bottom:.4rem;color:' + (dmg >= 21 ? '#f87171' : dmg >= 15 ? '#fbbf24' : 'hsl(var(--fg))') + '">' + escH(p.name) + (dmg >= 21 ? ' \u26A0\uFE0F' : '') + '</div><div style="display:flex;align-items:center;gap:.5rem"><button class="btn btn-sm cmd-dmg-minus" data-pid="' + pid + '">&minus;</button><div style="font-family:Cinzel,serif;font-size:1.8rem;font-weight:700;flex:1;text-align:center;color:' + (dmg >= 21 ? '#f87171' : dmg >= 15 ? '#fbbf24' : 'var(--gold)') + '">' + dmg + '</div><button class="btn btn-sm cmd-dmg-plus" data-pid="' + pid + '">+</button></div><div style="font-size:.65rem;color:hsl(var(--muted-fg));text-align:center;margin-top:.25rem">' + (21 - Math.min(dmg, 21)) + ' to lethal</div></div>';
        }).join('');
        el.querySelectorAll('[data-pid]').forEach(function(btn) {
          btn.addEventListener('click', function() {
            changeCommanderDamage(btn.dataset.pid, btn.classList.contains('cmd-dmg-plus') ? 1 : -1);
            renderRows();
          });
        });
      }
      renderRows();
    }

    // ── Opponents Zone ────────────────────────────────────────────
    function renderOpponentsZone() {
      var el = document.getElementById('opponents-content');
      if (!el) return;
      var opponents = Object.entries(G.game.players || {}).filter(function(e) {
        return e[0] !== G.game.playerId;
      });
      if (!opponents.length) {
        el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">\u{1F30D}</div><div style="font-size:.83rem">No opponents yet</div></div>';
        return;
      }
      var zones = G.cachedPublicZones || {};
      el.innerHTML = opponents.map(function(entry) {
        return renderOpponentSection(entry[0], entry[1], zones[entry[0]] || null);
      }).join('');
      attachOpponentHandlers(el);
      loadOpponentImages(el);
    }

    function oppCardImgFromCache(name, face) {
      if (!name) return null;
      var c = sfCache[name];
      if (!c) return null;
      return cardImg(c, face || 0) || cardImg(c, 0);
    }

    function loadOpponentImages(el) {
      el.querySelectorAll('img.opp-lazy[data-cardname]').forEach(function(img) {
        // data-img is set by oppMini when c.image (custom art) or sfCache was already available.
        // Don't overwrite — that would stomp custom arts with the default Scryfall printing.
        if (img.dataset.img) {
          return;
        }
        var name = img.dataset.cardname;
        var face = parseInt(img.dataset.face || '0') || 0;
        var fc = oppCardImgFromCache(name, face);
        if (fc) {
          img.src = fc;
          img.dataset.img = fc;
          return;
        }
        fetchCard(name).then(function(c) {
          if (c) {
            var url = cardImg(c, face) || cardImg(c, 0);
            if (url) {
              img.src = url;
              img.dataset.img = url;
            }
          }
        });
      });
    }

    function renderOpponentSection(pid, p, pz) {
      var ms = G.game.myState;
      var cmdDmg = ms.commanderDamage ? ms.commanderDamage[pid] || 0 : 0;
      var bf = toArr(pz && pz.battlefield),
        gy = toArr(pz && pz.graveyard),
        ex = toArr(pz && pz.exile),
        cmd = toArr(pz && pz.command);
      var oppHandCount = (pz && pz.handCount != null) ? pz.handCount : null;
      var BLANK_IMG = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

      function oppMini(c, isGy, isEx) {
        var face = c.currentFace || 0;
        var sn = escH(c.name || '');
        // Prefer the synced card image (preserves custom art set by the card owner).
        // For DFC back face use backImage; otherwise use c.image.
        // Only fall back to sfCache if the card has no image data at all.
        var ci = (c.isDFC && face === 1 && c.backImage) ? c.backImage : (c.image || oppCardImgFromCache(c.name, 0) || null);
        var cntE = c.counters ? Object.entries(decodeCounters(c.counters)).filter(function(e) {
          return e[1] > 0;
        }) : [];
        var extra = (c.attachedTo ? '<div style="position:absolute;top:-5px;left:-5px;font-size:.58rem;background:rgba(200,168,75,.9);color:#000;border-radius:3px;padding:1px 3px;line-height:1;z-index:2" title="Attached/Paired">\uD83D\uDD17</div>' : '');
        var attachBadge = '';
        if (!isGy && !isEx && c.attachments && c.attachments.length) {
          var aNames = c.attachments.map(function(aid) {
            var ac = bf.find(function(x) {
              return x.id === aid;
            });
            return ac ? (ac.name || '?').slice(0, 10) : '?';
          });
          attachBadge = '<div style="position:absolute;bottom:-5px;left:-5px;font-size:.48rem;background:rgba(138,70,200,.9);color:#fff;border-radius:3px;padding:1px 3px;line-height:1.2;z-index:2;max-width:70px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="Equipped/Enchanted by: ' + escH(aNames.join(', ')) + '">\u2B41\uFE0F ' + escH(aNames.slice(0, 2).join(', ')) + '</div>';
        }
        return '<div class="opp-card-mini ' + (c.tapped ? 'tapped-mini' : '') + (c.attachedTo ? ' paired-mini' : '') + '" data-oppname="' + sn + '">' +
          '<img class="opp-lazy' + (isGy || isEx ? ' opp-mini-sm' : '') + '" src="' + (ci || BLANK_IMG) + '" data-cardname="' + sn + '" data-face="' + face + '" data-img="' + (ci || '') + '" style="background:hsl(var(--muted));' + (isGy ? 'opacity:.75' : '') + '" loading="lazy" title="' + sn + (c.tapped ? ' (tapped)' : '') + (c.attachedTo ? ' [\uD83D\uDD17 attached]' : '') + '">' +
          extra + attachBadge +
          (cntE.length && !isGy && !isEx ? '<div class="opp-counter-badges">' + cntE.map(function(e) {
            return '<div class="opp-counter-badge" title="' + escH(e[0]) + '">' + escH(e[0].slice(0, 3)) + ':' + e[1] + '</div>';
          }).join('') + '</div>' : '') +
          '</div>';
      }
      // Graveyard mini strip (first 3 visible + More button)
      var gyCards = gy.map(function(c) {
        return {
          name: c.name,
          image: c.image || null
        };
      });
      var gyHtml = gy.length ? '<div style="margin-top:.3rem"><div style="font-size:.6rem;color:hsl(var(--muted-fg));text-transform:uppercase;letter-spacing:.07em;margin-bottom:.2rem">\u{1F480} Graveyard (' + gy.length + ')</div><div style="display:flex;gap:.3rem;align-items:center;flex-wrap:nowrap;padding-bottom:.15rem">' + gy.slice(-3).map(function(c) {
        return oppMini(c, true, false);
      }).join('') + (gy.length > 3 ? '<button class="opp-zone-more-btn" data-zone-label="Graveyard" data-cards-json="' + escH(JSON.stringify(gyCards)) + '" style="flex-shrink:0;height:59px;min-width:42px;background:hsl(var(--muted));border:1px solid hsl(var(--border));border-radius:4px;font-size:.55rem;color:hsl(var(--muted-fg));cursor:pointer;padding:.2rem .3rem;line-height:1.3">+' + (gy.length - 3) + '<br>more</button>' : '') + '</div></div>' : '';
      // Exile mini strip (first 3 visible + More button)
      var exCards = ex.map(function(c) {
        return {
          name: c.name,
          image: c.image || null
        };
      });
      var exHtml = ex.length ? '<div style="margin-top:.3rem"><div style="font-size:.6rem;color:hsl(var(--muted-fg));text-transform:uppercase;letter-spacing:.07em;margin-bottom:.2rem">\u{1F304} Exile (' + ex.length + ')</div><div style="display:flex;gap:.3rem;align-items:center;flex-wrap:nowrap;padding-bottom:.15rem">' + ex.slice(-3).map(function(c) {
        return oppMini(c, false, true);
      }).join('') + (ex.length > 3 ? '<button class="opp-zone-more-btn" data-zone-label="Exile" data-cards-json="' + escH(JSON.stringify(exCards)) + '" style="flex-shrink:0;height:59px;min-width:42px;background:hsl(var(--muted));border:1px solid hsl(var(--border));border-radius:4px;font-size:.55rem;color:hsl(var(--muted-fg));cursor:pointer;padding:.2rem .3rem;line-height:1.3">+' + (ex.length - 3) + '<br>more</button>' : '') + '</div></div>' : '';
      return '<div class="opponent-zone-section">' +
        '<div class="opponent-zone-header"><span>\u{1F464}</span><span style="font-size:.88rem;color:hsl(var(--fg));font-weight:600">' + escH(p.name) + '</span>' +
        (G.game.currentTurn === pid ? '<span style="color:var(--gold);font-size:.72rem">\u25CF Active</span>' : '') +
        '<div style="display:flex;gap:.3rem;align-items:center;flex-wrap:wrap;margin-left:auto">' +
        '<div style="font-size:.75rem;font-family:Cinzel,serif;font-weight:700;color:' + (p.life <= 5 ? '#f87171' : p.life <= 10 ? '#fbbf24' : '') + '">' + p.life + '</div>' +
        (p.poison ? '<div style="font-size:.72rem;color:#f87171">\u2620' + p.poison + '</div>' : '') +
        (G.game.format === 'commander' ? '<div class="opp-cmd-dmg-chip ' + (cmdDmg >= 21 ? 'danger' : '') + ' opp-cdm-btn" data-pid="' + pid + '">\u2694 ' + cmdDmg + (cmdDmg >= 21 ? ' \u26A0' : '') + '</div>' : '') +
        (oppHandCount != null ? '<div title="Cards in hand" style="display:flex;align-items:center;gap:.18rem;font-size:.72rem;color:hsl(var(--muted-fg));background:hsl(var(--muted));border:1px solid hsl(var(--border));border-radius:5px;padding:.1rem .35rem;font-weight:600">\u270B\u00A0' + oppHandCount + '</div>' : '') +
        '</div></div>' +
        (bf.length ? (function() {
          var BF_TYPE_GROUPS = [{
              label: '\u2694\uFE0F Creatures',
              test: function(c) {
                return !c.facedown && (c.type || '').includes('Creature');
              }
            },
            {
              label: '\u25C8 Planeswalkers',
              test: function(c) {
                return !c.facedown && (c.type || '').includes('Planeswalker');
              }
            },
            {
              label: '\u2699\uFE0F Artifacts',
              test: function(c) {
                var t = c.type || '';
                return !c.facedown && t.includes('Artifact') && !t.includes('Creature');
              }
            },
            {
              label: '\u2728 Enchantments',
              test: function(c) {
                var t = c.type || '';
                return !c.facedown && t.includes('Enchantment') && !t.includes('Creature');
              }
            },
            {
              label: '\u26F0\uFE0F Lands',
              test: function(c) {
                return !c.facedown && (c.type || '').includes('Land');
              }
            },
            {
              label: '\u2605 Face Down',
              test: function(c) {
                return !!c.facedown;
              }
            },
            {
              label: 'Other',
              test: function() {
                return true;
              }
            }
          ];
          var assigned = new Array(bf.length).fill(false);
          var groups = BF_TYPE_GROUPS.map(function(g) {
            var cards = [];
            bf.forEach(function(c, i) {
              if (!assigned[i] && g.test(c)) {
                cards.push(c);
                assigned[i] = true;
              }
            });
            return {
              label: g.label,
              cards: cards
            };
          }).filter(function(g) {
            return g.cards.length > 0;
          });
          var h = '<div style="margin-top:.3rem"><div style="font-size:.62rem;color:hsl(var(--muted-fg));text-transform:uppercase;letter-spacing:.08em;margin-bottom:.3rem">Battlefield (' + bf.length + ')</div>';
          groups.forEach(function(g) {
            h += '<div style="margin-bottom:.4rem"><div style="font-size:.54rem;color:hsl(var(--muted-fg));opacity:.8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.14rem">' + escH(g.label) + ' \u00B7 ' + g.cards.length + '</div>';
            h += '<div class="opponent-bf-scroll">';
            g.cards.forEach(function(c) {
              if (c.facedown) h += '<div style="width:56px;height:78px;background:linear-gradient(135deg,hsl(215 30% 20%),hsl(215 20% 12%));border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:.6rem;color:var(--gold);opacity:.5;flex-shrink:0">\u2605</div>';
              else h += oppMini(c, false, false);
            });
            h += '</div></div>';
          });
          h += '</div>';
          return h;
        })() : '<div style="margin-top:.3rem;font-size:.72rem;color:hsl(var(--muted-fg))">Battlefield: empty</div>') +
        gyHtml + exHtml +
        (cmd.length ? '<div style="margin-top:.35rem"><div style="font-size:.6rem;color:hsl(var(--muted-fg));text-transform:uppercase;letter-spacing:.07em;margin-bottom:.25rem">\u{1F451} Command Zone</div><div style="display:flex;gap:.4rem;flex-wrap:wrap;align-items:flex-start">' + cmd.map(function(c) {
          var ci = c.image || oppCardImgFromCache(c.name, 0) || null;
          return '<div style="display:flex;flex-direction:column;align-items:center;gap:.2rem;cursor:pointer" onclick="zoomCard({name:' + JSON.stringify(c.name) + ',image:' + JSON.stringify(ci || '') + ',isDFC:' + (c.isDFC ? 'true' : 'false') + ',facedown:false})" title="View ' + escH(c.name) + '">' + (ci ? '<img src="' + escH(ci) + '" style="width:52px;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,.5)">' : '<div style="width:52px;height:73px;background:hsl(var(--muted));border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:.5rem;color:var(--gold);text-align:center;padding:2px">' + escH(c.name) + '</div>') + '<div style="font-size:.5rem;color:var(--gold);text-align:center;max-width:58px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (c.castCost ? 'Tax +' + (c.castCost * 2) : '') + '</div></div>';
        }).join('') + '</div></div>' : '') +
        (pz && pz.topCard ? '<div style="margin-top:.35rem"><div style="font-size:.6rem;color:hsl(var(--muted-fg));text-transform:uppercase;letter-spacing:.07em;margin-bottom:.2rem">\uD83D\uDC41 Top of Library</div>' + oppMini({
          name: pz.topCard.name,
          image: pz.topCard.image || null
        }, false, false) + '</div>' : '') +
        '</div>';
    }

    function attachOpponentHandlers(el) {
      el.querySelectorAll('.opp-zone-more-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          try {
            var cards = JSON.parse(btn.dataset.cardsJson);
            showOppZoneModal(btn.dataset.zoneLabel, cards);
          } catch (e) {}
        });
      });
      el.querySelectorAll('.opp-card-mini').forEach(function(mini) {
        mini.addEventListener('click', function() {
          var name = mini.dataset.oppname || '';
          var img = mini.querySelector('img');
          var imgSrc = (img && img.dataset.img) || '';
          if (name) zoomCard({
            name: name,
            image: imgSrc || null,
            isDFC: false,
            facedown: false
          });
        });
      });
      el.querySelectorAll('.opp-cdm-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var pid = btn.dataset.pid;
          openModal('<div class="modal-title">\u2694 Cmdr Dmg \u2014 ' + escH(G.game.players[pid] ? G.game.players[pid].name : '') + '</div><div id="quick-cdm-content"></div>');

          function renderQuick() {
            var ms = G.game.myState;
            var dmg = ms.commanderDamage ? (ms.commanderDamage[pid] || 0) : 0;
            var el2 = document.getElementById('quick-cdm-content');
            if (!el2) return;
            el2.innerHTML = '<div style="display:flex;align-items:center;gap:.75rem;justify-content:center;padding:.75rem 0"><button class="btn btn-sm quick-cdm-minus" data-pid="' + pid + '">&minus;</button><div style="font-family:Cinzel,serif;font-size:2.5rem;font-weight:700;color:' + (dmg >= 21 ? '#f87171' : dmg >= 15 ? '#fbbf24' : 'var(--gold)') + ';">' + dmg + '</div><button class="btn btn-sm quick-cdm-plus" data-pid="' + pid + '">+</button></div><div style="text-align:center;font-size:.72rem;color:hsl(var(--muted-fg))">' + (dmg >= 21 ? '\u26A0\uFE0F LETHAL' : (21 - dmg) + ' more to lethal') + '</div>';
            el2.querySelectorAll('[data-pid]').forEach(function(b) {
              b.addEventListener('click', function() {
                changeCommanderDamage(b.dataset.pid, b.classList.contains('quick-cdm-plus') ? 1 : -1);
                renderQuick();
              });
            });
          }
          renderQuick();
        });
      });
    }

    // ── Life & Counters ───────────────────────────────────────────
    function changeMyLife(delta) {
      G.game.myState.life += delta;
      if (G.game.players[G.game.playerId]) G.game.players[G.game.playerId].life = G.game.myState.life;
      updateMyStats();
      updatePlayersStrip();
      syncStats();
      logAction('Life \u2192 ' + G.game.myState.life);
      toast('Life: ' + G.game.myState.life);
    }

    function changeMyCounter(key, delta) {
      var ms = G.game.myState;
      if (key === 'poison' || key === 'experience' || key === 'energy') ms[key] = Math.max(0, ms[key] + delta);
      else ms.customCounters[key] = Math.max(0, (ms.customCounters[key] || 0) + delta);
      updateMyStats();
      syncStats();
    }

    function openLifeModal() {
      openModal('<div class="modal-title">Set Life Total</div><div class="flex flex-col gap-3"><div><label>Life Total</label><input id="life-input" type="number" value="' + G.game.myState.life + '" style="font-size:1.4rem;text-align:center"/></div><div class="flex gap-2" style="flex-wrap:wrap">' + [-5, -3, -2, -1, 1, 2, 3, 5].map(function(n) {
        return '<button class="btn btn-sm life-adj-btn" data-n="' + n + '">' + (n > 0 ? '+' : '') + n + '</button>';
      }).join('') + '</div><button class="btn btn-gold" id="life-set-btn">Set</button></div>');
      document.querySelectorAll('.life-adj-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          changeMyLife(parseInt(btn.dataset.n));
          document.getElementById('life-input').value = G.game.myState.life;
        });
      });
      document.getElementById('life-set-btn').addEventListener('click', function() {
        var v = parseInt(document.getElementById('life-input').value);
        if (!isNaN(v)) {
          G.game.myState.life = v;
          if (G.game.players[G.game.playerId]) G.game.players[G.game.playerId].life = v;
          updateMyStats();
          updatePlayersStrip();
          syncStats();
        }
        closeModal();
      });
    }

    function openCounterModal() {
      var ms = G.game.myState;

      function buildHtml() {
        var entries = Object.entries(ms.customCounters);
        if (!entries.length) return '<div style="color:hsl(var(--muted-fg));font-size:.75rem;text-align:center;padding:.4rem">No custom counters</div>';
        return entries.map(function(entry) {
          var k = entry[0],
            v = entry[1];
          return '<div class="counter-row" style="background:hsl(var(--muted));border-radius:var(--radius);padding:.35rem .5rem;margin-bottom:.25rem"><div class="counter-name">' + escH(k) + '</div><div class="counter-controls"><button class="life-btn cc-dec" data-key="' + k + '">&minus;</button><div class="counter-val" style="font-size:1.1rem;color:var(--gold)">' + v + '</div><button class="life-btn cc-inc" data-key="' + k + '">+</button><button class="btn btn-xs btn-danger cc-del" data-key="' + k + '" style="margin-left:.25rem">\u2715</button></div></div>';
        }).join('');
      }
      openModal('<div class="modal-title">Player Counters</div><div id="cc-list">' + buildHtml() + '</div><hr class="divider"/><div class="flex flex-col gap-2"><div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:hsl(var(--muted-fg));margin-bottom:.1rem">Add Counter</div><div class="flex gap-2"><input id="counter-name-input" placeholder="Counter name\u2026" style="flex:1"/><input id="counter-val-input" type="number" value="1" style="width:60px"/><button class="btn btn-gold btn-sm" id="cc-add-btn">Add</button></div></div>', '440px');

      function refresh() {
        var cl = document.getElementById('cc-list');
        if (cl) cl.innerHTML = buildHtml();
        rebind();
        updateMyStats();
        syncStats();
      }

      function rebind() {
        document.querySelectorAll('.cc-inc').forEach(function(btn) {
          btn.addEventListener('click', function() {
            ms.customCounters[btn.dataset.key] = (ms.customCounters[btn.dataset.key] || 0) + 1;
            refresh();
          });
        });
        document.querySelectorAll('.cc-dec').forEach(function(btn) {
          btn.addEventListener('click', function() {
            ms.customCounters[btn.dataset.key] = Math.max(0, (ms.customCounters[btn.dataset.key] || 0) - 1);
            refresh();
          });
        });
        document.querySelectorAll('.cc-del').forEach(function(btn) {
          btn.addEventListener('click', function() {
            delete ms.customCounters[btn.dataset.key];
            refresh();
          });
        });
      }
      rebind();
      document.getElementById('cc-add-btn').addEventListener('click', function() {
        var name = (document.getElementById('counter-name-input').value || '').trim();
        var val = parseInt(document.getElementById('counter-val-input').value) || 1;
        if (!name) {
          toast('Enter a counter name');
          return;
        }
        ms.customCounters[name] = (ms.customCounters[name] || 0) + val;
        document.getElementById('counter-name-input').value = '';
        document.getElementById('counter-val-input').value = '1';
        refresh();
        toast('"' + name + '" added');
      });
    }

    // ── Card Counter Modal ────────────────────────────────────────
    var COUNTER_PRESETS = [{
        name: '+1/+1',
        key: 'p1p1',
        color: '#4ade80'
      },
      {
        name: '-1/-1',
        key: 'm1m1',
        color: '#f87171'
      },
      {
        name: 'Loyalty',
        key: 'loyalty',
        color: '#60a5fa'
      },
      {
        name: 'Level',
        key: 'level',
        color: '#c8a84b'
      },
      {
        name: 'Charge',
        key: 'charge',
        color: '#a78bfa'
      },
      {
        name: 'Age',
        key: 'age',
        color: '#fb923c'
      },
      {
        name: '+2/+2',
        key: 'p2p2',
        color: '#86efac'
      },
      {
        name: 'Doom',
        key: 'doom',
        color: '#f87171'
      },
      {
        name: 'Feather',
        key: 'feather',
        color: '#e9d5ff'
      },
      {
        name: 'Tapped',
        key: 'tapped',
        color: '#ADD8E6'
      },
      {
        name: 'Amount',
        key: 'amnt',
        color: '#4ade80'
      },
      {
        name: 'Stun',
        key: 'stun',
        color: '#ADD8E6'
      },
      {
        name: 'Lore',
        key: 'lore',
        color: '#fde68a'
      }
    ];

    var KEYWORD_COUNTER_TYPES = ['Flying', 'First Strike', 'Double Strike', 'Deathtouch', 'Hexproof', 'Indestructible', 'Lifelink', 'Menace', 'Reach', 'Trample', 'Vigilance', 'Haste', 'Flash', 'Ward', 'Infect', 'Wither', 'Undying', 'Persist', 'Toxic', 'Backup', 'Training', 'Riot', 'Escape', 'Blitz', 'Evolve', 'Scavenge', 'Outlast', 'Renown', 'Regenerate'];

    function openCardCounterModal(cardId, zone) {
      var arr = zone === 'battlefield' ? G.game.myState.battlefield : zone === 'graveyard' ? G.game.myState.graveyard : zone === 'exile' ? G.game.myState.exile : zone === 'command' ? G.game.myState.command : G.game.myState.battlefield;
      var card = arr.find(function(c) {
        return c.id === cardId;
      });
      if (!card) return;
      if (!card.counters) card.counters = {};

      function buildCounterListHtml() {
        var entries = Object.entries(card.counters).filter(function(e) {
          return e[1] > 0;
        });
        if (!entries.length) return '<div style="color:hsl(var(--muted-fg));font-size:.75rem;text-align:center;padding:.4rem">No counters on this card</div>';
        return entries.map(function(entry) {
          var k = entry[0],
            v = entry[1];
          var isKw = KEYWORD_COUNTER_TYPES.indexOf(k) >= 0;
          return '<div class="keyword-counter-row"><div class="keyword-counter-name" style="color:' + (isKw ? '#a78bfa' : '') + '">' + escH(k) + '</div>' +
            '<div class="keyword-counter-controls">' +
            '<button class="btn btn-xs card-cnt-dec" data-key="' + escH(k) + '">&minus;</button>' +
            '<input class="card-cnt-input" data-key="' + escH(k) + '" type="number" value="' + v + '" style="width:48px;text-align:center;font-family:Cinzel,serif;font-weight:700;padding:.2rem .3rem;font-size:.9rem"/>' +
            '<button class="btn btn-xs card-cnt-inc" data-key="' + escH(k) + '">+</button>' +
            '<button class="btn btn-xs btn-danger card-cnt-del" data-key="' + escH(k) + '" style="margin-left:.2rem">\u2715</button>' +
            '</div></div>';
        }).join('');
      }

      openModal(
        '<div class="modal-title" style="font-size:.9rem">\u{1F3F7}\uFE0F Counters: <span style="color:var(--gold)">' + escH(card.name) + '</span></div>' +
        '<div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;color:hsl(var(--muted-fg));margin-bottom:.4rem">Quick Add</div>' +
        '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:.3rem;margin-bottom:.75rem">' +
        COUNTER_PRESETS.map(function(p) {
          return '<button class="btn btn-xs card-preset-btn" data-key="' + p.key + '" style="background:rgba(0,0,0,.2);border-color:' + p.color + ';color:' + p.color + ';font-size:.65rem;padding:.25rem .2rem">' + p.name + '</button>';
        }).join('') +
        '</div>' +
        '<div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;color:#a78bfa;margin-bottom:.35rem">\u{1F4D6} Keyword Counters</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:.25rem;margin-bottom:.6rem">' +
        KEYWORD_COUNTER_TYPES.slice(0, 16).map(function(k) {
          return '<div class="rules-ql-btn card-kw-quick" data-kw="' + k + '" style="font-size:.62rem;padding:.15rem .38rem;cursor:pointer;color:#a78bfa;border-color:rgba(168,85,247,.3)">' + k + '</div>';
        }).join('') +
        '</div>' +
        '<hr class="divider"/>' +
        '<div id="card-cnt-list" style="border:1px solid hsl(var(--border));border-radius:var(--radius);overflow:hidden;margin-bottom:.75rem">' + buildCounterListHtml() + '</div>' +
        '<div class="flex gap-2">' +
        '<input id="card-cnt-name" list="card-cnt-suggestions" placeholder="Custom counter\u2026" style="flex:1"/>' +
        '<datalist id="card-cnt-suggestions">' + KEYWORD_COUNTER_TYPES.map(function(k) {
          return '<option value="' + k + '"/>';
        }).join('') + '</datalist>' +
        '<input id="card-cnt-val" type="number" value="1" style="width:52px"/>' +
        '<button class="btn btn-gold btn-xs" id="card-cnt-add">Add</button></div>',
        '420px'
      );

      function refreshList() {
        var listEl = document.getElementById('card-cnt-list');
        if (listEl) listEl.innerHTML = buildCounterListHtml();
        rebindCardCounters();
        if (zone === 'battlefield') {
          renderBattlefield();
          syncPublicZones();
        } else if (zone === 'graveyard') renderZoneGrid('graveyard');
        else if (zone === 'exile') renderZoneGrid('exile');
        else if (zone === 'command') renderCommandZone();
      }

      function rebindCardCounters() {
        document.querySelectorAll('.card-cnt-inc').forEach(function(btn) {
          btn.addEventListener('click', function() {
            card.counters[btn.dataset.key] = (card.counters[btn.dataset.key] || 0) + 1;
            refreshList();
          });
        });
        document.querySelectorAll('.card-cnt-dec').forEach(function(btn) {
          btn.addEventListener('click', function() {
            card.counters[btn.dataset.key] = Math.max(0, (card.counters[btn.dataset.key] || 0) - 1);
            refreshList();
          });
        });
        document.querySelectorAll('.card-cnt-del').forEach(function(btn) {
          btn.addEventListener('click', function() {
            delete card.counters[btn.dataset.key];
            refreshList();
          });
        });
        document.querySelectorAll('.card-cnt-input').forEach(function(inp) {
          inp.addEventListener('change', function() {
            var v = parseInt(inp.value);
            if (!isNaN(v) && v >= 0) {
              card.counters[inp.dataset.key] = v;
              refreshList();
            }
          });
        });
      }

      document.querySelectorAll('.card-preset-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          card.counters[btn.dataset.key] = (card.counters[btn.dataset.key] || 0) + 1;
          toast('+1 ' + btn.dataset.key + ' on ' + card.name);
          refreshList();
        });
      });
      document.querySelectorAll('.card-kw-quick').forEach(function(chip) {
        chip.addEventListener('click', function() {
          var kw = chip.dataset.kw;
          card.counters[kw] = (card.counters[kw] || 0) + 1;
          toast(kw + ' counter on ' + card.name);
          chip.style.background = 'rgba(138,70,200,.35)';
          setTimeout(function() {
            chip.style.background = '';
          }, 500);
          refreshList();
        });
      });
      var addBtn = document.getElementById('card-cnt-add');
      if (addBtn) addBtn.addEventListener('click', function() {
        var name = (document.getElementById('card-cnt-name').value || '').trim();
        var val = parseInt(document.getElementById('card-cnt-val').value) || 1;
        if (!name) {
          toast('Enter a counter name');
          return;
        }
        card.counters[name] = (card.counters[name] || 0) + val;
        document.getElementById('card-cnt-name').value = '';
        document.getElementById('card-cnt-val').value = '1';
        toast(name + ' counter on ' + card.name);
        refreshList();
      });
      rebindCardCounters();
    }

    // ── Turns ─────────────────────────────────────────────────────
    function endMyTurn() {
      if (G.game.currentTurn !== G.game.playerId) {
        toast("It's not your turn");
        return;
      }
      var pids = Object.keys(G.game.players);
      if (!pids.length) {
        toast('No players in game');
        return;
      }
      var idx = pids.indexOf(G.game.currentTurn);
      var si = idx < 0 ? 0 : idx;
      var nextIdx = (si + 1) % pids.length;
      var nextPid = pids[nextIdx];
      var newCycle = G.game.turnCycle || 1;
      if (nextIdx === 0) newCycle++;
      G.game.turnCycle = newCycle;
      G.game.currentTurn = nextPid;
      if (G.game.roomCode && G.game.roomCode !== 'LOCAL') {
        fbDB.ref('rooms/' + G.game.roomCode).update({
          currentTurn: nextPid,
          turnCycle: newCycle
        });
        sendAction('end_turn', {});
      }
      updatePlayersStrip();
      updateTurnUI();
      logAction('Ended turn');
      if (nextPid === G.game.playerId) beginMyTurn();
      else toast((G.game.players[nextPid] ? G.game.players[nextPid].name : '?') + "'s turn");
    }

    function beginMyTurn() {
      untapAll();
      toast('Your turn! All permanents untapped.');
      logAction('Beginning of turn — untapped all');
    }

    function checkTurnTransition() {
      var isMyTurn = G.game.currentTurn === G.game.playerId;
      if (isMyTurn && _lastTurn !== G.game.playerId && _lastTurn !== null) beginMyTurn();
      _lastTurn = G.game.currentTurn;
    }

    function untapAll() {
      G.game.myState.battlefield.forEach(function(c) {
        c.tapped = false;
      });
      renderBattlefield();
      syncPublicZones();
    }

    // ── Zone switch ───────────────────────────────────────────────
    function switchZone(name) {
      G.currentZone = name;
      document.querySelectorAll('.zone-pane').forEach(function(z) {
        z.classList.remove('active');
      });
      document.querySelectorAll('.zone-tab').forEach(function(t) {
        t.classList.remove('active');
      });
      var zp = document.getElementById('zone-' + name);
      if (zp) zp.classList.add('active');
      var zt = document.querySelector('.zone-tab[data-zone="' + name + '"]');
      if (zt) zt.classList.add('active');
      if (name === 'graveyard') renderZoneGrid('graveyard');
      if (name === 'exile') renderZoneGrid('exile');
      if (name === 'command') renderCommandZone();
      if (name === 'opponents') renderOpponentsZone();
      if (name === 'chat') {
        G.chatUnread = 0;
        var ct = document.getElementById('chat-tab');
        if (ct) ct.classList.remove('chat-tab-unread');
        renderChatMessages();
      }
      if (name === 'battlefield') {
        renderBattlefield();
        initBfPinchZoom();
      }
    }

    function toggleHand() {
      G.handCollapsed = !G.handCollapsed;
      document.getElementById('hand-bar').classList.toggle('collapsed', G.handCollapsed);
    }

    // ── DFC flip ──────────────────────────────────────────────────
    function flipCardFace(id, zone, _cb) {
      var arr = (zone === 'battlefield') ? G.game.myState.battlefield : (zone === 'hand') ? G.game.myState.hand : (zone === 'graveyard') ? G.game.myState.graveyard : (zone === 'exile') ? G.game.myState.exile : G.game.myState.command;
      var card = arr.find(function(c) {
        return c.id === id;
      });
      if (!card) return;

      function doFlip() {
        card.currentFace = card.currentFace === 0 ? 1 : 0;
        logAction((card.currentFace === 1 ? 'Transformed' : 'Transformed back') + ' ' + card.name);
        if (zone === 'battlefield') {
          renderBattlefield();
          syncPublicZones();
          sendAction('flip', {
            cardName: card.name,
            face: card.currentFace
          });
          toast((card.currentFace === 1 ? 'Transformed!' : 'Transformed back!'));
        } else if (zone === 'hand') renderHandBar();
        else if (zone === 'graveyard') renderZoneGrid('graveyard');
        else if (zone === 'exile') renderZoneGrid('exile');
        else if (zone === 'command') renderCommandZone();
        if (_cb) _cb(card);
      }
      // If we already have the back image ready, flip immediately
      if (card.isDFC && card.backImage) {
        doFlip();
        return;
      }
      // Otherwise fetch from Scryfall to detect/get DFC data
      toast('Fetching card data\u2026');
      fetchCard(card.name).then(function(sf) {
        if (sf && isDFC(sf)) {
          card.isDFC = true;
          card.image = cardImg(sf, 0) || card.image;
          card.backImage = cardImg(sf, 1) || null;
          if (card.backImage) {
            doFlip();
          } else {
            toast('Back face image not found for ' + card.name);
          }
          if (zone === 'battlefield') renderBattlefield();
        } else {
          toast(card.name + ' is not a dual-faced card');
        }
      }).catch(function() {
        toast('Could not fetch card data — check connection');
      });
    }

    // ── Card element ──────────────────────────────────────────────
    var _dfcFetchPending = {};

    function mkCardEl(card, w, h) {
      // Eagerly update DFC data from sfCache if not yet populated
      if (!card.facedown && card.name) {
        var _sf = sfCache[card.name];
        if (_sf && isDFC(_sf)) {
          if (!card.isDFC) {
            card.isDFC = true;
          }
          if (!card.backImage) {
            card.backImage = cardImg(_sf, 1) || null;
          }
          if (!card.image) {
            card.image = cardImg(_sf, 0) || null;
          }
        }
      }
      // Background-fetch backImage for DFC cards that have a front image but no back
      if (card.isDFC && !card.backImage && card.name && !_dfcFetchPending[card.id]) {
        _dfcFetchPending[card.id] = true;
        fetchCard(card.name).then(function(sf) {
          delete _dfcFetchPending[card.id];
          if (sf && isDFC(sf)) {
            card.backImage = cardImg(sf, 1) || null;
            if (G.currentZone === 'battlefield') renderBattlefield();
          }
        }).catch(function() {
          delete _dfcFetchPending[card.id];
        });
      }
      var img = getCardDisplayImage(card) || card.image || null;
      if (img && !card.facedown) {
        var el = document.createElement('img');
        el.src = img;
        el.alt = card.name;
        el.style.cssText = 'width:' + w + 'px;height:' + h + 'px;border-radius:7px;display:block;pointer-events:none';
        return el;
      }
      var d = document.createElement('div');
      if (card.facedown) {
        d.style.cssText = 'width:' + w + 'px;height:' + h + 'px;border-radius:7px;background:linear-gradient(135deg,hsl(215 30% 20%),hsl(215 20% 12%));border:2px solid hsl(215,20%,30%);display:flex;align-items:center;justify-content:center;pointer-events:none';
        d.innerHTML = '<div style="font-size:2rem;opacity:.3">&#9733;</div>';
      } else {
        d.style.cssText = 'width:' + w + 'px;height:' + h + 'px;border-radius:7px;background:linear-gradient(135deg,hsl(215 30% 20%),hsl(215 20% 12%));border:1px solid hsl(var(--border));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:6px;pointer-events:none';
        d.innerHTML = '<div style="font-size:1rem;color:var(--gold);opacity:.8">&#9733;</div><div style="font-size:.5rem;text-align:center;color:hsl(var(--muted-fg));line-height:1.3;word-break:break-word">' + escH(card.name) + '</div>';
        if (!img && card.name) {
          fetchCard(card.name).then(function(sf) {
            if (sf) {
              card.image = cardImg(sf, 0) || card.image;
              if (isDFC(sf)) {
                card.isDFC = true;
                card.backImage = cardImg(sf, 1) || card.backImage;
              }
              if (G.currentZone === 'battlefield') renderBattlefield();
            }
          });
        }
      }
      return d;
    }

    // ── Battlefield ───────────────────────────────────────────────
    var BF_PAD = 30,
      BF_H_GAP = 12,
      BF_V_GAP = 20;

    function renderBattlefield() {
      var bf = G.game.myState.battlefield;
      var bfInner = document.getElementById('bf-inner');
      if (!bfInner) return;
      var cw = getCW(),
        ch = getCH();
      bfInner.querySelectorAll('.bf-card').forEach(function(el) {
        el.remove();
      });
      var zoneEl = document.getElementById('zone-battlefield');
      var viewW = zoneEl ? zoneEl.clientWidth : 800;
      var cardW = cw + BF_H_GAP,
        cardH = ch + BF_V_GAP;
      var maxCols = Math.max(1, Math.floor((viewW - 40) / cardW));
      var rowX = 20,
        rowY = 20;
      bf.forEach(function(card) {
        if (!card.bfPlaced || card.x === undefined || card.x === null) {
          card.x = rowX;
          card.y = rowY;
          card.bfPlaced = true;
          rowX += cardW;
          if (rowX > 20 + maxCols * cardW - cardW) {
            rowX = 20;
            rowY += cardH;
          }
        }
        var wrap = document.createElement('div');
        wrap.className = 'bf-card' + (card.tapped ? ' tapped' : '') + (card.attachedTo ? ' paired-card' : '');
        wrap.dataset.id = card.id;
        wrap.style.left = card.x + 'px';
        wrap.style.top = card.y + 'px';
        wrap.appendChild(mkCardEl(card, cw, ch));
        if (card.facedown) {
          var lbl = document.createElement('div');
          lbl.className = 'facedown-indicator';
          lbl.textContent = 'FACE DOWN';
          wrap.appendChild(lbl);
        }
        if (card.isDFC && !card.facedown) {
          var dfcInd = document.createElement('div');
          dfcInd.className = 'dfc-indicator';
          dfcInd.innerHTML = card.currentFace === 0 ? '\u21F4 Dual-Sided' : '\u21F4 Back Face';
          wrap.appendChild(dfcInd);
          var fb = document.createElement('div');
          fb.className = 'dfc-flip-btn';
          fb.innerHTML = '\u21F4';
          fb.title = 'Flip face';
          (function(cid) {
            fb.addEventListener('click', function(e) {
              e.stopPropagation();
              flipCardFace(cid, 'battlefield');
            });
          })(card.id);
          wrap.appendChild(fb);
        }
        if (card.isEmblem) {
          var eb = document.createElement('div');
          eb.className = 'emblem-badge';
          eb.textContent = 'EMBLEM';
          wrap.appendChild(eb);
        }
        if (card.attachedTo) {
          var host = bf.find(function(c) {
            return c.id === card.attachedTo;
          });
          var auraBadge = document.createElement('div');
          auraBadge.className = 'aura-badge';
          auraBadge.textContent = '\u2192 ' + (host ? host.name.slice(0, 12) : 'Attached');
          auraBadge.title = 'Attached to: ' + (host ? host.name : '?') + ' — click to detach';
          (function(cid) {
            auraBadge.addEventListener('click', function(e) {
              e.stopPropagation();
              detachCard(cid);
            });
          })(card.id);
          wrap.appendChild(auraBadge);
        }
        if (card.attachments && card.attachments.length) {
          var ab2 = document.createElement('div');
          ab2.className = 'aura-badge';
          ab2.style.top = 'auto';
          ab2.style.bottom = '-4px';
          ab2.style.left = '-4px';
          ab2.style.background = 'rgba(138,70,200,.85)';
          var aNames = card.attachments.map(function(id) {
            var ac = bf.find(function(x) {
              return x.id === id;
            });
            return ac ? ac.name : '?';
          });
          ab2.textContent = '\u2B41 ' + aNames.slice(0, 2).join(', ') + (aNames.length > 2 ? '\u2026' : '');
          ab2.title = 'Attached: ' + aNames.join(', ');
          wrap.appendChild(ab2);
        }
        var counters = card.counters || {};
        var types = Object.entries(counters).filter(function(e) {
          return e[1] > 0;
        });
        if (types.length) {
          var bw = document.createElement('div');
          bw.className = 'card-counters';
          types.forEach(function(entry) {
            var type = entry[0],
              val = entry[1];
            var badge = document.createElement('div');
            var isKw = KEYWORD_COUNTER_TYPES.indexOf(type) >= 0;
            var cls = isKw ? ' keyword' : (type.includes('-1') || type === 'm1m1') ? ' minus' : (type === 'loyalty' || type === 'level') ? ' neutral' : '';
            badge.className = 'card-counter-badge' + cls;
            badge.title = type;
            badge.textContent = (type === 'p1p1' ? '+1' : type === 'm1m1' ? '-1' : type.length <= 5 ? type : type.slice(0, 4)) + ':' + val;
            bw.appendChild(badge);
          });
          wrap.appendChild(bw);
        }
        bfInner.appendChild(wrap);
        attachBfCardEvents(wrap, card);
      });
      var cntEl = document.getElementById('cnt-battlefield');
      if (cntEl) cntEl.textContent = bf.length;
      updateBfCanvasSize();
    }

    function updateBfCanvasSize() {
      var bf = G.game.myState.battlefield;
      var bfInner = document.getElementById('bf-inner');
      if (!bfInner) return;
      var cw = getCW(),
        ch = getCH();
      var maxX = 200,
        maxY = 200;
      bf.forEach(function(card) {
        var right = (card.x || 0) + (card.tapped ? ch : cw) + BF_PAD;
        var bottom = (card.y || 0) + (card.tapped ? cw : ch) + BF_PAD;
        if (right > maxX) maxX = right;
        if (bottom > maxY) maxY = bottom;
      });
      var zoneEl = document.getElementById('zone-battlefield');
      bfInner.style.width = Math.max(maxX, zoneEl ? zoneEl.clientWidth : 600) + 'px';
      bfInner.style.height = Math.max(maxY, zoneEl ? zoneEl.clientHeight : 400) + 'px';
    }

    // ── FIX: Battlefield card events — reliable tap vs long-press vs drag ──
    function attachBfCardEvents(wrap, card) {
      var isDragging = false,
        menuOpened = false,
        dragOffX = 0,
        dragOffY = 0,
        startX = 0,
        startY = 0,
        pressTimer = null;
      var TAP_MOVE_THRESHOLD = 8; // px movement before considering it a drag
      var LONG_PRESS_MS = 600;

      function showMenu(e) {
        menuOpened = true;
        showBfCardMenu(e, card);
      }

      wrap.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showMenu(e);
      });

      wrap.addEventListener('pointerdown', function(e) {
        if (e.button === 2) return;
        e.preventDefault();
        wrap.setPointerCapture(e.pointerId);
        startX = e.clientX;
        startY = e.clientY;
        isDragging = false;
        menuOpened = false;
        var rect = wrap.getBoundingClientRect();
        dragOffX = e.clientX - rect.left;
        dragOffY = e.clientY - rect.top;
        pressTimer = setTimeout(function() {
          if (!isDragging) {
            showMenu(e);
          }
        }, LONG_PRESS_MS);
      });

      wrap.addEventListener('pointermove', function(e) {
        if (!wrap.hasPointerCapture(e.pointerId)) return;
        var dx = e.clientX - startX,
          dy = e.clientY - startY;
        if (!isDragging && (Math.abs(dx) > TAP_MOVE_THRESHOLD || Math.abs(dy) > TAP_MOVE_THRESHOLD)) {
          isDragging = true;
          clearTimeout(pressTimer);
          pressTimer = null;
          wrap.style.zIndex = 100;
          wrap.style.transition = 'none';
        }
        if (isDragging) {
          var pr = wrap.parentElement.getBoundingClientRect();
          wrap.style.left = Math.max(0, e.clientX - pr.left - dragOffX) + 'px';
          wrap.style.top = Math.max(0, e.clientY - pr.top - dragOffY) + 'px';
        }
      });

      wrap.addEventListener('pointerup', function(e) {
        clearTimeout(pressTimer);
        pressTimer = null;
        wrap.style.zIndex = '';
        wrap.style.transition = '';
        if (isDragging) {
          var c = G.game.myState.battlefield.find(function(x) {
            return x.id === card.id;
          });
          if (c) {
            c.x = parseFloat(wrap.style.left) || 0;
            c.y = parseFloat(wrap.style.top) || 0;
            updateBfCanvasSize();
            syncPublicZones();
          }
          isDragging = false;
        } else if (!menuOpened) {
          // Short press = tap/untap
          tapCard(card.id);
        }
        menuOpened = false;
      });

      wrap.addEventListener('pointercancel', function() {
        clearTimeout(pressTimer);
        pressTimer = null;
        isDragging = false;
        menuOpened = false;
        wrap.style.zIndex = '';
        wrap.style.transition = '';
      });
    }

    // ── Battlefield Card Menu ─────────────────────────────────────
    function showBfCardMenu(e, card) {
      var x = e.clientX || 100;
      var y = e.clientY || 100;
      var bf = G.game.myState.battlefield;
      var items = [];
      items.push({
        icon: '🔄',
        label: card.tapped ? 'Untap' : 'Tap',
        fn: function() {
          tapCard(card.id);
        }
      });
      items.push({
        icon: '📖',
        label: 'Zoom Card',
        fn: function() {
          zoomCard(card, 'battlefield');
        }
      });
      items.push({
        icon: '🏷',
        label: 'Add Counter',
        fn: function() {
          openCardCounterModal(card.id, 'battlefield');
        }
      });
      if (card.isDFC) items.push({
        icon: '⇄',
        label: 'Flip/Transform',
        fn: function() {
          flipCardFace(card.id, 'battlefield');
        }
      });
      items.push({
        icon: '😶‍🌫️',
        label: card.facedown ? 'Turn Face Up' : 'Turn Face Down',
        fn: function() {
          card.facedown = !card.facedown;
          renderBattlefield();
          syncPublicZones();
        }
      });
      items.push('sep');
      items.push({
        icon: '🔗',
        label: 'Attach to…',
        fn: function() {
          attachCardTo(card.id);
        }
      });
      if (card.attachedTo) items.push({
        icon: '✂',
        label: 'Detach',
        fn: function() {
          detachCard(card.id);
        }
      });
      items.push('sep');
      items.push({
        icon: '💀',
        label: 'To Graveyard',
        fn: function() {
          moveBfCardTo(card.id, 'graveyard');
        }
      });
      items.push({
        icon: '🌅',
        label: 'To Exile',
        fn: function() {
          moveBfCardTo(card.id, 'exile');
        }
      });
      items.push({
        icon: '✋',
        label: 'To Hand',
        fn: function() {
          moveBfCardTo(card.id, 'hand');
        }
      });
      if (G.game.myState.command.length) items.push({
        icon: '👑',
        label: 'To Command Zone',
        fn: function() {
          moveBfCardTo(card.id, 'command');
        }
      });
      items.push('sep');
      items.push({
        icon: '📋',
        label: 'Clone Token',
        fn: function() {
          cloneAsToken(card);
        }
      });
      if (card.isToken) {
        items.push({
          icon: '💥',
          label: 'Destroy Token',
          fn: function() {
            var idx = bf.findIndex(function(c) {
              return c.id === card.id;
            });
            if (idx >= 0) {
              bf.splice(idx, 1);
              renderBattlefield();
              syncPublicZones();
              logAction('Destroyed token: ' + card.name);
            }
          }
        });
      }
      showCtxMenu(x, y, escH(card.name) + (card.isToken ? ' 🪙' : ''), items);
    }

    function showCtxMenu(x, y, header, items) {
      closeCtxMenu();
      var menu = document.getElementById('ctx-menu');
      menu.innerHTML = '<div class="ctx-header">' + header + '</div>' +
        items.map(function(it) {
          if (it === 'sep') return '<hr class="ctx-sep"/>';
          return '<div class="ctx-item" data-fn="' + escH(it.label) + '">' + (it.icon ? '<span>' + it.icon + '</span>' : '') + '<span>' + escH(it.label) + '</span></div>';
        }).join('');
      var menuW = 200,
        menuH = items.length * 38;
      var left = Math.min(x, window.innerWidth - menuW - 8);
      var top = Math.min(y, window.innerHeight - menuH - 8);
      if (top < 8) top = 8;
      menu.style.left = left + 'px';
      menu.style.top = top + 'px';
      menu.classList.remove('hidden');
      var ov = document.getElementById('ctx-overlay');
      if (ov) ov.style.display = 'block';
      var fnMap = {};
      items.forEach(function(it) {
        if (it && it !== 'sep') fnMap[it.label] = it.fn;
      });
      menu.querySelectorAll('.ctx-item').forEach(function(el) {
        var label = el.dataset.fn;
        el.addEventListener('pointerup', function(e) {
          e.stopPropagation();
          closeCtxMenu();
          if (fnMap[label]) fnMap[label]();
        });
      });
      setTimeout(function() {
        document.addEventListener('pointerdown', closeCtxMenuOutside, {
          once: true,
          capture: true
        });
      }, 10);
    }

    function closeCtxMenuOutside(e) {
      if (!document.getElementById('ctx-menu').contains(e.target) && e.target.id !== 'ctx-overlay') closeCtxMenu();
    }

    function showOppZoneModal(label, cards) {
      var rows = cards.map(function(c) {
        return '<div style="display:flex;align-items:center;gap:.55rem;padding:.3rem 0;border-bottom:1px solid hsl(var(--border))">' + (c.image ? '<img src="' + escH(c.image) + '" style="width:38px;height:53px;border-radius:4px;flex-shrink:0;cursor:zoom-in" onclick="zoomCard({name:' + JSON.stringify(c.name) + ',image:' + JSON.stringify(c.image) + ',isDFC:false,facedown:false})">' + '<div style="font-size:.78rem;font-weight:600">' + escH(c.name) + '</div>' : '<div style="width:38px;height:53px;background:hsl(var(--muted));border-radius:4px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:.5rem;color:hsl(var(--muted-fg));text-align:center">' + escH(c.name) + '</div><div style="font-size:.78rem;font-weight:600">' + escH(c.name) + '</div>') + '</div>';
      }).join('');
      openModal('<div class="modal-title">' + escH(label) + ' (' + cards.length + ')</div><div style="max-height:65vh;overflow-y:auto;padding:.25rem 0">' + rows + '</div>', '380px');
    }

    function closeCtxMenu() {
      var m = document.getElementById('ctx-menu');
      if (m) m.classList.add('hidden');
      var ov = document.getElementById('ctx-overlay');
      if (ov) ov.style.display = 'none';
      document.removeEventListener('pointerdown', closeCtxMenuOutside, {
        capture: true
      });
    }

    function tapCard(id) {
      var card = G.game.myState.battlefield.find(function(c) {
        return c.id === id;
      });
      if (!card) return;
      card.tapped = !card.tapped;
      renderBattlefield();
      syncPublicZones();
      sendAction('tap', {
        cardName: card.name,
        tapped: card.tapped
      });
      logAction((card.tapped ? 'Tapped' : 'Untapped') + ' ' + card.name);
    }

    function moveBfCardTo(id, dest) {
      var bf = G.game.myState.battlefield;
      var idx = bf.findIndex(function(c) {
        return c.id === id;
      });
      if (idx < 0) return;
      var card = bf.splice(idx, 1)[0];
      card.tapped = false;
      if (dest === 'graveyard') {
        G.game.myState.graveyard.push(card);
        renderZoneGrid('graveyard');
      } else if (dest === 'exile') {
        G.game.myState.exile.push(card);
        renderZoneGrid('exile');
      } else if (dest === 'hand') {
        card.bfPlaced = false;
        card.x = null;
        card.y = null;
        G.game.myState.hand.push(card);
        renderHandBar();
      } else if (dest === 'command') {
        card.bfPlaced = false;
        card.x = null;
        card.y = null;
        card.castCost = (card.castCost || 0);
        var cmd = G.game.myState.command;
        var dupIdx = cmd.findIndex(function(c) {
          return c.name === card.name;
        });
        if (dupIdx >= 0) cmd.splice(dupIdx, 1);
        cmd.push(card);
        renderCommandZone();
      }
      renderBattlefield();
      syncPublicZones();
      syncPrivateState();
      logAction(card.name + ' moved to ' + dest);
      toast(card.name + ' → ' + dest);
    }

    function detachCard(id) {
      var bf = G.game.myState.battlefield;
      var card = bf.find(function(c) {
        return c.id === id;
      });
      if (!card || !card.attachedTo) return;
      var host = bf.find(function(c) {
        return c.id === card.attachedTo;
      });
      if (host && host.attachments) {
        host.attachments = host.attachments.filter(function(aid) {
          return aid !== id;
        });
      }
      card.attachedTo = null;
      renderBattlefield();
      syncPublicZones();
      toast('Detached');
    }

    function attachCardTo(id) {
      var bf = G.game.myState.battlefield;
      var thisCard = bf.find(function(c) {
        return c.id === id;
      });
      var isEquip = thisCard && isEquipmentType(thisCard.type || '');
      var isAura = thisCard && isAuraType(thisCard.type || '');
      var allOthers = bf.filter(function(c) {
        return c.id !== id;
      });
      var auras = isEquip ?
        allOthers.filter(function(c) {
          return (c.type || '').includes('Creature');
        }) :
        allOthers;
      if (!auras.length && isEquip) {
        auras = allOthers;
      } // fallback if no creatures
      if (!auras.length) {
        toast('No other cards to attach to');
        return;
      }
      openModal(
        '<div class="modal-title">Attach to…</div>' +
        '<div style="display:flex;flex-direction:column;gap:.35rem;max-height:300px;overflow-y:auto">' +
        auras.map(function(c, i) {
          return '<div class="scry-result attach-target" data-idx="' + i + '">' +
            (c.image ? '<img src="' + c.image + '" style="width:40px;height:56px;border-radius:4px;flex-shrink:0">' : '<div style="width:40px;height:56px;background:hsl(var(--muted));border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:.5rem;text-align:center;flex-shrink:0">' + escH(c.name) + '</div>') +
            '<div class="scry-result-info"><div class="font-semibold text-sm">' + escH(c.name) + '</div><div class="text-xs text-muted">' + escH(c.type || '') + '</div></div></div>';
        }).join('') +
        '</div>', '400px'
      );
      document.querySelectorAll('.attach-target').forEach(function(row, i) {
        row.addEventListener('pointerup', function(e) {
          e.stopPropagation();
          var attachCard = bf.find(function(c) {
            return c.id === id;
          });
          var hostCard = auras[i];
          if (attachCard && hostCard) {
            if (attachCard.attachedTo) {
              var oldHost = bf.find(function(c) {
                return c.id === attachCard.attachedTo;
              });
              if (oldHost && oldHost.attachments) oldHost.attachments = oldHost.attachments.filter(function(aid) {
                return aid !== id;
              });
            }
            attachCard.attachedTo = hostCard.id;
            if (!hostCard.attachments) hostCard.attachments = [];
            if (hostCard.attachments.indexOf(id) < 0) hostCard.attachments.push(id);
            renderBattlefield();
            syncPublicZones();
            toast('Attached ' + attachCard.name + ' to ' + hostCard.name);
          }
          closeModal();
        });
      });
    }

    function cloneAsToken(card) {
      var newToken = {
        id: uid(),
        name: card.name + ' (token)',
        image: card.image || null,
        backImage: card.backImage || null,
        isDFC: false,
        currentFace: 0,
        type: card.type || '',
        counters: {},
        facedown: false,
        attachedTo: null,
        attachments: [],
        tapped: false,
        bfPlaced: false,
        x: null,
        y: null,
        isToken: true
      };
      G.game.myState.battlefield.push(newToken);
      renderBattlefield();
      syncPublicZones();
      toast('Cloned ' + card.name + ' as token');
    }

    // ── Hand Bar ──────────────────────────────────────────────────
    // FIX: Reliable hand card tap (zoom) and double-tap to play
    function renderHandBar() {
      var ms = G.game.myState;
      var scroll = document.getElementById('hand-scroll');
      if (!scroll) return;
      scroll.innerHTML = '';
      ms.hand.forEach(function(card, i) {
        var wrap = document.createElement('div');
        wrap.className = 'hand-card';
        // Mirror mkCardEl: eagerly seed image/DFC data from sfCache
        if (!card.facedown && card.name) {
          var _sf = sfCache[card.name];
          if (_sf && isDFC(_sf)) {
            if (!card.isDFC) {
              card.isDFC = true;
            }
            if (!card.backImage) {
              card.backImage = cardImg(_sf, 1) || null;
            }
            if (!card.image) {
              card.image = cardImg(_sf, 0) || null;
            }
          } else if (_sf && !card.image) {
            card.image = cardImg(_sf, 0) || null;
          }
        }
        var img = getCardDisplayImage(card) || card.image || null;
        if (img && !card.facedown) {
          var im = document.createElement('img');
          im.src = img;
          im.loading = 'lazy';
          wrap.appendChild(im);
        } else {
          var d = document.createElement('div');
          d.style.cssText = 'width:var(--hw);height:var(--hh);border-radius:6px;background:linear-gradient(135deg,hsl(215 30% 20%),hsl(215 20% 12%));border:1px solid hsl(var(--border));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:6px';
          d.innerHTML = '<div style="font-size:.8rem;color:var(--gold)">&#9733;</div><div style="font-size:.45rem;text-align:center;color:hsl(var(--muted-fg));line-height:1.3">' + escH(card.name) + '</div>';
          wrap.appendChild(d);
          // Mirror mkCardEl: background-fetch from Scryfall when no image available
          if (!card.facedown && card.name) {
            (function(hc, hi) {
              fetchCard(hc.name).then(function(sf) {
                if (sf) {
                  hc.image = cardImg(sf, 0) || hc.image;
                  if (isDFC(sf)) {
                    hc.isDFC = true;
                    hc.backImage = cardImg(sf, 1) || hc.backImage;
                  }
                  if (G.game.myState.hand[hi] && G.game.myState.hand[hi].id === hc.id) renderHandBar();
                }
              });
            })(card, i);
          }
        }
        attachHandCardEvents(wrap, card, i);
        scroll.appendChild(wrap);
      });
      updateZoneCounts();
    }

    function attachHandCardEvents(wrap, card, idx) {
      var TAP_MOVE_THRESHOLD = 10;
      var LONG_PRESS_MS = 500;
      var TAP_WINDOW_MS = 300;
      var startX = 0,
        startY = 0;
      var pressTimer = null,
        tapCount = 0,
        tapTimer = null;
      var moved = false;

      wrap.addEventListener('pointerdown', function(e) {
        e.preventDefault();
        startX = e.clientX;
        startY = e.clientY;
        moved = false;
        pressTimer = setTimeout(function() {
          // Long press — show hand card menu
          showHandCardMenu(e, card, idx);
        }, LONG_PRESS_MS);
      });

      wrap.addEventListener('pointermove', function(e) {
        var dx = Math.abs(e.clientX - startX),
          dy = Math.abs(e.clientY - startY);
        if (dx > TAP_MOVE_THRESHOLD || dy > TAP_MOVE_THRESHOLD) {
          moved = true;
          clearTimeout(pressTimer);
          pressTimer = null;
        }
      });

      wrap.addEventListener('pointerup', function(e) {
        clearTimeout(pressTimer);
        pressTimer = null;
        if (moved) return;
        // Count taps
        tapCount++;
        if (tapCount === 1) {
          tapTimer = setTimeout(function() {
            // Single tap — zoom card
            tapCount = 0;
            var freshCard = G.game.myState.hand[idx];
            if (freshCard) zoomCard(freshCard, 'hand');
          }, TAP_WINDOW_MS);
        } else if (tapCount >= 2) {
          clearTimeout(tapTimer);
          tapTimer = null;
          tapCount = 0;
          // Double tap — play to battlefield
          playFromHand(idx);
        }
      });

      wrap.addEventListener('pointercancel', function() {
        clearTimeout(pressTimer);
        pressTimer = null;
        moved = false;
      });
    }

    function showHandCardMenu(e, card, idx) {
      var x = e.clientX || 100,
        y = e.clientY || 100;
      showCtxMenu(x, y, escH(card.name), [{
          icon: '📖',
          label: 'Zoom Card',
          fn: function() {
            zoomCard(card, 'hand');
          }
        },
        {
          icon: '⚔',
          label: 'Play to Battlefield',
          fn: function() {
            playFromHand(idx);
          }
        },
        {
          icon: '⇄',
          label: 'Transform / Flip',
          fn: function() {
            flipCardFace(card.id, 'hand');
          }
        },
        {
          icon: '😶‍🌫️',
          label: 'Play Face Down',
          fn: function() {
            playFromHandFaceDown(idx);
          }
        },
        {
          icon: '💀',
          label: 'Discard',
          fn: function() {
            discardFromHand(idx);
          }
        },
        {
          icon: '🌅',
          label: 'Exile',
          fn: function() {
            var c = G.game.myState.hand.splice(idx, 1)[0];
            G.game.myState.exile.push(c);
            renderHandBar();
            renderZoneGrid('exile');
            syncPrivateState();
            toast(c.name + ' exiled');
          }
        },
        {
          icon: '📚',
          label: 'Put on Top of Library',
          fn: function() {
            var c = G.game.myState.hand.splice(idx, 1)[0];
            G.game.myState.library.unshift(c);
            renderHandBar();
            updateLibraryDisplay();
            syncPrivateState();
            toast(c.name + ' on top of library');
          }
        },
        {
          icon: '📚',
          label: 'Put on Bottom of Library',
          fn: function() {
            var c = G.game.myState.hand.splice(idx, 1)[0];
            G.game.myState.library.push(c);
            renderHandBar();
            updateLibraryDisplay();
            syncPrivateState();
            toast(c.name + ' on bottom of library');
          }
        }
      ]);
    }

    function playFromHand(idx) {
      var ms = G.game.myState;
      var card = ms.hand[idx];
      if (!card) return;
      ms.hand.splice(idx, 1);
      card.bfPlaced = false;
      card.x = null;
      card.y = null;
      card.tapped = false;
      var _sfz = sfCache[card.name];
      if (_sfz) {
        if (!card.image) card.image = cardImg(_sfz, 0) || null;
        if (isDFC(_sfz)) {
          card.isDFC = true;
          if (!card.backImage) card.backImage = cardImg(_sfz, 1) || null;
        }
      } else if (!card.backImage && card.name && !_dfcFetchPending[card.id]) {
        _dfcFetchPending[card.id] = true;
        (function(c) {
          fetchCard(c.name).then(function(sf) {
            delete _dfcFetchPending[c.id];
            if (sf) {
              if (!c.image) c.image = cardImg(sf, 0) || null;
              if (isDFC(sf)) {
                c.isDFC = true;
                if (!c.backImage) c.backImage = cardImg(sf, 1) || null;
              }
              if (G.currentZone === 'battlefield') renderBattlefield();
            }
          }).catch(function() {
            delete _dfcFetchPending[c.id];
          });
        })(card);
      }
      ms.battlefield.push(card);
      renderHandBar();
      renderBattlefield();
      switchZone('battlefield');
      sendAction('play_card', {
        cardName: card.name
      });
      logAction('Played ' + card.name + ' from hand');
      toast(card.name + ' played!');
      syncPublicZones();
      syncPrivateState();
    }

    function playFromHandFaceDown(idx) {
      var ms = G.game.myState;
      var card = ms.hand[idx];
      if (!card) return;
      ms.hand.splice(idx, 1);
      card.bfPlaced = false;
      card.x = null;
      card.y = null;
      card.tapped = false;
      card.facedown = true;
      card.morphName = card.name;
      ms.battlefield.push(card);
      renderHandBar();
      renderBattlefield();
      switchZone('battlefield');
      sendAction('play_card', {
        cardName: 'a card',
        facedown: true
      });
      logAction('Played ' + card.name + ' face down');
      toast(card.name + ' played face down');
      syncPublicZones();
      syncPrivateState();
    }

    function discardFromHand(idx) {
      var ms = G.game.myState;
      var card = ms.hand.splice(idx, 1)[0];
      if (!card) return;
      ms.graveyard.push(card);
      renderHandBar();
      renderZoneGrid('graveyard');
      logAction('Discarded ' + card.name);
      toast(card.name + ' discarded');
      syncPublicZones();
      syncPrivateState();
    }

    // ── Zone Grids (graveyard/exile) ──────────────────────────────
    function renderZoneGrid(zone) {
      var arr = zone === 'graveyard' ? G.game.myState.graveyard : G.game.myState.exile;
      var gridId = zone + '-grid';
      var grid = document.getElementById(gridId);
      if (!grid) return;
      grid.innerHTML = '';
      if (!arr.length) {
        grid.innerHTML = '<div class="empty-state" style="height:auto;padding:2rem"><div class="empty-state-icon">' + (zone === 'graveyard' ? '💀' : '🌅') + '</div><div style="font-size:.8rem">' + zone + ' is empty</div></div>';
        return;
      }
      arr.forEach(function(card, i) {
        var wrap = document.createElement('div');
        wrap.style.position = 'relative';
        wrap.className = 'card-thumb';
        var img = getCardDisplayImage(card) || card.image || null;
        if (img && !card.facedown) {
          var im = document.createElement('img');
          im.src = img;
          im.loading = 'lazy';
          wrap.appendChild(im);
        } else {
          var ph = document.createElement('div');
          ph.style.cssText = 'width:var(--cw);height:var(--ch);background:linear-gradient(135deg,hsl(215 30% 20%),hsl(215 20% 12%));border-radius:7px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:6px;font-size:.5rem;text-align:center;color:hsl(var(--muted-fg))';
          ph.textContent = card.facedown ? 'Face Down' : card.name;
          wrap.appendChild(ph);
        }
        if (zone === 'exile' && card.isImpulse) {
          var badge = document.createElement('div');
          badge.className = 'impulse-badge';
          badge.textContent = '⚡ IMPULSE';
          wrap.appendChild(badge);
        }
        wrap.addEventListener('click', function() {
          showZoneCardMenu(card, i, zone);
        });
        grid.appendChild(wrap);
      });
    }

    function showZoneCardMenu(card, idx, zone) {
      var arr = zone === 'graveyard' ? G.game.myState.graveyard : G.game.myState.exile;
      var items = [{
          icon: '📖',
          label: 'Zoom Card',
          fn: function() {
            zoomCard(card, zone);
          }
        },
        {
          icon: '⚔',
          label: 'To Battlefield',
          fn: function() {
            var c = arr.splice(idx, 1)[0];
            c.bfPlaced = false;
            c.x = null;
            c.y = null;
            c.tapped = false;
            c.facedown = false;
            G.game.myState.battlefield.push(c);
            renderZoneGrid(zone);
            renderBattlefield();
            syncPublicZones();
            toast(c.name + ' to battlefield');
          }
        },
        {
          icon: '✋',
          label: 'To Hand',
          fn: function() {
            var c = arr.splice(idx, 1)[0];
            c.facedown = false;
            G.game.myState.hand.push(c);
            renderZoneGrid(zone);
            renderHandBar();
            syncPrivateState();
            toast(c.name + ' to hand');
          }
        },
        {
          icon: '📚',
          label: 'Shuffle into Library',
          fn: function() {
            var c = arr.splice(idx, 1)[0];
            G.game.myState.library.push(c);
            shuffle(G.game.myState.library);
            renderZoneGrid(zone);
            updateLibraryDisplay();
            syncPrivateState();
            toast(c.name + ' shuffled in');
          }
        },
      ];
      if (zone === 'graveyard') items.push({
        icon: '🌅',
        label: 'To Exile',
        fn: function() {
          var c = arr.splice(idx, 1)[0];
          G.game.myState.exile.push(c);
          renderZoneGrid('graveyard');
          renderZoneGrid('exile');
          syncPublicZones();
          toast(c.name + ' exiled');
        }
      });
      else {
        if (card.isImpulse) {
          items.push({
            icon: '⚡',
            label: 'Play Now (Impulse)',
            fn: function() {
              var c = arr.splice(idx, 1)[0];
              c.isImpulse = false;
              c.bfPlaced = false;
              c.x = null;
              c.y = null;
              c.tapped = false;
              G.game.myState.battlefield.push(c);
              renderZoneGrid('exile');
              renderBattlefield();
              syncPublicZones();
              toast(c.name + ' played!');
            }
          });
        }
        items.push({
          icon: '💀',
          label: 'To Graveyard',
          fn: function() {
            var c = arr.splice(idx, 1)[0];
            G.game.myState.graveyard.push(c);
            renderZoneGrid('exile');
            renderZoneGrid('graveyard');
            syncPublicZones();
            toast(c.name + ' to graveyard');
          }
        });
      }
      items.push({
        icon: '🏷',
        label: 'Add Counter',
        fn: function() {
          openCardCounterModal(card.id, zone);
        }
      });
      openModal('<div class="modal-title">' + escH(card.name) + '</div>' +
        '<div style="text-align:center;margin-bottom:.75rem">' + (card.image && !card.facedown ? '<img src="' + card.image + '" style="width:130px;border-radius:9px">' : '') + '</div>' +
        '<div class="flex flex-col gap-2">' + items.map(function(it) {
          return '<button class="btn zone-card-action" data-lbl="' + escH(it.label) + '">' + (it.icon || '') + '  ' + escH(it.label) + '</button>';
        }).join('') + '</div>',
        '380px'
      );
      var fnMap = {};
      items.forEach(function(it) {
        fnMap[it.label] = it.fn;
      });
      document.querySelectorAll('.zone-card-action').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var fn = fnMap[btn.dataset.lbl];
          if (fn) {
            fn();
            closeModal();
          }
        });
      });
    }

    // ── Command Zone ──────────────────────────────────────────────
    function renderCommandZone() {
      var el = document.getElementById('command-zone-area');
      if (!el) return;
      var ms = G.game.myState;
      el.innerHTML = '';
      ms.command.forEach(function(card) {
        var wrap = document.createElement('div');
        wrap.className = 'commander-card-wrap';
        var cost = document.createElement('div');
        cost.className = 'commander-cast-cost';
        cost.textContent = '+' + (card.castCost || 0) * 2;
        var imgEl = document.createElement('img');
        imgEl.loading = 'lazy';
        imgEl.style.cssText = 'width:100px;height:140px;border-radius:9px;border:2px solid var(--gold);box-shadow:0 0 14px rgba(200,168,75,.4);display:block;background:hsl(var(--muted))';
        if (card.image) {
          imgEl.src = card.image;
        } else {
          var cached = sfCache[card.name];
          if (cached) {
            var url = cardImg(cached, 0);
            if (url) {
              card.image = url;
              imgEl.src = url;
            }
          } else {
            (function(c, im) {
              fetchCard(c.name).then(function(sf) {
                if (!sf) return;
                var url = cardImg(sf, 0);
                if (!url) return;
                c.image = url;
                im.src = url;
              });
            })(card, imgEl);
          }
        }
        var badge = document.createElement('div');
        badge.className = 'cmd-role-badge';
        badge.textContent = card.role || 'Command Zone';
        wrap.appendChild(imgEl);
        wrap.appendChild(cost);
        wrap.appendChild(badge);
        wrap.addEventListener('click', function() {
          showCommandCardMenu(card);
        });
        el.appendChild(wrap);
      });
      var cntEl = document.getElementById('cnt-command');
      if (cntEl) cntEl.textContent = ms.command.length;
    }

    function showCommandCardMenu(card) {
      openModal(
        '<div class="modal-title">\u{1F451} ' + escH(card.name) + '</div>' +
        '<div style="text-align:center;margin-bottom:.75rem">' + (card.image ? '<img src="' + card.image + '" style="width:130px;border-radius:9px;border:2px solid var(--gold)">' : '') + '</div>' +
        '<div style="text-align:center;margin-bottom:.75rem"><div class="counter-chip" style="display:inline-block;font-size:.78rem;padding:.25rem .6rem">Tax: +' + (card.castCost || 0) * 2 + ' mana</div></div>' +
        '<div class="flex flex-col gap-2">' +
        '<button class="btn btn-gold" id="cmd-play-btn">\u2694 Cast Commander</button>' +
        '<button class="btn" id="cmd-zoom-btn">&#128269; Zoom</button>' +
        '</div>',
        '380px'
      );
      document.getElementById('cmd-play-btn').addEventListener('click', function() {
        card.castCost = (card.castCost || 0) + 1;
        var newCard = {
          id: uid(),
          name: card.name,
          image: card.image || null,
          backImage: card.backImage || null,
          isDFC: card.isDFC || false,
          currentFace: 0,
          type: card.type || '',
          counters: {},
          facedown: false,
          attachedTo: null,
          attachments: [],
          tapped: false,
          bfPlaced: false,
          x: null,
          y: null
        };
        G.game.myState.battlefield.push(newCard);
        renderCommandZone();
        renderBattlefield();
        switchZone('battlefield');
        sendAction('play_card', {
          cardName: card.name
        });
        logAction('Cast ' + card.name + ' (tax: +' + (card.castCost * 2) + ')');
        toast(card.name + ' cast! Tax now: +' + (card.castCost * 2));
        closeModal();
        syncPublicZones();
      });
      document.getElementById('cmd-zoom-btn').addEventListener('click', function() {
        zoomCard(card, 'command');
        closeModal();
      });
    }

    // ── Library actions ───────────────────────────────────────────
    function drawCard() {
      var ms = G.game.myState;
      if (!ms.library.length) {
        toast('Library is empty!');
        return;
      }
      var card = ms.library.shift();
      ms.hand.push(card);
      renderHandBar();
      updateLibraryDisplay();
      sendAction('draw', {
        n: 1
      });
      logAction('Drew a card (' + card.name + ')');
      toast('Drew: ' + card.name, 2000);
      syncPrivateState();
    }

    function drawFromBottom() {
      var ms = G.game.myState;
      if (!ms.library.length) {
        toast('Library is empty!');
        return;
      }
      var card = ms.library.pop();
      ms.hand.push(card);
      renderHandBar();
      updateLibraryDisplay();
      logAction('Drew from bottom (' + card.name + ')');
      toast('Drew from bottom: ' + card.name, 2000);
      syncPrivateState();
    }

    function drawN() {
      openModal('<div class="modal-title">Draw N Cards</div><div class="flex flex-col gap-3"><div><label>Number of cards</label><input id="draw-n-input" type="number" value="3" min="1" style="font-size:1.3rem;text-align:center"/></div><button class="btn btn-gold" id="draw-n-btn">Draw</button></div>');
      document.getElementById('draw-n-btn').addEventListener('click', function() {
        var n = parseInt(document.getElementById('draw-n-input').value) || 1;
        var ms = G.game.myState;
        var drawn = [];
        for (var i = 0; i < n && ms.library.length > 0; i++) {
          drawn.push(ms.library.shift());
        }
        ms.hand.push.apply(ms.hand, drawn);
        renderHandBar();
        updateLibraryDisplay();
        sendAction('draw', {
          n: drawn.length
        });
        logAction('Drew ' + drawn.length + ' cards');
        toast('Drew ' + drawn.length + ' cards');
        closeModal();
        syncPrivateState();
      });
    }

    function shuffleLibrary() {
      shuffle(G.game.myState.library);
      updateLibraryDisplay();
      sendAction('shuffle', {});
      logAction('Shuffled library');
      toast('Library shuffled!');
      syncPrivateState();
    }

    function millCards() {
      openModal('<div class="modal-title">Mill Cards</div><div class="flex flex-col gap-3"><div><label>Number of cards to mill</label><input id="mill-n-input" type="number" value="3" min="1" style="font-size:1.3rem;text-align:center"/></div><button class="btn btn-gold" id="mill-btn">Mill</button></div>');
      document.getElementById('mill-btn').addEventListener('click', function() {
        var n = parseInt(document.getElementById('mill-n-input').value) || 1;
        var ms = G.game.myState;
        var milled = [];
        for (var i = 0; i < n && ms.library.length > 0; i++) {
          milled.push(ms.library.shift());
        }
        ms.graveyard.push.apply(ms.graveyard, milled);
        updateLibraryDisplay();
        renderZoneGrid('graveyard');
        logAction('Milled ' + milled.length + ' cards');
        toast('Milled ' + milled.length + ' cards');
        closeModal();
        syncPublicZones();
        syncPrivateState();
      });
    }

    function tutorModal() {
      var ms = G.game.myState;
      if (!ms.library.length) {
        toast('Library is empty!');
        return;
      }
      var q = '';

      function renderResults() {
        var results = ms.library.filter(function(c) {
          return !q || c.name.toLowerCase().includes(q.toLowerCase());
        }).slice(0, 100);
        var el = document.getElementById('tutor-results');
        if (!el) return;
        el.innerHTML = results.map(function(c, i) {
          return '<div class="scry-result tutor-pick" data-name="' + escH(c.name) + '">' + (c.image ? '<img src="' + c.image + '" style="width:40px;height:56px;border-radius:4px;flex-shrink:0">' : '<div style="width:40px;height:56px;background:hsl(var(--muted));border-radius:4px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:.5rem;text-align:center;color:hsl(var(--muted-fg))">' + escH(c.name) + '</div>') + '<div class="scry-result-info"><div class="font-semibold text-sm">' + escH(c.name) + '</div><div class="text-xs text-muted">' + escH(c.type || '') + '</div></div><button class="btn btn-xs btn-gold tutor-take" data-name="' + escH(c.name) + '">Take</button></div>';
        }).join('');
        el.querySelectorAll('.tutor-take').forEach(function(btn) {
          btn.addEventListener('click', function() {
            var name = btn.dataset.name;
            var libIdx = ms.library.findIndex(function(c) {
              return c.name === name;
            });
            if (libIdx >= 0) {
              var c = ms.library.splice(libIdx, 1)[0];
              ms.hand.push(c);
              shuffle(ms.library);
              renderHandBar();
              updateLibraryDisplay();
              logAction('Tutored for ' + c.name);
              toast('Found: ' + c.name);
              closeModal();
              syncPrivateState();
            }
          });
        });
        el.querySelectorAll('.tutor-pick img').forEach(function(img) {
          img.style.cursor = 'zoom-in';
          img.addEventListener('click', function(e) {
            e.stopPropagation();
            var row = img.closest('.tutor-pick');
            var name = row ? row.dataset.name : '';
            zoomCard({
              name: name,
              image: img.src || null,
              isDFC: false,
              facedown: false
            });
          });
        });
      }
      openModal('<div class="modal-title">&#128269; Tutor</div><div class="flex flex-col gap-2"><input id="tutor-search" placeholder="Search your library…" autocomplete="off"/><div id="tutor-results" style="max-height:300px;overflow-y:auto"></div></div>', '460px');
      document.getElementById('tutor-search').addEventListener('input', function() {
        q = this.value;
        renderResults();
      });
      renderResults();
    }

    // ── Scry ──────────────────────────────────────────────────────
    function scryX() {
      openModal('<div class="modal-title">&#128302; Scry X</div><div class="flex flex-col gap-3"><div><label>Number of cards to scry</label><input id="scry-n-input" type="number" value="1" min="1" style="font-size:1.3rem;text-align:center"/></div><button class="btn btn-gold" id="scry-go-btn">&#128302; Scry</button></div>');
      document.getElementById('scry-go-btn').addEventListener('click', function() {
        var n = Math.min(parseInt(document.getElementById('scry-n-input').value) || 1, G.game.myState.library.length);
        if (!n) {
          toast('Library is empty');
          return;
        }
        G.scryState = {
          allCards: G.game.myState.library.slice(0, n),
          topOrder: [],
          bottomOrder: [],
          choices: {}
        };
        showScryModal();
      });
    }

    function showScryModal() {
      var st = G.scryState;
      if (!st) return;
      var n = st.allCards.length;
      var html = '<div class="modal-title">&#128302; Scry ' + n + '</div>' +
        '<div style="font-size:.68rem;color:hsl(var(--muted-fg));margin-bottom:.5rem">Tap a card to zoom. Use &#9650; / &#9660; to assign. Top cards are placed in assign-order (1 = topmost). Confirm when all assigned.</div>' +
        '<div class="scry-all-grid" id="scry-grid"></div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:.6rem;gap:.5rem">' +
        '<span id="scry-prog" style="font-size:.72rem;color:hsl(var(--muted-fg))">0 / ' + n + ' assigned</span>' +
        '<div style="display:flex;gap:.4rem">' +
        '<button class="btn btn-sm" id="scry-all-top-btn">&#9650; All Top</button>' +
        '<button class="btn btn-sm" id="scry-all-bot-btn">&#9660; All Bot</button>' +
        '<button class="btn btn-gold" id="scry-done-btn" disabled>Confirm</button>' +
        '</div></div>';
      openModal(html, '560px');
      renderScryGrid();
      document.getElementById('scry-all-top-btn').addEventListener('click', function() {
        st.allCards.forEach(function(c) {
          if (st.choices[c.id] !== 'top') {
            if (st.choices[c.id] === 'bottom') st.bottomOrder = st.bottomOrder.filter(function(id) {
              return id !== c.id;
            });
            if (st.choices[c.id] !== 'top') st.topOrder.push(c.id);
            st.choices[c.id] = 'top';
          }
        });
        renderScryGrid();
      });
      document.getElementById('scry-all-bot-btn').addEventListener('click', function() {
        st.allCards.forEach(function(c) {
          if (st.choices[c.id] !== 'bottom') {
            if (st.choices[c.id] === 'top') st.topOrder = st.topOrder.filter(function(id) {
              return id !== c.id;
            });
            if (st.choices[c.id] !== 'bottom') st.bottomOrder.push(c.id);
            st.choices[c.id] = 'bottom';
          }
        });
        renderScryGrid();
      });
      document.getElementById('scry-done-btn').addEventListener('click', finishScry);
    }

    function renderScryGrid() {
      var st = G.scryState;
      if (!st) return;
      var grid = document.getElementById('scry-grid');
      if (!grid) return;
      var assigned = Object.keys(st.choices).length;
      var n = st.allCards.length;
      var progEl = document.getElementById('scry-prog');
      if (progEl) progEl.textContent = assigned + ' / ' + n + ' assigned';
      var doneBtn = document.getElementById('scry-done-btn');
      if (doneBtn) doneBtn.disabled = (assigned < n);
      grid.innerHTML = '';
      st.allCards.forEach(function(card) {
        var ch = st.choices[card.id];
        var topPos = ch === 'top' ? (st.topOrder.indexOf(card.id) + 1) : null;
        var tile = document.createElement('div');
        tile.className = 'scry-card-tile' + (ch === 'top' ? ' assigned-top' : ch === 'bottom' ? ' assigned-bot' : '');
        var imgWrap = document.createElement('div');
        imgWrap.className = 'scry-card-tile-img';
        var im = document.createElement('img');
        im.src = card.image || '';
        im.loading = 'lazy';
        im.style.cssText = 'width:100%;border-radius:5px 5px 0 0;display:block;cursor:zoom-in';
        im.addEventListener('click', function() {
          zoomCard(card, 'hand');
        });
        imgWrap.appendChild(im);
        if (ch === 'top' && topPos) {
          var b = document.createElement('div');
          b.className = 'scry-pos-badge';
          b.textContent = '▲' + topPos;
          imgWrap.appendChild(b);
        } else if (ch === 'bottom') {
          var b = document.createElement('div');
          b.className = 'scry-gy-badge';
          b.textContent = '▼Bot';
          imgWrap.appendChild(b);
        }
        tile.appendChild(imgWrap);
        var nm = document.createElement('div');
        nm.className = 'scry-card-tile-name';
        nm.textContent = card.name;
        tile.appendChild(nm);
        var btnRow = document.createElement('div');
        btnRow.className = 'scry-card-btn-row';
        var topBtn = document.createElement('button');
        topBtn.className = 'scry-card-btn' + (ch === 'top' ? ' btn-top-on' : '');
        topBtn.textContent = '▲ Top';
        var botBtn = document.createElement('button');
        botBtn.className = 'scry-card-btn' + (ch === 'bottom' ? ' btn-bot-on' : '');
        botBtn.textContent = '▼ Bot';
        topBtn.addEventListener('click', function() {
          if (ch === 'top') {
            st.topOrder = st.topOrder.filter(function(id) {
              return id !== card.id;
            });
            delete st.choices[card.id];
            ch = null;
          } else {
            if (ch === 'bottom') st.bottomOrder = st.bottomOrder.filter(function(id) {
              return id !== card.id;
            });
            st.topOrder.push(card.id);
            st.choices[card.id] = 'top';
            ch = 'top';
          }
          renderScryGrid();
        });
        botBtn.addEventListener('click', function() {
          if (ch === 'bottom') {
            st.bottomOrder = st.bottomOrder.filter(function(id) {
              return id !== card.id;
            });
            delete st.choices[card.id];
            ch = null;
          } else {
            if (ch === 'top') st.topOrder = st.topOrder.filter(function(id) {
              return id !== card.id;
            });
            st.bottomOrder.push(card.id);
            st.choices[card.id] = 'bottom';
            ch = 'bottom';
          }
          renderScryGrid();
        });
        btnRow.appendChild(topBtn);
        btnRow.appendChild(botBtn);
        tile.appendChild(btnRow);
        grid.appendChild(tile);
      });
    }

    function finishScry() {
      var st = G.scryState;
      if (!st) return;
      var ms = G.game.myState;
      var n = st.allCards.length;
      var topCards = st.topOrder.map(function(id) {
        return st.allCards.find(function(c) {
          return c.id === id;
        });
      }).filter(Boolean);
      var botCards = st.bottomOrder.map(function(id) {
        return st.allCards.find(function(c) {
          return c.id === id;
        });
      }).filter(Boolean);
      var rest = ms.library.slice(n);
      ms.library = [...topCards, ...rest, ...botCards];
      G.scryState = null;
      updateLibraryDisplay();
      syncPrivateState();
      logAction('Scryed ' + n + ' cards (' + (topCards.length) + ' top, ' + (botCards.length) + ' bottom)');
      toast('Scry complete!');
      closeModal();
    }

    // ── Surveil ────────────────────────────────────────────────────
    function surveilX() {
      openModal('<div class="modal-title">Surveil X</div><div class="flex flex-col gap-3"><div><label>Number of cards to surveil</label><input id="surveil-n-input" type="number" value="1" min="1" style="font-size:1.3rem;text-align:center"/></div><button class="btn btn-gold" id="surveil-go-btn">Surveil</button></div>');
      document.getElementById('surveil-go-btn').addEventListener('click', function() {
        var n = Math.min(parseInt(document.getElementById('surveil-n-input').value) || 1, G.game.myState.library.length);
        if (!n) {
          toast('Library is empty');
          return;
        }
        G.surveilState = {
          allCards: G.game.myState.library.slice(0, n),
          keepOrder: [],
          gyOrder: [],
          choices: {}
        };
        showSurveilModal();
      });
    }

    function showSurveilModal() {
      var st = G.surveilState;
      if (!st) return;
      var n = st.allCards.length;
      var html = '<div class="modal-title">Surveil ' + n + '</div>' +
        '<div style="font-size:.68rem;color:hsl(var(--muted-fg));margin-bottom:.5rem">Keep cards go back on top in assign-order. Graveyard cards are milled. Confirm when all assigned.</div>' +
        '<div class="scry-all-grid" id="surv-grid"></div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:.6rem;gap:.5rem">' +
        '<span id="surv-prog" style="font-size:.72rem;color:hsl(var(--muted-fg))">0 / ' + n + ' assigned</span>' +
        '<div style="display:flex;gap:.4rem">' +
        '<button class="btn btn-sm" id="surv-all-keep-btn">&#9650; All Keep</button>' +
        '<button class="btn btn-sm" id="surv-all-gy-btn">&#128128; All GY</button>' +
        '<button class="btn btn-gold" id="surv-done-btn" disabled>Confirm</button>' +
        '</div></div>';
      openModal(html, '560px');
      renderSurveilGrid();
      document.getElementById('surv-all-keep-btn').addEventListener('click', function() {
        st.allCards.forEach(function(c) {
          if (st.choices[c.id] !== 'keep') {
            if (st.choices[c.id] === 'gy') st.gyOrder = st.gyOrder.filter(function(id) {
              return id !== c.id;
            });
            if (st.choices[c.id] !== 'keep') st.keepOrder.push(c.id);
            st.choices[c.id] = 'keep';
          }
        });
        renderSurveilGrid();
      });
      document.getElementById('surv-all-gy-btn').addEventListener('click', function() {
        st.allCards.forEach(function(c) {
          if (st.choices[c.id] !== 'gy') {
            if (st.choices[c.id] === 'keep') st.keepOrder = st.keepOrder.filter(function(id) {
              return id !== c.id;
            });
            if (st.choices[c.id] !== 'gy') st.gyOrder.push(c.id);
            st.choices[c.id] = 'gy';
          }
        });
        renderSurveilGrid();
      });
      document.getElementById('surv-done-btn').addEventListener('click', finishSurveil);
    }

    function renderSurveilGrid() {
      var st = G.surveilState;
      if (!st) return;
      var grid = document.getElementById('surv-grid');
      if (!grid) return;
      var assigned = Object.keys(st.choices).length;
      var n = st.allCards.length;
      var progEl = document.getElementById('surv-prog');
      if (progEl) progEl.textContent = assigned + ' / ' + n + ' assigned';
      var doneBtn = document.getElementById('surv-done-btn');
      if (doneBtn) doneBtn.disabled = (assigned < n);
      grid.innerHTML = '';
      st.allCards.forEach(function(card) {
        var ch = st.choices[card.id];
        var keepPos = ch === 'keep' ? (st.keepOrder.indexOf(card.id) + 1) : null;
        var tile = document.createElement('div');
        tile.className = 'scry-card-tile' + (ch === 'keep' ? ' assigned-top' : ch === 'gy' ? ' assigned-gy' : '');
        var imgWrap = document.createElement('div');
        imgWrap.className = 'scry-card-tile-img';
        var im = document.createElement('img');
        im.src = card.image || '';
        im.loading = 'lazy';
        im.style.cssText = 'width:100%;border-radius:5px 5px 0 0;display:block;cursor:zoom-in';
        im.addEventListener('click', function() {
          zoomCard(card, 'hand');
        });
        imgWrap.appendChild(im);
        if (ch === 'keep' && keepPos) {
          var b = document.createElement('div');
          b.className = 'scry-pos-badge';
          b.textContent = '▲' + keepPos;
          imgWrap.appendChild(b);
        } else if (ch === 'gy') {
          var b = document.createElement('div');
          b.className = 'scry-gy-badge';
          b.textContent = 'GY';
          imgWrap.appendChild(b);
        }
        tile.appendChild(imgWrap);
        var nm = document.createElement('div');
        nm.className = 'scry-card-tile-name';
        nm.textContent = card.name;
        tile.appendChild(nm);
        var btnRow = document.createElement('div');
        btnRow.className = 'scry-card-btn-row';
        var keepBtn = document.createElement('button');
        keepBtn.className = 'scry-card-btn' + (ch === 'keep' ? ' btn-top-on' : '');
        keepBtn.textContent = '▲ Keep';
        var gyBtn = document.createElement('button');
        gyBtn.className = 'scry-card-btn' + (ch === 'gy' ? ' btn-gy-on' : '');
        gyBtn.textContent = '🗑 GY';
        keepBtn.addEventListener('click', function() {
          if (ch === 'keep') {
            st.keepOrder = st.keepOrder.filter(function(id) {
              return id !== card.id;
            });
            delete st.choices[card.id];
            ch = null;
          } else {
            if (ch === 'gy') st.gyOrder = st.gyOrder.filter(function(id) {
              return id !== card.id;
            });
            st.keepOrder.push(card.id);
            st.choices[card.id] = 'keep';
            ch = 'keep';
          }
          renderSurveilGrid();
        });
        gyBtn.addEventListener('click', function() {
          if (ch === 'gy') {
            st.gyOrder = st.gyOrder.filter(function(id) {
              return id !== card.id;
            });
            delete st.choices[card.id];
            ch = null;
          } else {
            if (ch === 'keep') st.keepOrder = st.keepOrder.filter(function(id) {
              return id !== card.id;
            });
            st.gyOrder.push(card.id);
            st.choices[card.id] = 'gy';
            ch = 'gy';
          }
          renderSurveilGrid();
        });
        btnRow.appendChild(keepBtn);
        btnRow.appendChild(gyBtn);
        tile.appendChild(btnRow);
        grid.appendChild(tile);
      });
    }

    function finishSurveil() {
      var st = G.surveilState;
      if (!st) return;
      var ms = G.game.myState;
      var n = st.allCards.length;
      var keepCards = st.keepOrder.map(function(id) {
        return st.allCards.find(function(c) {
          return c.id === id;
        });
      }).filter(Boolean);
      var gyCards = st.gyOrder.map(function(id) {
        return st.allCards.find(function(c) {
          return c.id === id;
        });
      }).filter(Boolean);
      var rest = ms.library.slice(n);
      ms.library = [...keepCards, ...rest];
      ms.graveyard.push.apply(ms.graveyard, gyCards);
      G.surveilState = null;
      updateLibraryDisplay();
      renderZoneGrid('graveyard');
      syncPrivateState();
      syncPublicZones();
      logAction('Surveiled ' + n + ' cards (' + (keepCards.length) + ' kept, ' + (gyCards.length) + ' to GY)');
      toast('Surveil complete!');
      closeModal();
    }

    // ── Impulse Draw ───────────────────────────────────────────────
    function impulseDrawN() {
      openModal('<div class="modal-title">&#9889; Impulse Draw</div>' +
        '<div style="font-size:.78rem;color:hsl(var(--muted-fg));margin-bottom:.75rem">Exile the top N cards face-up. You may play one of them until your next turn.</div>' +
        '<div class="flex flex-col gap-3"><div><label>Number of cards to exile</label><input id="impulse-n-input" type="number" value="1" min="1" style="font-size:1.3rem;text-align:center"/></div>' +
        '<button class="btn btn-gold" id="impulse-go-btn">&#9889; Impulse Draw</button></div>');
      document.getElementById('impulse-go-btn').addEventListener('click', function() {
        var n = Math.min(parseInt(document.getElementById('impulse-n-input').value) || 1, G.game.myState.library.length);
        if (!n) {
          toast('Library is empty');
          return;
        }
        var ms = G.game.myState;
        var cards = ms.library.splice(0, n);
        cards.forEach(function(c) {
          c.isImpulse = true;
          ms.exile.push(c);
        });
        renderZoneGrid('exile');
        updateLibraryDisplay();
        syncPrivateState();
        syncPublicZones();
        logAction('Impulse drew ' + n + ' card' + (n > 1 ? 's' : ''));
        toast('Impulse: ' + n + ' card' + (n > 1 ? 's' : '') + ' exiled — tap one to play!');
        closeModal();
        switchZone('exile');
      });
    }

    // ── Token Creation ────────────────────────────────────────────
    // FIX: Custom token now has scrollable art picker using Scryfall token search
    var TOKEN_PRESETS = [{
        name: '1/1 White Soldier',
        power: '1',
        toughness: '1',
        type: 'Creature — Soldier',
        colors: ['W'],
        keywords: '',
        icon: '🛡'
      },
      {
        name: '1/1 Green Elf',
        power: '1',
        toughness: '1',
        type: 'Creature — Elf',
        colors: ['G'],
        keywords: '',
        icon: '🌿'
      },
      {
        name: '1/1 Green Saproling',
        power: '1',
        toughness: '1',
        type: 'Creature — Saproling',
        colors: ['G'],
        keywords: '',
        icon: '🍄'
      },
      {
        name: '2/2 Black Zombie',
        power: '2',
        toughness: '2',
        type: 'Creature — Zombie',
        colors: ['B'],
        keywords: '',
        icon: '🧟'
      },
      {
        name: '1/1 Red Goblin',
        power: '1',
        toughness: '1',
        type: 'Creature — Goblin',
        colors: ['R'],
        keywords: '',
        icon: '👺'
      },
      {
        name: '3/3 Green Beast',
        power: '3',
        toughness: '3',
        type: 'Creature — Beast',
        colors: ['G'],
        keywords: '',
        icon: '🐉'
      },
      {
        name: '1/1 Blue Bird',
        power: '1',
        toughness: '1',
        type: 'Creature — Bird',
        colors: ['U'],
        keywords: 'Flying',
        icon: '🐦'
      },
      {
        name: '1/1 White Spirit',
        power: '1',
        toughness: '1',
        type: 'Creature — Spirit',
        colors: ['W'],
        keywords: 'Flying',
        icon: '👻'
      },
      {
        name: '2/2 White Knight',
        power: '2',
        toughness: '2',
        type: 'Creature — Knight',
        colors: ['W'],
        keywords: 'Vigilance',
        icon: '⚔'
      },
      {
        name: '1/1 Treasure',
        power: '',
        toughness: '',
        type: 'Artifact — Treasure',
        colors: [],
        keywords: '',
        icon: '💎'
      },
      {
        name: '1/1 Food',
        power: '',
        toughness: '',
        type: 'Artifact — Food',
        colors: [],
        keywords: '',
        icon: '🍞'
      },
      {
        name: '1/1 Clue',
        power: '',
        toughness: '',
        type: 'Artifact — Clue',
        colors: [],
        keywords: '',
        icon: '🔍'
      },
      {
        name: '0/0 Thopter',
        power: '0',
        toughness: '0',
        type: 'Artifact Creature — Thopter',
        colors: [],
        keywords: 'Flying',
        icon: '⚙'
      },
      {
        name: '2/2 Gold Dragon',
        power: '2',
        toughness: '2',
        type: 'Creature — Dragon',
        colors: ['R'],
        keywords: 'Flying',
        icon: '🐲'
      },
      {
        name: '5/5 Green Wurm',
        power: '5',
        toughness: '5',
        type: 'Creature — Wurm',
        colors: ['G'],
        keywords: '',
        icon: '🐍'
      },
    ];

    var _customTokenArtOptions = []; // stores {img, label} for art picker
    var _customTokenSelectedArtIdx = -1; // -1 = no art / placeholder

    function openTokenModal() {
      openModal(
        '<div class="modal-title">&#x1FA99; Create Token</div>' +
        '<div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:hsl(var(--muted-fg));margin-bottom:.45rem">Quick Presets</div>' +
        '<div class="token-grid" style="margin-bottom:1rem">' +
        TOKEN_PRESETS.map(function(tp, i) {
          return '<div class="token-preset" data-tp="' + i + '"><span class="tp-icon">' + tp.icon + '</span><div>' + tp.name + '</div><div class="tp-pt">' + (tp.power !== '' ? tp.power + '/' + tp.toughness + ' ' : '') + tp.type.replace(/Creature — /, '') + '</div></div>';
        }).join('') +
        '</div>' +
        '<hr class="divider"/>' +
        '<div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:hsl(var(--muted-fg));margin-bottom:.45rem">Custom Token</div>' +
        '<div class="flex flex-col gap-2">' +
        '<div class="flex gap-2"><input id="tok-name" placeholder="Token name…" style="flex:1"/><input id="tok-qty" type="number" value="1" min="1" style="width:52px" title="Quantity"/></div>' +
        '<div class="flex gap-2"><input id="tok-power" placeholder="Power" style="width:60px"/><span style="align-self:center">/</span><input id="tok-tough" placeholder="Tough" style="width:60px"/><input id="tok-type" placeholder="Type line…" style="flex:1"/></div>' +
        '<input id="tok-keywords" placeholder="Keywords (e.g. Flying, Trample)…"/>' +
        '<div class="flex gap-2" style="align-items:center">' +
        '<span style="font-size:.75rem;color:hsl(var(--muted-fg))">Colors:</span>' +
        '<label style="display:flex;align-items:center;gap:.2rem;margin:0;font-size:.75rem"><input type="checkbox" class="tok-color" value="W" style="width:14px;height:14px;accent-color:#e8d5a0"/>W</label>' +
        '<label style="display:flex;align-items:center;gap:.2rem;margin:0;font-size:.75rem"><input type="checkbox" class="tok-color" value="U" style="width:14px;height:14px;accent-color:#6bb0d8"/>U</label>' +
        '<label style="display:flex;align-items:center;gap:.2rem;margin:0;font-size:.75rem"><input type="checkbox" class="tok-color" value="B" style="width:14px;height:14px;accent-color:#9090a0"/>B</label>' +
        '<label style="display:flex;align-items:center;gap:.2rem;margin:0;font-size:.75rem"><input type="checkbox" class="tok-color" value="R" style="width:14px;height:14px;accent-color:#d06040"/>R</label>' +
        '<label style="display:flex;align-items:center;gap:.2rem;margin:0;font-size:.75rem"><input type="checkbox" class="tok-color" value="G" style="width:14px;height:14px;accent-color:#70a860"/>G</label>' +
        '</div>' +
        '<button class="btn btn-xs" id="tok-search-art-btn" style="align-self:flex-start">&#127912; Search Art on Scryfall</button>' +
        '<div id="tok-art-picker" style="display:none">' +
        '<div style="font-size:.68rem;color:hsl(var(--muted-fg));margin-bottom:.3rem">Select art for this token — scroll to see all results:</div>' +
        '<div class="tok-art-scroll-wrap"><div id="tok-art-grid" class="token-art-picker"></div></div>' +
        '</div>' +
        '<button class="btn btn-gold" id="tok-create-btn">&#x1FA99; Create Token</button>' +
        '</div>',
        '480px'
      );

      _customTokenArtOptions = [];
      _customTokenSelectedArtIdx = -1;

      document.querySelectorAll('.token-preset').forEach(function(el, i) {
        el.addEventListener('click', function() {
          var tp = TOKEN_PRESETS[i];
          createTokenFromPreset(tp, 1);
        });
      });

      document.getElementById('tok-search-art-btn').addEventListener('click', function() {
        searchTokenArt();
      });

      document.getElementById('tok-create-btn').addEventListener('click', function() {
        var name = (document.getElementById('tok-name').value || '').trim() || 'Token';
        var qty = parseInt(document.getElementById('tok-qty').value) || 1;
        var power = (document.getElementById('tok-power').value || '').trim();
        var tough = (document.getElementById('tok-tough').value || '').trim();
        var type = (document.getElementById('tok-type').value || '').trim() || 'Creature — Token';
        var keywords = (document.getElementById('tok-keywords').value || '').trim();
        var colors = Array.from(document.querySelectorAll('.tok-color:checked')).map(function(c) {
          return c.value;
        });
        var selectedArt = (_customTokenSelectedArtIdx >= 0 && _customTokenArtOptions[_customTokenSelectedArtIdx]) ? _customTokenArtOptions[_customTokenSelectedArtIdx].img : null;
        createCustomToken(name, power, tough, type, keywords, colors, qty, selectedArt);
      });
    }

    async function searchTokenArt() {
      var name = (document.getElementById('tok-name').value || '').trim();
      var type = (document.getElementById('tok-type').value || '').trim();
      if (!name) {
        toast('Enter a token name first');
        return;
      }
      var artPicker = document.getElementById('tok-art-picker');
      var artGrid = document.getElementById('tok-art-grid');
      artPicker.style.display = 'block';
      artGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:.5rem;font-size:.75rem;color:hsl(var(--muted-fg))">Searching Scryfall…</div>';
      _customTokenArtOptions = [{
        img: null,
        label: 'No Art'
      }];
      _customTokenSelectedArtIdx = -1;
      // Build search query: try subtype from type line first, then name words
      var subtype = '';
      if (type) {
        var tp = type.split(/[—\-]/);
        if (tp[1]) subtype = tp[1].trim().split(' ')[0];
      }
      var nameWords = name.split(' ').filter(function(w) {
        return w.length > 2;
      });
      var queries = [];
      if (subtype) queries.push('t:token t:"' + subtype + '"');
      nameWords.forEach(function(w) {
        queries.push('t:token "' + w + '"');
      });
      queries.push('t:token ' + name); // fallback: loose search
      var seen = new Set();
      async function tryQuery(q) {
        try {
          var r = await fetch('https://api.scryfall.com/cards/search?q=' + encodeURIComponent(q) + '&unique=art&order=released&dir=desc');
          var data = await r.json();
          if (data.data && data.data.length) {
            data.data.forEach(function(sf) {
              var img = cardImg(sf, 0);
              if (img && !seen.has(img)) {
                seen.add(img);
                _customTokenArtOptions.push({
                  img: img,
                  label: (sf.set_name || sf.set || '') + (sf.artist ? ' — ' + sf.artist : '')
                });
              }
            });
          }
        } catch (e) {}
      }
      try {
        // Run all queries and merge unique art results
        for (var qi = 0; qi < queries.length; qi++) {
          if (_customTokenArtOptions.length > 30) break;
          await tryQuery(queries[qi]);
        }
        artGrid.innerHTML = '';
        renderTokenArtGrid(artGrid);
        if (_customTokenArtOptions.length <= 1) {
          var none = document.createElement('div');
          none.style.cssText = 'grid-column:1/-1;font-size:.68rem;color:hsl(var(--muted-fg));text-align:center;padding:.3rem';
          none.textContent = 'No token art found. You can still create the token without art.';
          artGrid.appendChild(none);
        }
      } catch (err) {
        artGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:.5rem;font-size:.75rem;color:hsl(var(--muted-fg))">Art search failed. You can still create the token.</div>';
      }
    }

    function renderTokenArtGrid(grid) {
      grid.innerHTML = '';
      _customTokenArtOptions.forEach(function(opt, i) {
        var el = document.createElement('div');
        if (opt.img) {
          el.className = 'token-art-option' + (i === _customTokenSelectedArtIdx ? ' selected' : '');
          var im = document.createElement('img');
          im.src = opt.img;
          im.loading = 'lazy';
          im.style.cssText = 'width:100%;border-radius:4px;display:block';
          el.appendChild(im);
          var lbl = document.createElement('div');
          lbl.style.cssText = 'font-size:.48rem;text-align:center;color:hsl(var(--muted-fg));overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:.1rem';
          lbl.title = opt.label;
          lbl.textContent = opt.label.slice(0, 20);
          el.appendChild(lbl);
        } else {
          el.className = 'token-art-option-placeholder' + (i === _customTokenSelectedArtIdx ? ' selected' : '');
          el.textContent = 'No Art';
        }
        el.addEventListener('click', function() {
          _customTokenSelectedArtIdx = i;
          renderTokenArtGrid(grid);
        });
        grid.appendChild(el);
      });
    }

    function createTokenFromPreset(tp, qty) {
      var ptStr = (tp.power !== '' && tp.toughness !== '') ? tp.power + '/' + tp.toughness + ' ' : '';
      var displayName = ptStr + tp.name + (tp.keywords ? ' (' + tp.keywords + ')' : '');
      var ms = G.game.myState;
      var newIds = [];
      for (var i = 0; i < qty; i++) {
        var id = uid();
        newIds.push(id);
        ms.battlefield.push({
          id: id,
          name: displayName,
          image: null,
          isDFC: false,
          currentFace: 0,
          type: tp.type,
          counters: {},
          facedown: false,
          attachedTo: null,
          attachments: [],
          tapped: false,
          bfPlaced: false,
          x: null,
          y: null,
          isToken: true
        });
      }
      renderBattlefield();
      switchZone('battlefield');
      sendAction('token', {
        qty: qty,
        tokenName: displayName
      });
      logAction('Created ' + qty + 'x ' + displayName);
      toast('Created ' + qty + 'x ' + displayName + '!');
      syncPublicZones();
      closeModal();
      // Async: fetch art from Scryfall and apply to all newly created tokens
      var typeParts = tp.type.split('\u2014');
      var subtypes = (typeParts[1] || '').trim().split(' ');
      var searchSubtype = subtypes[0] || tp.name;
      var q = 't:token t:"' + searchSubtype + '"';
      fetch('https://api.scryfall.com/cards/search?q=' + encodeURIComponent(q) + '&unique=art&order=released&dir=desc')
        .then(function(r) {
          return r.json();
        })
        .then(function(data) {
          if (data.data && data.data.length) {
            var img = cardImg(data.data[0], 0);
            if (img) {
              var bf = G.game.myState.battlefield;
              var updated = false;
              newIds.forEach(function(id) {
                var tok = bf.find(function(c) {
                  return c.id === id;
                });
                if (tok && !tok.image) {
                  tok.image = img;
                  updated = true;
                }
              });
              if (updated) {
                renderBattlefield();
                syncPublicZones();
              }
            }
          }
        }).catch(function() {});
    }

    function createCustomToken(name, power, tough, type, keywords, colors, qty, artImg) {
      qty = qty || 1;
      var ptStr = (power !== '' && tough !== '') ? power + '/' + tough + ' ' : '';
      var displayName = ptStr + name + (keywords ? ' (' + keywords + ')' : '');
      var ms = G.game.myState;
      // Always create individual tokens — no stacking
      for (var i = 0; i < qty; i++) {
        ms.battlefield.push({
          id: uid(),
          name: displayName,
          image: artImg || null,
          isDFC: false,
          currentFace: 0,
          type: type,
          counters: {},
          facedown: false,
          attachedTo: null,
          attachments: [],
          tapped: false,
          bfPlaced: false,
          x: null,
          y: null,
          isToken: true
        });
      }
      renderBattlefield();
      switchZone('battlefield');
      sendAction('token', {
        qty: qty,
        tokenName: displayName
      });
      logAction('Created ' + qty + 'x ' + displayName);
      toast('Created ' + qty + 'x ' + displayName + '!');
      syncPublicZones();
      closeModal();
    }

    // ── Emblem Creation ─────────────────────────────
    var EMBLEM_PRESETS = [{
        name: 'Monarch',
        icon: '👑',
        desc: 'You are the Monarch'
      },
      {
        name: 'The Ring',
        icon: '💍',
        desc: 'Ring Tempts You'
      },
      {
        name: 'Initiative',
        icon: '🗡️',
        desc: 'You have the Initiative'
      },
      {
        name: "City's Blessing",
        icon: '⭐',
        desc: "City's Blessing"
      },
      {
        name: 'Dungeon: Mad Mage',
        icon: '🗺️',
        desc: 'Dungeon of the Mad Mage'
      },
      {
        name: 'Dungeon: Phandelver',
        icon: '⛏️',
        desc: 'Lost Mine of Phandelver'
      },
      {
        name: 'Dungeon: Shadows',
        icon: '🌑',
        desc: 'Dungeon of Shadows'
      },
    ];

    function openEmblemModal() {
      openModal(
        '<div class="modal-title">&#127775; Create Emblem</div>' +
        '<div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:hsl(var(--muted-fg));margin-bottom:.45rem">Quick Presets</div>' +
        '<div class="token-grid" style="margin-bottom:1rem">' +
        EMBLEM_PRESETS.map(function(ep, i) {
          return '<div class="token-preset" data-ep="' + i + '"><span class="tp-icon">' + ep.icon + '</span><div style="font-size:.65rem">' + escH(ep.name) + '</div></div>';
        }).join('') +
        '</div>' +
        '<hr class="divider"/>' +
        '<div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:hsl(var(--muted-fg));margin-bottom:.45rem">Custom Emblem</div>' +
        '<div class="flex flex-col gap-2">' +
        '<input id="emblem-name" placeholder="Emblem name (e.g. Monarch, The Ring)\u2026" autocomplete="off"/>' +
        '<div style="font-size:.72rem;color:hsl(var(--muted-fg))">Emblems appear on your battlefield and are visible to all players.</div>' +
        '<button class="btn btn-gold" id="emblem-create-btn">&#127775; Create Emblem</button>' +
        '</div>',
        '440px'
      );
      setTimeout(function() {
        var el = document.getElementById('emblem-name');
        if (el) el.focus();
      }, 80);
      document.querySelectorAll('.token-preset[data-ep]').forEach(function(el, i) {
        el.addEventListener('click', function() {
          createEmblem(EMBLEM_PRESETS[i].name);
        });
      });
      document.getElementById('emblem-create-btn').addEventListener('click', function() {
        var name = (document.getElementById('emblem-name').value || '').trim() || 'Emblem';
        createEmblem(name);
      });
    }

    function createEmblem(name) {
      var ms = G.game.myState;
      ms.battlefield.push({
        id: uid(),
        name: name,
        image: null,
        isDFC: false,
        currentFace: 0,
        type: 'Emblem',
        counters: {},
        facedown: false,
        attachedTo: null,
        attachments: [],
        tapped: false,
        bfPlaced: false,
        x: null,
        y: null,
        isToken: true,
        isEmblem: true
      });
      renderBattlefield();
      switchZone('battlefield');
      sendAction('token', {
        qty: 1,
        tokenName: name + ' [Emblem]'
      });
      logAction('Created emblem: ' + name);
      toast('\u2728 ' + name + ' Emblem created!');
      syncPublicZones();
      closeModal();
    }

    // ── Add Card to Battlefield (Search Scryfall) ─────────────────
    function openAddCardToBattlefield() {
      openModal(
        '<div class="modal-title">&#128270; Add Card to Battlefield</div>' +
        '<div class="flex flex-col gap-2">' +
        '<input id="add-card-q" placeholder="Search card name…" autocomplete="off" style="font-size:1rem"/>' +
        '<div id="add-card-results" style="max-height:320px;overflow-y:auto;display:flex;flex-direction:column;gap:.4rem"></div>' +
        '</div>',
        '440px'
      );
      var _addTimer = null;
      document.getElementById('add-card-q').addEventListener('input', function() {
        clearTimeout(_addTimer);
        var q = this.value.trim();
        if (q.length < 2) {
          document.getElementById('add-card-results').innerHTML = '';
          return;
        }
        _addTimer = setTimeout(function() {
          doAddCardSearch(q);
        }, 380);
      });
      document.getElementById('add-card-q').focus();
    }

    function doAddCardSearch(q) {
      var el = document.getElementById('add-card-results');
      if (!el) return;
      el.innerHTML = '<div style="font-size:.75rem;color:hsl(var(--muted-fg));text-align:center;padding:.5rem">Searching…</div>';
      fetch('https://api.scryfall.com/cards/search?q=' + encodeURIComponent(q) + '&unique=cards&order=name&limit=20')
        .then(function(r) {
          return r.json();
        })
        .then(function(data) {
          if (!document.getElementById('add-card-results')) return;
          if (!data.data || !data.data.length) {
            el.innerHTML = '<div style="font-size:.75rem;color:hsl(var(--muted-fg));text-align:center;padding:.5rem">No results.</div>';
            return;
          }
          el.innerHTML = '';
          data.data.slice(0, 15).forEach(function(sf) {
            var img = cardImg(sf, 0);
            var img2 = cardImg(sf, 1) || null;
            var isDFC = !!(sf.card_faces && sf.card_faces.length > 1 && !img2 === false);
            isDFC = !!(sf.card_faces && sf.card_faces.length > 1 && sf.card_faces[0].image_uris);
            var typeLine = sf.type_line || '';
            var row = document.createElement('div');
            row.className = 'scry-result';
            row.style.cursor = 'pointer';
            row.innerHTML = (img ? '<img src="' + img + '" style="width:40px;height:56px;border-radius:4px;flex-shrink:0;object-fit:cover">' : '<div style="width:40px;height:56px;background:hsl(var(--muted));border-radius:4px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:.45rem;text-align:center;color:hsl(var(--muted-fg));padding:2px">' + escH(sf.name) + '</div>') +
              '<div class="scry-result-info"><div class="font-semibold text-sm">' + escH(sf.name) + '</div><div class="text-xs text-muted">' + escH(typeLine) + '</div></div>' +
              '<button class="btn btn-xs btn-gold" style="flex-shrink:0;align-self:center">Add</button>';
            row.querySelector('button').addEventListener('click', function(e) {
              e.stopPropagation();
              var card = {
                id: uid(),
                name: sf.name,
                type: typeLine,
                image: img || null,
                backImage: img2 || null,
                isDFC: isDFC,
                currentFace: 0,
                counters: {},
                facedown: false,
                attachedTo: null,
                attachments: [],
                tapped: false,
                bfPlaced: false,
                x: null,
                y: null,
                isToken: false
              };
              G.game.myState.battlefield.push(card);
              renderBattlefield();
              switchZone('battlefield');
              syncPublicZones();
              logAction('Added ' + sf.name + ' to battlefield');
              toast(sf.name + ' added!');
              closeModal();
            });
            el.appendChild(row);
          });
        }).catch(function() {
          if (document.getElementById('add-card-results'))
            document.getElementById('add-card-results').innerHTML = '<div style="font-size:.75rem;color:hsl(var(--muted-fg));text-align:center;padding:.5rem">Search failed. Check connection.</div>';
        });
    }

    // ── Cascade ───────────────────────────────────────────────────
    function cascadeModal() {
      openModal(
        '<div class="modal-title">&#127744; Cascade — Reveal Until</div>' +
        '<div style="font-size:.78rem;color:hsl(var(--muted-fg));margin-bottom:.85rem;line-height:1.5">Reveal cards from the top of your library one at a time <strong>until</strong> you reveal a nonland card with CMC strictly less than the cascading spell. You may cast it without paying its mana cost. The rest are shuffled back in random order.</div>' +
        '<div><label>CMC of the cascading spell</label>' +
        '<input id="cascade-cmc" type="number" min="1" value="5" style="font-size:1.3rem;text-align:center;font-family:Cinzel,serif;font-weight:700"/></div>' +
        '<div class="flex gap-2" style="margin-top:.75rem">' +
        '<button class="btn btn-gold" id="cascade-go-btn" style="flex:1">&#127744; Reveal Until Hit</button>' +
        '<button class="btn" onclick="closeModal()">Cancel</button></div>',
        '420px'
      );
      setTimeout(function() {
        var el = document.getElementById('cascade-cmc');
        if (el) {
          el.focus();
          el.select();
        }
      }, 80);
      document.getElementById('cascade-go-btn').addEventListener('click', function() {
        var cmc = parseInt(document.getElementById('cascade-cmc').value);
        if (isNaN(cmc) || cmc < 1) {
          toast('Enter a valid CMC (1+)');
          return;
        }
        closeModal();
        doCascade(cmc);
      });
    }

    function doCascade(maxCmc) {
      var lib = G.game.myState.library;
      if (!lib || !lib.length) {
        toast('Library is empty!');
        return;
      }
      var revealed = [];
      var hit = null;
      // Peel from top until finding a nonland card with cmc < maxCmc
      while (lib.length > 0) {
        var top = lib.shift();
        var tType = top.type || '';
        var tCmc = (top.cmc != null && top.cmc !== '') ? parseFloat(top.cmc) : null;
        if (!tType.includes('Land') && tCmc !== null && !isNaN(tCmc) && tCmc < maxCmc) {
          hit = top;
          break;
        }
        revealed.push(top);
      }
      var revCount = revealed.length + (hit ? 1 : 0);
      logAction('Cascade (CMC<' + maxCmc + '): revealed ' + revCount + ' card' + (revCount !== 1 ? 's' : '') + (hit ? ' — hit ' + hit.name : '— no eligible card'));

      function shuffleBack(cards) {
        // Fisher-Yates shuffle then push to bottom
        for (var i = cards.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var tmp = cards[i];
          cards[i] = cards[j];
          cards[j] = tmp;
        }
        cards.forEach(function(c) {
          lib.push(c);
        });
        G._cascadePending = null;
        updateMyStats();
        syncPublicZones();
        syncPrivateState();
      }

      // Store pending state so closeModal can auto-shuffle back if modal is dismissed
      G._cascadePending = {
        lib: lib,
        revealed: revealed,
        hit: hit
      };

      if (hit) {
        var hitImg = hit.image ? '<img src="' + escH(hit.image) + '" style="width:130px;border-radius:9px;box-shadow:0 4px 18px rgba(0,0,0,.6);display:block;margin:0 auto .5rem">' : '';
        openModal(
          '<div class="modal-title">&#127744; Cascade Hit!</div>' +
          '<div style="font-size:.72rem;color:hsl(var(--muted-fg));text-align:center;margin-bottom:.5rem">' + revCount + ' card' + (revCount !== 1 ? 's' : '') + ' revealed &mdash; ' + revealed.length + ' put back</div>' +
          hitImg +
          '<div style="text-align:center;margin-bottom:.85rem"><div style="font-family:Cinzel,serif;font-size:1rem;color:var(--gold);font-weight:700">' + escH(hit.name) + '</div>' +
          '<div style="font-size:.72rem;color:hsl(var(--muted-fg));margin-top:.15rem">' + escH(hit.type || '') + (hit.cmc ? ' &bull; CMC ' + hit.cmc : '') + '</div></div>' +
          '<div class="flex flex-col gap-2">' +
          '<button class="btn btn-gold" id="cascade-cast-btn">Cast ' + escH(hit.name) + ' \u2192 Hand</button>' +
          '<button class="btn" id="cascade-skip-btn">Don\u2019t cast \u2014 shuffle all back</button>' +
          '</div>',
          '400px'
        );
        document.getElementById('cascade-cast-btn').addEventListener('click', function() {
          G.game.myState.hand.push(hit);
          shuffleBack(revealed);
          renderHandBar();
          toast('Cascade: ' + escH(hit.name) + ' \u2192 hand. ' + revealed.length + ' card' + (revealed.length !== 1 ? 's' : '') + ' shuffled back.');
          closeModal();
        });
        document.getElementById('cascade-skip-btn').addEventListener('click', function() {
          revealed.push(hit);
          shuffleBack(revealed);
          toast(revealed.length + ' card' + (revealed.length !== 1 ? 's' : '') + ' shuffled back to library.');
          closeModal();
        });
      } else {
        openModal(
          '<div class="modal-title">&#127744; Cascade &mdash; No Hit</div>' +
          '<div style="text-align:center;padding:.75rem 0"><div style="font-size:2rem;opacity:.35">&#127183;</div>' +
          '<div style="font-size:.85rem;margin-top:.5rem">No eligible card found.</div>' +
          '<div style="font-size:.72rem;color:hsl(var(--muted-fg));margin-top:.25rem">' + revealed.length + ' card' + (revealed.length !== 1 ? 's' : '') + ' will be shuffled back.</div></div>' +
          '<button class="btn btn-gold w-full" id="cascade-none-btn">Shuffle Back</button>',
          '360px'
        );
        document.getElementById('cascade-none-btn').addEventListener('click', function() {
          shuffleBack(revealed);
          toast(revealed.length + ' card' + (revealed.length !== 1 ? 's' : '') + ' shuffled back.');
          closeModal();
        });
      }
    }

    // ── Flip Coin / Roll Dice ─────────────────────────────────────
    function flipCoin() {
      var result = Math.random() < .5 ? 'Heads ⬤' : 'Tails ○';
      sendAction('flip_coin', {
        result: result
      });
      logAction('Flipped coin: ' + result);
      toast('Coin flip: ' + result, 3500);
    }

    function rollDice() {
      openModal('<div class="modal-title">&#127922; Roll Dice</div><div class="gmenu-grid" style="gap:.5rem">' + [4, 6, 8, 10, 12, 20, 100].map(function(s) {
        return '<button class="gmenu-btn dice-roll-btn" data-sides="' + s + '"><div class="gi">&#127922;</div>d' + s + '</button>';
      }).join('') + '</div>', '360px');
      document.querySelectorAll('.dice-roll-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var s = parseInt(btn.dataset.sides);
          var result = Math.floor(Math.random() * s) + 1;
          sendAction('roll_dice', {
            sides: s,
            result: result
          });
          logAction('Rolled d' + s + ': ' + result);
          toast('d' + s + ' → ' + result, 3500);
          closeModal();
        });
      });
    }

    // ── Game Menu ─────────────────────────────────────────────────
    function openGameMenu() {
      openModal(
        '<div class="modal-title">&#9881; Game Menu</div>' +
        '<div class="gmenu-section"><div class="gmenu-section-title">Actions</div><div class="gmenu-grid">' +
        '<div class="gmenu-btn" onclick="closeModal();openTokenModal()"><div class="gi">&#x1F4DC;</div>Token</div>' +
        '<div class="gmenu-btn" onclick="closeModal();openEmblemModal()"><div class="gi">&#127775;</div>Emblem</div>' +
        '<div class="gmenu-btn" onclick="closeModal();flipCoin()"><div class="gi">&#x1FA99;</div>Flip Coin</div>' +
        '<div class="gmenu-btn" onclick="closeModal();rollDice()"><div class="gi">&#127922;</div>Roll Dice</div>' +
        '<div class="gmenu-btn" onclick="closeModal();openAddCardToBattlefield()"><div class="gi">&#128270;</div>Add Card</div>' +
        '<div class="gmenu-btn" onclick="closeModal();drawCard()"><div class="gi">&#127183;</div>Draw</div>' +
        '<div class="gmenu-btn" onclick="closeModal();drawN()"><div class="gi">&#127183;</div>Draw N</div>' +
        '</div></div>' +
        '<div class="gmenu-section"><div class="gmenu-section-title">Library</div><div class="gmenu-grid">' +
        '<div class="gmenu-btn" onclick="closeModal();shuffleLibrary()"><div class="gi">&#128256;</div>Shuffle</div>' +
        '<div class="gmenu-btn" onclick="closeModal();scryX()"><div class="gi">&#128302;</div>Scry X</div>' +
        '<div class="gmenu-btn" onclick="closeModal();surveilX()"><div class="gi">&#128302;</div>Surveil</div>' +
        '<div class="gmenu-btn" onclick="closeModal();tutorModal()"><div class="gi">&#128269;</div>Tutor</div>' +
        '<div class="gmenu-btn" onclick="closeModal();millCards()"><div class="gi">&#128128;</div>Mill</div>' +
        '<div class="gmenu-btn" onclick="closeModal();toggleTopRevealed()"><div class="gi">&#128065;</div>' + (G.topRevealed ? 'Hide Top' : 'Reveal Top') + '</div>' +
        '<div class="gmenu-btn" onclick="closeModal();cascadeModal()"><div class="gi">&#127744;</div>Cascade</div>' +
        '</div></div>' +
        '<div class="gmenu-section"><div class="gmenu-section-title">Stats</div><div class="gmenu-grid">' +
        '<div class="gmenu-btn" onclick="closeModal();openLifeModal()"><div class="gi">&#10084;</div>Set Life</div>' +
        '<div class="gmenu-btn" onclick="closeModal();openCounterModal()"><div class="gi">&#128196;</div>Counters</div>' +
        (G.game.format === 'commander' ? '<div class="gmenu-btn" onclick="closeModal();openCommanderDamageModal()"><div class="gi">&#9876;</div>Cmdr Dmg</div>' : '') +
        '</div></div>' +
        '<div class="gmenu-section"><div class="gmenu-section-title">Game</div><div class="gmenu-grid">' +
        '<div class="gmenu-btn" onclick="closeModal();untapAll()"><div class="gi">&#8617;</div>Untap All</div>' +
        '<div class="gmenu-btn" onclick="closeModal();endMyTurn()"><div class="gi">&#9654;</div>End Turn</div>' +
        '<div class="gmenu-btn" onclick="closeModal();sendChatPrompt()"><div class="gi">&#128172;</div>Chat</div>' +
        '<div class="gmenu-btn" onclick="closeModal();openRulesScreen()"><div class="gi">&#128218;</div>Rules</div>' +
        '<div class="gmenu-btn" onclick="closeModal();showActionLog()"><div class="gi">&#128203;</div>Log</div>' +
        (G.game.isHost && G.game.roomCode !== 'LOCAL' ? '<div class="gmenu-btn btn-danger" onclick="closeModal();openKickModal()"><div class="gi">&#128078;</div>Kick</div>' : '') +
        (G.game.isHost && G.game.roomCode !== 'LOCAL' ? '<div class="gmenu-btn btn-danger" onclick="closeModal();closeRoom()"><div class="gi">&#128274;</div>Close Room</div>' : '') +
        (G.game.isHost ? '<div class="gmenu-btn btn-danger" onclick="closeModal();confirmResetGame()"><div class="gi">&#128260;</div>Reset</div>' : '') +
        '<div class="gmenu-btn btn-danger" onclick="closeModal();confirmLeaveGame()"><div class="gi">&#10005;</div>Leave</div>' +
        '</div></div>',
        '480px'
      );
    }

    function confirmResetGame() {
      if (!confirm('Reset the game for everyone? All players will reshuffle and redraw their opening hand.')) return;
      if (G.game.roomCode && G.game.roomCode !== 'LOCAL') {
        fbDB.ref('rooms/' + G.game.roomCode).update({
          turnCycle: 1,
          currentTurn: G.game.playerId
        });
        sendAction('reset_game', {});
      }
      G.game.turnCycle = 1;
      G.game.currentTurn = G.game.playerId;
      toast('Resetting game…', 2000);
      setTimeout(function() {
        initGame(G.game.roomCode, G.game.playerId, false);
      }, 300);
    }

    function showActionLog() {
      var html = G.actionLog.slice(0, 60).map(function(a) {
        return '<div class="action-log-item"><div class="action-log-time">' + a.time + '</div><div style="flex:1"><span style="color:var(--gold);font-weight:600">' + escH(a.player) + '</span>: ' + escH(a.text) + '</div></div>';
      }).join('');
      openModal('<div class="modal-title">&#128203; Action Log</div><div style="max-height:350px;overflow-y:auto">' + (html || '<div style="color:hsl(var(--muted-fg));font-size:.8rem;text-align:center;padding:1rem">No actions yet</div>') + '</div>', '480px');
    }

    function confirmLeaveGame() {
      if (confirm(G.game.isSpectator ? 'Stop watching this game?' : 'Leave the game?')) {
        if (G.game.isSpectator && G.game.roomCode && G.game.playerId) {
          fbDB.ref('rooms/' + G.game.roomCode + '/spectators/' + G.game.playerId).remove();
        }
        if (G.game.roomCode === 'LOCAL') {
          clearTimeout(_bsSaveTimer);
          saveBoardstateLocal();
        }
        G._noSync = false;
        G.game.isSpectator = false;
        G.listeners.forEach(function(f) {
          try {
            f();
          } catch (e) {}
        });
        G.listeners = [];
        var statsBar = document.getElementById('my-stats-bar');
        if (statsBar) statsBar.style.display = '';
        var handBar = document.getElementById('hand-bar');
        if (handBar) handBar.style.display = '';
        var endBtn = document.getElementById('end-turn-btn');
        if (endBtn) endBtn.style.display = '';
        var fab = document.getElementById('game-fab');
        if (fab) fab.style.display = '';
        showScreen('home');
        document.getElementById('game-fab').style.display = 'none';
      }
    }

    function closeRoom() {
      if (!G.game.isHost || !G.game.roomCode || G.game.roomCode === 'LOCAL') return;
      if (!confirm('Close this room? All players will be kicked and the room will be permanently deleted. This cannot be undone.')) return;
      var roomCode = G.game.roomCode;
      var myPid = G.game.playerId;
      var others = Object.keys(G.game.players || {}).filter(function(pid) {
        return pid !== myPid;
      });
      var updates = {
        open: false
      };
      others.forEach(function(pid) {
        updates['kicked/' + pid] = true;
      });
      fbDB.ref('rooms/' + roomCode).update(updates).then(function() {
        // Delete room after a brief delay so kicked players can read the kicked flag
        setTimeout(function() {
          fbDB.ref('rooms/' + roomCode).remove().catch(function() {});
        }, 4000);
      }).catch(function() {});
      G.listeners.forEach(function(f) {
        try {
          f();
        } catch (e) {}
      });
      G.listeners = [];
      G.game.roomCode = null;
      showScreen('home');
      document.getElementById('game-fab').style.display = 'none';
      toast('Room closed and all players kicked.', 3000);
    }

    function openKickModal() {
      var myPid = G.game.playerId;
      var others = Object.entries(G.game.players).filter(function(e) {
        return e[0] !== myPid;
      });
      if (!others.length) {
        toast('No other players in the room');
        return;
      }
      openModal(
        '<div class="modal-title">&#128078; Kick Player</div>' +
        '<div style="font-size:.78rem;color:hsl(var(--muted-fg));margin-bottom:.75rem">Select a player to remove from the game.</div>' +
        '<div class="flex flex-col gap-2">' +
        others.map(function(e) {
          var pid = e[0],
            p = e[1];
          return '<div style="display:flex;align-items:center;justify-content:space-between;padding:.5rem .75rem;background:hsl(var(--muted));border-radius:8px;gap:.75rem"><div style="font-weight:600;flex:1">' + escH(p.name || 'Player') + '</div><div style="font-size:.72rem;color:hsl(var(--muted-fg))">&#10084; ' + p.life + '</div><button class="btn btn-xs btn-danger kick-btn" data-pid="' + pid + '">Kick</button></div>';
        }).join('') +
        '</div>',
        '380px'
      );
      document.querySelectorAll('.kick-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var pid = btn.dataset.pid;
          var pname = (G.game.players[pid] || {}).name || 'Player';
          if (!confirm('Kick ' + pname + ' from the game?')) return;
          fbDB.ref('rooms/' + G.game.roomCode + '/kicked/' + pid).set(true);
          fbDB.ref('rooms/' + G.game.roomCode + '/players/' + pid).remove();
          if (G.game.currentTurn === pid) {
            var remaining = Object.keys(G.game.players).filter(function(p) {
              return p !== pid;
            });
            if (remaining.length) {
              var ni = Object.keys(G.game.players).indexOf(pid);
              var nextPid = remaining[ni % remaining.length] || remaining[0];
              fbDB.ref('rooms/' + G.game.roomCode).update({
                currentTurn: nextPid
              });
            }
          }
          delete G.game.players[pid];
          updatePlayersStrip();
          toast(pname + ' kicked.');
          closeModal();
        });
      });
    }

    // ── App Startup ───────────────────────────────────────────────
    async function appInit() {
      try {
        await openIDB();
        // One-time migration from localStorage to IndexedDB
        var lsDecks = localStorage.getItem('scrytable_decks');
        if (lsDecks) {
          try {
            var parsed = JSON.parse(lsDecks);
            if (Array.isArray(parsed) && parsed.length > 0) {
              await idbPutAll(STORE_DECKS, parsed);
              toast('Decks migrated to IndexedDB', 3000);
            }
            localStorage.removeItem('scrytable_decks');
          } catch (e) {
            console.warn('Migration failed', e);
          }
        }
        // Migrate any saved boardstates from localStorage to IndexedDB
        var bsKeys = Object.keys(localStorage).filter(function(k) {
          return k.startsWith('scrytable_bs_');
        });
        for (var i = 0; i < bsKeys.length; i++) {
          try {
            var bsRaw = localStorage.getItem(bsKeys[i]);
            if (bsRaw) {
              var bsData = JSON.parse(bsRaw);
              await idbPut(STORE_BOARDSTATE, bsData);
              localStorage.removeItem(bsKeys[i]);
            }
          } catch (e) {
            console.warn('Boardstate migration failed', e);
          }
        }
        await loadDecksAsync();
      } catch (e) {
        console.warn('IndexedDB init failed, falling back:', e);
      }
      updateLobbySelects();
      showScreen('home');
    }

    // ═══════════════════════════════════════════════════════════════════
    // ScryDraft — Commander Roulette · Booster Draft
    // separate IDB "ScryDraftDB"
    // ═══════════════════════════════════════════════════════════════════

    // Extend showScreen to handle draft sub-screens
    (function() {
      var _orig = showScreen;
      showScreen = function(name) {
        _orig(name);
        ['roulette', 'draft'].forEach(function(s) {
          var el = document.getElementById('screen-' + s);
          if (el) el.classList.add('hidden');
        });
        if (name === 'roulette' || name === 'draft') {
          var el = document.getElementById('screen-' + name);
          if (el) el.classList.remove('hidden');
          var fab = document.getElementById('game-fab');
          if (fab) fab.style.display = 'none';
        }
      };
    })();

    // ── ScryDraft State ─────────────────────────────────────────────────────────
    var S = {
      commanders: [],
      currentSession: {
        result: null,
        range: {
          min: 1,
          max: 500
        },

      },
      sets: [],
      setCards: [],
      draftBoosterType: 'play',
      pool: [],
      stats: {
        packs: 0,
        rares: 0,
        mythics: 0,
        foils: 0,
        value: 0
      },
    };

    var BOOSTER_INFO = {
      play: {
        label: 'Play Booster',
        cards: 14,
        desc: '14 cards: 6C / 1C/Spec / 3U / 1Wildcard (non-foil) / 1R/M (14.3% M) / 1Land / 1Foil wildcard. Always exactly 1 foil.'
      },
      draft: {
        label: 'Draft Booster',
        cards: 15,
        desc: '15 cards: 10C / 3U / 1R/M (12.5% M) / 1Land. ~25% chance one common replaced by a foil of any rarity. 0-1 foils.'
      },
      collector: {
        label: 'Collector Booster',
        cards: 15,
        desc: '15 cards: 1 foil R/M (33% M) / 3 non-foil R/M / 2 foil U / 2 non-foil U / 3 foil C / 3 non-foil C / 1 foil Land. ~7 foils.'
      },
    };

    // ── Utilities ────────────────────────────────────────────────────────────────
    function draftEsc(s) {
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function draftCopyText(text, btn) {
      var orig = btn.textContent;
      var done = function() {
        btn.textContent = 'Copied!';
        btn.disabled = true;
        setTimeout(function() {
          btn.textContent = orig;
          btn.disabled = false;
        }, 1800);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done).catch(function() {
          draftFallbackCopy(text, done);
        });
      } else {
        draftFallbackCopy(text, done);
      }
    }

    function draftFallbackCopy(text, done) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;left:-9999px';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        done();
      } catch (e) {}
      document.body.removeChild(ta);
    }

    function draftGetImg(card, size) {
      var sz = size === 'small' ? 'small' : 'normal';
      if (card.card_faces && card.card_faces[0] && card.card_faces[0].image_uris)
        return card.card_faces[0].image_uris[sz] || card.card_faces[0].image_uris.normal || '';
      if (card.image_uris) return card.image_uris[sz] || card.image_uris.normal || '';
      return '';
    }

    function openDraftCardModal(img) {
      openModal('<div style="text-align:center"><img src="' + img + '" style="max-width:100%;border-radius:9px;display:block;margin:0 auto" loading="lazy"/></div><button class="btn w-full" style="margin-top:.65rem" onclick="closeModal()">Close</button>', '340px');
    }

    function pickRandom(arr, n) {
      var pool = arr.slice(),
        out = [];
      while (out.length < n && pool.length) {
        var i = Math.floor(Math.random() * pool.length);
        out.push(pool.splice(i, 1)[0]);
      }
      return out;
    }

    function weightedRandom(weights) {
      var r = Math.random(),
        cum = 0;
      for (var k in weights) {
        cum += weights[k];
        if (r < cum) return k;
      }
      return Object.keys(weights)[0];
    }

    // ── ScryDraft IDB ("ScryDraftDB") ────────────────────────────────────────────
    var _sdIdb = null;

    function sdOpenDB() {
      return new Promise(function(resolve, reject) {
        if (_sdIdb) {
          resolve(_sdIdb);
          return;
        }
        var req = indexedDB.open('ScryDraftDB', 2);
        req.onupgradeneeded = function(e) {
          var db = e.target.result;
          if (!db.objectStoreNames.contains('commanders')) {
            var cs = db.createObjectStore('commanders', {
              keyPath: 'id'
            });
            cs.createIndex('rank', 'edhrec_rank', {
              unique: false
            });
          }
          if (!db.objectStoreNames.contains('sets')) db.createObjectStore('sets', {
            keyPath: 'code'
          });
          if (!db.objectStoreNames.contains('setCards')) {
            var sc = db.createObjectStore('setCards', {
              keyPath: 'id'
            });
            sc.createIndex('set', 'set', {
              unique: false
            });
          }
          if (!db.objectStoreNames.contains('sessions')) db.createObjectStore('sessions', {
            keyPath: 'id',
            autoIncrement: true
          });
          if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', {
            keyPath: 'key'
          });
        };
        req.onsuccess = function(e) {
          _sdIdb = e.target.result;
          resolve(_sdIdb);
        };
        req.onerror = function(e) {
          reject(e.target.error);
        };
      });
    }

    function dbGet(store, key) {
      return sdOpenDB().then(function(db) {
        return new Promise(function(res, rej) {
          var r = db.transaction(store, 'readonly').objectStore(store).get(key);
          r.onsuccess = function() {
            res(r.result);
          };
          r.onerror = function() {
            rej(r.error);
          };
        });
      });
    }

    function dbPut(store, val) {
      return sdOpenDB().then(function(db) {
        return new Promise(function(res, rej) {
          var r = db.transaction(store, 'readwrite').objectStore(store).put(val);
          r.onsuccess = function() {
            res();
          };
          r.onerror = function() {
            rej(r.error);
          };
        });
      });
    }

    function dbGetAll(store) {
      return sdOpenDB().then(function(db) {
        return new Promise(function(res, rej) {
          var r = db.transaction(store, 'readonly').objectStore(store).getAll();
          r.onsuccess = function() {
            res(r.result);
          };
          r.onerror = function() {
            rej(r.error);
          };
        });
      });
    }

    function dbGetByIndex(store, idx, val) {
      return sdOpenDB().then(function(db) {
        return new Promise(function(res, rej) {
          var r = db.transaction(store, 'readonly').objectStore(store).index(idx).getAll(val);
          r.onsuccess = function() {
            res(r.result);
          };
          r.onerror = function() {
            rej(r.error);
          };
        });
      });
    }

    function dbPutAll(store, items) {
      return sdOpenDB().then(function(db) {
        return new Promise(function(res, rej) {
          var tx = db.transaction(store, 'readwrite'),
            st = tx.objectStore(store);
          var pending = items.length;
          if (!pending) {
            res();
            return;
          }
          items.forEach(function(item) {
            var r = st.put(item);
            r.onsuccess = function() {
              if (--pending === 0) res();
            };
            r.onerror = function() {
              rej(r.error);
            };
          });
        });
      });
    }

    // ── Scryfall rate-limited queue ──────────────────────────────────────────────
    var _sdQueue = [],
      _sdRunning = false;

    function dsfetch(url) {
      return new Promise(function(resolve) {
        _sdQueue.push({
          url: url,
          resolve: resolve
        });
        if (!_sdRunning) _sdDrain();
      });
    }

    function _sdDrain() {
      if (!_sdQueue.length) {
        _sdRunning = false;
        return;
      }
      _sdRunning = true;
      var item = _sdQueue.shift();
      fetch(item.url).then(function(r) {
        item.resolve(r);
      }).catch(function() {
        item.resolve(null);
      }).finally(function() {
        setTimeout(_sdDrain, 80);
      });
    }

    // ═══════════════════════════════════════════════
    // COMMANDER ROULETTE
    // ═══════════════════════════════════════════════
    var COLOR_HEX = {
      W: '#f5f0d8',
      U: '#3b8fc8',
      B: '#6060a0',
      R: '#d04030',
      G: '#40a040',
      C: '#aaa'
    };

    async function loadCommanders() {
      try {
        var meta = await dbGet('meta', 'cmdr_ts');
        if (meta && Date.now() - meta.value < 86400000) {
          S.commanders = await dbGetAll('commanders');
          if (S.commanders.length) {
            initRankChips();
            return;
          }
        }
        var allCmdr = [],
          page = 1;
        while (true) {
          var r = await dsfetch('https://api.scryfall.com/cards/search?q=is:commander+game:paper+legal:commander&order=edhrec&unique=cards&page=' + page);
          if (!r || !r.ok) break;
          var d = await r.json();
          allCmdr.push.apply(allCmdr, d.data);
          if (!d.has_more) break;
          page++;
        }
        if (allCmdr.length) {
          S.commanders = allCmdr;
          await dbPutAll('commanders', allCmdr);
          await dbPut('meta', {
            key: 'cmdr_ts',
            value: Date.now()
          });
        }
        initRankChips();
      } catch (e) {
        toast('Failed to load commanders.');
      }
    }

    function getCommandersInRange(min, max) {
      return S.commanders.filter(function(c) {
        return c.edhrec_rank != null && c.edhrec_rank >= min && c.edhrec_rank <= max;
      });
    }

    function initRankChips() {
      var ranks = S.commanders.map(function(c) {
        return c.edhrec_rank;
      }).filter(function(r) {
        return r != null;
      }).sort(function(a, b) {
        return a - b;
      });
      var wrap = document.getElementById('range-chips');
      if (!wrap) return;
      if (!ranks.length) {
        wrap.innerHTML = '<button class="chip active" disabled>No rank data</button>';
        return;
      }
      var lo = ranks[0],
        hi = ranks[ranks.length - 1];

      function q(p) {
        return ranks[Math.min(ranks.length - 1, Math.floor(p * (ranks.length - 1)))];
      }
      var q1 = q(0.25),
        q2 = q(0.5),
        q3 = q(0.75);
      wrap.innerHTML =
        '<button class="chip active" data-min="' + lo + '" data-max="' + q1 + '">Top 25%</button>' +
        '<button class="chip" data-min="' + lo + '" data-max="' + q2 + '">Top 50%</button>' +
        '<button class="chip" data-min="' + q2 + '" data-max="' + q3 + '">50-75%</button>' +
        '<button class="chip" data-min="' + q3 + '" data-max="' + hi + '">75-100%</button>';
      wireRangeChips();
      var minEl = document.getElementById('rl-min'),
        maxEl = document.getElementById('rl-max');
      if (minEl) {
        minEl.value = lo;
        minEl.min = lo;
        minEl.max = hi;
      }
      if (maxEl) {
        maxEl.value = q1;
        maxEl.min = lo;
        maxEl.max = hi;
      }
      S.currentSession.range = {
        min: lo,
        max: q1
      };
    }

    function wireRangeChips() {
      document.querySelectorAll('#range-chips .chip').forEach(function(btn) {
        btn.onclick = function() {
          document.querySelectorAll('#range-chips .chip').forEach(function(b) {
            b.classList.remove('active');
          });
          btn.classList.add('active');
          document.getElementById('rl-min').value = btn.dataset.min;
          document.getElementById('rl-max').value = btn.dataset.max;
        };
      });
    }

    async function rollCommanders() {
      var min = parseInt(document.getElementById('rl-min').value) || 1;
      var max = parseInt(document.getElementById('rl-max').value) || 100;
      S.currentSession.range = {
        min: min,
        max: max
      };
      var pool = getCommandersInRange(min, max);
      if (!pool.length) {
        if (!S.commanders.length) {
          toast('Still loading commanders — please wait.');
          return;
        }
        toast('No commanders in rank range ' + min + '-' + max + '. Try a wider range.');
        return;
      }
      var picked = pickRandom(pool, 1)[0];
      if (!picked) return;
      S.currentSession.result = {
        commander: picked.name,
        card: picked
      };
      renderResult();
      try {
        await dbPut('sessions', {
          id: Date.now(),
          commander: picked.name,
          ts: Date.now()
        });
        await loadHistory();
      } catch (e) {}
    }

    function renderResult() {
      var r = S.currentSession.result;
      if (!r) return;
      var card = r.card,
        img = card ? draftGetImg(card, 'normal') : '';
      var colors = (card && card.color_identity) || [];
      var rank = card ? (card.edhrec_rank || '') : '';
      var grid = document.getElementById('rl-grid');
      if (!grid) return;
      var empty = document.getElementById('rl-empty');
      if (empty) empty.style.display = 'none';
      grid.innerHTML = '';
      var wrap = document.createElement('div');
      wrap.className = 'assign-card';
      wrap.innerHTML =
        '<div class="assign-img" style="cursor:' + (img ? 'pointer' : 'default') + '">' + (img ? '<img src="' + img + '" alt="' + draftEsc(r.commander) + '" loading="lazy">' : '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:hsl(var(--muted-fg));font-size:.7rem">No image</div>') + '</div>' +
        '<div class="assign-info">' +
        '<div class="assign-name">' + draftEsc(r.commander) + '</div>' +
        '<div class="assign-meta">' +
        '<div class="color-pips">' + colors.map(function(c) {
          return '<div class="color-pip" style="background:' + (COLOR_HEX[c] || '#888') + '" title="' + c + '"></div>';
        }).join('') + '</div>' +
        (rank ? '<span class="rank-badge">#' + rank + '</span>' : '') +
        '</div>' +
        '</div>' +
        '<div class="assign-actions"><button class="btn btn-xs reroll-one-btn">&#9654; Reroll</button></div>';
      if (img) wrap.querySelector('.assign-img').onclick = function() {
        openDraftCardModal(img);
      };
      wrap.querySelector('.reroll-one-btn').onclick = rollCommanders;
      grid.appendChild(wrap);
    }

    async function loadHistory() {
      try {
        var sessions = await dbGetAll('sessions');
        var el = document.getElementById('rl-history');
        if (!el) return;
        if (!sessions || !sessions.length) {
          el.textContent = 'No sessions yet.';
          return;
        }
        var sorted = sessions.slice().sort(function(a, b) {
          return b.ts - a.ts;
        }).slice(0, 8);
        el.innerHTML = sorted.map(function(s) {
          var date = new Date(s.ts).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          // Support new single-commander format and old multi-player format
          var content = s.commander ?
            draftEsc(s.commander) :
            (s.assignments || []).map(function(a) {
              return draftEsc(a.player) + ': ' + draftEsc(a.commander);
            }).join('<br>');
          return '<div class="hist-item"><div class="hist-date">' + date + '</div>' + content + '</div>';
        }).join('');
      } catch (e) {}
    }

    // ═══════════════════════════════════════════════
    // BOOSTER DRAFT SIMULATOR
    // ═══════════════════════════════════════════════
    function updateOpenBtn() {
      var btn = document.getElementById('draft-open');
      if (!btn) return;
      btn.textContent = S.setCards.length ? 'Open ' + BOOSTER_INFO[S.draftBoosterType].label : 'Open Pack';
    }

    async function loadDraftSets() {
      try {
        var meta = await dbGet('meta', 'sets_ts');
        if (meta && Date.now() - meta.value < 86400000) {
          S.sets = await dbGetAll('sets');
        } else {
          var r = await dsfetch('https://api.scryfall.com/sets');
          if (r && r.ok) {
            var d = await r.json();
            var VALID = new Set(['core', 'expansion', 'masters', 'draft_innovation', 'funny']);
            S.sets = d.data.filter(function(s) {
                return VALID.has(s.set_type);
              })
              .sort(function(a, b) {
                return new Date(b.released_at) - new Date(a.released_at);
              });
            await dbPutAll('sets', S.sets);
            await dbPut('meta', {
              key: 'sets_ts',
              value: Date.now()
            });
          }
        }
        var sel = document.getElementById('draft-set');
        if (!sel) return;
        sel.innerHTML = '<option value="">-- Choose a Set --</option>' +
          S.sets.map(function(s) {
            return '<option value="' + s.code + '">' + draftEsc(s.name) + ' (' + s.code.toUpperCase() + ')</option>';
          }).join('');
      } catch (e) {
        toast('Failed to load sets.');
      }
    }

    async function loadSetCards(code) {
      var btn = document.getElementById('draft-open');
      if (!btn) return;
      btn.disabled = true;
      btn.innerHTML = '<span class="spin"></span> Loading cards...';
      var meta = await dbGet('meta', 'set_' + code);
      if (meta && Date.now() - meta.value < 86400000) {
        var cached = await dbGetByIndex('setCards', 'set', code);
        if (cached.length) {
          S.setCards = cached;
          btn.disabled = false;
          updateOpenBtn();
          return;
        }
      }
      var url = 'https://api.scryfall.com/cards/search?q=e:' + code + '+is:booster&unique=prints&order=set';
      var all = [];
      while (url) {
        var r = await dsfetch(url);
        if (!r || !r.ok) break;
        var d = await r.json();
        all.push.apply(all, d.data.map(function(c) {
          return Object.assign({}, c, {
            set: code
          });
        }));
        btn.innerHTML = '<span class="spin"></span> ' + all.length + ' cards...';
        url = d.has_more ? d.next_page : null;
      }
      S.setCards = all;
      if (all.length) {
        await dbPutAll('setCards', all);
        await dbPut('meta', {
          key: 'set_' + code,
          value: Date.now()
        });
      }
      btn.disabled = false;
      updateOpenBtn();
    }

    function categorize(pool) {
      return {
        common: pool.filter(function(c) {
          return c.rarity === 'common';
        }),
        uncommon: pool.filter(function(c) {
          return c.rarity === 'uncommon';
        }),
        rare: pool.filter(function(c) {
          return c.rarity === 'rare';
        }),
        mythic: pool.filter(function(c) {
          return c.rarity === 'mythic';
        }),
        basic: pool.filter(function(c) {
          return c.type_line && c.type_line.includes('Basic Land');
        }),
      };
    }

    function fallbackPool(a, b) {
      return a.length ? a : b;
    }

    function genPlayBooster(pool) {
      var r = categorize(pool),
        excl = new Set(),
        pack = [];
      pickRandom(fallbackPool(r.common, pool), 6).forEach(function(c) {
        if (!excl.has(c.id)) {
          pack.push(Object.assign({}, c, {
            foil: false
          }));
          excl.add(c.id);
        }
      });
      if (Math.random() < .015 && r.mythic.length) {
        var sg = pickRandom(Math.random() < .25 ? r.mythic : r.rare, 1)[0];
        if (sg && !excl.has(sg.id)) {
          pack.push(Object.assign({}, sg, {
            foil: false
          }));
          excl.add(sg.id);
        }
      } else {
        var c7 = pickRandom(fallbackPool(r.common, pool), 1)[0];
        if (c7 && !excl.has(c7.id)) {
          pack.push(Object.assign({}, c7, {
            foil: false
          }));
          excl.add(c7.id);
        }
      }
      pickRandom(fallbackPool(r.uncommon, r.common), 3).forEach(function(c) {
        if (!excl.has(c.id)) {
          pack.push(Object.assign({}, c, {
            foil: false
          }));
          excl.add(c.id);
        }
      });
      var wRar = weightedRandom({
        common: .49,
        uncommon: .245,
        rare: .20,
        mythic: .065
      });
      var wCard = pickRandom(fallbackPool(r[wRar] || r.common, r.common), 1)[0];
      if (wCard && !excl.has(wCard.id)) {
        pack.push(Object.assign({}, wCard, {
          foil: false
        }));
        excl.add(wCard.id);
      }
      var isM = Math.random() < .143 && r.mythic.length;
      var rm = pickRandom(isM ? r.mythic : fallbackPool(r.rare, r.uncommon), 1)[0];
      if (rm) pack.push(Object.assign({}, rm, {
        foil: false
      }));
      var land = pickRandom(fallbackPool(r.basic, r.common), 1)[0];
      if (land) pack.push(Object.assign({}, land, {
        foil: false
      }));
      var fRar = weightedRandom({
        common: .59,
        uncommon: .30,
        rare: .07,
        mythic: .015
      });
      var fc = pickRandom(fallbackPool(r[fRar] || r.common, r.common), 1)[0];
      if (fc) pack.push(Object.assign({}, fc, {
        foil: true
      }));
      return pack;
    }

    function genDraftBooster(pool) {
      var r = categorize(pool),
        excl = new Set(),
        pack = [];
      pickRandom(fallbackPool(r.common, pool), 10).forEach(function(c) {
        if (!excl.has(c.id)) {
          pack.push(Object.assign({}, c, {
            foil: false
          }));
          excl.add(c.id);
        }
      });
      pickRandom(fallbackPool(r.uncommon, r.common), 3).forEach(function(c) {
        if (!excl.has(c.id)) {
          pack.push(Object.assign({}, c, {
            foil: false
          }));
          excl.add(c.id);
        }
      });
      var isM = Math.random() < .125 && r.mythic.length;
      var rm = pickRandom(isM ? r.mythic : fallbackPool(r.rare, r.uncommon), 1)[0];
      if (rm) pack.push(Object.assign({}, rm, {
        foil: false
      }));
      var land = pickRandom(fallbackPool(r.basic, r.common), 1)[0];
      if (land) pack.push(Object.assign({}, land, {
        foil: false
      }));
      if (Math.random() < .25) {
        var fIdx = pack.findIndex(function(c) {
          return c.rarity === 'common' && !c.foil;
        });
        if (fIdx !== -1) {
          var fRar = weightedRandom({
            common: .60,
            uncommon: .30,
            rare: .08,
            mythic: .02
          });
          var foilCard = pickRandom(fallbackPool(r[fRar] || r.common, r.common), 1)[0];
          if (foilCard) pack[fIdx] = Object.assign({}, foilCard, {
            foil: true
          });
        }
      }
      return pack;
    }

    function genCollectorBooster(pool) {
      var r = categorize(pool),
        pack = [];

      function rmSlot(rate, foil) {
        var isM = Math.random() < rate && r.mythic.length;
        var c = pickRandom(isM ? r.mythic : fallbackPool(r.rare, r.uncommon), 1)[0];
        return c ? Object.assign({}, c, {
          foil: foil
        }) : null;
      }
      [
        [.33, true],
        [.25, false],
        [.20, false],
        [.143, false]
      ].forEach(function(args) {
        var c = rmSlot(args[0], args[1]);
        if (c) pack.push(c);
      });
      pickRandom(fallbackPool(r.uncommon, r.common), 2).forEach(function(c) {
        pack.push(Object.assign({}, c, {
          foil: true
        }));
      });
      pickRandom(fallbackPool(r.uncommon, r.common), 2).forEach(function(c) {
        pack.push(Object.assign({}, c, {
          foil: false
        }));
      });
      pickRandom(fallbackPool(r.common, pool), 3).forEach(function(c) {
        pack.push(Object.assign({}, c, {
          foil: true
        }));
      });
      pickRandom(fallbackPool(r.common, pool), 3).forEach(function(c) {
        pack.push(Object.assign({}, c, {
          foil: false
        }));
      });
      var fc = pickRandom(fallbackPool(r.basic, r.common), 1)[0];
      if (fc) pack.push(Object.assign({}, fc, {
        foil: true
      }));
      return pack;
    }

    function generateBooster() {
      if (S.draftBoosterType === 'draft') return genDraftBooster(S.setCards);
      if (S.draftBoosterType === 'collector') return genCollectorBooster(S.setCards);
      return genPlayBooster(S.setCards);
    }

    function renderStats() {
      var st = S.stats;
      var ep = document.getElementById('ds-packs');
      if (ep) ep.textContent = st.packs;
      var er = document.getElementById('ds-rares');
      if (er) er.textContent = st.rares;
      var em = document.getElementById('ds-mythics');
      if (em) em.textContent = st.mythics;
      var ef = document.getElementById('ds-foils');
      if (ef) ef.textContent = st.foils;
      var ev = document.getElementById('ds-value');
      if (ev) ev.textContent = '$' + st.value.toFixed(2);
      var total = st.rares + st.mythics,
        rate = total ? (st.mythics / total * 100).toFixed(1) : 0;
      var rt = document.getElementById('ds-rate');
      if (rt) rt.textContent = rate + '%';
      var sb = document.getElementById('draft-stats-box');
      if (sb) sb.classList.remove('hidden');
    }

    function renderPack(pack) {
      var title = (BOOSTER_INFO[S.draftBoosterType] || {}).label || 'Booster';
      var pt = document.getElementById('pack-title');
      if (pt) pt.textContent = title;
      var pa = document.getElementById('pack-area');
      if (pa) pa.classList.remove('hidden');
      var grid = document.getElementById('pack-grid');
      if (!grid) return;
      grid.innerHTML = '';
      pack.forEach(function(card, i) {
        var img = draftGetImg(card, 'normal');
        var el = document.createElement('div');
        el.className = 'pack-card';
        el.innerHTML = '<div class="card3d"><div class="c-inner" id="pc-' + i + '"><div class="c-front"></div><div class="c-back"><img src="' + img + '" alt="' + draftEsc(card.name) + '" loading="lazy">' + (card.foil ? '<div class="foil-overlay"></div>' : '') + '</div></div></div>';
        el.addEventListener('click', (function(cidx, cimg) {
          return function() {
            var inner = document.getElementById('pc-' + cidx);
            if (!inner) return;
            if (inner.classList.contains('flipped')) openDraftCardModal(cimg);
            else inner.classList.add('flipped');
          };
        })(i, img));
        grid.appendChild(el);
      });
    }

    function renderPool() {
      var grid = document.getElementById('pool-grid');
      var count = document.getElementById('pool-count');
      var poa = document.getElementById('pool-area');
      if (!S.pool.length) {
        if (poa) poa.classList.add('hidden');
        return;
      }
      if (poa) poa.classList.remove('hidden');
      if (count) count.textContent = '(' + S.pool.length + ')';
      if (!grid) return;
      grid.innerHTML = '';
      var sorted = S.pool.slice().sort(function(a, b) {
        var r = {
          mythic: 4,
          rare: 3,
          uncommon: 2,
          common: 1
        };
        return (r[b.rarity] || 0) - (r[a.rarity] || 0);
      });
      sorted.forEach(function(c) {
        var img = draftGetImg(c, 'small');
        var el = document.createElement('div');
        el.className = 'pool-card' + (c.foil ? ' foil' : '');
        el.innerHTML = '<img src="' + img + '" alt="' + draftEsc(c.name) + '" loading="lazy">' + (c.foil ? '<div class="foil-overlay" style="border-radius:4px"></div>' : '');
        el.onclick = function() {
          openDraftCardModal(draftGetImg(c, 'normal'));
        };
        grid.appendChild(el);
      });
    }

    function importDraftPoolToDeck() {
      if (!S.pool.length) {
        toast('Open some packs first.');
        return;
      }
      var grouped = {};
      S.pool.forEach(function(c) {
        var key = c.name;
        if (!grouped[key]) {
          var hasDFC = !!(c.card_faces && c.card_faces.length > 1 && c.card_faces[0].image_uris);
          grouped[key] = {
            name: c.name,
            qty: 0,
            image: draftGetImg(c, 'normal') || null,
            backImage: (hasDFC && c.card_faces[1].image_uris) ? (c.card_faces[1].image_uris.normal || c.card_faces[1].image_uris.small || null) : null,
            isDFC: hasDFC,
            type: c.type_line || (c.card_faces && c.card_faces[0] && c.card_faces[0].type_line) || '',
            cmc: c.cmc || 0,
            colors: c.color_identity || [],
            inCommandZone: false,
            prices: c.prices || null,
          };
        }
        grouped[key].qty++;
      });
      var cards = Object.keys(grouped).map(function(k) {
        return grouped[k];
      });
      cards.forEach(function(c) {
        c.category = getAutoCategory(c);
      });
      var deckName = 'Draft Pool — ' + new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      var deck = {
        id: Date.now().toString(),
        name: deckName,
        format: 'casual',
        cards: cards,
        categories: [...DEFAULT_DECK_CATS],
        commander: null
      };
      G.decks.push(deck);
      saveDecks();
      updateLobbySelects();
      toast('"' + deckName + '" created with ' + S.pool.length + ' cards — find it in My Decks');
    }

    // ═══════════════════════════════════════════════
    // EVENT WIRING
    // ═══════════════════════════════════════════════
    document.addEventListener('DOMContentLoaded', function() {
      // Range chips
      document.querySelectorAll('#range-chips .chip').forEach(function(btn) {
        btn.onclick = function() {
          document.querySelectorAll('#range-chips .chip').forEach(function(b) {
            b.classList.remove('active');
          });
          btn.classList.add('active');
          document.getElementById('rl-min').value = btn.dataset.min;
          document.getElementById('rl-max').value = btn.dataset.max;
        };
      });

      var rlRoll = document.getElementById('rl-roll');
      if (rlRoll) rlRoll.onclick = rollCommanders;

      document.querySelectorAll('#btype-group .tgl').forEach(function(btn) {
        btn.onclick = function() {
          document.querySelectorAll('#btype-group .tgl').forEach(function(b) {
            b.classList.remove('active');
          });
          btn.classList.add('active');
          S.draftBoosterType = btn.dataset.bt;
          var desc = document.getElementById('btype-desc');
          if (desc) desc.textContent = BOOSTER_INFO[btn.dataset.bt].desc;
          updateOpenBtn();
        };
      });

      var draftSet = document.getElementById('draft-set');
      if (draftSet) draftSet.onchange = async function(e) {
        var code = e.target.value;
        if (!code) {
          S.setCards = [];
          var ob = document.getElementById('draft-open');
          if (ob) ob.disabled = true;
          return;
        }
        await loadSetCards(code);
      };

      var draftOpen = document.getElementById('draft-open');
      if (draftOpen) draftOpen.onclick = function() {
        if (!S.setCards.length) return;
        var pack = generateBooster();
        S.stats.packs++;
        pack.forEach(function(c) {
          if (c.rarity === 'rare') S.stats.rares++;
          if (c.rarity === 'mythic') S.stats.mythics++;
          if (c.foil) S.stats.foils++;
          var price = c.foil ? (parseFloat((c.prices && c.prices.usd_foil) || 0) || parseFloat((c.prices && c.prices.usd) || 0)) : (parseFloat((c.prices && c.prices.usd) || 0));
          S.stats.value += price;
        });
        S.pool.push.apply(S.pool, pack);
        renderStats();
        renderPack(pack);
        renderPool();
      };

      var packRevealAll = document.getElementById('pack-reveal-all');
      if (packRevealAll) packRevealAll.onclick = function() {
        document.querySelectorAll('[id^="pc-"]').forEach(function(el) {
          el.classList.add('flipped');
        });
      };

      var draftResetStats = document.getElementById('draft-reset-stats');
      if (draftResetStats) draftResetStats.onclick = function() {
        S.stats = {
          packs: 0,
          rares: 0,
          mythics: 0,
          foils: 0,
          value: 0
        };
        S.pool = [];
        ['draft-stats-box', 'pack-area', 'pool-area'].forEach(function(id) {
          var el = document.getElementById(id);
          if (el) el.classList.add('hidden');
        });
      };

      var draftExport = document.getElementById('draft-export');
      if (draftExport) draftExport.onclick = function() {
        if (!S.pool.length) return;
        var grp = {};
        S.pool.forEach(function(c) {
          var k = c.name + '|' + (c.set || '').toUpperCase() + '|' + (c.collector_number || '');
          grp[k] = (grp[k] || 0) + 1;
        });
        var lines = ['Deck'];
        Object.entries(grp).forEach(function(e) {
          var p = e[0].split('|');
          lines.push(e[1] + ' ' + p[0] + ' (' + p[1] + ') ' + p[2]);
        });
        lines.push('', 'Sideboard');
        var txt = lines.join('\n');
        var blob = new Blob([txt], {
          type: 'text/plain'
        });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'ScryDraft-' + new Date().toISOString().split('T')[0] + '.txt';
        a.click();
        URL.revokeObjectURL(a.href);
        draftCopyText(txt, draftExport);
      };

      var draftImportDeck = document.getElementById('draft-import-deck');
      if (draftImportDeck) draftImportDeck.onclick = importDraftPoolToDeck;

      // Boot ScryDraft
      loadCommanders();
      loadDraftSets();
      loadHistory();
    });

    appInit();

    (() => {
      const ENTRY = 'ScryTable v1.8',
        KEY = 'Ion-o-koji Watermark';
      const logs = (localStorage.getItem(KEY) || "").split('\n').map(line => line.replace(/^- /, '').trim()).filter(line => line && line !== ENTRY);
      logs.push(ENTRY);
      localStorage.setItem(KEY, logs.map(item => `- ${item}`).join('\n'));
    })();

  
