/**
 * Gemini Engine Adapter
 * Connects optionally to Google Gemini REST API for freeform open-ended LLM conversations.
 */
export class GeminiEngine {
  constructor() {
    this.apiKey = localStorage.getItem("lexivoice_gemini_api_key") || "";
    this.model = "gemini-1.5-flash";
    this.conversationHistory = [];
  }

  hasKey() {
    return !!(this.apiKey && this.apiKey.trim().length > 10);
  }

  setApiKey(key) {
    this.apiKey = (key || "").trim();
    if (this.apiKey) {
      localStorage.setItem("lexivoice_gemini_api_key", this.apiKey);
    } else {
      localStorage.removeItem("lexivoice_gemini_api_key");
    }
  }

  resetHistory() {
    this.conversationHistory = [];
  }

  async sendPrompt(userMessage, systemContext = "") {
    if (!this.hasKey()) {
      throw new Error("No Gemini API key configured.");
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const systemInstruction = `You are Lexi, a world-class, charismatic, and encouraging English vocabulary voice coach.
Your mission is to help the user master sophisticated, precise, and expressive vocabulary through natural, spoken dialogue.
Keep your answers brief, engaging, conversational, and direct (max 2-3 sentences), tailored specifically for Text-To-Speech audio output.
Do NOT use markdown bold/italic asterisks or emojis in your speech text because the speech synthesizer will stumble over them.
Current context: ${systemContext}`;

    this.conversationHistory.push({
      role: "user",
      parts: [{ text: userMessage }]
    });

    const body = {
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: this.conversationHistory.slice(-8), // Keep sliding window
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 250
      }
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || `API error ${response.status}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidate) {
      throw new Error("Empty response received from Gemini.");
    }

    this.conversationHistory.push({
      role: "model",
      parts: [{ text: candidate }]
    });

    return candidate;
  }
}
