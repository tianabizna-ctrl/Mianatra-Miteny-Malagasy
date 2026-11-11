#!/bin/bash
# Push the Salama! project to GitHub (both main and gh-pages).
#
#   GH_TOKEN=github_pat_... bash RESEARCH/push_to_github.sh [owner/repo]
#
# The token is passed in the environment, never written to .git/config, so it does
# not end up in the repository or in the workspace snapshot.
set -euo pipefail
cd "$(dirname "$0")/.."

REPO="${1:-tianabizna-ctrl/vahiny-mianatra-malagasy}"
: "${GH_TOKEN:?set GH_TOKEN to a GitHub personal access token with contents:write}"

if [ ! -d .git ] || [ ! -f .git/config ]; then
  git init -q
  git config user.email "salama@vahiny.mg"
  git config user.name "Salama Builder"
fi

echo "== 1. commit whatever changed since the last push =="
git add -A
if ! git diff --cached --quiet; then
  git commit -qm "Salama! v3.4 — Official Malagasy + editable Malagasy & phonetics ($(date +%Y-%m-%d))"
  echo "   committed"
else
  echo "   nothing new to commit"
fi

echo "== 2. check the remote is reachable =="
API="https://api.github.com/repos/$REPO"
code=$(curl -s -o /tmp/repo.json -w '%{http_code}' \
        -H "Authorization: Bearer $GH_TOKEN" "$API")
if [ "$code" != "200" ]; then
  echo "   GitHub says HTTP $code for $REPO"
  exit 1
fi
echo "   found $REPO"

echo "== 3. push main =="
git remote remove origin 2>/dev/null || true
git remote add origin "https://x-access-token:${GH_TOKEN}@github.com/${REPO}.git"
git branch -M main
git push -u origin main --force

echo "== 4. deploy APP/ to gh-pages =="
rm -rf /tmp/site
mkdir -p /tmp/site
cp -R APP/. /tmp/site/
touch /tmp/site/.nojekyll
(
  cd /tmp/site
  git init -q
  git config user.email "salama@vahiny.mg"
  git config user.name "Salama Builder"
  git checkout -qb gh-pages
  git add -A
  git commit -qm "Deploy Salama! v3.4 Official Malagasy to GitHub Pages"
  git remote add origin "https://x-access-token:${GH_TOKEN}@github.com/${REPO}.git"
  git push -u origin gh-pages --force
)
rm -rf /tmp/site
git remote remove origin
rm -rf .git
echo "== done =="
