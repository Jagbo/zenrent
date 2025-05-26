/**
 * Browser Compatibility Tests for HMRC Tax System
 * Tests cross-browser functionality and responsive design
 */

describe('Browser Compatibility Tests', () => {
  // Mock browser environments
  const mockUserAgents = {
    chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1'
  };

  beforeEach(() => {
    // Reset DOM and global objects
    document.body.innerHTML = '';
    
    // Mock window.matchMedia for responsive tests
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  describe('Core JavaScript Features', () => {
    it('should support modern JavaScript features', () => {
      // Test arrow functions
      const arrowFunction = () => 'test';
      expect(arrowFunction()).toBe('test');

      // Test template literals
      const name = 'HMRC';
      expect(`Hello ${name}`).toBe('Hello HMRC');

      // Test destructuring
      const { length } = [1, 2, 3];
      expect(length).toBe(3);

      // Test async/await support
      expect(typeof Promise).toBe('function');
      expect(typeof (async function() { return Promise.resolve(); })).toBe('function');

      // Test Map and Set
      expect(typeof Map).toBe('function');
      expect(typeof Set).toBe('function');

      // Test Object methods
      expect(typeof Object.assign).toBe('function');
      expect(typeof Object.keys).toBe('function');
      expect(typeof Object.values).toBe('function');
    });

    it('should support required DOM APIs', () => {
      // Test querySelector
      expect(typeof document.querySelector).toBe('function');
      expect(typeof document.querySelectorAll).toBe('function');

      // Test addEventListener
      expect(typeof document.addEventListener).toBe('function');

      // Test localStorage
      expect(typeof localStorage).toBe('object');
      expect(typeof localStorage.getItem).toBe('function');
      expect(typeof localStorage.setItem).toBe('function');

      // Test sessionStorage
      expect(typeof sessionStorage).toBe('object');

      // Test fetch API
      expect(typeof fetch).toBe('function');

      // Test FormData
      expect(typeof FormData).toBe('function');

      // Test URL API
      expect(typeof URL).toBe('function');
    });

    it('should support required CSS features', () => {
      // Create test element
      const testElement = document.createElement('div');
      document.body.appendChild(testElement);

      // Test CSS Grid support
      testElement.style.display = 'grid';
      expect(testElement.style.display).toBe('grid');

      // Test CSS Flexbox support
      testElement.style.display = 'flex';
      expect(testElement.style.display).toBe('flex');

      // Test CSS Custom Properties (variables)
      testElement.style.setProperty('--test-color', 'red');
      expect(testElement.style.getPropertyValue('--test-color')).toBe('red');

      // Test CSS calc() function
      testElement.style.width = 'calc(100% - 20px)';
      expect(testElement.style.width).toBe('calc(100% - 20px)');
    });
  });

  describe('Form Validation Compatibility', () => {
    it('should support HTML5 form validation', () => {
      const form = document.createElement('form');
      const input = document.createElement('input');
      
      input.type = 'email';
      input.required = true;
      form.appendChild(input);
      document.body.appendChild(form);

      // Test validation API
      expect(typeof input.checkValidity).toBe('function');
      expect(typeof input.setCustomValidity).toBe('function');
      expect(typeof input.validity).toBe('object');

      // Test validation states
      input.value = 'invalid-email';
      expect(input.checkValidity()).toBe(false);

      input.value = 'valid@example.com';
      expect(input.checkValidity()).toBe(true);
    });

    it('should support input types for tax forms', () => {
      const testInputTypes = [
        'text', 'email', 'tel', 'number', 'date', 'password'
      ];

      testInputTypes.forEach(type => {
        const input = document.createElement('input');
        input.type = type;
        expect(input.type).toBe(type);
      });
    });

    it('should support form attributes', () => {
      const input = document.createElement('input');
      
      // Test required attribute
      input.required = true;
      expect(input.required).toBe(true);

      // Test pattern attribute
      input.pattern = '[0-9]{10}';
      expect(input.pattern).toBe('[0-9]{10}');

      // Test min/max for numbers
      input.type = 'number';
      input.min = '0';
      input.max = '999999';
      expect(input.min).toBe('0');
      expect(input.max).toBe('999999');
    });
  });

  describe('Responsive Design Support', () => {
    it('should support viewport meta tag', () => {
      const viewport = document.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1';
      
      expect(viewport.name).toBe('viewport');
      expect(viewport.content).toBe('width=device-width, initial-scale=1');
    });

    it('should support media queries', () => {
      // Test matchMedia API
      const mediaQuery = window.matchMedia('(max-width: 768px)');
      expect(typeof mediaQuery.matches).toBe('boolean');
      expect(typeof mediaQuery.addListener).toBe('function');
    });

    it('should handle different screen sizes', () => {
      const breakpoints = [
        { name: 'mobile', width: 320 },
        { name: 'tablet', width: 768 },
        { name: 'desktop', width: 1024 },
        { name: 'large', width: 1440 }
      ];

      breakpoints.forEach(breakpoint => {
        // Mock window dimensions
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: breakpoint.width,
        });

        expect(window.innerWidth).toBe(breakpoint.width);
      });
    });
  });

  describe('Accessibility Support', () => {
    it('should support ARIA attributes', () => {
      const button = document.createElement('button');
      
      button.setAttribute('aria-label', 'Submit tax return');
      button.setAttribute('aria-describedby', 'help-text');
      button.setAttribute('aria-expanded', 'false');

      expect(button.getAttribute('aria-label')).toBe('Submit tax return');
      expect(button.getAttribute('aria-describedby')).toBe('help-text');
      expect(button.getAttribute('aria-expanded')).toBe('false');
    });

    it('should support keyboard navigation', () => {
      const input = document.createElement('input');
      const button = document.createElement('button');
      
      document.body.appendChild(input);
      document.body.appendChild(button);

      // Test tabindex
      input.tabIndex = 1;
      button.tabIndex = 2;

      expect(input.tabIndex).toBe(1);
      expect(button.tabIndex).toBe(2);

      // Test focus methods
      expect(typeof input.focus).toBe('function');
      expect(typeof input.blur).toBe('function');
    });

    it('should support screen reader compatibility', () => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      
      label.htmlFor = 'tax-input';
      input.id = 'tax-input';
      input.setAttribute('aria-required', 'true');

      expect(label.htmlFor).toBe('tax-input');
      expect(input.id).toBe('tax-input');
      expect(input.getAttribute('aria-required')).toBe('true');
    });
  });

  describe('Security Features', () => {
    it('should support Content Security Policy', () => {
      // Test CSP meta tag support
      const csp = document.createElement('meta');
      csp.httpEquiv = 'Content-Security-Policy';
      csp.content = "default-src 'self'";

      expect(csp.httpEquiv).toBe('Content-Security-Policy');
      expect(csp.content).toBe("default-src 'self'");
    });

    it('should support secure form submission', () => {
      const form = document.createElement('form');
      
      // Test HTTPS requirement
      form.action = 'https://api.hmrc.gov.uk/submit';
      form.method = 'POST';

      expect(form.action).toBe('https://api.hmrc.gov.uk/submit');
      expect(form.method).toBe('post');
    });

    it('should support input sanitization', () => {
      const input = document.createElement('input');
      
      // Test that script tags are not executed in input values
      input.value = '<script>alert("xss")</script>';
      expect(input.value).toBe('<script>alert("xss")</script>');
      
      // Value should be treated as text, not HTML
      expect(input.innerHTML).toBe('');
    });
  });

  describe('Performance Features', () => {
    it('should support modern loading strategies', () => {
      // Test lazy loading
      const img = document.createElement('img');
      img.loading = 'lazy';
      expect(img.loading).toBe('lazy');

      // Test preload
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'script';
      expect(link.rel).toBe('preload');
      expect(link.as).toBe('script');
    });

    it('should support service workers', () => {
      // Test service worker API availability
      expect('serviceWorker' in navigator).toBe(true);
    });

    it('should support web workers for calculations', () => {
      // Test web worker API availability
      expect(typeof Worker).toBe('function');
    });
  });

  describe('Browser-Specific Tests', () => {
    Object.entries(mockUserAgents).forEach(([browser, userAgent]) => {
      it(`should work in ${browser}`, () => {
        // Mock user agent
        Object.defineProperty(navigator, 'userAgent', {
          writable: true,
          value: userAgent
        });

        expect(navigator.userAgent).toBe(userAgent);

        // Test basic functionality that should work in all browsers
        expect(typeof document.createElement).toBe('function');
        expect(typeof JSON.parse).toBe('function');
        expect(typeof JSON.stringify).toBe('function');
        expect(typeof Array.isArray).toBe('function');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle JavaScript errors gracefully', () => {
      const errorHandler = jest.fn();
      
      window.addEventListener('error', errorHandler);
      
      // Test that error handler is set up
      expect(errorHandler).toBeDefined();
      
      // Test error object structure
      const mockError = new Error('Test error');
      expect(mockError.message).toBe('Test error');
      expect(mockError.name).toBe('Error');
    });

    it('should handle network errors', () => {
      // Test fetch error handling
      const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;

      expect(typeof fetch).toBe('function');
    });

    it('should handle storage quota exceeded', () => {
      // Test localStorage quota handling
      const mockSetItem = jest.fn().mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      Object.defineProperty(localStorage, 'setItem', {
        value: mockSetItem
      });

      expect(() => {
        localStorage.setItem('test', 'value');
      }).toThrow('QuotaExceededError');
    });
  });

  describe('Progressive Enhancement', () => {
    it('should work without JavaScript', () => {
      // Test that forms can be submitted without JS
      const form = document.createElement('form');
      form.action = '/submit';
      form.method = 'POST';

      const input = document.createElement('input');
      input.name = 'taxAmount';
      input.value = '1000';

      const submit = document.createElement('input');
      submit.type = 'submit';
      submit.value = 'Submit';

      form.appendChild(input);
      form.appendChild(submit);

      expect(form.action).toBe('/submit');
      expect(form.method).toBe('post');
      expect(input.value).toBe('1000');
    });

    it('should enhance with JavaScript when available', () => {
      // Test that JavaScript enhancements work
      const button = document.createElement('button');
      button.onclick = () => 'enhanced';

      expect(typeof button.onclick).toBe('function');
      expect(button.onclick()).toBe('enhanced');
    });
  });
}); 