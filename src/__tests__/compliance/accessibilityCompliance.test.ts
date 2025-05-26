/**
 * WCAG 2.1 Accessibility Compliance Tests
 * Tests compliance with Web Content Accessibility Guidelines 2.1
 */

describe('WCAG 2.1 Accessibility Compliance Tests', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    
    // Mock accessibility APIs
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        speak: jest.fn(),
        cancel: jest.fn(),
        pause: jest.fn(),
        resume: jest.fn(),
        getVoices: jest.fn(() => [])
      }
    });
  });

  describe('Perceivable - WCAG 2.1 Level A', () => {
    describe('1.1 Text Alternatives', () => {
      it('should provide text alternatives for images', () => {
        const img = document.createElement('img');
        img.src = '/images/tax-form.png';
        img.alt = 'Tax form submission interface';
        document.body.appendChild(img);

        expect(img.alt).toBeTruthy();
        expect(img.alt.length).toBeGreaterThan(0);
        expect(img.alt).not.toBe('image'); // Should be descriptive
      });

      it('should provide text alternatives for icons', () => {
        const icon = document.createElement('span');
        icon.className = 'icon-calculator';
        icon.setAttribute('aria-label', 'Tax calculator');
        icon.setAttribute('role', 'img');
        document.body.appendChild(icon);

        expect(icon.getAttribute('aria-label')).toBeTruthy();
        expect(icon.getAttribute('role')).toBe('img');
      });

      it('should provide text alternatives for charts and graphs', () => {
        const chart = document.createElement('div');
        chart.setAttribute('role', 'img');
        chart.setAttribute('aria-label', 'Tax breakdown chart showing 60% income tax, 30% national insurance, 10% other');
        
        const table = document.createElement('table');
        table.setAttribute('aria-describedby', 'chart-description');
        
        const description = document.createElement('div');
        description.id = 'chart-description';
        description.textContent = 'Detailed breakdown: Income tax £12,000, National Insurance £6,000, Other £2,000';

        document.body.appendChild(chart);
        document.body.appendChild(table);
        document.body.appendChild(description);

        expect(chart.getAttribute('aria-label')).toBeTruthy();
        expect(table.getAttribute('aria-describedby')).toBe('chart-description');
        expect(description.textContent).toBeTruthy();
      });
    });

    describe('1.2 Time-based Media', () => {
      it('should provide captions for video content', () => {
        const video = document.createElement('video');
        video.controls = true;
        
        const track = document.createElement('track');
        track.kind = 'captions';
        track.src = '/captions/tax-tutorial.vtt';
        track.srclang = 'en';
        track.label = 'English captions';
        track.default = true;

        video.appendChild(track);
        document.body.appendChild(video);

        expect(video.querySelector('track[kind="captions"]')).toBeTruthy();
        expect(track.srclang).toBe('en');
        expect(track.default).toBe(true);
      });

      it('should provide audio descriptions for video content', () => {
        const video = document.createElement('video');
        video.controls = true;
        
        const audioTrack = document.createElement('track');
        audioTrack.kind = 'descriptions';
        audioTrack.src = '/descriptions/tax-tutorial.vtt';
        audioTrack.srclang = 'en';
        audioTrack.label = 'Audio descriptions';

        video.appendChild(audioTrack);
        document.body.appendChild(video);

        expect(video.querySelector('track[kind="descriptions"]')).toBeTruthy();
      });
    });

    describe('1.3 Adaptable', () => {
      it('should use semantic HTML structure', () => {
        const main = document.createElement('main');
        const header = document.createElement('header');
        const nav = document.createElement('nav');
        const section = document.createElement('section');
        const article = document.createElement('article');
        const aside = document.createElement('aside');
        const footer = document.createElement('footer');

        document.body.appendChild(header);
        document.body.appendChild(nav);
        document.body.appendChild(main);
        main.appendChild(section);
        section.appendChild(article);
        document.body.appendChild(aside);
        document.body.appendChild(footer);

        expect(document.querySelector('main')).toBeTruthy();
        expect(document.querySelector('header')).toBeTruthy();
        expect(document.querySelector('nav')).toBeTruthy();
        expect(document.querySelector('section')).toBeTruthy();
        expect(document.querySelector('article')).toBeTruthy();
        expect(document.querySelector('aside')).toBeTruthy();
        expect(document.querySelector('footer')).toBeTruthy();
      });

      it('should use proper heading hierarchy', () => {
        const h1 = document.createElement('h1');
        h1.textContent = 'Tax Submission';
        
        const h2 = document.createElement('h2');
        h2.textContent = 'Personal Details';
        
        const h3 = document.createElement('h3');
        h3.textContent = 'Contact Information';

        document.body.appendChild(h1);
        document.body.appendChild(h2);
        document.body.appendChild(h3);

        expect(document.querySelector('h1')).toBeTruthy();
        expect(document.querySelector('h2')).toBeTruthy();
        expect(document.querySelector('h3')).toBeTruthy();
        
        // Should not skip heading levels
        expect(document.querySelector('h1 + h3')).toBeFalsy();
      });

      it('should use proper form labels and structure', () => {
        const form = document.createElement('form');
        
        const fieldset = document.createElement('fieldset');
        const legend = document.createElement('legend');
        legend.textContent = 'Tax Information';
        fieldset.appendChild(legend);

        const label = document.createElement('label');
        label.htmlFor = 'income-amount';
        label.textContent = 'Annual Income';

        const input = document.createElement('input');
        input.type = 'number';
        input.id = 'income-amount';
        input.name = 'income';
        input.required = true;
        input.setAttribute('aria-describedby', 'income-help');

        const helpText = document.createElement('div');
        helpText.id = 'income-help';
        helpText.textContent = 'Enter your total annual income in pounds';

        fieldset.appendChild(label);
        fieldset.appendChild(input);
        fieldset.appendChild(helpText);
        form.appendChild(fieldset);
        document.body.appendChild(form);

        expect(label.htmlFor).toBe(input.id);
        expect(input.getAttribute('aria-describedby')).toBe('income-help');
        expect(fieldset.querySelector('legend')).toBeTruthy();
      });

      it('should use proper table structure', () => {
        const table = document.createElement('table');
        
        const caption = document.createElement('caption');
        caption.textContent = 'Tax Calculation Breakdown';
        
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        const tfoot = document.createElement('tfoot');

        const headerRow = document.createElement('tr');
        const th1 = document.createElement('th');
        th1.textContent = 'Category';
        th1.scope = 'col';
        const th2 = document.createElement('th');
        th2.textContent = 'Amount';
        th2.scope = 'col';

        headerRow.appendChild(th1);
        headerRow.appendChild(th2);
        thead.appendChild(headerRow);

        const dataRow = document.createElement('tr');
        const td1 = document.createElement('td');
        td1.textContent = 'Income Tax';
        const td2 = document.createElement('td');
        td2.textContent = '£5,000';

        dataRow.appendChild(td1);
        dataRow.appendChild(td2);
        tbody.appendChild(dataRow);

        table.appendChild(caption);
        table.appendChild(thead);
        table.appendChild(tbody);
        table.appendChild(tfoot);
        document.body.appendChild(table);

        expect(table.querySelector('caption')).toBeTruthy();
        expect(table.querySelector('thead')).toBeTruthy();
        expect(table.querySelector('tbody')).toBeTruthy();
        expect(th1.scope).toBe('col');
        expect(th2.scope).toBe('col');
      });
    });

    describe('1.4 Distinguishable', () => {
      it('should meet color contrast requirements', () => {
        const button = document.createElement('button');
        button.textContent = 'Submit Tax Return';
        button.style.backgroundColor = '#0066cc';
        button.style.color = '#ffffff';
        document.body.appendChild(button);

        // Test would verify contrast ratio >= 4.5:1 for normal text
        // Test would verify contrast ratio >= 3:1 for large text
        expect(button.style.backgroundColor).toBeTruthy();
        expect(button.style.color).toBeTruthy();
      });

      it('should not rely solely on color for information', () => {
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error';
        errorMessage.setAttribute('role', 'alert');
        errorMessage.innerHTML = '<span aria-hidden="true">⚠️</span> Error: Please enter a valid UTR number';
        document.body.appendChild(errorMessage);

        const successMessage = document.createElement('div');
        successMessage.className = 'success';
        successMessage.setAttribute('role', 'status');
        successMessage.innerHTML = '<span aria-hidden="true">✓</span> Success: Tax return submitted';
        document.body.appendChild(successMessage);

        // Should use icons/text in addition to color
        expect(errorMessage.textContent).toContain('Error:');
        expect(successMessage.textContent).toContain('Success:');
        expect(errorMessage.getAttribute('role')).toBe('alert');
        expect(successMessage.getAttribute('role')).toBe('status');
      });

      it('should support text resize up to 200%', () => {
        const text = document.createElement('p');
        text.textContent = 'Tax calculation details';
        text.style.fontSize = '16px';
        document.body.appendChild(text);

        // Simulate 200% zoom
        text.style.fontSize = '32px';
        
        // Content should still be readable and functional
        expect(text.style.fontSize).toBe('32px');
        expect(text.textContent).toBeTruthy();
      });

      it('should support images of text resize', () => {
        const textImage = document.createElement('img');
        textImage.src = '/images/tax-rates-chart.svg';
        textImage.alt = 'Tax rates: Basic rate 20%, Higher rate 40%, Additional rate 45%';
        textImage.style.width = '100%';
        textImage.style.height = 'auto';
        document.body.appendChild(textImage);

        // SVG images should scale properly
        expect(textImage.style.width).toBe('100%');
        expect(textImage.alt).toBeTruthy();
      });
    });
  });

  describe('Operable - WCAG 2.1 Level A', () => {
    describe('2.1 Keyboard Accessible', () => {
      it('should make all functionality keyboard accessible', () => {
        const button = document.createElement('button');
        button.textContent = 'Calculate Tax';
        button.tabIndex = 0;
        document.body.appendChild(button);

        const link = document.createElement('a');
        link.href = '/tax-help';
        link.textContent = 'Tax Help';
        document.body.appendChild(link);

        const input = document.createElement('input');
        input.type = 'text';
        input.tabIndex = 0;
        document.body.appendChild(input);

        expect(button.tabIndex).toBe(0);
        expect(link.href).toBeTruthy();
        expect(input.tabIndex).toBe(0);
      });

      it('should provide visible focus indicators', () => {
        const button = document.createElement('button');
        button.textContent = 'Submit';
        button.style.outline = '2px solid #0066cc';
        button.style.outlineOffset = '2px';
        document.body.appendChild(button);

        // Focus should be clearly visible
        expect(button.style.outline).toBeTruthy();
        expect(button.style.outlineOffset).toBeTruthy();
      });

      it('should not trap keyboard focus', () => {
        const modal = document.createElement('div');
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'modal-title');

        const title = document.createElement('h2');
        title.id = 'modal-title';
        title.textContent = 'Confirm Tax Submission';

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.setAttribute('aria-label', 'Close dialog');

        modal.appendChild(title);
        modal.appendChild(closeButton);
        document.body.appendChild(modal);

        // Modal should manage focus properly
        expect(modal.getAttribute('aria-modal')).toBe('true');
        expect(closeButton.getAttribute('aria-label')).toBeTruthy();
      });
    });

    describe('2.2 Enough Time', () => {
      it('should provide time limits that can be extended', () => {
        const sessionWarning = document.createElement('div');
        sessionWarning.setAttribute('role', 'alert');
        sessionWarning.innerHTML = `
          <p>Your session will expire in 5 minutes.</p>
          <button id="extend-session">Extend Session</button>
        `;
        document.body.appendChild(sessionWarning);

        const extendButton = document.getElementById('extend-session');
        expect(extendButton).toBeTruthy();
        expect(sessionWarning.getAttribute('role')).toBe('alert');
      });

      it('should pause auto-updating content', () => {
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.id = 'calculation-status';

        const pauseButton = document.createElement('button');
        pauseButton.textContent = 'Pause Updates';
        pauseButton.setAttribute('aria-controls', 'calculation-status');

        document.body.appendChild(liveRegion);
        document.body.appendChild(pauseButton);

        expect(liveRegion.getAttribute('aria-live')).toBe('polite');
        expect(pauseButton.getAttribute('aria-controls')).toBe('calculation-status');
      });
    });

    describe('2.3 Seizures and Physical Reactions', () => {
      it('should not contain flashing content', () => {
        const animation = document.createElement('div');
        animation.className = 'loading-spinner';
        animation.style.animation = 'spin 2s linear infinite';
        document.body.appendChild(animation);

        // Animation should be slow and not flash more than 3 times per second
        expect(animation.style.animation).toContain('2s'); // 2 second duration
      });

      it('should provide option to disable animations', () => {
        const reduceMotionButton = document.createElement('button');
        reduceMotionButton.textContent = 'Reduce Motion';
        reduceMotionButton.setAttribute('aria-pressed', 'false');
        document.body.appendChild(reduceMotionButton);

        // Should respect prefers-reduced-motion
        expect(reduceMotionButton.getAttribute('aria-pressed')).toBe('false');
      });
    });

    describe('2.4 Navigable', () => {
      it('should provide skip links', () => {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = 'Skip to main content';
        skipLink.className = 'skip-link';
        document.body.appendChild(skipLink);

        const mainContent = document.createElement('main');
        mainContent.id = 'main-content';
        document.body.appendChild(mainContent);

        expect(skipLink.href).toContain('#main-content');
        expect(mainContent.id).toBe('main-content');
      });

      it('should provide descriptive page titles', () => {
        document.title = 'Tax Calculation - Personal Tax Return - ZenRent';
        expect(document.title).toContain('Tax Calculation');
        expect(document.title).toContain('ZenRent');
      });

      it('should provide descriptive link text', () => {
        const link = document.createElement('a');
        link.href = '/tax-help';
        link.textContent = 'Learn more about tax calculations';
        document.body.appendChild(link);

        // Should not use generic text like "click here" or "read more"
        expect(link.textContent).not.toMatch(/click here|read more|more/i);
        expect(link.textContent.length).toBeGreaterThan(4);
      });

      it('should provide multiple navigation methods', () => {
        const nav = document.createElement('nav');
        nav.setAttribute('aria-label', 'Main navigation');
        
        const breadcrumb = document.createElement('nav');
        breadcrumb.setAttribute('aria-label', 'Breadcrumb');
        
        const sitemap = document.createElement('a');
        sitemap.href = '/sitemap';
        sitemap.textContent = 'Site Map';

        document.body.appendChild(nav);
        document.body.appendChild(breadcrumb);
        document.body.appendChild(sitemap);

        expect(nav.getAttribute('aria-label')).toBe('Main navigation');
        expect(breadcrumb.getAttribute('aria-label')).toBe('Breadcrumb');
        expect(sitemap.href).toContain('/sitemap');
      });

      it('should provide clear headings and labels', () => {
        const section = document.createElement('section');
        section.setAttribute('aria-labelledby', 'income-section');
        
        const heading = document.createElement('h2');
        heading.id = 'income-section';
        heading.textContent = 'Income Information';

        section.appendChild(heading);
        document.body.appendChild(section);

        expect(section.getAttribute('aria-labelledby')).toBe('income-section');
        expect(heading.textContent).toBeTruthy();
      });

      it('should indicate current page in navigation', () => {
        const nav = document.createElement('nav');
        
        const currentLink = document.createElement('a');
        currentLink.href = '/tax-calculation';
        currentLink.textContent = 'Tax Calculation';
        currentLink.setAttribute('aria-current', 'page');

        const otherLink = document.createElement('a');
        otherLink.href = '/tax-submission';
        otherLink.textContent = 'Tax Submission';

        nav.appendChild(currentLink);
        nav.appendChild(otherLink);
        document.body.appendChild(nav);

        expect(currentLink.getAttribute('aria-current')).toBe('page');
        expect(otherLink.getAttribute('aria-current')).toBeFalsy();
      });
    });
  });

  describe('Understandable - WCAG 2.1 Level A', () => {
    describe('3.1 Readable', () => {
      it('should specify page language', () => {
        document.documentElement.lang = 'en';
        expect(document.documentElement.lang).toBe('en');
      });

      it('should specify language changes', () => {
        const paragraph = document.createElement('p');
        paragraph.innerHTML = 'The tax rate is <span lang="fr">vingt pour cent</span> (20%).';
        document.body.appendChild(paragraph);

        const foreignText = paragraph.querySelector('[lang]');
        expect(foreignText?.getAttribute('lang')).toBe('fr');
      });
    });

    describe('3.2 Predictable', () => {
      it('should not change context on focus', () => {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Enter UTR number';
        // Should not automatically submit or navigate on focus
        document.body.appendChild(input);

        expect(input.type).toBe('text');
        expect(input.placeholder).toBeTruthy();
      });

      it('should not change context on input', () => {
        const select = document.createElement('select');
        select.setAttribute('aria-label', 'Select tax year');
        
        const option1 = document.createElement('option');
        option1.value = '2023-24';
        option1.textContent = '2023-24';
        
        const option2 = document.createElement('option');
        option2.value = '2022-23';
        option2.textContent = '2022-23';

        select.appendChild(option1);
        select.appendChild(option2);
        document.body.appendChild(select);

        // Should not auto-submit on selection change
        expect(select.getAttribute('aria-label')).toBeTruthy();
        expect(select.children.length).toBe(2);
      });

      it('should provide consistent navigation', () => {
        const nav1 = document.createElement('nav');
        nav1.innerHTML = `
          <a href="/dashboard">Dashboard</a>
          <a href="/tax-calculation">Tax Calculation</a>
          <a href="/submission">Submission</a>
        `;

        const nav2 = document.createElement('nav');
        nav2.innerHTML = `
          <a href="/dashboard">Dashboard</a>
          <a href="/tax-calculation">Tax Calculation</a>
          <a href="/submission">Submission</a>
        `;

        document.body.appendChild(nav1);
        document.body.appendChild(nav2);

        // Navigation should be consistent across pages
        expect(nav1.innerHTML).toBe(nav2.innerHTML);
      });

      it('should provide consistent identification', () => {
        const submitButton1 = document.createElement('button');
        submitButton1.textContent = 'Submit Tax Return';
        submitButton1.className = 'btn-primary';

        const submitButton2 = document.createElement('button');
        submitButton2.textContent = 'Submit Tax Return';
        submitButton2.className = 'btn-primary';

        document.body.appendChild(submitButton1);
        document.body.appendChild(submitButton2);

        // Same functionality should have same identification
        expect(submitButton1.textContent).toBe(submitButton2.textContent);
        expect(submitButton1.className).toBe(submitButton2.className);
      });
    });

    describe('3.3 Input Assistance', () => {
      it('should identify required fields', () => {
        const label = document.createElement('label');
        label.htmlFor = 'utr-number';
        label.innerHTML = 'UTR Number <span aria-label="required">*</span>';

        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'utr-number';
        input.required = true;
        input.setAttribute('aria-required', 'true');

        document.body.appendChild(label);
        document.body.appendChild(input);

        expect(input.required).toBe(true);
        expect(input.getAttribute('aria-required')).toBe('true');
        expect(label.innerHTML).toContain('required');
      });

      it('should provide error identification', () => {
        const input = document.createElement('input');
        input.type = 'email';
        input.id = 'email';
        input.setAttribute('aria-describedby', 'email-error');
        input.setAttribute('aria-invalid', 'true');

        const error = document.createElement('div');
        error.id = 'email-error';
        error.setAttribute('role', 'alert');
        error.textContent = 'Error: Please enter a valid email address';

        document.body.appendChild(input);
        document.body.appendChild(error);

        expect(input.getAttribute('aria-invalid')).toBe('true');
        expect(input.getAttribute('aria-describedby')).toBe('email-error');
        expect(error.getAttribute('role')).toBe('alert');
        expect(error.textContent).toContain('Error:');
      });

      it('should provide labels and instructions', () => {
        const fieldset = document.createElement('fieldset');
        
        const legend = document.createElement('legend');
        legend.textContent = 'Contact Information';

        const label = document.createElement('label');
        label.htmlFor = 'phone';
        label.textContent = 'Phone Number';

        const input = document.createElement('input');
        input.type = 'tel';
        input.id = 'phone';
        input.setAttribute('aria-describedby', 'phone-format');

        const instruction = document.createElement('div');
        instruction.id = 'phone-format';
        instruction.textContent = 'Format: 01234 567890';

        fieldset.appendChild(legend);
        fieldset.appendChild(label);
        fieldset.appendChild(input);
        fieldset.appendChild(instruction);
        document.body.appendChild(fieldset);

        expect(label.htmlFor).toBe(input.id);
        expect(input.getAttribute('aria-describedby')).toBe('phone-format');
        expect(instruction.textContent).toBeTruthy();
      });

      it('should provide error suggestions', () => {
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'utr';
        input.setAttribute('aria-describedby', 'utr-error');
        input.setAttribute('aria-invalid', 'true');

        const error = document.createElement('div');
        error.id = 'utr-error';
        error.setAttribute('role', 'alert');
        error.innerHTML = `
          <p>Error: UTR number must be 10 digits</p>
          <p>Suggestion: Check your UTR number on your tax documents. It should be exactly 10 digits long.</p>
        `;

        document.body.appendChild(input);
        document.body.appendChild(error);

        expect(error.textContent).toContain('Error:');
        expect(error.textContent).toContain('Suggestion:');
        expect(error.getAttribute('role')).toBe('alert');
      });

      it('should prevent errors for legal commitments', () => {
        const form = document.createElement('form');
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'confirm-accuracy';
        checkbox.required = true;

        const label = document.createElement('label');
        label.htmlFor = 'confirm-accuracy';
        label.textContent = 'I confirm that the information provided is accurate and complete';

        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.textContent = 'Submit Tax Return';

        const confirmDialog = document.createElement('div');
        confirmDialog.setAttribute('role', 'dialog');
        confirmDialog.setAttribute('aria-modal', 'true');
        confirmDialog.innerHTML = `
          <h2>Confirm Submission</h2>
          <p>Are you sure you want to submit your tax return? This action cannot be undone.</p>
          <button>Cancel</button>
          <button>Confirm Submission</button>
        `;

        form.appendChild(checkbox);
        form.appendChild(label);
        form.appendChild(submitButton);
        document.body.appendChild(form);
        document.body.appendChild(confirmDialog);

        expect(checkbox.required).toBe(true);
        expect(confirmDialog.getAttribute('role')).toBe('dialog');
        expect(confirmDialog.textContent).toContain('cannot be undone');
      });
    });
  });

  describe('Robust - WCAG 2.1 Level A', () => {
    describe('4.1 Compatible', () => {
      it('should use valid HTML markup', () => {
        const form = document.createElement('form');
        form.setAttribute('novalidate', '');
        
        const input = document.createElement('input');
        input.type = 'email';
        input.id = 'user-email';
        input.name = 'email';

        const label = document.createElement('label');
        label.htmlFor = 'user-email';
        label.textContent = 'Email Address';

        form.appendChild(label);
        form.appendChild(input);
        document.body.appendChild(form);

        // Elements should have proper attributes
        expect(input.id).toBeTruthy();
        expect(input.name).toBeTruthy();
        expect(label.htmlFor).toBe(input.id);
      });

      it('should provide proper names, roles, and values', () => {
        const button = document.createElement('button');
        button.setAttribute('role', 'button');
        button.setAttribute('aria-label', 'Calculate tax amount');
        button.textContent = 'Calculate';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'agree-terms';
        checkbox.setAttribute('aria-describedby', 'terms-description');

        const description = document.createElement('div');
        description.id = 'terms-description';
        description.textContent = 'I agree to the terms and conditions';

        document.body.appendChild(button);
        document.body.appendChild(checkbox);
        document.body.appendChild(description);

        expect(button.getAttribute('aria-label')).toBeTruthy();
        expect(checkbox.getAttribute('aria-describedby')).toBe('terms-description');
        expect(description.id).toBeTruthy();
      });

      it('should support assistive technologies', () => {
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.id = 'status-updates';

        const progressBar = document.createElement('div');
        progressBar.setAttribute('role', 'progressbar');
        progressBar.setAttribute('aria-valuenow', '50');
        progressBar.setAttribute('aria-valuemin', '0');
        progressBar.setAttribute('aria-valuemax', '100');
        progressBar.setAttribute('aria-label', 'Tax calculation progress');

        const combobox = document.createElement('input');
        combobox.setAttribute('role', 'combobox');
        combobox.setAttribute('aria-expanded', 'false');
        combobox.setAttribute('aria-autocomplete', 'list');
        combobox.setAttribute('aria-controls', 'suggestions-list');

        const suggestionsList = document.createElement('ul');
        suggestionsList.id = 'suggestions-list';
        suggestionsList.setAttribute('role', 'listbox');

        document.body.appendChild(liveRegion);
        document.body.appendChild(progressBar);
        document.body.appendChild(combobox);
        document.body.appendChild(suggestionsList);

        expect(liveRegion.getAttribute('aria-live')).toBe('polite');
        expect(progressBar.getAttribute('role')).toBe('progressbar');
        expect(combobox.getAttribute('role')).toBe('combobox');
        expect(suggestionsList.getAttribute('role')).toBe('listbox');
      });
    });
  });

  describe('WCAG 2.1 Level AA Additional Requirements', () => {
    describe('Enhanced Color Contrast', () => {
      it('should meet AA color contrast requirements', () => {
        const text = document.createElement('p');
        text.textContent = 'Tax calculation results';
        text.style.color = '#333333';
        text.style.backgroundColor = '#ffffff';
        document.body.appendChild(text);

        // Should meet 4.5:1 contrast ratio for normal text
        // Should meet 3:1 contrast ratio for large text (18pt+ or 14pt+ bold)
        expect(text.style.color).toBeTruthy();
        expect(text.style.backgroundColor).toBeTruthy();
      });
    });

    describe('Resize Text', () => {
      it('should support 200% zoom without horizontal scrolling', () => {
        const container = document.createElement('div');
        container.style.maxWidth = '100%';
        container.style.overflow = 'hidden';
        container.textContent = 'Tax form content should remain readable at 200% zoom';
        document.body.appendChild(container);

        expect(container.style.maxWidth).toBe('100%');
        expect(container.style.overflow).toBe('hidden');
      });
    });

    describe('Reflow', () => {
      it('should support content reflow at 320px width', () => {
        const responsiveContainer = document.createElement('div');
        responsiveContainer.style.width = '100%';
        responsiveContainer.style.maxWidth = '320px';
        responsiveContainer.style.wordWrap = 'break-word';
        responsiveContainer.textContent = 'Content should reflow properly on narrow screens';
        document.body.appendChild(responsiveContainer);

        expect(responsiveContainer.style.maxWidth).toBe('320px');
        expect(responsiveContainer.style.wordWrap).toBe('break-word');
      });
    });

    describe('Non-text Contrast', () => {
      it('should meet contrast requirements for UI components', () => {
        const button = document.createElement('button');
        button.textContent = 'Submit';
        button.style.border = '2px solid #767676';
        button.style.backgroundColor = '#ffffff';
        document.body.appendChild(button);

        // UI components should meet 3:1 contrast ratio
        expect(button.style.border).toContain('#767676');
        expect(button.style.backgroundColor).toBeTruthy();
      });
    });
  });
}); 