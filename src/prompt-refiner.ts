import type { AutoSelectionResult, ComparisonResult, StrategyScore } from './types.js';
import type { StrategyManager } from './strategy-manager.js';

export class PromptRefiner {
  constructor(private strategyManager: StrategyManager) {}

  autoSelectStrategy(prompt: string): AutoSelectionResult {
    const promptLower = prompt.toLowerCase();
    const wordCount = prompt.split(/\s+/).length;
    
    let recommendedKey: string;
    let reason: string;
    
    // AI Core Principles - Critical Thinking Enhancement
    if (this.hasKeywords(promptLower, ["assumption", "assume", "suppose", "expect", "implicit", "given that"])) {
      recommendedKey = "assumption_detector";
      reason = "Systematically challenge hidden assumptions to reveal better solutions";
    } else if (this.hasKeywords(promptLower, ["decision", "choice", "alternative", "option", "should we", "vs", "versus"])) {
      recommendedKey = "devils_advocate";
      reason = "Generate counterarguments to test decision robustness";
    } else if (this.hasKeywords(promptLower, ["consequences", "impact", "effects", "ripple", "cascade", "downstream"])) {
      recommendedKey = "ripple_effect";
      reason = "Analyze cascading effects across systems and time";
    } else if (this.hasKeywords(promptLower, ["stakeholder", "perspective", "viewpoint", "different", "various", "multiple views"])) {
      recommendedKey = "perspective_multiplier";
      reason = "Examine problem through multiple stakeholder lenses";
    } else if (this.hasKeywords(promptLower, ["evidence", "proof", "data", "validate", "verify", "support", "basis"])) {
      recommendedKey = "evidence_seeker";
      reason = "Demand concrete evidence before accepting claims";
    } else if (this.hasKeywords(promptLower, ["pattern", "similar", "recurring", "repeated", "trend", "common"])) {
      recommendedKey = "pattern_recognizer";
      reason = "Identify patterns and anti-patterns for better solutions";
    } else if (this.hasKeywords(promptLower, ["why", "root cause", "underlying", "fundamental", "source", "origin"])) {
      recommendedKey = "root_cause_analyzer";
      reason = "Drill down to fundamental causes rather than symptoms";
    } else if (this.hasKeywords(promptLower, ["constraint", "limitation", "bound", "restrict", "cannot", "impossible"])) {
      recommendedKey = "constraint_identifier";
      reason = "Map and challenge constraints to expand solution space";
    } else if (this.hasKeywords(promptLower, ["paradox", "contradiction", "both", "conflicting", "opposing", "tension"])) {
      recommendedKey = "paradox_navigator";
      reason = "Resolve contradictory requirements through creative synthesis";
    } else if (this.hasKeywords(promptLower, ["tradeoff", "sacrifice", "cost", "benefit", "exchange", "compromise"])) {
      recommendedKey = "tradeoff_tracker";
      reason = "Make all tradeoffs explicit including hidden costs";
    } else if (this.hasKeywords(promptLower, ["context", "broader", "bigger picture", "scope", "system", "holistic"])) {
      recommendedKey = "context_expander";
      reason = "Expand context to prevent local optimization problems";
    } else if (this.hasKeywords(promptLower, ["vague", "unclear", "ambiguous", "specific", "precise", "clarify"])) {
      recommendedKey = "precision_questioner";
      reason = "Transform vague requirements into precise specifications";
    } else if (this.hasKeywords(promptLower, ["future", "long-term", "maintainability", "evolution", "years", "legacy"])) {
      recommendedKey = "time_capsule_test";
      reason = "Project decisions across time horizons for durability";
    
    // Vibe Coding Rules - AI-Assisted Development
    } else if (this.hasKeywords(promptLower, ["template", "boilerplate", "starter", "scaffold", "foundation", "begin"])) {
      recommendedKey = "start_from_template";
      reason = "Leverage proven templates for faster, better foundations";
    } else if (this.hasKeywords(promptLower, ["agent", "assistant", "ai help", "copilot", "pair", "collaborate"])) {
      recommendedKey = "use_agent_mode";
      reason = "Optimize AI-assisted development workflow";
    } else if (this.hasKeywords(promptLower, ["test", "tdd", "testing", "spec", "behavior", "should"])) {
      recommendedKey = "write_tests_first";
      reason = "Test-driven development for clarity and quality";
    } else if (this.hasKeywords(promptLower, ["file", "large", "complex", "modular", "organize", "structure"])) {
      recommendedKey = "keep_files_small";
      reason = "Maintain modular, readable code through size constraints";
    } else if (this.hasKeywords(promptLower, ["local", "test", "frequently", "feedback", "quick", "iteration"])) {
      recommendedKey = "run_locally_test_frequently";
      reason = "Establish rapid feedback loops for continuous validation";
    } else if (this.hasKeywords(promptLower, ["pattern", "convention", "consistent", "style", "existing", "follow"])) {
      recommendedKey = "follow_existing_patterns";
      reason = "Maintain consistency by following established patterns";
    } else if (this.hasKeywords(promptLower, ["delete", "remove", "cleanup", "dead code", "unused", "simplify"])) {
      recommendedKey = "delete_aggressively";
      reason = "Remove unnecessary complexity and dead code";
    } else if (this.hasKeywords(promptLower, ["small", "incremental", "deploy", "ship", "release", "gradual"])) {
      recommendedKey = "ship_small_changes";
      reason = "Deploy small, safe increments for faster feedback";
    } else if (this.hasKeywords(promptLower, ["collaborate", "team", "together", "share", "communicate", "align"])) {
      recommendedKey = "collaborate_early_often";
      reason = "Engage stakeholders throughout development";
    } else if (this.hasKeywords(promptLower, ["refactor", "improve", "clean", "quality", "technical debt", "maintainability"])) {
      recommendedKey = "refactor_continuously";
      reason = "Improve code structure as part of regular development";
    } else if (this.hasKeywords(promptLower, ["document", "why", "intent", "decision", "rationale", "purpose"])) {
      recommendedKey = "document_intent";
      reason = "Document why decisions were made, not how code works";
    
    // Advanced Thinking Strategies
    } else if (this.hasKeywords(promptLower, ["thinking", "cognitive", "bias", "assumption", "meta", "recursive", "self-reflection"])) {
      recommendedKey = "metacognitive";
      reason = "Meta-cognitive reflection for examining thinking processes and cognitive biases";
    } else if (this.hasKeywords(promptLower, ["attack", "defend", "secure", "vulnerability", "stress test", "robust", "adversarial"])) {
      recommendedKey = "adversarial";
      reason = "Adversarial red-blue team approach for stress-testing and fortification";
    } else if (this.hasKeywords(promptLower, ["scale", "pattern", "recursive", "self-similar", "fractal", "hierarchy", "decomposition"])) {
      recommendedKey = "fractal";
      reason = "Fractal recursive decomposition for scale-invariant problem solving";
    } else if (this.hasKeywords(promptLower, ["uncertainty", "multiple", "parallel", "probability", "quantum", "superposition", "ambiguous"])) {
      recommendedKey = "quantum";
      reason = "Quantum superposition thinking for navigating uncertainty and parallel possibilities";
    } else if (this.hasKeywords(promptLower, ["time", "timeline", "historical", "future", "past", "temporal", "causality", "evolution"])) {
      recommendedKey = "temporal";
      reason = "Temporal multi-timeline analysis for time-aware problem solving";
    } else if (this.hasKeywords(promptLower, ["combine", "synthesis", "fusion", "innovation", "cross-domain", "disparate", "creative fusion"])) {
      recommendedKey = "synthesis";
      reason = "Synthesis fusion engine for combining disparate concepts and breakthrough innovation";
    } else if (this.hasKeywords(promptLower, ["story", "creative", "narrative", "fiction"])) {
      recommendedKey = "star";
      reason = "Comprehensive approach ideal for creative and narrative tasks";
    } else if (this.hasKeywords(promptLower, ["architecture", "system design", "microservices", "scalability", "enterprise"])) {
      recommendedKey = "architect";
      reason = "Specialized approach for software architecture and system design";
    } else if (this.hasKeywords(promptLower, ["review", "code review", "quality", "security issues", "standards", "best practices"])) {
      recommendedKey = "reviewer";
      reason = "Comprehensive code review and quality assurance framework";
    } else if (this.hasKeywords(promptLower, ["iterative", "testing", "development cycle", "feedback", "refactor"])) {
      recommendedKey = "boomerang";
      reason = "Iterative development approach with continuous improvement cycles";
    } else if (this.hasKeywords(promptLower, ["devops", "ci/cd", "deployment", "infrastructure", "docker", "kubernetes"])) {
      recommendedKey = "devops";
      reason = "DevOps and infrastructure automation approach";
    } else if (this.hasKeywords(promptLower, ["code", "programming", "technical", "implement", "function", "api", "database"])) {
      recommendedKey = "boomerang";
      reason = "Iterative development approach perfect for complex coding tasks";
    } else if (this.hasKeywords(promptLower, ["math", "proof", "equation", "theorem", "formula"])) {
      recommendedKey = "math";
      reason = "Specialized approach for mathematical and formal reasoning";
    } else if (this.hasKeywords(promptLower, ["analyze", "compare", "evaluate", "scientific"])) {
      recommendedKey = "physics";
      reason = "Balanced analytical approach for scientific analysis";
    } else if (this.hasKeywords(promptLower, ["optimize", "improve", "enhance", "refine"])) {
      recommendedKey = "bolism";
      reason = "Optimization-focused approach for improvement tasks";
    } else if (wordCount < 15) {
      recommendedKey = "morphosis";
      reason = "Simple and efficient approach for short prompts";
    } else if (wordCount > 50) {
      recommendedKey = "star";
      reason = "Comprehensive approach for complex, detailed prompts";
    } else {
      recommendedKey = "done";
      reason = "Well-rounded approach with role-playing and advanced techniques";
    }

    const strategy = this.strategyManager.getStrategy(recommendedKey);
    
    // Determine alternative with AI Core Principles, Vibe Coding Rules, and existing strategies
    const alternatives: Record<string, string> = {
      // AI Core Principles alternatives
      "assumption_detector": "devils_advocate",
      "devils_advocate": "assumption_detector", 
      "ripple_effect": "context_expander",
      "perspective_multiplier": "evidence_seeker",
      "evidence_seeker": "precision_questioner",
      "pattern_recognizer": "root_cause_analyzer",
      "root_cause_analyzer": "pattern_recognizer",
      "constraint_identifier": "paradox_navigator",
      "paradox_navigator": "constraint_identifier",
      "tradeoff_tracker": "time_capsule_test",
      "context_expander": "ripple_effect",
      "precision_questioner": "evidence_seeker",
      "time_capsule_test": "tradeoff_tracker",
      
      // Vibe Coding Rules alternatives
      "start_from_template": "follow_existing_patterns",
      "use_agent_mode": "collaborate_early_often",
      "write_tests_first": "run_locally_test_frequently",
      "keep_files_small": "refactor_continuously",
      "run_locally_test_frequently": "write_tests_first",
      "follow_existing_patterns": "start_from_template",
      "delete_aggressively": "refactor_continuously",
      "ship_small_changes": "run_locally_test_frequently",
      "collaborate_early_often": "use_agent_mode",
      "refactor_continuously": "keep_files_small",
      "document_intent": "follow_existing_patterns",
      
      // Original strategies
      "star": "verse",
      "verse": "physics", 
      "math": "arpe",
      "physics": "verse",
      "morphosis": "phor",
      "done": "star",
      "bolism": "touille",
      "arpe": "math",
      "phor": "morphosis",
      "touille": "done",
      "architect": "devops",
      "boomerang": "reviewer",
      "reviewer": "boomerang",
      "devops": "architect",
      "metacognitive": "adversarial",
      "adversarial": "fractal",
      "fractal": "quantum",
      "quantum": "temporal",
      "temporal": "synthesis",
      "synthesis": "metacognitive"
    };
    
    const alternativeKey = alternatives[recommendedKey] || "star";
    const alternativeStrategy = this.strategyManager.getStrategy(alternativeKey);
    
    return {
      user_query: prompt,
      recommended_strategy: recommendedKey,
      strategy_name: strategy?.name || recommendedKey,
      reason,
      alternative: alternativeKey,
      alternative_name: alternativeStrategy?.name || alternativeKey,
      prompt_characteristics: {
        word_count: wordCount,
        detected_type: this.detectPromptType(promptLower)
      }
    };
  }

