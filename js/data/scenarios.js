/**
 * LexiVoice - Contextual Conversation & Roleplay Scenarios
 */
export const SCENARIOS = [
  {
    id: "executive-meeting",
    title: "Executive Strategy & Pitch",
    badge: "Business",
    description: "You are presenting an AI innovation proposal to an executive board member (Lexi).",
    targetWords: ["Leverage", "Mitigate", "Paradigm", "Viable"],
    initialPrompt: "Good afternoon! I'm eager to hear your proposal. Our competitors are moving quickly, but our board is cautious about costs and risks. How do you plan to leverage our current team, and what is your plan to mitigate the risks?",
    role: "Lexi (Executive Director)"
  },
  {
    id: "art-criticism",
    title: "Art Gallery & Film Salon",
    badge: "Literary",
    description: "You and Lexi are discussing a controversial, award-winning indie film over espresso.",
    targetWords: ["Visceral", "Resplendent", "Juxtapose", "Ephemeral"],
    initialPrompt: "I just finished watching that new indie festival winner! The final scene was so intense—it struck such a visceral chord with me. What did you think about how the director chose to juxtapose past and present memories?",
    role: "Lexi (Film & Art Critic)"
  },
  {
    id: "career-interview",
    title: "Leadership Job Interview",
    badge: "Professional",
    description: "Lexi is interviewing you for a senior leadership role, testing your communication style.",
    targetWords: ["Articulate", "Resilient", "Pragmatic", "Nuance"],
    initialPrompt: "Welcome to our final interview round! In this role, you will be balancing ambitious targets with high-pressure cross-functional teams. Can you tell me about a time when you had to be especially resilient and pragmatic when a major project went off track?",
    role: "Lexi (Head of Talent)"
  },
  {
    id: "future-tech-cafe",
    title: "Tech Ethics & Future Cafe",
    badge: "Tech & Society",
    description: "A casual intellectual debate at a cafe about whether technology is making life simpler or more obscure.",
    targetWords: ["Ubiquitous", "Obfuscate", "Caveat", "Mellifluous"],
    initialPrompt: "It's wild how voice assistants and AI algorithms have become completely ubiquitous in our apartments and cars. But sometimes I worry that tech companies intentionally obfuscate how their privacy policies work. What is your take on this balance?",
    role: "Lexi (Tech Philosopher)"
  }
];
