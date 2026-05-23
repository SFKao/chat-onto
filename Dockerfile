FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# 1. Purged 4.1 packages to eliminate the metadata overriding conflict
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    build-essential \
    pkg-config \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    libwebkit2gtk-4.0-dev \
    libjavascriptcoregtk-4.0-dev \
    libsoup2.4-dev \
    patchelf \
    git \
    && rm -rf /var/lib/apt/lists/*

# 2. Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# 3. Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# 4. Environment variable for AppImage tool inside Docker
ENV APPIMAGE_EXTRACT_AND_RUN=1

WORKDIR /app

CMD npm install && npm run tauri build