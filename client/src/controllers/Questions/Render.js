import jSuites from "jsuites";
import { renderContent, stripHTML, typesetMath } from '../../utils/questionRenderer.js';

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
        typesetMath([this.content, answersContainer]);
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
