## 问题与原因
- 报错来源：向 `DATETIME` 字段插入 ISO8601（含 `Z` 时区）字符串，例如 `'2025-11-14T05:51:44.706Z'`。
- MySQL 在严格模式下不接受此格式，期望 `YYYY-MM-DD HH:MM:SS` 或使用 SQL 函数 `NOW()`。
- 影响范围：
  - `models/db.js:120-198` 里的种子数据插入使用 `toISOString()`；
  - `models/db.js:92-118` 的默认管理员插入同样使用 ISO 字符串。
  - 各表 `created_at`/`moment` 字段当前为 `DATETIME NOT NULL` 且无默认值（见 `models/schema/*.js`）。

## 修复方案（优先最小改动）
1. 仅调整插入语句，直接使用 `NOW()`，避免格式化问题：
   - `models/db.js:103-109` 默认管理员插入：改为 `insert into users(name, password, moment) values(?, ?, NOW())`，同时移除第三个参数值；
   - `models/db.js:133-136` 分类插入：改为 `values(?, ?, NOW())`；
   - `models/db.js:151-154` 标签插入：改为 `values(?, ?, NOW())`；
   - `models/db.js:172-185` 文章插入：`created_at` 改为 `NOW()`（若未来用 `updated_at`，同理可设为 `NOW()`）；
   - `models/db.js:188-191` 文章-标签关联插入：改为 `values(?, ?, NOW())`。

2. 保持当前表结构不变（无需 `ALTER TABLE`），即可避免初始化报错并成功写入时间。

## 可选增强（提高可维护性）
- 为时间字段添加默认值与自动更新，减少插入时的参数管理：
  - `models/schema/users.js:10`：`moment DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`；
  - `models/schema/categories.js:6`：`created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`；
  - `models/schema/tags.js:5`：`created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`；
  - `models/schema/articles.js:12-13`：`created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`、`updated_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`；
  - `models/schema/articles.js:20`：`created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`；
  - `models/schema/comments.js:10`：`created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`；
  - `models/schema/messages.js:7`：`created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`。
- 若数据库已创建上述表，`create table if not exists` 不会更新结构；如需立即生效，应执行对应 `ALTER TABLE ... MODIFY ...` 语句（可在初始化时检测并迁移）。

## 验证步骤
- 重新启动服务，观察控制台：应不再出现 `Incorrect datetime value`；
- 执行检查：`select * from categories;`、`select * from tags;`、`select * from articles;`、`select * from users;`，确认时间字段已正确填充。

## 预期影响
- 不改变现有 API 行为与业务逻辑；
- 初始化过程可顺利完成，种子数据正常写入；
- 未来插入时间统一依赖 `NOW()`（或默认值），避免格式问题。