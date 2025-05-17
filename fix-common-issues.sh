#!/bin/bash

# Function to display progress
show_progress() {
  echo "==> $1"
}

# Install necessary ESLint dependencies
show_progress "Installing ESLint dependencies..."
pnpm add -D @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks

# Fix TypeScript 'any' types
show_progress "Fixing TypeScript 'any' types..."
find src -type f -name "*.ts" -o -name "*.tsx" | while read file; do
  sed -i '' 's/: any/: unknown/g' "$file"
done

# Fix unescaped entities in JSX
show_progress "Fixing unescaped entities in JSX..."
find src -type f -name "*.tsx" | while read file; do
  sed -i '' "s/'/'/g" "$file"
  sed -i '' 's/"/"/g' "$file"
done

# Fix Image elements
show_progress "Fixing image elements..."
find src -type f -name "*.tsx" | while read file; do
  sed -i '' 's/<img/<Image/g' "$file"
  sed -i '' 's/<\/img>/<\/Image>/g' "$file"
done

# Run ESLint fix
show_progress "Running ESLint fix..."
npx eslint --fix "src/**/*.{ts,tsx}"

# Run Prettier
show_progress "Running Prettier..."
npx prettier --write "src/**/*.{ts,tsx}"

show_progress "Done! Please review the changes and run the build again." 