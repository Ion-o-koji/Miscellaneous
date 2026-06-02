
    const urlInput = document.getElementById('urlInput');
    const resultContainer = document.getElementById('resultContainer');

    // Automatically process as user types or pastes
    urlInput.addEventListener('input', processInput);

    function processInput() {
      const inputVal = urlInput.value.trim();

      if (!inputVal) {
        resultContainer.classList.add('hidden');
        return;
      }

      const results = [];

      // Try all conversions
      // 1. URL Decode
      const decoded = tryDecode(inputVal);
      if (decoded && decoded !== inputVal) {
        results.push({
          type: 'URL Decoded',
          value: decoded
        });
      }

      // 2. Facebook conversions
      const facebookConverted = tryFacebookConvert(inputVal);
      if (facebookConverted) {
        results.push(...facebookConverted);
      }

      // Display results
      if (results.length > 0) {
        displayResults(results);
      } else {
        displayError("Can't decode or convert this");
      }
    }

    function tryDecode(inputVal) {
      try {
        // Check if it's a Facebook redirect with 'u' parameter
        if ((inputVal.startsWith('http://') || inputVal.startsWith('https://')) && inputVal.includes('facebook.com')) {
          try {
            const url = new URL(inputVal);
            if (url.searchParams.has('u')) {
              return decodeURIComponent(url.searchParams.get('u'));
            }
          } catch (e) {}
        }

        // Try general URL decode
        const decoded = decodeURIComponent(inputVal);
        // Only return if it actually changed
        if (decoded !== inputVal && !decoded.includes('%')) {
          return decoded;
        }
      } catch (e) {}

      return null;
    }

    function tryFacebookConvert(inputVal) {
      const conversions = [];

      // Only convert m.facebook.com to m.me if it matches the specific pattern
      if (inputVal.match(/^https?:\/\/m\.facebook\.com\/\d+/) || inputVal.match(/^https?:\/\/m\.facebook\.com\/[a-zA-Z0-9.]+$/)) {
        const converted = inputVal.replace(/m\.facebook\.com/g, 'm.me');
        conversions.push({
          type: 'Facebook → Messenger',
          value: converted
        });
      }
      // Convert facebook.com/USERNAME or facebook.com/ID to m.me/USERNAME or m.me/ID (at end of URL only)
      else if (inputVal.match(/^https?:\/\/facebook\.com\/[a-zA-Z0-9.]+\/?$/)) {
        const match = inputVal.match(/facebook\.com\/([a-zA-Z0-9.]+)\/?$/);
        if (match) {
          const username = match[1];
          const converted = inputVal.replace(/facebook\.com\/[a-zA-Z0-9.]+\/?$/, `m.me/${username}`);
          conversions.push({
            type: 'Facebook → Messenger',
            value: converted
          });
        }
      }

      return conversions.length > 0 ? conversions : null;
    }

    function displayResults(results) {
      resultContainer.innerHTML = '';
      resultContainer.classList.remove('hidden');

      results.forEach((result, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';

        resultItem.innerHTML = `
          <div class="result-label">${result.type}:</div>
          <div class="output-box">
            <a href="${result.value}" target="_blank" rel="noopener noreferrer" class="output-text">${result.value}</a>
          </div>
          <div class="result-actions">
            <button class="btn-secondary copy-btn" data-text="${result.value}">Copy</button>
            <span class="feedback"></span>
          </div>
        `;

        resultContainer.appendChild(resultItem);
      });

      // Attach copy button listeners
      document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          copyToClipboard(this.dataset.text, this);
        });
      });
    }

    function displayError(message) {
      resultContainer.innerHTML = `<div class="error-message">${message}</div>`;
      resultContainer.classList.remove('hidden');
    }

    function copyToClipboard(textToCopy, button) {
      const feedback = button.nextElementSibling;

      navigator.clipboard.writeText(textToCopy).then(() => {
        button.textContent = 'Copied';
        feedback.classList.add('show');
        setTimeout(() => {
          button.textContent = 'Copy';
          feedback.classList.remove('show');
        }, 1200);
      }).catch(e => {
        // Fallback for older browsers
        const ta = document.createElement('textarea');
        ta.value = textToCopy;
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand('copy');
          button.textContent = 'Copied';
          feedback.classList.add('show');
          setTimeout(() => {
            button.textContent = 'Copy';
            feedback.classList.remove('show');
          }, 1200);
        } catch (e2) {
          alert('Copy failed');
        }
        ta.remove();
      });
    }

    function clearInput() {
      urlInput.value = '';
      resultContainer.classList.add('hidden');
      urlInput.focus();
    }

    (() => {
      const ENTRY = 'URL Decoder & Converter v2',
        KEY = 'Ion-o-koji Watermark';
      const logs = (localStorage.getItem(KEY) || "").split('\n').map(line => line.replace(/^- /, '').trim()).filter(line => line && line !== ENTRY);
      logs.push(ENTRY);
      localStorage.setItem(KEY, logs.map(item => `- ${item}`).join('\n'));
    })();

  
