var express = require('express');
var router = express.Router();
const { query } = require('../models/db');
const { verifyToken } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const pageSize = parseInt(req.query.pageSize || '10', 10);
    const offset = (page - 1) * pageSize;
    const rows = await query(`select id, user_name as name, content, ip, created_at from messages order by created_at desc limit ? offset ?`, [pageSize, offset]);
    const [{ total }] = await query(`select count(*) as total from messages`);
    res.send({ code: 200, msg: '获取成功', data: { list: rows, total, page, pageSize } });
  } catch (error) {
    res.send({ code: 500, msg: '服务器错误' });
  }
});

router.post('/add', async (req, res) => {
  try {
    const { name, content } = req.body;
    if (!name) return res.send({ code: 400, msg: '名字不能为空' });
    if (!content) return res.send({ code: 400, msg: '内容不能为空' });
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || null;
    const result = await query(`insert into messages(user_name, content, ip, created_at) values(?, ?, ?, NOW())`, [name, content, ip]);
    res.send({ code: 200, msg: '创建成功', data: { id: result.insertId } });
  } catch (error) {
    res.send({ code: 500, msg: '服务器错误' });
  }
});

router.get('/all', async (req, res) => {
  try {
    const rows = await query(`select user_name as name, content from messages order by created_at desc`);
    res.send({ code: 200, msg: '获取成功', data: rows });
  } catch (error) {
    res.send({ code: 500, msg: '服务器错误' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.send({ code: 400, msg: '无效留言ID' });
    const result = await query(`delete from messages where id=?`, [id]);
    if (result && result.affectedRows > 0) {
      res.send({ code: 200, msg: '删除成功' });
    } else {
      res.send({ code: 404, msg: '留言不存在' });
    }
  } catch (error) {
    res.send({ code: 500, msg: '服务器错误' });
  }
});

module.exports = router;