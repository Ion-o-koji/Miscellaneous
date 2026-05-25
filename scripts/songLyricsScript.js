
    const API_URL = "https://api.lyrics.ovh";
    const searchInput = document.getElementById("search-input");
    const resultsContainer = document.getElementById("results-container");
    const searchView = document.getElementById("search-view");
    const lyricsView = document.getElementById("lyrics-view");

    const lyricsTitle = document.getElementById("lyrics-title");
    const lyricsArtist = document.getElementById("lyrics-artist");
    const lyricsText = document.getElementById("lyrics-text");

    // Listen for 'Enter' key on mobile keyboard
    searchInput.addEventListener("keypress", function(e) {
      if (e.key === "Enter") {
        searchSongs();
        searchInput.blur(); // Dismiss mobile keyboard
      }
    });

    async function searchSongs() {
      const query = searchInput.value.trim();
      if (!query) return;

      resultsContainer.innerHTML = '<div class="loader">Searching... 🔍</div>';

      try {
        const response = await fetch(`${API_URL}/suggest/${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data.data.length === 0) {
          resultsContainer.innerHTML = '<div class="loader">No songs found 😢</div>';
          return;
        }

        renderResults(data.data);
      } catch (error) {
        resultsContainer.innerHTML = '<div class="error">Failed to connect to search API. Please check your internet connection.</div>';
      }
    }

    function renderResults(songs) {
      resultsContainer.innerHTML = "";
      // Take top 15 results for mobile performance
      songs.slice(0, 15).forEach(song => {
        const card = document.createElement("div");
        card.className = "song-card";
        card.onclick = () => getLyrics(song.artist.name, song.title);

        card.innerHTML = `
                    <img class="album-art" src="${song.album.cover_small}" alt="Album Art" loading="lazy">
                    <div class="song-info">
                        <div class="song-title">${song.title}</div>
                        <div class="song-artist">${song.artist.name}</div>
                    </div>
                `;
        resultsContainer.appendChild(card);
      });
    }

    async function getLyrics(artist, title) {
      // Switch views
      searchView.style.display = "none";
      lyricsView.style.display = "block";
      window.scrollTo(0, 0);

      lyricsTitle.innerText = title;
      lyricsArtist.innerText = artist;
      lyricsText.innerHTML = '<div class="loader">Fetching lyrics... 🎶</div>';

      try {
        const response = await fetch(`${API_URL}/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);
        const data = await response.json();

        if (data.lyrics) {
          // Clean up the lyrics (removes "Paroles de la chanson..." headers sometimes present in this API)
          let cleanLyrics = data.lyrics.replace(/Paroles de la chanson.+/g, "").trim();
          lyricsText.innerText = cleanLyrics;
        } else {
          lyricsText.innerHTML = `<div class="error">Sorry, lyrics for this song could not be found. 😔</div>`;
        }
      } catch (error) {
        lyricsText.innerHTML = `<div class="error">Failed to load lyrics. Please try again later.</div>`;
      }
    }

    function showSearchView() {
      lyricsView.style.display = "none";
      searchView.style.display = "block";
      window.scrollTo(0, 0);
    }

    (() => {
      const ENTRY = 'Song Lyrics v2',
        KEY = 'Ion-o-koji Watermark';
      const logs = (localStorage.getItem(KEY) || "").split('\n').map(line => line.replace(/^- /, '').trim()).filter(line => line && line !== ENTRY);
      logs.push(ENTRY);
      localStorage.setItem(KEY, logs.map(item => `- ${item}`).join('\n'));
    })();

  
