-- Adaptive Spanish: Initial Schema
-- This file is auto-run by MySQL Docker on first container start

CREATE DATABASE IF NOT EXISTS adaptive_spanish;
USE adaptive_spanish;

-- -------------------------------------------------------
-- Users
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  user_id       INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  drill_settings JSON NOT NULL DEFAULT ('{"vocabulary":true,"phrases":false,"verbs":false}'),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- -------------------------------------------------------
-- Dictionary  (words ordered by commonality, word_id = rank)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS dictionary (
  word_id              INT PRIMARY KEY,          -- 1 = most common
  spanish_word         VARCHAR(100) NOT NULL,
  english_translations JSON NOT NULL,            -- array of strings
  image_url            VARCHAR(500),
  word_type            ENUM('noun','verb','adjective','adverb','conjunction',
                            'preposition','pronoun','interjection','other') NOT NULL DEFAULT 'other',
  gender               ENUM('masculine','feminine','neutral') NULL
);

-- -------------------------------------------------------
-- User Words  (bucket state per user per word)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_words (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  word_id          INT NOT NULL,
  bucket           ENUM('learning','learned','mastered') NOT NULL DEFAULT 'learning',
  word_score       INT NOT NULL DEFAULT 0,   -- current correct streak
  mastery_score    INT NOT NULL DEFAULT 0,   -- peak streak, drives heat map (0-10+)
  lifetime_correct INT NOT NULL DEFAULT 0,
  lifetime_attempts INT NOT NULL DEFAULT 0,
  last_drilled_at  TIMESTAMP NULL,
  added_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_word (user_id, word_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES dictionary(word_id)
);

-- -------------------------------------------------------
-- Phrases
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS phrases (
  phrase_id            INT AUTO_INCREMENT PRIMARY KEY,
  spanish_phrase       VARCHAR(500) NOT NULL,
  english_translations JSON NOT NULL,
  image_url            VARCHAR(500),
  difficulty           TINYINT NOT NULL DEFAULT 1  -- 1=easy, 2=medium, 3=hard
);

-- -------------------------------------------------------
-- User Phrases  (identical structure to user_words)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_phrases (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  phrase_id        INT NOT NULL,
  bucket           ENUM('learning','learned','mastered') NOT NULL DEFAULT 'learning',
  word_score       INT NOT NULL DEFAULT 0,
  mastery_score    INT NOT NULL DEFAULT 0,
  lifetime_correct INT NOT NULL DEFAULT 0,
  lifetime_attempts INT NOT NULL DEFAULT 0,
  last_drilled_at  TIMESTAMP NULL,
  added_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_phrase (user_id, phrase_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (phrase_id) REFERENCES phrases(phrase_id)
);

-- -------------------------------------------------------
-- Verbs  (one row per tense/subject combination)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS verb_conjugations (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  word_id         INT NOT NULL,              -- FK to dictionary (infinitive lives there)
  tense           ENUM(
                    'present','preterite','imperfect','future','conditional',
                    'present_subjunctive','imperfect_subjunctive',
                    'present_perfect','past_perfect','future_perfect',
                    'imperative_affirmative','imperative_negative'
                  ) NOT NULL,
  subject         ENUM('yo','tú','él_ella','nosotros','vosotros','ellos_ellas') NOT NULL,
  conjugated_form VARCHAR(100) NOT NULL,
  UNIQUE KEY uq_verb_conj (word_id, tense, subject),
  FOREIGN KEY (word_id) REFERENCES dictionary(word_id)
);

-- -------------------------------------------------------
-- User Verb Scores  (rolling last-10 per conjugation cell)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_verb_scores (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  word_id          INT NOT NULL,
  tense            ENUM(
                    'present','preterite','imperfect','future','conditional',
                    'present_subjunctive','imperfect_subjunctive',
                    'present_perfect','past_perfect','future_perfect',
                    'imperative_affirmative','imperative_negative'
                  ) NOT NULL,
  subject          ENUM('yo','tú','él_ella','nosotros','vosotros','ellos_ellas') NOT NULL,
  recent_attempts  JSON NOT NULL DEFAULT ('[]'),   -- array of 1/-1, max 10 entries
  score            INT NOT NULL DEFAULT 0,          -- sum of recent_attempts
  last_drilled_at  TIMESTAMP NULL,
  UNIQUE KEY uq_user_verb (user_id, word_id, tense, subject),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES dictionary(word_id)
);

-- -------------------------------------------------------
-- Indexes for common query patterns
-- -------------------------------------------------------
CREATE INDEX idx_user_words_bucket    ON user_words (user_id, bucket);
CREATE INDEX idx_user_words_score     ON user_words (user_id, mastery_score);
CREATE INDEX idx_user_phrases_bucket  ON user_phrases (user_id, bucket);
CREATE INDEX idx_user_verb_score      ON user_verb_scores (user_id, score);
