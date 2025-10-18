// Question extraction controller using Claude AI for intelligent parsing
// This provides more accurate extraction compared to regex-based parsing

const extractQuestionWithModel = async (req, res, next) => {
  try {
    const content = req.body.content;
    const images = req.body.images || [];
    const customInstructions = req.body.customInstructions || '';
    const generateResolution = req.body.generateResolution || false;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Anthropic API key not configured'
      });
    }

    // Parse the question content using Claude AI
    const result = await parseQuestionWithClaude(content, images, customInstructions);
    const parsedQuestion = result.question;
    const apiUsage = result.usage;

    // Combine usage stats
    const usage = {
      inputTokens: apiUsage.input_tokens || 0,
      outputTokens: apiUsage.output_tokens || 0,
      imagesAnalyzed: images.length
    };

    // Always generate resolution automatically
    try {
      const resolutionResult = await generateQuestionResolution(parsedQuestion, images);
      parsedQuestion.resolution = resolutionResult.resolution;
      parsedQuestion.correctAnswer = resolutionResult.correctAnswer;

      // Update usage stats
      usage.inputTokens += resolutionResult.usage.input_tokens || 0;
      usage.outputTokens += resolutionResult.usage.output_tokens || 0;
    } catch (error) {
      console.error('Failed to generate resolution:', error.message);
      parsedQuestion.resolution = null;
      parsedQuestion.correctAnswer = null;
    }

    res.status(200).json({
      success: true,
      data: parsedQuestion,
      usage: usage
    });
  } catch (error) {
    console.error('Error in extractQuestionWithModel:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Parse question content using Claude AI for intelligent extraction
 */
async function parseQuestionWithClaude(content, images, customInstructions) {
  const Anthropic = require('@anthropic-ai/sdk');

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Build the content array for Claude
  const messageContent = [];

  // Add images first if present
  if (images && images.length > 0) {
    images.forEach(img => {
      messageContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: img.mediaType,
          data: img.data,
        },
      });
    });
  }

  // Build the prompt
  let prompt = `You are an expert at parsing educational content, specifically exam questions.
Extract the following information from the provided question content:

1. **Question Number**: If present (e.g., "69.")
2. **Question Text**: The main question content (may contain image placeholders like {{0}}, {{1}})
3. **Answer Options**: All answer choices (typically labeled a, b, c, d, e - can be formatted as "a)", "a.", "A)", "A.", etc.)
4. **Keywords**: 3-5 relevant keywords from the question
5. **Title**: A brief title (first sentence or 60 characters max)
6. **Images**: Analyze each image and determine if it's a formula or regular image

**IMPORTANT**:
- For each image, detect if it contains a mathematical formula
- If an image is a formula, convert it to LaTeX notation and mark type as "formula"
- If an image is NOT a formula, mark type as "image"
- Preserve image placeholders in the format {{0}}, {{1}}, {{2}}, etc.
- Extract all answer options regardless of formatting (a), a., A), A., etc.)
- Each answer should have an id (a, b, c, d, e) and content

${customInstructions ? `\n**Additional Instructions from User**:\n${customInstructions}\n` : ''}

**Question Content:**
${content}

Respond with a JSON object in this exact format:
{
  "number": "question number or null",
  "title": "brief title",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "content": "question text with image placeholders",
  "answers": [
    {"id": "a", "content": "answer A text", "correct": false},
    {"id": "b", "content": "answer B text", "correct": false}
  ],
  "images": [
    {"imageIndex": 0, "type": "formula", "latex": "LaTeX notation"},
    {"imageIndex": 1, "type": "image"}
  ]
}

Only respond with the JSON object, nothing else.`;

  messageContent.push({
    type: "text",
    text: prompt
  });

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: messageContent,
        }
      ],
    });

    // Parse Claude's response
    const responseText = message.content[0].text.trim();

    // Try to parse JSON, handling potential markdown code blocks
    let jsonText = responseText;
    if (responseText.includes('```json')) {
      const match = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (match) {
        jsonText = match[1];
      }
    } else if (responseText.includes('```')) {
      const match = responseText.match(/```\s*([\s\S]*?)\s*```/);
      if (match) {
        jsonText = match[1];
      }
    }

    let extractedData;
    try {
      extractedData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse JSON from Claude response:', jsonText);
      throw new Error('Claude returned invalid JSON. Response: ' + jsonText.substring(0, 200));
    }

    // Process images based on Claude's analysis
    const { imageToSvg } = require('../../utils/imageToSvg');
    const processedImages = [];

    // Process each image based on Claude's classification
    if (extractedData.images && extractedData.images.length > 0) {
      for (const imgAnalysis of extractedData.images) {
        const imageIndex = imgAnalysis.imageIndex;
        const originalImage = images[imageIndex];

        if (!originalImage) continue;

        if (imgAnalysis.type === 'formula' && imgAnalysis.latex) {
          // This is a formula - store with LaTeX
          processedImages.push({
            id: `formula_${imageIndex}`,
            latex: imgAnalysis.latex,
            type: 'formula',
            svg: null // Will be generated on frontend using MathJax
          });
        } else {
          // Regular image - try to convert to SVG
          let svgData = null;
          if (originalImage.data && originalImage.mediaType) {
            try {
              svgData = await imageToSvg(originalImage.data, originalImage.mediaType);
            } catch (error) {
              console.log(`Failed to convert image ${imageIndex} to SVG:`, error.message);
            }
          }

          processedImages.push({
            id: `img_${imageIndex}`,
            name: originalImage.name || `image_${imageIndex}`,
            data: originalImage.data,
            mediaType: originalImage.mediaType || 'image/png',
            type: 'image',
            svg: svgData // SVG version if conversion succeeded, null otherwise
          });
        }
      }
    } else {
      // Fallback: if Claude didn't classify images, treat all as regular images
      if (images && images.length > 0) {
        for (let idx = 0; idx < images.length; idx++) {
          const img = images[idx];
          let svgData = null;

          if (img.data && img.mediaType) {
            try {
              svgData = await imageToSvg(img.data, img.mediaType);
            } catch (error) {
              console.log(`Failed to convert image ${idx} to SVG:`, error.message);
            }
          }

          processedImages.push({
            id: `img_${idx}`,
            name: img.name || `image_${idx}`,
            data: img.data,
            mediaType: img.mediaType || 'image/png',
            type: 'image',
            svg: svgData
          });
        }
      }
    }

    // Build the final question object
    const question = {
      number: extractedData.number,
      title: extractedData.title,
      keywords: extractedData.keywords || [],
      categories: [],
      content: extractedData.content,
      images: processedImages,
      answers: extractedData.answers || [],
      metadata: {
        hasImages: processedImages.length > 0,
        hasFormulas: processedImages.some(img => img.type === 'formula'),
        answerCount: (extractedData.answers || []).length,
        difficulty: null,
        source: null,
        extractionMethod: 'claude-ai'
      }
    };

    return {
      question: question,
      usage: message.usage
    };

  } catch (error) {
    console.error('Error parsing with Claude:', error);
    throw new Error('Failed to parse question with AI: ' + error.message);
  }
}

