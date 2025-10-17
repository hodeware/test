const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db = null;

const connectDB = () => {
  try {
    // Get database path from environment or use default
    const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database/questions.db');

    // Ensure database directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Connect to SQLite database
    db = new Database(dbPath, { verbose: console.log });

    console.log('SQLite database connected successfully');
    console.log(`Database file: ${dbPath}`);

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Initialize tables
    initializeTables();

    return db;
  } catch (error) {
    console.error('SQLite connection error:', error.message);
    process.exit(1);
  }
};

const initializeTables = () => {
  // Questions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number INTEGER,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      keywords TEXT, -- JSON array
      categories TEXT, -- JSON array
      difficulty TEXT,
      source TEXT,
      has_images INTEGER DEFAULT 0,
      has_formulas INTEGER DEFAULT 0,
      answer_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Images table
  db.exec(`
    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      image_id TEXT NOT NULL, -- img_0, formula_1, etc.
      type TEXT NOT NULL, -- 'image' or 'formula'
      data TEXT, -- base64 data for images
      latex TEXT, -- LaTeX for formulas
      media_type TEXT, -- image/png, image/gif, etc.
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    )
  `);

  // Answers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      answer_id TEXT NOT NULL, -- 'a', 'b', 'c', 'd', 'e'
      content TEXT NOT NULL,
      is_correct INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_questions_number ON questions(number);
    CREATE INDEX IF NOT EXISTS idx_images_question_id ON images(question_id);
    CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
  `);

  console.log('Database tables initialized successfully');
};

const getDB = () => {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
};

// Graceful shutdown
process.on('SIGINT', () => {
  if (db) {
    db.close();
    console.log('SQLite database connection closed through app termination');
  }
  process.exit(0);
});

module.exports = { connectDB, getDB };
