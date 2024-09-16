#!/bin/bash

# Detect OS and architecture
OS=$(uname -s)
ARCH=$(uname -m)

# Specify directory and main file for Deno compilation
BACK_DIR="src/back"
MAIN_FILE="main.ts"
BINARIES_DIR="../front/src-tauri/binaries"

# Map OS names to human-friendly versions
case "$OS" in
  Darwin) OS_NAME="apple-darwin" ;;
  Linux) OS_NAME="unknown-linux-gnu" ;;
  CYGWIN* | MINGW* | MSYS*) OS_NAME="pc-windows-msvc" ;;
  *) echo "Unsupported OS: $OS" && exit 1 ;;
esac

# Map architecture names to standard versions
case "$ARCH" in
  x86_64) ARCH_NAME="x86_64" ;;
  arm64) ARCH_NAME="aarch64" ;;
  *) echo "Unsupported architecture: $ARCH" && exit 1 ;;
esac

# Determine binary extension
if [[ "$OS_NAME" == "pc-windows-msvc" ]]; then
  EXT=".exe"
else
  EXT=""
fi

# Compile with Deno
cd "$BACK_DIR"
OUTPUT_PATH="$BINARIES_DIR/server-$ARCH_NAME-$OS_NAME$EXT"
deno compile --allow-all --output "$OUTPUT_PATH" "$MAIN_FILE"
cd ..

# Build the Tauri application
cd "front"
npm run tauri build -- --debug
cd ..