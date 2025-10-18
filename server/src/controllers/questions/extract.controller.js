// Question extraction controller
// Converts question text (with optional images) into structured JSON

const extractQuestion = async (req, res, next) => {
  try {
    const content = req.body.content;
    const images = req.body.images || [];
    const generateResolution = req.body.generateResolution || false;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    // Parse the question content
    const result = await parseQuestionContent(content, images || []);
    const parsedQuestion = result.question;
    const apiUsage = result.usage;

    // Combine usage stats
    const usage = {
      inputTokens: apiUsage.input_tokens || 0,
      outputTokens: apiUsage.output_tokens || 0,
      imagesAnalyzed: apiUsage.images_analyzed || 0
    };

    // Generate resolution if requested
    if (generateResolution && process.env.ANTHROPIC_API_KEY) {
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
      }
    } else {
      parsedQuestion.resolution = null;
    }

    res.status(200).json({
      success: true,
      data: parsedQuestion,
      usage: usage
    });
  } catch (error) {
    console.error('Error in extractQuestion:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Parse question content and extract structured data
 * Sample format:
 * "69. O polinômio é tal que para todo x real. Neste caso, tem-se que
 *  a) P(0) = 3, P(1) = 2 e P(2) = 1
 *  b) P(0) = 1, P(1) = 2 e P(2) = 3
 *  ..."
 */
async function parseQuestionContent(content, images) {
  // Extract question number and title
  const numberMatch = content.match(/^(\d+)\.\s*/);
  const questionNumber = numberMatch ? numberMatch[1] : null;

  // Advanced trim function to remove &nbsp;, whitespace, and line breaks ONLY from beginning and end
  const advancedTrim = (str) => {
    if (typeof str !== 'string') return str;

    // Remove &nbsp; (as literal string), non-breaking spaces, and whitespace from START
    // \s matches spaces, tabs, \r, \n, etc.
    // \u00A0 is the actual non-breaking space character
    let cleaned = str.replace(/^(&nbsp;|\u00A0|\s)+/g, '');

    // Remove from END
    cleaned = cleaned.replace(/(&nbsp;|\u00A0|\s)+$/g, '');

    return cleaned;
  };

  // Remove question number from content and trim
  let processedContent = content.replace(/^\d+\.\s*/, '');
  processedContent = advancedTrim(processedContent);

  // Split content into main question and answers
  // Match answer patterns that start at beginning of line or after newline
  // This prevents matching things like "(QUIMICA)" in the middle of text
  // Pattern explanation:
  // (?:^|\n) - match start of string OR newline
  // \s* - optional whitespace
  // [a-eA-E] - match letters a-e (case insensitive)
  // [\.\)] - match either . or )
  // \s+ - require at least one whitespace after the marker
  const regex = /(?:^|\n)\s*([a-eA-E])([\.\)])\s+/g;

  // Find all answer markers manually to be more precise
  const answerMarkers = [];
  let match;

  while ((match = regex.exec(processedContent)) !== null) {
    const letter = match[1].toLowerCase();
    // Only accept a-e in order to avoid false matches
    if (['a', 'b', 'c', 'd', 'e'].includes(letter)) {
      answerMarkers.push({
        index: match.index,
        fullMatch: match[0],
        label: letter
      });
    }
  }

  let questionText;
  const answers = [];

  if (answerMarkers.length > 0) {
    // Question text is everything before the first answer
    questionText = advancedTrim(processedContent.substring(0, answerMarkers[0].index));

    // Extract each answer
    answerMarkers.forEach((marker, idx) => {
      const startPos = marker.index + marker.fullMatch.length;
      const endPos = idx < answerMarkers.length - 1 ? answerMarkers[idx + 1].index : processedContent.length;
      const answerText = advancedTrim(processedContent.substring(startPos, endPos));

      if (answerText) {
        answers.push({
          id: marker.label,
          content: answerText,
          correct: false // Will need to be marked manually or via AI
        });
      }
    });
  } else {
    // No answers found, entire content is the question
    questionText = processedContent;
  }

  // Process images - analyze each one with Claude to detect formulas
  // The placeholders {{0}}, {{1}}, {{2}} are already in the content from the editor
  const processedImages = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let imagesAnalyzed = 0;

  const { imageToSvg } = require('../../utils/imageToSvg');

  for (let i = 0; i < images.length; i++) {
    const img = images[i];

    // Skip if image data is invalid
    if (!img || !img.data || !img.mediaType) {
      console.log(`Skipping image ${i}: missing data or mediaType`);
      continue;
    }

    // Use Claude to analyze if this image contains a mathematical formula
    let analysis = { isFormula: false };
    try {
      analysis = await analyzeImageWithClaude(img.data, img.mediaType);

      // Track usage
      if (analysis.usage) {
        totalInputTokens += analysis.usage.input_tokens || 0;
        totalOutputTokens += analysis.usage.output_tokens || 0;
        imagesAnalyzed++;
      }
    } catch (error) {
      console.log(`Failed to analyze image ${i} with Claude:`, error.message);
    }

    if (analysis.isFormula && analysis.latex) {
      // This image is a formula - store it as a formula with LaTeX
      processedImages.push({
        id: `formula_${i}`,
        latex: analysis.latex,
        type: 'formula',
        svg: null // Will be generated on frontend using MathJax
      });
    } else {
      // Regular image - try to convert to SVG
      let svgData = null;

      try {
        svgData = await imageToSvg(img.data, img.mediaType);
      } catch (error) {
        console.log(`Failed to convert image ${i} to SVG, storing as base64:`, error.message);
      }

      // Store image with both base64 and SVG (if conversion succeeded)
      processedImages.push({
        id: `img_${i}`,
        name: img.name || `image_${i}`,
        data: img.data,
        mediaType: img.mediaType || 'image/png',
        type: 'image',
        svg: svgData // SVG version if conversion succeeded, null otherwise
      });
    }
  }

  const allImages = processedImages;

  // Extract keywords (simple extraction based on question content - without images)
  const textWithoutImages = questionText.replace(/\{\{\d+\}\}/g, '');
  const keywords = extractKeywords(textWithoutImages);

  // Generate title (simple)
  const title = generateTitle(textWithoutImages, questionNumber);

  // Count formula images
  const formulaCount = allImages.filter(img => img.type === 'formula').length;

  return {
    question: {
      number: questionNumber,
      title: title,
      keywords: keywords,
      categories: [], // To be assigned manually or via AI
      content: questionText,
      images: allImages,
      answers: answers,
      metadata: {
        hasImages: allImages.length > 0,
        hasFormulas: formulaCount > 0,
        answerCount: answers.length,
        difficulty: null, // To be assigned
        source: null // To be assigned
      }
    },
    usage: {
      input_tokens: totalInputTokens,
      output_tokens: totalOutputTokens,
      images_analyzed: imagesAnalyzed
    }
  };
}

