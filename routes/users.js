var express = require('express');
var router = express.Router();
const { query } = require('../models/db');
const { verifyToken } = require('../middleware/auth');

router.get('/info', async (req, res) => {
  try {
    const rows = await query('select * from user_info order by id asc limit 1');
    if (rows && rows.length > 0) {
      res.send({ code: 200, msg: '获取成功', data: rows[0] });
    } else {
      res.send({ code: 404, msg: '未找到用户信息' });
    }
  } catch (error) {
    res.send({ code: 500, msg: '服务器错误' });
  }
});

router.put('/info', verifyToken, async (req, res) => {
  try {
    const { avatar, name, tagline, quote, mbti, mbti_intro, about } = req.body;
    const rows = await query('select id from user_info order by id asc limit 1');
    const hasInfo = rows && rows.length > 0;
    if (!hasInfo) {
      const sql = 'insert into user_info(avatar, name, tagline, quote, mbti, mbti_intro, about, created_at) values(?, ?, ?, ?, ?, ?, ?, NOW())';
      const values = [avatar || null, name || '博主', tagline || null, quote || null, mbti || null, mbti_intro || null, about || null];
      await query(sql, values);
      return res.send({ code: 200, msg: '创建成功' });
    }
    const id = rows[0].id;
    const fields = [];
    const values = [];
    if (avatar !== undefined) { fields.push('avatar=?'); values.push(avatar); }
    if (name !== undefined) { fields.push('name=?'); values.push(name); }
    if (tagline !== undefined) { fields.push('tagline=?'); values.push(tagline); }
    if (quote !== undefined) { fields.push('quote=?'); values.push(quote); }
    if (mbti !== undefined) { fields.push('mbti=?'); values.push(mbti); }
    if (mbti_intro !== undefined) { fields.push('mbti_intro=?'); values.push(mbti_intro); }
    if (about !== undefined) { fields.push('about=?'); values.push(about); }
    fields.push('updated_at=NOW()');
    values.push(id);
    const sql = `update user_info set ${fields.join(', ')} where id=?`;
    const result = await query(sql, values);
    if (result && result.affectedRows > 0) {
      res.send({ code: 200, msg: '更新成功' });
    } else {
      res.send({ code: 400, msg: '更新失败' });
    }
  } catch (error) {
    res.send({ code: 500, msg: '服务器错误' });
  }
});

module.exports = router;
