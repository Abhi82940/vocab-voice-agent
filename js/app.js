/**
 * LexiVoice - Main Application Controller
 */
import { SpeechManager } from "./speech/speechManager.js";
import { VoiceOrb } from "./visualizer/voiceOrb.js";
import { LexiEngine } from "./engine/lexiEngine.js";
import { GeminiEngine } from "./engine/geminiEngine.js";
import { soundFx } from "./speech/audioSynthesizer.js";
import { CATEGORIES } from "./data/vocabulary.js";
import { SCENARIOS } from "./data/scenarios.js";

class App {
  constructor() {
    this.speech = new SpeechManager();
    this.engine = new LexiEngine();
    this.gemini = new GeminiEngine();
    this.orb = null;

    this.activeMode = "learn";
    this.engineMode = "lexi"; // 'lexi' or 'gemini'
    this.isProcessing = false;

    this.initDOMElements();
    this.initOrb();
    this.initSpeechCallbacks();
    this.bindEvents();
    this.renderCategories();
    this.renderWordSelector();
    this.updateStatsDisplay();
    this.updateWordCard(this.engine.getCurrentWord());

    // Check browser speech recognition capabilities
    this.checkBrowserCapabilities();

    // Trigger initial welcoming greeting
    setTimeout(() => {
      this.switchMode("learn", true);
    }, 600);
  }

  initDOMElements() {
    // Mode tabs
    this.modeTabs = document.querySelectorAll(".mode-tab");

    // Interactive Orb & Status
    this.orbCanvas = document.getElementById("voice-orb-canvas");
    this.statusText = document.getElementById("agent-status-text");
    this.statusDot = document.getElementById("agent-status-dot");
    this.liveTranscriptPreview = document.getElementById("live-transcript-preview");
    this.transcriptContainer = document.getElementById("transcript-feed");

    // Action buttons
    this.micBtn = document.getElementById("mic-toggle-btn");
    this.micBtnText = document.getElementById("mic-btn-text");
    this.replayBtn = document.getElementById("replay-voice-btn");
    this.hintBtn = document.getElementById("hint-btn");
    this.nextBtn = document.getElementById("next-word-btn");

    // Text Fallback Input
    this.chatInput = document.getElementById("chat-text-input");
    this.chatSendBtn = document.getElementById("chat-send-btn");

    // Word Card elements
    this.wordCard = document.getElementById("current-word-card");
    this.cardWord = document.getElementById("card-word-title");
    this.cardPhonetic = document.getElementById("card-phonetic");
    this.cardSyllables = document.getElementById("card-syllables");
    this.cardPartOfSpeech = document.getElementById("card-part-of-speech");
    this.cardCategoryBadge = document.getElementById("card-category-badge");
    this.cardShortDef = document.getElementById("card-short-def");
    this.cardDeepDef = document.getElementById("card-deep-def");
    this.cardExample = document.getElementById("card-example");
    this.cardMnemonic = document.getElementById("card-mnemonic");
    this.cardSynonymsContainer = document.getElementById("card-synonyms");
    this.cardPlayAudioBtn = document.getElementById("card-play-audio-btn");

    // Dropdowns & filters
    this.categorySelect = document.getElementById("category-filter-select");
    this.wordSelect = document.getElementById("word-selector-select");
    this.scenarioPickerContainer = document.getElementById("scenario-picker-container");
    this.scenarioSelect = document.getElementById("scenario-selector-select");

    // Stats
    this.statMastered = document.getElementById("stat-mastered-count");
    this.statXP = document.getElementById("stat-xp-count");
    this.statStreak = document.getElementById("stat-streak-count");

    // Settings Modal
    this.settingsModal = document.getElementById("settings-modal");
    this.openSettingsBtn = document.getElementById("open-settings-btn");
    this.closeSettingsBtn = document.getElementById("close-settings-btn");
    this.voiceSelect = document.getElementById("voice-select");
    this.rateRange = document.getElementById("speech-rate-range");
    this.rateDisplay = document.getElementById("speech-rate-val");
    this.pitchRange = document.getElementById("speech-pitch-range");
    this.pitchDisplay = document.getElementById("speech-pitch-val");
    this.handsFreeToggle = document.getElementById("hands-free-toggle");
    this.engineModeSelect = document.getElementById("engine-mode-select");
    this.geminiKeyInput = document.getElementById("gemini-api-key");
    this.geminiKeyContainer = document.getElementById("gemini-key-container");
    this.saveSettingsBtn = document.getElementById("save-settings-btn");
    this.resetStatsBtn = document.getElementById("reset-stats-btn");

    // Feedback Banner
    this.feedbackBanner = document.getElementById("action-feedback-banner");
  }

