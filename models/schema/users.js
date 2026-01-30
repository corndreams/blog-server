module.exports = `create table if not exists users(
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  password VARCHAR(100) NOT NULL,
  email VARCHAR(150),
  role VARCHAR(50) DEFAULT 'admin',
  status TINYINT DEFAULT 1,
  content LONGTEXT,
  imgurl VARCHAR(255),
  moment DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_users_name (name)
)`;
