#!/usr/bin/env python3
"""
Test the metaprompts loading functionality
"""

import json
import os
from pathlib import Path

def test_metaprompts_loading():
    """Test loading metaprompts from individual JSON files"""
    metaprompts_dir = Path("metaprompts")
    
    if not metaprompts_dir.exists():
        print("ERROR: metaprompts directory not found!")
        return
    
    print("Testing Metaprompts Loading")
    print("=" * 50)
    
    metaprompts = {}
    
    # Load each JSON file
    for json_file in sorted(metaprompts_dir.glob("*.json")):
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                metaprompt = json.load(f)
                key = json_file.stem
                metaprompts[key] = metaprompt
                print(f"✓ Loaded {key}: {metaprompt.get('name', 'Unknown')}")
        except Exception as e:
            print(f"✗ Error loading {json_file}: {e}")
    
    print(f"\nTotal metaprompts loaded: {len(metaprompts)}")
    
    # Test structure
    print("\nChecking metaprompt structure:")
    for key, meta in metaprompts.items():
        required_fields = ['name', 'description', 'template']
        missing = [field for field in required_fields if field not in meta]
        if missing:
            print(f"  ✗ {key}: Missing fields: {missing}")
        else:
            print(f"  ✓ {key}: All required fields present")
            print(f"    - Template length: {len(meta['template'])} chars")
            print(f"    - Examples: {len(meta.get('examples', []))}")

if __name__ == "__main__":
    test_metaprompts_loading()
