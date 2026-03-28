class PlayAIAssistant {
  private mount: HTMLElement | null = null;
  private panel: HTMLElement | null = null;
  private floatingButton: HTMLElement | null = null;
  private isVisible = false;

  constructor() {
    this.init();
    this.setupListeners();
  }

  private init() {
    // Inject Styles are expected in content.css
    
    // Create Floating Button
    this.floatingButton = document.createElement('div');
    this.floatingButton.id = 'play-ai-fab';
    this.floatingButton.innerHTML = `
      <div class="fab-content">
        <img src="${chrome.runtime.getURL('icons/icon.svg')}" />
        <span class="fab-text">Play AI</span>
      </div>
    `;
    this.floatingButton.onclick = () => this.togglePanel();
    document.body.appendChild(this.floatingButton);

    // Create Side Panel Container
    this.mount = document.createElement('div');
    this.mount.id = 'play-ai-mount';
    this.mount.hidden = true;
    this.mount.innerHTML = `
      <div id="play-ai-panel">
        <header>
          <span class="logo">Play AI</span>
          <button id="close-panel">×</button>
        </header>
        <div class="content" id="play-ai-content">
          <div class="suggestions">
            <div class="suggest-group">Curate Intelligence</div>
            <div class="action-grid">
              <button class="action-btn" data-action="summarize">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="12" x2="9" y2="12"></line><line x1="21" y1="18" x2="7" y2="18"></line></svg>
                <span>Summarize</span>
              </button>
              <button class="action-btn" data-action="insights">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                <span>Insights</span>
              </button>
              <button class="action-btn" data-action="analyze">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                <span>Analyze</span>
              </button>
              <button class="action-btn" data-action="kids">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                <span>For Kids</span>
              </button>
              <button class="action-btn" data-action="quiz">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                <span>Quiz Me</span>
              </button>
              <button class="action-btn" data-action="code">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                <span>Code</span>
              </button>
            </div>
            
            <div class="suggest-group">Create & Connect</div>
            <div class="action-grid">
              <button class="action-btn" data-action="rewrite" id="rewrite-btn" disabled>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path></svg>
                <span>Rewrite</span>
              </button>
              <button class="action-btn" data-action="todo">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline></svg>
                <span>Actions</span>
              </button>
              <button class="action-btn" data-action="tweet">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53"></path></svg>
                <span>Tweet</span>
              </button>
              <button class="action-btn" data-action="email">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12"></path></svg>
                <span>Email</span>
              </button>
              <button class="action-btn" data-action="interview">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                <span>Interview</span>
              </button>
            </div>
          </div>
          <div id="play-ai-result"></div>
          <div class="ecosystem-section">
            <div class="ecosystem-title">Explore Ecosystem</div>
            <div id="play-ai-carousel" class="ecosystem-carousel">
              <!-- Dynamically Populated -->
            </div>
          </div>
        </div>
        <div class="footer">
          <a href="https://play-ai.in" target="_blank">Powered by play-ai.in</a>
        </div>
      </div>
    `;
    document.body.appendChild(this.mount);

    this.renderEcosystem();

    // Attach UI interaction
    document.getElementById('close-panel')?.addEventListener('click', () => this.togglePanel());
    
    this.mount.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = (e.target as HTMLElement).dataset.action;
        if (action) this.handleAction(action);
      });
    });
  }

  private setupListeners() {
    document.addEventListener('mouseup', () => {
      const selection = window.getSelection()?.toString().trim();
      const rewriteBtn = document.getElementById('rewrite-btn') as HTMLButtonElement;
      if (rewriteBtn) {
        rewriteBtn.disabled = !selection;
      }
    });

    chrome.runtime.onMessage.addListener((request) => {
      if (request.type === 'TOGGLE_PANEL') {
        this.togglePanel();
      }
    });
  }

  private togglePanel() {
    this.isVisible = !this.isVisible;
    if (this.mount) {
      this.mount.hidden = !this.isVisible;
      if (this.isVisible) this.mount.classList.add('visible');
      else this.mount.classList.remove('visible');
    }
  }

  private async handleAction(action: string) {
    const resultContainer = document.getElementById('play-ai-result');
    if (!resultContainer) return;

    resultContainer.innerHTML = '<div class="loader">Thinking...</div>';
    
    const contextData = this.getPageContext();
    const promptMap: any = {
      summarize: `Summarize the following page content concisely: ${contextData.text}`,
      insights: `Extract 3-5 key bullet points or insights from this page: ${contextData.text}`,
      analyze: `Analyze the following content for key themes and structural logic: ${contextData.text}`,
      kids: `Explain the concept of this page simply for a young child: ${contextData.text}`,
      quiz: `Create 3 challenging quiz questions based on this content to test my knowledge: ${contextData.text}`,
      code: `Extract any code snippets or technical logic from this page and explain them: ${contextData.text}`,
      rewrite: `Rewrite the following selected text to be more clear and professional: ${contextData.selectedText}`,
      todo: `Identify the main action items or takeaways: ${contextData.text}`,
      tweet: `Draft a perfect tweet about this content: ${contextData.text}`,
      email: `Write a professional email summary: ${contextData.text}`,
      interview: `If I am interviewing for a role related to this content, what are 3 tough questions I should prepare for?: ${contextData.text}`
    };

    const response = await chrome.runtime.sendMessage({
      type: 'GENERATE_RESPONSE',
      payload: {
        prompt: promptMap[action] || action,
        context: `URL: ${contextData.url}\nTitle: ${contextData.title}`
      }
    });

    // Clear suggestions and show result
    const suggestions = document.querySelector('.suggestions') as HTMLElement;
    if (suggestions) suggestions.style.display = 'none';
    
    // Hide carousel too
    const eco = document.querySelector('.ecosystem-section') as HTMLElement;
    if (eco) eco.style.display = 'none';

    if (response.error) {
      resultContainer.innerHTML = `<div class="error">${response.error}</div>`;
    } else {
      resultContainer.innerHTML = `
        <div class="output">${response.text}</div>
        <div class="actions">
          <button id="copy-result" class="tool-btn">Copy</button>
          ${action === 'rewrite' ? '<button id="replace-text" class="tool-btn primary">Replace Selection</button>' : ''}
          <button id="back-to-tools" class="tool-btn danger">Back to Tools</button>
        </div>
      `;

      // Scroll to top of result
      const mainContent = document.getElementById('play-ai-content');
      if (mainContent) mainContent.scrollTop = 0;

      document.getElementById('back-to-tools')?.addEventListener('click', () => {
        resultContainer.innerHTML = '';
        if (suggestions) suggestions.style.display = 'block';
        if (eco) eco.style.display = 'block';
      });

      document.getElementById('copy-result')?.addEventListener('click', () => {
        navigator.clipboard.writeText(response.text);
      });

      document.getElementById('replace-text')?.addEventListener('click', () => {
        this.replaceSelection(response.text);
      });
    }
  }

  private getPageContext() {
    const selectedText = window.getSelection()?.toString() || '';
    const bodyText = document.body.innerText.slice(0, 4000);
    return {
      title: document.title,
      url: window.location.href,
      selectedText,
      text: bodyText
    };
  }

  private replaceSelection(replacement: string) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(replacement));
  }
  private renderEcosystem() {
    const carousel = document.getElementById('play-ai-carousel');
    if (!carousel) return;

    const apps = [
      { name: 'AI Landing Page', desc: 'Generate sites in seconds', url: 'https://play-ai.in/generator' },
      { name: 'Kids Game Gen', desc: 'Interactive LLM stories', url: 'https://play-ai.in/generator' },
      { name: 'Blueprint Docs', desc: 'Installation Guide', url: 'https://play-ai.in/docs' }
    ];

    carousel.innerHTML = apps.map(app => `
      <a href="${app.url}" target="_blank" class="eco-card">
        <div class="eco-name">${app.name}</div>
        <div class="eco-desc">${app.desc}</div>
      </a>
    `).join('');
  }
}

new PlayAIAssistant();
