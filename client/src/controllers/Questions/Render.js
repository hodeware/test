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
        this.number = questionData.number;
        this.title = stripHTML(questionData.title);

        // Render content with formulas
        this.content.innerHTML = renderContent(questionData.content, questionData.images);

        // Create answers array for LemonadeJS loop
        this.answers = questionData.answers.map((answer) => {
            return {
                id: answer.id.toUpperCase(),
                content: renderContent(answer.content, questionData.images),
                correct: answer.correct
            };
        });

        // Render LaTeX formulas with MathJax
        if (window.MathJax) {
            window.MathJax.typesetPromise([self.el])
                .catch((err) => console.error('MathJax rendering error:', err));
        }
    }

    const renderContent = function(content, images) {
        let rendered = content;

        // Create a map of image IDs to image data
        const imageMap = {};
        images.forEach(img => {
            imageMap[img.id] = img;
        });

        // Replace placeholders with actual content
        rendered = rendered.replace(/\{\{(\d+)\}\}/g, (match, index) => {
            const imgId = `formula_${index}`;
            const img = imageMap[imgId] || imageMap[`img_${index}`];

            if (!img) return match;

            if (img.type === 'formula') {
                // Render as LaTeX using MathJax delimiters
                return `\\(${img.latex}\\)`;
            } else if (img.type === 'image') {
                // Render as image
                return `<img src="data:${img.mediaType};base64,${img.data}" alt="${img.name}" class="inline-block max-w-full h-auto" />`;
            }

            return match;
        });

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
            <ul :loop="this.answers">
                <li><span>{{self.id}})</span> <span>{{self.content}}</span></li>
            </ul>
        </div>
    </div>`;
}
