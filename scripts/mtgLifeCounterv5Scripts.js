
    function change(id, delta) {
      const el = document.getElementById(id);
      let value = parseInt(el.textContent, 10) + delta;
      if (value < 0) value = 0;
      el.textContent = value;
    }

    function reset(id) {
      document.getElementById(id).textContent = 40;
    }

    function setName(id) {
      const name = prompt('Enter player name:');
      if (name) {
        document.getElementById(id).textContent = name;
      }
    }

    function toggleDarkMode() {
      document.body.classList.toggle('dark-mode');
    }

    (() => {
      const ENTRY = 'MTG Life Counter v5',
        KEY = 'Ion-o-koji Watermark';
      const logs = (localStorage.getItem(KEY) || "").split('\n').map(line => line.replace(/^- /, '').trim()).filter(line => line && line !== ENTRY);
      logs.push(ENTRY);
      localStorage.setItem(KEY, logs.map(item => `- ${item}`).join('\n'));
    })();

  
