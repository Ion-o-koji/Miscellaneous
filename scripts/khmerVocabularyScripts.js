
    var DOWNLOAD_URL = 'https://drive.google.com/drive/folders/1T5zPVNac6fjEkGKZ0fe9bR63EV4Iz1h6';
    var CHANGELOG_URL = 'https://docs.google.com/document/d/1ynpcFYYxTFDjj9exho4jvJZeWI55VQJDmJutVzQgH30/edit?usp=drivesdk';
    var BUGREPORT_URL = 'https://docs.google.com/document/d/1s1HbAuR1h9jH_MAjnk0gMCkzKoHNU9Sa1DiXR61RpgU/edit?usp=drivesdk';

    function row(label, linkText, href, tag) {
      return '<div class="card-row">' +
        '<div>' +
        '<div class="row-label">' + label + '</div>' +
        '<div class="row-sub"><a href="' + href + '" target="_blank" rel="noopener noreferrer">' + linkText + '</a></div>' +
        '</div>' +
        '<div class="row-tag">' + tag + '</div>' +
        '</div>';
    }

    document.getElementById('app').innerHTML =
      '<header>' +
      '<h1>📖 Khmer Vocabulary</h1>' +
      '<div class="header-spacer"></div>' +
      '<div class="version-badge">v8.6 — Outdated</div>' +
      '</header>' +

      '<main>' +

      '<div class="hero-card">' +
      '<span class="hero-icon">⚠️</span>' +
      '<div class="hero-title">This File Is Out of Date</div>' +
      '<p class="hero-sub">' +
      'This doesn\'t happen often. Normally the file updates automatically every ' +
      '<strong>Monday at around 5:30 p.m.</strong> without you needing to do anything. ' +
      'However, this time an edit had to be made directly to the HTML file itself — ' +
      'which means a fresh download is required. The version you have ' +
      '(<strong>v8.6</strong>) has been replaced. Download the new file from the ' +
      'link below to keep using Khmer Vocabulary.' +
      '</p>' +
      '<a class="dl-btn" href="' + DOWNLOAD_URL + '" target="_blank" rel="noopener noreferrer">' +
      'Download Latest Version' +
      '</a>' +
      '</div>' +

      '<div class="card">' +
      '<div class="card-title">Support</div>' +
      row('Email', 'olsen.porter@missionary.org', 'mailto:olsen.porter@missionary.org', 'Support') +
      row('Messenger', 'm.me/olsen.porter', 'https://m.me/olsen.porter', 'Support') +
      '</div>' +

      '<div class="card">' +
      '<div class="card-title">Links</div>' +
      row('Changelog', 'KV CHANGELOG', CHANGELOG_URL, 'External<br>Doc') +
      row('Feature Requests &amp; Bug Reports', 'KV FEATURE REQUESTS &amp; BUG REPORTS', BUGREPORT_URL, 'External<br>Doc') +
      '</div>' +

      '<div class="card">' +
      '<div class="card-title">About</div>' +
      '<div class="card-row">' +
      '<div>' +
      '<div class="row-label">Made By</div>' +
      '<div class="row-sub">Porter Olsen</div>' +
      '</div>' +
      '<div class="row-tag">Ion-o-koji</div>' +
      '</div>' +
      '</div>' +

      '</main>' +

      '<footer>Made by <span>Ion-o-koji</span> &nbsp;·&nbsp; Porter Olsen</footer>';
    (() => {
      const ENTRY = 'Outdated Khmer Vocabulary v2',
        KEY = 'Ion-o-koji Watermark';
      const logs = (localStorage.getItem(KEY) || "").split('\n').map(line => line.replace(/^- /, '').trim()).filter(line => line && line !== ENTRY);
      logs.push(ENTRY);
      localStorage.setItem(KEY, logs.map(item => `- ${item}`).join('\n'));
    })();

  
