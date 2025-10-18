const potrace = require('potrace');

/**
 * Convert a base64 image to SVG using potrace
 * @param {string} base64Data - Base64 encoded image data (without data:image/... prefix)
 * @param {string} mediaType - Image media type (e.g., 'image/png')
 * @returns {Promise<string>} - SVG string
 */
async function imageToSvg(base64Data, mediaType) {
  return new Promise((resolve, reject) => {
    try {
      // Convert base64 to buffer
      const imageBuffer = Buffer.from(base64Data, 'base64');

      // Potrace options for better quality
      const options = {
        threshold: 128,        // Threshold for black/white (0-255)
        turdSize: 2,          // Suppress speckles of up to this size
        optTolerance: 0.2,    // Optimize paths (0-1, higher = more optimization)
        color: 'black',       // Color of the traced image
        background: 'transparent' // Background color
      };

      // Trace the image
      potrace.trace(imageBuffer, options, (err, svg) => {
        if (err) {
          reject(err);
        } else {
          resolve(svg);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Convert a base64 image to SVG with posterization (multiple colors)
 * @param {string} base64Data - Base64 encoded image data
 * @param {string} mediaType - Image media type
 * @returns {Promise<string>} - SVG string with multiple layers
 */
async function imageToColorSvg(base64Data, mediaType) {
  return new Promise((resolve, reject) => {
    try {
      const imageBuffer = Buffer.from(base64Data, 'base64');

      const options = {
        steps: 4,              // Number of color layers (2-255)
        threshold: 128,
        turdSize: 2,
        optTolerance: 0.2,
        background: 'transparent'
      };

      // Posterize for multi-color output
      potrace.posterize(imageBuffer, options, (err, svg) => {
        if (err) {
          reject(err);
        } else {
          resolve(svg);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  imageToSvg,
  imageToColorSvg
};
