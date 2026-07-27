
    // UTIL
    const r = a => a[Math.floor(Math.random() * a.length)];

    /* DICE */
    function roll() {
      let m = diceIn.value.match(/(\d+)d(\d+)([+-]\d+)?/);
      if (!m) {
        diceOut.textContent = "Invalid dice.";
        return;
      }
      let t = 0,
        res = [];
      for (let i = 0; i < m[1]; i++) {
        let x = 1 + Math.random() * m[2] | 0;
        res.push(x);
        t += x;
      }
      if (m[3]) t += +m[3];
      diceOut.textContent = `[${res.join(", ")}] = ${t}`;
    }

    /* ---------- NPC GENERATOR (EXPANDED) ---------- */

    const npcNames = [
      "Alric", "Nyssa", "Borin", "Elowen", "Keth", "Maribel", "Thorne", "Ilyra",
      "Vask", "Seraphine", "Dorn", "Mira", "Halvek", "Ysabel"
    ];

    const npcRaces = [
      "Human", "Elf", "Dwarf", "Halfling", "Tiefling", "Half-Orc", "Gnome"
    ];

    const npcAges = [
      "young", "middle-aged", "elderly", "weathered", "surprisingly youthful"
    ];

    const npcJobs = [
      "merchant", "soldier", "priest", "scribe", "smuggler", "innkeeper",
      "noble retainer", "apprentice mage", "hunter", "criminal fixer"
    ];

    const npcStatus = [
      "respected", "ignored", "feared", "secretly powerful", "barely surviving",
      "well-connected", "in debt"
    ];

    const npcTraits = [
      "charming", "bitter", "nervous", "arrogant", "soft-spoken", "hot-tempered",
      "idealistic", "suspicious", "world-weary", "earnest"
    ];

    const npcDesires = [
      "to protect their family",
      "to gain political power",
      "to escape their past",
      "to prove themselves",
      "to uncover forbidden knowledge",
      "to destroy a rival"
    ];

    const npcFears = [
      "being exposed",
      "losing someone they love",
      "divine punishment",
      "financial ruin",
      "violent retribution",
      "their own corruption"
    ];

    const npcRelationships = [
      "owes money to a dangerous group",
      "is secretly helping a rival faction",
      "has history with a party member",
      "is being blackmailed",
      "is under magical influence",
      "is protecting someone guilty"
    ];

    const npcSecrets = [
      "is a cult member",
      "committed a serious crime",
      "is not who they claim to be",
      "is magically cursed",
      "is a spy",
      "caused a past tragedy"
    ];

    const npcSecretSeverity = [
      "minor but embarrassing",
      "dangerous if revealed",
      "life-destroying",
      "could start a war"
    ];

    function npc() {
      npcOut.innerHTML = `
    <b>${r(npcNames)}</b>, a ${r(npcAges)} ${r(npcRaces)} ${r(npcJobs)}<br>
    Status: ${r(npcStatus)}<br>
    Personality: ${r(npcTraits)} & ${r(npcTraits)}<br>
    Wants: ${r(npcDesires)}<br>
    Fears: ${r(npcFears)}<br>
    Relationship: ${r(npcRelationships)}<br>
    <b>Secret:</b> ${r(npcSecrets)} (${r(npcSecretSeverity)})
  `;
    }

    /* ---------- ENCOUNTER GENERATOR (EXPANDED) ---------- */

    const encounterLocations = [
      "forest trail", "mountain pass", "abandoned village", "busy market",
      "ancient ruins", "tavern", "sewers", "roadside shrine", "city alley"
    ];

    const encounterSituations = [
      "an ambush in progress",
      "a tense standoff",
      "the aftermath of violence",
      "a negotiation gone wrong",
      "a ritual being performed",
      "creatures feeding or resting"
    ];

    const encounterEnemies = {
      Easy: [
        "desperate bandits", "hungry wolves", "panicked cultists",
        "street thugs", "territorial goblins"
      ],
      Medium: [
        "organized mercenaries", "ghouls", "fanatical cult enforcers",
        "ogre muscle", "trained monster handlers"
      ],
      Hard: [
        "veteran assassins", "wights", "trolls",
        "elite guards", "monstrous predators"
      ],
      Deadly: [
        "young dragon", "necromancer with guards",
        "demonic emissary", "war mage and escorts"
      ]
    };

    const encounterComplications = [
      "hazardous terrain",
      "civilians caught in the middle",
      "poor visibility",
      "unstable structures",
      "time pressure"
    ];

    const encounterTwists = [
      "one enemy wants to surrender",
      "the enemies are being coerced",
      "reinforcements will arrive",
      "the real threat escapes",
      "the situation isn’t what it seems"
    ];

    const encounterResolutions = [
      "bribery or negotiation could end this",
      "a show of force may scatter them",
      "clever deception avoids combat",
      "helping them changes the outcome",
      "combat is the worst option"
    ];

    function encounter() {
      encOut.innerHTML = `
    <b>Location:</b> ${r(encounterLocations)}<br>
    <b>Situation:</b> ${r(encounterSituations)}<br>
    <b>Opposition:</b> ${r(encounterEnemies[encDiff.value])}<br>
    <b>Complication:</b> ${r(encounterComplications)}<br>
    <b>Twist:</b> ${r(encounterTwists)}<br>
    <b>Alternate Resolution:</b> ${r(encounterResolutions)}
  `;
    }

    /* INIT */
    let init = [];

    function addInit() {
      if (!iName.value || !iVal.value) return;
      init.push({
        n: iName.value,
        v: +iVal.value
      });
      init.sort((a, b) => b.v - a.v);
      initList.innerHTML = init.map(x => `<li>${x.n} (${x.v})</li>`).join("");
    }

    /* HP */
    let hps = [];

    function addHP() {
      if (!hpName.value || !hpMax.value) return;
      hps.push({
        n: hpName.value,
        m: +hpMax.value,
        c: +hpMax.value
      });
      renderHP();
    }

    function renderHP() {
      hpList.innerHTML = "";
      hps.forEach((h, i) => {
        hpList.innerHTML +=
          `<li>${h.n}: ${h.c}/${h.m}
   <span class="hp-btn" onclick="hps[${i}].c--;renderHP()">−</span>
   <span class="hp-btn" onclick="hps[${i}].c++;renderHP()">+</span></li>`;
      });
    }

    /* LOOKUP */
    async function lookup() {
      let q = lookupQuery.value.trim();
      const type = lookupType.value;
      if (!q) return;

      let exact = false;
      const quoteMatch = q.match(/^"(.*)"$/);
      if (quoteMatch) {
        q = quoteMatch[1];
        exact = true;
      }

      lookupOut.innerHTML = "Loading…";

      try {
        const list = await fetch(`https://www.dnd5eapi.co/api/${type}`).then(r => r.json());
        let item;
        if (exact) item = list.results.find(x => x.name.toLowerCase() === q.toLowerCase());
        else item = list.results.find(x => x.name.toLowerCase().includes(q.toLowerCase()));
        if (!item) {
          lookupOut.innerHTML = "No result.";
          return;
        }
        const d = await fetch(`https://www.dnd5eapi.co${item.url}`).then(r => r.json());

        // SPELLS
        if (type === "spells") {
          lookupOut.innerHTML =
            `<b>${d.name}</b> (Level ${d.level} ${d.school.name})<br>
      <b>Casting:</b> ${d.casting_time}<br>
      <b>Range:</b> ${d.range}<br>
      <b>Components:</b> ${d.components.join(", ")} ${d.material||""}<br>
      <b>Duration:</b> ${d.duration}<br><br>
      ${d.desc.join("<br><br>")}
      ${d.higher_level?`<br><br><b>At Higher Levels:</b><br>${d.higher_level.join("<br>")}`:""}`;
        }

        // EQUIPMENT / WEAPONS
        if (type === "equipment") {
          lookupOut.innerHTML =
            `<b>${d.name}</b><br>
      Category: ${d.equipment_category.name}<br>
      Cost: ${d.cost?.quantity||"-"} ${d.cost?.unit||""}<br>
      Weight: ${d.weight||"-"}<br>
      Damage: ${d.damage?`${d.damage.damage_dice} ${d.damage.damage_type.name}`:"—"}<br>
      Properties: ${(d.properties||[]).map(p=>p.name).join(", ")}`;
        }

        // MAGIC ITEMS
        if (type === "magic-items") {
          // Try exact first
          let exactUrl = `https://api.open5e.com/magicitems/?search=${encodeURIComponent(q)}`;
          let exactData = await fetch(exactUrl).then(r => r.json());
          let result = exactData.results.find(x => x.name.toLowerCase() === q.toLowerCase());

          // If no exact, try partial
          if (!result && !quoteMatch) {
            result = exactData.results[0];
          }
          if (!result) {
            lookupOut.innerHTML = "No magic item found.";
            return;
          }

          lookupOut.innerHTML = `
    <b>${result.name}</b><br>
    Rarity: ${result.rarity || "Unknown"}<br>
    Attunement: ${result.attunement || "No"}<br><br>
    ${result.desc || "No description available"}
  `;
          return;
        }

        // MONSTERS / NPCs
        if (type === "monsters") {
          lookupOut.innerHTML =
            `<b>${d.name}</b><br>
      AC ${d.armor_class[0].value} | HP ${d.hit_points}<br>
      <div class="stat">
      <div>STR ${d.strength}</div><div>DEX ${d.dexterity}</div><div>CON ${d.constitution}</div>
      <div>INT ${d.intelligence}</div><div>WIS ${d.wisdom}</div><div>CHA ${d.charisma}</div>
      </div>
      <b>Actions</b><br>${(d.actions||[]).map(a=>`<b>${a.name}:</b> ${a.desc}`).join("<br><br>")}`;
        }

        // CONDITIONS / RULES
        if (type === "conditions" || type === "rules") {
          lookupOut.innerHTML = `<b>${d.name}</b><br><br>${(d.desc||[]).join("<br><br>")}`;
        }

      } catch (err) {
        lookupOut.innerHTML = "Failed to fetch data.";
        console.error(err);
      }
    }

    (() => {
      const ENTRY = 'DM Assistant v2',
        KEY = 'Ion-o-koji Watermark';
      const logs = (localStorage.getItem(KEY) || "").split('\n').map(line => line.replace(/^- /, '').trim()).filter(line => line && line !== ENTRY);
      logs.push(ENTRY);
      localStorage.setItem(KEY, logs.map(item => `- ${item}`).join('\n'));
    })();

  
