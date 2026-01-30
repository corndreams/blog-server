var express = require('express');
var router = express.Router();
const { query } = require('../models/db');
const { verifyToken } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const rows = await query(`
      select t.id, t.name, t.slug as alias, t.description, t.created_at, t.updated_at,
             count(at.article_id) as article_count
      from tags t
      left join article_tags at on at.tag_id = t.id
      group by t.id
      order by t.created_at desc`);
    res.send({ code: 200, msg: '获取成功', data: rows });
  } catch (error) {
    res.send({ code: 500, msg: '服务器错误' });
  }
});

router.post('/edit', verifyToken, async (req, res) => {
  try {
    const { id, name, alias, description } = req.body;
    if (!name) return res.send({ code: 400, msg: '名称不能为空' });
    if (id) {
      const fields = [];
      const values = [];
      if (name !== undefined) { fields.push('name=?'); values.push(name); }
      if (alias !== undefined) { fields.push('slug=?'); values.push(alias); }
      if (description !== undefined) { fields.push('description=?'); values.push(description); }
      fields.push('updated_at=NOW()');
      values.push(id);
      const sql = `update tags set ${fields.join(', ')} where id=?`;
      const result = await query(sql, values);
      if (result && result.affectedRows > 0) {
        return res.send({ code: 200, msg: '更新成功' });
      }
      return res.send({ code: 400, msg: '更新失败' });
    } else {
      const sql = `insert into tags(name, slug, description, created_at) values(?, ?, ?, NOW())`;
      const values = [name, alias || null, description || null];
      const result = await query(sql, values);
      return res.send({ code: 200, msg: '创建成功', data: { id: result.insertId } });
    }
  } catch (error) {
    res.send({ code: 500, msg: '服务器错误' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.send({ code: 400, msg: '无效标签ID' });
    await query(`delete from article_tags where tag_id=?`, [id]);
    const result = await query(`delete from tags where id=?`, [id]);
    if (result && result.affectedRows > 0) {
      res.send({ code: 200, msg: '删除成功' });
    } else {
      res.send({ code: 404, msg: '标签不存在' });
    }
  } catch (error) {
    res.send({ code: 500, msg: '服务器错误' });
  }
});

module.exports = router;