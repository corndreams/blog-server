var express = require('express');
var router = express.Router();
const { query } = require('../models/db');
const { verifyToken } = require('../middleware/auth');

function normalizeDateTime(val) {
  if (!val && val !== 0) return null;
  if (typeof val === 'number') {
    const bj = new Date(val + 8 * 3600000);
    const y = bj.getUTCFullYear();
    const m = String(bj.getUTCMonth() + 1).padStart(2, '0');
    const d = String(bj.getUTCDate()).padStart(2, '0');
    const h = String(bj.getUTCHours()).padStart(2, '0');
    const mi = String(bj.getUTCMinutes()).padStart(2, '0');
    const s = String(bj.getUTCSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${mi}:${s}`;
  }
  let s = String(val).trim();
  // if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s + ' 00:00:00';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s + " 00:00:00";
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(s)) return s.length === 16 ? (s + ':00') : s;
  if (s.includes('T')) {
    s = s.replace('T', ' ').replace('Z', '').split('.')[0];
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(s)) return s.length === 16 ? (s + ':00') : s;
  }
  const n = Number(s);
  if (!isNaN(n)) return normalizeDateTime(n);
  return null;
}

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const pageSize = parseInt(req.query.pageSize || '10', 10);
    const offset = (page - 1) * pageSize;
    const stateParam = req.query.state;
    const state = stateParam === undefined ? 1 : parseInt(stateParam, 10);
    const rows = await query(`select id, title, content, state, diary_time, created_at, updated_at from diaries where state=? order by coalesce(diary_time, created_at) desc limit ? offset ?`, [state, pageSize, offset]);
    const [{ total }] = await query(`select count(*) as total from diaries where state=?`, [state]);
    res.send({ code: 200, msg: '获取成功', data: { list: rows, total, page, pageSize } });
  } catch (error) {
    res.send({ code: 500, msg: '服务器错误' });
  }
});

router.get('/list', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const pageSize = parseInt(req.query.pageSize || '10', 10);
    const offset = (page - 1) * pageSize;
    const rows = await query(`select id, title, content, state, diary_time, created_at, updated_at from diaries order by coalesce(diary_time, created_at) desc limit ? offset ?`, [pageSize, offset]);
    const [{ total }] = await query(`select count(*) as total from diaries`);
    res.send({ code: 200, msg: '获取成功', data: { list: rows, total, page, pageSize } });
  } catch (error) {
    res.send({ code: 500, msg: '服务器错误' });
  }
});

router.get('/time', async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10);
    const month = parseInt(req.query.month, 10);
    if (!year || !month || month < 1 || month > 12) return res.send({ code: 400, msg: '参数错误' });
    const rows = await query(
      `select id, DAY(coalesce(diary_time, created_at)) as day from diaries where YEAR(coalesce(diary_time, created_at))=? and MONTH(coalesce(diary_time, created_at))=? and state=1 order by coalesce(diary_time, created_at) asc`,
      [year, month]
    );
    res.send({ code: 200, msg: '获取成功', data: rows });
  } catch (error) {
    res.send({ code: 500, msg: '服务器错误' });
  }
});

router.post('/edit', verifyToken, async (req, res) => {
  try {
    const { id, title, content, state, time } = req.body;
    if (!title) return res.send({ code: 400, msg: '标题不能为空' });
    if (!content) return res.send({ code: 400, msg: '内容不能为空' });
    if (state !== undefined && !(parseInt(state, 10) == 0 || parseInt(state, 10) == 1)) return res.send({ code: 400, msg: '状态无效' });
    if (id) {
      const fields = ['title=?', 'content=?'];
      const values = [title, content];
      if (state !== undefined) { fields.push('state=?'); values.push(parseInt(state, 10)); }
      const t = normalizeDateTime(time);
      if (t) { fields.push('diary_time=?'); values.push(t); }
      const result = await query(`update diaries set ${fields.join(', ')}, updated_at=NOW() where id=?`, [...values, id]);
      if (result && result.affectedRows > 0) return res.send({ code: 200, msg: '更新成功' });
      return res.send({ code: 400, msg: '更新失败' });
    } else {
      const newState = state === undefined ? 0 : parseInt(state, 10);
      const t = normalizeDateTime(time);
      if (t) {
        const result = await query(`insert into diaries(title, content, state, diary_time, created_at) values(?, ?, ?, ?, NOW())`, [title, content, newState, t]);
        return res.send({ code: 200, msg: '创建成功', data: { id: result.insertId } });
      } else {
        const result = await query(`insert into diaries(title, content, state, diary_time, created_at) values(?, ?, ?, NOW(), NOW())`, [title, content, newState]);
        return res.send({ code: 200, msg: '创建成功', data: { id: result.insertId } });
      }
    }
  } catch (error) {
    res.send({ code: 500, msg: '服务器错误' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.send({ code: 400, msg: '无效随记ID' });
    const result = await query(`delete from diaries where id=?`, [id]);
    if (result && result.affectedRows > 0) return res.send({ code: 200, msg: '删除成功' });
    return res.send({ code: 404, msg: '随记不存在' });
  } catch (error) {
    res.send({ code: 500, msg: '服务器错误' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.send({ code: 400, msg: '无效随记ID' });
    const rows = await query(`select id, title, content, diary_time, created_at, updated_at from diaries where id=? limit 1`, [id]);
    if (!rows || rows.length === 0) return res.send({ code: 404, msg: '随记不存在' });
    res.send({ code: 200, msg: '获取成功', data: rows[0] });
  } catch (error) {
    res.send({ code: 500, msg: '服务器错误' });
  }
});

module.exports = router;