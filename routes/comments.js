var express = require('express');
var router = express.Router();
const { query } = require('../models/db');
const { verifyToken } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const pageSize = parseInt(req.query.pageSize || '10', 10);
    const offset = (page - 1) * pageSize;
    const articleId = req.query.article_id ? parseInt(req.query.article_id, 10) : null;
    const parentId = req.query.parent_id ? parseInt(req.query.parent_id, 10) : null;
    const where = [];
    const vals = [];
    if (articleId) { where.push('c.article_id=?'); vals.push(articleId); }
    if (parentId !== null && !isNaN(parentId)) { where.push('c.parent_id=?'); vals.push(parentId); }
    const whereSql = where.length ? ('where ' + where.join(' and ')) : '';
    const listSql = `
      select c.id, c.article_id, c.user_id, c.user_name as name, c.content, c.parent_id,
             c.link, c.ip, c.avatar, c.created_at, c.updated_at,
             a.title as article_title,
             (select count(*) from comments c2 where c2.parent_id = c.id) as children_count
      from comments c
      left join articles a on a.id = c.article_id
      ${whereSql}
      order by c.created_at desc
      limit ? offset ?`;
    const rows = await query(listSql, [...vals, pageSize, offset]);
    const totalRows = await query(`select count(*) as total from comments c ${whereSql}`, vals);
    const total = totalRows[0].total;
    res.send({ code: 200, msg: '获取成功', data: { list: rows, total, page, pageSize } });
  } catch (error) {
    res.send({ code: 500, msg: '服务器错误' });
  }
});

router.post('/add', async (req, res) => {
  try {
    const { article_id, name, content, parent_id, link, avatar } = req.body;
    if (!article_id) return res.send({ code: 400, msg: '缺少关联文章' });
    if (!name) return res.send({ code: 400, msg: '名字不能为空' });
    if (!content) return res.send({ code: 400, msg: '评论内容不能为空' });
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || null;
    const sql = `insert into comments(article_id, user_name, content, parent_id, link, ip, avatar, created_at) values(?, ?, ?, ?, ?, ?, ?, NOW())`;
    const values = [parseInt(article_id, 10), name, content, parent_id ? parseInt(parent_id, 10) : null, link || null, ip, avatar || null];
    const result = await query(sql, values);
    res.send({ code: 200, msg: '创建成功', data: { id: result.insertId } });
  } catch (error) {
    res.send({ code: 500, msg: '服务器错误' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.send({ code: 400, msg: '无效评论ID' });
    await query(`delete from comments where parent_id=?`, [id]);
    const result = await query(`delete from comments where id=?`, [id]);
    if (result && result.affectedRows > 0) {
      res.send({ code: 200, msg: '删除成功' });
    } else {
      res.send({ code: 404, msg: '评论不存在' });
    }
  } catch (error) {
    res.send({ code: 500, msg: '服务器错误' });
  }
});

module.exports = router;
router.get('/tree/:articleId', async (req, res) => {
  try {
    const articleId = parseInt(req.params.articleId, 10);
    if (!articleId) return res.send({ code: 400, msg: '无效文章ID' });
    const rows = await query(
      `select id, article_id, user_id, user_name as name, content, parent_id, link, ip, avatar, created_at, updated_at from comments where article_id=? order by created_at asc`,
      [articleId]
    );
    const map = new Map();
    const roots = [];
    for (const r of rows) {
      map.set(r.id, { ...r, children: [] });
    }
    for (const r of rows) {
      const node = map.get(r.id);
      const pid = r.parent_id;
      if (!pid || pid === 0) {
        roots.push(node);
      } else {
        const parent = map.get(pid);
        if (parent) parent.children.push(node); else roots.push(node);
      }
    }
    res.send({ code: 200, msg: '获取成功', data: roots });
  } catch (error) {
    res.send({ code: 500, msg: '服务器错误' });
  }
});