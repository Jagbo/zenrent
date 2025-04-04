#!/bin/bash

# Fix ESLint auto-fixable issues
npx eslint --fix "src/**/*.{ts,tsx}"

# Remove unused imports
npx eslint --fix --rule "@typescript-eslint/no-unused-vars: error" "src/**/*.{ts,tsx}"

# Fix prefer-const issues
npx eslint --fix --rule "prefer-const: error" "src/**/*.{ts,tsx}"

# Run Prettier to ensure consistent formatting
npx prettier --write "src/**/*.{ts,tsx}" 