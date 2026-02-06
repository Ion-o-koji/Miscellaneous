
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
  
