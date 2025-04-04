import os
import re
import sys
from pathlib import Path

def fix_file(file_path):
    print(f"Processing {file_path}...")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix common issues
    modified = content
    
    # Replace quot; with regular quote
    modified = re.sub(r'quot;', '', modified)
    
    # Replace apos; with apostrophe
    modified = re.sub(r'apos;', '', modified)
    
    # Fix malformed JSX prop assignments (common pattern)
    modified = re.sub(r'(\w+)="([^"]*)"quot;', r'\1="\2"', modified)
    
    # Fix malformed JSX closing brackets
    modified = re.sub(r'(\w+)="([^"]*)"quot;>', r'\1="\2">', modified)
    
    # Fix trailing quotation marks in strings
    modified = re.sub(r'="([^"]*)"quot;', r'="\1"', modified)
    
    # Write back only if changed
    if content != modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(modified)
        print(f"  Fixed issues in {file_path}")

def main():
    # Start from the src directory
    src_dir = Path("src")
    
    if not src_dir.exists():
        print("Error: src directory not found")
        sys.exit(1)
    
    # Find all .tsx files recursively
    tsx_files = list(src_dir.glob("**/*.tsx"))
    
    # Find all .ts files recursively (excluding .d.ts files)
    ts_files = [f for f in src_dir.glob("**/*.ts") if not str(f).endswith(".d.ts")]
    
    # Process all files
    for file_path in tsx_files + ts_files:
        fix_file(file_path)
    
    print(f"Processed {len(tsx_files) + len(ts_files)} files")

if __name__ == "__main__":
    main() 