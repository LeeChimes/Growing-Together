#!/bin/bash

# Auto-merge script for Growing Together project
# This script automatically merges branches with conflict resolution

set -e  # Exit on any error

echo "🚀 Starting automatic merge process..."

# Get the current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Check if we're on main branch
if [ "$CURRENT_BRANCH" = "main" ]; then
    echo "⚠️  You're on main branch. This script is for merging feature branches into main."
    echo "💡 Usage: Create a feature branch, make changes, then run this script from main."
    exit 1
fi

# Switch to main branch
echo "🔄 Switching to main branch..."
git checkout main

# Pull latest changes
echo "📥 Pulling latest changes from remote..."
git pull origin main

# Merge the feature branch with automatic conflict resolution
echo "🔀 Merging $CURRENT_BRANCH into main..."
git merge $CURRENT_BRANCH --strategy-option=ours --no-edit

# Push the merged changes
echo "📤 Pushing merged changes to GitHub..."
git push origin main

# Clean up the feature branch
echo "🧹 Cleaning up feature branch..."
git branch -d $CURRENT_BRANCH
git push origin --delete $CURRENT_BRANCH

echo "✅ Automatic merge completed successfully!"
echo "🎉 All changes are now on GitHub main branch."