  compareStrategies(prompt: string, strategyKeys?: string[]): ComparisonResult {
    if (!strategyKeys) {
      // Auto-select top 3 strategies
      const autoSelection = this.autoSelectStrategy(prompt);
      strategyKeys = [
        autoSelection.recommended_strategy,
        autoSelection.alternative,
        "physics" // Default third option
      ];
      // Ensure uniqueness
      strategyKeys = [...new Set(strategyKeys)].slice(0, 3);
    }

    const comparisons: Record<string, any> = {};
    for (const key of strategyKeys) {
      const strategy = this.strategyManager.getStrategy(key);
      if (strategy) {
        const score = this.scoreStrategyFit(prompt, strategy);
        comparisons[key] = {
          name: strategy.name,
          suitability: score.suitability,
          complexity: score.complexity,
          strengths: score.strengths
        };
      }
    }

    // Determine best match
    const bestKey = Object.keys(comparisons).reduce((a, b) => 
      comparisons[a].suitability > comparisons[b].suitability ? a : b
    );

    return {
      prompt,
      comparisons,
      recommendation: bestKey,
      reasoning: `Based on the analysis, '${comparisons[bestKey].name}' is the best fit due to its ${comparisons[bestKey].strengths.join(', ')}`
    };
  }

  private hasKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  private detectPromptType(promptLower: string): string {
    if (this.hasKeywords(promptLower, ["story", "creative", "narrative"])) {
      return "creative";
    } else if (this.hasKeywords(promptLower, ["code", "programming", "technical"])) {
      return "technical";
    } else if (this.hasKeywords(promptLower, ["math", "proof", "equation"])) {
      return "mathematical";
    } else if (this.hasKeywords(promptLower, ["analyze", "scientific", "research"])) {
      return "analytical";
    } else {
      return "general";
    }
  }

