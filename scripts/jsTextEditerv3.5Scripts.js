
    const editor = document.getElementById('editor');
    const highlighted = document.getElementById('highlighted');
    const lineNumbers = document.getElementById('line-numbers');
    const fileTree = document.getElementById('file-tree');
    const fileInput = document.getElementById('file-input');
    const initialContent = `<!DOCTYPE html>\n<!-- Edited By Ion-o-koji -->\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Skeleton Code</title>\n  <style>\n  </style>\n</head>\n<body>\n  <script>\n  <\/script>\n</body>\n</html>`;
    const CORS_PROXY = 'l0XFiC0EyTTzZXCnXL1i8kNd0W_AZDcExe_waCg4';
    const fetchModal = document.getElementById('fetchModal');
    const fetchButton = document.getElementById('fetch-btn');
    const fetchCloseModal = document.querySelector('.close');
    const fetchHTMLButton = document.getElementById('fetchHTMLButton');
    const fetchStatusMessage = document.getElementById('statusMessage');

    const toast = (m, t = 'info', d = 3000) => {
      const c = document.getElementById('toast-container') || Object.assign(document.body.appendChild(document.createElement('div')), {
        id: 'toast-container',
        style: 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:12px;pointer-events:none;width:90%;max-width:420px'
      });
      const i = {
        'success': '<svg fill="none" stroke="#10b981" viewBox="0 0 24 24" style="width:24px;height:24px;flex-shrink:0"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
        'error': '<svg fill="none" stroke="#ef4444" viewBox="0 0 24 24" style="width:24px;height:24px;flex-shrink:0"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
        'info': '<svg fill="none" stroke="#3b82f6" viewBox="0 0 24 24" style="width:24px;height:24px;flex-shrink:0"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
        'warning': '<svg fill="none" stroke="#f59e0b" viewBox="0 0 24 24" style="width:24px;height:24px;flex-shrink:0"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>'
      };
      const e = Object.assign(document.createElement('div'), {
        innerHTML: i[t] + '<div style="flex:1;text-align:left">' + m + '</div>',
        style: 'background:#252526;color:#d4d4d4;padding:16px 24px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.5);display:flex;align-items:center;gap:12px;min-width:280px;pointer-events:auto;animation:slideUp 0.3s ease;font-size:15px;font-weight:500;border:1px solid rgba(255,255,255,0.1)'
      });
      if (!document.getElementById('toast-styles')) document.head.insertAdjacentHTML('beforeend', '<style id="toast-styles">@keyframes slideUp{from{transform:translateY(100px);opacity:0}to{transform:translateY(0);opacity:1}}@keyframes slideDown{to{transform:translateY(100px);opacity:0}}</style>');
      c.appendChild(e);
      setTimeout(() => {
        e.style.animation = 'slideDown 0.3s ease forwards';
        setTimeout(() => c.removeChild(e), 300)
      }, d)
    };

    let fetchedHTML = '';
    let currentURL = '';

    let state = {
      files: {
        'index.html': initialContent
      },
      currentFile: 'index.html',
      undoStack: {
        'index.html': [initialContent]
      },
      redoStack: {
        'index.html': []
      },
      errors: []
    };

    function init() {
      updateFileTree();
      editor.textContent = initialContent;
      editor.style.whiteSpace = 'pre-wrap';
      editor.spellcheck = false;
      editor.tabIndex = 0;
      updateAll();
      setupEventListeners();
      applySavedSettings();
      handleInput();
    }

    function showStatus(message, type) {
      fetchStatusMessage.textContent = message;
      fetchStatusMessage.style.color = type === 'error' ? 'red' : type === 'success' ? 'green' : 'white';
    }

    function displayHTML(html) {
      editor.textContent = html;
    }

    fetchButton.onclick = () => {
      fetchModal.style.display = 'block';
    };

    fetchCloseModal.onclick = () => {
      fetchModal.style.display = 'none';
    };

    window.onclick = (event) => {
      if (event.target === fetchModal) {
        fetchModal.style.display = 'none';
      }
    };

    // Overflow Menu Toggle
    const overflowBtn = document.getElementById('overflow-btn');
    const overflowMenu = document.getElementById('overflow-menu');

    overflowBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      overflowMenu.classList.toggle('open');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!overflowMenu.contains(e.target) && e.target !== overflowBtn) {
        overflowMenu.classList.remove('open');
      }
    });

    // Close menu when any menu button is clicked
    overflowMenu.addEventListener('click', (e) => {
      if (e.target.closest('.btn')) {
        overflowMenu.classList.remove('open');
      }
    });

    fetchHTMLButton.onclick = async function fetchHTML() {
      const urlInput = document.getElementById('urlInput');
      let url = urlInput.value.trim();

      if (!url) {
        showStatus('Enter a URL', 'error');
        return;
      }

      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      showStatus('Fetching...', 'info');
      if (CORS_PROXY.trim() === "") {
        const userInput = prompt("A CORS Anywhere URL is required for full functionality. Please enter one:");
        if (userInput && userInput.trim() !== "") {
          CORS_PROXY = userInput.trim();
          console.log("CORS_URL set to:", CORS_PROXY);
        } else {
          alert("CORS Anywhere URL is required for full functionality.");
        }
      }
      try {
        const response = await fetch(CORS_PROXY + encodeURIComponent(url));

        if (!response.ok) {
          throw new Error(`${response.status}: ${response.statusText}`);
        }

        fetchedHTML = await response.text();
        currentURL = url;

        const titleMatch = fetchedHTML.match(/<title>(.*?)<\/title>/i);
        let pageTitle = titleMatch ? titleMatch[1].trim() : 'Untitled Page';
        pageTitle += '.html';
        createNewFile(pageTitle);

        displayHTML(fetchedHTML);
        showStatus(`Fetched ${fetchedHTML.length} characters`, 'success');
        fetchModal.style.display = 'none';
        updateAll();
      } catch (error) {
        showStatus(`Error: ${error.message}`, 'error');
        console.error('Fetch error:', error);
      }
    };

    function setupEventListeners() {
      editor.addEventListener('input', handleInput);
      editor.addEventListener('keydown', handleKeyDown);
      editor.addEventListener('click', updateCursorPosition);

      document.getElementById('new-btn').onclick = () => createNewFile(null);
      document.getElementById('saveas-btn').onclick = () => exportFile(false);
      document.getElementById('savelive-btn').onclick = () => saveLiveFile();
      document.getElementById('uploadlive-btn').onclick = () => openLiveFile();
      document.getElementById('share-btn').onclick = () => exportFile(true);
      document.getElementById('preview-btn').onclick = openPreview;
      document.getElementById('restore-btn').onclick = restoreBackup;
      document.getElementById('menu-btn').onclick = toggleSidebar;
      document.getElementById('undo-btn').onclick = undo;
      document.getElementById('redo-btn').onclick = redo;
      document.getElementById('upload-btn').onclick = () => fileInput.click();
      document.getElementById('tab-btn').addEventListener('click', handleTab);
      document.getElementById('comment-btn').addEventListener('click', handleComment);
      document.querySelector('.theme-select').addEventListener('click', e => {
        if (e.target.classList.contains('theme-option')) {
          handleThemeChange(e);
        }
      });
      document.addEventListener('selectionchange', updateCursorPosition);
      document.addEventListener('click', closeSidebarOnOutsideClick);

      fileInput.addEventListener('change', handleFileUpload);

    }

    function getLineNumber(offset) {
      const content = editor.textContent.slice(0, offset);
      return (content.match(/\n/g) || []).length;
    }

    function handleInput() {
      const currentContent = editor.innerText;
      state.files[state.currentFile] = currentContent;
      saveState();
      updateAll();
    }

    function handleComment(e) {
      e.preventDefault();

      // Show modal with comment types
      const modal = document.createElement('div');
      modal.style.cssText = 'z-index: 10000; position: fixed; top: 30%; align-content: center;';
      modal.className = 'modal-content';

      const title = document.createElement('h3');
      title.textContent = 'Choose Comment Style';
      title.style.cssText = 'margin: 0 0 15px 0; font-size: 16px;';
      modal.appendChild(title);

      const commentTypes = [{
          label: '/* ... */',
          start: '/* ',
          end: ' */',
          perLine: false
        },
        {
          label: '<!-- ... -->',
          start: '<!-- ',
          end: ' -->',
          perLine: false
        },
        {
          label: '// ...',
          start: '// ',
          end: '',
          perLine: true
        }
      ];

      commentTypes.forEach(type => {
        const btn = document.createElement('button');
        btn.textContent = type.label;
        //btn.style.cssText = 'display: block; width: 100%; padding: 10px; margin: 5px 0; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer;';
        btn.className = 'btn2';
        btn.onmouseover = () => btn.style.background = '#1d4ed8';
        btn.onmouseout = () => btn.style.background = '#2563eb';
        btn.onclick = () => {
          applyComment(type.start, type.end, type.perLine);
          document.body.removeChild(modal);
          document.body.removeChild(backdrop);
        };
        modal.appendChild(btn);
      });

      const backdrop = document.createElement('div');
      backdrop.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999;';
      backdrop.onclick = () => {
        document.body.removeChild(modal);
        document.body.removeChild(backdrop);
      };

      document.body.appendChild(backdrop);
      document.body.appendChild(modal);

      function applyComment(startComment, endComment, perLine) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const startOffset = range.startOffset;
        const endOffset = range.endOffset;

        const content = editor.innerText;
        const startLine = getLineNumber(range.startOffset);
        const endLine = getLineNumber(range.endOffset);

        const lines = content.split('\n');

        let newContent;
        let addedLength;

        if (perLine) {
          // Apply comment to each line
          const modifiedLines = lines.map((line, index) => {
            if (index >= startLine && index <= endLine) {
              return startComment + line + endComment;
            }
            return line;
          });
          newContent = modifiedLines.join('\n');
          addedLength = startComment.length + endComment.length;
        } else {
          // Apply comment only to first and last line (or both on same line)
          const modifiedLines = lines.map((line, index) => {
            if (index === startLine && index === endLine) {
              // Single line - add both start and end
              return startComment + line + endComment;
            } else if (index === startLine) {
              return startComment + line;
            } else if (index === endLine) {
              return line + endComment;
            }
            return line;
          });
          newContent = modifiedLines.join('\n');
          addedLength = startComment.length + endComment.length;
        }

        editor.textContent = newContent;

        state.files[state.currentFile] = newContent;
        saveState();

        const newRange = document.createRange();
        const textNode = editor.firstChild || document.createTextNode('');

        if (perLine || startLine === endLine) {
          newRange.setStart(textNode, startOffset + startComment.length);
          newRange.setEnd(textNode, endOffset + addedLength);
        } else {
          newRange.setStart(textNode, startOffset + startComment.length);
          newRange.setEnd(textNode, endOffset + addedLength);
        }

        selection.removeAllRanges();
        selection.addRange(newRange);

        updateAll();
      }
    }

    function handleTab(e) {
      e.preventDefault();
      const selection = window.getSelection();
      if (!selection.rangeCount) return;

      // Save current selection
      const range = selection.getRangeAt(0);
      const startOffset = range.startOffset;
      const endOffset = range.endOffset;

      const content = editor.innerText;
      const startLine = getLineNumber(range.startOffset);
      const endLine = getLineNumber(range.endOffset);

      // Modify lines
      const lines = content.split('\n');
      const tabSize = parseInt(localStorage.getItem('tabSize')) || 4;
      const indent = ' '.repeat(tabSize);

      const modifiedLines = lines.map((line, index) => {
        if (index >= startLine && index <= endLine) {
          return indent + line;
        }
        return line;
      });

      // Update content
      const newContent = modifiedLines.join('\n');
      editor.textContent = newContent;

      // Update state and save
      state.files[state.currentFile] = newContent;
      saveState();

      // Restore selection
      const newRange = document.createRange();
      const textNode = editor.firstChild || document.createTextNode('');
      newRange.setStart(textNode, startOffset + (startLine === endLine ? tabSize : 0));
      newRange.setEnd(textNode, endOffset + (endLine - startLine + 1) * tabSize);
      selection.removeAllRanges();
      selection.addRange(newRange);

      updateAll();
    }

    function handleKeyDown(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.execCommand('insertLineBreak', false, null);
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        handleTab(e);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    }

    function handleThemeChange(e) {
      const theme = e.target.dataset.theme;
      // Update document class
      document.documentElement.className = `theme-${theme}`;
      // Update selected state
      document.querySelectorAll('.theme-option').forEach(option => {
        option.classList.remove('selected');
      });
      e.target.classList.add('selected');
      // Save immediately
      localStorage.setItem('theme', theme);
      applySavedSettings();
    }

    function updateAll() {
      updateHighlighting();
      validateHTML();
      updateLineNumbers();
      updateCursorPosition();
      updateFileInfo();
    }

    function updateHighlighting() {
      const content = editor.innerText;
      highlighted.innerHTML = Prism.highlight(
        content,
        Prism.languages.html,
        'html'
      );
      highlighted.style.display = 'none';
      highlighted.offsetHeight;
      highlighted.style.display = 'block';
    }

    function updateLineNumbers() {
      const content = editor.innerText;
      const lines = content.split('\n');
      lineNumbers.innerHTML = lines.map((_, i) =>
        `<div>${i + 1}${state.errors.some(e => e.line === i + 1) ? '<span class="error-line">âš </span>' : ''}</div>`
      ).join('');
    }

    function updateCursorPosition() {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      const range = selection.getRangeAt(0);
      const offset = getTextOffset(range.startContainer, range.startOffset);
      const content = editor.textContent;
      const textUpToCursor = content.slice(0, offset);
      const lineNum = textUpToCursor.split('\n').length;
      const lineStart = textUpToCursor.lastIndexOf('\n') + 1;
      const colNum = offset - lineStart + 1;
      document.getElementById('cursor-position').textContent =
        `Ln ${lineNum}, Col ${colNum}`;
    }

    function getTextOffset(node, offset) {
      const range = document.createRange();
      range.setStart(editor, 0);
      range.setEnd(node, offset);
      return range.toString().length;
    }

    function openSettings() {
      document.getElementById('settings-modal').style.display = 'block';
      document.getElementById('settings-overlay').style.display = 'block';
      loadCurrentSettings();
    }

    function closeSettings() {
      document.getElementById('settings-modal').style.display = 'none';
      document.getElementById('settings-overlay').style.display = 'none';
      saveSettings();
    }

    function loadCurrentSettings() {
      document.getElementById('font-size').value =
        parseInt(getComputedStyle(document.documentElement)
          .getPropertyValue('--editor-font-size'));
      document.getElementById('font-size-value').textContent =
        document.getElementById('font-size').value + 'px';

      document.getElementById('line-height').value =
        parseFloat(getComputedStyle(document.documentElement)
          .getPropertyValue('--line-height'));
      document.getElementById('line-height-value').textContent =
        document.getElementById('line-height').value;

      document.getElementById('tab-size').value =
        parseInt(getComputedStyle(document.documentElement)
          .getPropertyValue('--tab-size'));

      document.getElementById('show-line-numbers').checked =
        localStorage.getItem('showLineNumbers') !== 'false';

      document.querySelectorAll('.theme-option').forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.theme === (localStorage.getItem('theme') || 'dark')) {
          option.classList.add('selected');
        }
      });
    }

    function saveSettings() {
      // Save theme
      const theme = document.querySelector('.theme-option.selected').dataset.theme;
      localStorage.setItem('theme', theme);

      // Save other settings
      localStorage.setItem('fontSize', document.getElementById('font-size').value);
      localStorage.setItem('lineHeight', document.getElementById('line-height').value);
      localStorage.setItem('tabSize', document.getElementById('tab-size').value);
      localStorage.setItem('showLineNumbers', document.getElementById('show-line-numbers').checked);

      // Apply changes immediately
      applySavedSettings();
      toast('Settings saved', 'success');
    }

    function applySavedSettings() {
      // 1. Apply theme first
      const savedTheme = localStorage.getItem('theme') || 'dark';
      document.documentElement.className = `theme-${savedTheme}`;

      // 2. Update theme selector UI
      document.querySelectorAll('.theme-option').forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.theme === savedTheme) {
          option.classList.add('selected');
        }
      });

      // 3. Font size
      const fontSize = localStorage.getItem('fontSize') || 14;
      document.documentElement.style.setProperty('--editor-font-size', `${fontSize}px`);
      editor.style.fontSize = `${fontSize}px`;
      highlighted.style.fontSize = `${fontSize}px`;

      // 4. Line height
      const lineHeight = localStorage.getItem('lineHeight') || 1.4;
      document.documentElement.style.setProperty('--line-height', lineHeight);
      editor.style.lineHeight = lineHeight;
      highlighted.style.lineHeight = lineHeight;

      // 5. Tab size
      const tabSize = localStorage.getItem('tabSize') || 4;
      document.documentElement.style.setProperty('--tab-size', tabSize);
      editor.style.tabSize = tabSize;
      highlighted.style.tabSize = tabSize;

      // 6. Line numbers visibility
      const showLineNumbers = localStorage.getItem('showLineNumbers') !== 'false';
      lineNumbers.style.display = showLineNumbers ? 'block' : 'none';

      // 7. Force redraw for syntax highlighting
      highlighted.style.display = 'none';
      highlighted.offsetHeight; // Trigger reflow
      highlighted.style.display = 'block';

      // 8. Update Prism theme
      const prismThemes = {
        'dark': 'prism-okaidia',
        'light': 'prism-solarizedlight',
        'solarized': 'prism-tomorrow'
      };

      const prismTheme = prismThemes[savedTheme] || 'prism-okaidia';

      const existingPrismTheme = document.querySelector('#prism-theme');
      if (existingPrismTheme) existingPrismTheme.remove();

      const link = document.createElement('link');
      link.id = 'prism-theme';
      link.rel = 'stylesheet';
      link.href = `https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/themes/${prismTheme}.min.css`;

      link.onload = () => updateHighlighting();
      link.onerror = () => {
        console.log('Failed to load Prism theme');
        updateHighlighting();
      };

      document.head.appendChild(link);
    }

    function validateHTML() {
      const content = editor.innerText;
      const errors = [];
      const stack = [];
      const tagRegex = /<\/?([\w-]+)/g;
      let match;
      const lines = content.split('\n');

      while ((match = tagRegex.exec(content)) !== null) {
        const tag = match[1].toLowerCase();
        const line = content.substr(0, match.index).split('\n').length;

        if (match[0].startsWith('</')) {
          if (stack.pop() !== tag) {
            errors.push({
              pos: match.index,
              message: `Mismatched closing tag: ${tag}`,
              line: line
            });
          }
        } else if (!isSelfClosing(tag)) {
          stack.push(tag);
        }
      }

      if (stack.length > 0) {
        errors.push({
          pos: content.length - 1,
          message: `Unclosed tags: ${stack.join(', ')}`,
          line: lines.length
        });
      }

      state.errors = errors;
      document.getElementById('error-count').textContent =
        errors.length ? `${errors.length} error(s)` : '';
    }

    async function exportFile(share = false) {
      const content = state.files[state.currentFile];
      let filename = state.currentFile || "untitled";
      if (!filename) return;
      if (!filename.endsWith(".html")) filename += ".html";

      const blob = new Blob([content], {
        type: "text/html"
      });
      if (share === false) {
        // 1️⃣ Try File System Access API first
        if ('showSaveFilePicker' in window) {
          try {
            const handle = await window.showSaveFilePicker({
              suggestedName: filename,
              types: [{
                description: "HTML Files",
                accept: {
                  "text/html": [".html"]
                },
              }, ],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            console.log("File saved using File System Access API.");
            toast('File saved', 'success');
            return;
          } catch (err) {
            console.warn("File System Access API failed:", err);
            toast('File System Access API failed', 'error');
            return;
            // Continue to next fallback
          }
        } else {
          console.warn("File System Access API not supported.");
          toast('File System Access API not supported', 'error');
        }

        // 2️⃣ Fallback to regular download
        try {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          console.log("File saved via regular download fallback.");
          toast('File saved', 'success');
          return;
        } catch (err) {
          console.warn("Regular download fallback failed:", err);
          toast('Regular download failed', 'error');
        }
      }
      // 3️⃣ Final fallback: Web Share API
      try {
        const file = new File([blob], filename, {
          type: "text/html"
        });
        if (navigator.canShare && navigator.canShare({
            files: [file]
          })) {
          await navigator.share({
            files: [file],
            title: filename
          });
          console.log("File shared successfully via Web Share API.");
          toast('File shared', 'success');
          return;
        } else {
          throw new Error("Web Share API not supported or cannot share files.");
          toast('Web Share API not supported', 'error');
        }
      } catch (err) {
        console.error("Unable to save or share the file on this device.", err);
        toast('Unable to share', 'error');
      }
    }

    function createNewFile(fileName = null) {
      if (fileName) {
        fileName = prompt("Enter a name for your new file (canceling will replace current file):", fileName);
      } else {
        fileName = prompt("Enter a name for your new file:", `file${Object.keys(state.files).length + 1}.html`);
      }
      if (!fileName) {
        // User cancelled or left it blank
        return;
      }

      // Add .html if not already present
      if (!fileName.toLowerCase().endsWith(".html")) {
        fileName += ".html";
      }

      // Prevent overwriting existing files
      if (state.files[fileName]) {
        toast("A file with that name already exists. Please choose a different name.", 'warning');
        return;
      }

      state.files[fileName] = initialContent;
      state.undoStack[fileName] = [initialContent];
      state.redoStack[fileName] = [];
      copyFromFile(fileName);
      toast(`${fileName} created`, 'success');
      updateFileTree();
    }

    async function handleFileUpload(e) {
      const file = e.target.files[0];
      if (!file) return;

      const content = await file.text();
      state.files[file.name] = content;
      state.undoStack[file.name] = [content];
      state.redoStack[file.name] = [];
      copyFromFile(file.name);
      toast(`${file.name} uploaded`, 'success');
      updateFileTree();
      fileInput.value = '';
    }

    function copyFromFile(fileName) {
      // Ask the user for a file name, using the provided one as a default
      let curFile = fileName;

      // If the user cancels or leaves it blank, stop the function
      if (!curFile) return;

      // If the user changed the name, rename the file in state
      if (curFile !== fileName) {
        // If the new name already exists, warn and stop
        if (state.files[curFile]) {
          alert("A file with that name already exists.");
          return;
        }

        // Rename: copy content and delete old entry
        state.files[curFile] = state.files[fileName];
        delete state.files[fileName];

        // Also rename undo/redo stacks if they exist
        if (state.undoStack[fileName]) {
          state.undoStack[curFile] = state.undoStack[fileName];
          delete state.undoStack[fileName];
        }
        if (state.redoStack[fileName]) {
          state.redoStack[curFile] = state.redoStack[fileName];
          delete state.redoStack[fileName];
        }
      }

      // Set the current file and update the editor
      state.currentFile = curFile;
      editor.textContent = state.files[curFile];

      // Update UI and focus the editor
      updateAll();
      updateFileTree();
      editor.focus();
    }

    async function openLiveFile() {
      if (!('showOpenFilePicker' in window)) {
        toast('File System Access API not supported', 'error');
        return;
      }

      try {
        const [handle] = await window.showOpenFilePicker({
          types: [{
            description: 'HTML Files',
            accept: {
              'text/html': ['.html']
            }
          }],
          multiple: false
        });

        const file = await handle.getFile();
        const content = await file.text();

        // Store the file handle on the filename for later access
        if (!state.fileHandles) state.fileHandles = {};
        state.fileHandles[handle.name] = handle;

        // Store original content for change detection
        if (!state.originalContent) state.originalContent = {};
        state.originalContent[handle.name] = content;

        // Integrate with existing state
        state.files[handle.name] = content;
        state.undoStack[handle.name] = [content];
        state.redoStack[handle.name] = [];
        copyFromFile(handle.name);

        toast(`${handle.name} opened for live editing`, 'success');
        updateFileTree();

      } catch (err) {
        if (err.name !== 'AbortError') {
          toast(`Error opening file: ${err}`, 'error');
          toast('Failed to open file', 'error');
        }
      }
    }

    async function saveLiveFile() {
      const filename = state.currentFile;
      if (!filename) {
        toast('No file selected', 'warning');
        return;
      }

      const content = state.files[filename];

      // Check if this file has a live handle
      if (state.fileHandles && state.fileHandles[filename]) {
        try {
          const handle = state.fileHandles[filename];
          const writable = await handle.createWritable();
          await writable.write(content);
          await writable.close();

          // Update original content tracking
          if (state.originalContent) {
            state.originalContent[filename] = content;
          }

          toast('File saved', 'success');
          return;
        } catch (err) {
          console.error('Error saving file:', err);
          toast('Failed to save file', 'error');
          return;
        }
      }

      // No handle? Fall back to regular export
      await exportFile(false);
    }

    function hasUnsavedChanges() {
      const filename = state.currentFile;
      if (!filename || !state.originalContent || !state.originalContent[filename]) {
        return false;
      }

      return state.files[filename] !== state.originalContent[filename];
    }

    function revertToSaved() {
      const filename = state.currentFile;
      if (!filename || !state.originalContent || !state.originalContent[filename]) {
        toast('No saved version to revert to', 'warning');
        return;
      }

      state.files[filename] = state.originalContent[filename];
      editor.textContent = state.originalContent[filename];
      updateAll();
      toast('Reverted to saved version', 'success');
    }

    function isLiveFile() {
      const filename = state.currentFile;
      return !!(state.fileHandles && state.fileHandles[filename]);
    }

    function updateFileTree() {
      fileTree.innerHTML = Object.keys(state.files)
        .map(name => `
                    <div class="file-item ${name === state.currentFile ? 'active' : ''}"
                         onclick="copyFromFile('${name}');">
                        <i class="fas fa-file-code"></i>
                        ${name}
                    </div>
                `).join('');
    }

    function restoreBackup() {
      let codeBackup = localStorage.getItem('codeBackup');
      if (!codeBackup || typeof codeBackup !== 'string' || !codeBackup.trim()) {
        toast('No backup found. Preview page to save', 'info');
        return;
      }

      // Extract title from the backup HTML
      const titleMatch = codeBackup.match(/<title>(.*?)<\/title>/i);
      let pageTitle = titleMatch ? titleMatch[1].trim() : 'Restored Page';
      pageTitle += '.html';

      // Create a new file with the extracted title
      createNewFile(pageTitle);

      // Display the backed-up HTML in the editor
      displayHTML(codeBackup);

      // Update the editor state
      toast(`Restored ${codeBackup.length} characters from backup`, 'success');
      updateAll();
    }
    (function() {
      const sr_searchBar = document.getElementById('searchBar');
      const sr_searchBtn = document.getElementById('search-btn');
      const sr_searchClose = document.getElementById('searchClose');
      const sr_searchInput = document.getElementById('searchInput');
      const sr_replaceInput = document.getElementById('replaceInput');
      const sr_toggleReplace = document.getElementById('toggleReplace');
      const sr_replaceRow = document.getElementById('replaceRow');
      const sr_caseSensitive = document.getElementById('caseSensitive');
      const sr_wholeWord = document.getElementById('wholeWord');
      const sr_useRegex = document.getElementById('useRegex');
      const sr_matchCount = document.getElementById('matchCount');
      const sr_prevMatchBtn = document.getElementById('prevMatch');
      const sr_nextMatchBtn = document.getElementById('nextMatch');
      const sr_replaceOneBtn = document.getElementById('replaceOne');
      const sr_replaceAllBtn = document.getElementById('replaceAll');

      let sr_matches = [];
      let sr_currentMatchIndex = -1;
      let sr_originalContent = '';
      let sr_searchTimeout = null;

      // Open search bar
      sr_searchBtn.addEventListener('click', () => {
        updateAll();
        sr_searchBar.style.display = 'block';
        sr_searchInput.focus();
        sr_performSearch();
      });

      // Close search bar
      sr_searchClose.addEventListener('click', () => {
        updateAll();
        sr_searchBar.style.display = 'none';
        sr_clearHighlights();
      });

      // Toggle replace row
      sr_toggleReplace.addEventListener('click', () => {
        updateAll();
        if (sr_replaceRow.style.display === 'none') {
          sr_replaceRow.style.display = 'flex';
          sr_toggleReplace.innerHTML = '<i class="fas fa-chevron-up"></i>';
        } else {
          sr_replaceRow.style.display = 'none';
          sr_toggleReplace.innerHTML = '<i class="fas fa-chevron-down"></i>';
        }
      });

      // Toggle search options
      sr_caseSensitive.addEventListener('click', () => {
        updateAll();
        sr_caseSensitive.classList.toggle('active');
        sr_performSearch();
      });

      sr_wholeWord.addEventListener('click', () => {
        updateAll();
        sr_wholeWord.classList.toggle('active');
        sr_performSearch();
      });

      sr_useRegex.addEventListener('click', () => {
        updateAll();
        sr_useRegex.classList.toggle('active');
        sr_performSearch();
      });

      // Search on input
      sr_searchInput.addEventListener('input', () => {
        // Debounce: wait 150ms after user stops typing
        clearTimeout(sr_searchTimeout);
        sr_searchTimeout = setTimeout(sr_performSearch, 50);
      });

      function sr_performSearch() {
        const sr_editor = document.getElementById('editor');
        const sr_searchTerm = sr_searchInput.value;

        sr_clearHighlights();
        sr_matches = [];
        sr_currentMatchIndex = -1;

        if (!sr_searchTerm) {
          sr_matchCount.textContent = '0 of 0';
          return;
        }

        try {
          const sr_content = sr_editor.textContent;
          let sr_pattern;

          if (sr_useRegex.classList.contains('active')) {
            const sr_flags = sr_caseSensitive.classList.contains('active') ? 'g' : 'gi';
            sr_pattern = new RegExp(sr_searchTerm, sr_flags);
          } else {
            let sr_escapedTerm = sr_searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            if (sr_wholeWord.classList.contains('active')) {
              sr_escapedTerm = '\\b' + sr_escapedTerm + '\\b';
            }
            const sr_flags = sr_caseSensitive.classList.contains('active') ? 'g' : 'gi';
            sr_pattern = new RegExp(sr_escapedTerm, sr_flags);
          }

          let sr_match;
          while ((sr_match = sr_pattern.exec(sr_content)) !== null) {
            sr_matches.push({
              index: sr_match.index,
              length: sr_match[0].length,
              text: sr_match[0]
            });
          }

          sr_matchCount.textContent = sr_matches.length > 0 ? `${sr_matches.length}` : 'No results';

          if (sr_matches.length > 0) {
            sr_currentMatchIndex = 0;
            sr_highlightMatches();
          }
        } catch (e) {
          sr_matchCount.textContent = 'Invalid';
        }
      }

      function sr_clearHighlights() {
        updateAll();
        const sr_editor = document.getElementById('editor');
        const sr_highlighted = document.getElementById('highlighted');

        // Don't clear if there's no search - preserve syntax highlighting
        if (!sr_searchInput.value && sr_highlighted && sr_editor) {
          return;
        }

        // Only add highlights, don't replace content
        if (sr_highlighted) {
          const sr_spans = sr_highlighted.querySelectorAll('.search-highlight, .search-highlight-current');
          sr_spans.forEach(sr_span => {
            const sr_text = document.createTextNode(sr_span.textContent);
            sr_span.parentNode.replaceChild(sr_text, sr_span);
          });
        }
      }

      function sr_highlightMatches() {
        if (sr_matches.length === 0) return;

        const sr_editor = document.getElementById('editor');
        const sr_highlighted = document.getElementById('highlighted');
        const sr_content = sr_editor.textContent;

        // Performance optimization: only highlight visible matches (limit to 500)
        const MAX_HIGHLIGHTS = 500;
        const sr_matchesToHighlight = sr_matches.length > MAX_HIGHLIGHTS ?
          sr_matches.slice(0, MAX_HIGHLIGHTS) :
          sr_matches;

        // Store positions to inject highlights
        let sr_injections = [];
        sr_matchesToHighlight.forEach((sr_match, sr_idx) => {
          sr_injections.push({
            index: sr_match.index,
            length: sr_match.length,
            isCurrent: sr_idx === sr_currentMatchIndex
          });
        });

        // Build highlighted HTML by injecting spans
        let sr_result = '';
        let sr_lastIndex = 0;

        sr_injections.forEach(sr_inj => {
          sr_result += sr_escapeHtml(sr_content.substring(sr_lastIndex, sr_inj.index));
          const sr_className = sr_inj.isCurrent ? 'search-highlight-current' : 'search-highlight';
          sr_result += `<span class="${sr_className}">${sr_escapeHtml(sr_content.substring(sr_inj.index, sr_inj.index + sr_inj.length))}</span>`;
          sr_lastIndex = sr_inj.index + sr_inj.length;
        });

        sr_result += sr_escapeHtml(sr_content.substring(sr_lastIndex));

        // Preserve existing syntax highlighting by only replacing text nodes
        sr_highlighted.innerHTML = sr_result;

        sr_matchCount.textContent = `${sr_currentMatchIndex + 1}/${sr_matches.length}`;
        if (sr_matches.length > MAX_HIGHLIGHTS) {
          sr_matchCount.textContent += ` (showing ${MAX_HIGHLIGHTS})`;
        }

        // Scroll to current match
        sr_scrollToMatch();
      }

      function sr_scrollToMatch() {
        const sr_highlighted = document.getElementById('highlighted');
        const sr_currentHighlight = sr_highlighted.querySelector('.search-highlight-current');
        if (sr_currentHighlight) {
          sr_currentHighlight.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }

      function sr_escapeHtml(sr_text) {
        updateAll();
        const sr_div = document.createElement('div');
        sr_div.textContent = sr_text;
        return sr_div.innerHTML;
      }

      // Navigation
      sr_prevMatchBtn.addEventListener('click', () => {
        updateAll();
        if (sr_matches.length === 0) return;
        sr_currentMatchIndex = (sr_currentMatchIndex - 1 + sr_matches.length) % sr_matches.length;
        sr_highlightMatches();
      });

      sr_nextMatchBtn.addEventListener('click', () => {
        updateAll();
        if (sr_matches.length === 0) return;
        sr_currentMatchIndex = (sr_currentMatchIndex + 1) % sr_matches.length;
        sr_highlightMatches();
      });

      // Replace
      sr_replaceOneBtn.addEventListener('click', () => {
        updateAll();
        if (sr_matches.length === 0 || sr_currentMatchIndex === -1) return;

        const sr_editor = document.getElementById('editor');
        const sr_content = sr_editor.textContent;
        const sr_match = sr_matches[sr_currentMatchIndex];
        const sr_replaceText = sr_replaceInput.value;

        const sr_newContent = sr_content.substring(0, sr_match.index) + sr_replaceText + sr_content.substring(sr_match.index + sr_match.length);

        // Update state.files FIRST (so saveState can see the old value)
        if (typeof state !== 'undefined' && state.files && state.currentFile) {
          // Save the OLD state before changing
          if (typeof saveState === 'function') saveState();

          // Now update to NEW content
          state.files[state.currentFile] = sr_newContent;
          sr_editor.textContent = sr_newContent;

          // Call updateAll to trigger the undo system
          if (typeof updateAll === 'function') updateAll();
        } else {
          // Fallback if state doesn't exist
          sr_editor.textContent = sr_newContent;
          if (typeof syncScroll === 'function') syncScroll();
        }

        sr_performSearch();
      });

      sr_replaceAllBtn.addEventListener('click', () => {
        updateAll();
        if (sr_matches.length === 0) return;

        const sr_editor = document.getElementById('editor');
        const sr_content = sr_editor.textContent;
        const sr_replaceText = sr_replaceInput.value;

        // Replace from end to start to maintain indices
        let sr_newContent = sr_content;
        for (let sr_i = sr_matches.length - 1; sr_i >= 0; sr_i--) {
          const sr_match = sr_matches[sr_i];
          sr_newContent = sr_newContent.substring(0, sr_match.index) + sr_replaceText + sr_newContent.substring(sr_match.index + sr_match.length);
        }

        // Update state.files FIRST (so saveState can see the old value)
        if (typeof state !== 'undefined' && state.files && state.currentFile) {
          // Save the OLD state before changing
          if (typeof saveState === 'function') saveState();

          // Now update to NEW content
          state.files[state.currentFile] = sr_newContent;
          sr_editor.textContent = sr_newContent;

          // Call updateAll to trigger the undo system
          if (typeof updateAll === 'function') updateAll();
        } else {
          // Fallback if state doesn't exist
          sr_editor.textContent = sr_newContent;
          if (typeof syncScroll === 'function') syncScroll();
        }

        sr_performSearch();
      });

      // Keyboard shortcuts
      sr_searchInput.addEventListener('keydown', (sr_e) => {
        updateAll();
        if (sr_e.key === 'Enter') {
          sr_e.preventDefault();
          if (sr_e.shiftKey) {
            sr_prevMatchBtn.click();
          } else {
            sr_nextMatchBtn.click();
          }
        }
        if (sr_e.key === 'Escape') {
          sr_searchClose.click();
        }
      });

      sr_replaceInput.addEventListener('keydown', (sr_e) => {
        updateAll();
        if (sr_e.key === 'Enter') {
          sr_e.preventDefault();
          if (sr_e.shiftKey) {
            sr_replaceAllBtn.click();
          } else {
            sr_replaceOneBtn.click();
          }
        }
      });

      // Global keyboard shortcut: Ctrl+F (or Cmd+F on Mac)
      document.addEventListener('keydown', (sr_e) => {
        updateAll();
        if ((sr_e.ctrlKey || sr_e.metaKey) && sr_e.key === 'f') {
          sr_e.preventDefault();
          sr_searchBar.style.display = 'block';
          sr_searchInput.focus();
          sr_searchInput.select(); // Select any existing text
          sr_performSearch();
        }
      });
    })();

    function updateFileInfo() {
      const maxChars = 10;
      const fileInfoElement = document.getElementById('file-info');
      const fileName = state?.currentFile || 'Untitled.html';

      // Extract name and extension
      const dotIndex = fileName.lastIndexOf('.');
      const namePart = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
      const extension = dotIndex > 0 ? fileName.slice(dotIndex) : '';

      // Truncate intelligently
      const truncatedName = namePart.length > maxChars ?
        namePart.slice(0, maxChars - 3) + '...' :
        namePart;

      fileInfoElement.textContent = truncatedName + extension;
    }

    function toggleSidebar() {
      const sidebar = document.getElementById('sidebar');
      sidebar.classList.toggle('active');

      // Handle backdrop
      const backdrop = document.querySelector('.sidebar-backdrop');
      if (sidebar.classList.contains('active') && !backdrop) {
        const newBackdrop = document.createElement('div');
        newBackdrop.className = 'sidebar-backdrop';
        newBackdrop.onclick = toggleSidebar;
        document.body.appendChild(newBackdrop);
      } else if (backdrop) {
        backdrop.remove();
      }
    }

    function closeSidebarOnOutsideClick(e) {
      const sidebar = document.getElementById('sidebar');
      if (sidebar.classList.contains('active') &&
        !e.target.closest('.sidebar') &&
        !e.target.closest('#menu-btn')) {
        sidebar.classList.remove('active');
      }
    }

    function openPreview() {
      const editorContent = editor.innerText;
      localStorage.setItem('codeBackup', editorContent);

      // Add debug console
      const extraCode = `
                <div id="console" style="position:fixed;top:0;left:0;width:100%;height:200px;background:#000;color:#0f0;font-family:monospace;font-size:12px;overflow-y:scroll;z-index:9999;padding:10px;border-top:2px solid #333;"><div style="position:absolute;top:5px;right:10px;"><button onclick="document.getElementById('console').style.display='none';if(!document.getElementById('showConsole')){let btn=document.createElement('button');btn.id='showConsole';btn.innerHTML='CONSOLE';btn.onclick=function(){document.getElementById('console').style.display='block';this.remove();};btn.style.cssText='position:fixed;bottom:10px;right:10px;background:#333;color:#0f0;border:1px solid #0f0;padding:5px 10px;font-size:10px;cursor:pointer;z-index:10000;border-radius:3px;';document.body.appendChild(btn);}" style="background:#333;color:#0f0;border:1px solid #0f0;padding:2px 8px;font-size:10px;cursor:pointer;">HIDE</button> <button onclick="document.getElementById('consoleOutput').innerHTML='';window.consoleHistory=[];window.historyIndex=-1;" style="background:#333;color:#0f0;border:1px solid #0f0;padding:2px 8px;font-size:10px;cursor:pointer;">CLEAR</button> <button onclick="toggleConsolePosition()" style="background:#333;color:#0f0;border:1px solid #0f0;padding:2px 8px;font-size:10px;cursor:pointer;">TOGGLE</button></div><div id="consoleOutput" style="margin-top:25px;height:120px;overflow-y:scroll;"></div><div style="position:absolute;bottom:5px;left:10px;right:10px;display:flex;gap:2px;"><button onclick="let h=window.consoleHistory||[];let i=window.historyIndex||0;if(i<h.length-1){window.historyIndex=++i;document.getElementById('jsInput').value=h[h.length-1-i]||'';}" style="background:#333;color:#0f0;border:1px solid #0f0;padding:5px;font-size:10px;width:25px;">↑</button><input id="jsInput" placeholder="Enter JavaScript..." style="flex:1;background:#111;color:#0f0;border:1px solid #333;padding:5px;font-family:monospace;font-size:12px;" onkeypress="if(event.key==='Enter'){let cmd=this.value;if(cmd.trim()){window.consoleHistory=window.consoleHistory||[];window.consoleHistory.push(cmd);window.historyIndex=-1;}try{console.log('> '+cmd);let result=eval(cmd);if(result!==undefined){if(typeof result==='object'){console.log(JSON.stringify(result,null,2));}else{console.log(result);}}this.value='';}catch(e){console.log('ERROR: '+e.message);this.value='';}}"><button onclick="let h=window.consoleHistory||[];let i=window.historyIndex||0;if(i>-1){window.historyIndex=--i;document.getElementById('jsInput').value=h[h.length-1-i]||'';}" style="background:#333;color:#0f0;border:1px solid #0f0;padding:5px;font-size:10px;width:25px;">↓</button><button onclick="let input=document.getElementById('jsInput');let cmd=input.value;if(cmd.trim()){window.consoleHistory=window.consoleHistory||[];window.consoleHistory.push(cmd);window.historyIndex=-1;}try{console.log('> '+cmd);let result=eval(cmd);if(result!==undefined){if(typeof result==='object'){console.log(JSON.stringify(result,null,2));}else{console.log(result);}}input.value='';}catch(e){console.log('ERROR: '+e.message);input.value='';}" style="background:#333;color:#0f0;border:1px solid #0f0;padding:5px;font-size:10px;width:30px;">RUN</button></div></div><script>window.onerror=function(msg, url, line, col, error) {const consoleOutput=document.getElementById('consoleOutput');consoleOutput.innerHTML +='<span style="color:#f44">ERROR: ' + msg + ' (Line ' + line + ')</span><br>';consoleOutput.scrollTop=consoleOutput.scrollHeight;};function safeInspect(value, depth=0, seen=new WeakSet()) {if (value===null) return 'null';if (value===undefined) return 'undefined';if (typeof value==='function') return 'function ' + (value.name || '(anonymous)') + '()';if (typeof value !=='object') return JSON.stringify(value);if (seen.has(value)) return '[Circular]';seen.add(value);if (depth > 2) return '[Object]';const entries=Object.entries(value).slice(0, 20).map(([k, v])=> ` + '`' + '${k}: ${safeInspect(v, depth + 1, seen)}' + '`' + `).join(', ');return ` + '`' + '{ ${entries} }' + '`' + `;}console.log=function(...args) {const output=args.map(arg=> {try {return '<pre style="display:inline;color:#0f0;">' + safeInspect(arg) + '</pre>';} catch (err) {return '<span style="color:#f44;">[Unserializable: ' + err.message + ']</span>';}}).join(' ');const timestamp=new Date().toLocaleTimeString();const consoleOutput=document.getElementById('consoleOutput');consoleOutput.innerHTML +=` + '`' + '<span style="color:#666">[${timestamp}]</span> ${output}<br>' + '`' + ';consoleOutput.scrollTop=consoleOutput.scrollHeight;};window.consoleHistory=[];window.historyIndex=-1;function toggleConsolePosition() {const consoleEl=document.getElementById("console");if (consoleEl.style.top==="0px") {consoleEl.style.top="auto";consoleEl.style.bottom="0";} else {consoleEl.style.top="0" ;consoleEl.style.bottom="auto";}}' + `<\/script>
            `
      const modifiedContent = editorContent.replace(
        /<body([^>]*)>/i,
        `<body$1>${extraCode}`
      );
      const newTab = window.open('about:blank', '_blank');
      newTab.document.open();
      newTab.document.write(modifiedContent);
      newTab.document.close();
      toast('Code previewed in debug mode', 'success');
    }

    function saveState() {
      const currentContent = state.files[state.currentFile];
      const undoStack = state.undoStack[state.currentFile];
      if (undoStack[undoStack.length - 1] !== currentContent) {
        undoStack.push(currentContent);
        state.redoStack[state.currentFile] = [];
      }
    }

    function undo() {
      if (state.undoStack[state.currentFile].length > 1) {
        state.redoStack[state.currentFile].push(
          state.undoStack[state.currentFile].pop()
        );
        state.files[state.currentFile] = state.undoStack[state.currentFile].slice(-1)[0];
        editor.textContent = state.files[state.currentFile];
        updateAll();
      }
    }

    function redo() {
      if (state.redoStack[state.currentFile].length > 0) {
        state.files[state.currentFile] = state.redoStack[state.currentFile].pop();
        state.undoStack[state.currentFile].push(state.files[state.currentFile]);
        editor.textContent = state.files[state.currentFile];
        updateAll();
      }
    }

    function isSelfClosing(tag) {
      const selfClosing = ['img', 'br', 'hr', 'meta', 'link', 'input'];
      return selfClosing.includes(tag.toLowerCase());
    }

    init();

    (() => {
      const ENTRY = 'JavaScript Text Editer v3',
        KEY = 'Ion-o-koji Watermark';
      const logs = (localStorage.getItem(KEY) || "").split('\n').map(line => line.replace(/^- /, '').trim()).filter(line => line && line !== ENTRY);
      logs.push(ENTRY);
      localStorage.setItem(KEY, logs.map(item => `- ${item}`).join('\n'));
    })();

  
