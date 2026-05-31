
    async function convertLink() {
      var input = document.getElementById('appleLink').value.trim();
      var btn = document.getElementById('btn');
      var loader = document.getElementById('loader');
      var resultDiv = document.getElementById('result');
      var googleUrlAnchor = document.getElementById('googleUrl');
      if (!input) return;
      resultDiv.style.display = "none";
      btn.disabled = true;
      loader.style.display = "block";
      try {
        var coords = "";
        if (input.indexOf("maps.apple") !== -1) {
          var proxyUrl = "https://api.allorigins.win/get?url=" + encodeURIComponent(input);
          var response = await fetch(proxyUrl);
          var data = await response.json();
          var html = data.contents;
          var llMatch = html.match(/ll=([0-9.-]+)(?:,|%2C)([0-9.-]+)/) ||
            html.match(/q=([0-9.-]+)(?:,|%2C)([0-9.-]+)/) ||
            html.match(/center=([0-9.-]+)(?:,|%2C)([0-9.-]+)/);
          if (llMatch) {
            coords = llMatch[1] + "," + llMatch[2];
          }
        } else {
          var reg = /(-?\d+\.\d+),\s*(-?\d+\.\d+)/;
          var match = input.match(reg);
          if (match) {
            coords = match[1] + "," + match[2];
          }
        }
        if (coords) {
          googleUrlAnchor.href = "https://www.google.com/maps/search/?api=1&query=" + coords;
          googleUrlAnchor.textContent = "Click to Open in Google Maps";
          resultDiv.style.display = "block";
        } else {
          alert("Could not find coordinates. Try opening the link in a browser first, then copy the long URL here.");
        }
      } catch (error) {
        alert("Error connecting to the proxy. Check your internet connection.");
      } finally {
        btn.disabled = false;
        loader.style.display = "none";
      }
    }
    document.getElementById("appleLink").addEventListener("keyup", function(event) {
      if (event.key === "Enter") {
        convertLink();
      }
    });

    (() => {
      const ENTRY = 'Apple Map to Google Map v1',
        KEY = 'Ion-o-koji Watermark';
      const logs = (localStorage.getItem(KEY) || "").split('\n').map(line => line.replace(/^- /, '').trim()).filter(line => line && line !== ENTRY);
      logs.push(ENTRY);
      localStorage.setItem(KEY, logs.map(item => `- ${item}`).join('\n'));
    })();

  
