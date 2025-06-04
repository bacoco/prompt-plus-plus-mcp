
custom_css = """
/* ============================================
 MAIN LAYOUT AND CONTAINERS
 Purpose: Core layout structure with minimal spacing
 ============================================ */
/* Main container styling with blue border and rounded corners */
.container {
  border: 2px solid #2196F3;          /* Blue border with 2px thickness */
  border-radius: 10px;                /* Rounded corners */
  padding: 10px !important;            /* Inner spacing */
  margin: 2px auto !important;        /* Outer spacing and center alignment */
  background: white;                  /* White background */
  position: relative;                 /* For absolute positioning of children */
  width: 100% !important;            /* Full width */
  max-width: 1200px !important;      /* Maximum width constraint */
}

/* Section header label positioning and styling */
.container::before {
  position: absolute;                 /* Position independently */
  top: -18px;                        /* Negative top margin to overlap container border */
  left: 20px;                        /* Left offset */
  background: white;                 /* White background for text */
  padding: 0 2px;                   /* Horizontal padding*/
  color: #2196F3;                    /* Blue text color */
  font-weight: bold;                 /* Bold text */
  font-size: 1.2em;                  /* Larger text size */
}

/* ============================================
 TITLE SECTION
 Purpose: "Prompts on Chosen Model" header styling
 ============================================ */
/* Title container styling */
.title-container {
  width: fit-content !important;      /* Width based on content */
  margin: 0 auto !important;          /* Center alignment */
  margin-bottom: 30px !important; /* Adjust the value (30px) as needed */
  padding: 2px 40px !important;       /* Horizontal padding */
  border: 1px solid #0066cc !important; /* Blue border */
  border-radius: 10px !important;     /* Rounded corners */
  background-color: rgba(0, 102, 204, 0.05) !important; /* Light blue background */
}

/* Center align all text in title container */
.title-container * {
  text-align: center;                 /* Center text alignment */
  margin: 0 !important;               /* Remove margins */
  line-height: 1.2 !important;        /* Line height for readability */
}

/* Main title styling */
.title-container h1 {
  font-size: 28px !important;         /* Large font size */
  margin-bottom: 1px !important;      /* Small bottom margin */
}

/* Subtitle styling */
.title-container h3 {
  font-size: 18px !important;         /* Medium font size */
  margin-bottom: 1px !important;      /* Small bottom margin */
}

/* Paragraph text styling in title */
.title-container p {
  font-size: 14px !important;         /* Regular font size */
  margin-bottom: 1px !important;      /* Small bottom margin */
}

/* ============================================
 SECTION LABELS
 Purpose: Section header text content
 ============================================ */
/* Define text content for each section header */
.input-container::before { content: 'PROMPT ANALYSIS'; }
.analysis-container::before { content: 'PROMPT REFINEMENT'; }
.meta-container::before { content: 'REFINEMENT METHOD'; }
.model-container::before { content: 'PROMPTS APPLICATION'; }
.examples-container::before { content: 'EXAMPLES'; }

/* ============================================
 INPUT ELEMENTS
 Purpose: Textarea and input styling
 ============================================ */
/* Textarea styling */
.input-container textarea {
  resize: vertical !important;         /* Allow vertical resizing only */
  min-height: 100px !important;       /* Minimum height */
  max-height: 500px !important;       /* Maximum height */
  width: 100% !important;             /* Full width */
  border: 1px solid #ddd !important;  /* Light gray border */
  border-radius: 4px !important;      /* Rounded corners */
  padding: 2px !important;            /* Inner spacing */
  transition: all 0.3s ease !important; /* Smooth transitions */
}

/* Textarea focus state */
.input-container textarea:focus {
  border-color: #2196F3 !important;   /* Blue border when focused */
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1) !important; /* Subtle shadow */
}

/* ============================================
 RADIO BUTTONS
 Purpose: Selection options styling
 ============================================ */
/* Radio button group container */
.radio-group {
  background-color: rgba(0, 102, 204, 0.05) !important; /* Light blue background */
  padding: 10px !important;           /* Inner spacing */
  border-radius: 8px !important;      /* Rounded corners */
  border: 1px solid rgba(0, 102, 204, 0.1) !important; /* Light blue border */
  display: flex !important;           /* Flex layout */
  justify-content: center !important; /* Center items */
  flex-wrap: wrap !important;         /* Allow wrapping */
  gap: 8px !important;               /* Space between items */
  width: 100% !important;            /* Full width */
}

/* Radio button container */
.gradio-radio {
  display: flex !important;           /* Flex layout */
  justify-content: center !important; /* Center items */
  flex-wrap: wrap !important;         /* Allow wrapping */
  gap: 8px !important;               /* Space between items */
}

/* Radio button label styling */
.gradio-radio label {
  display: flex !important;           /* Flex layout */
  align-items: center !important;     /* Center vertically */
  padding: 6px 12px !important;       /* Inner spacing */
  border: 1px solid #ddd !important;  /* Light gray border */
  border-radius: 4px !important;      /* Rounded corners */
  cursor: pointer !important;         /* Pointer cursor */
  background: white !important;       /* White background */
  margin: 4px !important;            /* Outer spacing */
}

/* Selected radio button styling */
.gradio-radio input[type="radio"]:checked + label {
  background: rgba(0, 102, 204, 0.1) !important; /* Light blue background */
  border-color: #0066cc !important;   /* Blue border */
  color: #0066cc !important;          /* Blue text */
  font-weight: bold !important;       /* Bold text */
}

/* ============================================
 BUTTONS
 Purpose: Interactive button styling
 ============================================ */
/* Base button styling */
.gradio-button {
  background-color: white !important;  /* White background */
  color: #2196F3 !important;          /* Blue text */
  border: 2px solid #2196F3 !important; /* Blue border */
  border-radius: 4px !important;      /* Rounded corners */
  padding: 8px 16px !important;       /* Inner spacing */
  margin: 10px 0 !important;          /* Vertical margin */
  font-weight: bold !important;       /* Bold text */
  transition: all 0.3s ease !important; /* Smooth transitions */
}

/* Button hover state */
.gradio-button:hover {
  background-color: #2196F3 !important; /* Blue background on hover */
  color: white !important;             /* White text on hover */
  box-shadow: 0 2px 5px rgba(33, 150, 243, 0.3) !important; /* Shadow effect */
}

/* Highlighted button state */
.button-highlight {
  animation: pulse 2s infinite;        /* Pulsing animation */
  border-color: #ff9800 !important;    /* Orange border */
  border-width: 3px !important;        /* Thicker border */
  box-shadow: 0 0 10px rgba(255, 152, 0, 0.5) !important; /* Glow effect */
}

/* Pulsing animation keyframes */
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.4); }    /* Start state */
  70% { box-shadow: 0 0 0 10px rgba(255, 152, 0, 0); }  /* Mid state */
  100% { box-shadow: 0 0 0 0 rgba(255, 152, 0, 0); }    /* End state */
}

/* Waiting button state */
.button-waiting { 
  opacity: 0.6 !important;            /* Reduced opacity */
}

/* Completed button state */
.button-completed {
  border-color: #4CAF50 !important;    /* Green border */
  background-color: rgba(76, 175, 80, 0.1) !important; /* Light green background */
}

/* ============================================
 LAYOUT COMPONENTS
 Purpose: Basic layout element styling
 ============================================ */
/* Accordion styling */
.gradio-accordion {
  margin: 10px 0 !important;          /* Vertical margin */
  border: none !important;            /* Remove border */
}

/* Main container layout */
.gradio-container {
  display: flex !important;           /* Flex layout */
  flex-direction: column !important;  /* Stack vertically */
  align-items: center !important;     /* Center items */
  width: 100% !important;            /* Full width */
  max-width: 1200px !important;      /* Maximum width */
  margin: 2px auto !important;         /* Center horizontally */
}

/* Dropdown menu styling */
.gradio-dropdown {
  width: 100% !important;            /* Full width */
  max-width: 300px !important;       /* Maximum width */
}

/* JSON response container */
.full-response-json {
  margin-top: 20px !important;       /* Top margin */
  padding: 10px !important;          /* Inner spacing */
  background-color: rgba(0, 102, 204, 0.05) !important; /* Light blue background */
  border-radius: 8px !important;     /* Rounded corners */
}

/* ============================================
 COMPARISON COLUMNS
 Purpose: Side-by-side output display
 ============================================ */
/* Column container styling */
.comparison-column {
  border: 2px solid #2196F3 !important; /* Blue border */
  border-radius: 8px !important;      /* Rounded corners */
  padding: 4px !important;            /* Inner spacing */
  margin: 1px !important;             /* Minimal margin */
  background-color: white !important; /* White background */
  flex: 1 !important;                /* Equal width columns */
  min-width: 300px !important;       /* Minimum width */
  padding-right: 2px !important;      /* Add this to remove right padding */
  margin-right: 2px !important;       /* Add this to remove right margin */
}

/* Column header styling */
.comparison-column h3 {
  color: #2196F3 !important;          /* Blue text */
  border-bottom: 1px solid #e0e0e0 !important; /* Bottom border */
  padding-bottom: 2px !important;     /* Bottom padding */
  margin: 0 0 4px 0 !important;       /* Bottom margin */
  font-size: 16px !important;         /* Font size */
  text-align: center !important;      /* Center text */
}

/* Output area styling */
.comparison-output {
  min-height: 200px !important;       /* Minimum height */
  padding: 6px !important;            /* Inner spacing */
  background-color: #f8f9fa !important; /* Light gray background */
  border: 1px solid #dee2e6 !important; /* Gray border */
  border-radius: 4px !important;      /* Rounded corners */
  margin: 4px 0 !important;           /* Vertical margin */
  white-space: pre-wrap !important;   /* Preserve whitespace */
  word-wrap: break-word !important;   /* Break long words */
  font-family: monospace !important;  /* Monospace font */
  line-height: 1.5 !important;        /* Line height */
  overflow-y: auto !important;        /* Vertical scroll */
  width: 100% !important;            /* Full width */
  visibility: visible !important;     /* Always visible */
  opacity: 1 !important;             /* Full opacity */
  padding: 10px 3px !important;  /* 20px top/bottom, 30px left/right */
}

/* ============================================
 OUTPUT ROW
 Purpose: Layout for output display
 ============================================ */
/* Output row container */
.output-row {
  display: flex !important;           /* Flex layout */
  gap: 1mm !important;               /* Small gap between items */
  padding: 2mm !important;           /* Inner spacing */
  width: 100% !important;            /* Full width */
  flex-wrap: wrap !important;        /* Allow wrapping */
}

/* ============================================
 TABS
 Purpose: Tab navigation styling
 ============================================ */
/* Tab container */
.tabs {
  border: none !important;            /* Remove border */
  margin-top: 4px !important;         /* Top margin */
  width: 100% !important;            /* Full width */
}

/* Individual tab item */
.tabitem {
  padding: 4px !important;            /* Inner spacing */
  width: 100% !important;            /* Full width */
}

/* ============================================
 TEXT CONTENT
 Purpose: Text display formatting
 ============================================ */
/* Markdown text styling */
.markdown-text {
  color: #333333 !important;          /* Dark gray text */
  line-height: 1.6 !important;        /* Line height */
  font-size: 14px !important;         /* Font size */
  margin: 4px 4px !important;           /* Vertical margin */
  opacity: 1 !important;              /* Full opacity */
  visibility: visible !important;      /* Always visible */
  padding: 15px !important; 
}

/* Placeholder text for empty output */
.comparison-output:empty::before {
  content: 'Output will appear here' !important; /* Placeholder text */
  color: #666666 !important;          /* Gray text */
  font-style: italic !important;      /* Italic style */
}

/* ============================================
 BUTTON STATES
 Purpose: Button interaction styling
 ============================================ */
/* Default button state */
button {
  opacity: 1 !important;              /* Full opacity */
  pointer-events: auto !important;    /* Enable interactions */
}

/* Disabled button state */
button:disabled {
  opacity: 0.6 !important;            /* Reduced opacity */
  pointer-events: none !important;    /* Disable interactions */
}

/* ============================================
 VISIBILITY
 Purpose: Element display control
 ============================================ */
/* Output content visibility */
.output-content {
  opacity: 1 !important;              /* Full opacity */
  visibility: visible !important;      /* Always visible */
  display: block !important;          /* Block display */
}

/* Output container visibility */
.output-container {
  display: block !important;          /* Block display */
  visibility: visible !important;      /* Always visible */
  opacity: 1 !important;              /* Full opacity */
}

/* ============================================
 CODE BLOCKS
 Purpose: Code and pre-formatted text styling
 ============================================ */
/* Code block styling */
pre, code {
  background-color: #f8f9fa !important; /* Light gray background */
  border: 1px solid #dee2e6 !important; /* Gray border */
  border-radius: 4px !important;      /* Rounded corners */
  padding: 10px !important;           /* Inner spacing */
  margin: 5px 0 !important;           /* Vertical margin */
  white-space: pre-wrap !important;   /* Preserve whitespace */
  word-wrap: break-word !important;   /* Break long words */
  font-family: monospace !important;  /* Monospace font */
  line-height: 1.5 !important;        /* Line height */
  display: block !important;          /* Block display */
  width: 100% !important;            /* Full width */
}
"""