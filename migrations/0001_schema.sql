CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL,
  ai_sentiment TEXT,
  ai_urgency TEXT
);

CREATE TABLE IF NOT EXISTS analysis_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  summary TEXT NOT NULL,
  sentiment TEXT NOT NULL,
  urgency TEXT NOT NULL,
  themes TEXT NOT NULL,
  issues TEXT
);

CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_urgency ON feedback(ai_urgency);
