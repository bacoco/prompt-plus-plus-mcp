# Prompt++ User Guide

Complete guide to using the Prompt++ MCP Server with real-world examples and workflows.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Workflow Patterns](#workflow-patterns)
3. [Strategy Categories](#strategy-categories)
4. [Real-World Examples](#real-world-examples)
5. [Advanced Usage](#advanced-usage)
6. [Performance Tips](#performance-tips)
7. [Troubleshooting](#troubleshooting)

## Getting Started

### Basic Setup Verification

After installation, verify the server is working:

```
Use health_check tool
```

**Expected Response:**
```json
{
  "server_status": "running",
  "strategy_manager": {
    "healthy": true,
    "strategiesCount": 44,
    "categoriesCount": 5,
    "cacheSize": 0
  },
  "workflows_available": ["auto_refine", "refine_with", "compare_refinements", ...],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Quick Strategy Overview

```
Use discover_strategies tool
```

This shows all 44+ strategies organized by category with usage guidelines.

## Workflow Patterns

### 1. **Auto-Refine** (Fastest - 1 step)

**Best for**: Most common use cases, quick improvements

```
Use auto_refine prompt with user_prompt: "your prompt here"
```

**What happens:**
1. Analyzes prompt characteristics (keywords, length, domain)
2. Selects optimal strategy (95%+ accuracy)
3. Applies enhancement template
4. Returns refined prompt

### 2. **Two-Step Workflow** (Controlled - 2 steps)

**Best for**: When you want to see the strategy selection process

#### Step 1: Prepare
```
Use prepare_refinement prompt with user_prompt: "your prompt here"
```

**Output**: Metaprompt template with selected strategy

#### Step 2: Execute  
```
Use execute_refinement prompt with metaprompt_results: "..." and original_prompt: "your prompt here"
```

**Output**: Final polished prompt

### 3. **Three-Step Intelligent Workflow** (Most Precise - 3 steps)

**Best for**: Complex prompts requiring precise strategy targeting

#### Step 1: Category Selection
```
Use step1_get_categories prompt with user_prompt: "your prompt here"
```

**Claude selects**: Best category from 5 available options

#### Step 2: Strategy Selection
```
Use step2_get_strategies prompt with category_name: "selected_category" and user_prompt: "your prompt here"
```

**Claude selects**: Optimal strategy within chosen category

#### Step 3: Execute Strategy
```
Use step3_execute_strategy prompt with strategy_key: "selected_strategy" and user_prompt: "your prompt here"
```

**Output**: Precisely targeted enhanced prompt

### 4. **Direct Strategy Application** (Expert - 1 step)

**Best for**: When you know exactly which strategy to use

```
Use refine_with_[strategy_name] prompt with user_prompt: "your prompt here"
```

Examples:
- `refine_with_star` - Comprehensive enhancement
- `refine_with_assumption_detector` - Challenge assumptions
- `refine_with_boomerang` - Iterative development

## Strategy Categories

### 🔧 Core Strategies (10 strategies)

**When to use**: General-purpose prompt enhancement

| Strategy | Triggers | Best For |
|----------|----------|----------|
| **star** | Complex, creative, narrative | Multi-faceted problems requiring deep analysis |
| **done** | Structured, role-playing | Tasks with clear steps and deliverables |
| **physics** | Scientific, analyze, compare | Technical analysis requiring balanced approach |
| **morphosis** | Simple, quick | Fast improvements for straightforward prompts |
| **math** | Mathematical, proof, equation | Formal reasoning and mathematical problems |

**Example Usage:**
```
Use refine_with_star prompt with user_prompt: "Create a comprehensive marketing strategy for a new AI product"
```

### 💻 Software Development (4 strategies)

**When to use**: Code-related prompts

| Strategy | Triggers | Best For |
|----------|----------|----------|
| **architect** | Architecture, system design, microservices | Large-scale system planning |
| **boomerang** | Code, programming, iterative | Development with testing cycles |
| **reviewer** | Code review, quality, standards | Quality assurance and best practices |
| **devops** | CI/CD, deployment, infrastructure | Automation and deployment |

**Example Usage:**
```
Use refine_with_architect prompt with user_prompt: "Design a scalable e-commerce platform"
```

### 🧠 Advanced Thinking (6 strategies)

**When to use**: Complex cognitive challenges

| Strategy | Triggers | Best For |
|----------|----------|----------|
| **metacognitive** | Thinking, cognitive, bias | Self-reflection and bias analysis |
| **adversarial** | Attack, defend, vulnerability | Stress testing and security |
| **quantum** | Uncertainty, multiple, parallel | Handling ambiguous situations |
| **temporal** | Time, timeline, causality | Time-aware analysis |

**Example Usage:**
```
Use refine_with_adversarial prompt with user_prompt: "Evaluate the security of our authentication system"
```

### 🎯 AI Core Principles (13 strategies)

**When to use**: Critical thinking enhancement

| Strategy | Triggers | Best For |
|----------|----------|----------|
| **assumption_detector** | Assumption, suppose, expect | Challenging hidden assumptions |
| **devils_advocate** | Decision, choice, alternative | Testing decision robustness |
| **evidence_seeker** | Evidence, proof, validate | Demanding concrete validation |
| **root_cause_analyzer** | Why, root cause, fundamental | Finding underlying issues |

**Example Usage:**
```
Use refine_with_assumption_detector prompt with user_prompt: "We should migrate to microservices to improve scalability"
```

### 🤖 Vibe Coding Rules (11 strategies)

**When to use**: AI-assisted development optimization

| Strategy | Triggers | Best For |
|----------|----------|----------|
| **write_tests_first** | Test, TDD, behavior | Test-driven development |
| **use_agent_mode** | Agent, AI help, collaborate | AI-assisted workflows |
| **ship_small_changes** | Small, incremental, deploy | Continuous delivery |
| **refactor_continuously** | Refactor, improve, clean | Code quality improvement |

**Example Usage:**
```
Use refine_with_write_tests_first prompt with user_prompt: "Implement user authentication for our web app"
```

## Real-World Examples

### Example 1: Business Strategy Development

**Original Prompt:**
```
"Help me create a business plan"
```

**Auto-Refine Process:**
```
Use auto_refine prompt with user_prompt: "Help me create a business plan"
```

**Selected Strategy**: `perspective_multiplier` (AI Core Principles)

**Enhanced Prompt:**
```
Develop a comprehensive business plan by analyzing multiple stakeholder perspectives:

**Stakeholder Analysis:**
1. **Founders/Entrepreneurs:**
   - Vision and mission alignment
   - Resource requirements and constraints
   - Risk tolerance and exit strategies

2. **Investors/Funding Sources:**
   - ROI expectations and timeline
   - Market size and growth potential
   - Competitive advantages and barriers to entry

3. **Target Customers:**
   - Pain points and unmet needs
   - Customer acquisition and retention strategies
   - Pricing sensitivity and value proposition

4. **Competitors:**
   - Market positioning and differentiation
   - Competitive response scenarios
   - Blue ocean opportunities

5. **Regulatory/Legal:**
   - Compliance requirements
   - Intellectual property considerations
   - Industry regulations and standards

**Deliverables:**
- Executive summary addressing all stakeholder concerns
- Financial projections with multiple scenarios
- Risk assessment with mitigation strategies
- Go-to-market strategy with validation metrics
- Implementation roadmap with key milestones

**Validation Framework:**
- Customer interviews and market validation
- Financial model stress testing
- Competitive analysis and positioning
- Legal and regulatory compliance review
```

### Example 2: Technical Architecture Decision

**Original Prompt:**
```
"Should we use REST or GraphQL for our API?"
```

**3-Step Intelligent Workflow:**

#### Step 1:
```
Use step1_get_categories prompt with user_prompt: "Should we use REST or GraphQL for our API?"
```

**Result**: `software_development` category selected

#### Step 2:
```
Use step2_get_strategies prompt with category_name: "software_development" and user_prompt: "Should we use REST or GraphQL for our API?"
```

**Result**: `architect` strategy selected for system design focus

#### Step 3:
```
Use step3_execute_strategy prompt with strategy_key: "architect" and user_prompt: "Should we use REST or GraphQL for our API?"
```

**Enhanced Prompt:**
```
REFINED PROMPT:
Architectural Decision: REST vs GraphQL API Design

**System Architecture Considerations:**

**1. Application Context Analysis:**
- Current system architecture and technology stack
- Team expertise and learning curve requirements
- Performance requirements and scalability needs
- Client application types (web, mobile, third-party)

**2. Technical Trade-offs Evaluation:**

**REST API Advantages:**
- Simpler implementation and debugging
- Better caching strategies (HTTP caching)
- Mature ecosystem and tooling
- Stateless operations and clear resource modeling

**GraphQL Advantages:**
- Single endpoint with flexible data fetching
- Reduced over-fetching and under-fetching
- Strong typing and introspection capabilities
- Real-time subscriptions support

**3. Decision Framework:**
- Data relationship complexity assessment
- Client data consumption patterns analysis
- Development team capability evaluation
- Long-term maintenance considerations

**4. Implementation Strategy:**
- Proof of concept development for both approaches
- Performance benchmarking with realistic data loads
- Developer experience evaluation
- Migration path assessment if switching from existing API

**5. Hybrid Approach Consideration:**
- GraphQL for complex data relationships
- REST for simple CRUD operations
- API gateway pattern for unified access

**Deliverables:**
- Technical specification document
- Performance comparison benchmarks
- Implementation timeline and resource requirements
- Risk assessment and mitigation strategies

STRATEGY APPLIED: Architect
```

### Example 3: Creative Writing Enhancement

**Original Prompt:**
```
"Write a story about time travel"
```

**Auto-Refine Process:**
```
Use auto_refine prompt with user_prompt: "Write a story about time travel"
```

**Selected Strategy**: `star` (Core Strategies)

**Enhanced Prompt:**
```
Create a compelling time travel narrative using the ECHO methodology:

**E - Explore the Concept:**
- Define your time travel mechanism (machine, natural phenomenon, consciousness transfer)
- Establish temporal rules and paradox handling
- Choose time period(s) and their significance to the story

**C - Character Development:**
- Protagonist motivation for time travel (prevent tragedy, fulfill destiny, scientific curiosity)
- How time travel changes the character's perspective and relationships
- Supporting characters across different time periods

**H - Historical/Setting Integration:**
- Research and authentically portray chosen time periods
- Show how past events connect to present circumstances
- Explore cultural, technological, and social contrasts

**O - Orchestrate the Narrative:**
- Plot structure that handles temporal complexity clearly
- Balance exposition with action and character development
- Build toward a satisfying resolution that addresses temporal consequences

**Story Elements to Include:**
- Clear stakes: What happens if the mission fails?
- Temporal obstacles: What prevents easy success?
- Character growth: How does the journey change the protagonist?
- Thematic depth: What does the story say about time, choice, or consequence?

**Technical Considerations:**
- Consistent timeline logic throughout the narrative
- Foreshadowing that works across temporal boundaries
- Dialogue that reflects different time periods authentically
- Pacing that maintains tension despite complex temporal structure

**Genre Specifications:**
- Target audience and appropriate content level
- Preferred tone (adventure, drama, comedy, thriller)
- Length requirements and chapter structure
- Point of view and narrative voice
```

### Example 4: Data Analysis Enhancement

**Original Prompt:**
```
"Analyze customer churn data"
```

**Selected Strategy**: `evidence_seeker` (AI Core Principles)

**Enhanced Prompt:**
```
Conduct evidence-based customer churn analysis with rigorous validation:

**Data Evidence Requirements:**

**1. Data Quality Validation:**
- Verify data completeness and accuracy across all customer touchpoints
- Identify and document data gaps, outliers, and inconsistencies
- Establish confidence intervals for key metrics
- Cross-validate data sources for consistency

**2. Hypothesis-Driven Analysis:**
- Formulate specific, testable hypotheses about churn drivers
- Define measurable success criteria for each hypothesis
- Establish control groups and comparison timeframes
- Document assumptions and their validation methods

**3. Statistical Rigor:**
- Apply appropriate statistical tests with significance levels
- Control for confounding variables and selection bias
- Use multiple analytical approaches to validate findings
- Calculate effect sizes, not just p-values

**4. Evidence Collection Framework:**
- Quantitative metrics: Retention rates, usage patterns, engagement scores
- Qualitative insights: Customer feedback, support ticket analysis
- Behavioral indicators: Product usage, feature adoption, support interactions
- External factors: Market conditions, competitive actions, seasonal trends

**5. Validation Requirements:**
- Out-of-sample testing for predictive models
- Cohort analysis to verify trends across different customer segments
- A/B testing for intervention strategies
- Longitudinal analysis to confirm causal relationships

**6. Actionable Insights Criteria:**
- Each finding must include confidence level and evidence strength
- Recommendations must specify implementation requirements and success metrics
- Cost-benefit analysis for proposed interventions
- Timeline for result measurement and validation

**Deliverables:**
- Executive summary with key findings and confidence levels
- Detailed methodology and assumptions documentation
- Statistical analysis with peer-review quality rigor
- Implementation roadmap with measurement framework
- Limitations and areas for further investigation

**Validation Checklist:**
- [ ] All claims supported by statistical evidence
- [ ] Alternative explanations considered and ruled out
- [ ] Recommendations include implementation and measurement plans
- [ ] Analysis methodology is reproducible and documented
```

## Advanced Usage

### Performance Monitoring

Track strategy selection performance:

```
Use get_performance_metrics tool
```

**Response includes:**
- Average selection time
- Strategy usage patterns
- Error rates and recovery statistics
- Cache performance metrics

### Strategy Comparison

Compare multiple strategies for the same prompt:

```
Use compare_refinements prompt with user_prompt: "your prompt" and strategies: "star,physics,assumption_detector"
```

**Output**: Side-by-side analysis with suitability scores and recommendations

### Custom Strategy Selection

Override auto-selection for specific use cases:

```
Use refine_with_[strategy] prompt with user_prompt: "your prompt"
```

Useful when you have domain expertise about which approach works best.

### Health Monitoring

Monitor server health and performance:

```
Use health_check tool
```

Check strategy loading, cache performance, and system status.

## Performance Tips

### 1. **Use Auto-Refine for Most Cases**
- 95%+ accuracy in strategy selection
- Fastest single-step workflow
- Optimal for general use

### 2. **Cache Benefits**
- Repeated strategy loading is cached for 10 minutes
- File watching enables hot reloading during development
- Cache hits provide near-instant responses

### 3. **Three-Step Workflow for Complex Prompts**
- Use when precision is more important than speed
- Leverage Claude's intelligence for category and strategy selection
- Best for ambiguous or multi-domain prompts

### 4. **Direct Strategy Application for Experts**
- Skip auto-selection when you know the optimal strategy
- Useful for template creation and batch processing
- Fastest when strategy is predetermined

### 5. **Strategy Comparison for Learning**
- Use `compare_refinements` to understand strategy differences
- Great for discovering new approaches
- Educational tool for understanding metaprompt effectiveness

## Troubleshooting

### Common Issues

#### 1. **Server Not Responding**
```
Use health_check tool
```

If unhealthy:
- Check Claude Desktop configuration
- Verify global installation: `npm list -g prompt-plus-plus-mcp`
- Restart Claude Desktop

#### 2. **Strategy Not Found**
- Verify strategy name with: `Use list_strategies tool`
- Check for typos in strategy key
- Ensure you're using the correct prompt format

#### 3. **Poor Strategy Selection**
- Use 3-step workflow for more precise targeting
- Compare multiple strategies: `Use compare_refinements prompt`
- Consider manual strategy selection for domain-specific prompts

#### 4. **Performance Issues**
- Check cache performance: `Use get_performance_metrics tool`
- Verify strategy count: Should show 44+ strategies
- Consider restarting server if cache issues persist

### Error Recovery

The server includes comprehensive error handling:
- **Strategy loading failures**: Graceful degradation with warnings
- **Selection failures**: Automatic fallback to reliable strategies
- **Template errors**: Validation with helpful error messages

### Debug Information

For development debugging:
- Set `NODE_ENV=development` for verbose logging
- Monitor file watcher for strategy updates
- Check structured logs for performance insights

### Getting Help

1. **Check Documentation**: README.md and this guide
2. **Monitor Performance**: Use built-in metrics tools
3. **Test Health**: Regular health checks
4. **Report Issues**: GitHub issues with reproduction steps

## Advanced Customization

### Adding Custom Strategies

1. **Create Strategy File**:
```json
{
  "name": "My Custom Strategy",
  "description": "When to use this approach",
  "examples": ["Example prompt 1", "Example prompt 2"],
  "template": "Enhancement template with [Insert initial prompt here] placeholder",
  "triggers": ["keyword1", "keyword2"],
  "best_for": ["use case 1", "use case 2"],
  "complexity": "Medium",
  "time_investment": "Medium"
}
```

2. **Place in Appropriate Category**: 
- `metaprompts/core_strategies/` - General purpose
- `metaprompts/software_development/` - Coding focused
- `metaprompts/advanced_thinking/` - Cognitive frameworks
- `metaprompts/ai_core_principles/` - Critical thinking
- `metaprompts/vibe_coding_rules/` - AI development

3. **Test Strategy**:
```
Use refine_with_[filename] prompt with user_prompt: "test prompt"
```

### Creating New Categories

1. **Create Directory**: `metaprompts/new_category/`
2. **Add Metadata**: `_metadata.json` with category information
3. **Add Strategies**: Individual JSON files
4. **Restart Server**: For automatic loading

The server provides a comprehensive, intelligent prompt enhancement system with multiple workflow patterns to match different use cases and user preferences.