/**
 * AI Tutor Module - Gemini API Integration
 * Provides AI-powered tutoring for science learning
 */

export class AITutor {
  constructor() {
    this.apiKey = null;
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    this.conversationHistory = [];
    this.currentContext = null;
    this.isConfigured = false;

    // Load API key from localStorage if available
    this.loadApiKey();
  }

  /**
   * Load API key from localStorage
   */
  loadApiKey() {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      this.apiKey = savedKey;
      this.isConfigured = true;
    }
  }

  /**
   * Save API key to localStorage
   */
  setApiKey(key) {
    this.apiKey = key;
    localStorage.setItem('gemini_api_key', key);
    this.isConfigured = true;
  }

  /**
   * Clear API key
   */
  clearApiKey() {
    this.apiKey = null;
    localStorage.removeItem('gemini_api_key');
    this.isConfigured = false;
  }

  /**
   * Check if API is configured
   */
  checkConfiguration() {
    return this.isConfigured && this.apiKey;
  }

  /**
   * Set current learning context
   */
  setContext(context) {
    this.currentContext = context;
  }

  /**
   * Build system prompt based on current context
   */
  buildSystemPrompt() {
    let systemPrompt = `You are an AI Tutor specialized in science education. Please explain physics, biology, and chemistry to students in a friendly and easy-to-understand way.

Key Roles:
- Explain science concepts clearly
- Provide explanations for current experiments/simulations
- Step-by-step answers to questions
- Provide hints and examples to help learning

Response Rules:
- Respond in English
- Concise but complete explanations
- Use text for mathematical formulas
- Use real-world examples`;

    if (this.currentContext) {
      systemPrompt += `\n\nCurrent learning context:\n- Topic: ${this.currentContext.topic || 'General Science'}\n- Experiment: ${this.currentContext.experiment || 'None'}\n- Subject: ${this.currentContext.subject || 'Science'}`;
    }

    return systemPrompt;
  }

  /**
   * Send message to AI and get response
   */
  async sendMessage(message) {
    if (!this.checkConfiguration()) {
      return {
        success: false,
        error: 'API key not set. Please enter your Gemini API key in settings.'
      };
    }

    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      parts: [{ text: message }]
    });

    try {
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: this.buildSystemPrompt() }]
            },
            ...this.conversationHistory
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API request failed');
      }

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received.';

      // Add AI response to history
      this.conversationHistory.push({
        role: 'model',
        parts: [{ text: aiResponse }]
      });

      return {
        success: true,
        message: aiResponse
      };

    } catch (error) {
      console.error('AI Tutor error:', error);
      return {
        success: false,
        error: error.message || 'An unknown error occurred.'
      };
    }
  }

  /**
   * Get explanation for current experiment
   */
  async explainExperiment(experimentName, experimentData = {}) {
    const prompt = `Current experiment: "${experimentName}".
        
Experiment data:
${JSON.stringify(experimentData, null, 2)}

Please explain the scientific principles and observable phenomena for this experiment.`;

    return await this.sendMessage(prompt);
  }

  /**
   * Get learning hints
   */
  async getHint(topic) {
    const prompt = `Please provide a hint or tip to help understand "${topic}".`;
    return await this.sendMessage(prompt);
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
  }

  /**
   * Get quick explanations for physics concepts
   */
  getQuickExplanation(concept) {
    const explanations = {
      'gravity': {
        title: 'Gravity',
        formula: 'F = G × (m₁ × m₂) / r²',
        description: 'Every object attracts each other with a gravitational force proportional to their mass.',
        realWorld: 'Why an apple falls to the ground, why the moon orbits the earth'
      },
      'momentum': {
        title: 'Momentum',
        formula: 'p = m × v',
        description: 'The product of an object\'s mass and velocity, representing the quantity of motion.',
        realWorld: 'Billiard ball collisions, rocket propulsion'
      },
      'energy': {
        title: 'Law of Conservation of Energy',
        formula: 'E_total = E_kinetic + E_potential',
        description: 'Energy can change form but the total amount is conserved.',
        realWorld: 'Roller coasters, pendulum clocks'
      },
      'friction': {
        title: 'Friction',
        formula: 'f = μ × N',
        description: 'A force that opposes the motion of an object, depending on the nature of the contact surface.',
        realWorld: 'Car brakes, walking'
      }
    };

    return explanations[concept] || null;
  }
}

// Science subjects and topics
export const ScienceTopics = {
  physics: {
    name: 'Physics',
    icon: '⚡',
    topics: [
      { id: 'mechanics', name: 'Mechanics', subtopics: ['Free Fall', 'Pendulum', 'Collision', 'Inclined Plane'] },
      { id: 'waves', name: 'Waves', subtopics: ['Sound', 'Light', 'Interference'] },
      { id: 'thermodynamics', name: 'Thermodynamics', subtopics: ['Heat Transfer', 'Gas Laws'] },
      { id: 'electromagnetism', name: 'Electromagnetism', subtopics: ['Electric Field', 'Magnetic Field', 'Electromagnetic Induction'] }
    ]
  },
  biology: {
    name: 'Biology',
    icon: '🧬',
    topics: [
      { id: 'cell', name: 'Cell Biology', subtopics: ['Cell Structure', 'Cell Division', 'Photosynthesis'] },
      { id: 'genetics', name: 'Genetics', subtopics: ['DNA Structure', 'Inheritance', 'Mutation'] },
      { id: 'anatomy', name: 'Anatomy', subtopics: ['Circulatory System', 'Nervous System', 'Digestive System'] },
      { id: 'ecology', name: 'Ecology', subtopics: ['Food Chain', 'Ecosystem'] }
    ]
  },
  chemistry: {
    name: 'Chemistry',
    icon: '⚗️',
    topics: [
      { id: 'atomic', name: 'Atomic Theory', subtopics: ['Atomic Structure', 'Electron Configuration', 'Periodic Table'] },
      { id: 'molecular', name: 'Molecular Structure', subtopics: ['Chemical Bonds', 'Molecular Geometry', 'Polarity'] },
      { id: 'reactions', name: 'Reactions', subtopics: ['Oxidation-Reduction', 'Acid-Base', 'Reaction Rates'] }
    ]
  }
};
