#!/bin/sh

export SHELL=/bin/sh

npm install -g terser chokidar-cli

minify() {
    path=$1
    filename=$(basename "$path")
    if echo "$filename" | grep -q "\.module\.js$"; then
        outfile=$(echo "$filename" | sed "s/\.module\.js$/.min.js/")
        terser "$path" --compress --mangle --ecma 2022 --module -o "assets/js/$outfile"
    else
        outfile=$(echo "$filename" | sed "s/\.js$/.min.js/")
        terser "$path" --compress --mangle -o "assets/js/$outfile"
    fi
}

chokidar "assets/js/raw/**/*.js" --polling -c "sh -c 'minify() { path=\$1; filename=\$(basename \$path); if echo \$filename | grep -q \\.module\\.js; then outfile=\$(echo \$filename | sed s/\\.module\\.js\$/.min.js/); terser \$path --compress --mangle --ecma 2022 --module -o assets/js/\$outfile; else outfile=\$(echo \$filename | sed s/\\.js\$/.min.js/); terser \$path --compress --mangle -o assets/js/\$outfile; fi }; minify {path}'"
