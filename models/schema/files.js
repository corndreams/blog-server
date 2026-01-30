module.exports = `create table if not exists files(
  id INT NOT NULL AUTO_INCREMENT,
  url VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  format VARCHAR(32),
  size INT,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id)
)`;