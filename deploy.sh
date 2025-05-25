#!/usr/bin/env sh

# Build the project
npm run build

# Navigate into the build output directory
cd dist

# Create a new git repository for deployment
git init
git checkout -B main
git add -A
git commit -m 'deploy'

# Push to the gh-pages branch
# Replace USERNAME/REPO with your GitHub username and repository name
git push -f git@github.com:USERNAME/gravity-wells-n-missiles.git main:gh-pages

cd -