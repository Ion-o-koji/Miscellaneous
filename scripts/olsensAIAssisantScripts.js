
      const chatContainer = document.getElementById('chatContainer');
      const welcome = document.getElementById('welcome');
      const messages = document.getElementById('messages');
      const chatInput = document.getElementById('chatInput');
      const sendBtn = document.getElementById('sendBtn');
      const toast = document.getElementById('toast');

      let isGenerating = false;
      let conversation = [];

      // API Configuration
      const GEMINI_API_KEY = 'AIzaSyD0MDahV0f_PEgjNSb_tw1PxpCHYI2YT2Y';
      const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

      function setInput(text) {
        chatInput.value = text;
        chatInput.focus();
        autoResize();
      }

      function autoResize() {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + 'px';
      }

      chatInput.addEventListener('input', autoResize);
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });

      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
          scrollToBottom();
        });
      }

      sendBtn.addEventListener('click', sendMessage);

      function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
      }

      function addMessage(role, content) {
        if (!welcome.classList.contains('hidden')) {
          welcome.classList.add('hidden');
          messages.classList.remove('hidden');
        }

        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${role}`;

        const avatar = role === 'user' ? '👤' : '🤖';
        const formattedContent = formatContent(content);

        msgDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">${formattedContent}</div>
      `;

        messages.appendChild(msgDiv);
        scrollToBottom();
        return msgDiv;
      }

      function formatContent(content) {
        content = content
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');

        content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
          return `<pre><code>${code.trim()}</code></pre>`;
        });

        content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
        content = content.replace(/\n/g, '<br>');

        return content;
      }

      function addTypingIndicator() {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message ai';
        msgDiv.id = 'typing-indicator';
        msgDiv.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
          <div class="typing">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        </div>
      `;
        messages.appendChild(msgDiv);
        scrollToBottom();
      }

      function removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
      }

      function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }

      async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text || isGenerating) return;

        if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
          showToast('Please set your Gemini API key');
          return;
        }

        chatInput.value = '';
        chatInput.style.height = 'auto';

        addMessage('user', text);
        conversation.push({
          role: 'user',
          content: text
        });

        isGenerating = true;
        sendBtn.disabled = true;
        addTypingIndicator();

        try {
          const response = await fetch(
            `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                contents: conversation.map(msg => ({
                  role: msg.role === 'user' ? 'user' : 'model',
                  parts: [{
                    text: msg.content
                  }]
                })),
                generationConfig: {
                  temperature: 0.7,
                  topK: 40,
                  topP: 0.95,
                  maxOutputTokens: 2048
                }
              })
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            throw new Error(errorData.error?.message || `HTTP ${response.status}`);
          }

          const data = await response.json();
          const aiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received';

          removeTypingIndicator();
          addMessage('ai', aiMessage);
          conversation.push({
            role: 'assistant',
            content: aiMessage
          });

        } catch (error) {
          removeTypingIndicator();
          const errorMsg = error.message.includes('quota') 
            ? 'API quota exceeded. Please check your API key and usage limits.'
            : `Error: ${error.message}`;
          addMessage('ai', errorMsg);
          showToast('Failed to get response');
          console.error('Error:', error);
        } finally {
          isGenerating = false;
          sendBtn.disabled = false;
          chatInput.focus();
        }
      }
    
