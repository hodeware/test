/**
 * Shared question rendering utilities
 * Used by both Render.js and Extract.js components
 */

export const renderContent = function(content, images) {
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

    // Convert newlines to <br> tags (handle \r\n first, then \n)
    rendered = rendered.replace(/\r\n/g, '<br>');
    rendered = rendered.replace(/\n/g, '<br>');
    rendered = rendered.replace(/\r/g, '<br>');

    return rendered;
}

export const stripHTML = function(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

export const typesetMath = function(elements) {
    if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise(elements)
            .catch((err) => console.error('MathJax rendering error:', err));
    } else if (window.MathJax) {
        // Wait for MathJax to be ready
        window.MathJax.startup.promise.then(() => {
            window.MathJax.typesetPromise(elements)
                .catch((err) => console.error('MathJax rendering error:', err));
        });
    }
}
