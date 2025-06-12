# UI Mockups and Wireframes

## Dashboard Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 🚀 Prompt++ MCP                                    [Test] [Docs] [User ▼]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │ Total Strategies │  │ Active Today    │  │ Cache Hit Rate  │   │
│  │       44+        │  │      127        │  │      89%        │   │
│  │  ▲ 3 this week  │  │  ▲ 15% vs avg  │  │   ● Healthy     │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘   │
│                                                                         │
│  Quick Actions                          Recent Activity                 │
│  ┌────────────────────────────┐       ┌──────────────────────────┐   │
│  │ 🧪 Test Prompt            │       │ • architect strategy used │   │
│  │ ➕ Add Custom Strategy    │       │   2 minutes ago          │   │
│  │ 📦 Manage Collections     │       │ • Created "my-strategy"   │   │
│  │ 📊 View Metrics          │       │   1 hour ago             │   │
│  └────────────────────────────┘       │ • star refinement tested │   │
│                                        │   3 hours ago            │   │
│  Popular Strategies                    └──────────────────────────┘   │
│  ┌────────────────────────────────────────────────────────────┐       │
│  │ 1. STAR Method          ████████████████████ 245 uses    │       │
│  │ 2. Architect            ███████████████      189 uses    │       │
│  │ 3. Devil's Advocate     ████████████         156 uses    │       │
│  │ 4. Write Tests First    ████████             134 uses    │       │
│  └────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
```

## Strategy Explorer

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 🔍 Strategy Explorer                                    [Search...    🔍]│
├─────────────────────────────────────────────────────────────────────────┤
│ Categories          │  Strategies (showing 12 of 44)                    │
│ ┌─────────────────┐│  ┌─────────────────┐ ┌─────────────────┐        │
│ │▼ Core (10)      ││  │ ⭐ STAR Method  │ │ 📐 Architect   │        │
│ │  • ECHO         ││  │ Complexity: Med │ │ Complexity: High│        │
│ │  • STAR         ││  │ Time: Medium    │ │ Time: High      │        │
│ │  • Physics      ││  │ [Test] [Details]│ │ [Test] [Details]│        │
│ │▼ AI Principles  ││  └─────────────────┘ └─────────────────┘        │
│ │  (13)           ││  ┌─────────────────┐ ┌─────────────────┐        │
│ │  • Assumption   ││  │ 😈 Devil's Adv. │ │ 🔍 Evidence    │        │
│ │  • Devil's Adv  ││  │ Complexity: Med │ │ Complexity: Low │        │
│ │► Vibe Coding    ││  │ Time: Low       │ │ Time: Medium    │        │
│ │  (11)           ││  │ [Test] [Details]│ │ [Test] [Details]│        │
│ │► Software Dev   ││  └─────────────────┘ └─────────────────┘        │
│ │  (4)            ││                                                   │
│ │► Advanced (6)   ││  Filters: [All Categories ▼] [All Complexity ▼]  │
│ │                 ││           [Sort: Popular ▼]                      │
│ └─────────────────┘└───────────────────────────────────────────────────┘
```

