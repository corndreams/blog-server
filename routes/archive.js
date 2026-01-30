var express = require('express');
var router = express.Router();
const { query } = require('../models/db');

router.get('/time', async (req, res) => {
  try {
    const rows = await query(`select id, title, introduce as description, cover, category_id, created_at from articles where state=1 order by created_at desc`);
    const data = {};
    for (const r of rows) {
      const d = new Date(r.created_at);
      const y = String(d.getFullYear());
      const m = String(d.getMonth() + 1).padStart(2, '0');
      if (!data[y]) data[y] = [];
      let bucket = data[y].find(x => x.month === m);
      if (!bucket) {
        bucket = { month: m, count: 0, list: [] };
        data[y].push(bucket);
      }
      bucket.list.push({ id: r.id, title: r.title, description: r.description, cover: r.cover, category_id: r.category_id, created_at: r.created_at });
      bucket.count += 1;
    }
    res.send({ code: 200, msg: '获取成功', data });
  } catch (error) {
    res.send({ code: 500, msg: '服务器错误' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const rows = await query(`
      select c.id, c.name, c.slug, coalesce(count(a.id), 0) as count
      from categories c
      left join articles a on a.category_id = c.id and a.state = 1
      group by c.id, c.name, c.slug
      order by count desc, c.name asc`);
    res.send({ code: 200, msg: '获取成功', data: rows });
  } catch (error) {
    res.send({ code: 500, msg: '服务器错误' });
  }
});

router.get('/tags', async (req, res) => {
  try {
    const rows = await query(`
      select t.id, t.name, t.slug, coalesce(count(a.id), 0) as count
      from tags t
      left join article_tags at on at.tag_id = t.id
      left join articles a on a.id = at.article_id and a.state = 1
      group by t.id, t.name, t.slug
      order by count desc, t.name asc`);
    res.send({ code: 200, msg: '获取成功', data: rows });
  } catch (error) {
    res.send({ code: 500, msg: '服务器错误' });
  }
});

module.exports = router;