const mysql = require("mysql2");
const config = require("../config/default");
const usersTable = require("./schema/users");
const categoriesTable = require("./schema/categories");
const tagsTable = require("./schema/tags");
const {
  articles: articlesTable,
  articleTags: articleTagsTable,
} = require("./schema/articles");
const commentsTable = require("./schema/comments");
const messagesTable = require("./schema/messages");
const userInfoTable = require("./schema/user_info");
const filesTable = require("./schema/files");
const diariesTable = require("./schema/diaries");
const visitsTable = require("./schema/visits");
const linksTable = require("./schema/links");

// 创建不带数据库名的连接，用于创建数据库
const initialConnection = mysql.createConnection({
  host: config.datebase.host,
  user: config.datebase.username,
  password: config.datebase.password,
  timezone: '+08:00',
  dateStrings: true,
});

initialConnection.query(`SET time_zone = '${config.datebase.timezone || "+08:00"}'`);

// 直接链接，用于创建数据库
let query = (sql, values) => {
  return new Promise((resolve, reject) => {
    initialConnection.query(sql, values, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// 创建连接池，用于后续操作
const pool = mysql.createPool({
  host: config.datebase.host,
  user: config.datebase.username,
  password: config.datebase.password,
  database: config.datebase.database,
  timezone: '+08:00',
  dateStrings: true,
});

// 通过 pool.getConnection 获得链接
let queryPool = (sql, values) => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        reject(err);
      } else {
        connection.query(`SET time_zone = '${config.datebase.timezone || "+08:00"}'`, () => {
          connection.query(sql, values, (err, rows) => {
            if (err) {
              reject(err);
            } else {
              resolve(rows);
            }
            connection.release();
          });
        });
      }
    });
  });
};

let createDbSql = `create database if not exists ${config.datebase.database} default charset utf8mb4 collate utf8mb4_general_ci`;

let createDatebase = () => {
  return query(createDbSql, []);
};

const tableSqlList = [
  usersTable,
  categoriesTable,
  tagsTable,
  articlesTable,
  articleTagsTable,
  commentsTable,
  messagesTable,
  userInfoTable,
  filesTable,
  diariesTable,
  visitsTable,
  linksTable,
];

const createTable = async () => {
  try {
    await createDatebase();
    for (const sql of tableSqlList) {
      await queryPool(sql, []);
    }
    console.log("数据库和表创建成功");
    return "创建成功";
  } catch (error) {
    console.error("创建数据库或表时出错:", error);
    throw error;
  }
};

const ensureColumns = async () => {
  const dbName = config.datebase.database;
  const colExists = async (table, column) => {
    const rows = await queryPool(
      `select count(*) as cnt from information_schema.columns where table_schema=? and table_name=? and column_name=?`,
      [dbName, table, column]
    );
    return rows[0].cnt > 0;
  };
  if (!(await colExists('tags', 'description'))) {
    await queryPool(`alter table tags add column description text`, []);
  }
  if (!(await colExists('tags', 'updated_at'))) {
    await queryPool(`alter table tags add column updated_at datetime null`, []);
  }
  if (!(await colExists('categories', 'updated_at'))) {
    await queryPool(`alter table categories add column updated_at datetime null`, []);
  }
  if (!(await colExists('comments', 'link'))) {
    await queryPool(`alter table comments add column link varchar(255) null`, []);
  }
  if (!(await colExists('comments', 'ip'))) {
    await queryPool(`alter table comments add column ip varchar(64) null`, []);
  }
  if (!(await colExists('comments', 'avatar'))) {
    await queryPool(`alter table comments add column avatar varchar(255) null`, []);
  }
  if (!(await colExists('comments', 'updated_at'))) {
    await queryPool(`alter table comments add column updated_at datetime null`, []);
  }
  if (!(await colExists('messages', 'ip'))) {
    await queryPool(`alter table messages add column ip varchar(64) null`, []);
  }
  if (!(await colExists('diaries', 'state'))) {
    await queryPool(`alter table diaries add column state int default 0`, []);
  }
  if (!(await colExists('diaries', 'views'))) {
    await queryPool(`alter table diaries add column views int default 0`, []);
  }
  if (!(await colExists('diaries', 'diary_time'))) {
    await queryPool(`alter table diaries add column diary_time datetime null`, []);
  }
  if (!(await colExists('visits', 'user_agent'))) {
    await queryPool(`alter table visits add column user_agent varchar(255) null`, []);
  }
  if (!(await colExists('visits', 'device'))) {
    await queryPool(`alter table visits add column device varchar(64) null`, []);
  }
};

