# Question Extractor

An AI-powered tool to extract and normalize educational question content using Claude AI. This tool converts varied question formats into a consistent, structured JSON format suitable for database storage.

## Features

- **Rich Text Input**: Paste or type question content with formatting
- **Image Support**: Upload images containing diagrams, formulas, or equations
- **Claude AI Integration**: Automatically extracts structured data from content
- **LaTeX to SVG**: Converts mathematical formulas, equations, and chemistry formulas to SVG using MathJax
- **Consistent Output**: Normalizes different question formats into a standardized JSON schema

## Setup

### 1. Install Dependencies

Dependencies are already installed via npm workspaces. If you need to reinstall:

```bash
# Backend
cd server
npm install

# Frontend
cd client
npm install
```

### 2. Configure API Key

Update the `.env` file in the `server` directory:

```env
PORT=3000
NODE_ENV=development
ANTHROPIC_API_KEY=your_actual_anthropic_api_key_here
```

Get your API key from: https://console.anthropic.com/

### 3. Start the Application

From the root directory:

```bash
npm run dev
```

This starts both:
- Backend API server on `http://localhost:3000`
- Frontend dev server on `http://localhost:4001`

## Usage

1. Navigate to `http://localhost:4001/questions/extract`
2. Enter or paste your question content in the rich text editor
3. Optionally upload images containing diagrams or formulas
4. Click "Extract with AI"
5. View the structured JSON output on the right side
6. Copy the JSON to use in your database

## Output Schema

The extractor generates JSON with the following structure:

```json
{
  "title": "Brief question title",
  "keywords": ["keyword1", "keyword2"],
  "categories": [1, 2],
  "content": "Full question text with {{img_1}} placeholders",
  "images": [
    {
      "id": "img_1",
      "type": "formula|diagram|equation|chemistry",
      "latex": "x^2 + y^2 = z^2",
      "svg": "<svg>...</svg>",
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
```

### Field Descriptions

- **title**: A brief, descriptive title for the question
- **keywords**: Array of relevant keywords for search/indexing
- **categories**: Array of category IDs (numeric)
- **content**: Full question text with placeholders like `{{img_1}}` for image positions
- **images**: Array of image objects
  - **id**: Unique identifier (matches placeholder in content)
  - **type**: Type of image (formula, equation, chemistry, diagram)
  - **latex**: LaTeX source code (if applicable)
  - **svg**: Rendered SVG (auto-generated from LaTeX)
  - **description**: Human-readable description
  - **position**: Contextual position in the content
- **answers**: Array of answer objects
  - **text**: The answer text
  - **correct**: Boolean flag indicating if this is the correct answer
  - **explanation**: Explanation of why the answer is correct/incorrect

## API Endpoints

### POST `/api/questions/extract`

Extract structured question data from content.

**Request Body:**
```json
{
  "content": "HTML content from rich text editor",
  "images": [
    {
      "name": "image.png",
      "data": "base64_encoded_data",
      "mediaType": "image/png"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* Extracted question data */ },
  "usage": {
    "inputTokens": 150,
    "outputTokens": 200
  }
}
```

## Architecture

### Backend (Express)

- **Controller**: `server/src/controllers/questions.controller.js`
- **Routes**: `server/src/routes/questions.routes.js`
- **MathJax Utility**: `server/src/utils/mathjax.js`

### Frontend (LemonadeJS)

- **Component**: `client/src/controllers/Questions/Extract.js`
- **Route**: `/questions/extract`

## MathJax Support

The system includes full MathJax support for rendering:

- Mathematical formulas
- Equations
- Chemistry formulas (via mhchem package)
- Physics notation (via physics package)

LaTeX is automatically converted to SVG for:
- Scalable, high-quality rendering
- Browser compatibility
- Easy embedding in HTML/databases

## Future Enhancements

- Database integration for storing extracted questions
- Bulk extraction from multiple files
- Export to various formats (CSV, XML, etc.)
- Question preview with rendered formulas
- Category management interface
- Search and filter saved questions

## Troubleshooting

### API Key Error

If you see "API authentication failed":
1. Check that `.env` exists in the `server` directory
2. Verify your `ANTHROPIC_API_KEY` is correct
3. Restart the server after updating `.env`

### SVG Generation Errors

If LaTeX formulas fail to convert:
1. Check the LaTeX syntax is valid
2. Ensure mathjax-full is installed
3. Check server console for detailed error messages

### Port Already in Use

If ports 3000 or 4001 are in use:
1. Stop other services using these ports
2. Or modify the ports in `server/.env` and `client/webpack.config.js`
