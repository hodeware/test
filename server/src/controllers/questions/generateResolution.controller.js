// Question resolution generator controller
// Uses Claude AI to generate detailed solutions and explanations for questions

const generateResolution = async (req, res, next) => {
  try {
    const { question, images, customInstructions } = req.body;

    if (!question || !question.content) {
      return res.status(400).json({
        success: false,
        message: 'Question content is required'
      });
    }

    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Anthropic API key not configured'
      });
    }

    // Generate resolution using Claude AI
    const result = await generateResolutionWithClaude(question, images || [], customInstructions);

    res.status(200).json({
      success: true,
      data: {
        resolution: result.resolution,
        correctAnswer: result.correctAnswer
      },
      usage: {
        inputTokens: result.usage.input_tokens || 0,
        outputTokens: result.usage.output_tokens || 0
      }
    });
  } catch (error) {
    console.error('Error in generateResolution:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Generate a detailed resolution for a question using Claude AI
 */
async function generateResolutionWithClaude(question, images, customInstructions) {
  const Anthropic = require('@anthropic-ai/sdk');

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Build the content array for Claude
  const messageContent = [];

  // Add images first if present
  if (images && images.length > 0) {
    images.forEach(img => {
      // Only send actual image data (not formulas which are already converted to LaTeX)
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

**Question Number**: ${question.number || 'N/A'}
**Question Title**: ${question.title || 'N/A'}
**Question Content**:
${question.content}

**Answer Options**:
${question.answers ? question.answers.map(a => `${a.id}) ${a.content}`).join('\n') : 'No answers provided'}

${customInstructions ? `\n**Additional Instructions**:\n${customInstructions}\n` : ''}

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
If there are mathematical formulas in the question, reference them naturally in your explanation.

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

    let result;
    try {
      result = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse JSON from Claude response:', jsonText);
      throw new Error('Claude returned invalid JSON. Response: ' + jsonText.substring(0, 200));
    }

    return {
      resolution: result.resolution || '',
      correctAnswer: result.correctAnswer || null,
      usage: message.usage
    };

  } catch (error) {
    console.error('Error generating resolution with Claude:', error);
    throw new Error('Failed to generate resolution: ' + error.message);
  }
}

module.exports = {
  generateResolution
};
