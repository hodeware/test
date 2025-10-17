const Anthropic = require('@anthropic-ai/sdk');
const { latexToSVG, batchLatexToSVG } = require('../utils/mathjax');

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Extract structured question data from rich content using Claude AI
 * Supports text and images, generates SVG for formulas/equations
 */
const extractQuestion = async (req, res, next) => {
  try {
    const { content, images } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    // Build content array for Claude API
    const contentArray = [
      {
        type: "text",
        text: content
      }
    ];

    // Add images if provided (base64 encoded)
    if (images && Array.isArray(images)) {
      images.forEach(img => {
        if (img.data && img.mediaType) {
          contentArray.push({
            type: "image",
            source: {
              type: "base64",
              media_type: img.mediaType,
              data: img.data
            }
          });
        }
      });
    }

    // Create the extraction prompt
    const systemPrompt = `You are an expert at extracting and normalizing educational question content.
Extract question data from the provided content and return ONLY a valid JSON object with this structure:

{
  "title": "Brief question title",
  "keywords": ["keyword1", "keyword2"],
  "categories": [1, 2],
  "content": "Full question text with placeholders for images",
  "images": [
    {
      "id": "img_1",
      "type": "formula|diagram|equation|chemistry",
      "latex": "LaTeX source if applicable",
      "description": "Description of the image",
      "position": "Where in content this should render"
    }
  ],
  "answers": [
    {
      "text": "Answer text",
      "correct": true,
      "explanation": "Why this is correct/incorrect"
    }
  ]
}

For mathematical formulas, equations, or chemistry formulas:
- Extract LaTeX source code
- Mark the type appropriately
- Use placeholders like {{img_1}} in the content field to indicate where the rendered SVG should appear
- Include position markers for image placement

Normalize different question formats into this consistent structure.`;

    // Call Claude API
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: contentArray
        }
      ]
    });

    // Extract JSON from Claude's response
    let extractedData;
    try {
      const responseText = message.content[0].text;
      // Try to parse the entire response as JSON first
      extractedData = JSON.parse(responseText);
    } catch (parseError) {
      // If that fails, try to extract JSON from markdown code blocks
      const responseText = message.content[0].text;
      const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
                       responseText.match(/```\n?([\s\S]*?)\n?```/);

      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[1]);
      } else {
        // Try parsing the text directly after removing potential markdown
        extractedData = JSON.parse(responseText.trim());
      }
    }

    // Generate SVG for any LaTeX formulas in images
    if (extractedData.images && Array.isArray(extractedData.images)) {
      extractedData.images = extractedData.images.map(img => {
        if (img.latex && (img.type === 'formula' || img.type === 'equation' || img.type === 'chemistry')) {
          try {
            img.svg = latexToSVG(img.latex, true);
          } catch (error) {
            console.error(`Failed to generate SVG for image ${img.id}:`, error);
            img.svgError = error.message;
          }
        }
        return img;
      });
    }

    res.status(200).json({
      success: true,
      data: extractedData,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens
      }
    });
  } catch (error) {
    console.error('Extract question error:', error);

    // Provide more specific error messages
    if (error.status === 401) {
      return res.status(500).json({
        success: false,
        message: 'API authentication failed. Check your ANTHROPIC_API_KEY.'
      });
    }

    if (error.name === 'SyntaxError') {
      return res.status(500).json({
        success: false,
        message: 'Failed to parse Claude response as JSON',
        error: error.message
      });
    }

    next(error);
  }
};

/**
 * Get all questions (placeholder for future database integration)
 */
const getQuestions = async (req, res, next) => {
  try {
    // Placeholder - integrate with your database
    const questions = [];

    res.status(200).json({
      success: true,
      data: questions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get question by ID (placeholder for future database integration)
 */
const getQuestionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Placeholder - integrate with your database
    const question = null;

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.status(200).json({
      success: true,
      data: question
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new question (placeholder for future database integration)
 */
const createQuestion = async (req, res, next) => {
  try {
    const questionData = req.body;

    // Placeholder - integrate with your database
    const newQuestion = { id: Date.now(), ...questionData };

    res.status(201).json({
      success: true,
      data: newQuestion
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  extractQuestion,
  getQuestions,
  getQuestionById,
  createQuestion
};
