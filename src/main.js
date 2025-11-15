/**
 * Main function to compare responses from two LLM models
 * Validates input, makes API calls, and displays results
 */

import { escapeHtml, displayError } from "./utils/helpers.js"

async function compareResponses() {
  // Get all form input values
  const endpoint1 = document.getElementById('endpoint1').value;
  const endpoint2 = document.getElementById('endpoint2').value;
  const apikey1 = document.getElementById('apikey1').value;
  const apikey2 = document.getElementById('apikey2').value;
  const model1 = document.getElementById('model1').value;
  const model2 = document.getElementById('model2').value;
  const prompt = document.getElementById('prompt').value;

  // Validate that all required fields are filled
  if (!endpoint1 || !endpoint2 || !apikey1 || !apikey2 || !model1 || !model2 || !prompt) {
    alert('Please fill in all fields');
    return;
  }

  // Show loading state and hide previous results
  document.getElementById('loading').style.display = 'block';
  document.getElementById('results').style.display = 'none';

  try {
    // Make parallel API calls to both models for faster comparison
    const [result1, result2] = await Promise.all([
      callModel(endpoint1, apikey1, model1, prompt),
      callModel(endpoint2, apikey2, model2, prompt)
    ]);

    // Display the comparison results
    displayResults(result1, result2, model1, model2);
  } catch (error) {
    console.error('Error comparing responses:', error);
    displayError('Error comparing responses: ' + error.message);
  } finally {
    // Hide loading state regardless of success or failure
    document.getElementById('loading').style.display = 'none';
  }
}

/**
 * Makes an API call to a specific LLM model
 * @param {string} endpoint - The API endpoint URL
 * @param {string} apiKey - The API key for authentication
 * @param {string} model - The model identifier
 * @param {string} prompt - The user prompt to send
 * @returns {Promise<Object>} Response object containing content and metrics
 */
async function callModel(endpoint, apiKey, model, prompt) {
  const startTime = Date.now();

  // Prepare the request payload in OpenAI format
  // This works for both OpenAI and Anthropic APIs with minor differences
  const payload = {
    model: model,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: 1000,
    temperature: 0.7
  };

  // Make the API request
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  const endTime = Date.now();
  const responseTime = endTime - startTime;

  // Check if the request was successful
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  // Initialize default values for response parsing
  let content = '';
  let promptTokens = 0;
  let completionTokens = 0;
  let totalTokens = 0;

  // Parse response based on API format (OpenAI vs Anthropic)
  if (data.choices && data.choices[0] && data.choices[0].message) {
    // OpenAI format
    content = data.choices[0].message.content;
    if (data.usage) {
      promptTokens = data.usage.prompt_tokens || 0;
      completionTokens = data.usage.completion_tokens || 0;
      totalTokens = data.usage.total_tokens || 0;
    }
  } else if (data.content && data.content[0] && data.content[0].text) {
    // Anthropic format
    content = data.content[0].text;
    if (data.usage) {
      promptTokens = data.usage.input_tokens || 0;
      completionTokens = data.usage.output_tokens || 0;
      totalTokens = promptTokens + completionTokens;
    }
  } else {
    throw new Error('Unexpected response format');
  }

  // Return structured response object
  return {
    content,
    responseTime,
    promptTokens,
    completionTokens,
    totalTokens
  };
}

/**
 * Displays the comparison results in the UI
 * @param {Object} result1 - Response data from model 1
 * @param {Object} result2 - Response data from model 2
 * @param {string} model1Name - Name of model 1
 * @param {string} model2Name - Name of model 2
 */
function displayResults(result1, result2, model1Name, model2Name) {
  // Generate and display metrics for model 1
  document.getElementById('metrics1').innerHTML = `
                <div class="metric-item">
                    <span class="metric-label">Model:</span>
                    <span class="metric-value">${model1Name}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Response Time:</span>
                    <span class="metric-value">${result1.responseTime}ms</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Prompt Tokens:</span>
                    <span class="metric-value">${result1.promptTokens}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Completion Tokens:</span>
                    <span class="metric-value">${result1.completionTokens}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Total Tokens:</span>
                    <span class="metric-value">${result1.totalTokens}</span>
                </div>
            `;

  // Generate and display metrics for model 2
  document.getElementById('metrics2').innerHTML = `
                <div class="metric-item">
                    <span class="metric-label">Model:</span>
                    <span class="metric-value">${model2Name}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Response Time:</span>
                    <span class="metric-value">${result2.responseTime}ms</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Prompt Tokens:</span>
                    <span class="metric-value">${result2.promptTokens}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Completion Tokens:</span>
                    <span class="metric-value">${result2.completionTokens}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Total Tokens:</span>
                    <span class="metric-value">${result2.totalTokens}</span>
                </div>
            `;

  // Check if difference highlighting is enabled
  const highlightEnabled = document.getElementById('highlightToggle').checked;

  // Display responses with or without highlighting based on toggle state
  if (highlightEnabled) {
    // Apply difference highlighting
    const [highlighted1, highlighted2] = highlightDifferences(result1.content, result2.content);
    document.getElementById('response1').innerHTML = highlighted1;
    document.getElementById('response2').innerHTML = highlighted2;
  } else {
    // Display plain text without highlighting
    document.getElementById('response1').textContent = result1.content;
    document.getElementById('response2').textContent = result2.content;
  }

  // Show the results section
  document.getElementById('results').style.display = 'block';
}

/**
 * Highlights differences between two text strings by comparing words
 * @param {string} text1 - First text to compare
 * @param {string} text2 - Second text to compare
 * @returns {Array<string>} Array containing highlighted HTML for both texts
 */
function highlightDifferences(text1, text2) {
  // Split texts into words and whitespace tokens to preserve spacing
  const words1 = text1.split(/(\s+)/);
  const words2 = text2.split(/(\s+)/);

  // Use the longer array length to handle texts of different lengths
  const maxLength = Math.max(words1.length, words2.length);
  let highlighted1 = '';
  let highlighted2 = '';

  // Compare each word position
  for (let i = 0; i < maxLength; i++) {
    const word1 = words1[i] || '';
    const word2 = words2[i] || '';

    // If words are different, highlight them
    if (word1 !== word2) {
      if (word1) {
        // Mark as removed (red highlighting)
        highlighted1 += `<span class="diff-removed">${escapeHtml(word1)}</span>`;
      }
      if (word2) {
        // Mark as added (green highlighting)
        highlighted2 += `<span class="diff-added">${escapeHtml(word2)}</span>`;
      }
    } else {
      // Words are the same, no highlighting needed
      highlighted1 += escapeHtml(word1);
      highlighted2 += escapeHtml(word2);
    }
  }

  return [highlighted1, highlighted2];
}

document.getElementById('compareBtn').addEventListener('click', compareResponses);
