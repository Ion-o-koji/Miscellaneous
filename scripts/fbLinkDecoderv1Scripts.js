
    const urlInput = document.getElementById('urlInput');
    const resultContainer = document.getElementById('resultContainer');
    const decodedLinkEl = document.getElementById('decodedLink');
    const copyFeedback = document.getElementById('copyFeedback');

    // Automatically decode as user types or pastes
    urlInput.addEventListener('input', decodeLink);

    function decodeLink() {
      const inputVal = urlInput.value.trim();

      if (!inputVal) {
        resultContainer.classList.add('hidden');
        return;
      }

      try {
        let decodedUrl = '';

        // Check if it's a valid URL structure
        if (inputVal.startsWith('http://') || inputVal.startsWith('https://')) {
          const url = new URL(inputVal);

          // Extract 'u' parameter if it's a Facebook redirect
          if (url.hostname.includes('facebook.com') && url.searchParams.has('u')) {
            decodedUrl = decodeURIComponent(url.searchParams.get('u'));
          } else {
            decodedUrl = decodeURIComponent(inputVal);
          }
        } else {
          // Fallback for partial links or raw encoded strings
          decodedUrl = decodeURIComponent(inputVal);
        }

        if (decodedUrl) {
          decodedLinkEl.href = decodedUrl;
          decodedLinkEl.textContent = decodedUrl;
          resultContainer.classList.remove('hidden');
        }
      } catch (e) {
        // Fallback in case URL parsing fails
        try {
          const decodedUrl = decodeURIComponent(inputVal);
          decodedLinkEl.href = decodedUrl;
          decodedLinkEl.textContent = decodedUrl;
          resultContainer.classList.remove('hidden');
        } catch (err) {
          resultContainer.classList.add('hidden');
        }
      }
    }

    /*        function copyToClipboard() {
                const text = decodedLinkEl.textContent;
                navigator.clipboard.writeText(text).then(() => {
                    copyFeedback.classList.add('show');
                    setTimeout(() => {
                        copyFeedback.classList.remove('show');
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                });
            }
    */
    function clearInput() {
      urlInput.value = '';
      resultContainer.classList.add('hidden');
      urlInput.focus();
    }

    (() => {
      const ENTRY = 'Facebook Link Decoder v1',
        KEY = 'Ion-o-koji Watermark';
      const logs = (localStorage.getItem(KEY) || "").split('\n').map(line => line.replace(/^- /, '').trim()).filter(line => line && line !== ENTRY);
      logs.push(ENTRY);
      localStorage.setItem(KEY, logs.map(item => `- ${item}`).join('\n'));
    })();

  
