module.exports = `create table if not exists comments(
  id INT NOT NULL AUTO_INCREMENT,
  article_id INT NOT NULL,
  user_id INT,
  user_name VARCHAR(100),
  content LONGTEXT NOT NULL,
  parent_id INT,
  link VARCHAR(255),
  ip VARCHAR(64),
  avatar VARCHAR(255),
  complaint INT DEFAULT 0,
  isread INT DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME,
  PRIMARY KEY (id)
)`;
