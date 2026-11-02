/**
 * Speech Manager for LexiVoice
 * Manages Web Speech Recognition (STT) and Web Speech Synthesis (TTS).
 */
import { soundFx } from "./audioSynthesizer.js";

export class SpeechManager {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis || null;
    this.voices = [];
    this.selectedVoice = null;
    this.rate = 0.95; // Slightly measured rate for vocabulary clarity
    this.pitch = 1.0;
    this.volume = 1.0;

    this.isListening = false;
    this.isSpeaking = false;
    this.handsFreeMode = false;
    this.lastSpokenText = "";

    // Callbacks
    this.onListeningStart = null;
    this.onListeningEnd = null;
    this.onInterimTranscript = null;
    this.onFinalTranscript = null;
    this.onSpeechStart = null;
    this.onSpeechEnd = null;
    this.onError = null;

    this.initRecognition();
    this.initSynthesis();
  }

  initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition API is not supported in this browser.");
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = "en-US";

      this.recognition.onstart = () => {
        this.isListening = true;
        soundFx.playMicStart();
        if (this.onListeningStart) this.onListeningStart();
      };

      this.recognition.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (interimTranscript && this.onInterimTranscript) {
          this.onInterimTranscript(interimTranscript);
        }

        if (finalTranscript && this.onFinalTranscript) {
          this.onFinalTranscript(finalTranscript.trim());
        }
      };

      this.recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        this.isListening = false;
        if (this.onError) {
          this.onError(event.error);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.onListeningEnd) this.onListeningEnd();
      };
    } catch (e) {
      console.error("Failed to initialize Speech Recognition:", e);
    }
  }

  initSynthesis() {
    if (!this.synthesis) {
      console.warn("Speech Synthesis API not supported in this browser.");
      return;
    }

    const loadVoices = () => {
      this.voices = this.synthesis.getVoices().filter(v => v.lang.startsWith("en"));
      if (this.voices.length === 0) {
        this.voices = this.synthesis.getVoices();
      }

      // Priority list for natural sounding voices
      const preferredNames = [
        "Google US English",
        "Samantha",
        "Victoria",
        "Daniel",
        "Karen",
        "Microsoft Jenny Online (Natural)",
        "Microsoft Aria Online (Natural)",
        "Microsoft Guy Online (Natural)",
        "Microsoft Zira",
        "Microsoft David"
      ];

      for (const name of preferredNames) {
        const found = this.voices.find(v => v.name.includes(name));
        if (found) {
          this.selectedVoice = found;
          break;
        }
      }

      if (!this.selectedVoice && this.voices.length > 0) {
        this.selectedVoice = this.voices.find(v => v.lang.includes("en-US") || v.lang.includes("en-GB")) || this.voices[0];
      }
    };

    loadVoices();
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = loadVoices;
    }
  }

  hasRecognitionSupport() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  hasSynthesisSupport() {
    return !!window.speechSynthesis;
  }

  startListening() {
    if (!this.recognition) {
      if (this.onError) this.onError("Speech recognition not supported in this browser.");
      return;
    }

    // Stop speaking if currently speaking
    if (this.isSpeaking) {
      this.stopSpeaking();
    }

    try {
      this.recognition.start();
    } catch (e) {
      // If already started, ignore or restart
      if (e.name !== "InvalidStateError") {
        console.error("Recognition start error:", e);
      }
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
        soundFx.playMicStop();
      } catch (e) {
        console.error("Recognition stop error:", e);
      }
    }
  }

  toggleListening() {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  speak(text, { onEnd, onBoundary } = {}) {
    if (!this.synthesis) {
      console.warn("Speech synthesis unavailable.");
      if (onEnd) onEnd();
      return;
    }

    this.stopSpeaking();

    // Clean text of markdown artifacts for clean TTS speech
    const cleanText = text
      .replace(/[*_#`~[\]]/g, "")
      .replace(/\n+/g, " ")
      .trim();

    this.lastSpokenText = cleanText;
    const utterance = new SpeechSynthesisUtterance(cleanText);

    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;
    utterance.volume = this.volume;

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (this.onSpeechStart) this.onSpeechStart();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      if (this.onSpeechEnd) this.onSpeechEnd();
      if (onEnd) onEnd();

      // If hands-free mode is on, auto-listen after agent finishes speaking
      if (this.handsFreeMode) {
        setTimeout(() => {
          if (!this.isSpeaking && !this.isListening) {
            this.startListening();
          }
        }, 400);
      }
    };

    utterance.onerror = (e) => {
      console.warn("Speech utterance error:", e);
      this.isSpeaking = false;
      if (this.onSpeechEnd) this.onSpeechEnd();
      if (onEnd) onEnd();
    };

    if (onBoundary) {
      utterance.onboundary = onBoundary;
    }

    this.synthesis.speak(utterance);
  }

  stopSpeaking() {
    if (this.synthesis && (this.synthesis.speaking || this.synthesis.pending)) {
      this.synthesis.cancel();
    }
    this.isSpeaking = false;
    if (this.onSpeechEnd) this.onSpeechEnd();
  }

  replayLast() {
    if (this.lastSpokenText) {
      this.speak(this.lastSpokenText);
    }
  }

  setVoiceByURI(uri) {
    const v = this.voices.find(voice => voice.voiceURI === uri);
    if (v) this.selectedVoice = v;
  }

  setRate(val) {
    this.rate = parseFloat(val);
  }

  setPitch(val) {
    this.pitch = parseFloat(val);
  }

  setHandsFree(enabled) {
    this.handsFreeMode = !!enabled;
  }
}
