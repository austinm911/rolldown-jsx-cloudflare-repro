#!/bin/bash
# Copy @repro/ui into node_modules as a real package (not a symlink).
# Vite's dep optimizer skips symlinked workspace packages because their
# resolved path is outside node_modules. Copying makes the optimizer
# treat it as a regular npm package and attempt to pre-bundle the raw .tsx.
rm -rf node_modules/@repro/ui
mkdir -p node_modules/@repro/ui
cp -r packages/ui/package.json packages/ui/src node_modules/@repro/ui/
