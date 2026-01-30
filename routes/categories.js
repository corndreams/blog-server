var express = require('express');
var router = express.Router();
const { query } = require('../models/db');
const { verifyToken } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    // const rows = await query(`
    //   select c.id, c.name, c.slug as alias, c.description, c.created_at, c.updated_at,
    //          count(a.id) as article_count
    //   from categories c
    //   left join articles a on a.category_id = c.id
    //   group by c.id
    //   order by c.created_at desc`);
        const rows = await query(`
      select c.id, c.name, c.slug, c.description, c.created_at, c.updated_at,
             count(a.id) as article_count
      from categories c
      left join articles a on a.category_id = c.id
      group by c.id
      order by c.created_at desc`);
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
      const sql = `update categories set ${fields.join(', ')} where id=?`;
      const result = await query(sql, values);
      if (result && result.affectedRows > 0) {
        return res.send({ code: 200, msg: '更新成功' });
      }
      return res.send({ code: 400, msg: '更新失败' });
    } else {
      const sql = `insert into categories(name, slug, description, created_at) values(?, ?, ?, NOW())`;
      const values = [name, alias || null, description || null];
      const result = await query(sql, values);
      return res.send({ code: 200, msg: '创建成功', data: { id: result.insertId } });
    }
  } catch (error) {
    res.send({ code: 500, msg: '服务器错误' });
  }
});

module.exports = router;
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.send({ code: 400, msg: '无效分类ID' });
    await query(`update articles set category_id = null where category_id=?`, [id]);
    const result = await query(`delete from categories where id=?`, [id]);
    if (result && result.affectedRows > 0) {
      res.send({ code: 200, msg: '删除成功' });
    } else {
      res.send({ code: 404, msg: '分类不存在' });
    }
  } catch (error) {
    res.send({ code: 500, msg: '服务器错误' });
  }
});