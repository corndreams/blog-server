const config = {
  port: 3000,
  datebase: {
    username: "root",
    password: "root",
    database: "blog",
    host: "127.0.0.1",
    dialect: "mysql",
    timezone: "+08:00",
  },
  jwt: {
    secret: "bolg_admin_secret_key",
    expiresIn: "7d", // token过期时间，7天
  },
};

module.exports = config;
