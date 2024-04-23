# This builds a Tauri build with a server binary embedded in the app
# Add the moment it's specific to aarch64-apple-darwin
# @TODO: make it build for different platforms. Either as bash or re-write in JS.

cd back
deno compile --allow-all --output ../front/src-tauri/binaries/server-aarch64-apple-darwin main.ts
cd ..

cd front
npm run tauri build -- --debug
cd ..