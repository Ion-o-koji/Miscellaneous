
      const _0x4a2b = ['QUl6YVN5QS1hWUxQN2VUVXIzdnlHcUl1Rkox', 'R1ZFNDJKamNNMVVV', 'ZmJjaGVzc3QuZmlyZWJhc2VhcHAuY29t', 'aHR0cHM6Ly9mYmNoZXNzdC1kZWZhdWx0', 'LXJ0ZGIuZmlyZWJhc2Vpby5jb20=', 'ZmJjaGVzc3Q=', 'ZmJjaGVzc3QuZmlyZWJhc2VzdG9yYWdlLmFwcA==', 'Nzc0Njk5NDY2MjI3', 'MTc3NDY5OTQ2NjIyNzp3ZWI6ZTE0MGQyMDg3N2MxOWVjMWU5ZTY4Ng==', 'Ry0xTERCWEJUMlFE'];
      const wemjnonmomo = {
        apiKey: atob(_0x4a2b[0]) + atob(_0x4a2b[1]),
        authDomain: atob(_0x4a2b[2]),
        databaseURL: atob(_0x4a2b[3]) + atob(_0x4a2b[4]),
        projectId: atob(_0x4a2b[5]),
        storageBucket: atob(_0x4a2b[6]),
        messagingSenderId: atob(_0x4a2b[7]),
        appId: atob(_0x4a2b[8]),
        measurementId: atob(_0x4a2b[9])
      };
      firebase.initializeApp(wemjnonmomo);
      const db = firebase.database();

      // Chess pieces Unicode
      const PIECES = {
        'K': '♔',
        'Q': '♕',
        'R': '♖',
        'B': '♗',
        'N': '♘',
        'P': '♙',
        'k': '♚',
        'q': '♛',
        'r': '♜',
        'b': '♝',
        'n': '♞',
        'p': '♟'
      };

      // Initial board setup
      const INITIAL_BOARD = [
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
        ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
      ];

      // Game state (spectating removed)
      let gameState = {
        gameId: null,
        playerId: null,
        playerColor: null,
        playerName: '',
        opponentName: '',
        board: JSON.parse(JSON.stringify(INITIAL_BOARD)),
        turn: 'white',
        selectedSquare: null,
        validMoves: [],
        lastMove: null,
        gameOver: false,
        whiteKingMoved: false,
        blackKingMoved: false,
        whiteRookAMoved: false,
        whiteRookHMoved: false,
        blackRookAMoved: false,
        blackRookHMoved: false,
        enPassantTarget: null
      };

      let gameRef = null;
      let pendingPromotion = null;

      // Config for Element SDK
      const defaultConfig = {
        game_title: 'Live Chess'
      };

      function applyConfig(config) {
        const title = document.getElementById('game-title');
        if (title) title.innerHTML = '♔ ' + (config.game_title || defaultConfig.game_title);
      }

      // Initialize Element SDK (if present)
      if (window.elementSdk) {
        window.elementSdk.init({
          defaultConfig,
          onConfigChange: async (config) => applyConfig(config),
          mapToCapabilities: () => ({
            recolorables: [],
            borderables: [],
            fontEditable: undefined,
            fontSizeable: undefined
          }),
          mapToEditPanelValues: (config) => new Map([
            ['game_title', config.game_title || defaultConfig.game_title]
          ])
        });
      }

      // UI Helpers
      function showToast(message, type = 'info') {
        const colors = {
          info: 'bg-blue-500',
          success: 'bg-green-500',
          error: 'bg-red-500'
        };
        const toast = document.createElement('div');
        toast.className = `toast ${colors[type]}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      }

      function showJoinInput() {
        document.getElementById('join-section').classList.toggle('hidden');
      }

      function generateGameCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
      }

      // Create new game (always private)
      async function createGame() {
        const name = document.getElementById('player-name').value.trim() || 'Player 1';
        gameState.playerName = name;
        gameState.playerId = 'player1';
        gameState.playerColor = 'white';
        gameState.gameId = generateGameCode();

        const gameData = {
          board: INITIAL_BOARD,
          turn: 'white',
          players: {
            white: {
              name,
              online: true
            },
            black: null
          },
          lastMove: null,
          status: 'waiting',
          private: true,
          castling: {
            whiteKingMoved: false,
            blackKingMoved: false,
            whiteRookAMoved: false,
            whiteRookHMoved: false,
            blackRookAMoved: false,
            blackRookHMoved: false
          },
          enPassantTarget: null,
          createdAt: Date.now()
        };

        try {
          await db.ref(`games/${gameState.gameId}`).set(gameData);
          document.getElementById('game-code-display').textContent = gameState.gameId;
          document.getElementById('lobby').classList.add('hidden');
          document.getElementById('waiting-room').classList.remove('hidden');
          document.getElementById('waiting-room').classList.add('flex');

          // Remove game if creator disconnects before start
          db.ref(`games/${gameState.gameId}`).onDisconnect().remove();

          listenToGame();
        } catch (error) {
          showToast('Failed to create game', 'error');
        }
      }

      // Join existing game
      async function joinGame() {
        const code = document.getElementById('game-code-input').value.trim().toUpperCase();
        const name = document.getElementById('player-name').value.trim() || 'Player 2';

        if (code.length !== 6) {
          showToast('Please enter a valid 6-digit code', 'error');
          return;
        }

        await joinExistingGame(code, name);
      }

      // Join an existing game by ID
      async function joinExistingGame(code, name = null) {
        if (!name) name = document.getElementById('player-name').value.trim() || 'Player 2';

        try {
          const snapshot = await db.ref(`games/${code}`).once('value');
          const game = snapshot.val();

          if (!game) {
            showToast('Game not found', 'error');
            return;
          }

          if (game.players.black) {
            showToast('Game is full', 'error');
            return;
          }

          gameState.gameId = code;
          gameState.playerName = name;
          gameState.playerId = 'player2';
          gameState.playerColor = 'black';
          gameState.opponentName = game.players.white.name;

          await db.ref(`games/${code}/players/black`).set({
            name,
            online: true
          });
          await db.ref(`games/${code}/status`).set('playing');

          // Cleanup if this player disconnects
          db.ref(`games/${code}/players/black/online`).onDisconnect().set(false);

          document.getElementById('lobby').classList.add('hidden');
          startGame();
          listenToGame();
        } catch (error) {
          showToast('Failed to join game', 'error');
        }
      }

      // Listen to game updates
      function listenToGame() {
        gameRef = db.ref(`games/${gameState.gameId}`);

        gameRef.on('value', (snapshot) => {
          const data = snapshot.val();
          if (!data) return;

          // If creator is white and opponent joined, start the game UI
          if (data.status === 'playing' && gameState.playerColor === 'white' && data.players.black) {
            gameState.opponentName = data.players.black.name;
            // Cancel auto-delete and set onDisconnect for white presence
            db.ref(`games/${gameState.gameId}`).onDisconnect().cancel();
            db.ref(`games/${gameState.gameId}/players/white/online`).onDisconnect().set(false);

            document.getElementById('waiting-room').classList.add('hidden');
            document.getElementById('waiting-room').classList.remove('flex');
            startGame();
          }

          // Update state
          if (data.board) gameState.board = data.board;
          if (data.turn) gameState.turn = data.turn;
          if (data.lastMove) gameState.lastMove = data.lastMove;
          if (data.castling) {
            gameState.whiteKingMoved = data.castling.whiteKingMoved;
            gameState.blackKingMoved = data.castling.blackKingMoved;
            gameState.whiteRookAMoved = data.castling.whiteRookAMoved;
            gameState.whiteRookHMoved = data.castling.whiteRookHMoved;
            gameState.blackRookAMoved = data.castling.blackRookAMoved;
            gameState.blackRookHMoved = data.castling.blackRookHMoved;
          }
          gameState.enPassantTarget = data.enPassantTarget || null;

          renderBoard();
          updateTurnIndicator();

          // Handle game end states
          if (data.status === 'checkmate' || data.status === 'resigned' || data.status === 'stalemate') {
            showGameOver(data.status, data.winner);
            // Clean up game after 5 minutes
            setTimeout(() => db.ref(`games/${gameState.gameId}`).remove(), 5 * 60 * 1000);
          }
        });
      }

      // Start the game UI
      function startGame() {
        document.getElementById('game-screen').classList.remove('hidden');
        document.getElementById('game-screen').classList.add('flex');

        document.getElementById('opponent-name').textContent = gameState.opponentName;
        document.getElementById('my-name').textContent = gameState.playerName;
        document.getElementById('my-color').textContent = gameState.playerColor === 'white' ? '♔' : '♚';

        renderBoard();
        updateTurnIndicator();
      }

      // Render the chess board
      function renderBoard() {
        const boardEl = document.getElementById('chess-board');
        boardEl.innerHTML = '';

        const isBlack = gameState.playerColor === 'black';

        for (let displayRow = 0; displayRow < 8; displayRow++) {
          for (let displayCol = 0; displayCol < 8; displayCol++) {
            const row = isBlack ? 7 - displayRow : displayRow;
            const col = isBlack ? 7 - displayCol : displayCol;

            const square = document.createElement('div');
            const isLight = (row + col) % 2 === 0;
            square.className = `square ${isLight ? 'light' : 'dark'}`;
            square.dataset.row = row;
            square.dataset.col = col;

            const piece = gameState.board[row][col];
            if (piece) {
              const pieceEl = document.createElement('span');
              pieceEl.className = 'piece';
              pieceEl.textContent = PIECES[piece];
              square.appendChild(pieceEl);
            }

            // Highlight selected square
            if (gameState.selectedSquare &&
              gameState.selectedSquare.row === row &&
              gameState.selectedSquare.col === col) {
              square.classList.add('selected');
            }

            // Highlight valid moves (priority over last move)
            const isValidMove = gameState.validMoves.some(m => m.row === row && m.col === col);
            if (isValidMove) {
              if (piece) square.classList.add('valid-capture');
              else square.classList.add('valid-move');
            } else if (gameState.lastMove) {
              if ((gameState.lastMove.from.row === row && gameState.lastMove.from.col === col) ||
                (gameState.lastMove.to.row === row && gameState.lastMove.to.col === col)) {
                square.classList.add('last-move');
              }
            }

            // Highlight king in check
            if (piece && piece.toLowerCase() === 'k') {
              const kingColor = piece === 'K' ? 'white' : 'black';
              if (isKingInCheck(gameState.board, kingColor)) square.classList.add('check');
            }

            square.addEventListener('click', () => handleSquareClick(row, col));
            boardEl.appendChild(square);
          }
        }
      }

      // Update turn indicator
      function updateTurnIndicator() {
        const indicator = document.getElementById('turn-indicator');
        const isMyTurn = gameState.turn === gameState.playerColor;
        indicator.textContent = isMyTurn ? "Your turn" : "Opponent's turn";
        indicator.className = isMyTurn ? 'text-amber-400 font-semibold text-sm' : 'text-gray-400 text-sm';
      }

      // Handle square click
      function handleSquareClick(row, col) {
        if (gameState.gameOver) return;
        if (gameState.turn !== gameState.playerColor) {
          showToast("It's not your turn", 'info');
          return;
        }

        const piece = gameState.board[row][col];
        const isWhitePiece = piece && piece === piece.toUpperCase();
        const isMyPiece = (gameState.playerColor === 'white' && isWhitePiece) ||
          (gameState.playerColor === 'black' && piece && !isWhitePiece);

        // Select own piece
        if (isMyPiece) {
          gameState.selectedSquare = {
            row,
            col
          };
          gameState.validMoves = getValidMoves(row, col);
          renderBoard();
          return;
        }

        // If move chosen
        if (gameState.selectedSquare) {
          const isValidMove = gameState.validMoves.some(m => m.row === row && m.col === col);
          if (isValidMove) makeMove(gameState.selectedSquare.row, gameState.selectedSquare.col, row, col);
          gameState.selectedSquare = null;
          gameState.validMoves = [];
          renderBoard();
        }
      }

      // Valid-move generators (pawn, sliding, knight, king)
      function getValidMoves(row, col) {
        const piece = gameState.board[row][col];
        if (!piece) return [];

        const moves = [];
        const isWhite = piece === piece.toUpperCase();
        const pieceType = piece.toLowerCase();

        switch (pieceType) {
          case 'p':
            moves.push(...getPawnMoves(row, col, isWhite));
            break;
          case 'r':
            moves.push(...getSlidingMoves(row, col, [
              [0, 1],
              [0, -1],
              [1, 0],
              [-1, 0]
            ]));
            break;
          case 'n':
            moves.push(...getKnightMoves(row, col));
            break;
          case 'b':
            moves.push(...getSlidingMoves(row, col, [
              [1, 1],
              [1, -1],
              [-1, 1],
              [-1, -1]
            ]));
            break;
          case 'q':
            moves.push(...getSlidingMoves(row, col, [
              [0, 1],
              [0, -1],
              [1, 0],
              [-1, 0],
              [1, 1],
              [1, -1],
              [-1, 1],
              [-1, -1]
            ]));
            break;
          case 'k':
            moves.push(...getKingMoves(row, col, isWhite));
            break;
        }

        // Remove moves leaving king in check
        return moves.filter(move => {
          const testBoard = JSON.parse(JSON.stringify(gameState.board));
          testBoard[move.row][move.col] = testBoard[row][col];
          testBoard[row][col] = '';
          return !isKingInCheck(testBoard, isWhite ? 'white' : 'black');
        });
      }

      function getPawnMoves(row, col, isWhite) {
        const moves = [];
        const direction = isWhite ? -1 : 1;
        const startRow = isWhite ? 6 : 1;

        // Forward
        if (gameState.board[row + direction]?.[col] === '') {
          moves.push({
            row: row + direction,
            col
          });
          if (row === startRow && gameState.board[row + 2 * direction]?.[col] === '') {
            moves.push({
              row: row + 2 * direction,
              col
            });
          }
        }

        // Captures + en passant
        [-1, 1].forEach(dc => {
          const newCol = col + dc;
          const newRow = row + direction;
          if (newCol >= 0 && newCol < 8 && newRow >= 0 && newRow < 8) {
            const target = gameState.board[newRow][newCol];
            if (target && (isWhite ? target === target.toLowerCase() : target === target.toUpperCase())) {
              moves.push({
                row: newRow,
                col: newCol
              });
            }
            if (gameState.enPassantTarget &&
              gameState.enPassantTarget.row === newRow &&
              gameState.enPassantTarget.col === newCol) {
              moves.push({
                row: newRow,
                col: newCol,
                enPassant: true
              });
            }
          }
        });

        return moves;
      }

      function getSlidingMoves(row, col, directions) {
        const moves = [];
        const piece = gameState.board[row][col];
        const isWhite = piece === piece.toUpperCase();

        directions.forEach(([dr, dc]) => {
          let r = row + dr,
            c = col + dc;
          while (r >= 0 && r < 8 && c >= 0 && c < 8) {
            const target = gameState.board[r][c];
            if (!target) moves.push({
              row: r,
              col: c
            });
            else {
              if (isWhite ? target === target.toLowerCase() : target === target.toUpperCase()) moves.push({
                row: r,
                col: c
              });
              break;
            }
            r += dr;
            c += dc;
          }
        });

        return moves;
      }

      function getKnightMoves(row, col) {
        const moves = [];
        const piece = gameState.board[row][col];
        const isWhite = piece === piece.toUpperCase();
        const offsets = [
          [-2, -1],
          [-2, 1],
          [-1, -2],
          [-1, 2],
          [1, -2],
          [1, 2],
          [2, -1],
          [2, 1]
        ];
        offsets.forEach(([dr, dc]) => {
          const r = row + dr,
            c = col + dc;
          if (r >= 0 && r < 8 && c >= 0 && c < 8) {
            const target = gameState.board[r][c];
            if (!target || (isWhite ? target === target.toLowerCase() : target === target.toUpperCase())) moves.push({
              row: r,
              col: c
            });
          }
        });
        return moves;
      }

      function getKingMoves(row, col, isWhite) {
        const moves = [];
        const offsets = [
          [-1, -1],
          [-1, 0],
          [-1, 1],
          [0, -1],
          [0, 1],
          [1, -1],
          [1, 0],
          [1, 1]
        ];
        offsets.forEach(([dr, dc]) => {
          const r = row + dr,
            c = col + dc;
          if (r >= 0 && r < 8 && c >= 0 && c < 8) {
            const target = gameState.board[r][c];
            if (!target || (isWhite ? target === target.toLowerCase() : target === target.toUpperCase())) moves.push({
              row: r,
              col: c
            });
          }
        });

        // Castling
        const kingMoved = isWhite ? gameState.whiteKingMoved : gameState.blackKingMoved;
        if (!kingMoved && !isKingInCheck(gameState.board, isWhite ? 'white' : 'black')) {
          // Kingside
          const rookHMoved = isWhite ? gameState.whiteRookHMoved : gameState.blackRookHMoved;
          if (!rookHMoved &&
            !gameState.board[row][5] &&
            !gameState.board[row][6] &&
            !isSquareAttacked(gameState.board, row, 5, isWhite ? 'black' : 'white') &&
            !isSquareAttacked(gameState.board, row, 6, isWhite ? 'black' : 'white')) {
            moves.push({
              row,
              col: 6,
              castle: 'kingside'
            });
          }

          // Queenside
          const rookAMoved = isWhite ? gameState.whiteRookAMoved : gameState.blackRookAMoved;
          if (!rookAMoved &&
            !gameState.board[row][1] &&
            !gameState.board[row][2] &&
            !gameState.board[row][3] &&
            !isSquareAttacked(gameState.board, row, 2, isWhite ? 'black' : 'white') &&
            !isSquareAttacked(gameState.board, row, 3, isWhite ? 'black' : 'white')) {
            moves.push({
              row,
              col: 2,
              castle: 'queenside'
            });
          }
        }

        return moves;
      }

      function isKingInCheck(board, color) {
        let kingRow, kingCol;
        const kingPiece = color === 'white' ? 'K' : 'k';
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (board[r][c] === kingPiece) {
              kingRow = r;
              kingCol = c;
              break;
            }
          }
        }
        return isSquareAttacked(board, kingRow, kingCol, color === 'white' ? 'black' : 'white');
      }

      function isSquareAttacked(board, row, col, byColor) {
        const isWhiteAttacker = byColor === 'white';

        // Pawn attacks
        const pawnDir = isWhiteAttacker ? 1 : -1;
        const pawn = isWhiteAttacker ? 'P' : 'p';
        if (board[row + pawnDir]?.[col - 1] === pawn || board[row + pawnDir]?.[col + 1] === pawn) return true;

        // Knight attacks
        const knight = isWhiteAttacker ? 'N' : 'n';
        const knightOffsets = [
          [-2, -1],
          [-2, 1],
          [-1, -2],
          [-1, 2],
          [1, -2],
          [1, 2],
          [2, -1],
          [2, 1]
        ];
        for (const [dr, dc] of knightOffsets)
          if (board[row + dr]?.[col + dc] === knight) return true;

        // King attacks
        const king = isWhiteAttacker ? 'K' : 'k';
        const kingOffsets = [
          [-1, -1],
          [-1, 0],
          [-1, 1],
          [0, -1],
          [0, 1],
          [1, -1],
          [1, 0],
          [1, 1]
        ];
        for (const [dr, dc] of kingOffsets)
          if (board[row + dr]?.[col + dc] === king) return true;

        // Rook/Queen straight lines
        const rook = isWhiteAttacker ? 'R' : 'r';
        const queen = isWhiteAttacker ? 'Q' : 'q';
        const straightDirs = [
          [0, 1],
          [0, -1],
          [1, 0],
          [-1, 0]
        ];
        for (const [dr, dc] of straightDirs) {
          let r = row + dr,
            c = col + dc;
          while (r >= 0 && r < 8 && c >= 0 && c < 8) {
            const piece = board[r][c];
            if (piece) {
              if (piece === rook || piece === queen) return true;
              break;
            }
            r += dr;
            c += dc;
          }
        }

        // Bishop/Queen diagonals
        const bishop = isWhiteAttacker ? 'B' : 'b';
        const diagDirs = [
          [1, 1],
          [1, -1],
          [-1, 1],
          [-1, -1]
        ];
        for (const [dr, dc] of diagDirs) {
          let r = row + dr,
            c = col + dc;
          while (r >= 0 && r < 8 && c >= 0 && c < 8) {
            const piece = board[r][c];
            if (piece) {
              if (piece === bishop || piece === queen) return true;
              break;
            }
            r += dr;
            c += dc;
          }
        }

        return false;
      }

      // Make a move and update DB
      async function makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = gameState.board[fromRow][fromCol];
        const isWhite = piece === piece.toUpperCase();
        const move = gameState.validMoves.find(m => m.row === toRow && m.col === toCol);

        const newBoard = JSON.parse(JSON.stringify(gameState.board));
        newBoard[toRow][toCol] = piece;
        newBoard[fromRow][fromCol] = '';

        // En passant
        if (move?.enPassant) newBoard[fromRow][toCol] = '';

        // Castling
        if (move?.castle === 'kingside') {
          newBoard[fromRow][5] = newBoard[fromRow][7];
          newBoard[fromRow][7] = '';
        } else if (move?.castle === 'queenside') {
          newBoard[fromRow][3] = newBoard[fromRow][0];
          newBoard[fromRow][0] = '';
        }

        // Pawn promotion (defer to modal)
        if (piece.toLowerCase() === 'p' && (toRow === 0 || toRow === 7)) {
          pendingPromotion = {
            fromRow,
            fromCol,
            toRow,
            toCol,
            isWhite,
            move,
            newBoard
          };
          showPromotionModal(isWhite);
          return;
        }

        // En passant target update
        let newEnPassant = null;
        if (piece.toLowerCase() === 'p' && Math.abs(fromRow - toRow) === 2) newEnPassant = {
          row: (fromRow + toRow) / 2,
          col: fromCol
        };

        // Castling rights update
        const castling = {
          whiteKingMoved: gameState.whiteKingMoved || (piece === 'K'),
          blackKingMoved: gameState.blackKingMoved || (piece === 'k'),
          whiteRookAMoved: gameState.whiteRookAMoved || (fromRow === 7 && fromCol === 0),
          whiteRookHMoved: gameState.whiteRookHMoved || (fromRow === 7 && fromCol === 7),
          blackRookAMoved: gameState.blackRookAMoved || (fromRow === 0 && fromCol === 0),
          blackRookHMoved: gameState.blackRookHMoved || (fromRow === 0 && fromCol === 7)
        };

        const nextTurn = gameState.turn === 'white' ? 'black' : 'white';

        let status = 'playing';
        let winner = null;
        if (isCheckmate(newBoard, nextTurn)) {
          status = 'checkmate';
          winner = gameState.turn;
        } else if (isStalemate(newBoard, nextTurn)) {
          status = 'stalemate';
        }

        const updates = {
          board: newBoard,
          turn: nextTurn,
          lastMove: {
            from: {
              row: fromRow,
              col: fromCol
            },
            to: {
              row: toRow,
              col: toCol
            }
          },
          castling,
          enPassantTarget: newEnPassant,
          status,
          winner
        };

        await db.ref(`games/${gameState.gameId}`).update(updates);
      }

      function isCheckmate(board, color) {
        if (!isKingInCheck(board, color)) return false;
        return !hasLegalMoves(board, color);
      }

      function isStalemate(board, color) {
        if (isKingInCheck(board, color)) return false;
        return !hasLegalMoves(board, color);
      }

      function hasLegalMoves(board, color) {
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (!piece) continue;
            const isWhite = piece === piece.toUpperCase();
            if ((color === 'white' && !isWhite) || (color === 'black' && isWhite)) continue;

            const origBoard = gameState.board;
            gameState.board = board;
            const moves = getValidMoves(r, c);
            gameState.board = origBoard;

            if (moves.length > 0) return true;
          }
        }
        return false;
      }

      // Show game over modal
      function showGameOver(status, winner) {
        gameState.gameOver = true;
        const modal = document.getElementById('game-over-modal');
        const icon = document.getElementById('result-icon');
        const text = document.getElementById('result-text');
        const detail = document.getElementById('result-detail');

        if (status === 'checkmate') {
          const youWon = winner === gameState.playerColor;
          icon.textContent = youWon ? '🏆' : '😔';
          text.textContent = youWon ? 'Victory!' : 'Defeat';
          detail.textContent = youWon ? 'Checkmate! You won!' : 'Checkmate. Better luck next time!';
        } else if (status === 'stalemate') {
          icon.textContent = '🤝';
          text.textContent = 'Draw';
          detail.textContent = 'Stalemate - no legal moves available.';
        } else if (status === 'resigned') {
          const youWon = winner === gameState.playerColor;
          icon.textContent = youWon ? '🏆' : '🏳️';
          text.textContent = youWon ? 'Victory!' : 'You Resigned';
          detail.textContent = youWon ? 'Your opponent resigned.' : 'You resigned the game.';
        }

        modal.classList.remove('hidden');
      }

      async function resignGame() {
        const winner = gameState.playerColor === 'white' ? 'black' : 'white';
        await db.ref(`games/${gameState.gameId}`).update({
          status: 'resigned',
          winner
        });
      }

      function copyGameCode() {
        navigator.clipboard.writeText(gameState.gameId).then(() => showToast('Code copied!', 'success'));
      }

      function cancelGame() {
        if (gameRef) {
          gameRef.off();
          db.ref(`games/${gameState.gameId}`).remove();
        }
        location.reload();
      }

      function backToLobby() {
        if (gameRef) gameRef.off();
        location.reload();
      }

      function showPromotionModal(isWhite) {
        const modal = document.getElementById('promotion-modal');
        document.getElementById('promo-queen').textContent = isWhite ? PIECES.Q : PIECES.q;
        document.getElementById('promo-rook').textContent = isWhite ? PIECES.R : PIECES.r;
        document.getElementById('promo-bishop').textContent = isWhite ? PIECES.B : PIECES.b;
        document.getElementById('promo-knight').textContent = isWhite ? PIECES.N : PIECES.n;
        modal.classList.remove('hidden');
      }

      async function promotePawn(pieceType) {
        if (!pendingPromotion) return;

        const {
          fromRow,
          fromCol,
          toRow,
          toCol,
          isWhite,
          newBoard
        } = pendingPromotion;
        const piece = gameState.board[fromRow][fromCol];

        newBoard[toRow][toCol] = isWhite ? pieceType.toUpperCase() : pieceType.toLowerCase();

        let newEnPassant = null;
        const castling = {
          whiteKingMoved: gameState.whiteKingMoved || (piece === 'K'),
          blackKingMoved: gameState.blackKingMoved || (piece === 'k'),
          whiteRookAMoved: gameState.whiteRookAMoved || (fromRow === 7 && fromCol === 0),
          whiteRookHMoved: gameState.whiteRookHMoved || (fromRow === 7 && fromCol === 7),
          blackRookAMoved: gameState.blackRookAMoved || (fromRow === 0 && fromCol === 0),
          blackRookHMoved: gameState.blackRookHMoved || (fromRow === 0 && fromCol === 7)
        };

        const nextTurn = gameState.turn === 'white' ? 'black' : 'white';

        let status = 'playing';
        let winner = null;
        if (isCheckmate(newBoard, nextTurn)) {
          status = 'checkmate';
          winner = gameState.turn;
        } else if (isStalemate(newBoard, nextTurn)) {
          status = 'stalemate';
        }

        const updates = {
          board: newBoard,
          turn: nextTurn,
          lastMove: {
            from: {
              row: fromRow,
              col: fromCol
            },
            to: {
              row: toRow,
              col: toCol
            }
          },
          castling,
          enPassantTarget: newEnPassant,
          status,
          winner
        };

        await db.ref(`games/${gameState.gameId}`).update(updates);

        document.getElementById('promotion-modal').classList.add('hidden');
        pendingPromotion = null;
      }

      // Initial config apply
      applyConfig(defaultConfig);

      // Cleanup old games on page load (games older than 1 hour)
      db.ref('games').orderByChild('createdAt').once('value', (snapshot) => {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        snapshot.forEach((child) => {
          const game = child.val();
          if (game.createdAt && (now - game.createdAt > oneHour)) child.ref.remove();
        });
      });
    
