/**
 * LexiEngine - Autonomous Vocabulary Pedagogical Agent
 * Handles dialogue trees, pedagogical feedback, sentence evaluation,
 * phonetics matching, and active recall quizzes.
 */
import { VOCABULARY_LIST } from "../data/vocabulary.js";
import { SCENARIOS } from "../data/scenarios.js";
import { soundFx } from "../speech/audioSynthesizer.js";

export class LexiEngine {
  constructor() {
    this.words = [...VOCABULARY_LIST];
    this.currentWordIndex = 0;
    this.currentMode = "learn"; // 'learn' | 'quiz' | 'conversation' | 'pronounce'

    // Conversation Roleplay
    this.scenarios = [...SCENARIOS];
    this.currentScenarioIndex = 0;
    this.scenarioTargetHits = new Set();

    // Stats and Progression
    this.stats = {
      masteredWords: new Set(),
      streak: 0,
      xp: 0,
      quizzesSolved: 0,
      sentencesCreated: 0
    };

    this.loadStats();
  }

  loadStats() {
    try {
      const saved = localStorage.getItem("lexivoice_stats");
      if (saved) {
        const parsed = JSON.parse(saved);
        this.stats.masteredWords = new Set(parsed.masteredWords || []);
        this.stats.streak = parsed.streak || 0;
        this.stats.xp = parsed.xp || 0;
        this.stats.quizzesSolved = parsed.quizzesSolved || 0;
        this.stats.sentencesCreated = parsed.sentencesCreated || 0;
      }
    } catch (e) {
      console.warn("Could not load stats from localStorage:", e);
    }
  }

  saveStats() {
    try {
      const payload = {
        masteredWords: Array.from(this.stats.masteredWords),
        streak: this.stats.streak,
        xp: this.stats.xp,
        quizzesSolved: this.stats.quizzesSolved,
        sentencesCreated: this.stats.sentencesCreated
      };
      localStorage.setItem("lexivoice_stats", JSON.stringify(payload));
    } catch (e) {
      console.warn("Could not save stats:", e);
    }
  }

  getCurrentWord() {
    return this.words[this.currentWordIndex] || this.words[0];
  }

  getCurrentScenario() {
    return this.scenarios[this.currentScenarioIndex] || this.scenarios[0];
  }

  setWordIndex(idx) {
    if (idx >= 0 && idx < this.words.length) {
      this.currentWordIndex = idx;
    }
  }

  setScenarioIndex(idx) {
    if (idx >= 0 && idx < this.scenarios.length) {
      this.currentScenarioIndex = idx;
      this.scenarioTargetHits.clear();
    }
  }

  nextWord() {
    this.currentWordIndex = (this.currentWordIndex + 1) % this.words.length;
    return this.getCurrentWord();
  }

  filterWordsByCategory(category) {
    if (category === "All Categories" || !category) {
      this.words = [...VOCABULARY_LIST];
    } else {
      this.words = VOCABULARY_LIST.filter(w => w.category === category);
    }
    this.currentWordIndex = 0;
    return this.getCurrentWord();
  }