/**
 * Generate a detailed resolution for a question using Claude AI
 */
async function generateQuestionResolution(question, images) {
  const Anthropic = require('@anthropic-ai/sdk');

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Build the content array for Claude
  const messageContent = [];

  // Add images if present (only actual images, not formulas)
  if (images && images.length > 0) {
    images.forEach(img => {
      if (img.type === 'image' && img.data && img.mediaType) {
        messageContent.push({
          type: "image",
          source: {
            type: "base64",
            media_type: img.mediaType,
            data: img.data,
          },
        });
      }
    });
  }

  // Build the prompt
  let prompt = `You are an expert educator and problem solver.
Your task is to provide a detailed, step-by-step resolution for this educational question.

**Question Content**:
${question.content}

**Answer Options**:
${question.answers ? question.answers.map(a => `${a.id}) ${a.content}`).join('\n') : 'No answers provided'}

**Your Task**:
1. Analyze the question carefully
2. Identify the correct answer (a, b, c, d, or e)
3. Provide a detailed, educational explanation with:
   - Step-by-step reasoning
   - Key concepts involved
   - Why the correct answer is right
   - Why other answers are wrong (if relevant)
   - Tips or insights that would help a student understand

Write your explanation in a clear, educational manner. Use markdown formatting for better readability.

Respond with a JSON object in this exact format:
{
  "correctAnswer": "a",
  "resolution": "Detailed step-by-step explanation here. Use markdown formatting.\\n\\n## Step 1\\nExplanation...\\n\\n## Step 2\\nMore explanation..."
}

Only respond with the JSON object, nothing else.`;

  messageContent.push({
    type: "text",
    text: prompt
  });

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: messageContent,
        }
      ],
    });

    // Parse Claude's response
    const responseText = message.content[0].text.trim();

    // Try to parse JSON, handling potential markdown code blocks
    let jsonText = responseText;
    if (responseText.includes('```json')) {
      const match = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (match) {
        jsonText = match[1];
      }
    } else if (responseText.includes('```')) {
      const match = responseText.match(/```\s*([\s\S]*?)\s*```/);
      if (match) {
        jsonText = match[1];
      }
    }

    const result = JSON.parse(jsonText);

    return {
      resolution: result.resolution || '',
      correctAnswer: result.correctAnswer || null,
      usage: message.usage
    };
  } catch (error) {
    throw new Error('Failed to generate resolution: ' + error.message);
  }
}

module.exports = {
  extractQuestionWithModel
};
