
      const audio = document.getElementById("audio");
      const stationButtons = Array.from(document.querySelectorAll(".station-btn"));
      const currentLabel = document.getElementById("current-station");
      const loadingBar = document.getElementById("loading-bar");
      const themeToggle = document.querySelector('.theme-toggle');
      const volumeSlider = document.getElementById('volume-slider');
      const playPauseButton = document.getElementById('play-pause-button');
      let darkMode = false;
      let isLoading = false;
      let isPlaying = false;

      themeToggle.addEventListener('click', () => {
        darkMode = !darkMode;
        document.body.classList.toggle('dark-mode', darkMode);
        themeToggle.textContent = darkMode ? 'Light Mode' : 'Dark Mode';
      });

      volumeSlider.addEventListener('input', () => {
        audio.volume = volumeSlider.value;
      });

      playPauseButton.addEventListener('click', () => {
        if (isPlaying) {
          audio.pause();
          playPauseButton.textContent = '▶';
          isPlaying = false;
        } else {
          audio.play().catch(() => {});
          playPauseButton.textContent = '❚❚';
          isPlaying = true;
        }
      });

      function setActiveButton(activeBtn) {
        stationButtons.forEach(btn => {
          btn.dataset.active = (btn === activeBtn) ? "true" : "false";
        });
      }

      function loadStation(button) {
        if (isLoading) return;
        isLoading = true;
        const url = button.dataset.url;
        const name = button.textContent.trim();
        if (audio.src === url) {
          audio.play().catch(() => {});
          setActiveButton(button);
          currentLabel.textContent = `Playing: ${name}`;
          loadingBar.className = 'loading-bar-inner playing';
          isLoading = false;
          isPlaying = true;
          playPauseButton.textContent = '❚❚';
          return;
        }
        audio.src = url;
        audio.load();
        loadingBar.className = 'loading-bar-inner';
        loadingBar.style.width = '0%';
        loadingBar.style.transition = 'none';
        setTimeout(() => {
          loadingBar.style.transition = 'width 0.3s linear';
          loadingBar.style.width = '30%';
        }, 100);
        setTimeout(() => {
          if (loadingBar.className !== 'loading-bar-inner error') {
            loadingBar.style.transition = 'width 1s linear';
            loadingBar.style.width = '90%';
          }
        }, 800);
        setTimeout(() => {
          if (loadingBar.className !== 'loading-bar-inner error') {
            loadingBar.style.transition = 'width 10s linear';
            loadingBar.style.width = '90%';
          }
        }, 2000);
        audio.play().catch(() => {});
        setActiveButton(button);
        currentLabel.textContent = `Loading: ${name}`;
        isPlaying = true;
        playPauseButton.textContent = '❚❚';
      }

      stationButtons.forEach(btn => {
        btn.addEventListener("click", () => loadStation(btn));
      });

      audio.addEventListener("playing", () => {
        isLoading = false;
        const active = stationButtons.find(b => b.dataset.active === "true");
        currentLabel.textContent = active ? `Playing: ${active.textContent.trim()}` : "Playing";
        loadingBar.className = 'loading-bar-inner playing';
        loadingBar.style.transition = 'width 0.3s linear';
        loadingBar.style.width = '100%';
        isPlaying = true;
        playPauseButton.textContent = '❚❚';
      });

      audio.addEventListener("error", () => {
        isLoading = false;
        const active = stationButtons.find(b => b.dataset.active === "true");
        currentLabel.textContent = active ? `Error loading: ${active.textContent.trim()}` : "Error loading";
        loadingBar.className = 'loading-bar-inner error';
        isPlaying = false;
        playPauseButton.textContent = '▶';
      });

      audio.addEventListener("pause", () => {
        isPlaying = false;
        playPauseButton.textContent = '▶';
      });

      audio.addEventListener("ended", () => {
        loadingBar.className = 'loading-bar-inner';
        loadingBar.style.width = '0%';
        currentLabel.textContent = "Station ended";
        isPlaying = false;
        playPauseButton.textContent = '▶';
      });
    
