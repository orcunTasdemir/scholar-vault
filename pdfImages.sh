#!/bin/bash

PDF_DIR=~/Downloads/pdfs
OUTPUT_DIR=~/Work/scholarvault/frontend/public/papers

for pdf in "$PDF_DIR"/*.pdf; do
    echo "Processing: $(basename "$pdf")"
    echo "Which page number? (1, 2, or 3): "
    read page_num
    
    pdftoppm -f "$page_num" -l "$page_num" -png -r 300 "$pdf" "$OUTPUT_DIR/$(uuidgen).png"
done