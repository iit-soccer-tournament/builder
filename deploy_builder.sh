#!/bin/bash

# Exit on error
set -e

echo "Step 1: Building the builder workspace..."
npm run build

echo "Step 2: Publishing to gh-pages branch..."
cd dist
git init
git branch -m gh-pages
git remote add origin https://github.com/iit-soccer-tournament/builder.git
git add .
git commit -m "Deploy builder workspace"
git push -f origin gh-pages

echo "Success! The builder has been pushed to the gh-pages branch."
echo "Note: Go to https://github.com/iit-soccer-tournament/builder -> Settings -> Pages"
echo "and set 'Build and deployment' Source to 'Deploy from a branch', selecting 'gh-pages' and folder '/ (root)'."
