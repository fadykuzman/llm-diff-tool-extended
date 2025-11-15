/**
 * Escapes HTML characters to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} HTML-escaped text
 */
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Displays an error message in the results area
 * @param {string} message - Error message to display
 */
export function displayError(message) {
  // Clear existing results but maintain the structure
  document.getElementById('metrics1').innerHTML = '';
  document.getElementById('metrics2').innerHTML = '';
  document.getElementById('response1').innerHTML = '';
  document.getElementById('response2').innerHTML = '';

  // Display error message in the first response area
  document.getElementById('response1').innerHTML = `
                <div class="error">
                    <strong>Error:</strong> ${message}
                </div>
            `;

  // Show the results section to display the error
  document.getElementById('results').style.display = 'block';
}