  private scoreStrategyFit(prompt: string, strategy: any): StrategyScore {
    const promptLower = prompt.toLowerCase();
    const descriptionLower = strategy.description.toLowerCase();
    const strategyKey = strategy.key;
    
    let suitability = 50; // Base score
    let complexity = 50;
    const strengths: string[] = [];
    
    // Enhanced scoring for code-focused strategies
    if (strategyKey === "architect" || descriptionLower.includes("architecture")) {
      if (this.hasKeywords(promptLower, ["architecture", "system design", "microservices", "scalability", "design"])) {
        suitability += 35;
        strengths.push("architecture specialization");
      }
    }
    
    if (strategyKey === "boomerang" || descriptionLower.includes("iterative")) {
      if (this.hasKeywords(promptLower, ["testing", "refactor", "iterative", "development", "api", "build"])) {
        suitability += 30;
        strengths.push("iterative development");
      }
    }
    
    if (strategyKey === "reviewer" || descriptionLower.includes("review")) {
      if (this.hasKeywords(promptLower, ["review", "code review", "quality", "security", "standards"])) {
        suitability += 35;
        strengths.push("code review expertise");
      }
    }
    
    if (strategyKey === "devops" || descriptionLower.includes("devops")) {
      if (this.hasKeywords(promptLower, ["devops", "ci/cd", "pipeline", "deployment", "infrastructure", "docker"])) {
        suitability += 35;
        strengths.push("devops specialization");
      }
    }
    
    // Check for keywords that match strategy strengths
    if (descriptionLower.includes("creative") || descriptionLower.includes("story")) {
      if (this.hasKeywords(promptLower, ["story", "creative", "narrative", "fiction"])) {
        suitability += 20;
        strengths.push("creative focus");
      }
    }
    
    if (descriptionLower.includes("technical") || descriptionLower.includes("code")) {
      if (this.hasKeywords(promptLower, ["code", "technical", "programming", "algorithm"])) {
        suitability += 20;
        strengths.push("technical expertise");
      }
    }
    
    if (descriptionLower.includes("math")) {
      if (this.hasKeywords(promptLower, ["math", "equation", "proof", "theorem"])) {
        suitability += 30;
        strengths.push("mathematical reasoning");
      }
    }
    
    if (descriptionLower.includes("scientific")) {
      if (this.hasKeywords(promptLower, ["scientific", "research", "hypothesis", "experiment"])) {
        suitability += 20;
        strengths.push("scientific approach");
      }
    }
    
    const wordCount = prompt.split(/\s+/).length;
    
    if (descriptionLower.includes("comprehensive") || descriptionLower.includes("multi-stage")) {
      if (wordCount > 30) {
        suitability += 15;
        strengths.push("handles complex prompts");
      }
    }
    
    if (descriptionLower.includes("simple") || descriptionLower.includes("quick")) {
      if (wordCount < 20) {
        suitability += 15;
        strengths.push("efficient for simple tasks");
      }
    }
    
    // Complexity scoring
    if (wordCount > 50) {
      complexity = 80;
    } else if (wordCount < 20) {
      complexity = 30;
    } else {
      complexity = 50;
    }
    
    // Ensure suitability stays within bounds
    suitability = Math.min(100, suitability);
    
    if (strengths.length === 0) {
      strengths.push("general purpose");
    }
    
    return {
      suitability,
      complexity,
      strengths
    };
  }
}