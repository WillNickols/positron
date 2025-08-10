# Build Positron on Mac ARM

```bash
# Install and use Node.js 22.15.1
nvm install 22.15.1
nvm use 22.15.1

# Fix npm permissions if needed
sudo chown -R $(whoami) ~/.npm

# Install dependencies
sudo npm install

node versions/create-anchor.cjs

# Compile with increased memory limit
NODE_OPTIONS="--max-old-space-size=8192" npm run compile

# Launch Positron
./scripts/code.sh
```

```
npm run compile-build
```