## Prompt Testing Interface

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 🧪 Prompt Testing Lab                          [History] [Share] [Save] │
├─────────────────────────────────────────────────────────────────────────┤
│ Strategy: [STAR Method ▼]                    [⚙️ Options] [Compare +]  │
├─────────────────────────────────────────────────────────────────────────┤
│ Original Prompt                   │ Refined Prompt                      │
│ ┌────────────────────────────────┐│┌────────────────────────────────┐ │
│ │Write a Python function to      ││ ## Situation                   │ │
│ │validate email addresses        ││ Create a Python function for   │ │
│ │                               ││ email validation that handles  │ │
│ │                               ││ common edge cases              │ │
│ │                               ││                               │ │
│ │                               ││ ## Task                       │ │
│ │                               ││ - Validate email format       │ │
│ │                               ││ - Check domain validity       │ │
│ │                               ││ - Handle special characters   │ │
│ │                               ││                               │ │
│ │                               ││ ## Action                     │ │
│ │                               ││ 1. Use regex for format       │ │
│ │                               ││ 2. Verify domain exists       │ │
│ │                               ││ 3. Return validation result   │ │
│ │[Refine →]                     ││                               │ │
│ └────────────────────────────────┘│└────────────────────────────────┘ │
│ Improvements Applied:              │ Metrics:                           │
│ • Added structure (STAR method)    │ • Words: 45 → 127 (+182%)         │
│ • Clarified requirements          │ • Clarity: ████████░░ 85%         │
│ • Included edge cases             │ • Time saved: ~5 minutes           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Custom Strategy Creator

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ✏️ Custom Strategy Creator                              [Save] [Cancel] │
├─────────────────────────────────────────────────────────────────────────┤
│ Basic Information                 │ Template Editor                     │
│ ┌────────────────────────────────┐│┌────────────────────────────────┐ │
│ │ Name: [My Custom Strategy    ] ││ {                              │ │
│ │                                ││   "name": "My Custom Strategy",│ │
│ │ Key: [my_custom_strategy     ] ││   "description": "A strategy   │ │
│ │                                ││    for structured analysis",   │ │
│ │ Category: [Custom ▼]           ││   "template": "Analyze the     │ │
│ │                                ││    following prompt using      │ │
│ │ Description:                   ││    these steps:               │ │
│ │ ┌──────────────────────────┐  ││    1. Identify key components │ │
│ │ │A strategy for structured │  ││    2. Break down requirements │ │
│ │ │analysis of complex       │  ││    3. Structure the response  │ │
│ │ │prompts                   │  ││                               │ │
│ │ └──────────────────────────┘  ││    [Insert initial prompt here]│ │
│ │                                ││                               │ │
│ │ Complexity: [Medium ▼]         ││    Output format:             │ │
│ │ Time: [Medium ▼]              ││    - Component analysis       │ │
│ │                                ││    - Structured approach      │ │
│ │ Triggers:                      ││    - Clear action items",     │ │
│ │ [analyze] [structure] [+]      ││   "examples": [...],          │ │
│ └────────────────────────────────┘││   "complexity": "Medium"      │ │
│ Validation: ✅ All checks passed   ││ }                             │ │
└────────────────────────────────────┘└────────────────────────────────┘ │
│ [Test Strategy] [Preview] [Import Template]                [Help] [Docs]│
└─────────────────────────────────────────────────────────────────────────┘
```

## Collections Manager

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 📦 Collections Manager                        [+ New Collection] [Import]│
├─────────────────────────────────────────────────────────────────────────┤
│ Your Collections (3)                                                    │
│ ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐     │
│ │ 📁 Favorites      │ │ 📁 Team Prompts  │ │ 📁 AI Research   │     │
│ │                   │ │                   │ │                   │     │
│ │ 12 strategies     │ │ 8 strategies      │ │ 15 strategies     │     │
│ │                   │ │                   │ │                   │     │
│ │ Updated: 2 days   │ │ Updated: 1 week   │ │ Updated: Today    │     │
│ │                   │ │                   │ │                   │     │
│ │ [Edit] [Export]   │ │ [Edit] [Export]   │ │ [Edit] [Export]   │     │
│ └───────────────────┘ └───────────────────┘ └───────────────────┘     │
│                                                                         │
│ Editing: Favorites                                                      │
│ ┌─────────────────────────────────────────────────────────────────┐   │
│ │ Available Strategies          │ Collection Strategies           │   │
│ │ ┌───────────────────────────┐│┌──────────────────────────────┐│   │
│ │ │ □ STAR Method             ││ ☑ Devil's Advocate          ││   │
│ │ │ □ Architect               ││ ☑ Evidence Seeker           ││   │
│ │ │ □ Physics                 ││ ☑ Assumption Detector       ││   │
│ │ │ □ Write Tests First       ││ ☑ STAR Method               ││   │
│ │ │ □ Pattern Recognizer      ││                              ││   │
│ │ └───────────────────────────┘│└──────────────────────────────┘│   │
│ │ [Add Selected →]              │              [← Remove Selected]│   │
│ └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Performance Monitor

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 📊 Performance Monitor                    [Last 24h ▼] [Export] [Alerts]│
├─────────────────────────────────────────────────────────────────────────┤
│ Response Time (ms)                     │ Cache Performance              │
│ ┌────────────────────────────────────┐│┌────────────────────────────┐ │
│ │     ╱╲    ╱╲                      ││ Hit Rate: 89%               │ │
│ │ 100╱  ╲  ╱  ╲                     ││ ████████████████████░░░     │ │
│ │   ╱    ╲╱    ╲    ╱╲              ││                             │ │
│ │ 50      ╲    ╱╲  ╱  ╲             ││ Hits: 1,247                 │ │
│ │          ╲  ╱  ╲╱    ╲            ││ Misses: 153                 │ │
│ │ 0  ───────╲╱──────────            ││ Size: 87/100 MB             │ │
│ │   12AM   6AM   12PM   6PM         ││                             │ │
│ └────────────────────────────────────┘│└────────────────────────────┘ │
│                                                                         │
│ Strategy Usage                         │ Error Rate                     │
│ ┌────────────────────────────────────┐│┌────────────────────────────┐ │
│ │ STAR Method          ███████ 245   ││ Total Errors: 12 (0.3%)     │ │
│ │ Architect            █████   189   ││                             │ │
│ │ Devil's Advocate     ████    156   ││ By Type:                    │ │
│ │ Write Tests First    ███     134   ││ • Validation    █████ 7     │ │
│ │ Evidence Seeker      ██      98    ││ • Timeout       ███   4     │ │
│ │ Others               █████   412   ││ • Unknown       █     1     │ │
│ └────────────────────────────────────┘│└────────────────────────────┘ │
│                                                                         │
│ System Health: ● All Systems Operational          Uptime: 99.98%       │
└─────────────────────────────────────────────────────────────────────────┘
```

