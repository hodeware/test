import jSuites from "jsuites";
import jEditor from '../../utils/editor/editor.js';

export default function Extract() {
    let self = this;
    let editor = null;

    self.onload = function() {
        // Initialize jEditor
        const editorElement = self.el.querySelector('[data-editor]');
        if (editorElement) {
            editor = jEditor(editorElement, {
                placeholder: "Paste your question content here...",
                toolbar: true,
                toolbarOnTop: false,
                maxHeight: '500px',
                maxFileSize: 5000000,
                allowImageResize: true,
                dropZone: true,
                acceptFiles: false,
                acceptImages: true,
                dropAsSnippet: false,
                parseHTML: true,
            });
        }
    }

    self.extractQuestion = function() {
        if (!editor) {
            alert('Editor not initialized');
            return;
        }

        const data = editor.getData(true); // Get JSON format with files
        const files = editor.getFiles(true);
        const outputElement = self.el.querySelector('[data-json-output]');
        const loadingElement = self.el.querySelector('[data-loading]');
        const extractButton = self.el.querySelector('[data-extract-button]');

        if (!data.content || !data.content.trim()) {
            alert('Please enter some content to extract');
            return;
        }

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

        const payload = {
            content: data.content,
            images: images.length > 0 ? JSON.stringify(images) : undefined
        };

        console.log('Editor data:', data);
        console.log('Payload to send:', payload);
        console.log('Content length:', data.content ? data.content.length : 0);

        jSuites.ajax({
            url: '/api/questions/extract',
            method: 'POST',
            dataType: 'json',
            data: payload,
            success: function(result) {
                loadingElement.classList.add('hidden');
                extractButton.disabled = false;

                if (result.success) {
                    // Pretty print the JSON
                    outputElement.value = JSON.stringify(result.data, null, 2);

                    // Show token usage
                    const usageElement = self.el.querySelector('[data-usage]');
                    if (result.usage && usageElement) {
                        usageElement.textContent = `Tokens used: ${result.usage.inputTokens} in / ${result.usage.outputTokens} out`;
                        usageElement.classList.remove('hidden');
                    }
                } else {
                    alert('Error: ' + result.message);
                    outputElement.value = JSON.stringify({ error: result.message }, null, 2);
                }
            },
            error: function(error) {
                loadingElement.classList.add('hidden');
                extractButton.disabled = false;
                alert('Failed to extract question');
                console.error(error);

                try {
                    const errorData = JSON.parse(error.responseText);
                    outputElement.value = JSON.stringify({ error: errorData.message || 'Unknown error' }, null, 2);
                } catch (e) {
                    outputElement.value = JSON.stringify({ error: 'Failed to extract question' }, null, 2);
                }
            }
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
        }
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
                    <div class="mb-4 flex-1">
                        <div data-editor class="border border-gray-300 rounded-lg overflow-hidden"></div>
                        <p class="text-xs text-gray-500 mt-2">Drag and drop images or paste content directly. Supports rich text, formulas, and diagrams.</p>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex items-center space-x-3 pt-4 border-t border-gray-200">
                        <button type="button"
                                onclick="self.clearAll()"
                                class="bg-white hover:bg-gray-50 text-gray-700 font-medium px-5 py-2.5 rounded-lg border border-gray-300 transition-colors duration-150 flex items-center space-x-2">
                            <span class="material-icons" style="font-size: 18px;">clear</span>
                            <span>Clear</span>
                        </button>
                        <button type="button"
                                data-extract-button
                                onclick="self.extractQuestion()"
                                class="flex-1 bg-black hover:bg-gray-800 text-white font-medium px-5 py-2.5 rounded-lg transition-colors duration-150 flex items-center justify-center space-x-2">
                            <span class="material-icons" style="font-size: 18px;">auto_awesome</span>
                            <span>Extract with AI</span>
                        </button>
                    </div>

                    <!-- Loading Indicator -->
                    <div data-loading class="hidden mt-4 flex items-center justify-center space-x-2 text-gray-900 bg-gray-50 rounded-lg py-3">
                        <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span class="font-medium">Extracting with Claude AI...</span>
                    </div>
                </div>

                <!-- Right Column: JSON Output -->
                <div class="bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
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
                              style="font-family: 'Courier New', monospace; min-height: 500px;"></textarea>

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