  initOrb() {
    this.orb = new VoiceOrb("voice-orb-canvas");
  }

  checkBrowserCapabilities() {
    const hasSTT = this.speech.hasRecognitionSupport();
    const hasTTS = this.speech.hasSynthesisSupport();

    if (!hasSTT) {
      this.showFeedback(
        "Voice input (SpeechRecognition) is not supported in this browser. You can still type your sentences using the text bar below!",
        "warning"
      );
    }
  }

  initSpeechCallbacks() {
    // When Lexi starts speaking
    this.speech.onSpeechStart = () => {
      this.orb.setState("speaking");
      this.updateStatus("Speaking...", "speaking");
      if (this.micBtn) {
        this.micBtn.classList.add("btn-speaking");
      }
    };

    // When Lexi stops speaking
    this.speech.onSpeechEnd = () => {
      this.orb.setState("idle");
      this.updateStatus("Listening or Ready", "idle");
      if (this.micBtn) {
        this.micBtn.classList.remove("btn-speaking");
      }
    };

    // When microphone starts listening
    this.speech.onListeningStart = () => {
      this.orb.setState("listening");
      this.updateStatus("Listening to you...", "listening");
      this.micBtn.classList.add("bg-emerald-500", "ring-4", "ring-emerald-400/40");
      this.micBtn.classList.remove("bg-indigo-600");
      this.micBtnText.textContent = "Listening... Tap to stop";
      this.liveTranscriptPreview.classList.remove("hidden");
      this.liveTranscriptPreview.textContent = "🎙️ Listening... speak now";
    };

    // Interim speech results while speaking
    this.speech.onInterimTranscript = (text) => {
      this.liveTranscriptPreview.textContent = `"${text}..."`;
    };

    // Final speech result
    this.speech.onFinalTranscript = (text) => {
      this.liveTranscriptPreview.classList.add("hidden");
      this.handleSpokenInput(text);
    };

    // Listening ended
    this.speech.onListeningEnd = () => {
      this.micBtn.classList.remove("bg-emerald-500", "ring-4", "ring-emerald-400/40");
      this.micBtn.classList.add("bg-indigo-600");
      this.micBtnText.textContent = "Start Speaking";
      if (!this.speech.isSpeaking) {
        this.orb.setState("idle");
        this.updateStatus("Ready", "idle");
      }
    };

    // Mic errors
    this.speech.onError = (err) => {
      console.warn("Speech error callback:", err);
      this.micBtn.classList.remove("bg-emerald-500", "ring-4", "ring-emerald-400/40");
      this.micBtn.classList.add("bg-indigo-600");
      this.micBtnText.textContent = "Start Speaking";
      this.orb.setState("idle");

      if (err === "not-allowed" || err === "permission-denied") {
        this.showFeedback("Microphone access was denied. Please allow microphone permissions in your browser URL bar.", "error");
      }
    };
  }

