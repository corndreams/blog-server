module.exports = `create table if not exists messages(
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT,
  user_name VARCHAR(100),
  content LONGTEXT NOT NULL,
  ip VARCHAR(64),
  isread INT DEFAULT 0,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id)
)`;
