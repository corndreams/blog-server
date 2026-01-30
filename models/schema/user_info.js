module.exports = `create table if not exists user_info(
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT,
  avatar VARCHAR(255),
  name VARCHAR(100) NOT NULL,
  tagline VARCHAR(255),
  quote VARCHAR(255),
  mbti VARCHAR(16),
  mbti_intro TEXT,
  about LONGTEXT,
  created_at DATETIME NOT NULL,
  updated_at DATETIME,
  PRIMARY KEY (id)
)`;