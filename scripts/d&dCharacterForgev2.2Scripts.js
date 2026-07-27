
    // ============================================================
    // DATA MODEL
    // ============================================================

    const PORTRAIT_EMOJIS = [
      '🧙', '🧝', '🧟', '🧛', '🧜', '🧚',
      '⚔️', '🛡️', '🏹', '🗡️', '🔮', '📜',
      '🦸', '🦹', '🧞', '🧌', '🐉', '🦄',
      '👹', '💀', '🧿', '🌙', '⚡', '🔥',
      '🧑‍🎤', '🧑‍🔬', '🧑‍⚕️', '🧑‍🍳', '🧑‍🌾', '🧑‍🏭',
      '🦊', '🐺', '🐻', '🦁', '🐦', '🦅'
    ];

    const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    const ABILITY_NAMES = {
      str: 'STR',
      dex: 'DEX',
      con: 'CON',
      int: 'INT',
      wis: 'WIS',
      cha: 'CHA'
    };
    const ABILITY_FULL = {
      str: 'Strength',
      dex: 'Dexterity',
      con: 'Constitution',
      int: 'Intelligence',
      wis: 'Wisdom',
      cha: 'Charisma'
    };

    const SKILLS_DATA = [{
        name: 'Acrobatics',
        ability: 'dex',
        key: 'acrobatics'
      },
      {
        name: 'Animal Handling',
        ability: 'wis',
        key: 'animalHandling'
      },
      {
        name: 'Arcana',
        ability: 'int',
        key: 'arcana'
      },
      {
        name: 'Athletics',
        ability: 'str',
        key: 'athletics'
      },
      {
        name: 'Deception',
        ability: 'cha',
        key: 'deception'
      },
      {
        name: 'History',
        ability: 'int',
        key: 'history'
      },
      {
        name: 'Insight',
        ability: 'wis',
        key: 'insight'
      },
      {
        name: 'Intimidation',
        ability: 'cha',
        key: 'intimidation'
      },
      {
        name: 'Investigation',
        ability: 'int',
        key: 'investigation'
      },
      {
        name: 'Medicine',
        ability: 'wis',
        key: 'medicine'
      },
      {
        name: 'Nature',
        ability: 'int',
        key: 'nature'
      },
      {
        name: 'Perception',
        ability: 'wis',
        key: 'perception'
      },
      {
        name: 'Performance',
        ability: 'cha',
        key: 'performance'
      },
      {
        name: 'Persuasion',
        ability: 'cha',
        key: 'persuasion'
      },
      {
        name: 'Religion',
        ability: 'int',
        key: 'religion'
      },
      {
        name: 'Sleight of Hand',
        ability: 'dex',
        key: 'sleightOfHand'
      },
      {
        name: 'Stealth',
        ability: 'dex',
        key: 'stealth'
      },
      {
        name: 'Survival',
        ability: 'wis',
        key: 'survival'
      }
    ];

    const CONDITIONS = [
      'Blinded', 'Charmed', 'Deafened', 'Exhaustion',
      'Frightened', 'Grappled', 'Incapacitated', 'Invisible',
      'Paralyzed', 'Petrified', 'Poisoned', 'Prone',
      'Restrained', 'Stunned', 'Unconscious'
    ];

    const EXHAUSTION_EFFECTS = [
      'No exhaustion',
      'Disadvantage on ability checks',
      'Speed halved',
      'Disadvantage on attacks and saves',
      'Hit point max halved',
      'Speed reduced to 0',
      'Death'
    ];

    const SPELL_SLOTS_BY_LEVEL = {
      1: [2, 0, 0, 0, 0, 0, 0, 0, 0],
      2: [3, 0, 0, 0, 0, 0, 0, 0, 0],
      3: [4, 2, 0, 0, 0, 0, 0, 0, 0],
      4: [4, 3, 0, 0, 0, 0, 0, 0, 0],
      5: [4, 3, 2, 0, 0, 0, 0, 0, 0],
      6: [4, 3, 3, 0, 0, 0, 0, 0, 0],
      7: [4, 3, 3, 1, 0, 0, 0, 0, 0],
      8: [4, 3, 3, 2, 0, 0, 0, 0, 0],
      9: [4, 3, 3, 3, 1, 0, 0, 0, 0],
      10: [4, 3, 3, 3, 2, 0, 0, 0, 0],
      11: [4, 3, 3, 3, 2, 1, 0, 0, 0],
      12: [4, 3, 3, 3, 2, 1, 0, 0, 0],
      13: [4, 3, 3, 3, 2, 1, 1, 0, 0],
      14: [4, 3, 3, 3, 2, 1, 1, 0, 0],
      15: [4, 3, 3, 3, 2, 1, 1, 1, 0],
      16: [4, 3, 3, 3, 2, 1, 1, 1, 0],
      17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
      18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
      19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
      20: [4, 3, 3, 3, 3, 2, 2, 1, 1]
    };

    const PROF_BONUS_BY_LEVEL = {
      1: 2,
      2: 2,
      3: 2,
      4: 2,
      5: 3,
      6: 3,
      7: 3,
      8: 3,
      9: 4,
      10: 4,
      11: 4,
      12: 4,
      13: 5,
      14: 5,
      15: 5,
      16: 5,
      17: 6,
      18: 6,
      19: 6,
      20: 6
    };

    function defaultCharacter(id) {
      return {
        id,
        name: 'New Character',
        race: '',
        class: '',
        subclass: '',
        background: '',
        alignment: '',
        level: 1,
        xp: 0,
        portrait: '🧙',
        speed: 30,
        darkvision: 0,
        languages: 'Common',
        inspiration: false,
        abilities: {
          str: 10,
          dex: 10,
          con: 10,
          int: 10,
          wis: 10,
          cha: 10
        },
        hpCurrent: 10,
        hpMax: 10,
        hpTemp: 0,
        deathSavesSuccess: 0,
        deathSavesFail: 0,
        ac: 10,
        hitDie: 'd8',
        hitDiceUsed: 0,
        spellcastingAbility: '',
        conditions: [],
        exhaustion: 0,
        skillProfs: {},
        saveProfs: {},
        spellSlots: Array(9).fill(null).map(() => ({
          max: 0,
          used: 0
        })),
        spellSlotsCustom: false,
        spells: [],
        attacks: [],
        inventory: [],
        features: [],
        currency: {
          cp: 0,
          sp: 0,
          ep: 0,
          gp: 0,
          pp: 0
        },
        personality: '',
        backstory: '',
        allies: '',
        extraNotes: ''
      };
    }

    // ============================================================
    // STATE
    // ============================================================

    let state = {
      characters: [],
      activeCharId: null,
      editingSpellIdx: null,
      editingAttackIdx: null,
      editingItemIdx: null,
      editingFeatureIdx: null,
      selectedDie: 'd20',
      diceHistory: []
    };

    function saveState() {
      try {
        localStorage.setItem('dnd_forge_v2.2', JSON.stringify(state));
      } catch (e) {}
    }

    function loadState() {
      try {
        const raw = localStorage.getItem('dnd_forge_v2.2');
        if (raw) {
          const loaded = JSON.parse(raw);
          state.diceHistory = loaded.diceHistory || [];
          state.selectedDie = loaded.selectedDie || 'd20';
          state.activeCharId = loaded.activeCharId || null;
          state.characters = (loaded.characters || []).map(c => ({
            ...defaultCharacter(c.id),
            ...c
          }));
        }
      } catch (e) {
        console.warn('Could not load state', e);
      }
    }

    function getChar() {
      return state.characters.find(c => c.id === state.activeCharId);
    }

    // ============================================================
    // COMPUTED HELPERS
    // ============================================================

    function getMod(score) {
      return Math.floor((score - 10) / 2);
    }

    function fmtMod(m) {
      return m >= 0 ? '+' + m : String(m);
    }

    function getProfBonus(level) {
      return PROF_BONUS_BY_LEVEL[Math.min(20, Math.max(1, level))] || 2;
    }

    function getSkillBonus(char, skillKey) {
      const skill = SKILLS_DATA.find(s => s.key === skillKey);
      if (!skill) return 0;
      const abilMod = getMod(char.abilities[skill.ability]);
      const prof = char.skillProfs[skillKey] || 'none';
      const pb = getProfBonus(char.level);
      if (prof === 'expert') return abilMod + pb * 2;
      if (prof === 'proficient') return abilMod + pb;
      return abilMod;
    }

    function getSaveBonus(char, ability) {
      const abilMod = getMod(char.abilities[ability]);
      const prof = char.saveProfs[ability];
      const pb = getProfBonus(char.level);
      return prof ? abilMod + pb : abilMod;
    }

    function getPassivePerception(char) {
      return 10 + getSkillBonus(char, 'perception');
    }

    function getSpellDC(char) {
      if (!char.spellcastingAbility) return null;
      const abilMod = getMod(char.abilities[char.spellcastingAbility]);
      return 8 + getProfBonus(char.level) + abilMod;
    }

    function getSpellAttack(char) {
      if (!char.spellcastingAbility) return null;
      const abilMod = getMod(char.abilities[char.spellcastingAbility]);
      return getProfBonus(char.level) + abilMod;
    }

    // ============================================================
    // RENDER
    // ============================================================

    function render() {
      renderCharTabs();
      const char = getChar();
      const noCharEl = document.getElementById('noCharState');
      const navTabs = document.getElementById('navTabs');

      if (!char) {
        noCharEl.style.display = 'flex';
        navTabs.style.display = 'none';
        hideAllCards();
        return;
      }

      noCharEl.style.display = 'none';
      navTabs.style.display = 'flex';
      showAllCards();
      renderCore(char);
      renderCombat(char);
      renderSkills(char);
      renderSpells(char);
      renderInventory(char);
      renderFeatures(char);
      renderDice(char);
      renderNotes(char);
      saveState();
    }

    function hideAllCards() {
      ['charHeader', 'abilitiesCard', 'hpCard', 'charDetailsCard',
        'combatStatsCard', 'hitDiceCard', 'attacksCard', 'conditionsCard',
        'savesCard', 'skillsCard', 'spellSlotsCard', 'spellsListCard',
        'inventoryCard', 'itemsCard', 'featuresCard', 'notesCard',
        'backstoryCard', 'allyCard', 'extraNotesCard'
      ].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
    }

    function showAllCards() {
      ['charHeader', 'abilitiesCard', 'hpCard', 'charDetailsCard',
        'combatStatsCard', 'hitDiceCard', 'attacksCard', 'conditionsCard',
        'savesCard', 'skillsCard', 'spellSlotsCard', 'spellsListCard',
        'inventoryCard', 'itemsCard', 'featuresCard', 'notesCard',
        'backstoryCard', 'allyCard', 'extraNotesCard'
      ].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = '';
      });
    }

    function renderCharTabs() {
      const tabsEl = document.getElementById('charTabs');
      let html = '';
      for (const c of state.characters) {
        const active = c.id === state.activeCharId ? ' active' : '';
        html += `<div class="char-tab${active}" onclick="selectChar('${c.id}')">
      <span class="emoji">${c.portrait}</span>
      <span>${c.name}</span>
      <button class="char-tab-delete" onclick="deleteChar(event,'${c.id}')" title="Delete character">✕</button>
    </div>`;
      }
      html += `<button class="char-tab-new" onclick="openNewCharModal()">+ New</button>`;
      tabsEl.innerHTML = html;
    }

    function renderCore(char) {
      document.getElementById('charPortraitDisplay').textContent = char.portrait;
      document.getElementById('charNameDisplay').textContent = char.name;
      let subtitle = [char.race, char.class + (char.subclass ? ` (${char.subclass})` : ''), char.background].filter(Boolean).join(' • ');
      document.getElementById('charSubtitle').textContent = subtitle || 'Fill in your character details below';
      const badges = document.getElementById('charBadges');
      const pb = getProfBonus(char.level);
      badges.innerHTML = `
    <span class="char-badge">Lv ${char.level}</span>
    ${char.alignment ? `<span class="char-badge">${char.alignment}</span>` : ''}
    <span class="char-badge">+${pb} Prof</span>
    ${char.inspiration ? '<span class="char-badge" style="color:hsl(var(--gold));border-color:hsl(var(--gold))">⭐ Inspired</span>' : ''}
  `;
      const inspBtn = document.getElementById('inspirationBtn');
      inspBtn.classList.toggle('active', !!char.inspiration);

      const abilGrid = document.getElementById('abilityGrid');
      abilGrid.innerHTML = ABILITIES.map(ab => {
        const score = char.abilities[ab];
        const mod = getMod(score);
        return `<div class="stat-box">
      <div class="stat-name">${ABILITY_NAMES[ab]}</div>
      <div class="stat-score">${score}</div>
      <div class="stat-modifier">${fmtMod(mod)}</div>
    </div>`;
      }).join('');

      document.getElementById('profBonusDisplay').textContent = '+' + pb;
      document.getElementById('passivePercDisplay').textContent = getPassivePerception(char);

      renderHP(char);

      setVal('charNameInput', char.name);
      setVal('charLevelInput', char.level);
      setVal('charRaceInput', char.race);
      setVal('charClassInput', char.class);
      setVal('charSubclassInput', char.subclass);
      setVal('charBackgroundInput', char.background);
      setVal('charAlignmentInput', char.alignment);
      setVal('charXpInput', char.xp);
      setVal('charSpeedInput', char.speed);
      setVal('charDarkvisionInput', char.darkvision);
      setVal('charLanguagesInput', char.languages);

      const portSel = document.getElementById('portraitSelector');
      portSel.innerHTML = PORTRAIT_EMOJIS.map(e =>
        `<div class="portrait-btn${char.portrait === e ? ' selected' : ''}" onclick="setPortrait('${e}')">${e}</div>`
      ).join('');

      // FIX: ability inputs use onblur for clamping, oninput for live update without snapping
      const abilInputGrid = document.getElementById('abilityInputGrid');
      abilInputGrid.innerHTML = ABILITIES.map(ab => `
    <div>
      <label>${ABILITY_NAMES[ab]}</label>
      <input class="stat-input" type="number" min="1" max="30" value="${char.abilities[ab]}"
        oninput="updateAbilityLive('${ab}', this)"
        onblur="updateAbilityCommit('${ab}', this)">
    </div>
  `).join('');
    }

    function renderHP(char) {
      document.getElementById('hpCurrentDisplay').textContent = char.hpCurrent;
      document.getElementById('hpMaxDisplay').textContent = char.hpMax;

      // FIX: show temp HP separately
      const tempDisplay = document.getElementById('hpTempDisplay');
      if (char.hpTemp > 0) {
        tempDisplay.textContent = `+${char.hpTemp} temp`;
      } else {
        tempDisplay.textContent = '';
      }

      setVal('hpCurrentInput', char.hpCurrent);
      setVal('hpMaxInput', char.hpMax);
      setVal('hpTempInput', char.hpTemp);

      // FIX: HP bar uses effective max (hpMax + hpTemp) for percentage
      const effectiveMax = char.hpMax + char.hpTemp;
      const effectiveCurrent = char.hpCurrent + char.hpTemp;
      const pct = effectiveMax > 0 ? Math.max(0, Math.min(100, (effectiveCurrent / effectiveMax) * 100)) : 0;
      const bar = document.getElementById('hpBar');
      bar.style.width = pct + '%';
      if (pct > 50) bar.style.background = 'hsl(var(--emerald))';
      else if (pct > 25) bar.style.background = 'hsl(43,74%,50%)';
      else bar.style.background = 'hsl(var(--ruby))';

      const dsEl = document.getElementById('deathSaves');
      let dsHtml = `<div class="death-save-group"><span class="death-save-label">✓ Success</span>`;
      for (let i = 0; i < 3; i++) {
        const cls = i < char.deathSavesSuccess ? 'success' : '';
        dsHtml += `<div class="save-dot ${cls}" onclick="toggleDeathSave('success', ${i})"></div>`;
      }
      dsHtml += `</div><div class="death-save-group"><span class="death-save-label">✗ Fail</span>`;
      for (let i = 0; i < 3; i++) {
        const cls = i < char.deathSavesFail ? 'fail' : '';
        dsHtml += `<div class="save-dot ${cls}" onclick="toggleDeathSave('fail', ${i})"></div>`;
      }
      dsHtml += `</div>`;
      dsEl.innerHTML = dsHtml;
    }

    function renderCombat(char) {
      const pb = getProfBonus(char.level);
      const initMod = getMod(char.abilities.dex);
      const spellDC = getSpellDC(char);
      const spellAtk = getSpellAttack(char);

      document.getElementById('combatAC').textContent = char.ac;
      document.getElementById('combatInit').textContent = fmtMod(initMod);
      document.getElementById('combatSpeed').textContent = char.speed + ' ft';
      document.getElementById('combatProf').textContent = '+' + pb;
      document.getElementById('combatSpellDC').textContent = spellDC !== null ? spellDC : '—';
      document.getElementById('combatSpellAtk').textContent = spellAtk !== null ? fmtMod(spellAtk) : '—';
      setVal('combatACInput', char.ac);

      const spellAbilityEl = document.getElementById('spellcastingAbilityInput');
      if (spellAbilityEl) spellAbilityEl.value = char.spellcastingAbility || '';

      const hitDieTypeEl = document.getElementById('hitDieTypeSelect');
      if (hitDieTypeEl) hitDieTypeEl.value = char.hitDie || 'd8';

      const hitDieEl = document.getElementById('hitDieSlots');
      const totalDice = char.level;
      const usedDice = char.hitDiceUsed || 0;
      let hdHtml = '';
      for (let i = 0; i < totalDice; i++) {
        const avail = i >= usedDice;
        hdHtml += `<div class="hit-die-slot${avail ? ' available' : ''}" title="${char.hitDie}" onclick="clickHitDie(${i})">${char.hitDie}</div>`;
      }
      hitDieEl.innerHTML = hdHtml;

      const atksEl = document.getElementById('attacksList');
      if (char.attacks.length === 0) {
        atksEl.innerHTML = '<div class="text-sm text-muted">No attacks added yet.</div>';
      } else {
        atksEl.innerHTML = char.attacks.map((atk, i) => `
      <div class="attack-item" onclick="openEditAttack(${i})" style="cursor:pointer">
        <div class="attack-name">${atk.name}</div>
        <div class="attack-bonus">${atk.bonus}</div>
        <div class="attack-dmg">${atk.damage} ${atk.damageType}</div>
      </div>
    `).join('');
      }

      const condEl = document.getElementById('conditionGrid');
      condEl.innerHTML = CONDITIONS.map(c => {
        const active = (char.conditions || []).includes(c);
        return `<button class="condition-btn${active ? ' active' : ''}" onclick="toggleCondition('${c}')">${c}</button>`;
      }).join('');

      const exhBar = document.getElementById('exhaustionBar');
      let exhHtml = '';
      for (let i = 1; i <= 6; i++) {
        exhHtml += `<div class="exhaustion-pip${(char.exhaustion || 0) >= i ? ' active' : ''}" onclick="setExhaustion(${i})"></div>`;
      }
      exhBar.innerHTML = exhHtml;
      document.getElementById('exhaustionLabel').textContent = `Level ${char.exhaustion || 0} — ${EXHAUSTION_EFFECTS[char.exhaustion || 0]}`;
    }

    function renderSkills(char) {
      const savesEl = document.getElementById('savesList');
      savesEl.innerHTML = ABILITIES.map(ab => {
        const prof = char.saveProfs[ab];
        const bonus = getSaveBonus(char, ab);
        return `<div class="save-row" onclick="toggleSaveProf('${ab}')">
      <div class="prof-dot${prof ? ' proficient' : ''}"></div>
      <div class="skill-bonus">${fmtMod(bonus)}</div>
      <div class="skill-name">${ABILITY_FULL[ab]}</div>
    </div>`;
      }).join('');

      const skillsEl = document.getElementById('skillsList');
      skillsEl.innerHTML = SKILLS_DATA.map(skill => {
        const prof = char.skillProfs[skill.key] || 'none';
        const bonus = getSkillBonus(char, skill.key);
        let dotClass = '';
        if (prof === 'proficient') dotClass = ' proficient';
        if (prof === 'expert') dotClass = ' expert';
        return `<div class="skill-row" onclick="cycleSkillProf('${skill.key}')">
      <div class="prof-dot${dotClass}"></div>
      <div class="skill-bonus">${fmtMod(bonus)}</div>
      <div class="skill-name">${skill.name}</div>
      <div class="skill-ability">${skill.ability.toUpperCase()}</div>
    </div>`;
      }).join('');
    }

    function renderSpells(char) {
      const slotsEl = document.getElementById('spellSlotsList');
      let slotsHtml = '';
      for (let lvl = 1; lvl <= 9; lvl++) {
        const slot = char.spellSlots[lvl - 1];
        if (slot.max === 0) continue;
        slotsHtml += `<div class="spell-level-row">
      <div class="spell-level-label">Lvl ${lvl}</div>
      <div class="spell-slots">`;
        for (let s = 0; s < slot.max; s++) {
          const used = s < slot.used;
          slotsHtml += `<div class="spell-slot${used ? ' used' : ' available'}" onclick="toggleSpellSlot(${lvl - 1}, ${s})" title="Spell slot ${s+1} of ${slot.max}"></div>`;
        }
        slotsHtml += `</div>
      <span style="font-size:0.72rem;color:hsl(var(--muted-foreground))">${slot.max - slot.used}/${slot.max}</span>
      <button class="btn btn-sm" onclick="editSpellSlot(${lvl - 1}, event)" style="padding:2px 6px;font-size:0.65rem">edit</button>
    </div>`;
      }
      if (slotsHtml === '') {
        slotsHtml = `<div class="text-sm text-muted mb-8">No spell slots. Set max slots per level below.</div>`;
      }
      slotsHtml += `<div style="margin-top:12px"><div class="card-title" style="font-size:0.75rem;margin-bottom:8px">Configure Slots</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">`;
      for (let lvl = 1; lvl <= 9; lvl++) {
        const slot = char.spellSlots[lvl - 1];
        slotsHtml += `<div>
      <label style="font-size:0.65rem">Lvl ${lvl} max</label>
      <input type="number" min="0" max="9" value="${slot.max}" style="text-align:center;padding:4px"
        oninput="setSpellSlotMax(${lvl-1}, this.value)">
    </div>`;
      }
      slotsHtml += `</div>
    <button class="btn btn-sm mt-8" onclick="autoFillSpellSlots()">Auto-fill from level</button>
  </div>`;
      slotsEl.innerHTML = slotsHtml;

      const spellsEl = document.getElementById('spellsContainer');
      if (char.spells.length === 0) {
        spellsEl.innerHTML = '<div class="text-sm text-muted">No spells added yet.</div>';
      } else {
        const grouped = {};
        for (const sp of char.spells) {
          const lvl = sp.level;
          if (!grouped[lvl]) grouped[lvl] = [];
          grouped[lvl].push(sp);
        }
        let html = '';
        const levels = Object.keys(grouped).sort((a, b) => Number(a) - Number(b));
        for (const lvl of levels) {
          html += `<div class="text-sm text-muted mb-8" style="margin-top:10px;text-transform:uppercase;letter-spacing:.05em;font-size:.7rem">${Number(lvl) === 0 ? 'Cantrips' : `Level ${lvl} Spells`}</div>`;
          for (const sp of grouped[lvl]) {
            const idx = char.spells.indexOf(sp);
            const concTag = sp.concentration ? '<span class="spell-badge" style="background:hsl(var(--ruby)/.2);color:hsl(var(--ruby));border-color:hsl(var(--ruby)/.4)">C</span>' : '';
            html += `<div class="spell-item" onclick="openEditSpell(${idx})" style="cursor:pointer">
          <div class="spell-header">
            <div>
              <div class="spell-name">${sp.name}</div>
              <div class="spell-meta">${sp.school} • ${sp.castTime || ''} • ${sp.range || ''}</div>
            </div>
            <div style="display:flex;gap:4px;align-items:center">
              ${concTag}
              ${sp.damage ? `<span class="spell-badge">${sp.damage}</span>` : ''}
            </div>
          </div>
          ${sp.desc ? `<div class="spell-desc">${sp.desc.substring(0, 150)}${sp.desc.length > 150 ? '…' : ''}</div>` : ''}
        </div>`;
          }
        }
        spellsEl.innerHTML = html;
      }
    }

    function renderInventory(char) {
      const currEl = document.getElementById('currencyGrid');
      const currKeys = ['cp', 'sp', 'ep', 'gp', 'pp'];
      const currLabels = {
        cp: 'CP 🟤',
        sp: 'SP ⚪',
        ep: 'EP 🔵',
        gp: 'GP 🟡',
        pp: 'PP 🟣'
      };
      currEl.innerHTML = currKeys.map(k => `
    <div class="currency-item">
      <div class="currency-label">${currLabels[k]}</div>
      <input type="number" min="0" value="${char.currency[k]||0}" style="text-align:center;padding:4px" oninput="updateCurrency('${k}', this.value)">
    </div>
  `).join('');

      const itemsEl = document.getElementById('itemsList');
      if (char.inventory.length === 0) {
        itemsEl.innerHTML = '<div class="text-sm text-muted">No items in inventory.</div>';
      } else {
        let totalWeight = 0;
        char.inventory.forEach(it => {
          totalWeight += (it.weight || 0) * (it.qty || 1);
        });
        document.getElementById('encumbranceDisplay').textContent = `${totalWeight.toFixed(1)} lbs`;
        itemsEl.innerHTML = '<div>' + char.inventory.map((it, i) => {
          const summary = it.notes ? it.notes.split('\n')[0].substring(0, 120) : '';
          return `<div class="item-row" onclick="openEditItem(${i})">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div class="item-name">${it.name}</div>
          <div style="display:flex;gap:10px;align-items:center;flex-shrink:0">
            <span class="item-qty">×${it.qty || 1}</span>
            <span class="item-weight">${(it.weight || 0)} lb</span>
          </div>
        </div>
        ${summary ? `<div class="item-summary">${summary}${it.notes.length > 120 ? '…' : ''}</div>` : ''}
      </div>`;
        }).join('') + '</div>';
      }
    }

    function renderFeatures(char) {
      const el = document.getElementById('featuresList');
      if (char.features.length === 0) {
        el.innerHTML = '<div class="text-sm text-muted">No features or traits added yet.</div>';
      } else {
        el.innerHTML = char.features.map((f, i) => {
          const hasUses = f.maxUses > 0;
          return `<div class="feature-item">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div class="feature-name">${f.name}</div>
            ${f.source ? `<div class="feature-source">${f.source}</div>` : ''}
          </div>
          <div style="display:flex;gap:6px;align-items:center">
            ${hasUses ? `<span class="badge badge-muted">${f.uses}/${f.maxUses}</span>` : ''}
            ${hasUses ? `<button class="btn btn-sm" onclick="useFeature(${i},event)">Use</button>` : ''}
            <button class="btn btn-sm" onclick="openEditFeature(${i},event)">Edit</button>
          </div>
        </div>
        ${f.desc ? `<div class="feature-desc" style="margin-top:6px">${f.desc}</div>` : ''}
      </div>`;
        }).join('');
      }
    }

    function renderDice(char) {
      const dice = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];
      const grid = document.getElementById('diceGrid');
      grid.innerHTML = dice.map(d => `
    <div class="die-btn${state.selectedDie === d ? ' selected' : ''}" onclick="selectDie('${d}')">${d}</div>
  `).join('');

      const qrEl = document.getElementById('quickRollAbilities');
      if (char) {
        qrEl.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:6px">` + ABILITIES.map(ab => {
          const mod = getMod(char.abilities[ab]);
          return `<button class="btn btn-sm" onclick="quickRollAbility('${ab}')">
        ${ABILITY_NAMES[ab]} ${fmtMod(mod)}
      </button>`;
        }).join('') + `</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">
      <button class="btn btn-sm" onclick="quickRollInitiative()">⚔️ Initiative</button>
      <button class="btn btn-sm" onclick="quickRollPerception()">👁️ Perception</button>
    </div>`;
      } else {
        qrEl.innerHTML = '<div class="text-sm text-muted">Select a character to see quick rolls.</div>';
      }

      const histEl = document.getElementById('diceHistory');
      if (state.diceHistory.length === 0) {
        histEl.innerHTML = '';
        return;
      }
      histEl.innerHTML = '<div style="margin-top:12px;font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;color:hsl(var(--muted-foreground));margin-bottom:4px">Recent Rolls</div>' +
        state.diceHistory.slice(0, 8).map(h => `
      <div class="dice-history-item">
        <span>${h.label}</span>
        <span class="dice-history-val">${h.result}</span>
      </div>
    `).join('');
    }

    function renderNotes(char) {
      setVal('personalityInput', char.personality);
      setVal('backstoryInput', char.backstory);
      setVal('alliesInput', char.allies);
      setVal('extraNotesInput', char.extraNotes);
    }

    // ============================================================
    // ACTIONS
    // ============================================================

    function selectChar(id) {
      state.activeCharId = id;
      render();
    }

    // FIX: delete char button accessible from tabs
    function deleteChar(e, id) {
      e.stopPropagation();
      const char = state.characters.find(c => c.id === id);
      if (!char) return;
      if (!confirm(`Delete ${char.name}? This cannot be undone.`)) return;
      state.characters = state.characters.filter(c => c.id !== id);
      if (state.activeCharId === id) {
        state.activeCharId = state.characters.length ? state.characters[0].id : null;
      }
      render();
    }

    function toggleInspiration() {
      const char = getChar();
      if (!char) return;
      char.inspiration = !char.inspiration;
      render();
    }

    function updateCharField(field, value) {
      const char = getChar();
      if (!char) return;
      char[field] = value;
      render();
    }

    // FIX: Live update only updates display if value is a valid number; doesn't snap to 10
    function updateAbilityLive(ab, inputEl) {
      const char = getChar();
      if (!char) return;
      const raw = inputEl.value;
      const parsed = parseInt(raw);
      // Only update the model if we have a valid number in range; ignore empty/partial input
      if (!isNaN(parsed) && raw !== '') {
        char.abilities[ab] = Math.max(1, Math.min(30, parsed));
        // Update display stats without re-rendering the input (which would reset cursor)
        updateAbilityDisplay(char);
        saveState();
      }
    }

    // FIX: On blur, commit the final value with clamping and fallback
    function updateAbilityCommit(ab, inputEl) {
      const char = getChar();
      if (!char) return;
      const parsed = parseInt(inputEl.value);
      const final = isNaN(parsed) ? char.abilities[ab] : Math.max(1, Math.min(30, parsed));
      char.abilities[ab] = final;
      inputEl.value = final;
      updateAbilityDisplay(char);
      saveState();
    }

    // Generic helpers for number fields: allow empty/partial input while typing,
    // commit with clamping and fallback on blur.
    function numFieldLive(field, inputEl) {
      if (inputEl.value === '') return;
      const v = parseInt(inputEl.value);
      if (!isNaN(v)) {
        // Save to model without re-rendering, so we don't reset the input while typing
        const char = getChar();
        if (char) {
          char[field] = v;
          saveState();
        }
      }
    }

    function numFieldCommit(field, inputEl, fallback, min, max) {
      let v = parseInt(inputEl.value);
      if (isNaN(v) || inputEl.value === '') v = (fallback !== undefined) ? fallback : 0;
      if (min !== undefined) v = Math.max(min, v);
      if (max !== undefined) v = Math.min(max, v);
      updateCharField(field, v);
      inputEl.value = v;
    }

    // Update ability-score display widgets and derived stats without re-rendering inputs
    function updateAbilityDisplay(char) {
      const pb = getProfBonus(char.level);
      const abilGrid = document.getElementById('abilityGrid');
      if (abilGrid) {
        abilGrid.innerHTML = ABILITIES.map(ab => {
          const score = char.abilities[ab];
          const mod = getMod(score);
          return `<div class="stat-box">
        <div class="stat-name">${ABILITY_NAMES[ab]}</div>
        <div class="stat-score">${score}</div>
        <div class="stat-modifier">${fmtMod(mod)}</div>
      </div>`;
        }).join('');
      }
      const ppEl = document.getElementById('passivePercDisplay');
      if (ppEl) ppEl.textContent = getPassivePerception(char);
      // Update skills and saves since they depend on ability scores
      renderSkills(char);
      renderCombat(char);
    }

    function setPortrait(emoji) {
      const char = getChar();
      if (!char) return;
      char.portrait = emoji;
      render();
    }

    function updateHp(field, value) {
      const char = getChar();
      if (!char) return;
      const v = parseInt(value);
      // Allow empty/in-progress without forcing a value
      if (isNaN(v)) return;
      if (field === 'current') char.hpCurrent = v; // allow negative (massive damage / instant death)
      if (field === 'max') char.hpMax = Math.max(0, v);
      if (field === 'temp') char.hpTemp = Math.max(0, v);
      renderHP(char);
      saveState();
    }

    function quickHp(delta) {
      const char = getChar();
      if (!char) return;
      // FIX: temp HP absorbs damage first
      if (delta < 0 && char.hpTemp > 0) {
        const absorbed = Math.min(char.hpTemp, -delta);
        char.hpTemp -= absorbed;
        delta += absorbed;
      }
      char.hpCurrent = Math.max(-char.hpMax, Math.min(char.hpMax + char.hpTemp, char.hpCurrent + delta));
      renderHP(char);
      saveState();
    }

    function healToMax() {
      const char = getChar();
      if (!char) return;
      char.hpCurrent = char.hpMax;
      char.hpTemp = 0;
      char.deathSavesSuccess = 0;
      char.deathSavesFail = 0;
      char.hitDiceUsed = 0;
      renderHP(char);
      saveState();
      render();
    }

    function toggleDeathSave(type, index) {
      const char = getChar();
      if (!char) return;
      const field = type === 'success' ? 'deathSavesSuccess' : 'deathSavesFail';
      if (char[field] === index + 1) {
        char[field] = index;
      } else {
        char[field] = index + 1;
      }
      renderHP(char);
      saveState();
    }

    function toggleSaveProf(ability) {
      const char = getChar();
      if (!char) return;
      char.saveProfs[ability] = !char.saveProfs[ability];
      renderSkills(char);
      saveState();
    }

    function cycleSkillProf(skillKey) {
      const char = getChar();
      if (!char) return;
      const current = char.skillProfs[skillKey] || 'none';
      const cycle = {
        'none': 'proficient',
        'proficient': 'expert',
        'expert': 'none'
      };
      char.skillProfs[skillKey] = cycle[current];
      renderSkills(char);
      saveState();
    }

    function toggleCondition(cond) {
      const char = getChar();
      if (!char) return;
      if (!char.conditions) char.conditions = [];
      const idx = char.conditions.indexOf(cond);
      if (idx === -1) char.conditions.push(cond);
      else char.conditions.splice(idx, 1);
      renderCombat(char);
      saveState();
    }

    function setExhaustion(level) {
      const char = getChar();
      if (!char) return;
      char.exhaustion = char.exhaustion === level ? level - 1 : level;
      renderCombat(char);
      saveState();
    }

    function useHitDie() {
      const char = getChar();
      if (!char) return;
      if (char.hitDiceUsed >= char.level) {
        alert('No hit dice remaining!');
        return;
      }
      const dieNum = parseInt(char.hitDie.replace('d', ''));
      const roll = Math.ceil(Math.random() * dieNum);
      const conMod = getMod(char.abilities.con);
      const healed = Math.max(1, roll + conMod);
      char.hitDiceUsed++;
      char.hpCurrent = Math.min(char.hpMax, char.hpCurrent + healed);
      addDiceHistory(`${char.hitDie} (Hit Die) +CON`, healed, `Rolled ${roll}+${conMod}=${healed} HP`);
      render();
    }

    function clickHitDie(idx) {
      const char = getChar();
      if (!char) return;
      if (idx < char.hitDiceUsed) return;
      useHitDie();
    }

    function resetHitDice() {
      const char = getChar();
      if (!char) return;
      const toRestore = Math.max(1, Math.floor(char.level / 2));
      char.hitDiceUsed = Math.max(0, char.hitDiceUsed - toRestore);
      char.hpCurrent = char.hpMax;
      render();
    }

    function toggleSpellSlot(levelIdx, slotIdx) {
      const char = getChar();
      if (!char) return;
      const slot = char.spellSlots[levelIdx];
      if (slotIdx < slot.used) {
        slot.used = slotIdx;
      } else {
        slot.used = slotIdx + 1;
      }
      renderSpells(char);
      saveState();
    }

    function setSpellSlotMax(levelIdx, val) {
      const char = getChar();
      if (!char) return;
      const newMax = Math.max(0, Math.min(9, parseInt(val) || 0));
      char.spellSlots[levelIdx].max = newMax;
      if (char.spellSlots[levelIdx].used > newMax) char.spellSlots[levelIdx].used = newMax;
      renderSpells(char);
      saveState();
    }

    function editSpellSlot(levelIdx, e) {
      e.stopPropagation();
      const inputs = document.querySelectorAll('#spellSlotsList input[type=number]');
      if (inputs[levelIdx]) inputs[levelIdx].focus();
    }

    function autoFillSpellSlots() {
      const char = getChar();
      if (!char) return;
      const table = SPELL_SLOTS_BY_LEVEL[Math.min(20, char.level)] || [];
      for (let i = 0; i < 9; i++) {
        char.spellSlots[i].max = table[i] || 0;
        if (char.spellSlots[i].used > char.spellSlots[i].max) {
          char.spellSlots[i].used = char.spellSlots[i].max;
        }
      }
      renderSpells(char);
      saveState();
    }

    function resetSpellSlots() {
      const char = getChar();
      if (!char) return;
      char.spellSlots.forEach(s => s.used = 0);
      renderSpells(char);
      saveState();
    }

    function updateCurrency(key, val) {
      const char = getChar();
      if (!char) return;
      char.currency[key] = Math.max(0, parseInt(val) || 0);
      saveState();
    }

    // Dice
    function selectDie(die) {
      state.selectedDie = die;
      renderDice(getChar());
    }

    function rollDice() {
      const dieNum = parseInt(state.selectedDie.replace('d', ''));
      const count = Math.max(1, parseInt(document.getElementById('diceCount').value) || 1);
      const mod = parseInt(document.getElementById('diceModifier').value) || 0;
      let rolls = [];
      let total = 0;
      for (let i = 0; i < count; i++) {
        const r = Math.ceil(Math.random() * dieNum);
        rolls.push(r);
        total += r;
      }
      total += mod;
      const label = `${count}${state.selectedDie}${mod !== 0 ? (mod > 0 ? '+' : '') + mod : ''}`;
      document.getElementById('diceResultNum').textContent = total;
      const rollStr = rolls.join(', ');
      document.getElementById('diceResultInfo').textContent = `${label} → [${rollStr}]${mod !== 0 ? ` ${mod > 0 ? '+' : ''}${mod}` : ''}`;
      addDiceHistory(label, total);
      renderDice(getChar());
    }

    function addDiceHistory(label, result, note) {
      state.diceHistory.unshift({
        label,
        result: note ? `${result} (${note})` : result,
        ts: Date.now()
      });
      if (state.diceHistory.length > 20) state.diceHistory.pop();
    }

    function quickRollAbility(ab) {
      const char = getChar();
      if (!char) return;
      const mod = getMod(char.abilities[ab]);
      const roll = Math.ceil(Math.random() * 20);
      const total = roll + mod;
      const label = `${ABILITY_NAMES[ab]} check`;
      document.getElementById('diceResultNum').textContent = total;
      document.getElementById('diceResultInfo').textContent = `d20 [${roll}] ${fmtMod(mod)} = ${total}`;
      addDiceHistory(label, total);
      // FIX: Use ID-based tab selection instead of fragile index
      showPanel('dice', document.getElementById('tab-dice'));
      renderDice(char);
    }

    function quickRollInitiative() {
      const char = getChar();
      if (!char) return;
      const mod = getMod(char.abilities.dex);
      const roll = Math.ceil(Math.random() * 20);
      const total = roll + mod;
      document.getElementById('diceResultNum').textContent = total;
      document.getElementById('diceResultInfo').textContent = `Initiative: d20 [${roll}] ${fmtMod(mod)} = ${total}`;
      addDiceHistory('Initiative', total);
      showPanel('dice', document.getElementById('tab-dice'));
      renderDice(char);
    }

    function quickRollPerception() {
      const char = getChar();
      if (!char) return;
      const bonus = getSkillBonus(char, 'perception');
      const roll = Math.ceil(Math.random() * 20);
      const total = roll + bonus;
      document.getElementById('diceResultNum').textContent = total;
      document.getElementById('diceResultInfo').textContent = `Perception: d20 [${roll}] ${fmtMod(bonus)} = ${total}`;
      addDiceHistory('Perception', total);
      showPanel('dice', document.getElementById('tab-dice'));
      renderDice(char);
    }

    // ============================================================
    // MODALS
    // ============================================================

    let selectedNewPortrait = '🧙';

    function openNewCharModal() {
      selectedNewPortrait = '🧙';
      document.getElementById('newCharName').value = '';
      document.getElementById('newCharRace').value = '';
      document.getElementById('newCharClass').value = '';
      document.getElementById('newCharBackground').value = '';

      const portEl = document.getElementById('newCharPortrait');
      portEl.innerHTML = PORTRAIT_EMOJIS.map(e =>
        `<div class="portrait-btn${e === selectedNewPortrait ? ' selected' : ''}" onclick="selectNewPortrait('${e}',this)">${e}</div>`
      ).join('');

      openModal('newCharModal');
      setTimeout(() => document.getElementById('newCharName').focus(), 100);
    }

    function selectNewPortrait(emoji, el) {
      selectedNewPortrait = emoji;
      document.querySelectorAll('#newCharPortrait .portrait-btn').forEach(b => b.classList.remove('selected'));
      el.classList.add('selected');
    }

    function createCharacter() {
      const name = document.getElementById('newCharName').value.trim() || 'Unnamed Hero';
      const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
      const char = defaultCharacter(id);
      char.name = name;
      char.race = document.getElementById('newCharRace').value.trim();
      char.class = document.getElementById('newCharClass').value.trim();
      char.background = document.getElementById('newCharBackground').value.trim();
      char.portrait = selectedNewPortrait;
      state.characters.push(char);
      state.activeCharId = id;
      closeModal('newCharModal');
      render();
    }

    // Spell modal
    let spellEditIdx = null;

    function openAddSpell() {
      spellEditIdx = null;
      document.getElementById('spellModalTitle').textContent = 'Add Spell';
      document.getElementById('deleteSpellBtn').style.display = 'none';
      ['spellName', 'spellLevel', 'spellSchool', 'spellCastTime', 'spellRange', 'spellDuration', 'spellComponents', 'spellDesc', 'spellDamage'].forEach(id => {
        const el = document.getElementById(id);
        if (el.tagName === 'SELECT') el.selectedIndex = 0;
        else if (el.type === 'number') el.value = id === 'spellLevel' ? 1 : 0;
        else el.value = '';
      });
      document.getElementById('spellConcentration').value = 'false';
      openModal('addSpellModal');
    }

    function openEditSpell(idx) {
      spellEditIdx = idx;
      const char = getChar();
      const sp = char.spells[idx];
      document.getElementById('spellModalTitle').textContent = 'Edit Spell';
      document.getElementById('deleteSpellBtn').style.display = '';
      setVal('spellName', sp.name);
      setVal('spellLevel', sp.level);
      setVal('spellSchool', sp.school);
      setVal('spellCastTime', sp.castTime);
      setVal('spellRange', sp.range);
      setVal('spellDuration', sp.duration);
      setVal('spellComponents', sp.components);
      setVal('spellDesc', sp.desc);
      setVal('spellDamage', sp.damage);
      document.getElementById('spellConcentration').value = sp.concentration ? 'true' : 'false';
      openModal('addSpellModal');
    }

    function saveSpell() {
      const char = getChar();
      const spell = {
        name: getVal('spellName') || 'Unnamed Spell',
        level: parseInt(getVal('spellLevel')) || 0,
        school: getVal('spellSchool'),
        castTime: getVal('spellCastTime'),
        range: getVal('spellRange'),
        duration: getVal('spellDuration'),
        components: getVal('spellComponents'),
        desc: getVal('spellDesc'),
        damage: getVal('spellDamage'),
        concentration: document.getElementById('spellConcentration').value === 'true'
      };
      if (spellEditIdx !== null) {
        char.spells[spellEditIdx] = spell;
      } else {
        char.spells.push(spell);
      }
      char.spells.sort((a, b) => a.level - b.level);
      closeModal('addSpellModal');
      render();
    }

    function deleteCurrentSpell() {
      const char = getChar();
      if (spellEditIdx === null) return;
      char.spells.splice(spellEditIdx, 1);
      closeModal('addSpellModal');
      render();
    }

    // Attack modal
    let attackEditIdx = null;

    function openAddAttack() {
      attackEditIdx = null;
      document.getElementById('attackModalTitle').textContent = 'Add Attack';
      document.getElementById('deleteAttackBtn').style.display = 'none';
      ['attackName', 'attackBonus', 'attackDamage', 'attackDamageType', 'attackRange', 'attackNotes'].forEach(id => {
        document.getElementById(id).value = '';
      });
      openModal('addAttackModal');
    }

    function openEditAttack(idx) {
      attackEditIdx = idx;
      const char = getChar();
      const atk = char.attacks[idx];
      document.getElementById('attackModalTitle').textContent = 'Edit Attack';
      document.getElementById('deleteAttackBtn').style.display = '';
      setVal('attackName', atk.name);
      setVal('attackBonus', atk.bonus);
      setVal('attackDamage', atk.damage);
      setVal('attackDamageType', atk.damageType);
      setVal('attackRange', atk.range);
      setVal('attackNotes', atk.notes);
      openModal('addAttackModal');
    }

    function saveAttack() {
      const char = getChar();
      const atk = {
        name: getVal('attackName') || 'Attack',
        bonus: getVal('attackBonus') || '+0',
        damage: getVal('attackDamage') || '1d6',
        damageType: getVal('attackDamageType') || '',
        range: getVal('attackRange') || '5 ft',
        notes: getVal('attackNotes') || ''
      };
      if (attackEditIdx !== null) char.attacks[attackEditIdx] = atk;
      else char.attacks.push(atk);
      closeModal('addAttackModal');
      render();
    }

    function deleteCurrentAttack() {
      const char = getChar();
      if (attackEditIdx === null) return;
      char.attacks.splice(attackEditIdx, 1);
      closeModal('addAttackModal');
      render();
    }

    // Item modal
    let itemEditIdx = null;

    function openAddItem() {
      itemEditIdx = null;
      document.getElementById('itemModalTitle').textContent = 'Add Item';
      document.getElementById('deleteItemBtn').style.display = 'none';
      setVal('itemName', '');
      setVal('itemQty', 1);
      setVal('itemWeight', 0);
      setVal('itemValue', 0);
      setVal('itemNotes', '');
      openModal('addItemModal');
    }

    function openEditItem(idx) {
      itemEditIdx = idx;
      const char = getChar();
      const it = char.inventory[idx];
      document.getElementById('itemModalTitle').textContent = 'Edit Item';
      document.getElementById('deleteItemBtn').style.display = '';
      setVal('itemName', it.name);
      setVal('itemQty', it.qty || 1);
      setVal('itemWeight', it.weight || 0);
      setVal('itemValue', it.value || 0);
      setVal('itemNotes', it.notes || '');
      openModal('addItemModal');
    }

    function saveItem() {
      const char = getChar();
      const item = {
        name: getVal('itemName') || 'Item',
        qty: parseInt(getVal('itemQty')) || 1,
        weight: parseFloat(getVal('itemWeight')) || 0,
        value: parseFloat(getVal('itemValue')) || 0,
        notes: getVal('itemNotes')
      };
      if (itemEditIdx !== null) char.inventory[itemEditIdx] = item;
      else char.inventory.push(item);
      closeModal('addItemModal');
      render();
    }

    function deleteCurrentItem() {
      const char = getChar();
      if (itemEditIdx === null) return;
      char.inventory.splice(itemEditIdx, 1);
      closeModal('addItemModal');
      render();
    }

    // Feature modal
    let featureEditIdx = null;

    function openAddFeature() {
      featureEditIdx = null;
      document.getElementById('featureModalTitle').textContent = 'Add Feature / Trait';
      document.getElementById('deleteFeatureBtn').style.display = 'none';
      setVal('featureName', '');
      setVal('featureSource', '');
      setVal('featureDesc', '');
      setVal('featureUses', 0);
      setVal('featureMaxUses', 0);
      openModal('addFeatureModal');
    }

    function openEditFeature(idx, e) {
      if (e) e.stopPropagation();
      featureEditIdx = idx;
      const char = getChar();
      const f = char.features[idx];
      document.getElementById('featureModalTitle').textContent = 'Edit Feature';
      document.getElementById('deleteFeatureBtn').style.display = '';
      setVal('featureName', f.name);
      setVal('featureSource', f.source || '');
      setVal('featureDesc', f.desc || '');
      setVal('featureUses', f.uses || 0);
      setVal('featureMaxUses', f.maxUses || 0);
      openModal('addFeatureModal');
    }

    function saveFeature() {
      const char = getChar();
      const maxUses = parseInt(getVal('featureMaxUses')) || 0;
      const feat = {
        name: getVal('featureName') || 'Feature',
        source: getVal('featureSource'),
        desc: getVal('featureDesc'),
        uses: parseInt(getVal('featureUses')) || 0,
        maxUses
      };
      if (featureEditIdx !== null) char.features[featureEditIdx] = feat;
      else char.features.push(feat);
      closeModal('addFeatureModal');
      render();
    }

    function deleteCurrentFeature() {
      const char = getChar();
      if (featureEditIdx === null) return;
      char.features.splice(featureEditIdx, 1);
      closeModal('addFeatureModal');
      render();
    }

    function useFeature(idx, e) {
      e.stopPropagation();
      const char = getChar();
      const f = char.features[idx];
      if (f.uses > 0) {
        f.uses--;
        renderFeatures(char);
        saveState();
      } else {
        alert('No uses remaining!');
      }
    }

    // Import / Export
    function openImportExport() {
      document.getElementById('exportTextarea').value = JSON.stringify({
        characters: state.characters
      }, null, 2);
      openModal('importExportModal');
    }

    function exportData() {
      const data = JSON.stringify({
        characters: state.characters
      }, null, 2);
      const blob = new Blob([data], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dnd-characters.json';
      a.click();
      URL.revokeObjectURL(url);
    }

    function importData(input) {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.characters && Array.isArray(data.characters)) {
            const newCount = data.characters.filter(c => !state.characters.find(x => x.id === c.id)).length;
            const updateCount = data.characters.length - newCount;
            const msg = `Import ${data.characters.length} character(s)? (${newCount} new, ${updateCount} will update existing)`;
            if (confirm(msg)) {
              // FIX: update existing characters instead of skipping them
              data.characters.forEach(c => {
                const existingIdx = state.characters.findIndex(x => x.id === c.id);
                if (existingIdx >= 0) {
                  state.characters[existingIdx] = {
                    ...defaultCharacter(c.id),
                    ...c
                  };
                } else {
                  state.characters.push({
                    ...defaultCharacter(c.id),
                    ...c
                  });
                }
              });
              if (data.characters.length > 0) state.activeCharId = data.characters[0].id;
              closeModal('importExportModal');
              render();
            }
          }
        } catch (err) {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
      input.value = '';
    }

    function importFromTextarea() {
      try {
        const data = JSON.parse(document.getElementById('exportTextarea').value);
        if (data.characters && Array.isArray(data.characters)) {
          // FIX: update existing characters instead of skipping them
          data.characters.forEach(c => {
            const existingIdx = state.characters.findIndex(x => x.id === c.id);
            if (existingIdx >= 0) {
              state.characters[existingIdx] = {
                ...defaultCharacter(c.id),
                ...c
              };
            } else {
              state.characters.push({
                ...defaultCharacter(c.id),
                ...c
              });
            }
          });
          if (data.characters.length > 0) state.activeCharId = data.characters[0].id;
          closeModal('importExportModal');
          render();
        } else {
          alert('Invalid format: expected { characters: [...] }');
        }
      } catch (err) {
        alert('Invalid JSON: ' + err.message);
      }
    }

    // ============================================================
    // LOOKUP SYSTEM (D&D 5e API)
    // ============================================================

    const DND_API = 'https://www.dnd5eapi.co/api';

    const LOOKUP_CATS = {
      spells: {
        endpoint: '/spells',
        placeholder: 'Search spells… (e.g. fireball)'
      },
      equipment: {
        endpoint: '/equipment',
        placeholder: 'Search equipment & weapons… (e.g. longsword)'
      },
      feats: {
        endpoint: '/feats',
        placeholder: 'Search feats… (e.g. alert)'
      },
      classes: {
        endpoint: '/classes',
        placeholder: 'Search classes… (e.g. wizard)'
      },
      subclasses: {
        endpoint: '/subclasses',
        placeholder: 'Search subclasses… (e.g. life)'
      },
    };

    let lookupState = {
      category: 'spells',
      results: [],
      searchTimer: null,
      currentDetail: null,
    };

    function setLookupCategory(cat, btn) {
      lookupState.category = cat;
      document.querySelectorAll('.lookup-cat-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      const input = document.getElementById('lookupSearchInput');
      if (input) {
        input.placeholder = LOOKUP_CATS[cat]?.placeholder || 'Search…';
        input.value = '';
      }
      lookupState.results = [];
      document.getElementById('lookupResultsList').innerHTML = '';
      document.getElementById('lookupStatusMsg').style.display = 'none';
    }

    function debounceLookupSearch(val) {
      clearTimeout(lookupState.searchTimer);
      if (val.trim().length < 2) return;
      lookupState.searchTimer = setTimeout(() => runLookupSearch(), 420);
    }

    async function runLookupSearch() {
      const input = document.getElementById('lookupSearchInput');
      const query = (input ? input.value : '').trim();
      const cat = lookupState.category;
      const cat_cfg = LOOKUP_CATS[cat];
      if (!cat_cfg) return;

      const statusEl = document.getElementById('lookupStatusMsg');
      statusEl.textContent = 'Searching…';
      statusEl.style.display = 'block';
      document.getElementById('lookupResultsList').innerHTML = '';

      try {
        const url = query.length >= 2 ?
          `${DND_API}${cat_cfg.endpoint}?name=${encodeURIComponent(query)}` :
          `${DND_API}${cat_cfg.endpoint}`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('API returned ' + resp.status);
        const data = await resp.json();
        lookupState.results = (data.results || []).slice(0, 60);
        if (lookupState.results.length === 0) {
          statusEl.textContent = 'No results found. Try a different search term.';
        } else {
          statusEl.style.display = 'none';
          renderLookupResults();
        }
      } catch (err) {
        statusEl.textContent = 'Could not reach the D&D 5e API. Check your internet connection.';
      }
    }

    function renderLookupResults() {
      const el = document.getElementById('lookupResultsList');
      if (!el) return;
      el.innerHTML = lookupState.results.map(r => `
    <div class="lookup-result-item" onclick="fetchLookupDetail('${lookupState.category}','${r.index}')">
      <div class="lookup-result-name">${r.name}</div>
      <span style="font-size:0.7rem;color:hsl(var(--muted-foreground))">▶</span>
    </div>
  `).join('');
    }

    async function fetchLookupDetail(cat, index) {
      const cat_cfg = LOOKUP_CATS[cat];
      if (!cat_cfg) return;
      const titleEl = document.getElementById('lookupDetailTitle');
      const bodyEl = document.getElementById('lookupDetailBody');
      const actsEl = document.getElementById('lookupDetailActions');
      titleEl.textContent = 'Loading…';
      bodyEl.innerHTML = '<div class="lookup-status-msg">Fetching details…</div>';
      actsEl.innerHTML = '';
      openModal('lookupDetailModal');
      try {
        const resp = await fetch(`${DND_API}${cat_cfg.endpoint}/${index}`);
        if (!resp.ok) throw new Error('API returned ' + resp.status);
        const data = await resp.json();
        lookupState.currentDetail = {
          cat,
          data
        };
        renderLookupDetail(cat, data);
      } catch (err) {
        bodyEl.innerHTML = '<div class="lookup-status-msg">Could not load details. Try again.</div>';
      }
    }

    function renderLookupDetail(cat, d) {
      const titleEl = document.getElementById('lookupDetailTitle');
      const bodyEl = document.getElementById('lookupDetailBody');
      const actsEl = document.getElementById('lookupDetailActions');
      titleEl.textContent = d.name;

      function detRow(label, value, span2) {
        if (!value && value !== 0) return '';
        return `<div class="lookup-detail-section"${span2 ? ' style="grid-column:span 2"' : ''}>
      <div class="lookup-detail-label">${label}</div>
      <div class="lookup-detail-value">${value}</div>
    </div>`;
      }

      function descBlock(text) {
        if (!text) return '';
        const t = Array.isArray(text) ? text.join('\n\n') : text;
        return `<div class="lookup-detail-desc">${t.replace(/\n/g,'<br>')}</div>`;
      }

      let html = '',
        acts = '';

      if (cat === 'spells') {
        const desc = Array.isArray(d.desc) ? d.desc.join('\n\n') : (d.desc || '');
        const higher = Array.isArray(d.higher_level) ? d.higher_level.join('\n') : '';
        const components = (d.components || []).join(', ') + (d.material ? ` (${d.material})` : '');
        const school = d.school?.name || '';
        const dmgDice = d.damage?.damage_at_slot_level ?
          Object.values(d.damage.damage_at_slot_level)[0] :
          (d.damage?.damage_at_character_level ? Object.values(d.damage.damage_at_character_level)[0] : '');
        const dmgType = d.damage?.damage_type?.name || '';
        const dmgStr = dmgDice ? `${dmgDice}${dmgType ? ' ' + dmgType : ''}` : '';
        const healStr = d.heal_at_slot_level ? Object.values(d.heal_at_slot_level)[0] + ' (healing)' : '';

        html = `<div class="lookup-detail-grid">
      ${detRow('Level', d.level === 0 ? 'Cantrip' : d.level)}
      ${detRow('School', school)}
      ${detRow('Casting Time', d.casting_time)}
      ${detRow('Range', d.range)}
      ${detRow('Duration', d.duration)}
      ${detRow('Components', components)}
      ${d.concentration ? `<div class="lookup-detail-section" style="grid-column:span 2"><span style="color:hsl(var(--ruby));font-size:0.82rem">⚡ Requires Concentration</span></div>` : ''}
      ${dmgStr || healStr ? detRow('Damage / Effect', dmgStr || healStr, true) : ''}
    </div>
    ${descBlock(desc)}
    ${higher ? `<div style="margin-top:8px;font-size:0.8rem;color:hsl(var(--gold))"><strong>At Higher Levels:</strong> ${higher}</div>` : ''}`;

        acts = `<button class="btn btn-primary btn-sm" onclick="addSpellFromLookup()">+ Add to Spells</button>`;

      } else if (cat === 'equipment') {
        const isWeapon = d.equipment_category?.index === 'weapon';
        const cost = d.cost ? `${d.cost.quantity} ${d.cost.unit}` : '';
        const weight = d.weight != null ? `${d.weight} lb` : '';
        const dmgDice = d.damage?.damage_dice || '';
        const dmgType = d.damage?.damage_type?.name || '';
        const dmgStr = dmgDice ? `${dmgDice} ${dmgType}` : '';
        const twoDmg = d.two_handed_damage ? `${d.two_handed_damage.damage_dice} ${d.two_handed_damage.damage_type?.name || ''} (two-handed)` : '';
        const props = (d.properties || []).map(p => p.name).join(', ');
        const rangeNormal = d.range?.normal;
        const rangeLong = d.range?.long;
        const rangeStr = rangeNormal ? `${rangeNormal}${rangeLong ? '/' + rangeLong : ''} ft` : '';
        const armorClass = d.armor_class ? `${d.armor_class.base}${d.armor_class.dex_bonus ? ' + DEX mod' : ''}` : '';
        const desc = Array.isArray(d.desc) ? d.desc.join('\n\n') : (d.desc || '');

        html = `<div class="lookup-detail-grid">
      ${detRow('Category', [d.equipment_category?.name, d.weapon_category].filter(Boolean).join(' · '))}
      ${detRow('Cost', cost)}
      ${detRow('Weight', weight)}
      ${dmgStr ? detRow('Damage', dmgStr + (twoDmg ? `<br><span style="font-size:0.75rem;color:hsl(var(--muted-foreground))">${twoDmg}</span>` : '')) : ''}
      ${armorClass ? detRow('Armor Class', armorClass) : ''}
      ${rangeStr ? detRow('Range', rangeStr) : ''}
      ${props ? detRow('Properties', props, true) : ''}
    </div>
    ${descBlock(desc)}`;

        const valueGp = d.cost ?
          (d.cost.unit === 'gp' ? d.cost.quantity : d.cost.unit === 'sp' ? d.cost.quantity / 10 : d.cost.unit === 'cp' ? d.cost.quantity / 100 : 0) :
          0;
        const noteParts = [desc, props ? 'Properties: ' + props : '', twoDmg].filter(Boolean);

        acts = `<button class="btn btn-sm" onclick="addItemFromLookup()">+ Add to Inventory</button>`;
        if (isWeapon) {
          acts += ` <button class="btn btn-primary btn-sm" onclick="addAttackFromLookup()">+ Add to Attacks & Inventory</button>`;
        }

      } else if (cat === 'feats') {
        const desc = Array.isArray(d.desc) ? d.desc.join('\n\n') : (d.desc || '');
        const prereqs = (d.prerequisites || []).map(p => p.ability_score?.name || p.name || JSON.stringify(p)).filter(Boolean).join(', ');

        html = `<div class="lookup-detail-grid">
      ${prereqs ? detRow('Prerequisites', prereqs, true) : '<div class="lookup-detail-section" style="grid-column:span 2"><span style="font-size:0.8rem;color:hsl(var(--muted-foreground))">No prerequisites</span></div>'}
    </div>
    ${descBlock(desc)}`;

        acts = `<button class="btn btn-primary btn-sm" onclick="addFeatFromLookup()">+ Add to Features</button>`;

      } else if (cat === 'classes') {
        const savingThrows = (d.saving_throws || []).map(s => s.name).join(', ');
        const profChoices = (d.proficiency_choices || []).map(pc => {
          const opts = (pc.from?.options || []).slice(0, 4).map(o => o.item?.name || o.name || '').filter(Boolean).join(', ');
          return `Choose ${pc.choose}: ${opts}${pc.from?.options?.length > 4 ? '…' : ''}`;
        }).join('<br>');

        html = `<div class="lookup-detail-grid">
      ${detRow('Hit Die', d.hit_die ? 'd' + d.hit_die : '')}
      ${detRow('Saving Throws', savingThrows)}
      ${d.subclass_flavor ? detRow('Subclass Path', d.subclass_flavor, true) : ''}
      ${profChoices ? detRow('Proficiency Choices', profChoices, true) : ''}
    </div>`;

        acts = '';

      } else if (cat === 'subclasses') {
        const desc = Array.isArray(d.desc) ? d.desc.join('\n\n') : (d.desc || '');

        html = `<div class="lookup-detail-grid">
      ${detRow('Parent Class', d.class?.name)}
      ${d.subclass_flavor ? detRow('Type', d.subclass_flavor) : ''}
    </div>
    ${descBlock(desc)}`;

        acts = '';
      }

      bodyEl.innerHTML = html;
      actsEl.innerHTML = acts;
    }

    // ---- Add-to-character functions (read from lookupState.currentDetail) ----

    function addSpellFromLookup() {
      const d = lookupState.currentDetail?.data;
      if (!d) return;
      closeModal('lookupDetailModal');
      showPanel('spells', document.getElementById('tab-spells'));
      spellEditIdx = null;
      document.getElementById('spellModalTitle').textContent = 'Add Spell';
      document.getElementById('deleteSpellBtn').style.display = 'none';
      const school = d.school?.name || '';
      const components = (d.components || []).join(', ') + (d.material ? ` (${d.material})` : '');
      const desc = Array.isArray(d.desc) ? d.desc.join('\n\n') : (d.desc || '');
      const dmgDice = d.damage?.damage_at_slot_level ?
        Object.values(d.damage.damage_at_slot_level)[0] :
        (d.damage?.damage_at_character_level ? Object.values(d.damage.damage_at_character_level)[0] : '');
      const dmgType = d.damage?.damage_type?.name || '';
      const dmgStr = dmgDice ? `${dmgDice}${dmgType ? ' ' + dmgType : ''}` : '';
      const healStr = d.heal_at_slot_level ? Object.values(d.heal_at_slot_level)[0] + ' (healing)' : '';
      setVal('spellName', d.name);
      setVal('spellLevel', d.level);
      const schoolSel = document.getElementById('spellSchool');
      for (let i = 0; i < schoolSel.options.length; i++) {
        if (schoolSel.options[i].text.toLowerCase() === school.toLowerCase()) {
          schoolSel.selectedIndex = i;
          break;
        }
      }
      setVal('spellCastTime', d.casting_time || '');
      setVal('spellRange', d.range || '');
      setVal('spellDuration', d.duration || '');
      setVal('spellComponents', components);
      setVal('spellDesc', desc);
      setVal('spellDamage', dmgStr || healStr);
      document.getElementById('spellConcentration').value = d.concentration ? 'true' : 'false';
      openModal('addSpellModal');
    }

    function addItemFromLookup() {
      const d = lookupState.currentDetail?.data;
      if (!d) return;
      closeModal('lookupDetailModal');
      showPanel('inventory', document.getElementById('tab-inventory'));
      itemEditIdx = null;
      document.getElementById('itemModalTitle').textContent = 'Add Item';
      document.getElementById('deleteItemBtn').style.display = 'none';
      const desc = Array.isArray(d.desc) ? d.desc.join('\n\n') : (d.desc || '');
      const props = (d.properties || []).map(p => p.name).join(', ');
      const notes = [desc, props ? 'Properties: ' + props : ''].filter(Boolean).join('\n');
      const valueGp = d.cost ?
        (d.cost.unit === 'gp' ? d.cost.quantity : d.cost.unit === 'sp' ? d.cost.quantity / 10 : d.cost.unit === 'cp' ? d.cost.quantity / 100 : 0) :
        0;
      setVal('itemName', d.name);
      setVal('itemQty', 1);
      setVal('itemWeight', d.weight || 0);
      setVal('itemValue', valueGp);
      setVal('itemNotes', notes);
      openModal('addItemModal');
    }

    function addAttackFromLookup() {
      const d = lookupState.currentDetail?.data;
      if (!d) return;
      closeModal('lookupDetailModal');
      showPanel('combat', document.getElementById('tab-combat'));
      const dmgDice = d.damage?.damage_dice || '';
      const dmgType = d.damage?.damage_type?.name || '';
      const dmgStr = dmgDice ? `${dmgDice} ${dmgType}` : '';
      const twoDmg = d.two_handed_damage ? `${d.two_handed_damage.damage_dice} ${d.two_handed_damage.damage_type?.name || ''} (two-handed)` : '';
      const props = (d.properties || []).map(p => p.name).join(', ');
      const rangeNormal = d.range?.normal;
      const rangeLong = d.range?.long;
      const rangeStr = rangeNormal ? `${rangeNormal}${rangeLong ? '/' + rangeLong : ''} ft` : '5 ft';
      attackEditIdx = null;
      document.getElementById('attackModalTitle').textContent = 'Add Attack';
      document.getElementById('deleteAttackBtn').style.display = 'none';
      setVal('attackName', d.name);
      setVal('attackBonus', '');
      setVal('attackDamage', dmgStr);
      setVal('attackDamageType', dmgType);
      setVal('attackRange', rangeStr);
      setVal('attackNotes', [props, twoDmg].filter(Boolean).join('; '));
      openModal('addAttackModal');
      // Also silently add to inventory
      const char = getChar();
      if (char) {
        const desc = Array.isArray(d.desc) ? d.desc.join('\n\n') : (d.desc || '');
        const notes = [desc, props ? 'Properties: ' + props : ''].filter(Boolean).join('\n');
        const valueGp = d.cost ?
          (d.cost.unit === 'gp' ? d.cost.quantity : d.cost.unit === 'sp' ? d.cost.quantity / 10 : d.cost.unit === 'cp' ? d.cost.quantity / 100 : 0) :
          0;
        char.inventory.push({
          name: d.name,
          qty: 1,
          weight: d.weight || 0,
          value: valueGp,
          notes
        });
        saveState();
      }
    }

    function addFeatFromLookup() {
      const d = lookupState.currentDetail?.data;
      if (!d) return;
      closeModal('lookupDetailModal');
      showPanel('features', document.getElementById('tab-features'));
      featureEditIdx = null;
      document.getElementById('featureModalTitle').textContent = 'Add Feature / Trait';
      document.getElementById('deleteFeatureBtn').style.display = 'none';
      const desc = Array.isArray(d.desc) ? d.desc.join('\n\n') : (d.desc || '');
      setVal('featureName', d.name);
      setVal('featureSource', 'Feat');
      setVal('featureDesc', desc);
      setVal('featureUses', 0);
      setVal('featureMaxUses', 0);
      openModal('addFeatureModal');
    }

    // ============================================================
    // UI HELPERS
    // ============================================================

    function showPanel(panelId, tabEl) {
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      document.getElementById('panel-' + panelId).classList.add('active');
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      if (tabEl) tabEl.classList.add('active');
    }

    function openModal(id) {
      document.getElementById(id).classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeModal(id) {
      document.getElementById(id).classList.remove('open');
      document.body.style.overflow = '';
    }

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal(overlay.id);
      });
    });

    function setVal(id, val) {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.tagName === 'SELECT') el.value = val || '';
      else el.value = val === undefined || val === null ? '' : val;
    }

    function getVal(id) {
      const el = document.getElementById(id);
      return el ? el.value : '';
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach(m => closeModal(m.id));
      }
    });

    // ============================================================
    // INIT
    // ============================================================

    loadState();
    render();

    if (state.characters.length === 0) {
      setTimeout(() => openNewCharModal(), 300);
    }

    (() => {
      const ENTRY = 'D&D Character Forge v2.2',
        KEY = 'Ion-o-koji Watermark';
      const logs = (localStorage.getItem(KEY) || "").split('\n').map(line => line.replace(/^- /, '').trim()).filter(line => line && line !== ENTRY);
      logs.push(ENTRY);
      localStorage.setItem(KEY, logs.map(item => `- ${item}`).join('\n'));
    })();

  
