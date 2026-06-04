#!/bin/bash

# Exit on error
set -e

PUBLIC_REPO_PATH=${1:-"../website"}

if [ -z "$PUBLIC_REPO_PATH" ]; then
    echo "Usage: ./publish_public.sh <path_to_local_public_repo_clone>"
    echo "Example: ./publish_public.sh ../iit-soccer-tournament.github.io"
    exit 1
fi

if [ ! -d "$PUBLIC_REPO_PATH" ]; then
    echo "Error: The directory '$PUBLIC_REPO_PATH' does not exist."
    exit 1
fi

echo "Step 1: Building the application in Public Website mode..."
# Override VITE_BUILDER to false for the public site build
VITE_BUILDER=false npm run build

echo "Step 2: Cleaning the target directory (except git config and data folder)..."
# We keep the .git folder and any local data/ folders (where unzipped tournament files go)
find "$PUBLIC_REPO_PATH" -mindepth 1 -maxdepth 1 -not -name ".git" -not -name "data" -exec rm -rf {} +

echo "Step 3: Copying compiled static files to target directory..."
cp -R dist/* "$PUBLIC_REPO_PATH"/

echo "Done! The public site has been compiled and copied to: $PUBLIC_REPO_PATH"
echo "You can now go to that repository, commit the changes, and push to deploy to GitHub Pages."
