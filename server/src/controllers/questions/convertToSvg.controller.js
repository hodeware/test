// Image to SVG conversion controller
// Converts raster images (PNG, JPG, GIF, etc.) to vector SVG format

const { imageToSvg, imageToColorSvg } = require('../../utils/imageToSvg');

/**
 * Convert a base64 image to SVG
 * Accepts: { image: "base64Data", mediaType: "image/png", color: false }
 */
const convertImageToSvg = async (req, res, next) => {
  try {
    const { image, mediaType, color } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Image data is required (base64 encoded)'
      });
    }

    if (!mediaType) {
      return res.status(400).json({
        success: false,
        message: 'mediaType is required (e.g., "image/png", "image/gif", "image/jpeg")'
      });
    }

    // Convert to SVG
    let svg;
    if (color === true || color === 'true') {
      // Multi-color posterized SVG
      svg = await imageToColorSvg(image, mediaType);
    } else {
      // Simple black and white SVG
      svg = await imageToSvg(image, mediaType);
    }

    res.status(200).json({
      success: true,
      data: {
        svg: svg,
        originalType: mediaType,
        conversionMode: color ? 'color' : 'monochrome'
      }
    });
  } catch (error) {
    console.error('Error in convertImageToSvg:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to convert image to SVG'
    });
  }
};

module.exports = {
  convertImageToSvg
};
