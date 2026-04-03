
    // =============================================
    // CHESS ENGINE
    // =============================================
    class Chess {
      constructor() {
        this.reset();
      }
      reset() {
        this.board = {};
        const back = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
        for (let i = 0; i < 8; i++) {
          const f = 'abcdefgh' [i];
          this.board[f + '1'] = {
            type: back[i],
            color: 'w'
          };
          this.board[f + '2'] = {
            type: 'p',
            color: 'w'
          };
          this.board[f + '7'] = {
            type: 'p',
            color: 'b'
          };
          this.board[f + '8'] = {
            type: back[i],
            color: 'b'
          };
        }
        this._turn = 'w';
        this._castling = {
          wK: true,
          wQ: true,
          bK: true,
          bQ: true
        };
        this._ep = null;
        this._halfMoves = 0;
        this._fullMoves = 1;
        this._history = [];
        this._posHistory = [this._key()];
      }
      _fi(f) {
        return 'abcdefgh'.indexOf(f);
      }
      _if(i) {
        return 'abcdefgh' [i];
      }
      _key() {
        let k = '';
        for (let r = 8; r >= 1; r--)
          for (let c = 0; c < 8; c++) {
            const p = this.board[this._if(c) + r];
            k += p ? (p.color === 'w' ? p.type.toUpperCase() : p.type) : '.';
          }
        k += this._turn;
        k += (this._castling.wK ? 'K' : '') + (this._castling.wQ ? 'Q' : '') + (this._castling.bK ? 'k' : '') + (this._castling.bQ ? 'q' : '');
        k += this._ep || '-';
        return k;
      }
      get(sq) {
        return this.board[sq] || null;
      }
      turn() {
        return this._turn;
      }
      fen() {
        let f = '';
        for (let r = 8; r >= 1; r--) {
          let e = 0;
          for (let c = 0; c < 8; c++) {
            const p = this.board[this._if(c) + r];
            if (p) {
              if (e) {
                f += e;
                e = 0;
              }
              f += p.color === 'w' ? p.type.toUpperCase() : p.type;
            } else e++;
          }
          if (e) f += e;
          if (r > 1) f += '/';
        }
        let cas = '';
        if (this._castling.wK) cas += 'K';
        if (this._castling.wQ) cas += 'Q';
        if (this._castling.bK) cas += 'k';
        if (this._castling.bQ) cas += 'q';
        return `${f} ${this._turn} ${cas||'-'} ${this._ep||'-'} ${this._halfMoves} ${this._fullMoves}`;
      }
      _allSq() {
        const s = [];
        for (let r = 1; r <= 8; r++)
          for (let c = 0; c < 8; c++) s.push(this._if(c) + r);
        return s;
      }
      _findKing(col) {
        for (const sq of this._allSq()) {
          const p = this.board[sq];
          if (p && p.type === 'k' && p.color === col) return sq;
        }
        return null;
      }
      _attacked(sq, by) {
        const f = this._fi(sq[0]),
          r = parseInt(sq[1]);
        const pd = by === 'w' ? -1 : 1;
        for (const df of [-1, 1]) {
          const af = f + df,
            ar = r + pd;
          if (af >= 0 && af < 8 && ar >= 1 && ar <= 8) {
            const p = this.board[this._if(af) + ar];
            if (p && p.type === 'p' && p.color === by) return true;
          }
        }
        for (const [df, dr] of [
            [-2, -1],
            [-2, 1],
            [-1, -2],
            [-1, 2],
            [1, -2],
            [1, 2],
            [2, -1],
            [2, 1]
          ]) {
          const nf = f + df,
            nr = r + dr;
          if (nf >= 0 && nf < 8 && nr >= 1 && nr <= 8) {
            const p = this.board[this._if(nf) + nr];
            if (p && p.type === 'n' && p.color === by) return true;
          }
        }
        for (let df = -1; df <= 1; df++)
          for (let dr = -1; dr <= 1; dr++) {
            if (!df && !dr) continue;
            const kf = f + df,
              kr = r + dr;
            if (kf >= 0 && kf < 8 && kr >= 1 && kr <= 8) {
              const p = this.board[this._if(kf) + kr];
              if (p && p.type === 'k' && p.color === by) return true;
            }
          }
        const dirs = [{
          df: 0,
          dr: 1,
          t: ['r', 'q']
        }, {
          df: 0,
          dr: -1,
          t: ['r', 'q']
        }, {
          df: 1,
          dr: 0,
          t: ['r', 'q']
        }, {
          df: -1,
          dr: 0,
          t: ['r', 'q']
        }, {
          df: 1,
          dr: 1,
          t: ['b', 'q']
        }, {
          df: 1,
          dr: -1,
          t: ['b', 'q']
        }, {
          df: -1,
          dr: 1,
          t: ['b', 'q']
        }, {
          df: -1,
          dr: -1,
          t: ['b', 'q']
        }];
        for (const {
            df,
            dr,
            t
          }
          of dirs) {
          let cf = f + df,
            cr = r + dr;
          while (cf >= 0 && cf < 8 && cr >= 1 && cr <= 8) {
            const p = this.board[this._if(cf) + cr];
            if (p) {
              if (p.color === by && t.includes(p.type)) return true;
              break;
            }
            cf += df;
            cr += dr;
          }
        }
        return false;
      }
      inCheck() {
        const k = this._findKing(this._turn);
        return k && this._attacked(k, this._turn === 'w' ? 'b' : 'w');
      }
      _pseudoMoves(col) {
        const moves = [],
          c = col || this._turn;
        for (const sq of this._allSq()) {
          const p = this.board[sq];
          if (!p || p.color !== c) continue;
          const f = this._fi(sq[0]),
            r = parseInt(sq[1]);
          if (p.type === 'p') {
            const dir = c === 'w' ? 1 : -1,
              sr = c === 'w' ? 2 : 7,
              pr = c === 'w' ? 8 : 1;
            const fwd = sq[0] + (r + dir);
            if (r + dir >= 1 && r + dir <= 8 && !this.board[fwd]) {
              if (r + dir === pr) {
                for (const x of ['q', 'r', 'b', 'n']) moves.push({
                  from: sq,
                  to: fwd,
                  promotion: x
                });
              } else {
                moves.push({
                  from: sq,
                  to: fwd
                });
                if (r === sr) {
                  const d2 = sq[0] + (r + 2 * dir);
                  if (!this.board[d2]) moves.push({
                    from: sq,
                    to: d2
                  });
                }
              }
            }
            for (const df of [-1, 1]) {
              const cf = f + df;
              if (cf < 0 || cf > 7) continue;
              const cs = this._if(cf) + (r + dir);
              if (r + dir < 1 || r + dir > 8) continue;
              const t = this.board[cs];
              if ((t && t.color !== c) || cs === this._ep) {
                if (r + dir === pr) {
                  for (const x of ['q', 'r', 'b', 'n']) moves.push({
                    from: sq,
                    to: cs,
                    promotion: x
                  });
                } else moves.push({
                  from: sq,
                  to: cs
                });
              }
            }
          } else if (p.type === 'n') {
            for (const [df, dr] of [
                [-2, -1],
                [-2, 1],
                [-1, -2],
                [-1, 2],
                [1, -2],
                [1, 2],
                [2, -1],
                [2, 1]
              ]) {
              const nf = f + df,
                nr = r + dr;
              if (nf < 0 || nf > 7 || nr < 1 || nr > 8) continue;
              const ts = this._if(nf) + nr;
              const t = this.board[ts];
              if (!t || t.color !== c) moves.push({
                from: sq,
                to: ts
              });
            }
          } else if (p.type === 'k') {
            for (let df = -1; df <= 1; df++)
              for (let dr = -1; dr <= 1; dr++) {
                if (!df && !dr) continue;
                const kf = f + df,
                  kr = r + dr;
                if (kf < 0 || kf > 7 || kr < 1 || kr > 8) continue;
                const ts = this._if(kf) + kr;
                const t = this.board[ts];
                if (!t || t.color !== c) moves.push({
                  from: sq,
                  to: ts
                });
              }
            const rk = c === 'w' ? '1' : '8',
              en = c === 'w' ? 'b' : 'w';
            if (sq === 'e' + rk) {
              if ((c === 'w' ? this._castling.wK : this._castling.bK) && !this.board['f' + rk] && !this.board['g' + rk] && this.board['h' + rk]?.type === 'r' && this.board['h' + rk]?.color === c && !this._attacked('e' + rk, en) && !this._attacked('f' + rk, en) && !this._attacked('g' + rk, en)) moves.push({
                from: sq,
                to: 'g' + rk,
                castling: 'k'
              });
              if ((c === 'w' ? this._castling.wQ : this._castling.bQ) && !this.board['d' + rk] && !this.board['c' + rk] && !this.board['b' + rk] && this.board['a' + rk]?.type === 'r' && this.board['a' + rk]?.color === c && !this._attacked('e' + rk, en) && !this._attacked('d' + rk, en) && !this._attacked('c' + rk, en)) moves.push({
                from: sq,
                to: 'c' + rk,
                castling: 'q'
              });
            }
          } else {
            let ds = [];
            if (p.type === 'r' || p.type === 'q') ds.push([0, 1], [0, -1], [1, 0], [-1, 0]);
            if (p.type === 'b' || p.type === 'q') ds.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
            for (const [df, dr] of ds) {
              let cf = f + df,
                cr = r + dr;
              while (cf >= 0 && cf < 8 && cr >= 1 && cr <= 8) {
                const ts = this._if(cf) + cr;
                const t = this.board[ts];
                if (t) {
                  if (t.color !== c) moves.push({
                    from: sq,
                    to: ts
                  });
                  break;
                }
                moves.push({
                  from: sq,
                  to: ts
                });
                cf += df;
                cr += dr;
              }
            }
          }
        }
        return moves;
      }
      _save() {
        return {
          board: {
            ...this.board
          },
          turn: this._turn,
          castling: {
            ...this._castling
          },
          ep: this._ep,
          hm: this._halfMoves,
          fm: this._fullMoves
        };
      }
      _load(s) {
        this.board = s.board;
        this._turn = s.turn;
        this._castling = s.castling;
        this._ep = s.ep;
        this._halfMoves = s.hm;
        this._fullMoves = s.fm;
      }
      _apply(m) {
        const p = this.board[m.from],
          cap = this.board[m.to] || null,
          c = p.color,
          rk = c === 'w' ? '1' : '8';
        let epCap = null;
        if (p.type === 'p' && m.to === this._ep) {
          const er = c === 'w' ? (parseInt(m.to[1]) - 1) : (parseInt(m.to[1]) + 1);
          epCap = m.to[0] + er;
          delete this.board[epCap];
        }
        delete this.board[m.from];
        this.board[m.to] = m.promotion ? {
          type: m.promotion,
          color: c
        } : p;
        if (m.castling === 'k') {
          this.board['f' + rk] = this.board['h' + rk];
          delete this.board['h' + rk];
        }
        if (m.castling === 'q') {
          this.board['d' + rk] = this.board['a' + rk];
          delete this.board['a' + rk];
        }
        if (p.type === 'p' && Math.abs(parseInt(m.to[1]) - parseInt(m.from[1])) === 2) this._ep = m.from[0] + (c === 'w' ? '3' : '6');
        else this._ep = null;
        if (p.type === 'k') {
          if (c === 'w') {
            this._castling.wK = false;
            this._castling.wQ = false;
          } else {
            this._castling.bK = false;
            this._castling.bQ = false;
          }
        }
        if (p.type === 'r') {
          if (m.from === 'h1') this._castling.wK = false;
          if (m.from === 'a1') this._castling.wQ = false;
          if (m.from === 'h8') this._castling.bK = false;
          if (m.from === 'a8') this._castling.bQ = false;
        }
        if (m.to === 'h1') this._castling.wK = false;
        if (m.to === 'a1') this._castling.wQ = false;
        if (m.to === 'h8') this._castling.bK = false;
        if (m.to === 'a8') this._castling.bQ = false;
        if (p.type === 'p' || cap || epCap) this._halfMoves = 0;
        else this._halfMoves++;
        if (this._turn === 'b') this._fullMoves++;
        this._turn = this._turn === 'w' ? 'b' : 'w';
        return {
          captured: cap,
          epCap
        };
      }
      _legal(m) {
        const s = this._save();
        this._apply(m);
        const c = this._turn === 'w' ? 'b' : 'w';
        const k = this._findKing(c);
        const en = c === 'w' ? 'b' : 'w';
        const ok = k && !this._attacked(k, en);
        this._load(s);
        return ok;
      }
      moves(opts) {
        const pseudo = this._pseudoMoves(opts?.square ? this.board[opts.square]?.color : undefined);
        let legal;
        if (opts?.square) legal = pseudo.filter(m => m.from === opts.square && this._legal(m));
        else legal = pseudo.filter(m => this._legal(m));
        if (opts?.verbose) return legal;
        return legal.map(m => this._san(m));
      }
      _san(m) {
        const p = this.board[m.from];
        if (!p) return m.from + m.to;
        if (m.castling === 'k') return 'O-O';
        if (m.castling === 'q') return 'O-O-O';
        let s = '';
        const cap = this.board[m.to] || (p.type === 'p' && m.to === this._ep);
        if (p.type !== 'p') {
          s += p.type.toUpperCase();
          const amb = this._pseudoMoves().filter(x => this.board[x.from]?.type === p.type && this.board[x.from]?.color === p.color && x.to === m.to && x.from !== m.from && this._legal(x));
          if (amb.length > 0) {
            const sf = amb.some(x => x.from[0] === m.from[0]),
              sr = amb.some(x => x.from[1] === m.from[1]);
            if (!sf) s += m.from[0];
            else if (!sr) s += m.from[1];
            else s += m.from;
          }
        }
        if (cap) {
          if (p.type === 'p') s += m.from[0];
          s += 'x';
        }
        s += m.to;
        if (m.promotion) s += '=' + m.promotion.toUpperCase();
        const sv = this._save();
        this._apply(m);
        if (this.inCheck()) {
          s += this.moves().length === 0 ? '#' : '+';
        }
        this._load(sv);
        return s;
      }
      move(input) {
        const legal = this.moves({
          verbose: true
        });
        let found = null;
        if (typeof input === 'string') {
          for (const m of legal)
            if (this._san(m) === input) {
              found = m;
              break;
            } if (!found) {
            const fr = input.substring(0, 2),
              to = input.substring(2, 4),
              pr = input.length > 4 ? input[4] : undefined;
            for (const m of legal)
              if (m.from === fr && m.to === to && (!pr || m.promotion === pr)) {
                found = m;
                break;
              }
          }
        } else {
          for (const m of legal)
            if (m.from === input.from && m.to === input.to && (!input.promotion || m.promotion === input.promotion)) {
              found = m;
              break;
            }
        }
        if (!found) return null;
        const san = this._san(found),
          piece = this.board[found.from],
          cap = this.board[found.to],
          epCap = piece.type === 'p' && found.to === this._ep;
        const entry = {
          move: found,
          san,
          state: this._save(),
          captured: cap ? cap.type : (epCap ? 'p' : null),
          color: piece.color,
          from: found.from,
          to: found.to,
          promotion: found.promotion,
          piece: piece.type
        };
        this._apply(found);
        this._history.push(entry);
        this._posHistory.push(this._key());
        return entry;
      }
      undo() {
        if (!this._history.length) return null;
        const l = this._history.pop();
        this._load(l.state);
        this._posHistory.pop();
        return l;
      }
      history(o) {
        if (o?.verbose) return this._history.map(h => ({
          from: h.from,
          to: h.to,
          san: h.san,
          captured: h.captured,
          color: h.color,
          promotion: h.promotion,
          piece: h.piece
        }));
        return this._history.map(h => h.san);
      }
      isCheckmate() {
        return this.inCheck() && this.moves().length === 0;
      }
      isStalemate() {
        return !this.inCheck() && this.moves().length === 0;
      }
      isInsufficientMaterial() {
        const pcs = {
          w: [],
          b: []
        };
        for (const sq of this._allSq()) {
          const p = this.board[sq];
          if (p && p.type !== 'k') pcs[p.color].push(p.type);
        }
        if (!pcs.w.length && !pcs.b.length) return true;
        if (!pcs.w.length && pcs.b.length === 1 && 'bn'.includes(pcs.b[0])) return true;
        if (!pcs.b.length && pcs.w.length === 1 && 'bn'.includes(pcs.w[0])) return true;
        return false;
      }
      isThreefoldRepetition() {
        const cur = this._key();
        let c = 0;
        for (const p of this._posHistory)
          if (p === cur) c++;
        return c >= 3;
      }
      isDraw() {
        return this.isStalemate() || this.isInsufficientMaterial() || this.isThreefoldRepetition() || this._halfMoves >= 100;
      }
      isGameOver() {
        return this.isCheckmate() || this.isDraw();
      }
    }

    // =============================================
    // GAME GLOBALS
    // =============================================
    const PIECE_UNICODE = {
      'wK': '♔',
      'wQ': '♕',
      'wR': '♖',
      'wB': '♗',
      'wN': '♘',
      'wP': '♙',
      'bK': '♚',
      'bQ': '♛',
      'bR': '♜',
      'bB': '♝',
      'bN': '♞',
      'bP': '♟'
    };
    const PIECE_VALUES = {
      p: 1,
      n: 3,
      b: 3,
      r: 5,
      q: 9,
      k: 0
    };
    const STOCKFISH_URL = 'https://cdn.jsdelivr.net/gh/TellyWallHall/cdn@main/scripts/Stockfish.js';

    let chess, selectedSquare = null,
      legalMovesForSelected = [],
      boardFlipped = false;
    let lastMoveFrom = null,
      lastMoveTo = null;
    let stockfish = null,
      engineReady = false,
      isEngineThinking = false,
      analysisMode = false;
    let pendingAIMove = false;

    // =============================================
    // INIT
    // =============================================
    function init() {
      chess = new Chess();
      renderBoard();
      updateStatus();
      initStockfish();
    }

    function initStockfish() {
      console.log('[Chess] Fetching Stockfish...');
      fetch(STOCKFISH_URL)
        .then(r => {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.text();
        })
        .then(code => {
          console.log('[Chess] Creating Blob Worker...');
          const blob = new Blob([code], {
            type: 'application/javascript'
          });
          const url = URL.createObjectURL(blob);
          const worker = new Worker(url);

          worker.addEventListener('message', e => handleEngineMessage(e.data));
          worker.addEventListener('error', e => {
            console.error('[Chess] Worker error:', e);
            setEngineStatus('⚠ Engine error', false);
          });

          stockfish = worker;
          sendToEngine('uci');
          console.log('[Chess] Sent uci command');
        })
        .catch(e => {
          console.error('[Chess] Stockfish load error:', e);
          setEngineStatus('⚠ Engine unavailable — using fallback AI', false);
          engineReady = true; // Allow fallback AI to work
        });
    }

    function sendToEngine(cmd) {
      if (stockfish) {
        try {
          stockfish.postMessage(cmd);
          console.log('[Engine] >', cmd);
        } catch (e) {
          console.error('[Engine] Send error:', e);
        }
      }
    }

    function handleEngineMessage(line) {
      if (typeof line !== 'string') return;
      console.log('[Engine] <', line);

      if (line === 'uciok') {
        sendToEngine('isready');
      }
      if (line === 'readyok') {
        engineReady = true;
        setEngineStatus('Stockfish ready ✓', false);
        console.log('[Chess] Engine ready! Checking if AI should move...');
        // Check if AI needs to move (e.g., player chose Black)
        setTimeout(() => checkIfAIShouldMove(), 100);
      }
      if (line.startsWith('info') && line.includes('score')) {
        parseEvaluation(line);
      }
      if (line.startsWith('bestmove')) {
        const best = line.split(' ')[1];
        console.log('[Chess] Best move received:', best, 'isEngineThinking:', isEngineThinking, 'analysisMode:', analysisMode);

        if (isEngineThinking && !analysisMode && best && best !== '(none)') {
          console.log('[Chess] Executing AI move:', best);
          handleEngineMove(best);
        }
        isEngineThinking = false;
        analysisMode = false;
      }
    }

    function parseEvaluation(line) {
      const dm = line.match(/depth (\d+)/),
        sm = line.match(/score (cp|mate) (-?\d+)/),
        pv = line.match(/ pv (.+)/);
      if (sm) {
        const type = sm[1],
          val = parseInt(sm[2]);
        let evalNum, evalText;
        if (type === 'cp') {
          evalNum = val / 100;
          if (chess.turn() === 'b') evalNum = -evalNum;
          evalText = (evalNum >= 0 ? '+' : '') + evalNum.toFixed(1);
        } else {
          evalNum = val > 0 ? 100 : -100;
          if (chess.turn() === 'b') evalNum = -evalNum;
          evalText = (val > 0 ? '+' : '') + 'M' + Math.abs(val);
        }
        document.getElementById('eval-score').textContent = evalText;
        document.getElementById('eval-score').style.color = evalNum >= 0 ? '#f0d9b5' : '#8ab4f8';
        document.getElementById('eval-bar').style.width = Math.min(95, Math.max(5, 50 + evalNum * 5)) + '%';
      }
      if (dm) document.getElementById('engine-depth').textContent = 'Depth: ' + dm[1];
      if (pv) document.getElementById('best-line').textContent = 'Line: ' + pv[1].split(' ').slice(0, 6).join(' ');
    }

    function setEngineStatus(text, showSpinner) {
      const el = document.getElementById('engine-status');
      el.innerHTML = showSpinner ? `<div class="spinner"></div><span>${text}</span>` : `<span>${text}</span>`;
    }

    function getSmartMove() {
      const moves = chess.moves({
        verbose: true
      });
      if (!moves.length) return null;
      const scored = moves.map(m => {
        let score = Math.random() * 2;
        const target = chess.get(m.to);
        if (target) score += 10 + PIECE_VALUES[target.type] * 10 - PIECE_VALUES[chess.get(m.from).type];
        if (m.promotion) score += m.promotion === 'q' ? 90 : 30;
        if ('d4d5e4e5'.includes(m.to)) score += 3;
        const saved = chess._save();
        chess._apply(m);
        if (chess.inCheck()) score += 5;
        chess._load(saved);
        return {
          move: m,
          score
        };
      });
      scored.sort((a, b) => b.score - a.score);
      return scored[Math.floor(Math.random() * Math.min(3, scored.length))].move;
    }

    // =============================================
    // BOARD
    // =============================================
    function renderBoard() {
      const board = document.getElementById('chessboard');
      board.innerHTML = '';
      for (let dr = 0; dr < 8; dr++) {
        for (let dc = 0; dc < 8; dc++) {
          const row = boardFlipped ? (7 - dr) : dr;
          const col = boardFlipped ? (7 - dc) : dc;
          const file = 'abcdefgh' [col];
          const rank = 8 - row;
          const sqName = file + rank;
          const isLight = (row + col) % 2 === 0;

          const sq = document.createElement('div');
          sq.className = `square ${isLight ? 'light' : 'dark'}`;

          if (sqName === selectedSquare) sq.classList.add('selected');
          if (sqName === lastMoveFrom) sq.classList.add('last-move-from');
          if (sqName === lastMoveTo) sq.classList.add('last-move-to');

          const piece = chess.get(sqName);
          if (legalMovesForSelected.includes(sqName)) {
            sq.classList.add('legal-move');
            if (piece) sq.classList.add('has-piece');
          }
          if (chess.inCheck() && piece && piece.type === 'k' && piece.color === chess.turn()) {
            sq.classList.add('check');
          }

          if (dc === 0) {
            const lbl = document.createElement('span');
            lbl.className = 'coord-label rank-label';
            lbl.textContent = rank;
            sq.appendChild(lbl);
          }
          if (dr === 7) {
            const lbl = document.createElement('span');
            lbl.className = 'coord-label file-label';
            lbl.textContent = file;
            sq.appendChild(lbl);
          }
          if (piece) {
            const span = document.createElement('span');
            span.className = 'piece-char';
            span.textContent = PIECE_UNICODE[(piece.color === 'w' ? 'w' : 'b') + piece.type.toUpperCase()];
            sq.appendChild(span);
          }

          sq.addEventListener('click', () => onSquareClick(sqName));
          board.appendChild(sq);
        }
      }
      updateCapturedPieces();
    }

    // =============================================
    // INTERACTION
    // =============================================
    function onSquareClick(square) {
      console.log('[Chess] Click:', square, 'turn:', chess.turn(), 'isEngineThinking:', isEngineThinking);

      if (isEngineThinking) {
        console.log('[Chess] Ignoring click - engine is thinking');
        return;
      }
      if (chess.isGameOver()) {
        console.log('[Chess] Ignoring click - game over');
        return;
      }

      const mode = document.getElementById('game-mode').value;
      const playerColor = document.getElementById('player-color').value;

      console.log('[Chess] Mode:', mode, 'PlayerColor:', playerColor);

      // In AI mode, only allow moves when it's the player's turn
      if (mode === 'ai' && chess.turn() !== playerColor) {
        console.log('[Chess] Ignoring click - not player turn');
        return;
      }
      // In AI vs AI mode, don't allow any clicks
      if (mode === 'ai-vs-ai') {
        console.log('[Chess] Ignoring click - AI vs AI mode');
        return;
      }

      const piece = chess.get(square);

      if (selectedSquare) {
        if (square === selectedSquare) {
          selectedSquare = null;
          legalMovesForSelected = [];
          renderBoard();
          return;
        }
        if (legalMovesForSelected.includes(square)) {
          tryMove(selectedSquare, square);
          return;
        }
        if (piece && piece.color === chess.turn()) {
          selectSquare(square);
          return;
        }
        selectedSquare = null;
        legalMovesForSelected = [];
        renderBoard();
        return;
      }

      if (piece && piece.color === chess.turn()) {
        selectSquare(square);
      }
    }

    function selectSquare(square) {
      selectedSquare = square;
      legalMovesForSelected = chess.moves({
        square,
        verbose: true
      }).map(m => m.to);
      console.log('[Chess] Selected:', square, 'Legal moves:', legalMovesForSelected);
      renderBoard();
    }

    function tryMove(from, to) {
      const piece = chess.get(from);
      if (piece && piece.type === 'p') {
        const tr = to[1];
        if ((piece.color === 'w' && tr === '8') || (piece.color === 'b' && tr === '1')) {
          showPromotionModal(from, to, piece.color);
          return;
        }
      }
      makeMove(from, to);
    }

    function makeMove(from, to, promotion) {
      console.log('[Chess] Making move:', from, '->', to, promotion || '');

      const obj = {
        from,
        to
      };
      if (promotion) obj.promotion = promotion;

      const result = chess.move(obj);

      if (result) {
        console.log('[Chess] Move successful:', result.san);
        lastMoveFrom = from;
        lastMoveTo = to;
        selectedSquare = null;
        legalMovesForSelected = [];
        renderBoard();
        updateStatus();
        updateMoveHistory();

        // Small delay then check if AI should respond
        setTimeout(() => {
          console.log('[Chess] Checking if AI should move after player move...');
          checkIfAIShouldMove();
        }, 100);
      } else {
        console.log('[Chess] Move failed!');
        selectedSquare = null;
        legalMovesForSelected = [];
        renderBoard();
      }
    }

    function showPromotionModal(from, to, color) {
      const modal = document.getElementById('promotion-modal');
      const div = document.getElementById('promotion-pieces');
      const cc = color === 'w' ? 'w' : 'b';
      div.innerHTML = '';
      for (const p of ['q', 'r', 'b', 'n']) {
        const el = document.createElement('div');
        el.className = 'promotion-piece';
        el.textContent = PIECE_UNICODE[cc + p.toUpperCase()];
        el.addEventListener('click', () => {
          modal.classList.remove('active');
          makeMove(from, to, p);
        });
        div.appendChild(el);
      }
      modal.classList.add('active');
    }

    // =============================================
    // AI
    // =============================================
    function checkIfAIShouldMove() {
      const mode = document.getElementById('game-mode').value;
      const playerColor = document.getElementById('player-color').value;
      const currentTurn = chess.turn();

      console.log('[Chess] checkIfAIShouldMove - mode:', mode, 'playerColor:', playerColor, 'turn:', currentTurn, 'gameOver:', chess.isGameOver(), 'isThinking:', isEngineThinking);

      if (chess.isGameOver()) {
        console.log('[Chess] Game is over, not moving');
        return;
      }

      if (isEngineThinking) {
        console.log('[Chess] Already thinking, not starting new calculation');
        return;
      }

      let shouldMove = false;

      if (mode === 'ai' && currentTurn !== playerColor) {
        console.log('[Chess] AI mode and it\'s AI\'s turn');
        shouldMove = true;
      } else if (mode === 'ai-vs-ai') {
        console.log('[Chess] AI vs AI mode');
        shouldMove = true;
      }

      if (shouldMove) {
        console.log('[Chess] Starting AI move...');
        makeAIMove();
      } else {
        console.log('[Chess] Not AI\'s turn to move');
        // Request analysis for player's benefit
        requestAnalysis();
      }
    }

    function makeAIMove() {
      if (isEngineThinking) {
        console.log('[Chess] makeAIMove called but already thinking!');
        return;
      }
      if (chess.isGameOver()) {
        console.log('[Chess] makeAIMove called but game is over!');
        return;
      }

      isEngineThinking = true;
      analysisMode = false;
      setEngineStatus('Thinking...', true);

      const depth = parseInt(document.getElementById('ai-depth').value);
      const fen = chess.fen();

      console.log('[Chess] AI thinking... depth:', depth, 'FEN:', fen);

      if (engineReady && stockfish) {
        sendToEngine('position fen ' + fen);
        sendToEngine('go depth ' + depth);
      } else {
        console.log('[Chess] Using fallback AI (engine not ready)');
        // Fallback
        setTimeout(() => {
          const m = getSmartMove();
          if (m) {
            console.log('[Chess] Fallback move:', m.from + m.to);
            handleEngineMove(m.from + m.to + (m.promotion || ''));
          }
          isEngineThinking = false;
          setEngineStatus('Fallback AI', false);
        }, 300 + Math.random() * 400);
      }
    }

    function handleEngineMove(uci) {
      console.log('[Chess] handleEngineMove:', uci);

      if (chess.isGameOver()) {
        console.log('[Chess] Game already over');
        isEngineThinking = false;
        return;
      }

      const from = uci.substring(0, 2);
      const to = uci.substring(2, 4);
      const promo = uci.length > 4 ? uci[4] : undefined;

      console.log('[Chess] Parsing UCI - from:', from, 'to:', to, 'promo:', promo);

      const obj = {
        from,
        to
      };
      if (promo) obj.promotion = promo;

      const result = chess.move(obj);

      if (result) {
        console.log('[Chess] AI move successful:', result.san);
        lastMoveFrom = from;
        lastMoveTo = to;
        selectedSquare = null;
        legalMovesForSelected = [];
        renderBoard();
        updateStatus();
        updateMoveHistory();
        setEngineStatus('Stockfish ready ✓', false);

        const mode = document.getElementById('game-mode').value;
        if (mode === 'ai-vs-ai' && !chess.isGameOver()) {
          console.log('[Chess] AI vs AI - scheduling next move');
          isEngineThinking = false;
          setTimeout(() => makeAIMove(), 500);
          return;
        }

        // Request analysis for next position
        isEngineThinking = false;
        setTimeout(() => requestAnalysis(), 100);
      } else {
        console.log('[Chess] AI move failed! UCI:', uci);
        isEngineThinking = false;
      }
    }

    function requestAnalysis() {
      if (!engineReady || !stockfish) return;
      if (isEngineThinking) return;

      console.log('[Chess] Requesting analysis...');
      isEngineThinking = true;
      analysisMode = true;
      sendToEngine('position fen ' + chess.fen());
      sendToEngine('go depth 15');
    }

    // =============================================
    // UI
    // =============================================
    function updateStatus() {
      const el = document.getElementById('status');
      document.getElementById('fen').textContent = chess.fen();

      if (chess.isCheckmate()) {
        const w = chess.turn() === 'w' ? 'Black' : 'White';
        el.textContent = `🏆 Checkmate! ${w} wins!`;
        el.style.color = '#e94560';
      } else if (chess.isDraw()) {
        let r = 'Draw';
        if (chess.isStalemate()) r = 'Draw by stalemate';
        else if (chess.isThreefoldRepetition()) r = 'Draw by repetition';
        else if (chess.isInsufficientMaterial()) r = 'Draw — insufficient material';
        el.textContent = `🤝 ${r}`;
        el.style.color = '#f39c12';
      } else if (chess.inCheck()) {
        const t = chess.turn() === 'w' ? 'White' : 'Black';
        el.textContent = `⚠️ ${t} is in CHECK!`;
        el.style.color = '#ff6b6b';
      } else {
        const t = chess.turn() === 'w' ? 'White' : 'Black';
        el.textContent = `${t}'s turn`;
        el.style.color = '#4ecca3';
      }
    }

    function updateMoveHistory() {
      const el = document.getElementById('move-history');
      const hist = chess.history();
      if (!hist.length) {
        el.innerHTML = '<span style="color:#666;">Game not started yet...</span>';
        return;
      }
      let html = '';
      for (let i = 0; i < hist.length; i += 2) {
        html += `<span class="move-number">${Math.floor(i/2)+1}.</span>`;
        html += `<span class="move-white">${hist[i]}</span>`;
        if (hist[i + 1]) html += `<span class="move-black">${hist[i+1]}</span>`;
        html += ' ';
      }
      el.innerHTML = html;
      el.scrollTop = el.scrollHeight;
    }

    function updateCapturedPieces() {
      const hist = chess.history({
        verbose: true
      });
      const capW = [],
        capB = [];
      hist.forEach(m => {
        if (m.captured) {
          if (m.color === 'w') capW.push({
            type: m.captured,
            color: 'b'
          });
          else capB.push({
            type: m.captured,
            color: 'w'
          });
        }
      });
      const render = (pieces, other, id) => {
        const el = document.getElementById(id);
        const sorted = pieces.sort((a, b) => PIECE_VALUES[b.type] - PIECE_VALUES[a.type]);
        let html = sorted.map(p => `<span class="captured-piece">${PIECE_UNICODE[(p.color==='w'?'w':'b')+p.type.toUpperCase()]}</span>`).join('');
        const adv = pieces.reduce((s, p) => s + PIECE_VALUES[p.type], 0) - other.reduce((s, p) => s + PIECE_VALUES[p.type], 0);
        if (adv > 0) html += `<span class="material-advantage">+${adv}</span>`;
        el.innerHTML = html;
      };
      render(capW, capB, 'captured-white');
      render(capB, capW, 'captured-black');
    }

    // =============================================
    // CONTROLS
    // =============================================
    function newGame() {
      console.log('[Chess] New game');
      chess = new Chess();
      selectedSquare = null;
      legalMovesForSelected = [];
      lastMoveFrom = null;
      lastMoveTo = null;
      isEngineThinking = false;
      analysisMode = false;

      renderBoard();
      updateStatus();
      updateMoveHistory();

      document.getElementById('eval-score').textContent = '0.0';
      document.getElementById('eval-bar').style.width = '50%';
      document.getElementById('best-line').textContent = '';
      document.getElementById('engine-depth').textContent = '';

      if (stockfish && engineReady) {
        sendToEngine('ucinewgame');
        sendToEngine('isready');
      }

      // Check if AI should move first (player is Black)
      setTimeout(() => {
        console.log('[Chess] Checking if AI should make first move...');
        checkIfAIShouldMove();
      }, 300);
    }

    function undoMove() {
      const mode = document.getElementById('game-mode').value;
      if (mode === 'ai') {
        chess.undo();
        chess.undo();
      } else {
        chess.undo();
      }
      selectedSquare = null;
      legalMovesForSelected = [];
      const h = chess.history({
        verbose: true
      });
      if (h.length) {
        lastMoveFrom = h[h.length - 1].from;
        lastMoveTo = h[h.length - 1].to;
      } else {
        lastMoveFrom = null;
        lastMoveTo = null;
      }
      isEngineThinking = false;
      analysisMode = false;
      renderBoard();
      updateStatus();
      updateMoveHistory();
      requestAnalysis();
    }

    function flipBoard() {
      boardFlipped = !boardFlipped;
      renderBoard();
    }

    function onModeChange() {
      const mode = document.getElementById('game-mode').value;
      console.log('[Chess] Mode changed to:', mode);
      if (mode === 'ai-vs-ai') {
        setTimeout(() => checkIfAIShouldMove(), 100);
      }
    }

    window.addEventListener('DOMContentLoaded', init);

    localStorage.setItem('Ion-o-koji Watermark', `${localStorage.getItem('Ion-o-koji Watermark') || ''} AI Chess v2,`);

  
