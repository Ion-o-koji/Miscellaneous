
      // 1. Helper functions
      const $ = function(sel) {
        return document.querySelector(sel);
      };
      const $$ = function(sel) {
        return Array.from(document.querySelectorAll(sel));
      };

      // 2. The missing "store" object
      const store = {
        get(k, fallback) {
          try {
            return JSON.parse(localStorage.getItem(k)) ?? fallback
          } catch (e) {
            return fallback
          }
        },
        set(k, v) {
          localStorage.setItem(k, JSON.stringify(v));
        }
      };

      // 3. Navigation Logic
      const tabs = ["explore", "notes"];

      function show(tab) {
        $$("section").forEach(function(s) {
          s.classList.remove("active");
        });
        var target = $('#' + tab);
        if (target) target.classList.add("active");
        $$(".navbtn").forEach(function(b) {
          var isActive = (b.dataset.tab === tab);
          b.classList.toggle("active", isActive);
          b.setAttribute('aria-selected', isActive);
        });
      }

      $$(".navbtn").forEach(function(b) {
        b.addEventListener("click", function() {
          show(b.dataset.tab);
        });
      });

      // 4. Wiki Fetching Logic
      async function fetchWiki(q) {
        var status = $('#exploreStatus');
        if (status) status.textContent = 'Searching...';

        var url = 'https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(q);
        var linksUrl = 'https://en.wikipedia.org/w/api.php?action=query&prop=links&titles=' + encodeURIComponent(q) + '&pllimit=20&format=json&origin=*';
        var fullUrl = 'https://en.wikipedia.org/w/api.php?action=query&prop=extracts&titles=' + encodeURIComponent(q) + '&format=json&origin=*';

        try {
          const responses = await Promise.all([
            fetch(url).then(function(r) {
              return r.json();
            }),
            fetch(linksUrl).then(function(r) {
              return r.json();
            }),
            fetch(fullUrl).then(function(r) {
              return r.json();
            })
          ]);

          var s = responses[0];
          var l = responses[1];
          var f = responses[2];

          // Handle Summary
          if (s.extract) {
            $('#summary').innerHTML = '<div>' + s.extract + '</div><div class="small" style="margin-top:8px">Source: Wikipedia</div>';
          } else {
            $('#summary').textContent = 'No summary found.';
          }

          // Handle Full Page
          var pages = f.query ? f.query.pages : {};
          var pageData = Object.values(pages)[0];
          if (pageData && pageData.extract) {
            $('#fullNoteCard').style.display = 'block';
            $('#fullNote').innerHTML = pageData.extract;
          } else {
            $('#fullNoteCard').style.display = 'none';
          }

          // Handle Related Links
          var rl = $('#related');
          rl.innerHTML = '';
          var linkPages = l.query ? l.query.pages : {};
          var firstPage = Object.values(linkPages)[0];
          var links = firstPage.links || [];

          links.slice(0, 20).forEach(function(p) {
            var a = document.createElement('a');
            a.href = '#';
            a.textContent = p.title;
            a.className = 'chip';
            a.style.display = 'inline-block';
            a.style.margin = '4px';
            a.addEventListener('click', function(ev) {
              ev.preventDefault();
              $('#topic').value = p.title;
              fetchWiki(p.title);
            });
            rl.appendChild(a);
          });

          if (status) status.textContent = '';
        } catch (err) {
          console.error(err);
          if (status) status.textContent = 'Error fetching content.';
        }
      }

      // 5. Event Listeners
      $('#searchBtn').addEventListener('click', function() {
        var q = $('#topic').value.trim();
        if (q) fetchWiki(q);
      });

      $('#luckyBtn').addEventListener('click', function() {
        var ideas = ['Cardiology', 'Neurology', 'Genetics', 'Photosynthesis'];
        var pick = ideas[Math.floor(Math.random() * ideas.length)];
        $('#topic').value = pick;
        fetchWiki(pick);
      });

      // --- Notes ---
      function saveNotes() {
        store.set('notes', {
          text: $('#notesArea').value,
          ts: Date.now()
        });
        $('#notesStatus').textContent = 'Saved.';
        setTimeout(() => $('#notesStatus').textContent = '', 1500);
      }
      $('#saveNotes').addEventListener('click', saveNotes);
      $('#clearNotes').addEventListener('click', () => {
        if (confirm('Clear notes?')) {
          $('#notesArea').value = '';
          saveNotes();
        }
      });

      // init notes
      (function init() {
        const n = store.get('notes', {
          text: ''
        });
        $('#notesArea').value = n.text || '';
      })();

      localStorage.setItem('Ion-o-koji Watermark', `${localStorage.getItem('Ion-o-koji Watermark') || ''} Learn Everything v3,`);
    