/**
 * Use Claude API to detect if an image contains a mathematical formula
 * and convert it to LaTeX if it does
 */
async function analyzeImageWithClaude(imageData, mediaType) {
  const Anthropic = require('@anthropic-ai/sdk');

  // Check if API key is configured
  if (!process.env.ANTHROPIC_API_KEY) {
    return { isFormula: false };
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: imageData,
              },
            },
            {
              type: "text",
              text: `Analyze this image and determine if it contains a mathematical formula, equation, or mathematical expression.

If it DOES contain a mathematical formula:
- Respond with JSON: {"isFormula": true, "latex": "the LaTeX representation"}
- Convert the entire mathematical content to LaTeX notation
- Use proper LaTeX syntax (\\frac{}{}, \\sqrt{}, ^{}, _{}, etc.)

If it does NOT contain a mathematical formula (regular image, diagram, photo, etc.):
- Respond with JSON: {"isFormula": false}

Only respond with the JSON object, nothing else.`
            }
          ],
        }
      ],
    });

    // Parse Claude's response
    const responseText = message.content[0].text.trim();

    // Try to parse JSON, handling potential markdown code blocks
    let jsonText = responseText;
    if (responseText.includes('```json')) {
      // Extract JSON from markdown code block
      const match = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (match) {
        jsonText = match[1];
      }
    } else if (responseText.includes('```')) {
      // Extract from generic code block
      const match = responseText.match(/```\s*([\s\S]*?)\s*```/);
      if (match) {
        jsonText = match[1];
      }
    }

    const result = JSON.parse(jsonText);

    // Add usage information
    result.usage = message.usage;

    return result;
  } catch (error) {
    return { isFormula: false, usage: null };
  }
}

/**
 * Extract keywords from question text
 */
function extractKeywords(text) {
  // Remove special characters and split into words
  const words = text
    .toLowerCase()
    .replace(/[^\w\sáàâãéèêíïóôõöúçñ]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 4); // Filter short words

  // Remove common words (Portuguese stop words)
  const stopWords = ['para', 'como', 'qual', 'onde', 'quando', 'porque',
                     'este', 'esta', 'esse', 'essa', 'neste', 'nesta',
                     'pelo', 'pela', 'pelos', 'pelas', 'todos', 'todas',
                     'todo', 'toda', 'caso', 'tem-se', 'sendo'];

  const filtered = words.filter(word => !stopWords.includes(word));

  // Get unique keywords (limit to 5)
  const unique = [...new Set(filtered)];
  return unique.slice(0, 5);
}

/**
 * Generate a brief title from question text
 */
function generateTitle(text, questionNumber) {
  // Take first sentence or first 60 characters
  let title = text.split(/[.!?]/)[0].trim();

  if (title.length > 60) {
    title = title.substring(0, 57) + '...';
  }

  if (questionNumber) {
    return `Questão ${questionNumber}: ${title}`;
  }

  return title;
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
  extractQuestion
};
