
    const numberInput = document.getElementById('number-input');
    const generateBtn = document.getElementById('generate-btn');
    const resultDiv = document.getElementById('result');

    generateBtn.addEventListener('click', () => {
      const maxNumber = parseInt(numberInput.value);
      if (isNaN(maxNumber) || maxNumber < 1) {
        resultDiv.textContent = 'Invalid';
        return;
      }
      const randomNumber = Math.floor(Math.random() * maxNumber) + 1;
      resultDiv.textContent = randomNumber;
    });

    (() => {
      const ENTRY = 'Random Number Generator v1',
        KEY = 'Ion-o-koji Watermark';
      const logs = (localStorage.getItem(KEY) || "").split('\n').map(line => line.replace(/^- /, '').trim()).filter(line => line && line !== ENTRY);
      logs.push(ENTRY);
      localStorage.setItem(KEY, logs.map(item => `- ${item}`).join('\n'));
    })();

  
