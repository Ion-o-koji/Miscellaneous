
    // ── Config ──────────────────────────────────────────────────────────
    // Points to the Replit backend that follows Apple Maps redirects server-side.
    // Replit Email is Mission email +9
    // Public CORS proxies cannot handle the maps.apple domain.
    const APPLE_API = "https://map-converter--hijjguuj.replit.app/api/convert";

    // ── DOM refs ─────────────────────────────────────────────────────────
    const urlInput = document.getElementById("urlInput");
    const resultContainer = document.getElementById("resultContainer");

    // ── Debounced input listener ─────────────────────────────────────────
    let debounceTimer = null;
    urlInput.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      // Short debounce so we don't fire API on every keystroke
      debounceTimer = setTimeout(processInput, 350);
    });

    // ── Main processor ───────────────────────────────────────────────────
    async function processInput() {
      const raw = urlInput.value.trim();
      if (!raw) {
        resultContainer.classList.add("hidden");
        return;
      }

      const results = [];

      // 1. Extract the "real" URL — unwrap Facebook redirects first
      let innerUrl = raw;
      let wasFacebookRedirect = false;

      if (raw.includes("facebook.com") || raw.includes("fb.com")) {
        const extracted = extractFromFacebook(raw);
        if (extracted && extracted !== raw) {
          wasFacebookRedirect = true;
          innerUrl = extracted;
          results.push({
            type: "Facebook Decoded",
            badge: "fb",
            value: innerUrl
          });
        }
      }

      // 2. Is the inner URL (or raw URL) an Apple Maps link?
      if (isAppleMapsUrl(innerUrl)) {
        // Show loading state while we hit the backend
        showLoading(wasFacebookRedirect ? "Converting Apple Maps link to Google Maps\u2026" : "Resolving Apple Maps link\u2026");
        const mapsResult = await callAppleApi(innerUrl);
        if (mapsResult && mapsResult.googleUrl) {
          if (mapsResult.lat && mapsResult.lng) {
            results.push({
              type: "Google Maps",
              badge: "google",
              value: mapsResult.googleUrl,
              meta: mapsResult.lat + ", " + mapsResult.lng + (mapsResult.name ? " \u2014 " + mapsResult.name : ""),
              isLink: true
            });
          } else {
            results.push({
              type: "Google Maps",
              badge: "google",
              value: mapsResult.googleUrl,
              isLink: true
            });
          }
        } else {
          results.push({
            type: "Apple Maps Error",
            badge: "apple",
            value: mapsResult ? (mapsResult.error || "Could not resolve link.") : "Request failed.",
            isError: true
          });
        }
        if (results.length > 0) {
          displayResults(results);
          return;
        }
      }

      // 3. Non-Apple-Maps paths — run existing conversions
      if (!wasFacebookRedirect) {
        // General URL decode (non-Facebook)
        const decoded = tryGeneralDecode(raw);
        if (decoded && decoded !== raw) {
          results.push({
            type: "URL Decoded",
            value: decoded
          });
        }

        // Facebook profile → m.me
        const fbConverted = tryFacebookProfileConvert(raw);
        if (fbConverted) results.push(...fbConverted);
      }

      if (results.length > 0) {
        displayResults(results);
      } else {
        displayError("Can\u2019t decode or convert this link.");
      }
    }

    // ── Apple Maps helpers ───────────────────────────────────────────────

    function isAppleMapsUrl(url) {
      return url.includes("maps.apple") || url.includes("apple.com/maps");
    }

    async function callAppleApi(url) {
      try {
        const resp = await fetch(APPLE_API + "?url=" + encodeURIComponent(url), {
          signal: AbortSignal.timeout(15000)
        });
        return await resp.json();
      } catch (e) {
        return null;
      }
    }

    // ── Facebook helpers ─────────────────────────────────────────────────

    function extractFromFacebook(raw) {
      try {
        const url = new URL(raw);
        // l.facebook.com/l.php?u=... style redirect
        if (url.searchParams.has("u")) {
          return decodeURIComponent(url.searchParams.get("u"));
        }
      } catch (e) {}
      return null;
    }

    function tryFacebookProfileConvert(raw) {
      const conversions = [];
      if (raw.match(/^https?:\/\/m\.facebook\.com\/\d+/) || raw.match(/^https?:\/\/m\.facebook\.com\/[a-zA-Z0-9.]+$/)) {
        conversions.push({
          type: "Facebook \u2192 Messenger",
          value: raw.replace(/m\.facebook\.com/g, "m.me")
        });
      } else if (raw.match(/^https?:\/\/facebook\.com\/[a-zA-Z0-9.]+\/?$/)) {
        const m = raw.match(/facebook\.com\/([a-zA-Z0-9.]+)\/?$/);
        if (m) conversions.push({
          type: "Facebook \u2192 Messenger",
          value: raw.replace(/facebook\.com\/[a-zA-Z0-9.]+\/?$/, "m.me/" + m[1])
        });
      }
      return conversions.length ? conversions : null;
    }

    function tryGeneralDecode(raw) {
      try {
        const decoded = decodeURIComponent(raw);
        if (decoded !== raw && !decoded.includes("%")) return decoded;
      } catch (e) {}
      return null;
    }

    // ── Display helpers ──────────────────────────────────────────────────

    function showLoading(msg) {
      resultContainer.innerHTML = `
      <div class="loading-message">
        <div class="spinner"></div>
        <span>${msg}</span>
      </div>`;
      resultContainer.classList.remove("hidden");
    }

    function displayResults(results) {
      resultContainer.innerHTML = "";
      resultContainer.classList.remove("hidden");

      results.forEach((result, i) => {
        const item = document.createElement("div");
        item.className = "result-item";

        if (result.isError) {
          item.innerHTML = `
          <div class="result-label">${result.type}</div>
          <div class="error-message">${escHtml(result.value)}</div>`;
          resultContainer.appendChild(item);
          return;
        }

        const badgeHtml = result.badge ? `<span class="badge badge-${result.badge}">${badgeLabel(result.badge)}</span>` : "";
        const metaHtml = result.meta ? `<div style="font-size:0.8rem;color:#6b7280;margin-bottom:0.5rem;">${escHtml(result.meta)}</div>` : "";
        const linkColor = result.badge === "google" ? " green" : "";

        item.innerHTML = `
        <div class="result-label">${escHtml(result.type)}: ${badgeHtml}</div>
        <div class="output-box">
          <a href="${escAttr(result.value)}" target="_blank" rel="noopener noreferrer" class="output-text${linkColor}">${escHtml(result.value)}</a>
        </div>
        ${metaHtml}
        <div class="result-actions">
          <button class="btn-secondary copy-btn" data-val="${escAttr(result.value)}">Copy</button>
          ${result.isLink ? `<a class="btn-open" href="${escAttr(result.value)}" target="_blank" rel="noopener noreferrer">&#x2197; Open</a>` : ""}
          <span class="feedback"></span>
        </div>`;

        if (i < results.length - 1) {
          const hr = document.createElement("hr");
          hr.className = "divider";
          item.appendChild(hr);
        }

        resultContainer.appendChild(item);
      });

      document.querySelectorAll(".copy-btn").forEach(btn => {
        btn.addEventListener("click", function() {
          copyToClipboard(this.dataset.val, this);
        });
      });
    }

    function displayError(message) {
      resultContainer.innerHTML = `<div class="error-message">${escHtml(message)}</div>`;
      resultContainer.classList.remove("hidden");
    }

    function badgeLabel(b) {
      return b === "apple" ? "Apple Maps" : b === "google" ? "Google Maps" : "Facebook";
    }

    // ── Clipboard ────────────────────────────────────────────────────────

    function copyToClipboard(text, button) {
      const feedback = button.nextElementSibling.classList.contains("feedback") ?
        button.nextElementSibling :
        button.parentElement.querySelector(".feedback");
      navigator.clipboard.writeText(text).then(() => {
        button.textContent = "Copied";
        if (feedback) {
          feedback.textContent = "\u2714";
          feedback.classList.add("show");
        }
        setTimeout(() => {
          button.textContent = "Copy";
          if (feedback) feedback.classList.remove("show");
        }, 1200);
      }).catch(() => {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand("copy");
          button.textContent = "Copied!";
        } catch (e2) {
          alert("Copy failed");
        }
        ta.remove();
        setTimeout(() => {
          button.textContent = "Copy";
        }, 1200);
      });
    }

    function clearInput() {
      urlInput.value = "";
      resultContainer.classList.add("hidden");
      urlInput.focus();
    }

    // ── Safety helpers ───────────────────────────────────────────────────
    function escHtml(s) {
      return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    function escAttr(s) {
      return String(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    (() => {
      const ENTRY = 'URL Decoder & Converter v3',
        KEY = 'Ion-o-koji Watermark';
      const logs = (localStorage.getItem(KEY) || "").split('\n').map(line => line.replace(/^- /, '').trim()).filter(line => line && line !== ENTRY);
      logs.push(ENTRY);
      localStorage.setItem(KEY, logs.map(item => `- ${item}`).join('\n'));
    })();

  
