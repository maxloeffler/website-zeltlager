#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: ./compress.sh /path/to/folder"
  exit 1
fi

for f in "$1"/*.webp; do
  size=$(stat -f%z "$f")
  if [ "$size" -le 409600 ]; then
    echo "$f is already under 400KB, skipping"
    continue
  fi

  for q in 80 70 60 50 40 30; do
    cwebp -q $q "$f" -o "${f%.webp}_compressed.webp" 2>/dev/null
    newsize=$(stat -f%z "${f%.webp}_compressed.webp")
    if [ "$newsize" -le 409600 ]; then
      echo "$f → quality $q → $(du -h "${f%.webp}_compressed.webp" | cut -f1)"
      break
    fi
  done
done
