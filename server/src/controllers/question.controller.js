// Question extraction controller
// Converts question text (with optional images) into structured JSON

const extractQuestion = async (req, res, next) => {
  try {
    console.log('Extract question endpoint called');
    console.log('Request body:', req.body);

    const content = req.body.content;

    // Parse images if sent as JSON string (form-data sends objects as strings)
    let images = [];
    if (req.body.images) {
      try {
        images = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
      } catch (e) {
        images = [];
      }
    }

    if (!content || !content.trim()) {
      console.log('Content is missing or empty');
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    console.log('Content received:', content.substring(0, 100) + '...');

    // Parse the question content
    const result = await parseQuestionContent(content, images || []);
    const parsedQuestion = result.question;
    const apiUsage = result.usage;

    console.log('Parsed question successfully');

    // Combine usage stats
    const usage = {
      inputTokens: apiUsage.input_tokens || 0,
      outputTokens: apiUsage.output_tokens || 0,
      imagesAnalyzed: apiUsage.images_analyzed || 0
    };

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

  // Remove question number from content and trim
  let processedContent = content.replace(/^\d+\.\s*/, '').trim();

  // Split content into main question and answers
  const answerPattern = /\n\s*[a-e]\)\s*/i;
  const parts = processedContent.split(answerPattern);

  let questionText = parts[0].trim();
  const answerTexts = parts.slice(1);

  // Extract answer options and trim all whitespace
  const answers = [];
  const answerLabels = ['a', 'b', 'c', 'd', 'e'];

  answerTexts.forEach((text, index) => {
    const trimmedText = text.trim();
    if (trimmedText) {
      answers.push({
        id: answerLabels[index],
        content: trimmedText,
        correct: false // Will need to be marked manually or via AI
      });
    }
  });

  // Process images - analyze each one with Claude to detect formulas
  // The placeholders {{0}}, {{1}}, {{2}} are already in the content from the editor
  const processedImages = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let imagesAnalyzed = 0;

  for (let i = 0; i < images.length; i++) {
    const img = images[i];

    console.log(`Analyzing image ${i} (${img.mediaType})`);

    // Use Claude to analyze if this image contains a mathematical formula
    const analysis = await analyzeImageWithClaude(img.data, img.mediaType);

    console.log(`Image ${i} analysis result:`, { isFormula: analysis.isFormula, hasLatex: !!analysis.latex });

    // Track usage
    if (analysis.usage) {
      totalInputTokens += analysis.usage.input_tokens || 0;
      totalOutputTokens += analysis.usage.output_tokens || 0;
      imagesAnalyzed++;
    }

    if (analysis.isFormula && analysis.latex) {
      // This image is a formula - store it as a formula with LaTeX
      console.log(`Image ${i} identified as formula with LaTeX:`, analysis.latex.substring(0, 50));
      processedImages.push({
        id: `formula_${i}`,
        latex: analysis.latex,
        type: 'formula',
        svg: null // Will be generated on frontend using MathJax
      });
    } else {
      // Regular image - store the base64 data
      console.log(`Image ${i} stored as regular image`);
      processedImages.push({
        id: `img_${i}`,
        name: img.name || `image_${i}`,
        data: img.data,
        mediaType: img.mediaType || 'image/png',
        type: 'image'
      });
    }
  }

  const allImages = processedImages;

  // Extract keywords (simple extraction based on question content - without images)
  const textWithoutImages = questionText.replace(/\{\{\d+\}\}/g, '');
  const keywords = extractKeywords(textWithoutImages);

  // Generate title
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
    console.warn('ANTHROPIC_API_KEY not configured, skipping formula detection');
    return { isFormula: false };
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  try {
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
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
    console.log('Claude response for image:', responseText);

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
    console.log('Parsed result:', result);

    // Add usage information
    result.usage = message.usage;

    return result;
  } catch (error) {
    console.error('Error analyzing image with Claude:', error.message);
    console.error('Full error:', error);
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

module.exports = {
  extractQuestion
};
