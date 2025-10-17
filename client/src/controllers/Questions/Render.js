import jSuites from "jsuites";

export default function Render() {
    let self = this;
    let questionData = null;

    self.onload = function() {
        // Get question ID from URL
        const pathParts = window.location.pathname.split('/');
        const questionId = pathParts[pathParts.length - 1];

        if (questionId) {
            loadQuestion(questionId);
        } else {
            showError('No question ID provided');
        }
    }

    const loadQuestion = function(id) {
        const loadingElement = self.el.querySelector('[data-loading]');
        const contentElement = self.el.querySelector('[data-content]');

        loadingElement.classList.remove('hidden');
        contentElement.classList.add('hidden');

        jSuites.ajax({
            url: `/api/questions/render/${id}`,
            method: 'GET',
            dataType: 'json',
            success: function(result) {
                loadingElement.classList.add('hidden');

                if (result.success) {
                    questionData = result.data;
                    renderQuestion();
                    contentElement.classList.remove('hidden');
                } else {
                    showError(result.message || 'Failed to load question');
                }
            },
            error: function(error) {
                loadingElement.classList.add('hidden');
                console.error(error);
                showError('Failed to load question');
            }
        });
    }

    const showError = function(message) {
        const errorElement = self.el.querySelector('[data-error]');
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }

    const renderQuestion = () => {
        const answersContainer = self.el.querySelector('[data-answers]');

        this.number = questionData.number;
        this.title = stripHTML(questionData.title);

        // Render content with formulas
        this.content.innerHTML = renderContent(questionData.content, questionData.images);

        // Render answers
        answersContainer.innerHTML = '';
        questionData.answers.forEach((answer) => {
            const answerDiv = document.createElement('div');
            // Check if answer content has placeholders {{n}}
            const hasPlaceholders = /\{\{\d+\}\}/.test(answer.content);
            let answerContent = hasPlaceholders
                ? renderContent(answer.content, questionData.images)
                : answer.content;

            // Replace &nbsp; with regular spaces
            answerContent = answerContent.replace(/&nbsp;/g, ' ');

            answerDiv.innerHTML = `
                <div>
                    <div>
                        ${answer.id.toUpperCase()}) ${answerContent}
                    </div>
                </div>
            `;
            answersContainer.appendChild(answerDiv);
        });

        // Render LaTeX formulas with MathJax
        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([this.content, answersContainer])
                .catch((err) => console.error('MathJax rendering error:', err));
        } else if (window.MathJax) {
            // Wait for MathJax to be ready
            window.MathJax.startup.promise.then(() => {
                window.MathJax.typesetPromise([this.content, answersContainer])
                    .catch((err) => console.error('MathJax rendering error:', err));
            });
        }
    }

    const renderContent = function(content, images) {
        let rendered = content;

        // Create a map of image IDs to image data
        const imageMap = {};
        if (images && images.length > 0) {
            images.forEach(img => {
                imageMap[img.id] = img;
            });
        }

        // Replace placeholders with actual content
        rendered = rendered.replace(/\{\{(\d+)\}\}/g, (match, index) => {
            const imgId = `formula_${index}`;
            const img = imageMap[imgId] || imageMap[`img_${index}`];

            if (!img) {
                console.warn('No image found for placeholder:', match, 'looking for:', imgId);
                return match;
            }

            if (img.type === 'formula') {
                // Render as LaTeX using MathJax delimiters
                const latex = `\\(${img.latex}\\)`;
                return latex;
            } else if (img.type === 'image') {
                // Render as image
                return `<img src="data:${img.mediaType};base64,${img.data}" alt="${img.name}" class="max-w-full h-auto" />`;
            }

            return match;
        });

        // Convert newlines to <br> tags
        rendered = rendered.replace(/\n/g, '<br>');
        // Convert \r\n to <br> tags
        rendered = rendered.replace(/\r\n/g, '<br>');
        // Clean up multiple <br> tags
        rendered = rendered.replace(/(<br>){2,}/g, '<br><br>');

        return rendered;
    }

    const stripHTML = function(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    return render => render`<div class="lm-questions">
        <div data-loading></div>
        <div data-error class="hidden"></div>
        <div data-content class="hidden">
            <div><span>${this.number}.</span> <span :ref="this.content"></span></div>
        </div>
        <div data-answers></div>
    </div>`;
}
