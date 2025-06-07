// Server-side polyfills for browser globals
if (typeof global !== 'undefined') {
  // Define self for libraries that expect it
  if (typeof global.self === 'undefined') {
    global.self = global;
  }
  
  // Define window for libraries that check for it
  if (typeof global.window === 'undefined') {
    global.window = global;
  }
  
  // Define document stub
  if (typeof global.document === 'undefined') {
    global.document = {
      createElement: () => ({}),
      getElementsByTagName: () => [],
      getElementById: () => null,
      addEventListener: () => {},
      body: { appendChild: () => {} },
      head: { appendChild: () => {}, insertBefore: () => {} }
    };
  }
  
  // Define navigator stub
  if (typeof global.navigator === 'undefined') {
    global.navigator = {
      userAgent: 'Node.js',
      onLine: true,
      plugins: [],
      serviceWorker: undefined
    };
  }
  
  // Define localStorage stub
  if (typeof global.localStorage === 'undefined') {
    global.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {}
    };
  }
} 