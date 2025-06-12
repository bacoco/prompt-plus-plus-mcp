const Anthropic = require('@anthropic-ai/sdk');
const dotenv = require('dotenv');

dotenv.config();

class ClaudeProcessor {
  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY;
    this.enabled = !!this.apiKey;
    
    if (this.enabled) {
      this.anthropic = new Anthropic({
        apiKey: this.apiKey,
      });
      console.log('Claude processor initialized successfully');
    } else {
      console.log('Claude processor not available: No ANTHROPIC_API_KEY found in environment');
    }
  }

  isEnabled() {
    return this.enabled;
  }

  // Check if content looks like a metaprompt template
  isMetapromptTemplate(content) {
    if (typeof content !== 'string') return false;
    
    // Check for common metaprompt patterns
    const patterns = [
      /\[Insert initial prompt here\]/i,
      /\[USER_PROMPT\]/i,
      /Process the meta-prompt completely/i,
      /You are an expert prompt engineer/i,
      /Meta-prompt template:/i,
      /Apply the .* meta-prompt template/i
    ];
    
    return patterns.some(pattern => pattern.test(content));
  }

  // Process a metaprompt template with Claude
  async processMetaprompt(template, userPrompt) {
    if (!this.enabled) {
      throw new Error('Claude processor not enabled. Please set ANTHROPIC_API_KEY in .env file');
    }

    try {
      // Replace placeholders with the actual user prompt
      const processedTemplate = template
        .replace(/\[Insert initial prompt here\]/gi, userPrompt)
        .replace(/\[USER_PROMPT\]/gi, userPrompt)
        .replace(/Initial prompt: .*/gi, `Initial prompt: ${userPrompt}`);

      const message = await this.anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4000,
        temperature: 0.7,
        system: "You are an expert prompt engineer. Process the given metaprompt template and return a refined prompt following the instructions exactly.",
        messages: [
          {
            role: 'user',
            content: processedTemplate
          }
        ]
      });

      return message.content[0].text;
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error(`Failed to process with Claude: ${error.message}`);
    }
  }

  // Extract JSON from Claude's response
  extractJSON(response) {
    // Try to find JSON in <json> tags first
    const jsonMatch = response.match(/<json>([\s\S]*?)<\/json>/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.warn('Failed to parse JSON from tags:', e);
      }
    }

    // Try to find JSON in code blocks
    const codeBlockMatch = response.match(/```json\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1]);
      } catch (e) {
        console.warn('Failed to parse JSON from code block:', e);
      }
    }

    // Try to parse the entire response as JSON
    try {
      return JSON.parse(response);
    } catch (e) {
      // If all else fails, return null
      return null;
    }
  }
}

module.exports = { ClaudeProcessor };