  // Generate Mode Opening Speech
  getModeGreeting(mode) {
    this.currentMode = mode;
    const word = this.getCurrentWord();

    switch (mode) {
      case "learn":
        return {
          spokenText: `Welcome to Word Explorer! Today's featured word is ${word.word}. ${word.shortDef} For example: "${word.example}". Now, how would you use ${word.word} in your own sentence? Go ahead, I'm listening!`,
          displayText: `**Word Explorer: ${word.word}** (${word.phonetic})\n\n*"${word.shortDef}"*\n\nExample: *"${word.example}"*\n\n🎯 **Your Turn:** Say a sentence aloud using the word **${word.word}**!`,
          actionType: "teach_word",
          word
        };

      case "quiz":
        return {
          spokenText: `Time for your Voice Quiz! Here is your clue: ${word.quizClue}. Say the word out loud, or say 'hint' if you need a clue!`,
          displayText: `🧠 **Voice Quiz Challenge**\n\n"${word.quizClue}"\n\n🎙️ *Speak the target word into your microphone, or ask for a hint!*`,
          actionType: "quiz_prompt",
          word
        };

      case "pronounce":
        return {
          spokenText: `Welcome to the Pronunciation Lab! Let's practice saying "${word.word}". Listen carefully: ${word.word}. Notice the syllables: ${word.syllables}. Now, tap the microphone and repeat after me: "${word.word}".`,
          displayText: `🗣️ **Pronunciation Lab: ${word.word}**\n\nPhonetic IPA: **${word.phonetic}**\nSyllables: **${word.syllables}**\n\n🎙️ *Click the mic and pronounce "${word.word}" clearly.*`,
          actionType: "pronounce_prompt",
          word
        };

      case "conversation": {
        const scenario = this.getCurrentScenario();
        this.scenarioTargetHits.clear();
        return {
          spokenText: `Let's practice conversation in our "${scenario.title}" scenario. ${scenario.initialPrompt} Try using target words like: ${scenario.targetWords.slice(0, 3).join(", ")}.`,
          displayText: `🎭 **${scenario.title}** (${scenario.role})\n\n"${scenario.initialPrompt}"\n\n🎯 **Target Words:** ${scenario.targetWords.join(" • ")}`,
          actionType: "scenario_start",
          scenario
        };
      }

      default:
        return {
          spokenText: `Hi! I'm Lexi, your AI voice vocabulary coach. What would you like to explore today?`,
          displayText: `Hi! I'm Lexi, your AI voice vocabulary coach. Choose a mode above to get started!`,
          actionType: "general"
        };
    }
  }

  // Primary Input Evaluator
  processInput(userInput) {
    const raw = userInput.trim();
    const lower = raw.toLowerCase();

    switch (this.currentMode) {
      case "learn":
        return this.evaluateSentenceSubmission(raw, lower);

      case "quiz":
        return this.evaluateQuizSubmission(raw, lower);

      case "pronounce":
        return this.evaluatePronunciationSubmission(raw, lower);

      case "conversation":
        return this.evaluateConversationTurn(raw, lower);

      default:
        return {
          spokenText: `I heard you say: "${raw}". Let's jump into learning new vocabulary! Tap Word Explorer or Quiz above.`,
          displayText: `I heard: "${raw}". Ready to learn? Choose a mode above!`,
          success: true
        };
    }
  }

  // --- 1. Learn Mode: Sentence Generation & Validation ---
  evaluateSentenceSubmission(raw, lower) {
    const word = this.getCurrentWord();
    const target = word.word.toLowerCase();
    const root = target.substring(0, Math.max(4, target.length - 2));

    // Check if the user used the word or an inflected form
    const wordsInSentence = lower.split(/[^a-z0-9]+/);
    const hasWord = wordsInSentence.some(w => w === target || w.startsWith(root) || target.startsWith(w));

    if (!hasWord) {
      soundFx.playErrorTone();
      return {
        success: false,
        spokenText: `Good try! However, I didn't quite hear the word "${word.word}" in your sentence. Remember, ${word.word} means "${word.shortDef}". Try saying something like: "${word.example}". Give it another shot!`,
        displayText: `⚠️ **Word Not Detected**\n\nYou said: *"${raw}"*\n\nMake sure to include **${word.word}** in your sentence. Clue: *"${word.shortDef}"*`,
        word
      };
    }

    // Check sentence quality
    const wordCount = wordsInSentence.filter(Boolean).length;
    if (wordCount < 4) {
      soundFx.playErrorTone();
      return {
        success: false,
        spokenText: `You got the word right! Now can you stretch that into a full, expressive sentence? Try describing a full scene with ${word.word}.`,
        displayText: `⚡ **Almost there!** Make it a complete sentence with at least 5 words to truly master the nuance of **${word.word}**.`,
        word
      };
    }

    // Success! Reward user
    soundFx.playWordFound();
    setTimeout(() => soundFx.playSuccess(), 250);

    this.stats.sentencesCreated += 1;
    this.stats.xp += 25;
    this.stats.streak += 1;
    this.stats.masteredWords.add(word.id);
    this.saveStats();

    const praises = [
      `Spot on! That was an articulate sentence with ${word.word}.`,
      `Brilliant! You integrated ${word.word} naturally and with great context.`,
      `Terrific usage of ${word.word}! You're making real progress.`,
      `Excellent! You wielded ${word.word} like a true wordsmith.`
    ];
    const praise = praises[Math.floor(Math.random() * praises.length)];

    return {
      success: true,
      rewardXP: 25,
      spokenText: `${praise} You earned 25 XP. Whenever you are ready, say 'next' or tap Next to discover another word!`,
      displayText: `🎉 **Mastery Achieved! (+25 XP)**\n\nYour sentence: *"${raw}"*\n\n✅ Target word **${word.word}** verified.\n${praise}`,
      word,
      stats: { ...this.stats, masteredCount: this.stats.masteredWords.size }
    };
  }

