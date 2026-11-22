#!/usr/bin/env bash
# Portable static build: hash routing (#/9) and relative asset paths, so the
# deck runs from any sub-path or host without an SPA fallback.
set -euo pipefail
cd "$(dirname "$0")/.."
sed '0,/^title: /s//routerMode: hash\ntitle: /' slides.md > slides.web.md
trap 'rm -f slides.web.md' EXIT
pnpm slidev build slides.web.md --base ./ --out dist
rm -f dist/_redirects dist/404.html
sed -i 's|<title>\(.*\) - Slidev</title>|<title>\1</title>|' dist/index.html