## Mobile Responsive View (Strategy Card)

```
┌─────────────────────┐
│ 🚀 Prompt++ MCP  ≡ │
├─────────────────────┤
│ [Search...       🔍]│
├─────────────────────┤
│ ⭐ STAR Method      │
│ Complexity: Medium  │
│ Time: Medium        │
│                     │
│ Structured approach │
│ using Situation,    │
│ Task, Action, Result│
│                     │
│ Used 245 times      │
│ ★★★★☆ (4.5)        │
│                     │
│ [Test] [Details]    │
├─────────────────────┤
│ 📐 Architect        │
│ Complexity: High    │
│ Time: High          │
│                     │
│ System design and   │
│ architecture focus  │
│                     │
│ Used 189 times      │
│ ★★★★★ (4.8)        │
│                     │
│ [Test] [Details]    │
└─────────────────────┘
```

## Component Library Examples

### Button Variants
```
[Primary Button] [Secondary] [Outline] [Ghost] [Danger]
   ↓ Large        ↓ Default    ↓ Small   ↓ Icon  ↓ Loading
[Get Started]    [Cancel]    [Edit]    [🗑]    [◌ Saving...]
```

### Form Elements
```
Label
[Input Field                    ]
Helper text or error message

[Dropdown Selection         ▼]

☑ Checkbox option
☐ Unchecked option
○ Radio option 1
● Radio option 2

[Text area for longer content    ]
[                               ]
[                               ]
```

### Notification States
```
✅ Success: Strategy saved successfully
⚠️ Warning: Cache approaching limit
❌ Error: Failed to load strategies
ℹ️ Info: New strategies available
```

## Color Palette

### Light Mode
- Background: #FFFFFF
- Surface: #F9FAFB
- Primary: #3B82F6
- Secondary: #10B981
- Text: #111827
- Border: #E5E7EB

### Dark Mode
- Background: #111827
- Surface: #1F2937
- Primary: #60A5FA
- Secondary: #34D399
- Text: #F9FAFB
- Border: #374151

## Typography

- Headings: Inter or system-ui
- Body: Inter or system-ui
- Code: JetBrains Mono or monospace
- Sizes: 
  - H1: 2.5rem
  - H2: 2rem
  - H3: 1.5rem
  - Body: 1rem
  - Small: 0.875rem