module.exports = `create table if not exists diaries(
  id INT NOT NULL AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  content LONGTEXT NOT NULL,
  views INT DEFAULT 0,
  state INT DEFAULT 0,
  diary_time DATETIME,
  created_at DATETIME NOT NULL,
  updated_at DATETIME,
  PRIMARY KEY (id)
)`;