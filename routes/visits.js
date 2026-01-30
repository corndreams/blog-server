var express = require('express');
var router = express.Router();
const { query } = require('../models/db');
const { verifyToken } = require('../middleware/auth');

router.post('/track', async (req, res) => {
  try {
    const { path } = req.body;
    if (!path || typeof path !== 'string') return res.send({ code: 400, msg: '路径无效' });
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || null;
    const ua = req.headers['user-agent'] || '';
    const botRegex = /(bot|spider|crawl|slurp|bingbot|baiduspider|duckduckbot|yandex|sogou|exabot|facebot|ia_archiver)/i;
    if (ua && botRegex.test(ua)) return res.send({ code: 200, msg: '已忽略爬虫' });
    const device = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i.test(ua) ? 'mobile' : 'desktop';
    let articleId = null;
    let diaryId = null;
    const m1 = path.match(/\/article\/(\d+)/);
    const m2 = path.match(/\/notes\/(\d+)/);
    if (m1 && m1[1]) articleId = parseInt(m1[1], 10);
    if (m2 && m2[1]) diaryId = parseInt(m2[1], 10);
    const dupWhere = ip ? 'path=? and ip=?' : 'path=? and ip IS NULL';
    const dupVals = ip ? [path, ip] : [path];
    const exists = await query(`select id from visits where ${dupWhere} and created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR) limit 1`, dupVals);
    if (exists && exists.length > 0) return res.send({ code: 200, msg: '已忽略重复访问' });
    await query(`insert into visits(path, article_id, diary_id, ip, user_agent, device, created_at) values(?, ?, ?, ?, ?, ?, NOW())`, [path, articleId, diaryId, ip, ua, device]);
    if (articleId) await query(`update articles set views = views + 1 where id=?`, [articleId]);
    if (diaryId) await query(`update diaries set views = views + 1 where id=?`, [diaryId]);
    res.send({ code: 200, msg: '记录成功' });
  } catch (error) {
    res.send({ code: 500, msg: '服务器错误' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const [{ total }] = await query(`select count(*) as total from visits`);
    const [{ total_article }] = await query(`select count(*) as total_article from visits where article_id is not null`);
    const [{ total_diary }] = await query(`select count(*) as total_diary from visits where diary_id is not null`);
    const [{ visitors }] = await query(`select count(distinct ip) as visitors from visits`);
    res.send({ code: 200, msg: '获取成功', data: { total, total_article, total_diary, visitors } });
  } catch (error) {
    res.send({ code: 500, msg: '服务器错误' });
  }
});

router.get('/list',verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const pageSize = parseInt(req.query.pageSize || '10', 10);
    const offset = (page - 1) * pageSize;
    const year = req.query.year ? parseInt(req.query.year, 10) : null;
    const month = req.query.month ? parseInt(req.query.month, 10) : null;
    const day = req.query.day ? parseInt(req.query.day, 10) : null;
    const where = [];
    const vals = [];
    if (year) { where.push('YEAR(created_at)=?'); vals.push(year); }
    if (month) { where.push('MONTH(created_at)=?'); vals.push(month); }
    if (day) { where.push('DAY(created_at)=?'); vals.push(day); }
    const whereSql = where.length ? ('where ' + where.join(' and ')) : '';
    const sql = `select id, path, article_id, diary_id, ip, user_agent, device, created_at from visits ${whereSql} order by created_at desc limit ? offset ?`;
    const rows = await query(sql, [...vals, pageSize, offset]);
    const totalRows = await query(`select count(*) as total from visits ${whereSql}`, vals);
    const total = totalRows[0].total;
    res.send({ code: 200, msg: '获取成功', data: { list: rows, total, page, pageSize } });
  } catch (error) {
    res.send({ code: 500, msg: '服务器错误' });
  }
});

module.exports = router;