// 创建默认管理员账户
const createDefaultAdmin = async () => {
  try {
    const checkSql = `select * from users`;
    const users = await queryPool(checkSql);
    if (!users || users.length === 0) {
      const defaultAdmin = {
        name: "admin",
        password: "123456", // 建议使用更强的密码并在生产环境中加密
        moment: new Date().toISOString(),
      };
      const sql = `insert into users(name, password, moment) values(?, ?, NOW())`;
      const values = [defaultAdmin.name, defaultAdmin.password];
      await queryPool(sql, values);
      console.log("默认管理员账户创建成功");
    } else {
      console.log("管理员账户已存在，跳过创建");
    }
  } catch (error) {
    console.error("创建默认管理员账户失败:", error);
    throw error;
  }
};

const seedInitialData = async () => {
  try {
    const [{ count: catCount }] = await queryPool(
      `select count(*) as count from categories`
    );
    if (catCount === 0) {
      const cats = [
        ["随笔", "suibi"],
        ["技术", "tech"],
        ["生活", "life"],
      ];
      for (const [name, slug] of cats) {
        await queryPool(
          `insert into categories(name, slug, created_at) values(?, ?, NOW())`,
          [name, slug]
        );
      }
    }

    const [{ count: tagCount }] = await queryPool(
      `select count(*) as count from tags`
    );
    if (tagCount === 0) {
      const tags = [
        ["JavaScript", "javascript"],
        ["Node.js", "nodejs"],
        ["数据库", "database"],
      ];
      for (const [name, slug] of tags) {
        await queryPool(
          `insert into tags(name, slug, created_at) values(?, ?, NOW())`,
          [name, slug]
        );
      }
    }

    const [{ count: artCount }] = await queryPool(
      `select count(*) as count from articles`
    );
    if (artCount === 0) {
      const adminRows = await queryPool(
        `select id from users where name=? limit 1`,
        ["admin"]
      );
      const authorId = adminRows.length > 0 ? adminRows[0].id : null;
      const catRows = await queryPool(
        `select id from categories order by id asc limit 1`
      );
      const categoryId = catRows.length > 0 ? catRows[0].id : null;
      const insertArticleSql = `insert into articles(title, category_id, author_id, introduce, content, cover, views, state, created_at) values(?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
      const insertArticleValues = [
        "欢迎来到我的博客",
        categoryId,
        authorId,
        "这是博客的第一篇文章简介",
        "这是博客的第一篇文章内容",
        null,
        0,
        1,
      ];
      const res = await queryPool(insertArticleSql, insertArticleValues);
      const articleId = res.insertId;
      const tagRows = await queryPool(`select id from tags`);
      for (const tr of tagRows) {
        await queryPool(
          `insert into article_tags(article_id, tag_id, created_at) values(?, ?, NOW())`,
          [articleId, tr.id]
        );
      }
    }

    const [{ count: infoCount }] = await queryPool(
      `select count(*) as count from user_info`
    );
    if (infoCount === 0) {
      const adminRows = await queryPool(
        `select id from users where name=? limit 1`,
        ["admin"]
      );
      const authorId = adminRows.length > 0 ? adminRows[0].id : null;
      await queryPool(
        `insert into user_info(user_id, avatar, name, tagline, quote, mbti, mbti_intro, about, created_at) values(?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          authorId,
          null,
          "博主",
          "热爱分享与记录",
          "Stay hungry, stay foolish.",
          "INTJ",
          "独立思考、理性而富于战略。",
          "这里是个人介绍。",
        ]
      );
    }

    const [{ count: diaryCount }] = await queryPool(
      `select count(*) as count from diaries`
    );
    if (diaryCount === 0) {
      const samples = [
        [
          "周六不平的早上",
          "又是一个周末，其实我早就醒了，六点多，时间12点左右在睡觉。我觉得最近的睡眠都不好。不是因为入睡容易醒，而是醒后时间长。",
          1,
        ],
        [
          "平静时刻",
          "窗内的风，树叶的纹理在窗内可见，随之后外的风，因为内外温差受到了些影响。室内的书籍，黑白的封面，黑色的直线。",
          3,
        ],
        [
          "被劫的睡眠",
          "今天的时间，下午安抚，清醒在你眼前的时间，室内的小窗，树叶在外旋转合在心里飘动。晚上睡眠的时间只在昨天中午。那就是今天。",
          10,
        ],
      ];
      for (const [title, content, days] of samples) {
        await queryPool(
          `insert into diaries(title, content, state, diary_time, created_at) values(?, ?, 1, DATE_SUB(NOW(), INTERVAL ? DAY), DATE_SUB(NOW(), INTERVAL ? DAY))`,
          [title, content, days, days]
        );
      }
    }
  } catch (error) {
    console.error("初始化数据失败:", error);
    throw error;
  }
};

// 初始化函数，用于应用启动时调用
const init = async () => {
  try {
    await createTable();
    await ensureColumns();
    await createDefaultAdmin();
    await seedInitialData();
    console.log("数据库初始化完成");
    initialConnection.end();
  } catch (error) {
    console.error("数据库初始化失败:", error);
    process.exit(1); // 如果数据库初始化失败，退出应用
  }
};

// 导出函数和连接池，供其他模块使用
module.exports = {
  query: queryPool,
  createTable,
  init,
  pool,
};
