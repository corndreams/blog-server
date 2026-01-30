module.exports = {
  articles: `create table if not exists articles(
    id INT NOT NULL AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    category_id INT,
    author_id INT,
    introduce LONGTEXT,
    content LONGTEXT,
    cover VARCHAR(255),
    views INT DEFAULT 0,
    state INT DEFAULT 0,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    PRIMARY KEY (id)
  )`,
  articleTags: `create table if not exists article_tags(
    id INT NOT NULL AUTO_INCREMENT,
    article_id INT NOT NULL,
    tag_id INT NOT NULL,
    created_at DATETIME NOT NULL,
    PRIMARY KEY (id)
  )`
};
