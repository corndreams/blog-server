var express = require('express');
var router = express.Router();
const { query } = require('../models/db');

router.get('/summary', async (req, res) => {
  try {
    const [[{ count: articles }], [{ count: diaries }], [{ count: comments }], [{ count: messages }]] = await Promise.all([
      query(`select count(*) as count from articles`),
      query(`select count(*) as count from diaries`),
      query(`select count(*) as count from comments`),
      query(`select count(*) as count from messages`),
    ]);
    res.send({ code: 200, msg: '获取成功', data: { articles, diaries, comments, messages } });
  } catch (error) {
    res.send({ code: 500, msg: '服务器错误' });
  }
});

const fillSeries = (labels, rows, keyLabel, keyCount) => {
  const map = new Map(rows.map(r => [String(r[keyLabel]), Number(r[keyCount]) || 0]));
  return labels.map(l => ({ label: l, count: map.get(l) || 0 }));
};

router.get('/visits/volume', async (req, res) => {
  try {
    const period = (req.query.period || 'week').toLowerCase();
    if (period === 'week') {
      const rows = await query(`
        select DATE_FORMAT(created_at, '%Y-%m-%d') as d, count(*) as c
        from visits
        where created_at >= DATE_SUB(NOW(), INTERVAL 6 DAY)
        group by d
        order by d asc`);
      const labels = Array.from({ length: 7 }).map((_, i) => {
        const dt = new Date();
        dt.setDate(dt.getDate() - (6 - i));
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const d = String(dt.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      });
      return res.send({ code: 200, msg: '获取成功', data: fillSeries(labels, rows, 'd', 'c') });
    }
    if (period === 'year') {
      const rows = await query(`
        select DATE_FORMAT(created_at, '%m') as m, count(*) as c
        from visits
        where YEAR(created_at) = YEAR(NOW())
        group by m
        order by m asc`);
      const labels = Array.from({ length: 12 }).map((_, i) => String(i + 1).padStart(2, '0'));
      return res.send({ code: 200, msg: '获取成功', data: fillSeries(labels, rows, 'm', 'c') });
    }
    res.send({ code: 400, msg: 'period 参数不支持' });
  } catch (error) {
    res.send({ code: 500, msg: '服务器错误' });
  }
});

router.get('/visits/visitors', async (req, res) => {
  try {
    const period = (req.query.period || 'week').toLowerCase();
    if (period === 'week') {
      const rows = await query(`
        select DATE_FORMAT(created_at, '%Y-%m-%d') as d, count(distinct ip) as c
        from visits
        where created_at >= DATE_SUB(NOW(), INTERVAL 6 DAY)
        group by d
        order by d asc`);
      const labels = Array.from({ length: 7 }).map((_, i) => {
        const dt = new Date();
        dt.setDate(dt.getDate() - (6 - i));
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const d = String(dt.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      });
      return res.send({ code: 200, msg: '获取成功', data: fillSeries(labels, rows, 'd', 'c') });
    }
    if (period === 'year') {
      const rows = await query(`
        select DATE_FORMAT(created_at, '%m') as m, count(distinct ip) as c
        from visits
        where YEAR(created_at) = YEAR(NOW())
        group by m
        order by m asc`);
      const labels = Array.from({ length: 12 }).map((_, i) => String(i + 1).padStart(2, '0'));
      return res.send({ code: 200, msg: '获取成功', data: fillSeries(labels, rows, 'm', 'c') });
    }
    res.send({ code: 400, msg: 'period 参数不支持' });
  } catch (error) {
    res.send({ code: 500, msg: '服务器错误' });
  }
});

module.exports = router;