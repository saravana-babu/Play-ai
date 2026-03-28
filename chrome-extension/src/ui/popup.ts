const providers: any = [
  { id: 'gemini', icon: 'G', name: 'Gemini', models: ['gemini-1.5-pro', 'gemini-1.5-flash'] },
  { id: 'openai', icon: 'O', name: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] },
  { id: 'anthropic', icon: 'A', name: 'Claude', models: ['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'] },
  { id: 'deepseek', icon: 'D', name: 'DS', models: ['deepseek-chat', 'deepseek-reasoner'] },
  { id: 'groq', icon: 'G', name: 'Groq', models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'] }
];

const WALKTHROUGH_STEPS = [
  {
    title: "Pinned Status",
    desc: "Pin the extension to your toolbar to access these settings anytime."
  },
  {
    title: "Global Toggle",
    desc: "Press <span class='shortcut-badge'>Alt + Shift + Space</span> on any page to open the AI panel."
  },
  {
    title: "Start Analyzing",
    desc: "Use the side panel to Summarize or get Insights from any website instantly."
  }
];

document.addEventListener('DOMContentLoaded', async () => {
  const providerCards = document.getElementById('provider-cards') as HTMLElement;
  const modelSelect = document.getElementById('model-select') as HTMLSelectElement;
  const apiKeyInput = document.getElementById('api-key-input') as HTMLInputElement;
  const saveBtn = document.getElementById('save-settings') as HTMLButtonElement;
  const resetBtn = document.getElementById('reset-config') as HTMLElement;
  const walkthrough = document.getElementById('walkthrough') as HTMLElement;
  const stepContent = document.getElementById('step-content') as HTMLElement;
  const nextBtn = document.getElementById('next-step') as HTMLButtonElement;

  const actionsPanel = document.getElementById('quick-actions-panel') as HTMLElement;
  const settingsPanel = document.getElementById('settings-panel') as HTMLElement;
  const toggleSettingsBtn = document.getElementById('toggle-settings') as HTMLButtonElement;
  const backBtn = document.getElementById('back-to-actions') as HTMLButtonElement;

  const summarizeBtn = document.getElementById('popup-summarize') as HTMLElement;
  const insightsBtn = document.getElementById('popup-insights') as HTMLElement;

  let currentProvider = 'gemini';
  let currentStep = 0;

  // Load existing settings
  const settings = await chrome.storage.local.get(['selectedProvider', 'selectedModel', 'apiKeys', 'setupComplete']);
  
  if (settings.setupComplete) {
      actionsPanel.style.display = 'block';
      settingsPanel.style.display = 'none';
      backBtn.style.display = 'block';
  } else {
      actionsPanel.style.display = 'none';
      settingsPanel.style.display = 'block';
  }

  if (settings.selectedProvider) {
    currentProvider = settings.selectedProvider;
  }

  const updateModels = (providerId: string) => {
    const provider = providers.find((p: any) => p.id === providerId);
    modelSelect.innerHTML = '';
    if (provider) {
      provider.models.forEach((m: string) => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        modelSelect.appendChild(opt);
      });
      if (settings.selectedModel && provider.models.includes(settings.selectedModel)) {
        modelSelect.value = settings.selectedModel;
      }
    }
  };

  // Render Provider Cards
  const renderCards = () => {
    providerCards.innerHTML = '';
    providers.forEach((p: any) => {
      const card = document.createElement('div');
      card.className = `provider-card ${p.id === currentProvider ? 'active' : ''}`;
      card.innerHTML = `
        <div class="provider-icon">${p.icon}</div>
        <div class="provider-name">${p.name}</div>
      `;
      card.onclick = () => {
        currentProvider = p.id;
        renderCards();
        updateModels(currentProvider);
        apiKeyInput.value = settings.apiKeys?.[currentProvider] || '';
      };
      providerCards.appendChild(card);
    });
  };

  renderCards();
  updateModels(currentProvider);
  if (settings.apiKeys?.[currentProvider]) {
    apiKeyInput.value = settings.apiKeys[currentProvider];
  }

  const showStep = (index: number) => {
    const step = WALKTHROUGH_STEPS[index];
    stepContent.innerHTML = `
      <span class="step-num">Step 0${index + 1}</span>
      <h2 class="step-title">${step.title}</h2>
      <p class="step-desc">${step.desc}</p>
    `;
    nextBtn.textContent = index === WALKTHROUGH_STEPS.length - 1 ? "Start Browsing" : "Next Step";
  };

  saveBtn.addEventListener('click', async () => {
    const keys = settings.apiKeys || {};
    keys[currentProvider] = apiKeyInput.value;

    await chrome.storage.local.set({
      selectedProvider: currentProvider,
      selectedModel: modelSelect.value,
      apiKeys: keys,
      setupComplete: true
    });

    walkthrough.style.display = 'flex';
    showStep(0);
  });

  nextBtn.addEventListener('click', () => {
    currentStep++;
    if (currentStep < WALKTHROUGH_STEPS.length) {
      showStep(currentStep);
    } else {
      walkthrough.style.display = 'none';
      window.location.reload(); // Refresh to show actions
    }
  });

  toggleSettingsBtn.addEventListener('click', () => {
      actionsPanel.style.display = 'none';
      settingsPanel.style.display = 'block';
  });

  backBtn.addEventListener('click', () => {
      actionsPanel.style.display = 'block';
      settingsPanel.style.display = 'none';
  });

  resetBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear all API keys and settings?')) {
      await chrome.storage.local.clear();
      window.location.reload();
    }
  });

  // Action Logic
  const triggerAction = async (action: string) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_PANEL' });
        // We could also trigger handleAction directly here but simpler to open the panel
        window.close();
    }
  };

  summarizeBtn.onclick = () => triggerAction('summarize');
  insightsBtn.onclick = () => triggerAction('insights');
});
