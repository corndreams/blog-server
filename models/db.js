const mysql = require("mysql2");
const config = require("../config/default");

// 创建不带数据库名的连接，用于创建数据库
const initialConnection = mysql.createConnection({
  host: config.datebase.host,
  user: config.datebase.username,
  password: config.datebase.password,
});

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
});

// 通过 pool.getConnection 获得链接
let queryPool = (sql, values) => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        reject(err);
      } else {
        connection.query(sql, values, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
          connection.release(); // 释放该链接，把该链接放回池里供其他人使用
          // connection.destroy(); // 如果要关闭连接并将其从池中删除，请改用connection.destroy
        });
      }
    });
  });
};

let blog =
  "create database if not exists blog default charset utf8 collate utf8_general_ci";

let createDatebase = () => {
  return query(blog, []);
};

//用户
let users = `create table if not exists users(
     id INT NOT NULL AUTO_INCREMENT,
     name VARCHAR(100) NOT NULL COMMENT '用户名',
     web VARCHAR(100) COMMENT '网站',
     mail VARCHAR(100) COMMENT '邮箱',
     password VARCHAR(100) NOT NULL COMMENT '密码',
     moment VARCHAR(100) NOT NULL COMMENT '时间',
     imgurl VARCHAR(100) COMMENT '头像地址',
     PRIMARY KEY ( id )
    );`;

//分类
let subset = `create table if not exists subset(
     id INT NOT NULL AUTO_INCREMENT,
     subset_name VARCHAR(100) NOT NULL COMMENT '分类名称',
     classify INT NOT NULL COMMENT '类型0文章，1图片，2资源',
     moment VARCHAR(100) NOT NULL COMMENT '时间',
     PRIMARY KEY ( id )
    );`;

//文件
let file = `create table if not exists file(
     id INT NOT NULL AUTO_INCREMENT,
     url VARCHAR(100) NOT NULL COMMENT '地址',
     file_name VARCHAR(100) NOT NULL COMMENT '名称',
     format VARCHAR(32) NOT NULL COMMENT '格式',
     subset_id INT COMMENT '所属分类',
     moment VARCHAR(100) NOT NULL COMMENT '时间',
     PRIMARY KEY ( id )
    );`;

//文章
let article = `create table if not exists article(
     id INT NOT NULL AUTO_INCREMENT,
     title VARCHAR(200) NOT NULL COMMENT '标题',
     subset_id INT COMMENT '所属分类',
     classify INT NOT NULL COMMENT '类型0文章，1图片',
     label VARCHAR(200) COMMENT '标签',
     introduce VARCHAR(1000) COMMENT '简介',
     content VARCHAR(5000) COMMENT '内容',
     cover VARCHAR(100) COMMENT '封面地址',
     views INT DEFAULT 0 COMMENT '查看次数',
     state INT DEFAULT 0 COMMENT '文章状态',
     moment VARCHAR(100) NOT NULL COMMENT '时间',
     PRIMARY KEY ( id )
    );`;

//点赞
let praise = `create table if not exists praise(
     id INT NOT NULL AUTO_INCREMENT,
     user_id VARCHAR(100) NOT NULL COMMENT '用户',
     user_type INT NOT NULL COMMENT '查看次数',
     article_id INT  NOT NULL COMMENT '所属文章',
     moment VARCHAR(100) NOT NULL COMMENT '时间',
     PRIMARY KEY ( id )
    );`;

//评论
let comment = `create table if not exists comment(
     id INT NOT NULL AUTO_INCREMENT,
     user_id VARCHAR(100) NOT NULL COMMENT '用户',
     user_type INT NOT NULL COMMENT '用户类型',
     user_name VARCHAR(100) COMMENT '用户名称',
     article_id INT  NOT NULL COMMENT '所属文章',
     moment VARCHAR(100) NOT NULL COMMENT '时间',
     content VARCHAR(1000) NOT NULL COMMENT '内容',
     complaint INT DEFAULT 0 COMMENT '举报次数',
     isread INT DEFAULT 0 COMMENT '是否已读',
     PRIMARY KEY ( id )
    );`;
//标签
let label = `create table if not exists label(
     id INT NOT NULL AUTO_INCREMENT,
     label_name VARCHAR(100) NOT NULL COMMENT '名称',
     moment VARCHAR(100) NOT NULL COMMENT '时间',
     PRIMARY KEY ( id )
    );`;
//日记
let diary = `create table if not exists diary(
     id INT NOT NULL AUTO_INCREMENT,
     title VARCHAR(200) NOT NULL COMMENT '标题',
     content VARCHAR(5000) NOT NULL COMMENT '内容',
     picture VARCHAR(500) COMMENT '图片地址',
     weather_id INT COMMENT '天气',
     mood INT DEFAULT 0 COMMENT '心情',
     moment VARCHAR(100) NOT NULL COMMENT '时间',
     PRIMARY KEY ( id )
    );`;
//天气
let weather = `create table if not exists weather(
     id INT NOT NULL AUTO_INCREMENT,
     weather_name VARCHAR(32) NOT NULL COMMENT '名称',
     icon VARCHAR(100) COMMENT '图标',
     PRIMARY KEY ( id )
    );`;
//消息
let message = `create table if not exists message(
     id INT NOT NULL AUTO_INCREMENT,
     user_id VARCHAR(100) NOT NULL COMMENT '用户',
     user_type INT NOT NULL COMMENT '用户类型',
     user_name VARCHAR(100) COMMENT '用户名称',
     moment VARCHAR(100) NOT NULL COMMENT '时间',
     content VARCHAR(1000) NOT NULL COMMENT '内容',
     isread INT DEFAULT 0 COMMENT '是否已读',
     PRIMARY KEY ( id )
    );`;
//用户
let record = `create table if not exists record(
     id INT NOT NULL AUTO_INCREMENT,
     user_id VARCHAR(100) NOT NULL COMMENT '用户',
     user_type INT NOT NULL COMMENT '用户类型',
     position VARCHAR(100) COMMENT '位置',
     isread INT DEFAULT 0 COMMENT '设备',
     moment VARCHAR(100) NOT NULL COMMENT '时间',
     PRIMARY KEY ( id )
    );`;

const createTable = async () => {
  try {
    // 先创建数据库
    await createDatebase(blog);
    
    // 使用连接池执行表创建操作
    await queryPool(users, []);
    await queryPool(subset, []);
    await queryPool(file, []);
    await queryPool(article, []);
    await queryPool(praise, []);
    await queryPool(comment, []);
    await queryPool(label, []);
    await queryPool(diary, []);
    await queryPool(weather, []);
    await queryPool(message, []);
    await queryPool(record, []);
    
    console.log('数据库和表创建成功');
    return '创建成功';
  } catch (error) {
    console.error('创建数据库或表时出错:', error);
    throw error;
  }
};

// 初始化函数，用于应用启动时调用
const init = async () => {
  try {
    await createTable();
    console.log('数据库初始化完成');
    // 初始化完成后关闭初始连接
    initialConnection.end();
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1); // 如果数据库初始化失败，退出应用
  }
};

// 导出函数和连接池，供其他模块使用
module.exports = {
  query: queryPool,
  createTable,
  init,
  pool
};
