# LexiVoice — AI Vocabulary Voice Coach Prototype

> **Live Working Prototype Link:**  
> 🔗 **[https://abhi82940.github.io/vocab-voice-agent/](https://abhi82940.github.io/vocab-voice-agent/)**

---

## 🌟 Overview & Product Rationale

Learning vocabulary via traditional static flashcards or word lists builds **passive recognition**, but learners frequently freeze when attempting to recall or pronounce these words in real conversations. 

**LexiVoice** is an interactive, voice-first AI prototype designed to bridge the gap between *knowing* a word and *speaking* it with confidence. By speaking directly with an encouraging voice agent ("Lexi"), learners engage the phonological loop in acoustic memory, receive real-time pronunciation scoring, practice active recall, and weave advanced vocabulary into dynamic real-world dialogue.

---

## 🎯 4 Interactive Pedagogical Modes

### 1. 📖 Word Explorer (Contextual Mastery)
- Lexi pronounces the target word, explains its definition, etymology, and delivers an illustrative example sentence.
- Lexi then prompts the user: *"Now, how would you use this word in your own sentence?"*
- Lexi listens to the user's spoken sentence, verifies that the target word was used properly, analyzes sentence context and length, provides warm feedback, and awards **XP**.

### 2. ⚡ Voice Quiz (Active Recall)
- Lexi speaks an evocative definition riddle or context clue:  
  *e.g. "I'm thinking of an adjective that means lasting for a very brief, fleeting time—like morning frost. What word is it?"*
- The learner speaks the answer into their microphone.
- If stuck, the user can say *"Hint"* or *"Give me a clue"*, and Lexi will reveal syllable counts, starting letters, or synonyms.
- Correct spoken answers trigger celebration chimes, award +30 XP, and maintain the daily streak.

### 3. 🎭 Roleplay Conversation (Conversational Application)
- Choose from 4 immersive scenarios:
  - **Executive Strategy & Pitch** (Target words: *Leverage, Mitigate, Paradigm, Viable*)
  - **Art Gallery & Film Salon** (Target words: *Visceral, Resplendent, Juxtapose, Ephemeral*)
  - **Leadership Job Interview** (Target words: *Articulate, Resilient, Pragmatic, Nuance*)
  - **Tech Ethics & Future Cafe** (Target words: *Ubiquitous, Obfuscate, Caveat, Mellifluous*)
- Lexi acts in-character and challenges the user to naturally incorporate the target words during conversation. The app tracks words used in real-time.

### 4. 🗣️ Pronunciation Lab (Acoustic Feedback)
- Lexi pronounces tricky vocabulary words slowly, highlighting syllable stress.
- The user repeats the word into their microphone.
- An acoustic similarity algorithm (normalized Levenshtein string & phoneme comparison) scores pronunciation accuracy from **0% to 100%**, providing immediate corrective guidance on syllable cadence.

---

## 🛠️ Architecture & Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Voice Input (STT)** | Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) | Real-time speech streaming, interim preview, push-to-talk, spacebar trigger, hands-free auto-mic. |
| **Voice Output (TTS)** | Web Speech API (`SpeechSynthesis`) | Multi-voice selection (Google US English, Samantha, Microsoft Natural voices), adjustable speed & pitch. |
| **Audio Visualization** | HTML5 `<canvas>` 2D Engine | Multi-state reactive glowing Voice Orb (Idle, Listening pulse rings, Speaking waves, Thinking orbit). |
| **Sound Synthesis** | Web Audio API (`AudioContext`) | Procedural synthesizer generating pleasant UI chimes, hints, error tones, and celebration fanfares without external audio file latency. |
| **Dialogue Engine** | Dual-Engine Architecture | **Engine 1: Autonomous Built-in Lexi** (Zero configuration, offline-capable, instant evaluation).<br>**Engine 2: Google Gemini REST API** (Optional plug-and-play LLM for open-ended conversation). |
| **Styling & UI** | Tailwind CSS + Custom CSS animations | Dark-mode glassmorphism interface, responsive on mobile, tablet, and desktop. |
| **Storage & Persistence** | Browser `localStorage` | Persists mastered words count, XP, streak counter, and user voice settings. |

---

## 🚀 How to Run Locally

You can run this project locally without any complex installation or build step:

### Option A: Using Python (Recommended)
```bash
cd vocab-voice-agent
python -m http.server 8000
```
Open your browser and navigate to: `http://localhost:8000`

### Option B: Using Node.js
```bash
cd vocab-voice-agent
npx serve .
```

### Option C: Direct Browser Launch
Double-click `index.html` in Chrome, Microsoft Edge, or Safari.

> **Note on Microphone Access:** Browsers require either `https://` or `localhost` to grant microphone permissions. The hosted GitHub Pages link runs over HTTPS.

---

## 🎙️ Testing the Voice Agent (Quick Guide)

1. Click **Allow Microphone** when prompted by your browser.
2. Tap the **Start Speaking** button (or click the **Glowing Voice Orb**, or press the <kbd>Space</kbd> bar).
3. Try these vocal prompts:
   - In **Word Explorer**: Say *"Fame on the internet is very ephemeral."*
   - In **Voice Quiz**: Say *"Ephemeral"* or say *"Give me a hint!"*
   - In **Pronunciation Lab**: Say *"Ubiquitous"* clearly into the mic.
4. If you are in a quiet room or do not have a microphone attached, you can type your answers directly into the **Text Input Bar** at the bottom of the conversation feed!

---

## ⚙️ Voice & Engine Customization

Click the **Gear icon (⚙️)** in the top right header to:
- Choose from available browser TTS voices (Google US English, Samantha, Daniel, etc.).
- Adjust voice speed from 0.6x (for slow, clear comprehension) to 1.4x.
- Toggle **Hands-Free Mode** so the agent automatically listens as soon as Lexi finishes speaking.
- Switch to **Google Gemini LLM** and enter your personal Gemini API key for freeform conversations.

---

## 📄 License & Candidate Information

Built for the Candidate Assessment Kit as a working prototype of an AI Voice Agent for vocabulary learning.
Repository: [https://github.com/Abhi82940/vocab-voice-agent](https://github.com/Abhi82940/vocab-voice-agent)
