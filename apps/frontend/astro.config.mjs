import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  server: {
    port: 3000,
  },
  output: 'server',
  adapter: cloudflare(),
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  vite: {
    build: {
      rollupOptions: {
        output: {
          banner: `
if (typeof globalThis.MessageChannel === 'undefined') {
  class MessagePortPolyfill {
    constructor() {
      this.onmessage = null;
      this._otherPort = null;
    }
    postMessage(message) {
      if (this._otherPort) {
        const other = this._otherPort;
        if (typeof queueMicrotask === 'function') {
          queueMicrotask(() => {
            if (other.onmessage) {
              other.onmessage({ data: message });
            }
          });
        } else {
          setTimeout(() => {
            if (other.onmessage) {
              other.onmessage({ data: message });
            }
          }, 0);
        }
      }
    }
    addEventListener(type, listener) {
      if (type === 'message') {
        this.onmessage = listener;
      }
    }
    removeEventListener(type, listener) {
      if (type === 'message' && this.onmessage === listener) {
        this.onmessage = null;
      }
    }
    start() {}
    close() {}
  }
  globalThis.MessageChannel = class MessageChannel {
    constructor() {
      this.port1 = new MessagePortPolyfill();
      this.port2 = new MessagePortPolyfill();
      this.port1._otherPort = this.port2;
      this.port2._otherPort = this.port1;
    }
  };
}
`
        }
      }
    }
  }
});

