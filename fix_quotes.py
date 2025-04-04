#!/usr/bin/env python3
import os
import re

def fix_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix "use client" directive
    content = content.replace('"quot;use client"quot;', '"use client"')
    
    # Fix import quotes
    content = re.sub(r'"quot;([^"]+)"quot;', r'"\1"', content)
    
    # Fix JSX attribute quotes
    def replace_jsx_attr(match):
        attr_name = match.group(1)
        attr_value = match.group(2)
        # Remove quot; from the beginning and end of the value
        attr_value = attr_value.replace('quot;', '')
        return f'{attr_name}="{attr_value}"'
    
    content = re.sub(r'(\w+)="quot;([^"]+)quot;"', replace_jsx_attr, content)
    
    # Fix JSX component tags
    content = re.sub(r'<(\w+)\s+([^>]+)>', lambda m: f'<{m.group(1)} {m.group(2)}>', content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

def main():
    for root, _, files in os.walk('src'):
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                file_path = os.path.join(root, file)
                print(f'Processing {file_path}...')
                fix_file(file_path)

if __name__ == '__main__':
    main() 