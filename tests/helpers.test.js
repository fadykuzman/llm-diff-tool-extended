import { escapeHtml, displayError } from '../src/utils/helpers.js'

describe('Helper Functions', () => {
  describe('escapeHtml', () => {
    test('should escape HTML entities', () => {
      expect(escapeHtml('<div>test</div>')).toBe('&lt;div&gt;test&lt;/div&gt;');
    })

    test('should escape script tag', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;')
    })

    test('should return normal text unchanged', () => {
      expect(escapeHtml('normal text')).toBe('normal text')
    })

    test('should escape ampersands', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry')
    })

    test('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });
  })

  describe('displayError', () => {
    // Setup DOM before each test
    beforeEach(() => {
      document.body.innerHTML = `
          <div id="metrics1"></div>
          <div id="metrics2"></div>
          <div id="response1"></div>
          <div id="response2"></div>
          <div id="results" style="display: none;"></div>
        `;
    });

    test('should clear all metric divs', () => {
      document.getElementById('metrics1').innerHTML = 'some content';
      document.getElementById('metrics2').innerHTML = 'some content';

      displayError('Test error');

      expect(document.getElementById('metrics1').innerHTML).toBe('');
      expect(document.getElementById('metrics2').innerHTML).toBe('');
    });

    test('should display error message in response1', () => {
      displayError('Test error message');

      const response1 = document.getElementById('response1');
      expect(response1.innerHTML).toContain('Test error message');
      expect(response1.innerHTML).toContain('Error:');
      expect(response1.innerHTML).toContain('class="error"');
    });

    test('should clear response2', () => {
      document.getElementById('response2').innerHTML = 'some content';

      displayError('Test error');

      expect(document.getElementById('response2').innerHTML).toBe('');
    });

    test('should show results div', () => {
      displayError('Test error');

      const results = document.getElementById('results');
      expect(results.style.display).toBe('block');
    });

    test('should handle special characters in error message', () => {
      displayError('<script>alert("xss")</script>');

      const response1 = document.getElementById('response1');
      // Error message is inserted as HTML, not escaped

      expect(response1.innerHTML).toContain('<script>alert("xss")</script>');
    });
  });
})