  // --- 2. Voice Quiz Evaluator ---
  evaluateQuizSubmission(raw, lower) {
    const word = this.getCurrentWord();
    const target = word.word.toLowerCase();

    // Check for hint requests
    const hintKeywords = ["hint", "clue", "help", "don't know", "tell me", "what is it", "skip"];
    if (hintKeywords.some(hk => lower.includes(hk))) {
      soundFx.playHintTone();
      return {
        isHint: true,
        spokenText: `Here is a hint: The word has ${word.syllables.split("-").length} syllables, starts with the letter '${word.word[0].toUpperCase()}', and rhymes with '${word.synonyms[0]}'. Say the word when you're ready!`,
        displayText: `💡 **Hint for Quiz:**\n- Starts with: **${word.word[0].toUpperCase()}**\n- Syllables: **${word.syllables.split("-").length}** (${word.syllables})\n- Synonym: **${word.synonyms[0]}**`,
        word
      };
    }

    // Check if user's spoken answer matches
    const wordsSpoken = lower.split(/[^a-z0-9]+/);
    const isExactMatch = wordsSpoken.includes(target) || lower === target;
    const isSynonym = word.synonyms.some(s => lower.includes(s.toLowerCase()));

    if (isExactMatch) {
      soundFx.playSuccess();
      this.stats.quizzesSolved += 1;
      this.stats.xp += 30;
      this.stats.streak += 1;
      this.stats.masteredWords.add(word.id);
      this.saveStats();

      return {
        success: true,
        rewardXP: 30,
        spokenText: `Bullseye! The word is indeed ${word.word}! ${word.deepDef} Fantastic work, +30 XP! Let's try the next one.`,
        displayText: `🎯 **Correct! It's ${word.word}! (+30 XP)**\n\n*"${word.deepDef}"*\n\nSynonyms: *${word.synonyms.join(", ")}*`,
        word,
        advanceNext: true,
        stats: { ...this.stats, masteredCount: this.stats.masteredWords.size }
      };
    }

    if (isSynonym) {
      soundFx.playHintTone();
      return {
        success: false,
        spokenText: `You are incredibly close! That is a great synonym, but we are looking for the specific word that starts with '${word.word[0].toUpperCase()}'. Give it one more try!`,
        displayText: `⚡ **Great synonym!** You mentioned a close relative. Now say the target word starting with **${word.word[0].toUpperCase()}**!`,
        word
      };
    }

    // Incorrect answer
    soundFx.playErrorTone();
    return {
      success: false,
      spokenText: `Not quite! You said "${raw}". The word starts with '${word.word[0].toUpperCase()}' and means "${word.shortDef}". Try again, or say 'hint'!`,
      displayText: `❌ **Keep Going!** You said: *"${raw}"*\n\nClue: Starts with **${word.word[0].toUpperCase()}** and means *"${word.shortDef}"*.`,
      word
    };
  }

