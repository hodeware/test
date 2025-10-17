const { mathjax } = require('mathjax-full/js/mathjax');
const { TeX } = require('mathjax-full/js/input/tex');
const { SVG } = require('mathjax-full/js/output/svg');
const { liteAdaptor } = require('mathjax-full/js/adaptors/liteAdaptor');
const { RegisterHTMLHandler } = require('mathjax-full/js/handlers/html');
const { AssistiveMmlHandler } = require('mathjax-full/js/a11y/assistive-mml');

// Setup MathJax
const adaptor = liteAdaptor();
const handler = RegisterHTMLHandler(adaptor);
AssistiveMmlHandler(handler);

const tex = new TeX({ packages: ['base', 'ams', 'mhchem', 'physics'] });
const svg = new SVG({ fontCache: 'local' });
const html = mathjax.document('', { InputJax: tex, OutputJax: svg });

/**
 * Convert LaTeX string to SVG
 * @param {string} latex - LaTeX string to convert
 * @param {boolean} display - Display mode (true) or inline mode (false)
 * @returns {string} SVG string
 */
function latexToSVG(latex, display = true) {
  try {
    const node = html.convert(latex, {
      display: display,
      em: 16,
      ex: 8,
      containerWidth: 80 * 16
    });

    const svgString = adaptor.innerHTML(node);
    return svgString;
  } catch (error) {
    console.error('Error converting LaTeX to SVG:', error);
    throw new Error(`Failed to convert LaTeX: ${error.message}`);
  }
}

/**
 * Convert multiple LaTeX strings to SVG
 * @param {Array<{latex: string, display?: boolean}>} items - Array of LaTeX items
 * @returns {Array<{svg: string, error?: string}>} Array of SVG strings or errors
 */
function batchLatexToSVG(items) {
  return items.map(item => {
    try {
      const svg = latexToSVG(item.latex, item.display !== false);
      return { svg };
    } catch (error) {
      return { error: error.message };
    }
  });
}

module.exports = {
  latexToSVG,
  batchLatexToSVG
};
