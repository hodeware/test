import jSuites from "jsuites";
import jEditor from '../../utils/editor/editor.js';
import { renderContent, stripHTML, typesetMath } from '../../utils/questionRenderer.js';
import { showToast } from '../../utils/toast.js';

export default function Extract() {
    let self = this;
    let editor = null;
    let useClaudeExtraction = false; // Track if using Claude-based extraction

    self.onload = function() {
        // Initialize jEditor
        const editorElement = self.el.querySelector('[data-editor]');
        if (editorElement) {
            editor = jEditor(editorElement, {
                placeholder: "Paste your question content here...",
                toolbar: true,
                toolbarOnTop: false,
                height: '400px',
                maxFileSize: 5000000,
                allowImageResize: true,
                dropZone: true,
                acceptFiles: false,
                acceptImages: true,
                dropAsSnippet: false,
                parseHTML: true,
            });
        }

        // Initialize switch state
        self.toggleInstructionsVisibility();
    }

    self.toggleClaudeExtraction = function(event) {
        useClaudeExtraction = event.target.checked;
        self.toggleInstructionsVisibility();
    }

    self.toggleInstructionsVisibility = function() {
        const instructionsContainer = self.el.querySelector('[data-instructions-container]');
        if (instructionsContainer) {
            if (useClaudeExtraction) {
                instructionsContainer.classList.remove('hidden');
            } else {
                instructionsContainer.classList.add('hidden');
            }
        }
    }

    self.extractQuestion = function() {
        if (!editor) {
            showToast('Editor not initialized', 'error');
            return;
        }

        const data = editor.getData(true); // Get JSON format with files
        const files = editor.getFiles(true);
        const outputElement = self.el.querySelector('[data-json-output]');
        const loadingElement = self.el.querySelector('[data-loading]');
        const extractButton = self.el.querySelector('[data-extract-button]');

        // Show loading state
        loadingElement.classList.remove('hidden');
        extractButton.disabled = true;

        // Prepare images from both data.images (inline) and files (uploaded)
        const images = [];

        // Add inline images from data.images (these are from pasted content)
        if (data.images && data.images.length > 0) {
            data.images.forEach((imgSrc, index) => {
                // Extract base64 data if it's a data URL
                if (imgSrc.startsWith('data:')) {
                    const parts = imgSrc.split(',');
                    const mimeMatch = imgSrc.match(/data:([^;]+);/);
                    let mediaType = mimeMatch ? mimeMatch[1] : 'image/png';

                    // Detect actual image type from base64 data
                    const base64Data = parts[1];
                    if (base64Data.startsWith('R0lGOD')) {
                        mediaType = 'image/gif';
                    } else if (base64Data.startsWith('iVBORw')) {
                        mediaType = 'image/png';
                    } else if (base64Data.startsWith('/9j/')) {
                        mediaType = 'image/jpeg';
                    } else if (base64Data.startsWith('UklGR')) {
                        mediaType = 'image/webp';
                    }

                    images.push({
                        name: `inline_image_${index}`,
                        data: base64Data,
                        mediaType: mediaType
                    });
                }
            });
        }

        // Add uploaded files
        if (files && files.length > 0) {
            files.forEach(file => {
                images.push({
                    name: file.name,
                    data: file.data.split(',')[1], // Remove data:image/png;base64, prefix
                    mediaType: `image/${file.extension}`
                });
            });
        }

        // Get custom instructions if using Claude extraction
        const customInstructions = useClaudeExtraction
            ? (self.el.querySelector('[data-custom-instructions]')?.value || '')
            : '';

        const payload = {
            content: data.content,
            images: images.length > 0 ? images : undefined,
            customInstructions: customInstructions
        };

        // Choose endpoint based on extraction mode
        const endpoint = useClaudeExtraction
            ? '/api/questions/extract-with-model'
            : '/api/questions/extract';

        fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().catch(() => {
                    throw new Error(`Server error: ${response.status} ${response.statusText}`);
                }).then(err => {
                    throw new Error(err.message || 'Server error');
                });
            }
            return response.json();
        })
        .then(result => {
            loadingElement.classList.add('hidden');
            extractButton.disabled = false;

            if (result.success) {
                // Pretty print the JSON
                outputElement.value = JSON.stringify(result.data, null, 2);

                // Render preview
                self.renderPreview(result.data);

                // Show token usage
                const usageElement = self.el.querySelector('[data-usage]');
                if (result.usage && usageElement) {
                    const mode = useClaudeExtraction ? 'Claude AI' : 'Regex';
                    usageElement.textContent = `Mode: ${mode} | Tokens used: ${result.usage.inputTokens} in / ${result.usage.outputTokens} out`;
                    usageElement.classList.remove('hidden');
                }

                showToast('Question extracted successfully!', 'success');
            } else {
                const errorMsg = result.message || 'Unknown error';
                showToast('Error: ' + errorMsg, 'error', 5000);
                outputElement.value = JSON.stringify({ error: errorMsg }, null, 2);
            }
        })
        .catch(error => {
            loadingElement.classList.add('hidden');
            extractButton.disabled = false;

            const errorMsg = error.message || 'Failed to extract question';
            showToast('Failed to extract: ' + errorMsg, 'error', 5000);
            console.error('Extraction error:', error);

            outputElement.value = JSON.stringify({
                error: errorMsg,
                details: error.stack || 'No additional details'
            }, null, 2);
        });
    }

    self.copyJson = function() {
        const outputElement = self.el.querySelector('[data-json-output]');
        outputElement.select();
        document.execCommand('copy');

        const copyButton = self.el.querySelector('[data-copy-button]');
        const originalText = copyButton.innerHTML;
        copyButton.innerHTML = '<span class="material-icons" style="font-size: 18px;">check</span><span>Copied!</span>';

        setTimeout(() => {
            copyButton.innerHTML = originalText;
        }, 2000);
    }

    self.clearAll = function() {
        if (confirm('Clear all content and start over?')) {
            if (editor) {
                editor.reset();
            }
            self.el.querySelector('[data-json-output]').value = '';
            self.el.querySelector('[data-usage]').classList.add('hidden');

            // Clear preview
            const previewContainer = self.el.querySelector('[data-preview]');
            previewContainer.innerHTML = '';
            previewContainer.classList.add('hidden');
        }
    }

    // Store current question data
    self.currentQuestionData = null;

    self.markCorrectAnswer = function(answerId) {
        if (!self.currentQuestionData || !self.currentQuestionData.answers) return;

        // Update correct flag for all answers
        self.currentQuestionData.answers.forEach(answer => {
            answer.correct = (answer.id === answerId);
        });

        // Update the JSON output
        const outputElement = self.el.querySelector('[data-json-output]');
        outputElement.value = JSON.stringify(self.currentQuestionData, null, 2);

        // Re-render preview to update radio buttons
        self.renderPreview(self.currentQuestionData);
    }

    self.saveQuestion = function() {
        if (!self.currentQuestionData) {
            showToast('No question data to save', 'warning');
            return;
        }

        // Check if at least one answer is marked as correct
        const hasCorrectAnswer = self.currentQuestionData.answers?.some(a => a.correct);
        if (!hasCorrectAnswer) {
            if (!confirm('No correct answer marked. Save anyway?')) {
                return;
            }
        }

        const saveButton = self.el.querySelector('[data-save-button]');
        saveButton.disabled = true;
        saveButton.innerHTML = '<span class="material-icons animate-spin" style="font-size: 18px;">refresh</span><span>Saving...</span>';

        fetch('/api/questions/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(self.currentQuestionData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw err; });
            }
            return response.json();
        })
        .then(result => {
            saveButton.disabled = false;
            saveButton.innerHTML = '<span class="material-icons" style="font-size: 18px;">check</span><span>Saved!</span>';

            setTimeout(() => {
                saveButton.innerHTML = '<span class="material-icons" style="font-size: 18px;">save</span><span>Save Question</span>';
            }, 2000);

            if (result.success) {
                showToast(`Question saved successfully! ID: ${result.id}`, 'success', 4000);
            }
        })
        .catch(error => {
            saveButton.disabled = false;
            saveButton.innerHTML = '<span class="material-icons" style="font-size: 18px;">save</span><span>Save Question</span>';
            showToast('Failed to save question: ' + (error.message || 'Unknown error'), 'error', 5000);
            console.error(error);
        });
    }

    // Preview rendering functions (reused from Render.js)
    self.renderPreview = function(questionData) {
        const previewContainer = self.el.querySelector('[data-preview]');
        const previewContent = self.el.querySelector('[data-preview-content]');
        const previewAnswers = self.el.querySelector('[data-preview-answers]');

        // Store current data
        self.currentQuestionData = questionData;

        // Show preview container
        previewContainer.classList.remove('hidden');

        // Render content with formulas
        previewContent.innerHTML = renderContent(questionData.content, questionData.images || []);

        // Render answers with radio buttons
        previewAnswers.innerHTML = '';
        if (questionData.answers && questionData.answers.length > 0) {
            questionData.answers.forEach((answer) => {
                const answerDiv = document.createElement('div');
                answerDiv.className = 'py-2 flex items-start space-x-2';

                // Check if answer content has placeholders {{n}}
                const hasPlaceholders = /\{\{\d+\}\}/.test(answer.content);
                let answerContent = hasPlaceholders
                    ? renderContent(answer.content, questionData.images || [])
                    : answer.content;

                // Replace &nbsp; with regular spaces
                answerContent = answerContent.replace(/&nbsp;/g, ' ');

                const isChecked = answer.correct ? 'checked' : '';
                const answerId = answer.id; // Capture in closure

                answerDiv.innerHTML = `
                    <input type="radio"
                           name="correct-answer"
                           id="answer-${answer.id}"
                           value="${answer.id}"
                           ${isChecked}
                           class="mt-1 w-4 h-4 text-green-600 focus:ring-green-500 cursor-pointer">
                    <label for="answer-${answer.id}" class="flex-1 cursor-pointer">
                        <strong>${answer.id.toUpperCase()}</strong>) ${answerContent}
                    </label>
                `;
                previewAnswers.appendChild(answerDiv);

                // Attach event listener to the radio button
                const radioButton = answerDiv.querySelector('input[type="radio"]');
                radioButton.addEventListener('change', () => {
                    self.markCorrectAnswer(answerId);
                });
            });
        }

        // Render LaTeX formulas with MathJax
        typesetMath([previewContent, previewAnswers]);
    }

    return `<div class="bg-gray-50 min-h-screen py-6">
        <div class="container mx-auto px-4">
            <div class="mb-6">
                <h1 class="text-3xl font-bold text-gray-900">Question Extractor</h1>
                <p class="text-gray-600 mt-2">Paste or enter question content to extract structured data using Claude AI</p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Left Column: Rich Text Input -->
                <div class="bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
                    <div class="mb-4">
                        <h2 class="text-xl font-semibold text-gray-900 mb-1">Input Content</h2>
                        <p class="text-sm text-gray-500">Paste question text, images, formulas, or equations</p>
                    </div>

                    <!-- Rich Text Editor -->
                    <div class="flex-1">
                        <div data-editor class="border border-gray-300 rounded-lg overflow-hidden"></div>
                        <p class="text-xs text-gray-500 mt-2">Drag and drop images or paste content directly. Supports rich text, formulas, and diagrams.</p>

                        <!-- Extraction Mode Switch -->
                        <div class="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <label class="flex items-center space-x-3 cursor-pointer">
                                <input type="checkbox"
                                       data-claude-switch
                                       onchange="self.toggleClaudeExtraction(event)"
                                       class="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer">
                                <div class="flex-1">
                                    <span class="font-medium text-gray-900">Use Claude AI to Extract</span>
                                    <p class="text-xs text-gray-500 mt-0.5">More accurate parsing for complex formats</p>
                                </div>
                            </label>
                        </div>

                        <!-- Custom Instructions (shown when Claude extraction is enabled) -->
                        <div data-instructions-container class="hidden mt-3">
                            <label class="block text-sm font-medium text-gray-700 mb-1.5">
                                Custom Instructions for Claude
                            </label>
                            <textarea data-custom-instructions
                                      placeholder="Optional: Add specific instructions for how Claude should parse this content (e.g., 'This question has 6 answer options instead of 5', 'Pay special attention to chemical formulas', etc.)"
                                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                                      rows="3"></textarea>
                        </div>

                        <!-- Action Buttons -->
                        <div class="flex items-center space-x-3 mt-4">
                            <button type="button"
                                    data-extract-button
                                    onclick="self.extractQuestion"
                                    class="flex-1 bg-black hover:bg-gray-800 text-white font-medium px-5 py-2.5 rounded-lg transition-colors duration-150 flex items-center justify-center space-x-2">
                                <span class="material-icons" style="font-size: 18px;">auto_awesome</span>
                                <span>Extract with AI</span>
                            </button>
                            <button type="button"
                                    onclick="self.clearAll"
                                    class="bg-white hover:bg-gray-50 text-gray-700 font-medium px-5 py-2.5 rounded-lg border border-gray-300 transition-colors duration-150 flex items-center space-x-2">
                                <span class="material-icons" style="font-size: 18px;">clear</span>
                                <span>Clear</span>
                            </button>
                        </div>

                        <!-- Loading Indicator -->
                        <div data-loading class="hidden mt-3 flex items-center justify-center space-x-2 text-gray-900 bg-gray-50 rounded-lg py-3">
                            <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span class="font-medium">Extracting with Claude AI...</span>
                        </div>
                    </div>
                </div>

                <!-- Right Column: Preview & JSON Output -->
                <div class="bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
                    <!-- Preview Section -->
                    <div data-preview class="hidden mb-6 pb-6 border-b border-gray-200">
                        <div class="mb-3 flex items-center justify-between">
                            <div>
                                <h2 class="text-xl font-semibold text-gray-900 mb-1">Preview</h2>
                                <p class="text-sm text-gray-500">Mark the correct answer and save</p>
                            </div>
                            <button type="button"
                                    data-save-button
                                    onclick="self.saveQuestion()"
                                    class="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-150 flex items-center space-x-2">
                                <span class="material-icons" style="font-size: 18px;">save</span>
                                <span>Save Question</span>
                            </button>
                        </div>
                        <div class="bg-gray-50 rounded-lg p-4">
                            <div class="mb-2">
                                <span data-preview-number class="font-semibold"></span>
                                <span data-preview-title class="font-semibold"></span>
                            </div>
                            <div data-preview-content class="mb-4 text-gray-800"></div>
                            <div data-preview-answers class="space-y-1 text-gray-700"></div>
                        </div>
                    </div>

                    <div class="mb-4 flex items-center justify-between">
                        <div>
                            <h2 class="text-xl font-semibold text-gray-900 mb-1">Structured Output</h2>
                            <p class="text-sm text-gray-500">JSON format ready for database import</p>
                        </div>
                        <button type="button"
                                data-copy-button
                                onclick="self.copyJson()"
                                class="bg-black hover:bg-gray-800 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-150 flex items-center space-x-2">
                            <span class="material-icons" style="font-size: 18px;">content_copy</span>
                            <span>Copy</span>
                        </button>
                    </div>

                    <!-- JSON Output Textarea -->
                    <textarea data-json-output
                              readonly
                              placeholder='{\n  "title": "Question title",\n  "keywords": ["keyword1", "keyword2"],\n  "categories": [1, 2],\n  "content": "Question content with {{img_1}} placeholder",\n  "images": [...],\n  "answers": [...]\n}'
                              class="flex-1 w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 font-mono text-xs focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none resize-none"
                              style="font-family: 'Courier New', monospace; min-height: 350px;"></textarea>

                    <!-- Usage Info -->
                    <div data-usage class="hidden mt-4 text-sm text-gray-600 bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200">
                        Tokens used: 0 in / 0 out
                    </div>

                    <!-- Schema Info -->
                    <div class="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h3 class="text-sm font-semibold text-gray-900 mb-2">Output Schema:</h3>
                        <ul class="text-xs text-gray-600 space-y-1">
                            <li><strong>title:</strong> Brief question title</li>
                            <li><strong>keywords:</strong> Array of relevant keywords</li>
                            <li><strong>categories:</strong> Array of category IDs</li>
                            <li><strong>content:</strong> Question text with image placeholders</li>
                            <li><strong>images:</strong> SVG formulas with LaTeX source (MathJax)</li>
                            <li><strong>answers:</strong> Array of answers with correct flag</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}
