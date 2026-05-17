#!/bin/bash

for f in *.ttf; do
    pyftsubset "$f" \
        --output-file="$f"-subset.woff2 \
        --flavor=woff2 \
        --text="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789äöüÃÃÃÃ.,?+-@:\!"
done
