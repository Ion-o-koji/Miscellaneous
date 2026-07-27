
    const FIREBASE_ENABLED = true;
    window._fbReady = false;
    window._fbInitError = null;

  

    import {
      initializeApp
    } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
    import {
      getAnalytics
    } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";
    import {
      getDatabase,
      ref,
      set,
      get,
      onValue,
      remove,
      serverTimestamp
    } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

    const firebaseConfig = {
      apiKey: "",
      authDomain: "delve-65f2c.firebaseapp.com",
      databaseURL: "https://delve-65f2c-default-rtdb.firebaseio.com",
      projectId: "delve-65f2c",
      storageBucket: "delve-65f2c.firebasestorage.app",
      messagingSenderId: "303378998797",
      appId: "1:303378998797:web:55f64d54958ae57029d744",
      measurementId: "G-V1SCXHH62J"
    };

    try {
      const app = initializeApp(firebaseConfig);
      try {
        getAnalytics(app);
      } catch (e) {}
      const db = getDatabase(app);

      window._fbSet = (path, data) => set(ref(db, path), data);
      window._fbGet = (path) => get(ref(db, path));
      window._fbOnValue = (path, cb) => onValue(ref(db, path), cb);
      window._fbRemove = (path) => remove(ref(db, path));
      window._fbServerTimestamp = () => serverTimestamp();

      window._fbCheckConnected = (timeoutMs = 6000) => new Promise(resolve => {
        let unsub = null;
        const timer = setTimeout(() => {
          try {
            if (unsub) unsub();
          } catch (_) {}
          resolve(false);
        }, timeoutMs);
        unsub = onValue(ref(db, '.info/connected'), snap => {
          if (snap.val() === true) {
            clearTimeout(timer);
            try {
              if (unsub) unsub();
            } catch (_) {}
            resolve(true);
          }
        });
      });

      window._fbReady = true;
      document.dispatchEvent(new Event('firebase-ready'));
      console.log('[Delve] Firebase initialized successfully');
    } catch (err) {
      window._fbInitError = err.message;
      console.error('[Delve] Firebase init error:', err);
      document.dispatchEvent(new CustomEvent('firebase-error', {
        detail: err
      }));
    }

  

    "use strict";

    /* ═══ CONSTANTS ═══ */
    const CELL_SIZE = 40;
    const FEET_PER_CELL = 5;
    const MIN_ZOOM = 0.15;
    const MAX_ZOOM = 5.0;
    let SUBPIXEL_DIV = 8;

    const TILE_TYPES = {
      empty: {
        label: 'Empty',
        color: null,
        walkable: false
      },
      floor: {
        label: 'Floor',
        color: '#2e2c2a',
        walkable: true
      },
      wall: {
        label: 'Wall',
        color: '#4a4540',
        walkable: false
      },
      door: {
        label: 'Door',
        color: '#7a5c3a',
        walkable: true
      },
      water: {
        label: 'Water',
        color: '#1a3a5c',
        walkable: false
      },
      grass: {
        label: 'Grass',
        color: '#2a4a22',
        walkable: true
      },
      stone: {
        label: 'Stone',
        color: '#3a3835',
        walkable: true
      },
      sand: {
        label: 'Sand',
        color: '#b8a06a',
        walkable: true
      },
      lava: {
        label: 'Lava',
        color: '#8a2200',
        walkable: false
      },
      ice: {
        label: 'Ice',
        color: '#9dd4e8',
        walkable: true
      },
      wood: {
        label: 'Wood Floor',
        color: '#6b4226',
        walkable: true
      },
      swamp: {
        label: 'Swamp',
        color: '#2d4020',
        walkable: false
      },
      mud: {
        label: 'Mud',
        color: '#5c3d1e',
        walkable: true
      },
      cavern: {
        label: 'Deep Cavern',
        color: '#0e0b10',
        walkable: false
      },
      marble: {
        label: 'Marble',
        color: '#c4bfbb',
        walkable: true
      },
      crystal: {
        label: 'Crystal',
        color: '#6ac8e0',
        walkable: false
      },
      ash: {
        label: 'Ash',
        color: '#7a7672',
        walkable: true
      },
      cobble: {
        label: 'Cobblestone',
        color: '#4a4745',
        walkable: true
      },
      obsidian: {
        label: 'Obsidian',
        color: '#14100e',
        walkable: false
      },
      blood: {
        label: 'Blood',
        color: '#6a1010',
        walkable: false
      },
      arcane: {
        label: 'Arcane',
        color: '#28184a',
        walkable: true
      },
    };
    const TILE_IDX = ['empty', 'floor', 'wall', 'door', 'water', 'grass', 'stone', 'sand', 'lava', 'ice', 'wood', 'swamp', 'mud', 'cavern', 'marble', 'crystal', 'ash', 'cobble', 'obsidian', 'blood', 'arcane'];

    const TOKEN_COLORS = [
      '#e04040', '#e07040', '#e0c040', '#40b840',
      '#40a0e0', '#8040e0', '#e040a0', '#a0a0a0',
      '#ffffff', '#60c090',
    ];

    const BG_STYLES = {
      dungeon: {
        base: '#1a1815',
        grid: 'rgba(80,70,60,0.25)',
        accent: '#252220'
      },
      outdoor: {
        base: '#1c2218',
        grid: 'rgba(60,80,50,0.25)',
        accent: '#22281c'
      },
      cave: {
        base: '#141216',
        grid: 'rgba(60,50,70,0.25)',
        accent: '#1a1620'
      },
      void: {
        base: '#080808',
        grid: 'rgba(40,40,40,0.2)',
        accent: '#101010'
      },
      forest: {
        base: '#0d1a0e',
        grid: 'rgba(40,80,30,0.3)',
        accent: '#111f12'
      },
      desert: {
        base: '#1e1a0e',
        grid: 'rgba(100,80,30,0.3)',
        accent: '#241f10'
      },
      arctic: {
        base: '#12181f',
        grid: 'rgba(120,160,200,0.25)',
        accent: '#161e26'
      },
      lava: {
        base: '#1a0a00',
        grid: 'rgba(150,50,10,0.3)',
        accent: '#220e00'
      },
      ocean: {
        base: '#030d1a',
        grid: 'rgba(20,60,120,0.3)',
        accent: '#051220'
      },
      purple: {
        base: '#100c1a',
        grid: 'rgba(80,40,140,0.3)',
        accent: '#160f22'
      },
      blood: {
        base: '#140505',
        grid: 'rgba(100,20,20,0.3)',
        accent: '#1c0808'
      },
      marble: {
        base: '#1a1a1e',
        grid: 'rgba(140,130,150,0.25)',
        accent: '#222228'
      },
    };

    function _drawTileDetail(ctx, name, cx, cy, cs) {
      const n1 = ((cx * 17 + cy * 13) % 100) / 100,
        n2 = ((cx * 7 + cy * 23) % 100) / 100,
        n3 = ((cx * 31 + cy * 11) % 100) / 100;
      if (name === 'floor') {
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 0.7;
        const vx = cx + cs * (0.4 + n1 * 0.22),
          hy = cy + cs * (0.4 + n2 * 0.22);
        ctx.beginPath();
        ctx.moveTo(vx, cy + 1);
        ctx.lineTo(vx, cy + cs - 1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 1, hy);
        ctx.lineTo(cx + cs - 1, hy);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(cx + 1, cy + 1);
        ctx.lineTo(cx + cs - 2, cy + 1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 1, cy + 1);
        ctx.lineTo(cx + 1, cy + cs - 2);
        ctx.stroke();
      } else if (name === 'wall') {
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + cs, cy);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx, cy + cs);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx + cs, cy);
        ctx.lineTo(cx + cs, cy + cs);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, cy + cs);
        ctx.lineTo(cx + cs, cy + cs);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 0.7;
        const mory = cy + cs * (n1 > 0.5 ? 0.45 : 0.55);
        ctx.beginPath();
        ctx.moveTo(cx, mory);
        ctx.lineTo(cx + cs, mory);
        ctx.stroke();
        const morx = cx + cs * (n2 > 0.5 ? 0.28 : 0.62);
        ctx.beginPath();
        ctx.moveTo(morx, n1 > 0.5 ? cy : mory);
        ctx.lineTo(morx, n1 > 0.5 ? mory : cy + cs);
        ctx.stroke();
      } else if (name === 'door') {
        const fi = cs * 0.12;
        ctx.strokeStyle = 'rgba(50,28,8,0.75)';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(cx + fi, cy + fi, cs - fi * 2, cs - fi * 2);
        ctx.strokeStyle = 'rgba(80,45,12,0.5)';
        ctx.lineWidth = 0.7;
        for (let p = 1; p < 3; p++) {
          const py = cy + fi + (cs - fi * 2) * p / 3;
          ctx.beginPath();
          ctx.moveTo(cx + fi + 1, py);
          ctx.lineTo(cx + cs - fi - 1, py);
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(185,145,55,0.85)';
        ctx.beginPath();
        ctx.arc(cx + cs * 0.73, cy + cs * 0.5, cs * 0.07, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(130,115,80,0.65)';
        ctx.fillRect(cx + fi + 1, cy + cs * 0.22, cs * 0.09, cs * 0.11);
        ctx.fillRect(cx + fi + 1, cy + cs * 0.67, cs * 0.09, cs * 0.11);
      } else if (name === 'water') {
        ctx.strokeStyle = 'rgba(120,195,245,0.45)';
        ctx.lineWidth = 0.9;
        const wy1 = cy + cs * (0.28 + n1 * 0.08),
          wy2 = cy + cs * (0.52 + n2 * 0.08),
          wy3 = cy + cs * (0.72 + n3 * 0.06);
        ctx.beginPath();
        ctx.moveTo(cx + 2, wy1);
        ctx.quadraticCurveTo(cx + cs * 0.35, wy1 - cs * 0.07, cx + cs * 0.68, wy1);
        ctx.quadraticCurveTo(cx + cs * 0.84, wy1 + cs * 0.05, cx + cs - 2, wy1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 3, wy2);
        ctx.quadraticCurveTo(cx + cs * 0.42, wy2 + cs * 0.08, cx + cs * 0.76, wy2);
        ctx.quadraticCurveTo(cx + cs * 0.88, wy2 - cs * 0.04, cx + cs - 3, wy2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(180,225,255,0.22)';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(cx + 4, wy3);
        ctx.quadraticCurveTo(cx + cs * 0.5, wy3 - cs * 0.05, cx + cs - 4, wy3);
        ctx.stroke();
        ctx.fillStyle = 'rgba(200,238,255,0.09)';
        ctx.fillRect(cx + cs * 0.15, cy + cs * 0.1, cs * 0.28, cs * 0.13);
      } else if (name === 'grass') {
        ctx.strokeStyle = 'rgba(80,165,50,0.6)';
        ctx.lineWidth = 0.8;
        [
          [0.18, 0.7, 0.12, 0.38],
          [0.35, 0.65, 0.3, 0.32],
          [0.55, 0.72, 0.52, 0.4],
          [0.72, 0.67, 0.78, 0.36],
          [0.28, 0.82, 0.23, 0.5],
          [0.82, 0.76, 0.88, 0.44],
          [0.48, 0.86, 0.46, 0.54],
          [0.62, 0.55, 0.68, 0.28]
        ].forEach(([bx, by, tx, ty]) => {
          ctx.beginPath();
          ctx.moveTo(cx + cs * bx, cy + cs * by);
          ctx.lineTo(cx + cs * tx, cy + cs * ty);
          ctx.stroke();
        });
        ctx.fillStyle = n1 > 0.55 ? 'rgba(55,125,28,0.2)' : 'rgba(95,175,55,0.15)';
        ctx.fillRect(cx, cy, cs * 0.5, cs);
      } else if (name === 'stone') {
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.lineWidth = 0.8;
        const sx = cx + cs * (0.32 + n1 * 0.32),
          sy = cy + cs * (0.32 + n2 * 0.32);
        ctx.beginPath();
        ctx.moveTo(cx, sy);
        ctx.lineTo(sx, sy);
        ctx.lineTo(sx, cy);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(sx, cy + cs);
        ctx.lineTo(sx, sy);
        ctx.lineTo(cx + cs, sy);
        ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(cx + cs * 0.15, cy + cs * 0.18, 2, 2);
        ctx.fillRect(cx + cs * 0.65, cy + cs * 0.72, 2, 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(cx + 1, cy + 1);
        ctx.lineTo(cx + cs - 2, cy + 1);
        ctx.stroke();
      } else if (name === 'sand') {
        ctx.strokeStyle = 'rgba(200,170,80,0.38)';
        ctx.lineWidth = 0.8;
        const ry1 = cy + cs * (0.28 + n1 * 0.16),
          ry2 = cy + cs * (0.56 + n2 * 0.14);
        ctx.beginPath();
        ctx.moveTo(cx + 3, ry1);
        ctx.quadraticCurveTo(cx + cs * 0.5, ry1 + cs * 0.13, cx + cs - 3, ry1 + cs * 0.04);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 2, ry2);
        ctx.quadraticCurveTo(cx + cs * 0.5, ry2 - cs * 0.11, cx + cs - 2, ry2 + cs * 0.03);
        ctx.stroke();
        ctx.fillStyle = 'rgba(165,132,50,0.28)';
        ctx.fillRect(cx + cs * 0.4, cy + cs * 0.72, 2, 2);
        ctx.fillRect(cx + cs * 0.72, cy + cs * 0.3, 2, 2);
      } else if (name === 'lava') {
        ctx.strokeStyle = 'rgba(255,110,5,0.7)';
        ctx.lineWidth = 1;
        const lx = cx + cs * (0.28 + n1 * 0.42),
          ly = cy + cs * (0.28 + n2 * 0.42);
        ctx.beginPath();
        ctx.moveTo(cx + cs * 0.5, cy + 2);
        ctx.lineTo(lx, ly);
        ctx.lineTo(cx + cs - 2, cy + cs - 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 2, cy + cs * 0.6);
        ctx.lineTo(lx, ly);
        ctx.lineTo(cx + cs * 0.68, cy + cs - 2);
        ctx.stroke();
        const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, cs * 0.45);
        grad.addColorStop(0, 'rgba(255,210,0,0.38)');
        grad.addColorStop(1, 'rgba(220,60,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(cx, cy, cs, cs);
      } else if (name === 'ice') {
        const icx = cx + cs * 0.5,
          icy = cy + cs * 0.5,
          ir = cs * 0.36;
        ctx.strokeStyle = 'rgba(185,238,255,0.58)';
        ctx.lineWidth = 0.8;
        for (let a = 0; a < 6; a++) {
          const angle = (a / 6) * Math.PI * 2 + n1 * 0.5;
          const ex = icx + Math.cos(angle) * ir,
            ey = icy + Math.sin(angle) * ir;
          ctx.beginPath();
          ctx.moveTo(icx, icy);
          ctx.lineTo(ex, ey);
          ctx.stroke();
          const ba = angle + Math.PI / 6,
            bl = ir * 0.4;
          const bx2 = icx + Math.cos(angle) * (ir * 0.55),
            by2 = icy + Math.sin(angle) * (ir * 0.55);
          ctx.beginPath();
          ctx.moveTo(bx2, by2);
          ctx.lineTo(bx2 + Math.cos(ba) * bl, by2 + Math.sin(ba) * bl);
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(225,248,255,0.65)';
        ctx.beginPath();
        ctx.arc(icx, icy, 2.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (name === 'wood') {
        ctx.strokeStyle = 'rgba(48,26,7,0.38)';
        ctx.lineWidth = 0.8;
        const px1 = cx + cs * (0.3 + n1 * 0.1),
          px2 = cx + cs * (0.6 + n2 * 0.1);
        ctx.beginPath();
        ctx.moveTo(px1, cy + 1);
        ctx.lineTo(px1, cy + cs - 1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(px2, cy + 1);
        ctx.lineTo(px2, cy + cs - 1);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(48,24,5,0.18)';
        ctx.lineWidth = 0.5;
        for (let g = 1; g < 4; g++) {
          const gy = cy + cs * g / 4;
          ctx.beginPath();
          ctx.moveTo(cx + 1, gy);
          ctx.lineTo(cx + cs - 1, gy);
          ctx.stroke();
        }
        if (n3 < 0.4) {
          ctx.strokeStyle = 'rgba(38,20,4,0.42)';
          ctx.lineWidth = 0.8;
          const kx = cx + cs * (0.44 + n1 * 0.2),
            ky = cy + cs * (0.38 + n2 * 0.22);
          ctx.beginPath();
          ctx.ellipse(kx, ky, cs * 0.09, cs * 0.065, n1, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (name === 'swamp') {
        ctx.fillStyle = 'rgba(28,52,8,0.42)';
        ctx.beginPath();
        ctx.ellipse(cx + cs * 0.34, cy + cs * 0.6, cs * 0.3, cs * 0.19, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(18,38,6,0.32)';
        ctx.beginPath();
        ctx.ellipse(cx + cs * 0.72, cy + cs * 0.28, cs * 0.22, cs * 0.15, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(105,165,58,0.52)';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.arc(cx + cs * 0.5, cy + cs * 0.56, cs * 0.055, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx + cs * 0.24, cy + cs * 0.4, cs * 0.038, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(78,118,28,0.52)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(cx + cs * 0.78, cy + cs * 0.86);
        ctx.lineTo(cx + cs * 0.76, cy + cs * 0.18);
        ctx.stroke();
      } else if (name === 'mud') {
        ctx.fillStyle = 'rgba(38,18,4,0.32)';
        ctx.beginPath();
        ctx.ellipse(cx + cs * 0.38, cy + cs * 0.44, cs * 0.24, cs * 0.16, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + cs * 0.66, cy + cs * 0.72, cs * 0.19, cs * 0.13, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(28,14,4,0.42)';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(cx + cs * 0.18, cy + cs * 0.28);
        ctx.lineTo(cx + cs * 0.54, cy + cs * 0.5);
        ctx.lineTo(cx + cs * 0.82, cy + cs * 0.38);
        ctx.stroke();
      } else if (name === 'cavern') {
        ctx.strokeStyle = 'rgba(75,55,88,0.45)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(cx + cs * 0.1, cy + cs * 0.18);
        ctx.lineTo(cx + cs * 0.42, cy + cs * 0.5);
        ctx.lineTo(cx + cs * 0.2, cy + cs * 0.84);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + cs * 0.62, cy + cs * 0.08);
        ctx.lineTo(cx + cs * 0.82, cy + cs * 0.42);
        ctx.lineTo(cx + cs * 0.65, cy + cs * 0.92);
        ctx.stroke();
        ctx.fillStyle = 'rgba(68,52,78,0.22)';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + cs * 0.5, cy + cs * 0.32);
        ctx.lineTo(cx + cs * 0.28, cy + cs * 0.52);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(95,72,112,0.16)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(cx + 1, cy + 1);
        ctx.lineTo(cx + cs * 0.82, cy + 1);
        ctx.stroke();
      } else if (name === 'marble') {
        ctx.strokeStyle = 'rgba(180,170,165,0.35)';
        ctx.lineWidth = 0.7;
        const mx1 = cx + cs * (0.2 + n1 * 0.3),
          mx2 = cx + cs * (0.55 + n2 * 0.25);
        ctx.beginPath();
        ctx.moveTo(mx1, cy + 1);
        ctx.bezierCurveTo(mx1 + cs * 0.12, cy + cs * 0.4, mx1 - cs * 0.08, cy + cs * 0.6, mx1 + cs * 0.06, cy + cs - 1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(mx2, cy + 1);
        ctx.bezierCurveTo(mx2 - cs * 0.1, cy + cs * 0.35, mx2 + cs * 0.1, cy + cs * 0.65, mx2 - cs * 0.05, cy + cs - 1);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(cx + 1, cy + 1);
        ctx.lineTo(cx + cs - 2, cy + 1);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(cx, cy, cs * 0.5, cs * 0.5);
      } else if (name === 'crystal') {
        const ccx = cx + cs * 0.5,
          ccy = cy + cs * 0.5;
        ctx.strokeStyle = 'rgba(180,240,255,0.6)';
        ctx.lineWidth = 0.8;
        const pts = [
          [0.5, 0.1],
          [0.85, 0.38],
          [0.72, 0.9],
          [0.28, 0.9],
          [0.15, 0.38]
        ];
        ctx.beginPath();
        pts.forEach(([px, py], i) => {
          if (i === 0) ctx.moveTo(cx + cs * px, cy + cs * py);
          else ctx.lineTo(cx + cs * px, cy + cs * py);
        });
        ctx.closePath();
        ctx.stroke();
        ctx.strokeStyle = 'rgba(220,250,255,0.35)';
        ctx.lineWidth = 0.5;
        pts.forEach(([px, py]) => {
          ctx.beginPath();
          ctx.moveTo(ccx, ccy);
          ctx.lineTo(cx + cs * px, cy + cs * py);
          ctx.stroke();
        });
        const grad = ctx.createRadialGradient(ccx, ccy, 0, ccx, ccy, cs * 0.4);
        grad.addColorStop(0, 'rgba(200,245,255,0.28)');
        grad.addColorStop(1, 'rgba(80,200,240,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(cx, cy, cs, cs);
      } else if (name === 'ash') {
        ctx.fillStyle = 'rgba(80,75,72,0.22)';
        ctx.beginPath();
        ctx.ellipse(cx + cs * (0.3 + n1 * 0.2), cy + cs * (0.4 + n2 * 0.2), cs * 0.28, cs * 0.18, n1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(110,105,102,0.16)';
        ctx.beginPath();
        ctx.ellipse(cx + cs * (0.6 + n2 * 0.15), cy + cs * (0.6 + n3 * 0.18), cs * 0.22, cs * 0.14, n2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(140,132,128,0.25)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 3; i++) {
          const ax = cx + cs * (0.1 + n1 * 0.6 + (i * 0.25)),
            ay = cy + cs * (0.2 + n2 * 0.4 + (i * 0.22));
          ctx.beginPath();
          ctx.arc(ax, ay, 1.2, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (name === 'cobble') {
        ctx.strokeStyle = 'rgba(20,18,16,0.5)';
        ctx.lineWidth = 0.8;
        const cols = 2 + Math.round(n1),
          rows = 2 + Math.round(n2);
        const cw2 = cs / cols,
          ch2 = cs / rows;
        for (let ci = 0; ci < cols; ci++)
          for (let ri = 0; ri < rows; ri++) {
            const ox = cx + ci * cw2 + (ri % 2 === 0 ? 0 : cw2 * 0.3),
              oy = cy + ri * ch2;
            const fw = cw2 * 0.88,
              fh = ch2 * 0.84;
            ctx.strokeRect(ox + cw2 * 0.06, oy + ch2 * 0.08, fw, fh);
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fillRect(ox + cw2 * 0.06, oy + ch2 * 0.08, fw, 3);
          }
      } else if (name === 'obsidian') {
        const grad2 = ctx.createLinearGradient(cx, cy, cx + cs, cy + cs);
        grad2.addColorStop(0, 'rgba(60,40,50,0.18)');
        grad2.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad2;
        ctx.fillRect(cx, cy, cs, cs);
        ctx.strokeStyle = 'rgba(180,120,220,0.2)';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(cx + cs * (0.2 + n1 * 0.3), cy + 1);
        ctx.lineTo(cx + cs * (0.35 + n2 * 0.2), cy + cs - 1);
        ctx.stroke();
        ctx.fillStyle = 'rgba(200,150,255,0.12)';
        ctx.beginPath();
        ctx.arc(cx + cs * (0.65 + n3 * 0.2), cy + cs * (0.3 + n1 * 0.4), 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (name === 'blood') {
        ctx.fillStyle = 'rgba(80,0,0,0.28)';
        ctx.beginPath();
        ctx.ellipse(cx + cs * (0.4 + n1 * 0.2), cy + cs * (0.5 + n2 * 0.2), cs * 0.32, cs * 0.22, n1 * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(120,10,10,0.18)';
        ctx.beginPath();
        ctx.ellipse(cx + cs * (0.6 + n2 * 0.15), cy + cs * (0.3 + n3 * 0.2), cs * 0.16, cs * 0.1, n2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(200,20,20,0.22)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(cx + cs * (0.25 + n1 * 0.15), cy + cs * (0.7 + n2 * 0.1));
        ctx.lineTo(cx + cs * (0.45 + n2 * 0.1), cy + cs * 0.9);
        ctx.stroke();
      } else if (name === 'arcane') {
        const acx = cx + cs * 0.5,
          acy = cy + cs * 0.5,
          ar = cs * 0.35;
        ctx.strokeStyle = 'rgba(160,90,255,0.4)';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.arc(acx, acy, ar, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(120,60,220,0.28)';
        ctx.lineWidth = 0.5;
        for (let s = 0; s < 5; s++) {
          const a = (s / 5) * Math.PI * 2 + n1 * 0.6;
          ctx.beginPath();
          ctx.moveTo(acx, acy);
          ctx.lineTo(acx + Math.cos(a) * ar, acy + Math.sin(a) * ar);
          ctx.stroke();
        }
        const gArc = ctx.createRadialGradient(acx, acy, 0, acx, acy, ar);
        gArc.addColorStop(0, 'rgba(100,50,200,0.18)');
        gArc.addColorStop(1, 'rgba(40,10,80,0)');
        ctx.fillStyle = gArc;
        ctx.fillRect(cx, cy, cs, cs);
      }
    }

    const OBJECT_CATEGORIES = [{
        name: 'Dungeon',
        items: [{
            icon: '🗝️',
            name: 'Key',
            notes: 'A rusty iron key'
          },
          {
            icon: '🪤',
            name: 'Trap',
            notes: 'A pressure plate trap'
          },
          {
            icon: '💀',
            name: 'Remains',
            notes: 'A pile of bones'
          },
          {
            icon: '🏺',
            name: 'Urn',
            notes: 'A cracked ceramic urn'
          },
          {
            icon: '🕯️',
            name: 'Candle',
            notes: 'A flickering candle'
          },
          {
            icon: '⛓️',
            name: 'Chains',
            notes: 'Hanging iron chains'
          },
          {
            icon: '🪨',
            name: 'Boulder',
            notes: 'A heavy stone boulder'
          },
          {
            icon: '🔮',
            name: 'Orb',
            notes: 'A mysterious glowing orb'
          },
          {
            icon: '📜',
            name: 'Scroll',
            notes: 'An ancient scroll'
          },
          {
            icon: '⚗️',
            name: 'Flask',
            notes: 'A bubbling alchemical flask'
          },
          {
            icon: '🗡️',
            name: 'Weapon',
            notes: 'A discarded weapon'
          },
          {
            icon: '🛡️',
            name: 'Shield',
            notes: 'A dented shield'
          },
        ]
      },
      {
        name: 'Chests & Storage',
        items: [{
            icon: '📦',
            name: 'Chest',
            notes: 'A locked wooden chest'
          },
          {
            icon: '🎁',
            name: 'Gift',
            notes: 'A wrapped mysterious package'
          },
          {
            icon: '🧰',
            name: 'Toolbox',
            notes: 'A toolbox of equipment'
          },
          {
            icon: '🪣',
            name: 'Barrel',
            notes: 'A large oak barrel'
          },
          {
            icon: '📫',
            name: 'Crate',
            notes: 'A wooden shipping crate'
          },
          {
            icon: '💼',
            name: 'Satchel',
            notes: 'A leather satchel'
          },
        ]
      },
      {
        name: 'Furniture',
        items: [{
            icon: '🪑',
            name: 'Chair',
            notes: 'A simple wooden chair'
          },
          {
            icon: '🛋️',
            name: 'Sofa',
            notes: 'A worn couch'
          },
          {
            icon: '🛏️',
            name: 'Bed',
            notes: 'A straw-stuffed bed'
          },
          {
            icon: '🪞',
            name: 'Mirror',
            notes: 'A tall ornate mirror'
          },
          {
            icon: '📚',
            name: 'Bookshelf',
            notes: 'A shelf of dusty tomes'
          },
          {
            icon: '🏮',
            name: 'Lantern',
            notes: 'A hanging lantern'
          },
          {
            icon: '⚰️',
            name: 'Coffin',
            notes: 'A wooden coffin'
          },
          {
            icon: '🏆',
            name: 'Trophy',
            notes: 'A displayed trophy'
          },
        ]
      },
      {
        name: 'Nature',
        items: [{
            icon: '🌲',
            name: 'Tree',
            notes: 'A tall forest tree'
          },
          {
            icon: '🌵',
            name: 'Cactus',
            notes: 'A desert cactus'
          },
          {
            icon: '🍄',
            name: 'Mushroom',
            notes: 'A large glowing mushroom'
          },
          {
            icon: '🪨',
            name: 'Rock',
            notes: 'A mossy rock'
          },
          {
            icon: '🌿',
            name: 'Shrub',
            notes: 'A thorny bush'
          },
          {
            icon: '🕳️',
            name: 'Pit',
            notes: 'A dark pit in the ground'
          },
          {
            icon: '💧',
            name: 'Pool',
            notes: 'A small pool of liquid'
          },
          {
            icon: '🔥',
            name: 'Fire',
            notes: 'A burning campfire'
          },
          {
            icon: '❄️',
            name: 'Ice',
            notes: 'A frozen pillar'
          },
          {
            icon: '🌊',
            name: 'Stream',
            notes: 'A fast-moving stream'
          },
        ]
      },
    ];

    /* ═══ STORAGE ═══ */
    const Storage = {
      _key: 'delve_maps',
      _sessionKey: 'delve_session',
      _settingsKey: 'delve_settings',
      getMaps() {
        try {
          return JSON.parse(localStorage.getItem(this._key) || '[]');
        } catch {
          return [];
        }
      },
      saveMaps(m) {
        localStorage.setItem(this._key, JSON.stringify(m));
      },
      saveMap(map) {
        const maps = this.getMaps(),
          idx = maps.findIndex(m => m.id === map.id);
        map.updatedAt = Date.now();
        if (idx >= 0) maps[idx] = map;
        else {
          map.createdAt = Date.now();
          maps.push(map);
        }
        this.saveMaps(maps);
      },
      getMap(id) {
        return this.getMaps().find(m => m.id === id) || null;
      },
      deleteMap(id) {
        this.saveMaps(this.getMaps().filter(m => m.id !== id));
      },
      getSession() {
        try {
          return JSON.parse(sessionStorage.getItem(this._sessionKey) || 'null');
        } catch {
          return null;
        }
      },
      saveSession(s) {
        sessionStorage.setItem(this._sessionKey, JSON.stringify(s));
      },
      clearSession() {
        sessionStorage.removeItem(this._sessionKey);
      },
      getSettings() {
        try {
          return JSON.parse(localStorage.getItem(this._settingsKey) || 'null') || {};
        } catch {
          return {};
        }
      },
      saveSettings(s) {
        localStorage.setItem(this._settingsKey, JSON.stringify(s));
      },
    };

    /* ═══ MAP MODEL ═══ */
    function createMapModel(opts = {}) {
      const w = opts.width || 32,
        h = opts.height || 32;
      return {
        id: opts.id || crypto.randomUUID(),
        name: opts.name || 'New Map',
        width: w,
        height: h,
        bg: opts.bg || 'dungeon',
        tiles: opts.tiles || Array(w * h).fill(0),
        rooms: opts.rooms || [],
        tokens: opts.tokens || [],
        fog: opts.fog || Array(w * h).fill(1),
        subpixels: opts.subpixels || {},
        createdAt: opts.createdAt || Date.now(),
        updatedAt: opts.updatedAt || Date.now(),
      };
    }

    /* ═══ TOAST ═══ */
    function toast(msg, type = 'info', dur = 2800) {
      const c = document.getElementById('toast-container');
      const el = document.createElement('div');
      el.className = `toast ${type}`;
      el.textContent = msg;
      c.appendChild(el);
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
      setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 250);
      }, dur);
    }

    /* ═══ MODAL ═══ */
    const Modal = {
      _cb: null,
      open(id) {
        document.getElementById(id).classList.remove('hidden');
      },
      close(id) {
        document.getElementById(id).classList.add('hidden');
      },
      confirm(title, body, cb) {
        document.getElementById('modal-confirm-title').textContent = title;
        document.getElementById('modal-confirm-body').textContent = body;
        this._cb = cb;
        document.getElementById('modal-confirm-ok').onclick = () => {
          this.close('modal-confirm');
          if (this._cb) this._cb();
        };
        this.open('modal-confirm');
      },
      cancel() {
        this.close('modal-confirm');
      }
    };
    document.querySelectorAll('.modal-overlay').forEach(el => {
      el.addEventListener('click', e => {
        if (e.target === el) el.classList.add('hidden');
      });
    });

    /* ═══ CTX MENU ═══ */
    const CtxMenu = {
      close() {
        document.getElementById('ctx-menu').classList.add('hidden');
      }
    };
    document.addEventListener('click', () => CtxMenu.close());
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') CtxMenu.close();
    });

    /* ═══ FLOATING TOOLS PICKER ═══ */
    const FloatToolsPicker = {
      _mode: 'editor',

      EDITOR_TOOLS: [{
          id: 'pan',
          icon: '✋',
          label: 'Pan',
          fn: "Editor.toggleFloatPan()"
        },
        {
          id: 'eraser',
          icon: '🧹',
          label: 'Eraser',
          fn: "Editor.setTool('eraser')"
        },
        {
          id: 'fill',
          icon: '🪣',
          label: 'Fill',
          fn: "Editor.setTool('fill')"
        },
        {
          id: 'select',
          icon: '↖️',
          label: 'Select',
          fn: "Editor.setTool('select')"
        },
        {
          id: 'room',
          icon: '▭',
          label: 'Room',
          fn: "Editor.setTool('room')"
        },
        {
          id: 'brush-sq',
          icon: '⬛',
          label: 'Sq Brush',
          fn: "Editor.setBrushType('square')"
        },
        {
          id: 'brush-ci',
          icon: '⭕',
          label: 'Circ Brush',
          fn: "Editor.setBrushType('circle')"
        },
        {
          id: 'brush-px',
          icon: '·',
          label: 'Pixel Brush',
          fn: "Editor.setBrushType('pixel')"
        },
        {
          id: 'brush-size',
          icon: '🖌️',
          label: 'Brush Size',
          fn: "Editor.toggleBrushSizePopup()"
        },
        {
          id: 'subpixel',
          icon: '🔬',
          label: 'SubPx',
          fn: "Editor.quickToggleSubpixel()"
        },
        {
          id: 'zoom-in',
          icon: '🔍+',
          label: 'Zoom In',
          fn: "Editor.zoomIn()"
        },
        {
          id: 'zoom-out',
          icon: '🔍−',
          label: 'Zoom Out',
          fn: "Editor.zoomOut()"
        },
        {
          id: 'fit',
          icon: '⊡',
          label: 'Fit View',
          fn: "Editor.fitView()"
        },
        {
          id: 'save',
          icon: '💾',
          label: 'Save',
          fn: "Editor.save()"
        },
      ],

      PLAY_TOOLS_DM: [{
          id: 'reveal',
          icon: '🔦',
          label: 'Reveal Fog',
          fn: "Play.setTool('reveal')"
        },
        {
          id: 'hide',
          icon: '🌫',
          label: 'Hide Fog',
          fn: "Play.setTool('hide')"
        },
        {
          id: 'move-token',
          icon: '🖐',
          label: 'Move Token',
          fn: "Play.setTool('move-token')"
        },
        {
          id: 'ping',
          icon: '📍',
          label: 'Ping',
          fn: "Play.setTool('ping')"
        },
        {
          id: 'measure',
          icon: '📏',
          label: 'Ruler',
          fn: "Play.setTool('measure')"
        },
        {
          id: 'reveal-all',
          icon: '☀️',
          label: 'Reveal All',
          fn: "Play.revealAll()"
        },
        {
          id: 'hide-all',
          icon: '🌑',
          label: 'Hide All',
          fn: "Play.hideAll()"
        },
        {
          id: 'next-init',
          icon: '▶',
          label: 'Next Init',
          fn: "Play.nextInit()"
        },
      ],

      PLAY_TOOLS_PLAYER: [{
          id: 'move-token',
          icon: '🖐',
          label: 'Move Token',
          fn: "Play.setTool('move-token')"
        },
        {
          id: 'ping',
          icon: '📍',
          label: 'Ping',
          fn: "Play.setTool('ping')"
        },
        {
          id: 'measure',
          icon: '📏',
          label: 'Ruler',
          fn: "Play.setTool('measure')"
        },
        {
          id: 'pan',
          icon: '✋',
          label: 'Pan',
          fn: "Play.togglePlayerPan()"
        },
        {
          id: 'center',
          icon: '👤',
          label: 'Find Me',
          fn: "Play.centerOnMyToken()"
        },
        {
          id: 'reset-move',
          icon: '🔄',
          label: 'Reset Move',
          fn: "Play.resetMovement()"
        },
        {
          id: 'zoom-in',
          icon: '🔍+',
          label: 'Zoom In',
          fn: "Play.zoomIn()"
        },
        {
          id: 'zoom-out',
          icon: '🔍−',
          label: 'Zoom Out',
          fn: "Play.zoomOut()"
        },
        {
          id: 'fit',
          icon: '⊡',
          label: 'Fit',
          fn: "Play.fitView()"
        },
      ],

      _getActive(mode) {
        const s = Storage.getSettings();
        if (mode === 'editor') return s.editorFloatTools || ['pan', 'eraser'];
        if (mode === 'play-dm') return s.playDmFloatTools || ['reveal', 'hide', 'move-token'];
        return s.playFloatTools || ['move-token', 'ping', 'measure', 'pan'];
      },

      openEditor() {
        this._mode = 'editor';
        this._build(this.EDITOR_TOOLS, this._getActive('editor'));
        Modal.open('modal-float-tools');
      },
      openPlay() {
        const isDM = Play.role === 'dm';
        this._mode = isDM ? 'play-dm' : 'play-player';
        this._build(isDM ? this.PLAY_TOOLS_DM : this.PLAY_TOOLS_PLAYER, this._getActive(isDM ? 'play-dm' : 'play'));
        Modal.open('modal-float-tools');
      },

      _build(tools, active) {
        const c = document.getElementById('float-tools-options');
        c.innerHTML = '';
        tools.forEach(t => {
          const el = document.createElement('label');
          el.className = 'float-tool-option';
          el.innerHTML = `<input type="checkbox" value="${t.id}" ${active.includes(t.id)?'checked':''}> <span style="font-size:1.2rem">${t.icon}</span> <span style="font-size:.85rem">${t.label}</span>`;
          c.appendChild(el);
        });
      },

      apply() {
        const checks = document.querySelectorAll('#float-tools-options input[type=checkbox]');
        const active = Array.from(checks).filter(c => c.checked).map(c => c.value);
        const s = Storage.getSettings();
        if (this._mode === 'editor') {
          s.editorFloatTools = active;
          Storage.saveSettings(s);
          this._renderEditor(active);
        } else if (this._mode === 'play-dm') {
          s.playDmFloatTools = active;
          Storage.saveSettings(s);
          this._renderPlayDM(active);
        } else {
          s.playFloatTools = active;
          Storage.saveSettings(s);
          this._renderPlayPlayer(active);
        }
        Modal.close('modal-float-tools');
      },

      _renderEditor(active) {
        const c = document.getElementById('editor-floating-tools');
        c.innerHTML = '';
        this.EDITOR_TOOLS.forEach(t => {
          if (!active.includes(t.id)) return;
          const btn = document.createElement('button');
          btn.id = 'float-editor-' + t.id;
          btn.className = 'float-btn';
          btn.title = t.label;
          btn.innerHTML = t.icon;
          btn.style.fontSize = '1.1rem';
          btn.setAttribute('onclick', t.fn);
          c.appendChild(btn);
        });
        this._syncEditorFloatActive();
      },

      _syncEditorFloatActive() {
        const sync = (id, active) => {
          const b = document.getElementById('float-editor-' + id);
          if (b) b.classList.toggle('active', active);
        };
        sync('pan', Editor._panToggled);
        sync('eraser', Editor.tool === 'eraser');
        sync('fill', Editor.tool === 'fill');
        sync('select', Editor.tool === 'select');
        sync('subpixel', Editor.subpixelMode);
        sync('brush-size', Editor._brushSizePopupOpen);
      },

      _renderPlayDM(active) {
        const c = document.getElementById('play-floating-tools');
        c.innerHTML = '';
        this.PLAY_TOOLS_DM.forEach(t => {
          if (!active.includes(t.id)) return;
          const btn = document.createElement('button');
          btn.id = 'play-float-' + t.id;
          btn.className = 'play-float-btn';
          btn.title = t.label;
          btn.innerHTML = t.icon;
          btn.style.fontSize = '1.1rem';
          btn.setAttribute('onclick', t.fn);
          c.appendChild(btn);
        });
        c.classList.toggle('hidden', active.length === 0);
        this._syncPlayFloatActive();
      },

      _renderPlayPlayer(active) {
        const c = document.getElementById('play-floating-tools');
        c.innerHTML = '';
        this.PLAY_TOOLS_PLAYER.forEach(t => {
          if (!active.includes(t.id)) return;
          const btn = document.createElement('button');
          btn.id = 'play-float-' + t.id;
          btn.className = 'play-float-btn';
          btn.title = t.label;
          btn.innerHTML = t.icon;
          btn.style.fontSize = '1.1rem';
          btn.setAttribute('onclick', t.fn);
          c.appendChild(btn);
        });
        c.classList.toggle('hidden', active.length === 0);
        this._syncPlayFloatActive();
      },

      _syncPlayFloatActive() {
        document.querySelectorAll('#play-floating-tools .play-float-btn').forEach(btn => {
          const id = btn.id.replace('play-float-', '');
          const toolMap = {
            reveal: 'reveal',
            hide: 'hide',
            'move-token': 'move-token',
            ping: 'ping',
            measure: 'measure'
          };
          if (toolMap[id]) btn.classList.toggle('active', Play.tool === toolMap[id]);
        });
      },

      initEditor() {
        this._renderEditor(this._getActive('editor'));
      },
      initPlay() {
        const isDM = Play.role === 'dm';
        if (isDM) this._renderPlayDM(this._getActive('play-dm'));
        else this._renderPlayPlayer(this._getActive('play'));
      },
    };

    /* ═══ PLAYER SETTINGS ═══ */
    const PlayerSettings = {
      _data: {
        speed: 30,
        showHp: true,
        showMove: true,
        diagMode: 'free'
      },
      load() {
        const s = Storage.getSettings();
        if (s.playerSettings) Object.assign(this._data, s.playerSettings);
      },
      open() {
        this.load();
        document.getElementById('player-speed-input').value = this._data.speed;
        document.getElementById('tracker-show-hp').checked = this._data.showHp;
        document.getElementById('tracker-show-move').checked = this._data.showMove;
        document.getElementById('player-diag-mode').value = this._data.diagMode;
        Modal.open('modal-player-settings');
      },
      updateTrackers() {
        this._data.showHp = document.getElementById('tracker-show-hp').checked;
        this._data.showMove = document.getElementById('tracker-show-move').checked;
        Play._updatePlayerTracker();
      },
      save() {
        this._data.speed = parseInt(document.getElementById('player-speed-input').value) || 30;
        this._data.showHp = document.getElementById('tracker-show-hp').checked;
        this._data.showMove = document.getElementById('tracker-show-move').checked;
        this._data.diagMode = document.getElementById('player-diag-mode').value;
        const s = Storage.getSettings();
        s.playerSettings = this._data;
        Storage.saveSettings(s);
        Play._movementRemaining = this._data.speed;
        Play._updatePlayerTracker();
        Modal.close('modal-player-settings');
        toast('Settings saved', 'success', 1400);
      },
      get speed() {
        return this._data.speed;
      },
      get showHp() {
        return this._data.showHp;
      },
      get showMove() {
        return this._data.showMove;
      },
      get diagMode() {
        return this._data.diagMode;
      },
    };

    /* ═══ OBJECT PALETTE ═══ */
    const ObjectPalette = {
      open() {
        const grid = document.getElementById('obj-palette-grid');
        if (!grid._built) {
          grid._built = true;
          grid.innerHTML = '';
          OBJECT_CATEGORIES.forEach(cat => {
            const lbl = document.createElement('div');
            lbl.className = 'obj-cat-label';
            lbl.textContent = cat.name;
            grid.appendChild(lbl);
            cat.items.forEach(item => {
              const el = document.createElement('div');
              el.className = 'obj-palette-item';
              el.innerHTML = `<div class="obj-palette-icon">${item.icon}</div><div class="obj-palette-name">${item.name}</div>`;
              el.onclick = () => {
                Modal.close('modal-object-palette');
                ObjectPalette.place(item);
              };
              grid.appendChild(el);
            });
          });
        }
        Modal.open('modal-object-palette');
      },
      place(item) {
        if (!Editor.map) return;
        const hov = Editor._hovCell;
        const cx = hov ? Math.max(0, Math.min(Editor.map.width - 1, hov.cx)) : Math.floor(Editor.map.width / 2);
        const cy = hov ? Math.max(0, Math.min(Editor.map.height - 1, hov.cy)) : Math.floor(Editor.map.height / 2);
        Editor._pushUndo();
        Editor.map.tokens.push({
          id: crypto.randomUUID(),
          type: 'object',
          cx,
          cy,
          size: 1,
          name: item.name,
          icon: item.icon,
          color: '#a0a0a0',
          hp: 0,
          maxHp: 0,
          initiative: 0,
          notes: item.notes || '',
          hidden: false
        });
        Editor._requestRender();
        Editor._dirty = true;
        toast(`${item.icon} ${item.name} placed`, 'success', 1400);
      }
    };

    /* ═══ APP NAV ═══ */
    const App = {
      currentScreen: 'home',
      show(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        this.currentScreen = id;
      },
      home() {
        this.show('screen-home');
      },
      goCreate() {
        Modal.open('modal-new-map');
      },
      goLibrary() {
        Library.render();
        this.show('screen-library');
      },
      goSession() {
        Session.init();
        this.show('screen-session');
      },
      goPlay() {
        this.show('screen-play');
      },
    };

    /* ═══ HELP ═══ */
    const Help = {
      open(panel) {
        Modal.open('modal-help');
        if (panel) this.tab(panel);
      },
      tab(name) {
        const panels = ['overview', 'editor', 'terrain', 'tokens', 'play', 'keys'];
        document.querySelectorAll('.help-tab').forEach((t, i) => t.classList.toggle('active', panels[i] === name));
        document.querySelectorAll('.help-panel').forEach(p => p.classList.toggle('active', p.id === 'help-panel-' + name));
      }
    };

    /* ═══════════════════════════════════════════════════════════
       EDITOR
    ═══════════════════════════════════════════════════════════ */
    const Editor = {
      map: null,
      tool: 'floor',
      _prevPaintTool: 'floor',
      _zoomLevel: 1.0,
      panX: 0,
      panY: 0,
      brushSize: 1,
      /* FIX: range 1–50 */
      brushType: 'square',
      subpixelMode: false,
      isPainting: false,
      isRoomDrawing: false,
      roomStart: null,
      selected: null,
      undoStack: [],
      redoStack: [],
      snapMode: 'cell',
      canvas: null,
      ctx: null,
      wrap: null,
      /* Touch state */
      _pointers: {},
      _lastPinch: null,
      _lastMidX: 0,
      _lastMidY: 0,
      /* FIX: track max pointer count per gesture */
      _gesturePointerCount: 0,
      _panning: false,
      _panStart: null,
      _dirty: false,
      _rafId: null,
      _hovCell: null,
      _hovSP: null,
      _resizeObs: null,
      _strokeStarted: false,
      _panToggled: false,
      _dragToken: null,
      _dragTargetCX: 0,
      _dragTargetCY: 0,
      _fillTile: 1,
      _spaceDown: false,
      _spacePanMode: false,
      /* FIX: brush size popup state */
      _brushSizePopupOpen: false,

      init(map) {
        this.map = map;
        this.canvas = document.getElementById('editor-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.wrap = document.getElementById('editor-canvas-wrap');
        this.undoStack = [];
        this.redoStack = [];
        this.selected = null;
        this.tool = 'floor';
        this._prevPaintTool = 'floor';
        this._strokeStarted = false;
        this.brushSize = 1;
        this.brushType = 'square';
        this._panning = false;
        this._panToggled = false;
        this._pointers = {};
        this._gesturePointerCount = 0;
        this._lastPinch = null;
        this._lastMidX = 0;
        this._lastMidY = 0;
        this.subpixelMode = false;
        this._dragToken = null;
        this._spaceDown = false;
        this._spacePanMode = false;
        this._brushSizePopupOpen = false;
        if (!map.subpixels) map.subpixels = {};

        document.getElementById('prop-map-name').value = map.name;
        document.getElementById('prop-width').value = map.width;
        document.getElementById('prop-height').value = map.height;
        document.getElementById('prop-bg').value = map.bg;
        document.getElementById('editor-grid-info').textContent = `${map.width}×${map.height} · 5ft/cell`;
        document.getElementById('subpixel-toggle').checked = false;
        document.getElementById('subpixel-badge').classList.add('hidden');
        document.getElementById('subpixel-size-select').value = String(SUBPIXEL_DIV);
        document.getElementById('editor-brush-size-lbl').textContent = this.brushSize;
        this._syncBrushBtns();
        this._closeBrushSizePopup();
        this._buildColorSwatches();
        this._bindEvents();
        this.setTool('floor');
        this._fit();
        this._requestRender();
        FloatToolsPicker.initEditor();
        App.show('screen-create');
        document.getElementById('create-map-name').textContent = map.name;
      },

      _syncBrushBtns() {
        ['sq', 'ci', 'sp'].forEach(id => document.getElementById('brush-' + id)?.classList.remove('active'));
        const m = {
          square: 'sq',
          circle: 'ci',
          pixel: 'sp'
        };
        document.getElementById('brush-' + (m[this.brushType] || 'sq'))?.classList.add('active');
      },

      setBrushType(t) {
        this.brushType = t;
        this._syncBrushBtns();
        FloatToolsPicker._syncEditorFloatActive();
        toast(`Brush: ${t}`, 'info', 800);
      },

      /* ── Brush size popup (FIX: new feature) ── */
      toggleBrushSizePopup() {
        this._brushSizePopupOpen ? this._closeBrushSizePopup() : this._openBrushSizePopup();
      },

      _openBrushSizePopup() {
        this._brushSizePopupOpen = true;
        const popup = document.getElementById('brush-size-popup');
        const btn = document.getElementById('float-editor-brush-size');
        if (btn) {
          const br = btn.getBoundingClientRect(),
            wr = this.wrap.getBoundingClientRect();
          popup.style.top = (br.top - wr.top) + 'px';
          popup.style.left = (br.right - wr.left + 6) + 'px';
        } else {
          popup.style.top = '8px';
          popup.style.left = '58px';
        }
        popup.classList.remove('hidden');
        const slider = document.getElementById('brush-size-popup-slider');
        slider.value = this.brushSize;
        document.getElementById('brush-size-popup-val').textContent = this.brushSize;
        FloatToolsPicker._syncEditorFloatActive();
      },

      _closeBrushSizePopup() {
        this._brushSizePopupOpen = false;
        document.getElementById('brush-size-popup').classList.add('hidden');
        FloatToolsPicker._syncEditorFloatActive();
      },

      /* FIX: clamp to 50 */
      setBrushFromSlider(val) {
        const n = Math.max(1, Math.min(50, parseInt(val) || 1));
        this.brushSize = n;
        document.getElementById('editor-brush-size-lbl').textContent = n;
        const slider = document.getElementById('brush-size-popup-slider');
        if (slider) slider.value = n;
        document.getElementById('brush-size-popup-val').textContent = n;
      },

      setSubpixelDiv(n) {
        n = Math.max(2, Math.min(8, n || 8));
        SUBPIXEL_DIV = n;
        document.getElementById('subpixel-size-select').value = String(n);
        document.getElementById('subpixel-badge').textContent = `${n}×${n} SubPx`;
        if (this.subpixelMode) this._requestRender();
        toast(`Sub-pixel grid: ${n}×${n}`, 'info', 1200);
      },

      toggleSubpixel(on) {
        this.subpixelMode = on;
        const badge = document.getElementById('subpixel-badge');
        badge.textContent = `${SUBPIXEL_DIV}×${SUBPIXEL_DIV} SubPx`;
        badge.classList.toggle('hidden', !on);
        document.getElementById('subpixel-toggle').checked = on;
        FloatToolsPicker._syncEditorFloatActive();
        if (on) toast(`Sub-pixel ${SUBPIXEL_DIV}×${SUBPIXEL_DIV} mode enabled`, 'info', 1800);
        this._requestRender();
      },

      quickToggleSubpixel() {
        this.toggleSubpixel(!this.subpixelMode);
      },

      toggleFloatPan() {
        this._panToggled = !this._panToggled;
        if (this._panToggled) {
          this._prevPaintTool = (this.tool !== 'pan') ? this.tool : this._prevPaintTool;
          this.setTool('pan');
        } else this.setTool(this._prevPaintTool);
        FloatToolsPicker._syncEditorFloatActive();
      },

      _buildColorSwatches() {
        const row = document.getElementById('prop-token-colors');
        row.innerHTML = '';
        TOKEN_COLORS.forEach(c => {
          const d = document.createElement('div');
          d.className = 'color-swatch';
          d.style.background = c;
          d.dataset.color = c;
          d.onclick = () => {
            row.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
            d.classList.add('selected');
            this.updateSelectedToken('color', c);
          };
          row.appendChild(d);
        });
      },

      _fit() {
        const {
          width: cw,
          height: ch
        } = this.wrap.getBoundingClientRect();
        if (!cw || !ch) return;
        const mapW = this.map.width * CELL_SIZE,
          mapH = this.map.height * CELL_SIZE;
        this._zoomLevel = Math.min(cw / mapW, ch / mapH) * 0.88;
        this.panX = (cw - mapW * this._zoomLevel) / 2;
        this.panY = (ch - mapH * this._zoomLevel) / 2;
      },

      _bindEvents() {
        const cv = this.canvas;
        if (cv._edDown) cv.removeEventListener('pointerdown', cv._edDown);
        if (cv._edMove) cv.removeEventListener('pointermove', cv._edMove);
        if (cv._edUp) cv.removeEventListener('pointerup', cv._edUp);
        if (cv._edWheel) cv.removeEventListener('wheel', cv._edWheel);
        if (cv._edCtx) cv.removeEventListener('contextmenu', cv._edCtx);

        cv._edDown = e => this._onDown(e);
        cv._edMove = e => this._onMove(e);
        cv._edUp = e => this._onUp(e);
        cv._edWheel = e => this._onWheel(e);
        cv._edCtx = e => {
          e.preventDefault();
          this._onRightClick(e);
        };

        cv.addEventListener('pointerdown', cv._edDown);
        cv.addEventListener('pointermove', cv._edMove);
        cv.addEventListener('pointerup', cv._edUp);
        cv.addEventListener('pointercancel', cv._edUp);
        cv.addEventListener('wheel', cv._edWheel, {
          passive: false
        });
        cv.addEventListener('contextmenu', cv._edCtx);

        if (document._edKey) document.removeEventListener('keydown', document._edKey);
        if (document._edKeyUp) document.removeEventListener('keyup', document._edKeyUp);
        document._edKey = e => this._onKey(e);
        document._edKeyUp = e => {
          if (e.key === ' ' && this._spacePanMode) {
            this._spacePanMode = false;
            this._spaceDown = false;
            this._panning = false;
            this.setTool(this._prevPaintTool);
          }
        };
        document.addEventListener('keydown', document._edKey);
        document.addEventListener('keyup', document._edKeyUp);

        /* Close brush popup on outside click */
        document.addEventListener('pointerdown', e => {
          if (!this._brushSizePopupOpen) return;
          const popup = document.getElementById('brush-size-popup');
          const btn = document.getElementById('float-editor-brush-size');
          if (!popup.contains(e.target) && e.target !== btn) this._closeBrushSizePopup();
        }, true);

        if (this._resizeObs) this._resizeObs.disconnect();
        this._resizeObs = new ResizeObserver(() => this._requestRender());
        this._resizeObs.observe(this.wrap);
      },

      _onKey(e) {
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
        if (App.currentScreen !== 'screen-create') return;
        if (e.ctrlKey || e.metaKey) {
          if (e.key === 'z') {
            e.preventDefault();
            this.undo();
            return;
          }
          if (e.key === 'y') {
            e.preventDefault();
            this.redo();
            return;
          }
          if (e.key === 's') {
            e.preventDefault();
            this.save();
            return;
          }
          return;
        }
        switch (e.key) {
          case 'f':
          case 'F':
            this.setTool('floor');
            break;
          case 'w':
          case 'W':
            this.setTool('wall');
            break;
          case 'd':
          case 'D':
            this.setTool('door');
            break;
          case 'g':
          case 'G':
            this.setTool('grass');
            break;
          case 'e':
          case 'E':
            this.setTool('eraser');
            break;
          case 'b':
          case 'B':
            this.setTool('fill');
            break;
          case 'v':
          case 'V':
            this.setTool('select');
            break;
            /* FIX: clamp to 50 */
          case '+':
          case '=':
            this.adjustBrush(1);
            break;
          case '-':
          case '_':
            this.adjustBrush(-1);
            break;
          case 'c':
          case 'C':
            this.setBrushType(this.brushType === 'circle' ? 'square' : 'circle');
            break;
          case 'x':
          case 'X':
            this.toggleSubpixel(!this.subpixelMode);
            break;
          case 'Delete':
          case 'Backspace':
            this.deleteSelected();
            break;
          case ' ':
            e.preventDefault();
            if (!this._spaceDown) {
              this._spaceDown = true;
              this._spacePanMode = true;
              this._prevPaintTool = this.tool !== 'pan' ? this.tool : this._prevPaintTool;
              this.setTool('pan');
            }
            break;
        }
      },

      _evToWorld(e) {
        const r = this.canvas.getBoundingClientRect();
        return {
          wx: (e.clientX - r.left - this.panX) / this._zoomLevel,
          wy: (e.clientY - r.top - this.panY) / this._zoomLevel
        };
      },
      _worldToCell(wx, wy) {
        return {
          cx: Math.floor(wx / CELL_SIZE),
          cy: Math.floor(wy / CELL_SIZE)
        };
      },
      _worldToSubpixel(wx, wy) {
        const cx = Math.floor(wx / CELL_SIZE),
          cy = Math.floor(wy / CELL_SIZE);
        const lx = (wx - cx * CELL_SIZE) / CELL_SIZE,
          ly = (wy - cy * CELL_SIZE) / CELL_SIZE;
        return {
          cx,
          cy,
          spx: Math.max(0, Math.min(SUBPIXEL_DIV - 1, Math.floor(lx * SUBPIXEL_DIV))),
          spy: Math.max(0, Math.min(SUBPIXEL_DIV - 1, Math.floor(ly * SUBPIXEL_DIV)))
        };
      },

      _getBrushCells(cx, cy) {
        if (this.brushType === 'pixel') {
          return (cx >= 0 && cy >= 0 && cx < this.map.width && cy < this.map.height) ? [
            [cx, cy]
          ] : [];
        }
        const r = this.brushSize,
          cells = [];
        if (this.brushType === 'circle') {
          const rad = r / 2,
            irad = Math.ceil(rad);
          for (let dy = -irad; dy <= irad; dy++)
            for (let dx = -irad; dx <= irad; dx++) {
              if (dx * dx + dy * dy <= rad * rad + 0.25) {
                const bx = cx + dx,
                  by = cy + dy;
                if (bx >= 0 && by >= 0 && bx < this.map.width && by < this.map.height) cells.push([bx, by]);
              }
            }
          if (!cells.length && cx >= 0 && cy >= 0 && cx < this.map.width && cy < this.map.height) cells.push([cx, cy]);
          return cells;
        }
        const half = Math.floor(r / 2);
        for (let dy = 0; dy < r; dy++)
          for (let dx = 0; dx < r; dx++) {
            const bx = cx - half + dx,
              by = cy - half + dy;
            if (bx >= 0 && by >= 0 && bx < this.map.width && by < this.map.height) cells.push([bx, by]);
          }
        return cells;
      },

      _getSubpixelBrushCells(cx, cy, spx, spy) {
        const gsx = cx * SUBPIXEL_DIV + spx,
          gsy = cy * SUBPIXEL_DIV + spy;
        const maxGSX = this.map.width * SUBPIXEL_DIV - 1,
          maxGSY = this.map.height * SUBPIXEL_DIV - 1;
        if (this.brushType === 'pixel') {
          return (gsx >= 0 && gsy >= 0 && gsx <= maxGSX && gsy <= maxGSY) ? [{
            cx,
            cy,
            spx,
            spy
          }] : [];
        }
        const r = this.brushSize,
          cells = [];
        if (this.brushType === 'circle') {
          const rad = r / 2,
            irad = Math.ceil(rad);
          for (let dy = -irad; dy <= irad; dy++)
            for (let dx = -irad; dx <= irad; dx++) {
              if (dx * dx + dy * dy <= rad * rad + 0.25) {
                const ngsx = gsx + dx,
                  ngsy = gsy + dy;
                if (ngsx >= 0 && ngsy >= 0 && ngsx <= maxGSX && ngsy <= maxGSY) cells.push({
                  cx: Math.floor(ngsx / SUBPIXEL_DIV),
                  cy: Math.floor(ngsy / SUBPIXEL_DIV),
                  spx: ngsx % SUBPIXEL_DIV,
                  spy: ngsy % SUBPIXEL_DIV
                });
              }
            }
          if (!cells.length && gsx >= 0 && gsy >= 0 && gsx <= maxGSX && gsy <= maxGSY) cells.push({
            cx,
            cy,
            spx,
            spy
          });
          return cells;
        }
        const half = Math.floor(r / 2);
        for (let dy = 0; dy < r; dy++)
          for (let dx = 0; dx < r; dx++) {
            const ngsx = gsx - half + dx,
              ngsy = gsy - half + dy;
            if (ngsx >= 0 && ngsy >= 0 && ngsx <= maxGSX && ngsy <= maxGSY) cells.push({
              cx: Math.floor(ngsx / SUBPIXEL_DIV),
              cy: Math.floor(ngsy / SUBPIXEL_DIV),
              spx: ngsx % SUBPIXEL_DIV,
              spy: ngsy % SUBPIXEL_DIV
            });
          }
        return cells;
      },

      /* ─────────────────────────────────────────────────────────
         POINTER EVENTS — Two-finger pan fix (FIX)
         Rules:
           • _gesturePointerCount tracks the MAX pointer count
             seen since the gesture began (first pointerdown).
           • If that count ever reaches ≥2, the entire gesture
             is treated as two-finger: no painting happens.
           • Reset to 0 only when ALL pointers are lifted.
           • Pan is delta-based (no anchor drift).
      ───────────────────────────────────────────────────────── */
      _onDown(e) {
        e.preventDefault();
        const before = Object.keys(this._pointers).length;
        this._pointers[e.pointerId] = {
          x: e.clientX,
          y: e.clientY
        };
        const pcount = Object.keys(this._pointers).length;

        /* Start of a brand-new gesture */
        if (before === 0) this._gesturePointerCount = 1;
        /* Escalate if more fingers join */
        if (pcount > this._gesturePointerCount) this._gesturePointerCount = pcount;

        if (pcount >= 2) {
          /* Cancel any in-flight paint stroke */
          this.isPainting = false;
          this._strokeStarted = false;
          this._dragToken = null;
          this.isRoomDrawing = false;
          this.roomStart = null;
          this._panning = false;
          const pts = Object.values(this._pointers);
          const mx = (pts[0].x + pts[1].x) / 2,
            my = (pts[0].y + pts[1].y) / 2;
          this._lastPinch = this._getPinchDist();
          this._lastMidX = mx;
          this._lastMidY = my;
          return;
        }

        /* ─ Single pointer from here down ─ */
        /* If the gesture was already contaminated by two fingers, block */
        if (this._gesturePointerCount >= 2) return;

        /* Middle-click / alt+click → pan */
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
          this._panning = true;
          this._panStart = {
            x: e.clientX - this.panX,
            y: e.clientY - this.panY
          };
          return;
        }
        if (e.button === 2) return;

        if (this.tool === 'pan') {
          this._panning = true;
          this._panStart = {
            x: e.clientX - this.panX,
            y: e.clientY - this.panY
          };
          return;
        }

        this.canvas.setPointerCapture(e.pointerId);
        const {
          wx,
          wy
        } = this._evToWorld(e);
        const {
          cx,
          cy
        } = this._worldToCell(wx, wy);

        if (this.tool === 'select') {
          const tok = this._tokenAt(cx, cy);
          if (tok) {
            this._selectToken(tok);
            return;
          }
          const rm = this._roomAt(cx, cy);
          if (rm) {
            this._selectRoom(rm);
            return;
          }
          this._clearSelection();
          return;
        }

        /* Token drag */
        const tileMap = {
          floor: 1,
          wall: 2,
          door: 3,
          water: 4,
          grass: 5,
          stone: 6,
          sand: 7,
          lava: 8,
          ice: 9,
          wood: 10,
          swamp: 11,
          mud: 12,
          cavern: 13,
          marble: 14,
          crystal: 15,
          ash: 16,
          cobble: 17,
          obsidian: 18,
          blood: 19,
          arcane: 20,
          eraser: 0
        };
        if (tileMap[this.tool] !== undefined) {
          this._pushUndo();
          this._strokeStarted = true;
          this.isPainting = true;
          if (this.subpixelMode) {
            const sp = this._worldToSubpixel(wx, wy);
            if (this.tool === 'eraser') this._applySubpixelBrush(sp.cx, sp.cy, sp.spx, sp.spy, null);
            else {
              const col = TILE_TYPES[this.tool]?.color;
              if (col) this._applySubpixelBrush(sp.cx, sp.cy, sp.spx, sp.spy, col);
            }
          } else {
            this._paintTiles(cx, cy, tileMap[this.tool]);
          }
          this._requestRender();
          return;
        }

        if (this.tool === 'room') {
          this._pushUndo();
          this.isRoomDrawing = true;
          this.roomStart = {
            cx,
            cy
          };
          this._requestRender();
          return;
        }
        if (this.tool === 'fill') {
          this._pushUndo();
          this._floodFill(cx, cy, this._fillTile);
          this._requestRender();
          return;
        }
        if (this.tool.startsWith('token-')) {
          this._pushUndo();
          const typeMap = {
            'token-player': 'player',
            'token-monster': 'monster',
            'token-npc': 'npc',
            'token-object': 'object'
          };
          this._placeToken(cx, cy, typeMap[this.tool] || 'player');
          return;
        }
      },

      _onMove(e) {
        this._pointers[e.pointerId] = {
          x: e.clientX,
          y: e.clientY
        };
        const pcount = Object.keys(this._pointers).length;
        if (pcount > this._gesturePointerCount) this._gesturePointerCount = pcount;

        if (pcount >= 2) {
          const pts = Object.values(this._pointers);
          const mx = (pts[0].x + pts[1].x) / 2,
            my = (pts[0].y + pts[1].y) / 2;
          /* Pinch zoom — dead-zone 3px */
          const nd = this._getPinchDist();
          if (this._lastPinch > 0 && nd > 0 && Math.abs(nd - this._lastPinch) > 3) {
            const factor = nd / this._lastPinch;
            const r = this.canvas.getBoundingClientRect();
            this._zoomAt(mx - r.left, my - r.top, factor);
            this._lastPinch = nd;
          }
          /* Delta-based two-finger pan (FIX: no anchor drift) */
          this.panX += mx - this._lastMidX;
          this.panY += my - this._lastMidY;
          this._lastMidX = mx;
          this._lastMidY = my;
          this._requestRender();
          return;
        }

        if (this._panning && this._panStart) {
          this.panX = e.clientX - this._panStart.x;
          this.panY = e.clientY - this._panStart.y;
          this._requestRender();
          return;
        }

        const {
          wx,
          wy
        } = this._evToWorld(e);
        const {
          cx,
          cy
        } = this._worldToCell(wx, wy);
        this._hovCell = {
          cx,
          cy
        };
        this._hovSP = this.subpixelMode ? (() => {
          const sp = this._worldToSubpixel(wx, wy);
          return {
            spx: sp.spx,
            spy: sp.spy
          };
        })() : null;

        if (this._dragToken) {
          this._dragTargetCX = Math.max(0, Math.min(this.map.width - 1, cx));
          this._dragTargetCY = Math.max(0, Math.min(this.map.height - 1, cy));
          this._requestRender();
          return;
        }

        /* Only paint on a clean single-finger gesture (FIX) */
        if (this.isPainting && this._gesturePointerCount < 2) {
          const tileMap = {
            floor: 1,
            wall: 2,
            door: 3,
            water: 4,
            grass: 5,
            stone: 6,
            sand: 7,
            lava: 8,
            ice: 9,
            wood: 10,
            swamp: 11,
            mud: 12,
            cavern: 13,
            marble: 14,
            crystal: 15,
            ash: 16,
            cobble: 17,
            obsidian: 18,
            blood: 19,
            arcane: 20,
            eraser: 0
          };
          if (tileMap[this.tool] !== undefined) {
            if (this.subpixelMode) {
              const sp = this._worldToSubpixel(wx, wy);
              if (this.tool === 'eraser') this._applySubpixelBrush(sp.cx, sp.cy, sp.spx, sp.spy, null);
              else {
                const col = TILE_TYPES[this.tool]?.color;
                if (col) this._applySubpixelBrush(sp.cx, sp.cy, sp.spx, sp.spy, col);
              }
            } else {
              this._paintTiles(cx, cy, tileMap[this.tool]);
            }
          }
        }

        if (this.isRoomDrawing && this.roomStart) this._requestRender();
        this._requestRender();
      },

      _onUp(e) {
        delete this._pointers[e.pointerId];
        const remaining = Object.keys(this._pointers).length;

        if (remaining >= 1) {
          if (remaining === 1) {
            this._lastPinch = null;
            const pts = Object.values(this._pointers);
            this._lastMidX = pts[0].x;
            this._lastMidY = pts[0].y;
            this._panning = false;
          }
          return;
        }

        /* All fingers lifted — reset gesture state (FIX) */
        this._gesturePointerCount = 0;
        this._panning = false;
        this._lastPinch = null;

        if (this._dragToken) {
          this._pushUndo();
          this._dragToken.cx = this._dragTargetCX;
          this._dragToken.cy = this._dragTargetCY;
          this._dragToken = null;
          this._dirty = true;
          this._requestRender();
          return;
        }

        if (this.isRoomDrawing && this.roomStart) {
          const {
            wx,
            wy
          } = this._evToWorld(e);
          const {
            cx,
            cy
          } = this._worldToCell(wx, wy);
          const x = Math.min(this.roomStart.cx, cx),
            y = Math.min(this.roomStart.cy, cy);
          const w = Math.abs(cx - this.roomStart.cx) + 1,
            h = Math.abs(cy - this.roomStart.cy) + 1;
          if (w > 0 && h > 0) {
            const room = {
              id: crypto.randomUUID(),
              name: 'Room',
              desc: '',
              x,
              y,
              w,
              h
            };
            this.map.rooms.push(room);
            this._selectRoom(room);
          }
          this.isRoomDrawing = false;
          this.roomStart = null;
        }

        this.isPainting = false;
        this._strokeStarted = false;
        this._requestRender();
      },

      _onWheel(e) {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
        const r = this.canvas.getBoundingClientRect();
        this._zoomAt(e.clientX - r.left, e.clientY - r.top, factor);
      },

      _zoomAt(px, py, factor) {
        const nz = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, this._zoomLevel * factor));
        const s = nz / this._zoomLevel;
        this.panX = px - (px - this.panX) * s;
        this.panY = py - (py - this.panY) * s;
        this._zoomLevel = nz;
        this._requestRender();
      },

      _getPinchDist() {
        const pts = Object.values(this._pointers);
        if (pts.length < 2) return 0;
        const dx = pts[0].x - pts[1].x,
          dy = pts[0].y - pts[1].y;
        return Math.sqrt(dx * dx + dy * dy);
      },

      _onRightClick(e) {
        const {
          wx,
          wy
        } = this._evToWorld(e);
        const {
          cx,
          cy
        } = this._worldToCell(wx, wy);
        const token = this._tokenAt(cx, cy);
        if (token) this._showTokenContextMenu(e, token);
      },

      _paintTiles(cx, cy, val) {
        const cells = this._getBrushCells(cx, cy);
        let changed = false;
        for (const [bx, by] of cells) {
          const idx = by * this.map.width + bx;
          if (this.map.tiles[idx] !== val) {
            this.map.tiles[idx] = val;
            changed = true;
          }
        }
        if (changed) this._dirty = true;
      },

      _applySubpixelBrush(cx, cy, spx, spy, color) {
        if (!this.map.subpixels) this.map.subpixels = {};
        const cells = this._getSubpixelBrushCells(cx, cy, spx, spy);
        for (const {
            cx: bcx,
            cy: bcy,
            spx: bspx,
            spy: bspy
          }
          of cells) {
          const key = `${bcx},${bcy},${bspx},${bspy}`;
          if (color === null) delete this.map.subpixels[key];
          else this.map.subpixels[key] = color;
        }
        this._dirty = true;
      },

      _floodFill(startCx, startCy, targetTile) {
        const m = this.map;
        if (startCx < 0 || startCy < 0 || startCx >= m.width || startCy >= m.height) return;
        const idx0 = startCy * m.width + startCx,
          srcTile = m.tiles[idx0];
        if (srcTile === targetTile) return;
        const visited = new Uint8Array(m.tiles.length),
          queue = [
            [startCx, startCy]
          ];
        visited[idx0] = 1;
        while (queue.length) {
          const [cx, cy] = queue.shift(), idx = cy * m.width + cx;
          m.tiles[idx] = targetTile;
          this._dirty = true;
          for (const [nx, ny] of [
              [cx - 1, cy],
              [cx + 1, cy],
              [cx, cy - 1],
              [cx, cy + 1]
            ]) {
            if (nx < 0 || ny < 0 || nx >= m.width || ny >= m.height) continue;
            const ni = ny * m.width + nx;
            if (!visited[ni] && m.tiles[ni] === srcTile) {
              visited[ni] = 1;
              queue.push([nx, ny]);
            }
          }
        }
      },

      _tokenAt(cx, cy) {
        return this.map.tokens.find(t => {
          const s = t.size || 1;
          return cx >= t.cx && cx < t.cx + s && cy >= t.cy && cy < t.cy + s;
        }) || null;
      },
      _roomAt(cx, cy) {
        return this.map.rooms.find(r => cx >= r.x && cx < r.x + r.w && cy >= r.y && cy < r.y + r.h) || null;
      },

      _placeToken(cx, cy, type) {
        const icons = {
          player: '👤',
          monster: '👹',
          npc: '🧙',
          object: '📦'
        };
        const colors = {
          player: '#40a0e0',
          monster: '#e04040',
          npc: '#e0c040',
          object: '#a0a0a0'
        };
        const token = {
          id: crypto.randomUUID(),
          type,
          cx,
          cy,
          size: 1,
          name: type.charAt(0).toUpperCase() + type.slice(1),
          icon: icons[type] || '?',
          color: colors[type] || '#fff',
          hp: 10,
          maxHp: 10,
          initiative: 0,
          notes: '',
          hidden: false
        };
        this.map.tokens.push(token);
        this._requestRender();
        this._dirty = true;
        toast(`${icons[type]} ${token.name} placed`, 'success', 1400);
        this.setTool(this._prevPaintTool);
      },

      _selectToken(token) {
        this.selected = {
          type: 'token',
          id: token.id
        };
        this._showTokenProps(token);
        this._requestRender();
      },
      _selectRoom(room) {
        this.selected = {
          type: 'room',
          id: room.id
        };
        this._showRoomProps(room);
        this._requestRender();
      },
      _clearSelection() {
        this.selected = null;
        document.getElementById('prop-token-panel').classList.add('hidden');
        document.getElementById('prop-room-panel').classList.add('hidden');
        document.getElementById('prop-default-msg').classList.remove('hidden');
        this._requestRender();
      },

      dismissTokenPanel() {
        this._clearSelection();
        document.getElementById('editor-side-panel').classList.remove('mobile-visible');
        this.setTool(this._prevPaintTool);
      },
      closeSidePanel() {
        document.getElementById('editor-side-panel').classList.remove('mobile-visible');
      },

      _showTokenProps(token) {
        document.getElementById('prop-token-panel').classList.remove('hidden');
        document.getElementById('prop-room-panel').classList.add('hidden');
        document.getElementById('prop-default-msg').classList.add('hidden');
        document.getElementById('prop-token-name').value = token.name || '';
        document.getElementById('prop-token-type').value = token.type || 'player';
        document.getElementById('prop-token-size').value = token.size || 1;
        document.getElementById('prop-token-icon').value = token.icon || '';
        document.getElementById('prop-token-hp').value = token.maxHp || 0;
        document.getElementById('prop-token-curhp').value = token.hp || 0;
        document.getElementById('prop-token-init').value = token.initiative || 0;
        document.getElementById('prop-token-notes').value = token.notes || '';
        document.getElementById('prop-token-hidden').checked = !!token.hidden;
        document.querySelectorAll('#prop-token-colors .color-swatch').forEach(s => s.classList.toggle('selected', s.dataset.color === token.color));
        if (window.innerWidth < 768) document.getElementById('editor-side-panel').classList.add('mobile-visible');
      },

      _showRoomProps(room) {
        document.getElementById('prop-room-panel').classList.remove('hidden');
        document.getElementById('prop-token-panel').classList.add('hidden');
        document.getElementById('prop-default-msg').classList.add('hidden');
        document.getElementById('prop-room-name').value = room.name || '';
        document.getElementById('prop-room-desc').value = room.desc || '';
        if (window.innerWidth < 768) document.getElementById('editor-side-panel').classList.add('mobile-visible');
      },

      _showTokenContextMenu(e, token) {
        const menu = document.getElementById('ctx-menu');
        menu.innerHTML = `
      <div class="ctx-item" onclick="Editor._selectToken(Editor.map.tokens.find(t=>t.id==='${token.id}')); CtxMenu.close()">✏️ Edit</div>
      <div class="ctx-item" onclick="Editor.duplicateToken('${token.id}'); CtxMenu.close()">⧉ Duplicate</div>
      <div class="ctx-item" onclick="Editor.updateSelectedToken('hidden',!Editor.map.tokens.find(t=>t.id==='${token.id}').hidden);Editor._selectToken(Editor.map.tokens.find(t=>t.id==='${token.id}')); CtxMenu.close()">${token.hidden?'👁 Reveal':'🫥 Hide'}</div>
      <div class="ctx-sep"></div>
      <div class="ctx-item danger" onclick="Editor._deleteToken('${token.id}'); CtxMenu.close()">🗑️ Delete</div>`;
        menu.style.left = Math.min(e.clientX, window.innerWidth - 180) + 'px';
        menu.style.top = Math.min(e.clientY, window.innerHeight - 120) + 'px';
        menu.classList.remove('hidden');
        e.preventDefault();
      },

      _deleteToken(id) {
        this._pushUndo();
        this.map.tokens = this.map.tokens.filter(t => t.id !== id);
        if (this.selected?.type === 'token' && this.selected.id === id) this._clearSelection();
        this._requestRender();
        this._dirty = true;
      },

      duplicateToken(id) {
        const t = this.map.tokens.find(t => t.id === id);
        if (!t) return;
        this._pushUndo();
        const copy = JSON.parse(JSON.stringify(t));
        copy.id = crypto.randomUUID();
        copy.cx += 1;
        copy.cy += 1;
        this.map.tokens.push(copy);
        this._selectToken(copy);
        this._requestRender();
        this._dirty = true;
      },

      updateSelectedToken(key, val) {
        if (!this.selected || this.selected.type !== 'token') return;
        const t = this.map.tokens.find(t => t.id === this.selected.id);
        if (!t) return;
        t[key] = val;
        if (key === 'hidden') {
          const cb = document.getElementById('prop-token-hidden');
          if (cb) cb.checked = !!val;
        }
        this._requestRender();
        this._dirty = true;
      },
      updateSelectedRoom(key, val) {
        if (!this.selected || this.selected.type !== 'room') return;
        const r = this.map.rooms.find(r => r.id === this.selected.id);
        if (!r) return;
        r[key] = val;
        this._requestRender();
      },
      deleteSelected() {
        if (!this.selected) return;
        this._pushUndo();
        if (this.selected.type === 'token') this._deleteToken(this.selected.id);
        else if (this.selected.type === 'room') {
          this.map.rooms = this.map.rooms.filter(r => r.id !== this.selected.id);
          this._clearSelection();
          this._requestRender();
        }
      },
      duplicateSelected() {
        if (this.selected?.type === 'token') this.duplicateToken(this.selected.id);
      },

      setTool(t) {
        const paintTools = ['floor', 'wall', 'door', 'water', 'grass', 'stone', 'sand', 'lava', 'ice', 'wood', 'swamp', 'mud', 'cavern', 'marble', 'crystal', 'ash', 'cobble', 'obsidian', 'blood', 'arcane', 'eraser', 'fill'];
        if (paintTools.includes(t)) {
          this._prevPaintTool = t;
          this._fillTile = {
            floor: 1,
            wall: 2,
            door: 3,
            water: 4,
            grass: 5,
            stone: 6,
            sand: 7,
            lava: 8,
            ice: 9,
            wood: 10,
            swamp: 11,
            mud: 12,
            cavern: 13,
            marble: 14,
            crystal: 15,
            ash: 16,
            cobble: 17,
            obsidian: 18,
            blood: 19,
            arcane: 20,
            eraser: 0
          } [t] ?? 0;
        }
        this.tool = t;
        document.querySelectorAll('.editor-toolbar .btn-icon').forEach(b => b.classList.remove('active'));
        const btn = document.getElementById('tool-' + t);
        if (btn) btn.classList.add('active');
        const wrap = document.getElementById('editor-canvas-wrap');
        if (t === 'select' || t === 'move-token') wrap.className = 'canvas-wrap tool-select';
        else if (t === 'pan') wrap.className = 'canvas-wrap tool-pan';
        else wrap.className = 'canvas-wrap';
        if (t !== 'pan' && this._panToggled && !this._spacePanMode) this._panToggled = false;
        FloatToolsPicker._syncEditorFloatActive();
      },

      zoomIn() {
        const r = this.wrap.getBoundingClientRect();
        this._zoomAt(r.width / 2, r.height / 2, 1.2);
      },
      zoomOut() {
        const r = this.wrap.getBoundingClientRect();
        this._zoomAt(r.width / 2, r.height / 2, 1 / 1.2);
      },
      fitView() {
        this._fit();
        this._requestRender();
      },

      /* FIX: clamp to 1–50 */
      adjustBrush(delta) {
        this.brushSize = Math.max(1, Math.min(50, this.brushSize + delta));
        document.getElementById('editor-brush-size-lbl').textContent = this.brushSize;
        const slider = document.getElementById('brush-size-popup-slider');
        if (slider) slider.value = this.brushSize;
        document.getElementById('brush-size-popup-val').textContent = this.brushSize;
      },

      setBackground(bg) {
        this.map.bg = bg;
        this._requestRender();
      },
      setSnapMode(m) {
        this.snapMode = m;
      },
      updateMapName(name) {
        this.map.name = name;
        document.getElementById('create-map-name').textContent = name;
      },

      resizeMap() {
        const w = Math.max(8, Math.min(200, parseInt(document.getElementById('prop-width').value) || 32));
        const h = Math.max(8, Math.min(200, parseInt(document.getElementById('prop-height').value) || 32));
        if (w === this.map.width && h === this.map.height) return;
        this._pushUndo();
        const nTiles = Array(w * h).fill(0),
          nFog = Array(w * h).fill(1);
        for (let y = 0; y < Math.min(h, this.map.height); y++)
          for (let x = 0; x < Math.min(w, this.map.width); x++) {
            nTiles[y * w + x] = this.map.tiles[y * this.map.width + x];
            nFog[y * w + x] = this.map.fog[y * this.map.width + x];
          }
        this.map.width = w;
        this.map.height = h;
        this.map.tiles = nTiles;
        this.map.fog = nFog;
        document.getElementById('editor-grid-info').textContent = `${w}×${h} · 5ft/cell`;
        this._fit();
        this._requestRender();
      },

      _updateNewMapPreview() {
        const w = parseInt(document.getElementById('new-map-w').value) || 32;
        const h = parseInt(document.getElementById('new-map-h').value) || 32;
        const bg = document.getElementById('new-map-bg').value || 'dungeon';
        const bgLabels = {
          dungeon: 'Dungeon',
          outdoor: 'Outdoor',
          cave: 'Cave',
          void: 'Void',
          forest: 'Forest',
          desert: 'Desert',
          arctic: 'Arctic',
          lava: 'Lava',
          ocean: 'Ocean',
          purple: 'Arcane',
          blood: 'Bloodstained',
          marble: 'Marble'
        };
        document.getElementById('new-map-preview-text').textContent = `${w}×${h} · ${bgLabels[bg]||'Unknown'}`;
        const bgStyle = BG_STYLES[bg] || BG_STYLES.dungeon;
        document.getElementById('new-map-preview-color').style.background = bgStyle.base;
      },

      createNewMap() {
        const name = document.getElementById('new-map-name').value.trim() || 'New Map';
        const w = parseInt(document.getElementById('new-map-w').value) || 32;
        const h = parseInt(document.getElementById('new-map-h').value) || 32;
        const bg = document.getElementById('new-map-bg').value || 'dungeon';
        Modal.close('modal-new-map');
        this.init(createMapModel({
          name,
          width: w,
          height: h,
          bg
        }));
      },

      save() {
        if (!this.map) return;
        Storage.saveMap(this.map);
        this._dirty = false;
        toast('Map saved!', 'success');
      },

      async exportMap() {
        if (!this.map) return;
        const slug = this.map.name.replace(/\s+/g, '_').replace(/[^\w\-]/g, '') || 'map';
        const suggestedName = `${slug}.delve.json`;
        const json = JSON.stringify(this.map, null, 2);
        if (window.showSaveFilePicker) {
          try {
            const handle = await window.showSaveFilePicker({
              suggestedName,
              types: [{
                description: 'Delve Map',
                accept: {
                  'application/json': ['.json']
                }
              }],
              startIn: 'documents'
            });
            const w = await handle.createWritable();
            await w.write(json);
            await w.close();
            toast(`Saved as ${handle.name}`, 'success');
            return;
          } catch (e) {
            if (e.name === 'AbortError') return;
          }
        }
        const blob = new Blob([json], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = suggestedName;
        a.click();
        URL.revokeObjectURL(url);
        toast(`Exported as ${suggestedName}`, 'success');
      },

      importMap() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.delve.json';
        input.onchange = async e => {
          const file = e.target.files[0];
          if (!file) return;
          try {
            const map = JSON.parse(await file.text());
            if (!map.id || !map.tiles) throw new Error('Invalid map file');
            map.id = crypto.randomUUID();
            Storage.saveMap(map);
            toast(`Imported "${map.name}"!`, 'success');
            Library.render();
          } catch (err) {
            toast('Import failed: ' + err.message, 'error');
          }
        };
        input.click();
      },

      toggleSidePanel() {
        const panel = document.getElementById('editor-side-panel');
        if (window.innerWidth < 768) panel.classList.toggle('mobile-visible');
        else panel.classList.toggle('panel-collapsed');
      },

      _pushUndo() {
        this.undoStack.push(JSON.stringify({
          tiles: this.map.tiles.slice(),
          tokens: JSON.parse(JSON.stringify(this.map.tokens)),
          rooms: JSON.parse(JSON.stringify(this.map.rooms)),
          fog: this.map.fog.slice(),
          subpixels: JSON.parse(JSON.stringify(this.map.subpixels || {}))
        }));
        if (this.undoStack.length > 100) this.undoStack.shift();
        this.redoStack = [];
      },

      undo() {
        if (!this.undoStack.length) {
          toast('Nothing to undo', 'info', 1200);
          return;
        }
        this.redoStack.push(JSON.stringify({
          tiles: this.map.tiles.slice(),
          tokens: JSON.parse(JSON.stringify(this.map.tokens)),
          rooms: JSON.parse(JSON.stringify(this.map.rooms)),
          fog: this.map.fog.slice(),
          subpixels: JSON.parse(JSON.stringify(this.map.subpixels || {}))
        }));
        if (this.redoStack.length > 100) this.redoStack.shift();
        Object.assign(this.map, JSON.parse(this.undoStack.pop()));
        this._clearSelection();
        this._requestRender();
        toast('Undone', 'info', 800);
      },

      redo() {
        if (!this.redoStack.length) {
          toast('Nothing to redo', 'info', 1200);
          return;
        }
        this.undoStack.push(JSON.stringify({
          tiles: this.map.tiles.slice(),
          tokens: JSON.parse(JSON.stringify(this.map.tokens)),
          rooms: JSON.parse(JSON.stringify(this.map.rooms)),
          fog: this.map.fog.slice(),
          subpixels: JSON.parse(JSON.stringify(this.map.subpixels || {}))
        }));
        Object.assign(this.map, JSON.parse(this.redoStack.pop()));
        this._clearSelection();
        this._requestRender();
        toast('Redone', 'info', 800);
      },

      _requestRender() {
        if (this._rafId) return;
        this._rafId = requestAnimationFrame(() => {
          this._rafId = null;
          this._render();
        });
      },

      _render() {
        if (!this.wrap || !this.canvas) return;
        const {
          width: cw,
          height: ch
        } = this.wrap.getBoundingClientRect();
        if (!cw || !ch) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        if (this.canvas.width !== Math.round(cw * dpr) || this.canvas.height !== Math.round(ch * dpr)) {
          this.canvas.width = Math.round(cw * dpr);
          this.canvas.height = Math.round(ch * dpr);
          this.canvas.style.width = cw + 'px';
          this.canvas.style.height = ch + 'px';
        }
        const ctx = this.ctx;
        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, cw, ch);
        const bg = BG_STYLES[this.map.bg] || BG_STYLES.dungeon;
        ctx.fillStyle = bg.base;
        ctx.fillRect(0, 0, cw, ch);
        ctx.translate(this.panX, this.panY);
        ctx.scale(this._zoomLevel, this._zoomLevel);
        const mapW = this.map.width * CELL_SIZE,
          mapH = this.map.height * CELL_SIZE;
        ctx.fillStyle = bg.accent;
        ctx.fillRect(0, 0, mapW, mapH);
        this._renderTiles(ctx);
        this._renderSubpixels(ctx);
        this._renderGrid(ctx, mapW, mapH, bg.grid);
        if (this.subpixelMode) this._renderSubpixelGrid(ctx);
        this._renderRooms(ctx);
        if (this.isRoomDrawing && this.roomStart && this._hovCell) {
          const x = Math.min(this.roomStart.cx, this._hovCell.cx) * CELL_SIZE,
            y = Math.min(this.roomStart.cy, this._hovCell.cy) * CELL_SIZE;
          const w = (Math.abs(this._hovCell.cx - this.roomStart.cx) + 1) * CELL_SIZE,
            h = (Math.abs(this._hovCell.cy - this.roomStart.cy) + 1) * CELL_SIZE;
          ctx.strokeStyle = 'rgba(200,180,100,0.8)';
          ctx.lineWidth = 2 / this._zoomLevel;
          ctx.setLineDash([4 / this._zoomLevel, 4 / this._zoomLevel]);
          ctx.strokeRect(x, y, w, h);
          ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(200,180,100,0.06)';
          ctx.fillRect(x, y, w, h);
        }
        const paintToolList = ['floor', 'wall', 'door', 'water', 'grass', 'stone', 'sand', 'lava', 'ice', 'wood', 'swamp', 'mud', 'cavern', 'marble', 'crystal', 'ash', 'cobble', 'obsidian', 'blood', 'arcane', 'eraser'];
        if (this._hovCell && paintToolList.includes(this.tool)) {
          if (this.subpixelMode && this._hovSP) {
            const spSize = CELL_SIZE / SUBPIXEL_DIV;
            const hovCells = this._getSubpixelBrushCells(this._hovCell.cx, this._hovCell.cy, this._hovSP.spx, this._hovSP.spy);
            ctx.fillStyle = this.tool === 'eraser' ? 'rgba(255,80,60,0.35)' : 'rgba(255,220,80,0.35)';
            ctx.strokeStyle = this.tool === 'eraser' ? 'rgba(255,80,60,0.9)' : 'rgba(255,220,80,0.9)';
            ctx.lineWidth = 0.4 / this._zoomLevel;
            for (const {
                cx: bcx,
                cy: bcy,
                spx: bspx,
                spy: bspy
              }
              of hovCells) {
              const px = bcx * CELL_SIZE + bspx * spSize,
                py = bcy * CELL_SIZE + bspy * spSize;
              ctx.fillRect(px, py, spSize, spSize);
              ctx.strokeRect(px, py, spSize, spSize);
            }
          } else {
            const {
              cx,
              cy
            } = this._hovCell;
            const isE = this.tool === 'eraser';
            const strokeCol = isE ? 'rgba(255,80,60,0.8)' : 'rgba(255,220,80,0.7)';
            const fillCol = isE ? 'rgba(255,80,60,0.12)' : 'rgba(255,220,80,0.1)';
            ctx.lineWidth = 1.5 / this._zoomLevel;
            if (this.brushType === 'circle' && this.brushSize > 1) {
              const rad = (this.brushSize / 2) * CELL_SIZE;
              ctx.strokeStyle = strokeCol;
              ctx.beginPath();
              ctx.arc((cx + .5) * CELL_SIZE, (cy + .5) * CELL_SIZE, rad, 0, Math.PI * 2);
              ctx.stroke();
              ctx.fillStyle = fillCol;
              ctx.fill();
            } else if (this.brushType === 'pixel' || this.brushSize === 1) {
              ctx.strokeStyle = strokeCol;
              ctx.strokeRect(cx * CELL_SIZE, cy * CELL_SIZE, CELL_SIZE, CELL_SIZE);
              ctx.fillStyle = fillCol;
              ctx.fillRect(cx * CELL_SIZE, cy * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            } else {
              const half = Math.floor(this.brushSize / 2);
              const px = (cx - half) * CELL_SIZE,
                py = (cy - half) * CELL_SIZE,
                bw = this.brushSize * CELL_SIZE,
                bh = this.brushSize * CELL_SIZE;
              ctx.strokeStyle = strokeCol;
              ctx.strokeRect(px, py, bw, bh);
              ctx.fillStyle = fillCol;
              ctx.fillRect(px, py, bw, bh);
            }
          }
        }
        this._renderTokens(ctx);
        if (this._dragToken) {
          const t = this._dragToken,
            cs = (t.size || 1) * CELL_SIZE;
          ctx.strokeStyle = 'rgba(200,200,100,0.8)';
          ctx.lineWidth = 2 / this._zoomLevel;
          ctx.setLineDash([3 / this._zoomLevel, 3 / this._zoomLevel]);
          ctx.strokeRect(this._dragTargetCX * CELL_SIZE, this._dragTargetCY * CELL_SIZE, cs, cs);
          ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(255,255,100,0.1)';
          ctx.fillRect(this._dragTargetCX * CELL_SIZE, this._dragTargetCY * CELL_SIZE, cs, cs);
        }
        if (this.selected) this._renderSelection(ctx);
        ctx.restore();
      },

      _renderSubpixels(ctx) {
        if (!this.map.subpixels) return;
        const spSize = CELL_SIZE / SUBPIXEL_DIV;
        for (const [key, color] of Object.entries(this.map.subpixels)) {
          const p = key.split(',');
          if (p.length < 4) continue;
          ctx.fillStyle = color;
          ctx.fillRect(parseInt(p[0]) * CELL_SIZE + parseInt(p[2]) * spSize, parseInt(p[1]) * CELL_SIZE + parseInt(p[3]) * spSize, spSize, spSize);
        }
      },

      _renderSubpixelGrid(ctx) {
        if (!this._hovCell) return;
        const {
          cx,
          cy
        } = this._hovCell, spSize = CELL_SIZE / SUBPIXEL_DIV;
        ctx.strokeStyle = 'rgba(180,180,255,0.3)';
        ctx.lineWidth = 0.4 / this._zoomLevel;
        for (let dcx = -1; dcx <= 1; dcx++)
          for (let dcy = -1; dcy <= 1; dcy++) {
            if ((cx + dcx) < 0 || (cx + dcx) >= this.map.width || (cy + dcy) < 0 || (cy + dcy) >= this.map.height) continue;
            const ox = (cx + dcx) * CELL_SIZE,
              oy = (cy + dcy) * CELL_SIZE;
            ctx.beginPath();
            for (let sx = 0; sx <= SUBPIXEL_DIV; sx++) {
              ctx.moveTo(ox + sx * spSize, oy);
              ctx.lineTo(ox + sx * spSize, oy + CELL_SIZE);
            }
            for (let sy = 0; sy <= SUBPIXEL_DIV; sy++) {
              ctx.moveTo(ox, oy + sy * spSize);
              ctx.lineTo(ox + CELL_SIZE, oy + sy * spSize);
            }
            ctx.stroke();
          }
      },

      _renderTiles(ctx) {
        const m = this.map;
        for (let i = 0; i < m.tiles.length; i++) {
          const t = m.tiles[i];
          if (!t) continue;
          const name = TILE_IDX[t],
            info = TILE_TYPES[name];
          if (!info || !info.color) continue;
          const cx = (i % m.width) * CELL_SIZE,
            cy = Math.floor(i / m.width) * CELL_SIZE;
          ctx.fillStyle = info.color;
          ctx.fillRect(cx, cy, CELL_SIZE, CELL_SIZE);
          _drawTileDetail(ctx, name, cx, cy, CELL_SIZE);
        }
      },

      _renderGrid(ctx, mapW, mapH, gridColor) {
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 0.5 / this._zoomLevel;
        ctx.beginPath();
        for (let x = 0; x <= this.map.width; x++) {
          ctx.moveTo(x * CELL_SIZE, 0);
          ctx.lineTo(x * CELL_SIZE, mapH);
        }
        for (let y = 0; y <= this.map.height; y++) {
          ctx.moveTo(0, y * CELL_SIZE);
          ctx.lineTo(mapW, y * CELL_SIZE);
        }
        ctx.stroke();
        ctx.strokeStyle = 'rgba(150,130,100,0.4)';
        ctx.lineWidth = 1.5 / this._zoomLevel;
        ctx.strokeRect(0, 0, mapW, mapH);
      },

      _renderRooms(ctx) {
        this.map.rooms.forEach(room => {
          const x = room.x * CELL_SIZE,
            y = room.y * CELL_SIZE,
            w = room.w * CELL_SIZE,
            h = room.h * CELL_SIZE;
          ctx.strokeStyle = 'rgba(180,160,100,0.6)';
          ctx.lineWidth = 1.5 / this._zoomLevel;
          ctx.setLineDash([4 / this._zoomLevel, 4 / this._zoomLevel]);
          ctx.strokeRect(x, y, w, h);
          ctx.setLineDash([]);
          if (room.name) {
            const fs = Math.max(9, Math.min(14, CELL_SIZE * .35));
            ctx.font = `${fs}px Cinzel,serif`;
            ctx.fillStyle = 'rgba(200,180,120,0.9)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(room.name, x + w / 2, y + 4);
            ctx.textBaseline = 'alphabetic';
          }
        });
      },

      _renderTokens(ctx) {
        this.map.tokens.forEach(t => this._drawToken(ctx, t, 1, true));
      },

      _drawToken(ctx, t, alpha = 1, isEditor = false) {
        const isHidden = !!t.hidden,
          effAlpha = isHidden ? alpha * 0.38 : alpha;
        const cs = (t.size || 1) * CELL_SIZE,
          tx = t.cx * CELL_SIZE,
          ty = t.cy * CELL_SIZE;
        const r = cs * .43,
          cx = tx + cs / 2,
          cy = ty + cs / 2;
        const zl = isEditor ? this._zoomLevel : (Play._zoomLevel || 1);
        ctx.globalAlpha = effAlpha;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + r * .12, r * .8, r * .28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = t.color || '#888';
        ctx.fill();
        ctx.strokeStyle = isHidden ? 'rgba(200,150,255,0.5)' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1.5 / zl;
        ctx.stroke();
        const fs = Math.max(8, r * .9);
        ctx.font = `${fs}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t.icon || '?', cx, cy);
        if (r > 10) {
          const nfs = Math.max(6, r * .36);
          ctx.font = `bold ${nfs}px Inter,sans-serif`;
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.textBaseline = 'top';
          ctx.fillText(t.name || '', cx, ty + cs + 2);
        }
        if (t.maxHp > 0) {
          const bw = cs * .8,
            bx = tx + cs * .1,
            by = ty + cs - 5,
            pct = Math.max(0, Math.min(1, (t.hp || 0) / t.maxHp));
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(bx, by, bw, 4);
          ctx.fillStyle = pct > .5 ? '#40c060' : pct > .25 ? '#d0a020' : '#c02020';
          ctx.fillRect(bx, by, bw * pct, 4);
        }
        if (isHidden) {
          const bfs = Math.max(7, r * .55);
          ctx.font = `${bfs}px sans-serif`;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'top';
          ctx.globalAlpha = 0.85;
          ctx.fillText('🫥', tx + cs - 1, ty + 1);
        }
        ctx.globalAlpha = 1;
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'left';
      },

      _renderSelection(ctx) {
        const sel = this.selected;
        if (!sel) return;
        if (sel.type === 'token') {
          const t = this.map.tokens.find(t => t.id === sel.id);
          if (!t) return;
          const cs = (t.size || 1) * CELL_SIZE;
          ctx.strokeStyle = 'rgba(255,220,80,0.9)';
          ctx.lineWidth = 2 / this._zoomLevel;
          ctx.setLineDash([4 / this._zoomLevel, 2 / this._zoomLevel]);
          ctx.strokeRect(t.cx * CELL_SIZE - 2, t.cy * CELL_SIZE - 2, cs + 4, cs + 4);
          ctx.setLineDash([]);
        } else if (sel.type === 'room') {
          const r = this.map.rooms.find(r => r.id === sel.id);
          if (!r) return;
          ctx.strokeStyle = 'rgba(255,220,80,0.9)';
          ctx.lineWidth = 2.5 / this._zoomLevel;
          ctx.strokeRect(r.x * CELL_SIZE - 2, r.y * CELL_SIZE - 2, r.w * CELL_SIZE + 4, r.h * CELL_SIZE + 4);
        }
      },
    };

    /* ═══ LIBRARY ═══ */
    const Library = {
      render() {
        const maps = Storage.getMaps(),
          list = document.getElementById('library-list');
        if (!maps.length) {
          list.innerHTML = `<div style="text-align:center;padding:48px 16px"><div style="font-size:3rem;margin-bottom:12px">🗺️</div><div class="font-serif" style="font-size:1.1rem;color:hsl(var(--muted-foreground));margin-bottom:16px">No maps yet</div><button class="btn btn-gold" onclick="App.goCreate()">Create your first map</button></div>`;
          return;
        }
        list.innerHTML = '';
        maps.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).forEach(map => {
          const el = document.createElement('div');
          el.className = 'card map-card';
          el.innerHTML = `<div class="map-thumb">🗺️</div><div class="map-info"><div class="map-name">${this._esc(map.name)}</div><div class="map-meta">${map.width}×${map.height} · ${this._fd(map.updatedAt)}</div><div class="map-meta">${(map.tokens||[]).length} tokens · ${(map.rooms||[]).length} rooms</div></div><div class="map-actions"><button class="btn btn-secondary btn-sm" onclick="Library.edit('${map.id}')">✏️</button><button class="btn btn-secondary btn-sm" onclick="Library.play('${map.id}')">▶</button><button class="btn btn-danger btn-sm" onclick="Library.delete('${map.id}')">🗑</button></div>`;
          list.appendChild(el);
        });
      },
      _esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      },
      _fd(ts) {
        if (!ts) return '';
        const d = new Date(ts);
        return d.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric'
        });
      },
      edit(id) {
        const m = Storage.getMap(id);
        if (!m) {
          toast('Map not found', 'error');
          return;
        }
        Editor.init(m);
      },
      play(id) {
        const m = Storage.getMap(id);
        if (!m) {
          toast('Map not found', 'error');
          return;
        }
        Session.startLocal(m);
      },
      delete(id) {
        const m = Storage.getMap(id);
        if (!m) return;
        Modal.confirm('Delete Map', `Delete "${m.name}"? Cannot be undone.`, () => {
          Storage.deleteMap(id);
          this.render();
          toast('Map deleted', 'info');
        });
      },
    };

    /* ═══════════════════════════════════════════════════════════
       SESSION
    ═══════════════════════════════════════════════════════════ */
    const Session = {
      current: null,
      _joining: false,

      _generateCode() {
        const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        return Array.from({
          length: 6
        }, () => c[Math.floor(Math.random() * c.length)]).join('');
      },

      init() {
        const sel = document.getElementById('session-host-map');
        sel.innerHTML = '<option value="">— Choose a map —</option>';
        Storage.getMaps().forEach(m => {
          const o = document.createElement('option');
          o.value = m.id;
          o.textContent = m.name;
          sel.appendChild(o);
        });
        const saved = Storage.getSession();
        if (saved) {
          this.current = saved;
          this._showActivePanel(saved.role);
        }
        this._updateFirebaseDiag();
      },

      _updateFirebaseDiag() {
        const box = document.getElementById('firebase-diag-box');
        const detail = document.getElementById('firebase-diag-detail');
        const statusEl = document.getElementById('session-firebase-status');
        if (!FIREBASE_ENABLED) {
          box.className = 'firebase-status-box status-warn';
          box.querySelector('.firebase-status-icon').textContent = '⚠️';
          box.querySelector('.firebase-status-text strong').textContent = 'Firebase disabled';
          detail.textContent = 'Set FIREBASE_ENABLED = true to enable multiplayer.';
          statusEl.innerHTML = '<div class="dot dot-yellow"></div><span>Local Only</span>';
          return;
        }
        if (window._fbInitError) {
          box.className = 'firebase-status-box status-err';
          box.querySelector('.firebase-status-icon').textContent = '❌';
          box.querySelector('.firebase-status-text strong').textContent = 'Firebase init failed';
          detail.textContent = window._fbInitError;
          statusEl.innerHTML = '<div class="dot dot-red"></div><span>Error</span>';
          return;
        }
        if (window._fbReady) {
          box.className = 'firebase-status-box status-ok';
          box.querySelector('.firebase-status-icon').textContent = '✅';
          box.querySelector('.firebase-status-text strong').textContent = 'Firebase SDK connected';
          detail.textContent = 'SDK ready. Multiplayer enabled.';
          statusEl.innerHTML = '<div class="dot dot-green"></div><span>Connected</span>';
        } else {
          box.className = 'firebase-status-box status-warn';
          box.querySelector('.firebase-status-icon').textContent = '⏳';
          box.querySelector('.firebase-status-text strong').textContent = 'Connecting to Firebase…';
          detail.textContent = 'SDK loading. Please wait a moment.';
          statusEl.innerHTML = '<div class="dot dot-yellow"></div><span>Connecting…</span>';
          setTimeout(() => this._updateFirebaseDiag(), 1500);
        }
      },

      _stepSet(id, state, label) {
        const el = document.getElementById(id);
        if (!el) return;
        el.className = 'join-progress-step ' + state;
        const icons = {
          pending: '⏳',
          active: '🔄',
          done: '✅',
          error: '❌'
        };
        el.querySelector('.step-icon').textContent = icons[state] || '·';
        if (label) el.querySelector('span:last-child').textContent = label;
      },

      _showJoinProgress(visible) {
        document.getElementById('join-progress').classList.toggle('visible', visible);
        if (visible)['jstep-firebase', 'jstep-lookup', 'jstep-map', 'jstep-register', 'jstep-listen'].forEach(id => this._stepSet(id, 'pending'));
      },

      _setJoinBtn(busy) {
        const btn = document.getElementById('btn-join-session');
        btn.disabled = busy;
        btn.textContent = busy ? '⏳ Connecting…' : '🗺️ Join Session';
      },

      host() {
        if (!window._fbReady && FIREBASE_ENABLED) {
          if (window._fbInitError) {
            toast('Firebase failed to initialise: ' + window._fbInitError, 'error', 4000);
            return;
          }
          toast('Firebase not ready yet — please wait a moment', 'error', 3000);
          return;
        }
        const mapId = document.getElementById('session-host-map').value;
        const name = document.getElementById('session-host-name').value.trim() || 'Dungeon Master';
        if (!mapId) {
          toast('Please select a map', 'error');
          return;
        }
        const map = Storage.getMap(mapId);
        if (!map) {
          toast('Map not found', 'error');
          return;
        }
        const code = this._generateCode();
        this.current = {
          roomCode: code,
          role: 'dm',
          mapId,
          map: JSON.parse(JSON.stringify(map)),
          playerName: name,
          players: [{
            id: 'dm',
            name,
            role: 'dm',
            color: '#e0c040'
          }]
        };
        Storage.saveSession(this.current);
        /* Show a pending state so the DM doesn't share the code before
           Firebase has confirmed the write — that was causing "room not found". */
        document.getElementById('session-active-panel').classList.remove('hidden');
        document.getElementById('session-display-code').textContent = '······';
        document.getElementById('session-active-title').textContent = '⏳ Opening Session…';
        document.getElementById('session-active-hint').textContent = 'Connecting to Firebase…';
        document.getElementById('btn-copy-code').classList.add('hidden');
        if (FIREBASE_ENABLED && window._fbReady) this._firebaseHost(code, map);
        else {
          this._showActivePanel('dm');
          toast(`Session opened (local only — Firebase not connected)! Code: ${code}`, 'info', 5000);
        }
      },

      /* FIX: join properly waits for Firebase before proceeding */
      join() {
        if (this._joining) return;
        const code = (document.getElementById('session-join-code').value || '').trim().toUpperCase();
        const name = document.getElementById('session-join-name').value.trim() || 'Adventurer';
        if (code.length !== 6) {
          toast('Enter a 6-character room code', 'error');
          return;
        }
        if (!name) {
          toast('Enter your character name', 'error');
          return;
        }
        if (!FIREBASE_ENABLED) {
          toast('Firebase not enabled — multiplayer requires Firebase', 'info', 4000);
          return;
        }
        if (window._fbInitError) {
          toast('Firebase failed to initialise: ' + window._fbInitError, 'error', 5000);
          return;
        }

        this._joining = true;
        this._setJoinBtn(true);
        this._showJoinProgress(true);
        this._stepSet('jstep-firebase', 'active');

        /* Wait up to 8 s for Firebase SDK, then proceed */
        this._waitForFirebase(8000).then(ready => {
          if (!ready) {
            this._stepSet('jstep-firebase', 'error', 'Firebase not available');
            toast('Firebase is not connected — check your internet connection', 'error', 5000);
            this._joining = false;
            this._setJoinBtn(false);
            return;
          }
          this._stepSet('jstep-firebase', 'done');
          this._firebaseJoin(code, name);
        });
      },

      /* FIX: polls _fbReady every 200 ms, also listens for events */
      _waitForFirebase(timeoutMs) {
        return new Promise(resolve => {
          if (window._fbReady) {
            resolve(true);
            return;
          }
          if (window._fbInitError) {
            resolve(false);
            return;
          }
          const deadline = Date.now() + timeoutMs;
          const onReady = () => {
            resolve(true);
            cleanup();
          };
          const onError = () => {
            resolve(false);
            cleanup();
          };
          const cleanup = () => {
            document.removeEventListener('firebase-ready', onReady);
            document.removeEventListener('firebase-error', onError);
          };
          document.addEventListener('firebase-ready', onReady);
          document.addEventListener('firebase-error', onError);
          const check = () => {
            if (window._fbReady) {
              resolve(true);
              cleanup();
              return;
            }
            if (window._fbInitError) {
              resolve(false);
              cleanup();
              return;
            }
            if (Date.now() >= deadline) {
              resolve(false);
              cleanup();
              return;
            }
            setTimeout(check, 200);
          };
          check();
        });
      },

      startLocal(map) {
        this.current = {
          roomCode: 'LOCAL',
          role: 'dm',
          mapId: map.id,
          map: JSON.parse(JSON.stringify(map)),
          playerName: 'Dungeon Master',
          players: [{
            id: 'dm',
            name: 'Dungeon Master',
            role: 'dm',
            color: '#e0c040'
          }]
        };
        Storage.saveSession(this.current);
        this.goPlay();
      },

      _showActivePanel(role) {
        document.getElementById('session-active-panel').classList.remove('hidden');
        document.getElementById('session-display-code').textContent = this.current.roomCode;
        if (role === 'player') {
          document.getElementById('session-active-title').textContent = '✅ Joined Session';
          document.getElementById('session-active-hint').textContent = `Room: ${this.current.roomCode} · Tap Enter Play Screen`;
          document.getElementById('btn-copy-code').classList.add('hidden');
        } else {
          document.getElementById('session-active-title').textContent = '✅ Active Session';
          document.getElementById('session-active-hint').textContent = 'Share this code with players';
          document.getElementById('btn-copy-code').classList.remove('hidden');
        }
      },

      copyCode() {
        if (!this.current) return;
        const code = this.current.roomCode;
        if (navigator.clipboard?.writeText) navigator.clipboard.writeText(code).then(() => toast('Code copied! ' + code, 'success', 3000)).catch(() => this._fallbackCopy(code));
        else this._fallbackCopy(code);
      },

      _fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try {
          document.execCommand('copy');
          toast('Code copied! ' + text, 'success', 3000);
        } catch (e) {
          toast('Code: ' + text, 'info', 6000);
        }
        document.body.removeChild(ta);
      },

      goPlay() {
        if (!this.current) {
          toast('No active session', 'error');
          return;
        }
        Play.init(this.current);
      },

      end() {
        Modal.confirm('End Session', 'End the current session?', () => {
          if (FIREBASE_ENABLED && window._fbReady && this.current) this._firebaseEnd();
          this.current = null;
          Storage.clearSession();
          document.getElementById('session-active-panel').classList.add('hidden');
          this._joining = false;
          this._setJoinBtn(false);
          this._showJoinProgress(false);
          toast('Session ended', 'info');
        });
      },

      _firebaseHost(code, map) {
        if (!window._fbSet) {
          toast('Firebase API unavailable', 'error', 4000);
          return;
        }
        const tokensById = map.tokens ? Object.fromEntries(map.tokens.map(t => [t.id, JSON.parse(JSON.stringify(t))])) : null;
        const roomData = {
          code,
          createdAt: Date.now(),
          hostVersion: 1,
          map: JSON.parse(JSON.stringify(map)),
          players: {},
          fog: map.fog ? [...map.fog] : null,
          tokens: tokensById,
        };
        window._fbSet(`rooms/${code}`, roomData)
          .then(() => {
            /* Room is confirmed in Firebase — NOW it's safe to show the code */
            this._showActivePanel('dm');
            toast(`Session opened! Code: ${code}`, 'success', 5000);
            this._setupDmSync(code);
          })
          .catch(err => {
            /* Show the error in the panel so the DM sees it */
            document.getElementById('session-active-title').textContent = '❌ Failed to Open';
            document.getElementById('session-display-code').textContent = 'ERROR';
            document.getElementById('session-active-hint').textContent = err.message || 'Check your connection and try again';
            toast('Failed to create room: ' + err.message, 'error', 6000);
          });
      },

      /* Deduplicate a raw Firebase token snapshot — handles both array and
         object formats, and removes any duplicate IDs (last write wins). */
      _parseTokens(raw) {
        if (raw == null) return [];
        const arr = Array.isArray(raw) ? raw : Object.values(raw);
        const map = new Map();
        arr.forEach(t => {
          if (t && t.id) map.set(t.id, t);
        });
        return Array.from(map.values());
      },

      _setupDmSync(code) {
        if (!window._fbOnValue) return;
        const unsubPlayers = window._fbOnValue(`rooms/${code}/players`, snap => {
          const players = snap.val();
          if (this.current && players) {
            this.current.players = Object.values(players);
            if (typeof Play !== 'undefined' && Play.session === this.current) Play._updatePlayersList();
          }
        });
        const unsubTokens = window._fbOnValue(`rooms/${code}/tokens`, snap => {
          const raw = snap.val();
          if (raw != null && this.current && this.current.map) {
            const tokens = this._parseTokens(raw);
            this.current.map.tokens = JSON.parse(JSON.stringify(tokens));
            if (typeof Play !== 'undefined' && Play.session && Play.session.roomCode === code) {
              Play.map.tokens = JSON.parse(JSON.stringify(tokens));
              Play._updateTokenOverlay && Play._updateTokenOverlay();
              Play._updateInitiative && Play._updateInitiative();
              Play._requestRender && Play._requestRender();
            }
          }
        });
        if (this.current) {
          this.current._playerListenUnsub = unsubPlayers;
          this.current._tokenUnsub = unsubTokens;
        }
      },

      pushPlayerToken(token) {
        if (!this.current || this.current.role !== 'player') return;
        if (!window._fbSet || !FIREBASE_ENABLED || !window._fbReady) return;
        const code = this.current.roomCode;
        if (code === 'LOCAL') return;
        window._fbSet(`rooms/${code}/tokens/${token.id}`, JSON.parse(JSON.stringify(token)));
      },

      pushFogUpdate() {
        if (!this.current || this.current.role !== 'dm') return;
        if (!window._fbSet || !FIREBASE_ENABLED || !window._fbReady) return;
        const code = this.current.roomCode;
        if (code === 'LOCAL') return;
        const fog = (typeof Play !== 'undefined' && Play.map) ? Play.map.fog : (this.current.map.fog || []);
        window._fbSet(`rooms/${code}/fog`, fog || []);
      },

      pushTokenUpdate() {
        if (!this.current || this.current.role !== 'dm') return;
        if (!window._fbSet || !FIREBASE_ENABLED || !window._fbReady) return;
        const code = this.current.roomCode;
        if (code === 'LOCAL') return;
        const tokens = (typeof Play !== 'undefined' && Play.map) ? Play.map.tokens : (this.current.map.tokens || []);
        /* Always write as an object keyed by token.id — never as an array.
           Writing an array creates numeric keys that conflict with player's
           named-key writes (token.id), resulting in duplicate entries. */
        const obj = {};
        (tokens || []).forEach(t => {
          if (t && t.id) obj[t.id] = JSON.parse(JSON.stringify(t));
        });
        window._fbSet(`rooms/${code}/tokens`, obj);
      },

      _firebaseJoin(code, playerName) {
        this._stepSet('jstep-lookup', 'active');
        if (!window._fbGet) {
          this._stepSet('jstep-lookup', 'error', 'Firebase API unavailable');
          toast('Firebase API is not ready. Try refreshing.', 'error', 5000);
          this._joining = false;
          this._setJoinBtn(false);
          return;
        }
        /* Retry up to 3 times with 1.5s between attempts — handles the race
           where the DM's Firebase write hasn't propagated when the player looks up */
        const tryLookup = (attemptsLeft) => {
          window._fbGet(`rooms/${code}`).then(snap => {
            const data = snap.val();
            if (!data) {
              if (attemptsLeft > 1) {
                const attempt = 4 - attemptsLeft + 1;
                this._stepSet('jstep-lookup', 'active', `Retrying… (${attempt}/3)`);
                setTimeout(() => tryLookup(attemptsLeft - 1), 1500);
              } else {
                this._stepSet('jstep-lookup', 'error', 'Room not found');
                toast(`Room "${code}" not found — make sure the DM's session has fully opened before joining`, 'error', 6000);
                this._joining = false;
                this._setJoinBtn(false);
              }
              return;
            }
            this._stepSet('jstep-lookup', 'done');
            this._stepSet('jstep-map', 'active');
            const map = data.map;
            if (!map) {
              this._stepSet('jstep-map', 'error', 'Map data missing');
              toast('Room found but map data is missing', 'error', 4000);
              this._joining = false;
              this._setJoinBtn(false);
              return;
            }
            if (data.fog) map.fog = Array.isArray(data.fog) ? [...data.fog] : Object.values(data.fog);
            if (data.tokens != null) map.tokens = this._parseTokens(data.tokens);
            this._stepSet('jstep-map', 'done');
            this._stepSet('jstep-register', 'active');
            const playerId = crypto.randomUUID();
            window._fbSet(`rooms/${code}/players/${playerId}`, {
              id: playerId,
              name: playerName,
              role: 'player',
              color: '#40a0e0',
              joinedAt: Date.now()
            }).then(() => {
              this._stepSet('jstep-register', 'done');
              this._stepSet('jstep-listen', 'active');
              this.current = {
                roomCode: code,
                role: 'player',
                mapId: map.id || 'remote',
                map: JSON.parse(JSON.stringify(map)),
                playerName,
                playerId,
                players: data.players ? Object.values(data.players) : []
              };
              Storage.saveSession(this.current);
              this._setupPlayerSync(code);
              this._stepSet('jstep-listen', 'done');
              this._showActivePanel('player');
              this._joining = false;
              this._setJoinBtn(false);
              toast(`Joined session as ${playerName}!`, 'success', 3000);
            }).catch(err => {
              this._stepSet('jstep-register', 'error', 'Registration failed');
              toast('Failed to register: ' + err.message, 'error', 5000);
              this._joining = false;
              this._setJoinBtn(false);
            });
          }).catch(err => {
            this._stepSet('jstep-lookup', 'error', 'Lookup failed: ' + err.message);
            toast('Firebase lookup failed: ' + err.message, 'error', 5000);
            this._joining = false;
            this._setJoinBtn(false);
          });
        };
        tryLookup(3);
      },

      _setupPlayerSync(code) {
        if (!window._fbOnValue) return;
        const unsubFog = window._fbOnValue(`rooms/${code}/fog`, snap => {
          const fog = snap.val();
          if (fog && this.current && this.current.map) {
            this.current.map.fog = Array.isArray(fog) ? fog : Object.values(fog);
            if (typeof Play !== 'undefined' && Play.session && Play.session.roomCode === code) {
              Play.map.fog = this.current.map.fog.slice();
              Play._requestRender && Play._requestRender();
            }
          }
        });
        const unsubTokens = window._fbOnValue(`rooms/${code}/tokens`, snap => {
          const raw = snap.val();
          if (raw != null && this.current && this.current.map) {
            const tokens = this._parseTokens(raw);
            this.current.map.tokens = JSON.parse(JSON.stringify(tokens));
            if (typeof Play !== 'undefined' && Play.session && Play.session.roomCode === code) {
              Play.map.tokens = JSON.parse(JSON.stringify(tokens));
              Play._requestRender && Play._requestRender();
            }
          }
        });
        const unsubPlayers = window._fbOnValue(`rooms/${code}/players`, snap => {
          const raw = snap.val();
          if (raw && this.current) {
            this.current.players = Object.values(raw);
            if (typeof Play !== 'undefined' && Play.session && Play.session.roomCode === code) {
              Play.session.players = this.current.players.slice();
              Play._updatePlayersList && Play._updatePlayersList();
            }
          }
        });
        if (this.current) {
          this.current._fogUnsub = unsubFog;
          this.current._tokenUnsub = unsubTokens;
          this.current._playerListenUnsub = unsubPlayers;
        }
      },

      _firebaseEnd() {
        if (this.current) {
          try {
            if (this.current._playerListenUnsub) this.current._playerListenUnsub();
          } catch (_) {}
          try {
            if (this.current._fogUnsub) this.current._fogUnsub();
          } catch (_) {}
          try {
            if (this.current._tokenUnsub) this.current._tokenUnsub();
          } catch (_) {}
          if (this.current.roomCode && this.current.role === 'dm') window._fbRemove?.(`rooms/${this.current.roomCode}`);
        }
      },
    };

    /* ═══════════════════════════════════════════════════════════
       PLAY ENGINE
    ═══════════════════════════════════════════════════════════ */
    const Play = {
      session: null,
      map: null,
      role: 'dm',
      playCanvas: null,
      fogCanvas: null,
      minimapCanvas: null,
      playCtx: null,
      fogCtx: null,
      minimapCtx: null,
      wrap: null,
      _zoomLevel: 1.0,
      panX: 0,
      panY: 0,
      _panning: false,
      _panStart: null,
      _pointers: {},
      _lastPinch: null,
      _lastMidX: 0,
      _lastMidY: 0,
      /* FIX: two-finger gesture tracking (same as Editor) */
      _gesturePointerCount: 0,
      tool: 'move-token',
      brushSize: 3,
      showGrid: true,
      showFogPreview: true,
      paused: false,
      draggingToken: null,
      _dragTargetCX: 0,
      _dragTargetCY: 0,
      pingAnim: null,
      measureStart: null,
      measureEnd: null,
      initiativeIdx: 0,
      _rafId: null,
      _myTokenId: null,
      _painting: false,
      _cursorCell: null,
      _playerPanning: false,
      _movementRemaining: 30,
      _movementUsed: 0,
      _showTokenOverlay: true,
      _spaceDown: false,
      _jumpMode: false,

      init(session) {
        this.session = session;
        this.map = JSON.parse(JSON.stringify(session.map));
        this.role = session.role;
        if (!Array.isArray(this.map.tokens)) this.map.tokens = [];
        if (!Array.isArray(this.map.fog)) this.map.fog = [];
        this.tool = 'move-token';
        this._myTokenId = null;
        this._painting = false;
        this._panning = false;
        this._pointers = {};
        this._gesturePointerCount = 0;
        this._lastPinch = null;
        this._lastMidX = 0;
        this._lastMidY = 0;
        this._playerPanning = false;
        this.draggingToken = null;
        this.measureStart = null;
        this.measureEnd = null;
        this.pingAnim = null;
        this._showTokenOverlay = true;
        this._spaceDown = false;
        this._jumpMode = false;
        document.getElementById('jump-mode-banner').classList.add('hidden');
        PlayerSettings.load();
        this._movementRemaining = PlayerSettings.speed;
        this._movementUsed = 0;

        this.playCanvas = document.getElementById('play-canvas');
        this.fogCanvas = document.getElementById('fog-canvas');
        this.minimapCanvas = document.getElementById('minimap-canvas');
        this.playCtx = this.playCanvas.getContext('2d');
        this.fogCtx = this.fogCanvas.getContext('2d');
        this.minimapCtx = this.minimapCanvas.getContext('2d');
        this.wrap = document.getElementById('play-canvas-wrap');

        document.getElementById('play-map-name').textContent = this.map.name;
        document.getElementById('play-role-badge').textContent = this.role === 'dm' ? 'DM' : 'Player';
        document.getElementById('play-role-badge').className = 'badge ' + (this.role === 'dm' ? 'badge-gold' : 'badge-green');
        const isDM = this.role === 'dm';
        document.getElementById('play-dm-topbar').style.display = isDM ? '' : 'none';
        document.getElementById('play-player-topbar').style.display = isDM ? 'none' : '';
        document.getElementById('player-hud').classList.toggle('hidden', isDM);
        document.getElementById('dm-drawer').classList.remove('expanded');

        this._fit();
        this._bindPlayEvents();
        FloatToolsPicker.initPlay();
        this._updatePlayerTracker();
        this._updateTokenOverlay();
        this._updateInitiative();
        this._updatePlayersList();
        this._requestRender();

        if (this.role === 'player') {
          const pid = this.session.playerId;
          const PLAYER_COLORS = ['#40a0e0', '#e06040', '#40c060', '#c060c0', '#e0c040', '#40c0c0'];
          /* 1. Look for an already-claimed token belonging to this player (by playerId) */
          let mt = pid ? this.map.tokens.find(t => t.playerId === pid) : null;
          /* 2. Claim an unclaimed pre-placed player token (only if no playerId match found) */
          if (!mt) mt = this.map.tokens.find(t => t.type === 'player' && !t.hidden && !t.playerId);
          if (mt) {
            let changed = false;
            if (pid && !mt.playerId) {
              mt.playerId = pid;
              changed = true;
            }
            if (this.session.playerName && mt.name !== this.session.playerName) {
              mt.name = this.session.playerName;
              changed = true;
            }
            this._myTokenId = mt.id;
            /* Only push if we actually modified something, to avoid unnecessary writes */
            if (changed) Session.pushPlayerToken(mt);
          } else {
            /* 3. Auto-spawn a token at map centre for this player — only if truly no token exists */
            const colorIdx = this.map.tokens.filter(t => t.type === 'player').length;
            const cx = Math.floor(this.map.width / 2),
              cy = Math.floor(this.map.height / 2);
            /* Use a stable token ID based on playerId so reconnects don't create duplicates */
            const stableId = pid ? `player-${pid}` : crypto.randomUUID();
            /* Check one more time if this stable ID already exists (race condition guard) */
            const existing = this.map.tokens.find(t => t.id === stableId);
            if (existing) {
              this._myTokenId = existing.id;
            } else {
              const token = {
                id: stableId,
                playerId: pid || null,
                type: 'player',
                cx,
                cy,
                size: 1,
                name: this.session.playerName || 'Player',
                icon: '👤',
                color: PLAYER_COLORS[colorIdx % PLAYER_COLORS.length],
                hp: 20,
                maxHp: 20,
                initiative: 0,
                notes: '',
                hidden: false
              };
              this.map.tokens.push(token);
              this._myTokenId = token.id;
              Session.pushPlayerToken(token);
            }
          }
        }
        App.show('screen-play');
      },

      _fit() {
        if (!this.wrap) return;
        const {
          width: cw,
          height: ch
        } = this.wrap.getBoundingClientRect();
        if (!cw || !ch) return;
        const mapW = this.map.width * CELL_SIZE,
          mapH = this.map.height * CELL_SIZE;
        this._zoomLevel = Math.min(cw / mapW, ch / mapH) * 0.9;
        this.panX = (cw - mapW * this._zoomLevel) / 2;
        this.panY = (ch - mapH * this._zoomLevel) / 2;
      },

      _bindPlayEvents() {
        const cv = this.playCanvas;
        if (cv._plDown) cv.removeEventListener('pointerdown', cv._plDown);
        if (cv._plMove) cv.removeEventListener('pointermove', cv._plMove);
        if (cv._plUp) cv.removeEventListener('pointerup', cv._plUp);
        if (cv._plWheel) cv.removeEventListener('wheel', cv._plWheel);
        if (cv._plCtx) cv.removeEventListener('contextmenu', cv._plCtx);
        cv._plDown = e => this._playDown(e);
        cv._plMove = e => this._playMove(e);
        cv._plUp = e => this._playUp(e);
        cv._plWheel = e => this._playWheel(e);
        cv._plCtx = e => {
          e.preventDefault();
          this._playRightClick(e);
        };
        cv.addEventListener('pointerdown', cv._plDown);
        cv.addEventListener('pointermove', cv._plMove);
        cv.addEventListener('pointerup', cv._plUp);
        cv.addEventListener('pointercancel', cv._plUp);
        cv.addEventListener('wheel', cv._plWheel, {
          passive: false
        });
        cv.addEventListener('contextmenu', cv._plCtx);
        if (document._plKey) document.removeEventListener('keydown', document._plKey);
        if (document._plKeyUp) document.removeEventListener('keyup', document._plKeyUp);
        if (document._plClickOutside) document.removeEventListener('pointerdown', document._plClickOutside);
        document._plKey = e => this._playKey(e);
        document._plKeyUp = e => this._playKeyUp(e);
        document._plClickOutside = e => {
          if (!e.target.closest('.topbar-dd-wrap')) {
            ['dd-dm-players', 'dd-dm-tokens', 'dd-p-players'].forEach(id => {
              const el = document.getElementById(id);
              if (el) el.classList.add('hidden');
            });
          }
        };
        document.addEventListener('keydown', document._plKey);
        document.addEventListener('keyup', document._plKeyUp);
        document.addEventListener('pointerdown', document._plClickOutside);
      },

      _evToWorld(e) {
        const r = this.playCanvas.getBoundingClientRect();
        return {
          wx: (e.clientX - r.left - this.panX) / this._zoomLevel,
          wy: (e.clientY - r.top - this.panY) / this._zoomLevel
        };
      },
      _worldToCell(wx, wy) {
        return {
          cx: Math.floor(wx / CELL_SIZE),
          cy: Math.floor(wy / CELL_SIZE)
        };
      },

      /* FIX: same two-finger approach as Editor */
      _playDown(e) {
        e.preventDefault();
        const before = Object.keys(this._pointers).length;
        this._pointers[e.pointerId] = {
          x: e.clientX,
          y: e.clientY
        };
        const pcount = Object.keys(this._pointers).length;
        if (before === 0) this._gesturePointerCount = 1;
        if (pcount > this._gesturePointerCount) this._gesturePointerCount = pcount;

        if (pcount >= 2) {
          this._painting = false;
          this.draggingToken = null;
          this.measureStart = null;
          this._panning = false;
          const pts = Object.values(this._pointers);
          const mx = (pts[0].x + pts[1].x) / 2,
            my = (pts[0].y + pts[1].y) / 2;
          this._lastPinch = this._getPinchDist();
          this._lastMidX = mx;
          this._lastMidY = my;
          return;
        }

        if (this._gesturePointerCount >= 2) return;

        if (e.button === 1 || (e.button === 0 && e.altKey) || (e.button === 0 && this._spaceDown)) {
          this._panning = true;
          this._panStart = {
            x: e.clientX - this.panX,
            y: e.clientY - this.panY
          };
          return;
        }

        this.playCanvas.setPointerCapture(e.pointerId);
        const {
          wx,
          wy
        } = this._evToWorld(e);
        const {
          cx,
          cy
        } = this._worldToCell(wx, wy);
        this._cursorCell = {
          cx,
          cy
        };

        if (this._jumpMode) {
          this.jumpTo(cx, cy);
          return;
        }

        if (this.tool === 'reveal' || this.tool === 'hide' || this.tool === 'reveal-room') {
          if (this.role === 'dm') {
            this._painting = true;
            this._applyFog(cx, cy, this.tool === 'hide' ? 1 : 0);
          }
          return;
        }

        const token = this._tokenAt(cx, cy);
        if (token && (this.role === 'dm' || (this.role === 'player' && token.id === this._myTokenId))) {
          this.draggingToken = token;
          this._dragTargetCX = token.cx;
          this._dragTargetCY = token.cy;
          return;
        }

        if (this.tool === 'measure') {
          this.measureStart = {
            wx,
            wy
          };
          this.measureEnd = {
            wx,
            wy
          };
        } else if (this.tool === 'ping') {
          this._doPing(wx, wy);
        } else if (this._playerPanning) {
          this._panning = true;
          this._panStart = {
            x: e.clientX - this.panX,
            y: e.clientY - this.panY
          };
        }
      },

      _playMove(e) {
        this._pointers[e.pointerId] = {
          x: e.clientX,
          y: e.clientY
        };
        const pcount = Object.keys(this._pointers).length;
        if (pcount > this._gesturePointerCount) this._gesturePointerCount = pcount;

        if (pcount >= 2) {
          const pts = Object.values(this._pointers);
          const mx = (pts[0].x + pts[1].x) / 2,
            my = (pts[0].y + pts[1].y) / 2;
          const nd = this._getPinchDist();
          if (this._lastPinch > 0 && nd > 0 && Math.abs(nd - this._lastPinch) > 3) {
            const factor = nd / this._lastPinch;
            const r = this.playCanvas.getBoundingClientRect();
            this._zoomAt(mx - r.left, my - r.top, factor);
            this._lastPinch = nd;
          }
          /* FIX: delta-based two-finger pan */
          this.panX += mx - this._lastMidX;
          this.panY += my - this._lastMidY;
          this._lastMidX = mx;
          this._lastMidY = my;
          this._requestRender();
          return;
        }

        if (this._panning && this._panStart) {
          this.panX = e.clientX - this._panStart.x;
          this.panY = e.clientY - this._panStart.y;
          this._requestRender();
          return;
        }

        const {
          wx,
          wy
        } = this._evToWorld(e);
        const {
          cx,
          cy
        } = this._worldToCell(wx, wy);
        this._cursorCell = {
          cx,
          cy
        };

        if (this.draggingToken) {
          this._dragTargetCX = Math.max(0, Math.min(this.map.width - 1, cx));
          this._dragTargetCY = Math.max(0, Math.min(this.map.height - 1, cy));
          this._requestRender();
          return;
        }

        /* FIX: only paint on a clean single-finger gesture */
        if (this._painting && this._gesturePointerCount < 2 && this.role === 'dm') {
          if (this.tool === 'reveal' || this.tool === 'hide' || this.tool === 'reveal-room') this._applyFog(cx, cy, this.tool === 'hide' ? 1 : 0);
        }

        if (this.tool === 'measure' && this.measureStart) this.measureEnd = {
          wx,
          wy
        };
        this._requestRender();
      },

      _playUp(e) {
        delete this._pointers[e.pointerId];
        const remaining = Object.keys(this._pointers).length;
        if (remaining >= 1) {
          if (remaining === 1) {
            this._lastPinch = null;
            const pts = Object.values(this._pointers);
            this._lastMidX = pts[0].x;
            this._lastMidY = pts[0].y;
            this._panning = false;
          }
          return;
        }
        /* FIX: reset on full lift */
        this._gesturePointerCount = 0;
        this._panning = false;
        this._lastPinch = null;

        if (this.draggingToken) {
          const t = this.draggingToken,
            oldCx = t.cx,
            oldCy = t.cy;
          t.cx = this._dragTargetCX;
          t.cy = this._dragTargetCY;
          if (this.role === 'player' && t.id === this._myTokenId) {
            const dx = Math.abs(t.cx - oldCx),
              dy = Math.abs(t.cy - oldCy),
              diag = dx > 0 && dy > 0;
            let cost = FEET_PER_CELL;
            if (diag) {
              const dm = PlayerSettings.diagMode;
              if (dm === 'euclidean') cost = Math.sqrt(2) * FEET_PER_CELL;
              else if (dm === '5-10-5') cost = (this._movementUsed % (FEET_PER_CELL * 2) === 0 ? FEET_PER_CELL : FEET_PER_CELL * 2);
            } else cost = (dx + dy) * FEET_PER_CELL;
            this._movementRemaining = Math.max(0, this._movementRemaining - cost);
            this._updatePlayerTracker();
          }
          this.draggingToken = null;
          this._requestRender();
          if (Session.current) Session.pushTokenUpdate();
          return;
        }
        this._painting = false;
        if (Session.current) Session.pushFogUpdate();
        this._requestRender();
      },

      _playWheel(e) {
        e.preventDefault();
        const f = e.deltaY < 0 ? 1.12 : 1 / 1.12;
        const r = this.playCanvas.getBoundingClientRect();
        this._zoomAt(e.clientX - r.left, e.clientY - r.top, f);
      },

      _playRightClick(e) {
        if (this.role !== 'dm') return;
        const {
          wx,
          wy
        } = this._evToWorld(e);
        const {
          cx,
          cy
        } = this._worldToCell(wx, wy);
        const token = this._tokenAt(cx, cy);
        if (!token) return;
        const menu = document.getElementById('ctx-menu');
        menu.innerHTML = `<div class="ctx-item" onclick="Play._openTokenModal('${token.id}');CtxMenu.close()">✏️ Edit Token</div><div class="ctx-item" onclick="Play._toggleHidden('${token.id}');CtxMenu.close()">${token.hidden?'👁 Reveal':'🫥 Hide'} Token</div><div class="ctx-sep"></div><div class="ctx-item danger" onclick="Play._removeToken('${token.id}');CtxMenu.close()">🗑️ Remove</div>`;
        menu.style.left = Math.min(e.clientX, window.innerWidth - 180) + 'px';
        menu.style.top = Math.min(e.clientY, window.innerHeight - 120) + 'px';
        menu.classList.remove('hidden');
      },

      _playKey(e) {
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
        if (App.currentScreen !== 'screen-play') return;
        if (e.key === 'Escape' && this._jumpMode) {
          this.exitJumpMode();
          return;
        }
        if (this.role === 'dm') {
          if (e.key === 'f' || e.key === 'F') {
            this.setTool('reveal');
            return;
          }
          if (e.key === 'h' || e.key === 'H') {
            this.setTool('hide');
            return;
          }
          if (e.key === 'g' || e.key === 'G') {
            this.toggleGrid(!this.showGrid);
            return;
          }
        }
        if (this.role === 'player') {
          const moves = {
            w: 'n',
            a: 'w',
            s: 's',
            d: 'e',
            q: 'nw',
            e: 'ne',
            z: 'sw',
            c: 'se',
            W: 'n',
            A: 'w',
            S: 's',
            D: 'e',
            Q: 'nw',
            E: 'ne',
            Z: 'sw',
            C: 'se'
          };
          if (moves[e.key]) {
            this.playerMove(moves[e.key]);
            return;
          }
          if (e.key === 'r' || e.key === 'R') {
            this.resetMovement();
            return;
          }
          if (e.key === 'j' || e.key === 'J') {
            this.enterJumpMode();
            return;
          }
          if (e.key === ' ') {
            e.preventDefault();
            this._spaceDown = true;
            return;
          }
        }
        if (e.key === ' ') {
          e.preventDefault();
          this.fitView();
        }
      },

      _playKeyUp(e) {
        if (e.key === ' ') this._spaceDown = false;
      },

      _zoomAt(px, py, factor) {
        const nz = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, this._zoomLevel * factor));
        const s = nz / this._zoomLevel;
        this.panX = px - (px - this.panX) * s;
        this.panY = py - (py - this.panY) * s;
        this._zoomLevel = nz;
        this._requestRender();
      },

      _getPinchDist() {
        const pts = Object.values(this._pointers);
        if (pts.length < 2) return 0;
        const dx = pts[0].x - pts[1].x,
          dy = pts[0].y - pts[1].y;
        return Math.sqrt(dx * dx + dy * dy);
      },

      _tokenAt(cx, cy) {
        return this.map.tokens.find(t => {
          if (this.role === 'player' && t.hidden) return false;
          const s = t.size || 1;
          return cx >= t.cx && cx < t.cx + s && cy >= t.cy && cy < t.cy + s;
        }) || null;
      },

      _applyFog(cx, cy, val) {
        const r = this.brushSize,
          m = this.map;
        let changed = false;
        if (this.tool === 'reveal-room') {
          const room = m.rooms.find(rm => cx >= rm.x && cx < rm.x + rm.w && cy >= rm.y && cy < rm.y + rm.h);
          if (room)
            for (let ry = room.y; ry < room.y + room.h; ry++)
              for (let rx = room.x; rx < room.x + room.w; rx++) {
                if (rx < 0 || ry < 0 || rx >= m.width || ry >= m.height) continue;
                const idx = ry * m.width + rx;
                if (m.fog[idx] !== 0) {
                  m.fog[idx] = 0;
                  changed = true;
                }
              }
          if (changed) this._requestRender();
          return;
        }
        for (let dy = -r + 1; dy < r; dy++)
          for (let dx = -r + 1; dx < r; dx++) {
            const nx = cx + dx,
              ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= m.width || ny >= m.height) continue;
            const idx = ny * m.width + nx;
            if (m.fog[idx] !== val) {
              m.fog[idx] = val;
              changed = true;
            }
          }
        if (changed) this._requestRender();
      },

      _doPing(wx, wy) {
        this.pingAnim = {
          wx,
          wy,
          t: 0
        };
        this._requestRender();
      },

      setTool(t) {
        this.tool = t;
        document.querySelectorAll('[id^="play-tool-"]').forEach(b => b.classList.remove('active'));
        const btn = document.getElementById('play-tool-' + t);
        if (btn) btn.classList.add('active');
        FloatToolsPicker._syncPlayFloatActive();
      },

      /* FIX: clamp to 1–50 */
      setBrushSize(v) {
        this.brushSize = Math.max(1, Math.min(50, parseInt(v) || 3));
        document.getElementById('fog-brush-label').textContent = this.brushSize;
        document.getElementById('fog-brush-size').value = this.brushSize;
      },

      toggleGrid(on) {
        this.showGrid = on;
        document.getElementById('dm-show-grid').checked = on;
        this._requestRender();
      },
      toggleFogPreview(on) {
        this.showFogPreview = on;
        document.getElementById('dm-show-fog-preview').checked = on;
        this._requestRender();
      },
      toggleTokenOverlay(on) {
        this._showTokenOverlay = on;
        const wrap = document.querySelector('#dd-dm-tokens')?.closest?.('.topbar-dd-wrap');
        if (wrap) wrap.style.display = on ? '' : 'none';
        if (!on) {
          const dd = document.getElementById('dd-dm-tokens');
          if (dd) dd.classList.add('hidden');
        }
      },
      toggleDmDrawer() {
        document.getElementById('dm-drawer').classList.toggle('expanded');
      },
      toggleDdPanel(id) {
        const all = ['dd-dm-players', 'dd-dm-tokens', 'dd-p-players'];
        all.forEach(pid => {
          const el = document.getElementById(pid);
          if (el && pid !== id) el.classList.add('hidden');
        });
        const target = document.getElementById(id);
        if (target) target.classList.toggle('hidden');
      },
      togglePause() {
        this.paused = !this.paused;
        document.getElementById('play-pause-btn').textContent = this.paused ? '▶' : '⏸';
        toast(this.paused ? 'Session paused' : 'Session resumed', 'info', 1400);
      },
      togglePlayerPan() {
        this._playerPanning = !this._playerPanning;
        const btn = document.getElementById('play-float-pan');
        if (btn) btn.classList.toggle('active', this._playerPanning);
        toast(this._playerPanning ? 'Pan mode on' : 'Pan mode off', 'info', 800);
      },

      revealAll() {
        this.map.fog.fill(0);
        this._requestRender();
        toast('All fog revealed', 'info', 1200);
        if (Session.current) Session.pushFogUpdate();
      },
      hideAll() {
        this.map.fog.fill(1);
        this._requestRender();
        toast('All fog hidden', 'info', 1200);
        if (Session.current) Session.pushFogUpdate();
      },
      zoomIn() {
        const r = this.wrap.getBoundingClientRect();
        this._zoomAt(r.width / 2, r.height / 2, 1.2);
      },
      zoomOut() {
        const r = this.wrap.getBoundingClientRect();
        this._zoomAt(r.width / 2, r.height / 2, 1 / 1.2);
      },
      fitView() {
        this._fit();
        this._requestRender();
      },

      playerMove(dir) {
        if (!this._myTokenId) return;
        const t = this.map.tokens.find(t => t.id === this._myTokenId);
        if (!t) return;
        const d = {
          n: [0, -1],
          s: [0, 1],
          w: [-1, 0],
          e: [1, 0],
          nw: [-1, -1],
          ne: [1, -1],
          sw: [-1, 1],
          se: [1, 1]
        } [dir] || [0, 0];
        const nx = t.cx + d[0],
          ny = t.cy + d[1];
        if (nx < 0 || ny < 0 || nx >= this.map.width || ny >= this.map.height) return;
        const tile = this.map.tiles[ny * this.map.width + nx];
        if (tile > 0 && !TILE_TYPES[TILE_IDX[tile]].walkable) return;
        const diag = d[0] !== 0 && d[1] !== 0;
        let cost = FEET_PER_CELL;
        if (diag) {
          const dm = PlayerSettings.diagMode;
          if (dm === 'euclidean') cost = Math.sqrt(2) * FEET_PER_CELL;
          else if (dm === '5-10-5') cost = (this._movementUsed % (FEET_PER_CELL * 2) === 0 ? FEET_PER_CELL : FEET_PER_CELL * 2);
        }
        if (this._movementRemaining < cost) {
          toast('No movement left!', 'info', 1000);
          return;
        }
        t.cx = nx;
        t.cy = ny;
        this._movementRemaining -= cost;
        this._movementUsed += cost;
        this._updatePlayerTracker();
        this._requestRender();
        Session.pushPlayerToken(t);
      },

      centerOnMyToken() {
        if (!this._myTokenId) return;
        const t = this.map.tokens.find(t => t.id === this._myTokenId);
        if (!t) return;
        const {
          width: cw,
          height: ch
        } = this.wrap.getBoundingClientRect();
        this.panX = cw / 2 - (t.cx + 0.5) * CELL_SIZE * this._zoomLevel;
        this.panY = ch / 2 - (t.cy + 0.5) * CELL_SIZE * this._zoomLevel;
        this._requestRender();
      },

      resetMovement() {
        this._movementRemaining = PlayerSettings.speed;
        this._movementUsed = 0;
        this._updatePlayerTracker();
        toast('Movement reset', 'info', 800);
      },

      enterJumpMode() {
        if (!this._myTokenId) {
          toast('No token assigned', 'info', 1000);
          return;
        }
        this._jumpMode = true;
        const lbl = document.getElementById('jump-move-label');
        if (lbl) lbl.textContent = `${this._movementRemaining}ft remaining`;
        document.getElementById('jump-mode-banner').classList.remove('hidden');
        this._requestRender();
      },

      exitJumpMode() {
        this._jumpMode = false;
        document.getElementById('jump-mode-banner').classList.add('hidden');
        this._requestRender();
      },

      _renderJumpOverlay(ctx) {
        const me = this.map.tokens.find(t => t.id === this._myTokenId);
        if (!me) return;
        const maxCells = Math.floor(this._movementRemaining / FEET_PER_CELL);
        const m = this.map;
        for (let i = 0; i < m.tiles.length; i++) {
          const gx = i % m.width,
            gy = Math.floor(i / m.width);
          const dx = Math.abs(gx - me.cx),
            dy = Math.abs(gy - me.cy);
          const dist = Math.max(dx, dy);
          if (dist === 0) continue;
          const tile = m.tiles[i];
          const walkable = !tile || TILE_TYPES[TILE_IDX[tile]]?.walkable;
          if (walkable && dist <= maxCells) {
            ctx.fillStyle = 'rgba(80,220,100,0.22)';
            ctx.fillRect(gx * CELL_SIZE, gy * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            ctx.strokeStyle = 'rgba(100,240,120,0.4)';
            ctx.lineWidth = 0.6 / this._zoomLevel;
            ctx.strokeRect(gx * CELL_SIZE + 0.5, gy * CELL_SIZE + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
          } else {
            ctx.fillStyle = 'rgba(180,40,40,0.12)';
            ctx.fillRect(gx * CELL_SIZE, gy * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          }
        }
        if (this._cursorCell) {
          const {
            cx: hcx,
            cy: hcy
          } = this._cursorCell;
          if (hcx >= 0 && hcy >= 0 && hcx < m.width && hcy < m.height) {
            const tile = m.tiles[hcy * m.width + hcx];
            const walkable = !tile || TILE_TYPES[TILE_IDX[tile]]?.walkable;
            const dx = Math.abs(hcx - me.cx),
              dy2 = Math.abs(hcy - me.cy),
              dist = Math.max(dx, dy2);
            const canJump = walkable && dist <= maxCells && dist > 0;
            ctx.fillStyle = canJump ? 'rgba(140,255,160,0.35)' : 'rgba(255,80,80,0.32)';
            ctx.fillRect(hcx * CELL_SIZE, hcy * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            if (canJump) {
              const cost = dist * FEET_PER_CELL;
              ctx.fillStyle = 'rgba(255,255,255,0.85)';
              ctx.font = `bold ${Math.max(8,CELL_SIZE*0.28)}px Inter,sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(`${cost}ft`, hcx * CELL_SIZE + CELL_SIZE / 2, hcy * CELL_SIZE + CELL_SIZE / 2);
            }
          }
        }
      },

      jumpTo(cx, cy) {
        if (!this._myTokenId) return;
        const t = this.map.tokens.find(t => t.id === this._myTokenId);
        if (!t) return;
        cx = Math.max(0, Math.min(this.map.width - 1, cx));
        cy = Math.max(0, Math.min(this.map.height - 1, cy));
        const tile = this.map.tiles[cy * this.map.width + cx];
        if (tile > 0 && !TILE_TYPES[TILE_IDX[tile]].walkable) {
          toast('Cannot jump there — blocked!', 'info', 1000);
          return;
        }
        const dx = Math.abs(cx - t.cx),
          dy = Math.abs(cy - t.cy);
        const dist = Math.max(dx, dy);
        const cost = dist * FEET_PER_CELL;
        if (this._movementRemaining < cost) {
          toast(`Need ${cost}ft, only have ${this._movementRemaining}ft!`, 'info', 1500);
          return;
        }
        t.cx = cx;
        t.cy = cy;
        this._movementRemaining -= cost;
        this._movementUsed += cost;
        this._updatePlayerTracker();
        this._requestRender();
        Session.pushPlayerToken(t);
        this.exitJumpMode();
        toast(`Jumped ${dist} cells for ${cost}ft!`, 'success', 1500);
      },

      _updatePlayerTracker() {
        const tracker = document.getElementById('player-tracker');
        if (!tracker) return;
        if (this.role !== 'player') {
          tracker.classList.add('hidden');
          return;
        }
        tracker.innerHTML = '';
        tracker.classList.remove('hidden');
        if (PlayerSettings.showMove) {
          const pct = this._movementRemaining / PlayerSettings.speed;
          const card = document.createElement('div');
          card.className = 'tracker-card';
          card.innerHTML = `<div class="tracker-label">Movement</div><div class="tracker-value">${this._movementRemaining}ft <button class="tracker-edit-btn" onclick="Play.resetMovement()" title="Reset">🔄</button></div><div class="tracker-hp-bar"><div class="tracker-hp-fill" style="width:${pct*100}%;background:${pct>.5?'#40c060':pct>.25?'#d0a020':'#c02020'}"></div></div>`;
          tracker.appendChild(card);
        }
        if (PlayerSettings.showHp && this._myTokenId) {
          const t = this.map.tokens.find(t => t.id === this._myTokenId);
          if (t && t.maxHp > 0) {
            const pct = t.hp / t.maxHp;
            const card = document.createElement('div');
            card.className = 'tracker-card';
            card.innerHTML = `<div class="tracker-label">HP</div><div class="tracker-value" style="justify-content:space-between;gap:4px"><button class="hp-adj-btn minus" onclick="Play._adjustHP(-1)" title="Lose 1 HP">−</button><button class="hp-val-tap" onclick="Play._editHP()" title="Set HP directly">${t.hp}<span style="opacity:.5;font-size:.8em">/${t.maxHp}</span></button><button class="hp-adj-btn plus" onclick="Play._adjustHP(1)" title="Gain 1 HP">+</button></div><div class="tracker-hp-bar"><div class="tracker-hp-fill" style="width:${pct*100}%;background:${pct>.5?'#40c060':pct>.25?'#d0a020':'#c02020'}"></div></div>`;
            tracker.appendChild(card);
          }
        }
      },

      _adjustHP(delta) {
        if (!this._myTokenId) return;
        const t = this.map.tokens.find(t => t.id === this._myTokenId);
        if (!t) return;
        const prev = t.hp;
        t.hp = Math.max(0, Math.min(t.maxHp, (t.hp || 0) + delta));
        if (t.hp === prev) return;
        this._updatePlayerTracker();
        this._requestRender();
        Session.pushTokenUpdate();
        const msg = delta > 0 ? `+${delta} HP → ${t.hp}/${t.maxHp}` : `${delta} HP → ${t.hp}/${t.maxHp}`;
        toast(msg, delta > 0 ? 'success' : 'info', 1400);
      },

      _editHP() {
        if (!this._myTokenId) return;
        const t = this.map.tokens.find(t => t.id === this._myTokenId);
        if (!t) return;
        const val = prompt(`Current HP (max ${t.maxHp}):`, t.hp);
        if (val === null) return;
        t.hp = Math.max(0, Math.min(t.maxHp, parseInt(val) || 0));
        this._updatePlayerTracker();
        this._requestRender();
        Session.pushTokenUpdate();
      },

      openPlayerTokenEdit() {
        if (!this._myTokenId || this.role !== 'player') return;
        const t = this.map.tokens.find(t => t.id === this._myTokenId);
        if (!t) return;
        document.getElementById('player-token-icon').value = t.icon || '👤';
        document.getElementById('player-token-name').value = t.name || '';
        document.getElementById('player-token-hp').value = t.hp || 0;
        document.getElementById('player-token-maxhp').value = t.maxHp || 20;
        Modal.open('modal-player-token');
      },

      savePlayerToken() {
        if (!this._myTokenId || this.role !== 'player') return;
        const t = this.map.tokens.find(t => t.id === this._myTokenId);
        if (!t) return;
        const icon = document.getElementById('player-token-icon').value.trim() || '👤';
        const name = document.getElementById('player-token-name').value.trim() || 'Player';
        const hp = Math.max(0, parseInt(document.getElementById('player-token-hp').value) || 0);
        const maxhp = Math.max(1, parseInt(document.getElementById('player-token-maxhp').value) || 20);
        t.icon = icon;
        t.name = name;
        t.hp = hp;
        t.maxHp = maxhp;
        this._updatePlayerTracker();
        this._requestRender();
        Session.pushPlayerToken(t);
        /* Keep player display name in sync with token name */
        if (Session.current) {
          Session.current.playerName = name;
          const pid = Session.current.playerId,
            code = Session.current.roomCode;
          if (pid && code && code !== 'LOCAL' && window._fbSet && window._fbReady) {
            window._fbSet(`rooms/${code}/players/${pid}`, {
              id: pid,
              name,
              role: 'player',
              color: t.color,
              joinedAt: Date.now()
            });
          }
          /* Update the local player entry in session.players so the list reflects instantly */
          const entry = Session.current.players && Session.current.players.find(p => p.id === pid);
          if (entry) entry.name = name;
          this._updatePlayersList();
        }
        Modal.close('modal-player-token');
        toast('Token updated!', 'success', 1200);
      },

      _updateTokenOverlay() {
        const body = document.getElementById('dm-token-overlay-body');
        if (!body || this.role !== 'dm') return;
        body.innerHTML = '';
        this.map.tokens.forEach(t => {
          const el = document.createElement('div');
          el.className = 'dm-token-entry';
          el.innerHTML = `<div class="dm-token-dot" style="background:${t.color}"></div><div class="dm-token-name">${t.name}</div><div class="dm-token-type">${t.type}</div>`;
          el.onclick = () => {
            const {
              width: cw,
              height: ch
            } = this.wrap.getBoundingClientRect();
            this.panX = cw / 2 - (t.cx + 0.5) * CELL_SIZE * this._zoomLevel;
            this.panY = ch / 2 - (t.cy + 0.5) * CELL_SIZE * this._zoomLevel;
            this._requestRender();
          };
          body.appendChild(el);
        });
      },

      _updateInitiative() {
        const list = document.getElementById('initiative-list');
        if (!list) return;
        const tokens = this.map.tokens.filter(t => t.initiative > 0).sort((a, b) => b.initiative - a.initiative);
        list.innerHTML = '';
        tokens.forEach((t, i) => {
          const el = document.createElement('div');
          el.style.cssText = `background:${t.color};color:#111;padding:2px 8px;border-radius:4px;font-size:.7rem;font-weight:700;opacity:${i===this.initiativeIdx?.85:.45}`;
          el.textContent = `${t.initiative} ${t.name}`;
          list.appendChild(el);
        });
      },

      nextInit() {
        const tokens = this.map.tokens.filter(t => t.initiative > 0).sort((a, b) => b.initiative - a.initiative);
        if (!tokens.length) return;
        this.initiativeIdx = (this.initiativeIdx + 1) % tokens.length;
        this._updateInitiative();
        toast(`${tokens[this.initiativeIdx].name}'s turn`, 'info', 1800);
      },
      resetInit() {
        this.initiativeIdx = 0;
        this._updateInitiative();
      },

      _openTokenModal(id) {
        const t = this.map.tokens.find(t => t.id === id);
        if (!t) return;
        document.getElementById('modal-token-ctx-title').textContent = t.name || 'Token';
        document.getElementById('modal-token-ctx-body').innerHTML = `
      <div class="form-group"><label class="label">Name</label><input class="input" id="ctx-tok-name" value="${t.name||''}" /></div>
      <div class="form-group"><label class="label">HP / Max</label><div style="display:flex;gap:6px"><input class="input" id="ctx-tok-hp" type="number" value="${t.hp||0}" style="width:50%" /><input class="input" id="ctx-tok-maxhp" type="number" value="${t.maxHp||0}" style="width:50%" /></div></div>
      <div class="form-group"><label class="label">Initiative</label><input class="input" id="ctx-tok-init" type="number" value="${t.initiative||0}" /></div>
      <label class="checkbox-row" style="margin-bottom:12px"><input type="checkbox" id="ctx-tok-hidden" ${t.hidden?'checked':''} /><span>Hidden from players</span></label>
      <button class="btn btn-gold w-full" onclick="Play._saveTokenModal('${id}')">Save</button>`;
        Modal.open('modal-token-ctx');
      },

      _saveTokenModal(id) {
        const t = this.map.tokens.find(t => t.id === id);
        if (!t) return;
        t.name = document.getElementById('ctx-tok-name').value.trim() || t.name;
        t.hp = parseInt(document.getElementById('ctx-tok-hp').value) || 0;
        t.maxHp = parseInt(document.getElementById('ctx-tok-maxhp').value) || 0;
        t.initiative = parseInt(document.getElementById('ctx-tok-init').value) || 0;
        t.hidden = document.getElementById('ctx-tok-hidden').checked;
        Modal.close('modal-token-ctx');
        this._updateInitiative();
        this._updateTokenOverlay();
        this._requestRender();
        Session.pushTokenUpdate();
      },

      _toggleHidden(id) {
        const t = this.map.tokens.find(t => t.id === id);
        if (!t) return;
        t.hidden = !t.hidden;
        this._updateTokenOverlay();
        this._requestRender();
        Session.pushTokenUpdate();
      },
      _removeToken(id) {
        this.map.tokens = this.map.tokens.filter(t => t.id !== id);
        if (this._myTokenId === id) this._myTokenId = null;
        this._updateTokenOverlay();
        this._requestRender();
        Session.pushTokenUpdate();
      },

      _updatePlayersList() {
        const session = this.session || {};
        const players = session.players || [];
        const hasDM = players.some(p => p.role === 'dm' || p.id === 'dm');
        const allPlayers = hasDM ? players : [{
          id: 'dm',
          name: session.dmName || session.playerName || 'Dungeon Master',
          role: 'dm',
          color: '#e0c040'
        }, ...players];
        const renderInto = (listEl) => {
          if (!listEl) return;
          listEl.innerHTML = '';
          if (!allPlayers.length) {
            listEl.innerHTML = '<div style="padding:8px 10px;font-size:.72rem;color:hsl(var(--muted-foreground))">No players yet</div>';
            return;
          }
          allPlayers.forEach(p => {
            const el = document.createElement('div');
            el.className = 'player-entry';
            const initial = (p.name || '?')[0].toUpperCase();
            el.innerHTML = `<div class="player-avatar" style="background:${p.color||'#888'};color:#fff">${initial}</div><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">${p.name || 'Player'}${(p.role==='dm'||p.id==='dm')?' 👑':''}</span>`;
            listEl.appendChild(el);
          });
        };
        renderInto(document.getElementById('session-players-list'));
        renderInto(document.getElementById('session-players-list-p'));
      },

      exitToSession() {
        App.show('screen-session');
      },

      _requestRender() {
        if (this._rafId) return;
        this._rafId = requestAnimationFrame(() => {
          this._rafId = null;
          this._render();
        });
      },

      _render() {
        if (!this.wrap || !this.playCanvas) return;
        const {
          width: cw,
          height: ch
        } = this.wrap.getBoundingClientRect();
        if (!cw || !ch) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        [this.playCanvas, this.fogCanvas].forEach(cv => {
          if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) {
            cv.width = Math.round(cw * dpr);
            cv.height = Math.round(ch * dpr);
            cv.style.width = cw + 'px';
            cv.style.height = ch + 'px';
          }
        });
        const ctx = this.playCtx;
        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, cw, ch);
        const bg = BG_STYLES[this.map.bg] || BG_STYLES.dungeon;
        ctx.fillStyle = bg.base;
        ctx.fillRect(0, 0, cw, ch);
        ctx.translate(this.panX, this.panY);
        ctx.scale(this._zoomLevel, this._zoomLevel);
        const mapW = this.map.width * CELL_SIZE,
          mapH = this.map.height * CELL_SIZE;
        ctx.fillStyle = bg.accent;
        ctx.fillRect(0, 0, mapW, mapH);
        this._renderPlayTiles(ctx);
        if (this._jumpMode) this._renderJumpOverlay(ctx);
        if (this.showGrid) this._renderGrid(ctx, mapW, mapH, bg.grid);
        this._renderPlayTokens(ctx);
        if (this.draggingToken) {
          const t = this.draggingToken,
            cs = (t.size || 1) * CELL_SIZE;
          ctx.strokeStyle = 'rgba(200,200,100,0.8)';
          ctx.lineWidth = 2 / this._zoomLevel;
          ctx.setLineDash([3 / this._zoomLevel, 3 / this._zoomLevel]);
          ctx.strokeRect(this._dragTargetCX * CELL_SIZE, this._dragTargetCY * CELL_SIZE, cs, cs);
          ctx.setLineDash([]);
        }
        if (this.measureStart && this.measureEnd) {
          const s = this.measureStart,
            e2 = this.measureEnd;
          ctx.strokeStyle = 'rgba(255,220,80,0.9)';
          ctx.lineWidth = 2 / this._zoomLevel;
          ctx.setLineDash([4 / this._zoomLevel, 4 / this._zoomLevel]);
          ctx.beginPath();
          ctx.moveTo(s.wx, s.wy);
          ctx.lineTo(e2.wx, e2.wy);
          ctx.stroke();
          ctx.setLineDash([]);
          const dist = Math.sqrt((e2.wx - s.wx) ** 2 + (e2.wy - s.wy) ** 2) / CELL_SIZE * FEET_PER_CELL;
          ctx.fillStyle = 'rgba(255,220,80,1)';
          ctx.font = `bold ${14/this._zoomLevel}px Inter,sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(`${dist.toFixed(0)}ft`, (s.wx + e2.wx) / 2, (s.wy + e2.wy) / 2 - 4 / this._zoomLevel);
        }
        if (this.pingAnim) {
          const {
            wx,
            wy,
            t
          } = this.pingAnim, r = CELL_SIZE * 1.2 * t;
          ctx.strokeStyle = `rgba(255,100,80,${1-t})`;
          ctx.lineWidth = 3 / this._zoomLevel;
          ctx.beginPath();
          ctx.arc(wx, wy, r, 0, Math.PI * 2);
          ctx.stroke();
          this.pingAnim.t += 0.04;
          if (this.pingAnim.t >= 1) this.pingAnim = null;
          else this._requestRender();
        }
        ctx.restore();

        /* Fog canvas */
        const fctx = this.fogCtx;
        fctx.save();
        fctx.scale(dpr, dpr);
        fctx.clearRect(0, 0, cw, ch);
        const isDM = this.role === 'dm';
        if (isDM && !this.showFogPreview) {
          fctx.restore();
          this._renderMinimap();
          return;
        }
        fctx.translate(this.panX, this.panY);
        fctx.scale(this._zoomLevel, this._zoomLevel);
        const fogAlpha = isDM ? 0.45 : 0.95,
          m = this.map;
        for (let i = 0; i < m.fog.length; i++) {
          if (!m.fog[i]) continue;
          const fx = (i % m.width) * CELL_SIZE,
            fy = Math.floor(i / m.width) * CELL_SIZE;
          fctx.fillStyle = `rgba(10,8,12,${fogAlpha})`;
          fctx.fillRect(fx, fy, CELL_SIZE, CELL_SIZE);
        }
        fctx.restore();
        this._renderMinimap();
      },

      _renderPlayTiles(ctx) {
        const m = this.map;
        for (let i = 0; i < m.tiles.length; i++) {
          const t = m.tiles[i];
          if (!t) continue;
          const name = TILE_IDX[t],
            info = TILE_TYPES[name];
          if (!info || !info.color) continue;
          const cx = (i % m.width) * CELL_SIZE,
            cy = Math.floor(i / m.width) * CELL_SIZE;
          ctx.fillStyle = info.color;
          ctx.fillRect(cx, cy, CELL_SIZE, CELL_SIZE);
          _drawTileDetail(ctx, name, cx, cy, CELL_SIZE);
        }
        if (m.subpixels) {
          const spSize = CELL_SIZE / (m.subpixelDiv || SUBPIXEL_DIV);
          for (const [key, color] of Object.entries(m.subpixels)) {
            const p = key.split(',');
            if (p.length < 4) continue;
            ctx.fillStyle = color;
            ctx.fillRect(parseInt(p[0]) * CELL_SIZE + parseInt(p[2]) * spSize, parseInt(p[1]) * CELL_SIZE + parseInt(p[3]) * spSize, spSize, spSize);
          }
        }
      },

      _renderGrid(ctx, mapW, mapH, gridColor) {
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 0.5 / this._zoomLevel;
        ctx.beginPath();
        for (let x = 0; x <= this.map.width; x++) {
          ctx.moveTo(x * CELL_SIZE, 0);
          ctx.lineTo(x * CELL_SIZE, mapH);
        }
        for (let y = 0; y <= this.map.height; y++) {
          ctx.moveTo(0, y * CELL_SIZE);
          ctx.lineTo(mapW, y * CELL_SIZE);
        }
        ctx.stroke();
        ctx.strokeStyle = 'rgba(150,130,100,0.4)';
        ctx.lineWidth = 1.5 / this._zoomLevel;
        ctx.strokeRect(0, 0, mapW, mapH);
      },

      _renderPlayTokens(ctx) {
        this.map.tokens.forEach(t => {
          const isMyToken = this.role === 'player' && t.id === this._myTokenId;
          if (this.role === 'player' && t.hidden && !isMyToken) return;
          const fogIdx = t.cy * this.map.width + t.cx;
          if (this.role === 'player' && this.map.fog[fogIdx] && !isMyToken) return;
          Editor._drawToken(ctx, t, 1, false);
        });
      },

      _renderMinimap() {
        const mc = this.minimapCanvas;
        if (!mc) return;
        const mctx = this.minimapCtx;
        const mw = mc.clientWidth || 100,
          mh = mc.clientHeight || 100;
        if (mc.width !== mw || mc.height !== mh) {
          mc.width = mw;
          mc.height = mh;
        }
        mctx.clearRect(0, 0, mw, mh);
        const m = this.map,
          sx = mw / m.width,
          sy = mh / m.height;
        mctx.fillStyle = '#1a1815';
        mctx.fillRect(0, 0, mw, mh);
        for (let i = 0; i < m.tiles.length; i++) {
          if (!m.tiles[i]) continue;
          const info = TILE_TYPES[TILE_IDX[m.tiles[i]]];
          if (!info || !info.color) continue;
          mctx.fillStyle = info.color;
          mctx.fillRect((i % m.width) * sx, Math.floor(i / m.width) * sy, sx + 1, sy + 1);
        }
        for (let i = 0; i < m.fog.length; i++) {
          if (!m.fog[i]) continue;
          mctx.fillStyle = 'rgba(10,8,12,0.85)';
          mctx.fillRect((i % m.width) * sx, Math.floor(i / m.width) * sy, sx + 1, sy + 1);
        }
        const {
          width: cw,
          height: ch
        } = this.wrap.getBoundingClientRect();
        const vpx = -this.panX / this._zoomLevel,
          vpy = -this.panY / this._zoomLevel;
        const vpw = cw / this._zoomLevel,
          vph = ch / this._zoomLevel;
        mctx.strokeStyle = 'rgba(255,220,80,0.7)';
        mctx.lineWidth = 1;
        mctx.strokeRect(vpx * sx / CELL_SIZE, vpy * sy / CELL_SIZE, vpw * sx / CELL_SIZE, vph * sy / CELL_SIZE);
      },
    };

    (() => {
      const ENTRY = 'Delve DM Maps v2.5',
        KEY = 'Ion-o-koji Watermark';
      const logs = (localStorage.getItem(KEY) || "").split('\n').map(line => line.replace(/^- /, '').trim()).filter(line => line && line !== ENTRY);
      logs.push(ENTRY);
      localStorage.setItem(KEY, logs.map(item => `- ${item}`).join('\n'));
    })();

  
