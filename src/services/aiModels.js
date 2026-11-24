// Service for querying and validating AI models across providers
// Supports Google Gemini, OpenAI, and OpenRouter

export const DEFAULT_MODELS = {
  gemini: [
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      desc: 'Disyorkan • Paling pantas & sokongan tool-calling terbaik',
      recommended: true
    },
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      desc: 'Penaakulan mendalam & tugasan rumit',
      recommended: false
    },
    {
      id: 'gemini-2.0-flash',
      name: 'Gemini 2.0 Flash',
      desc: 'Generasi baru berkelajuan tinggi',
      recommended: false
    },
    {
      id: 'gemini-2.0-flash-lite',
      name: 'Gemini 2.0 Flash Lite',
      desc: 'Sangat ringan & jimat kuota API',
      recommended: false
    },
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      desc: 'Pantas, stabil & cekap memori',
      recommended: false
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      desc: 'Konteks luas & pemahaman dokumen besar',
      recommended: false
    }
  ],
  openai: [
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      desc: 'Disyorkan • Pantas, murah & berprestasi tinggi',
      recommended: true
    },
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      desc: 'Model perdana OpenAI berbilang mod',
      recommended: false
    },
    {
      id: 'o3-mini',
      name: 'o3-mini',
      desc: 'Penaakulan pantas untuk sains & kod',
      recommended: false
    },
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      desc: 'Model klasik GPT-4 berprestasi',
      recommended: false
    }
  ],
  openrouter: [
    {
      id: 'google/gemini-2.5-flash',
      name: 'Google: Gemini 2.5 Flash',
      desc: 'Disyorkan • Sambungan melalui OpenRouter',
      recommended: true
    },
    {
      id: 'anthropic/claude-3.5-sonnet',
      name: 'Anthropic: Claude 3.5 Sonnet',
      desc: 'Penulisan & logik terkemuka',
      recommended: false
    },
    {
      id: 'meta-llama/llama-3.3-70b-instruct',
      name: 'Meta: Llama 3.3 70B',
      desc: 'Model sumber terbuka berkuasa',
      recommended: false
    },
    {
      id: 'openai/gpt-4o-mini',
      name: 'OpenAI: GPT-4o Mini',
      desc: 'Cekap kos dengan sambungan pantas',
      recommended: false
    }
  ]
};

/**
 * Fetch the real-time list of available models directly from the provider API.
 * This also acts as an active connection test.
 */