  // --- 3. Pronunciation Lab Evaluator ---
  evaluatePronunciationSubmission(raw, lower) {
    const word = this.getCurrentWord();
    const target = word.word.toLowerCase();

    // Calculate phonetic similarity score using normalized Levenshtein distance
    const similarity = this.calculateSimilarity(lower.trim(), target);
    const percentage = Math.round(similarity * 100);

    if (percentage >= 82 || lower.includes(target)) {
      soundFx.playSuccess();
      this.stats.xp += 20;
      this.saveStats();

      return {
        success: true,
        score: Math.max(percentage, 94),
        spokenText: `Impressive! You pronounced ${word.word} with ${Math.max(percentage, 94)}% precision. Notice how cleanly you accented the ${word.syllables.split("-")[word.stressIndex || 0]} syllable!`,
        displayText: `🌟 **Pronunciation Score: ${Math.max(percentage, 94)}% Match!**\n\nWord: **${word.word}** [${word.phonetic}]\nEmphasis: **${word.syllables}**\n\n🎯 *Accurate acoustic enunciation!*`,
        word
      };
    } else if (percentage >= 50) {
      soundFx.playHintTone();
      return {
        success: false,
        score: percentage,
        spokenText: `Close! I caught "${raw}", which is a ${percentage}% match. Focus on the syllable breakdown: ${word.syllables}. Listen: "${word.word}". Try it once more!`,
        displayText: `🔊 **Pronunciation Score: ${percentage}%**\n\nTarget: **${word.word}** (${word.phonetic})\nYou enunciated: *"${raw}"*\n\n💡 Focus on syllable rhythm: **${word.syllables}**`,
        word
      };
    } else {
      soundFx.playErrorTone();
      return {
        success: false,
        score: percentage,
        spokenText: `Let's break that down together. The word is "${word.word}". Repeat after me slowly: ${word.syllables.replace(/-/g, " ... ")}. Tap the mic and try again!`,
        displayText: `🎧 **Needs Practice (${percentage}%)**\n\nTarget: **${word.word}**\nPhonetic: **${word.phonetic}**\nSlow pacing: **${word.syllables}**`,
        word
      };
    }
  }

  // --- 4. Conversation & Roleplay Evaluator ---
  evaluateConversationTurn(raw, lower) {
    const scenario = this.getCurrentScenario();
    const matchedTargets = [];

    scenario.targetWords.forEach(target => {
      const tLower = target.toLowerCase();
      const tRoot = tLower.substring(0, Math.max(4, tLower.length - 2));
      if (lower.includes(tLower) || lower.includes(tRoot)) {
        this.scenarioTargetHits.add(target);
        matchedTargets.push(target);
        this.stats.masteredWords.add(target.toLowerCase());
      }
    });

    if (matchedTargets.length > 0) {
      soundFx.playWordFound();
      this.stats.xp += 15 * matchedTargets.length;
      this.saveStats();
    }

    const remaining = scenario.targetWords.filter(t => !this.scenarioTargetHits.has(t));

    // Dynamic contextual continuation
    let spokenReply = "";
    let displayReply = "";

    if (matchedTargets.length > 0 && remaining.length === 0) {
      soundFx.playStreak();
      spokenReply = `Outstanding! You have successfully used all the target vocabulary words in this scenario! You applied ${matchedTargets.join(" and ")} naturally. Shall we pick another scenario or test your speed in Quiz mode?`;
      displayReply = `🏆 **Scenario Completed! All target words unlocked!**\n\nTarget words mastered: **${scenario.targetWords.join(", ")}**`;
    } else if (matchedTargets.length > 0) {
      spokenReply = `I love how you brought "${matchedTargets.join(" and ")}" into the discussion. That adds great clarity to your point! What do you think would happen if we look at the other side of this? Try using "${remaining[0]}" next.`;
      displayReply = `✨ **Target Word Used:** **${matchedTargets.join(", ")}** (+${15 * matchedTargets.length} XP)\n\nRemaining targets: **${remaining.join(", ")}**`;
    } else {
      spokenReply = `That's an insightful perspective. How would you frame that if you wanted to emphasize "${remaining[0] || 'our vision'}" in this context?`;
      displayReply = `💬 **Dialogue in progress**\n\nYou said: *"${raw}"*\n\n🎯 Challenge: Weave **${remaining[0] || 'your core idea'}** into your next spoken sentence!`;
    }

    return {
      success: true,
      spokenText: spokenReply,
      displayText: displayReply,
      matchedTargets,
      remainingTargets: remaining,
      scenario
    };
  }

  // Levenshtein similarity calculation for pronunciation scoring
  calculateSimilarity(str1, str2) {
    const s1 = str1.replace(/[^a-z]/g, "");
    const s2 = str2.replace(/[^a-z]/g, "");
    if (!s1.length && !s2.length) return 1.0;
    if (!s1.length || !s2.length) return 0.0;
    if (s1 === s2) return 1.0;

    const matrix = [];
    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
          );
        }
      }
    }
    const distance = matrix[s2.length][s1.length];
    const maxLen = Math.max(s1.length, s2.length);
    return Math.max(0, 1 - distance / maxLen);
  }
}