  bindEvents() {
    // Mode switcher buttons
    this.modeTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const mode = tab.dataset.mode;
        this.switchMode(mode);
      });
    });

    // Orb canvas click to talk
    if (this.orbCanvas) {
      this.orbCanvas.addEventListener("click", () => {
        this.toggleVoice();
      });
    }

    // Main Mic Toggle Button
    this.micBtn.addEventListener("click", () => {
      this.toggleVoice();
    });

    // Action buttons
    this.replayBtn.addEventListener("click", () => {
      this.speech.replayLast();
    });

    this.hintBtn.addEventListener("click", () => {
      this.requestHint();
    });

    this.nextBtn.addEventListener("click", () => {
      this.advanceWord();
    });

    // Chat text input fallback
    this.chatSendBtn.addEventListener("click", () => {
      this.submitTextInput();
    });

    this.chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.submitTextInput();
      }
    });

    // Spacebar to talk shortcut (unless in text field)
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space" && document.activeElement !== this.chatInput) {
        e.preventDefault();
        this.toggleVoice();
      }
    });

    // Category filter dropdown
    this.categorySelect.addEventListener("change", (e) => {
      const selectedCat = e.target.value;
      const word = this.engine.filterWordsByCategory(selectedCat);
      this.renderWordSelector();
      this.updateWordCard(word);
      this.switchMode(this.activeMode, true);
    });

    // Word selector dropdown
    this.wordSelect.addEventListener("change", (e) => {
      const index = parseInt(e.target.value, 10);
      this.engine.setWordIndex(index);
      const word = this.engine.getCurrentWord();
      this.updateWordCard(word);
      this.switchMode(this.activeMode, true);
    });

    // Scenario selector dropdown
    if (this.scenarioSelect) {
      this.scenarioSelect.addEventListener("change", (e) => {
        const idx = parseInt(e.target.value, 10);
        this.engine.setScenarioIndex(idx);
        this.switchMode("conversation", true);
      });
    }

    // Card audio pronounce button
    this.cardPlayAudioBtn.addEventListener("click", () => {
      const word = this.engine.getCurrentWord();
      this.speech.speak(`${word.word}. ${word.shortDef}`);
    });

    // Settings Modal
    this.openSettingsBtn.addEventListener("click", () => this.openSettings());
    this.closeSettingsBtn.addEventListener("click", () => this.closeSettings());
    this.settingsModal.addEventListener("click", (e) => {
      if (e.target === this.settingsModal) this.closeSettings();
    });

    this.rateRange.addEventListener("input", (e) => {
      this.rateDisplay.textContent = `${parseFloat(e.target.value).toFixed(2)}x`;
    });

    this.pitchRange.addEventListener("input", (e) => {
      this.pitchDisplay.textContent = parseFloat(e.target.value).toFixed(2);
    });

    this.engineModeSelect.addEventListener("change", (e) => {
      this.geminiKeyContainer.classList.toggle("hidden", e.target.value !== "gemini");
    });

    this.saveSettingsBtn.addEventListener("click", () => {
      this.saveSettings();
    });

    this.resetStatsBtn.addEventListener("click", () => {
      if (confirm("Reset all learned vocabulary and streaks?")) {
        localStorage.removeItem("lexivoice_stats");
        this.engine.loadStats();
        this.updateStatsDisplay();
        this.showFeedback("Progress stats reset.", "info");
      }
    });
  }

  toggleVoice() {
    if (this.speech.isListening) {
      this.speech.stopListening();
    } else {
      this.speech.startListening();
    }
  }

  switchMode(mode, forceSpeech = false) {
    this.activeMode = mode;

    // Update Tab UI
    this.modeTabs.forEach((tab) => {
      const isSelected = tab.dataset.mode === mode;
      tab.classList.toggle("bg-indigo-600", isSelected);
      tab.classList.toggle("text-white", isSelected);
      tab.classList.toggle("shadow-lg", isSelected);
      tab.classList.toggle("shadow-indigo-500/25", isSelected);
      tab.classList.toggle("bg-slate-800/80", !isSelected);
      tab.classList.toggle("text-slate-300", !isSelected);
    });

    // Show/hide scenario picker container if in conversation mode
    if (this.scenarioPickerContainer) {
      this.scenarioPickerContainer.classList.toggle("hidden", mode !== "conversation");
    }

    // Adjust word card visibility
    this.wordCard.classList.toggle("opacity-60", mode === "conversation");

    // Fetch mode greeting from Lexi Engine
    const greeting = this.engine.getModeGreeting(mode);
    this.appendTranscript("lexi", greeting.displayText, greeting.spokenText);

    this.speech.speak(greeting.spokenText);
  }

  async handleSpokenInput(spokenText) {
    if (!spokenText || this.isProcessing) return;
    this.isProcessing = true;

    // Add user message to transcript
    this.appendTranscript("user", spokenText);
    this.orb.setState("thinking");
    this.updateStatus("Lexi is thinking...", "thinking");

    try {
      if (this.engineMode === "gemini" && this.gemini.hasKey()) {
        // Advanced LLM Generative Dialogue
        const currentWord = this.engine.getCurrentWord();
        const context = `Target vocabulary: ${currentWord.word} (${currentWord.shortDef}). Mode: ${this.activeMode}.`;
        const responseText = await this.gemini.sendPrompt(spokenText, context);

        this.orb.setState("speaking");
        this.appendTranscript("lexi", responseText, responseText);
        this.speech.speak(responseText);
      } else {
        // Autonomous Built-in Pedagogical Logic
        const result = this.engine.processInput(spokenText);

        this.appendTranscript("lexi", result.displayText, result.spokenText);
        this.speech.speak(result.spokenText);

        if (result.stats) {
          this.updateStatsDisplay();
        }

        // Auto-advance word in quiz mode if solved
        if (result.advanceNext) {
          setTimeout(() => {
            this.advanceWord(true);
          }, 3200);
        }
      }
    } catch (err) {
      console.error("Error processing input:", err);
      const fallbackText = "I encountered an issue processing that. Let's try again!";
      this.appendTranscript("lexi", fallbackText, fallbackText);
      this.speech.speak(fallbackText);
    } finally {
      this.isProcessing = false;
    }
  }

  submitTextInput() {
    const text = this.chatInput.value.trim();
    if (!text) return;
    this.chatInput.value = "";
    this.handleSpokenInput(text);
  }

  requestHint() {
    const word = this.engine.getCurrentWord();
    soundFx.playHintTone();
    const hintMsg = `Hint: The word has ${word.syllables.split("-").length} syllables and starts with "${word.word[0].toUpperCase()}". Think of this memory hook: ${word.mnemonic}`;
    this.appendTranscript("lexi", `💡 **Hint:** ${hintMsg}`, hintMsg);
    this.speech.speak(hintMsg);
  }

  advanceWord(autoTriggerSpeech = false) {
    const newWord = this.engine.nextWord();
    this.wordSelect.value = this.engine.currentWordIndex;
    this.updateWordCard(newWord);

    if (autoTriggerSpeech || this.activeMode === "quiz" || this.activeMode === "learn") {
      const greeting = this.engine.getModeGreeting(this.activeMode);
      this.appendTranscript("lexi", greeting.displayText, greeting.spokenText);
      this.speech.speak(greeting.spokenText);
    }
  }

  updateWordCard(word) {
    if (!word) return;
    this.cardWord.textContent = word.word;
    this.cardPhonetic.textContent = word.phonetic;
    this.cardSyllables.textContent = word.syllables;
    this.cardPartOfSpeech.textContent = word.partOfSpeech;
    this.cardCategoryBadge.textContent = word.category;
    this.cardShortDef.textContent = word.shortDef;
    this.cardDeepDef.textContent = word.deepDef;
    this.cardExample.textContent = `"${word.example}"`;
    this.cardMnemonic.textContent = word.mnemonic;

    // Render synonyms pills
    this.cardSynonymsContainer.innerHTML = "";
    word.synonyms.forEach((syn) => {
      const pill = document.createElement("button");
      pill.className = "px-2.5 py-1 text-xs rounded-full bg-slate-800 hover:bg-indigo-600/30 text-indigo-300 border border-slate-700 transition";
      pill.textContent = syn;
      pill.title = `Click to hear "${syn}"`;
      pill.addEventListener("click", () => {
        this.speech.speak(`${syn}, a synonym of ${word.word}.`);
      });
      this.cardSynonymsContainer.appendChild(pill);
    });
  }

  appendTranscript(speaker, displayText, spokenText = "") {
    const bubble = document.createElement("div");
    bubble.className = `flex flex-col mb-4 ${speaker === "user" ? "items-end" : "items-start"} animate-fadeIn`;

    const authorLabel = document.createElement("div");
    authorLabel.className = "flex items-center gap-1.5 text-xs text-slate-400 mb-1 px-1";
    authorLabel.innerHTML = speaker === "user" 
      ? `<span class="font-medium text-emerald-400">You (Voice)</span>`
      : `<span class="w-2 h-2 rounded-full bg-indigo-400"></span><span class="font-medium text-indigo-300">Lexi (AI Coach)</span>`;

    const contentBox = document.createElement("div");
    contentBox.className = `relative max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
      speaker === "user"
        ? "bg-emerald-600/20 border border-emerald-500/30 text-emerald-100 rounded-br-sm"
        : "bg-slate-800/90 border border-slate-700 text-slate-200 rounded-bl-sm"
    }`;

    // Simple markdown parsing for bold & italics
    const formatted = displayText
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-indigo-200">$1</em>')
      .replace(/\n\n/g, '<div class="h-2"></div>')
      .replace(/\n/g, '<br/>');

    contentBox.innerHTML = formatted;

    // Add audio replay button for Lexi's utterances
    if (speaker === "lexi" && spokenText) {
      const replayIcon = document.createElement("button");
      replayIcon.className = "mt-2 flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-200 transition";
      replayIcon.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg> Replay Voice`;
      replayIcon.addEventListener("click", () => {
        this.speech.speak(spokenText);
      });
      contentBox.appendChild(replayIcon);
    }

    bubble.appendChild(authorLabel);
    bubble.appendChild(contentBox);

    this.transcriptContainer.appendChild(bubble);
    this.transcriptContainer.scrollTop = this.transcriptContainer.scrollHeight;
  }

  updateStatus(text, state) {
    this.statusText.textContent = text;
    this.statusDot.className = "w-2.5 h-2.5 rounded-full";

    switch (state) {
      case "listening":
        this.statusDot.classList.add("bg-emerald-400", "animate-ping");
        break;
      case "speaking":
        this.statusDot.classList.add("bg-indigo-400", "animate-pulse");
        break;
      case "thinking":
        this.statusDot.classList.add("bg-amber-400", "animate-pulse");
        break;
      default:
        this.statusDot.classList.add("bg-slate-400");
        break;
    }
  }

  updateStatsDisplay() {
    this.statMastered.textContent = this.engine.stats.masteredWords.size;
    this.statXP.textContent = this.engine.stats.xp;
    this.statStreak.textContent = `${this.engine.stats.streak}🔥`;
  }

  renderCategories() {
    this.categorySelect.innerHTML = "";
    CATEGORIES.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      this.categorySelect.appendChild(opt);
    });
  }

  renderWordSelector() {
    this.wordSelect.innerHTML = "";
    this.engine.words.forEach((w, idx) => {
      const opt = document.createElement("option");
      opt.value = idx;
      opt.textContent = `${w.word} (${w.partOfSpeech})`;
      this.wordSelect.appendChild(opt);
    });
    this.wordSelect.value = this.engine.currentWordIndex;
  }

  showFeedback(message, type = "info") {
    this.feedbackBanner.classList.remove("hidden", "bg-rose-500/20", "bg-emerald-500/20", "bg-amber-500/20");
    if (type === "error") {
      this.feedbackBanner.classList.add("bg-rose-500/20", "border-rose-500/40", "text-rose-200");
    } else if (type === "warning") {
      this.feedbackBanner.classList.add("bg-amber-500/20", "border-amber-500/40", "text-amber-200");
    } else {
      this.feedbackBanner.classList.add("bg-emerald-500/20", "border-emerald-500/40", "text-emerald-200");
    }
    this.feedbackBanner.textContent = message;

    setTimeout(() => {
      this.feedbackBanner.classList.add("hidden");
    }, 6000);
  }

  openSettings() {
    // Populate voices
    this.voiceSelect.innerHTML = "";
    const voices = this.speech.voices;
    voices.forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v.voiceURI;
      opt.textContent = `${v.name} (${v.lang})`;
      if (this.speech.selectedVoice && this.speech.selectedVoice.voiceURI === v.voiceURI) {
        opt.selected = true;
      }
      this.voiceSelect.appendChild(opt);
    });

    this.rateRange.value = this.speech.rate;
    this.rateDisplay.textContent = `${this.speech.rate.toFixed(2)}x`;
    this.pitchRange.value = this.speech.pitch;
    this.pitchDisplay.textContent = this.speech.pitch.toFixed(2);
    this.handsFreeToggle.checked = this.speech.handsFreeMode;

    this.engineModeSelect.value = this.engineMode;
    this.geminiKeyInput.value = this.gemini.apiKey;
    this.geminiKeyContainer.classList.toggle("hidden", this.engineMode !== "gemini");

    this.settingsModal.classList.remove("hidden");
  }

  closeSettings() {
    this.settingsModal.classList.add("hidden");
  }

  saveSettings() {
    if (this.voiceSelect.value) {
      this.speech.setVoiceByURI(this.voiceSelect.value);
    }
    this.speech.setRate(this.rateRange.value);
    this.speech.setPitch(this.pitchRange.value);
    this.speech.setHandsFree(this.handsFreeToggle.checked);

    this.engineMode = this.engineModeSelect.value;
    if (this.engineMode === "gemini") {
      this.gemini.setApiKey(this.geminiKeyInput.value);
    }

    this.closeSettings();
    this.showFeedback("Settings saved successfully!", "info");
  }
}

// Bootstrap application on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  window.lexiApp = new App();
});
