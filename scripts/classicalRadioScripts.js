
    const audio = document.getElementById("audio");
    const stationButtons = Array.from(document.querySelectorAll(".station-btn"));
    const currentLabel = document.getElementById("current-station");
    function setActiveButton(activeBtn) {
      stationButtons.forEach(btn => {
        btn.dataset.active = (btn === activeBtn) ? "true" : "false";
      });
    }
    function loadStation(button) {
      const url = button.dataset.url;
      const name = button.textContent.trim();
      if (audio.src === url) {
        audio.play().catch(()=>{});
        setActiveButton(button);
        currentLabel.textContent = `Playing: ${name}`;
        return;
      }
      audio.src = url;
      audio.load();
      audio.play().catch(()=>{  });
      setActiveButton(button);
      currentLabel.textContent = `Loading: ${name}`;
    }
    stationButtons.forEach(btn => {
      btn.addEventListener("click", () => loadStation(btn));
    });
    audio.addEventListener("playing", () => {
      const active = stationButtons.find(b => b.dataset.active === "true");
      currentLabel.textContent = active ? `Playing: ${active.textContent.trim()}` : "Playing";
    });
    audio.addEventListener("error", () => {
      const active = stationButtons.find(b => b.dataset.active === "true");
      currentLabel.textContent = active ? `Error loading: ${active.textContent.trim()}` : "Error loading station";
    });
  
