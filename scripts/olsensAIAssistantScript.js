
      const chatContainer = document.getElementById('chatContainer');
      const welcome = document.getElementById('welcome');
      const messages = document.getElementById('messages');
      const chatInput = document.getElementById('chatInput');
      const sendBtn = document.getElementById('sendBtn');
      const modelSelect = document.getElementById('modelSelect');
      const toast = document.getElementById('toast');

      let isGenerating = false;
      let conversation = [];

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
          const model = modelSelect.value;
          const response = await fetch('https://text.pollinations.ai/openai', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: model,
              messages: [{
                  role: 'system',
                  content: 'You are a helpful AI assistant.'
                },
                ...conversation
              ],
              temperature: 0.7
            })
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const data = await response.json();
          const aiMessage = data.choices?.[0]?.message?.content || 'No response';

          removeTypingIndicator();
          addMessage('ai', aiMessage);
          conversation.push({
            role: 'assistant',
            content: aiMessage
          });

        } catch (error) {
          removeTypingIndicator();
          addMessage('ai', `Error: ${error.message}. Please try again.`);
          showToast('Failed to get response');
        } finally {
          isGenerating = false;
          sendBtn.disabled = false;
          chatInput.focus();
        }
      }
    
