module.exports = `create table if not exists visits(
  id INT NOT NULL AUTO_INCREMENT,
  path VARCHAR(255) NOT NULL,
  article_id INT,
  diary_id INT,
  ip VARCHAR(64),
  user_agent VARCHAR(255),
  device VARCHAR(64),
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id)
)`;