#!/bin/bash

# convert all pngs and jpegs in a folder to webp
# afterwards, call compress.sh on it to minimize files

if [ -z "$1" ]; then
    echo "Usage: ./convert.sh /path/to/folder"
    exit 1
fi

for f in "$1"/*.jpeg "$1"/*.png "$1"/*.jpg; do cwebp -q 80 "$f" -o "${f%.*}.webp"; done