export async function fetchModelsFromProvider({ provider = 'gemini', apiKey = '', endpoint = '' }) {
  const cleanKey = (apiKey || '').trim();
  if (!cleanKey) {
    throw new Error('Sila masukkan Kunci API terlebih dahulu.');
  }

  // 1. GOOGLE GEMINI
  if (provider === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(cleanKey)}`;
    let response;
    try {
      response = await fetch(url);
    } catch (networkErr) {
      throw new Error(`Ralat sambungan rangkaian ke Google Gemini: ${networkErr.message}`);
    }

    if (!response.ok) {
      let errMsg = response.statusText;
      try {
        const j = await response.json();
        if (j.error?.message) {
          if (j.error.message.includes('API key not valid')) {
            errMsg = 'Kunci API Google Gemini tidak sah. Sila semak kunci anda di Google AI Studio.';
          } else {
            errMsg = j.error.message;
          }
        }
      } catch {
        // fallback to statusText
      }
      throw new Error(`Google Gemini (${response.status}): ${errMsg}`);
    }

    const data = await response.json();
    const rawList = data.models || [];

    // Filter models that support generateContent (exclude embedding models, imagen, etc.)
    const supported = rawList.filter((m) =>
      Array.isArray(m.supportedGenerationMethods) &&
      m.supportedGenerationMethods.includes('generateContent')
    );

    if (supported.length === 0) {
      throw new Error('Tiada model yang menyokong penjanaan teks (generateContent) ditemui untuk kunci ini.');
    }

    // Format model objects
    const formatted = supported.map((m) => {
      const id = m.name.replace(/^models\//, '');
      let desc = m.description || '';
      if (desc.length > 90) desc = desc.slice(0, 90) + '...';

      return {
        id,
        name: m.displayName || id,
        desc,
        inputTokenLimit: m.inputTokenLimit,
        outputTokenLimit: m.outputTokenLimit,
        recommended: id === 'gemini-2.5-flash'
      };
    });

    // Sort order: gemini-2.5-flash first, then flash models, then pro, then others
    formatted.sort((a, b) => {
      if (a.id === 'gemini-2.5-flash') return -1;
      if (b.id === 'gemini-2.5-flash') return 1;
      if (a.id.includes('2.5') && !b.id.includes('2.5')) return -1;
      if (!a.id.includes('2.5') && b.id.includes('2.5')) return 1;
      if (a.id.includes('flash') && !b.id.includes('flash')) return -1;
      if (!a.id.includes('flash') && b.id.includes('flash')) return 1;
      return a.id.localeCompare(b.id);
    });

    return formatted;
  }

  // 2. OPENAI
  if (provider === 'openai') {
    const baseUrl = endpoint ? endpoint.replace(/\/+$/, '') : 'https://api.openai.com/v1';
    const url = `${baseUrl}/models`;
    let response;
    try {
      response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${cleanKey}`
        }
      });
    } catch (networkErr) {
      throw new Error(`Ralat sambungan rangkaian ke OpenAI: ${networkErr.message}`);
    }

    if (!response.ok) {
      let errMsg = response.statusText;
      try {
        const j = await response.json();
        if (j.error?.message) errMsg = j.error.message;
      } catch {}
      throw new Error(`OpenAI (${response.status}): ${errMsg}`);
    }

    const data = await response.json();
    const rawList = data.data || [];

    // Filter relevant chat/completion models
    const chatModels = rawList
      .filter((m) => {
        const id = m.id.toLowerCase();
        return id.includes('gpt') || id.includes('o1') || id.includes('o3') || id.includes('chat');
      })
      .map((m) => ({
        id: m.id,
        name: m.id,
        desc: m.id.includes('mini') ? 'Pantas & jimat kos' : 'Model pemikiran OpenAI',
        recommended: m.id === 'gpt-4o-mini'
      }))
      .sort((a, b) => {
        if (a.id === 'gpt-4o-mini') return -1;
        if (b.id === 'gpt-4o-mini') return 1;
        return a.id.localeCompare(b.id);
      });

    return chatModels.length > 0 ? chatModels : DEFAULT_MODELS.openai;
  }

  // 3. OPENROUTER
  if (provider === 'openrouter') {
    const url = 'https://openrouter.ai/api/v1/models';
    let response;
    try {
      response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${cleanKey}`
        }
      });
    } catch (networkErr) {
      throw new Error(`Ralat sambungan ke OpenRouter: ${networkErr.message}`);
    }

    if (!response.ok) {
      let errMsg = response.statusText;
      try {
        const j = await response.json();
        if (j.error?.message) errMsg = j.error.message;
      } catch {}
      throw new Error(`OpenRouter (${response.status}): ${errMsg}`);
    }

    const data = await response.json();
    const rawList = data.data || [];

    const formatted = rawList
      .slice(0, 50) // top 50 models
      .map((m) => ({
        id: m.id,
        name: m.name || m.id,
        desc: m.description ? (m.description.slice(0, 80) + '...') : '',
        recommended: m.id === 'google/gemini-2.5-flash'
      }))
      .sort((a, b) => {
        if (a.id === 'google/gemini-2.5-flash') return -1;
        if (b.id === 'google/gemini-2.5-flash') return 1;
        return a.name.localeCompare(b.name);
      });

    return formatted.length > 0 ? formatted : DEFAULT_MODELS.openrouter;
  }

  return DEFAULT_MODELS[provider] || [];
}

/**
 * Validate an API key by attempting to pull models.
 * Returns { success: true, models, count } or { success: false, error }
 */
export async function validateApiKeyAndPull({ provider, apiKey, endpoint }) {
  try {
    const models = await fetchModelsFromProvider({ provider, apiKey, endpoint });
    return {
      success: true,
      models,
      count: models.length
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Gagal menyambung kepada pembekal AI.'
    };
  }
}
