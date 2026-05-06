
    const promptInput = document.getElementById('promptInput');
    const generateBtn = document.getElementById('generateBtn');
    const btnText = document.getElementById('btnText');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const resultSection = document.getElementById('resultSection');
    const resultImage = document.getElementById('resultImage');
    const resultPrompt = document.getElementById('resultPrompt');
    const galleryGrid = document.getElementById('galleryGrid');
    const errorToast = document.getElementById('errorToast');
    const errorMessage = document.getElementById('errorMessage');

    let isGenerating = false;

    async function generateImage() {
      const prompt = promptInput.value.trim();
      if (!prompt || isGenerating) return;

      setLoading(true);
      hideError();

      try {
        // Pollinations usage is URL-based. We construct the URL with parameters.
        const seed = Math.floor(Math.random() * 9999999);
        const width = 1024;
        const height = 1024;
        const model = 'flux'; // Pollinations high quality model
        const nologo = 'true';

        const encodedPrompt = encodeURIComponent(prompt);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=${model}&nologo=${nologo}`;

        // Pre-load the image to ensure it's ready before showing
        await preloadImage(imageUrl);

        displayResult(imageUrl, prompt);
        addToGallery(imageUrl, prompt);
      } catch (err) {} finally {
        setLoading(false);
      }
    }

    function preloadImage(url) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(new Error("Image failed to load"));
        img.src = url;
      });
    }

    function setLoading(state) {
      isGenerating = state;
      generateBtn.disabled = state;
      promptInput.disabled = state;
      btnText.textContent = state ? 'Pollinating...' : 'Generate';
      loadingSpinner.classList.toggle('hidden', !state);
    }

    function displayResult(url, prompt) {
      resultImage.src = url;
      resultPrompt.textContent = `"${prompt}"`;
      resultSection.classList.remove('hidden');
      resultSection.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }

    function addToGallery(url, prompt) {
      if (galleryGrid.querySelector('.opacity-40')) {
        galleryGrid.innerHTML = '';
      }

      const item = document.createElement('div');
      item.className = 'gallery-item relative rounded-3xl overflow-hidden group cursor-pointer aspect-square bg-slate-800 border border-white/5 shadow-xl';
      item.innerHTML = `
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 p-6 flex flex-col justify-end">
                    <p class="text-xs italic mb-2 line-clamp-2">"${prompt}"</p>
                    <div class="flex justify-between items-center">
                         <span class="text-[10px] text-slate-400">Flux Model</span>
                         <i class="fas fa-expand text-indigo-400"></i>
                    </div>
                </div>
                <img src="${url}" alt="${prompt}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
            `;

      item.onclick = () => {
        displayResult(url, prompt);
      };

      galleryGrid.prepend(item);
    }

    function showError(msg) {
      errorMessage.textContent = msg;
      errorToast.classList.add('show');
      setTimeout(hideError, 5000);
    }

    function hideError() {
      errorToast.classList.remove('show');
    }

    async function downloadImage() {
      const response = await fetch(resultImage.src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Aura-Pollination-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }

    function scrollToTop() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      promptInput.focus();
    }

    generateBtn.addEventListener('click', generateImage);
    promptInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') generateImage();
    });

    window.addEventListener('scroll', () => {
      const nav = document.querySelector('nav');
      if (window.scrollY > 50) {
        nav.style.marginTop = '0';
        nav.style.borderRadius = '0';
        nav.style.maxWidth = '100%';
      } else {
        nav.style.marginTop = '1rem';
        nav.style.borderRadius = '24px';
        nav.style.maxWidth = '80rem';
      }
    });

    localStorage.setItem('Ion-o-koji Watermark', `${localStorage.getItem('Ion-o-koji Watermark') || ''} AI image generator v2,`);

  
