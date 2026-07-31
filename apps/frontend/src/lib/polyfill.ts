// Polyfill MessageChannel for React 19 SSR support in environment lacking it (like Cloudflare Pages without nodejs_compat enabled)
if (typeof globalThis.MessageChannel === 'undefined') {
  class MessagePortPolyfill {
    onmessage: ((ev: any) => any) | null = null;
    _otherPort: MessagePortPolyfill | null = null;

    postMessage(message: any) {
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

    addEventListener(type: string, listener: any) {
      if (type === 'message') {
        this.onmessage = listener;
      }
    }

    removeEventListener(type: string, listener: any) {
      if (type === 'message' && this.onmessage === listener) {
        this.onmessage = null;
      }
    }

    start() {}
    close() {}
  }

  class MessageChannelPolyfill {
    port1: MessagePortPolyfill;
    port2: MessagePortPolyfill;

    constructor() {
      this.port1 = new MessagePortPolyfill();
      this.port2 = new MessagePortPolyfill();
      this.port1._otherPort = this.port2;
      this.port2._otherPort = this.port1;
    }
  }

  (globalThis as any).MessageChannel = MessageChannelPolyfill;
}
