var express = require("express");
var router = express.Router();
const { query } = require("../models/db");
const { verifyToken } = require("../middleware/auth");

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const pageSize = parseInt(req.query.pageSize || "10", 10);
    const offset = (page - 1) * pageSize;
    const listSql = `
      select a.id, a.title, a.introduce as description, a.cover, a.category_id, a.state, a.views, a.created_at, a.updated_at,
             c.name as category_name,
             group_concat(t.name) as tags
      from articles a
      left join categories c on c.id = a.category_id
      left join article_tags at on at.article_id = a.id
      left join tags t on t.id = at.tag_id
      group by a.id
      order by a.created_at desc
      limit ? offset ?`;
    const rows = await query(listSql, [pageSize, offset]);
    const [{ total }] = await query(`select count(*) as total from articles`);
    res.send({ code: 200, msg: "获取成功", data: { list: rows, total, page, pageSize } });
  } catch (error) {
    res.send({ code: 500, msg: "服务器错误" });
  }
});

router.post("/edit", verifyToken, async (req, res) => {
  try {
    const { id, title, description, cover, category_id, tagIds, state, content } = req.body;
    console.log(req.body);
    if (!title) return res.send({ code: 400, msg: "标题不能为空" });
    if (state !== undefined && !(state == 0 || state == 1)) return res.send({ code: 400, msg: "状态无效" });

    if (id) {
      const fields = [];
      const values = [];
      if (title !== undefined) { fields.push("title=?"); values.push(title); }
      if (description !== undefined) { fields.push("introduce=?"); values.push(description); }
      if (content !== undefined) { fields.push("content=?"); values.push(content); }
      if (cover !== undefined) { fields.push("cover=?"); values.push(cover); }
      if (category_id !== undefined) { fields.push("category_id=?"); values.push(category_id); }
      if (state !== undefined) { fields.push("state=?"); values.push(state); }
      fields.push("updated_at=NOW()");
      values.push(id);
      const sql = `update articles set ${fields.join(", ")} where id=?`;
      const result = await query(sql, values);
      if (!(result && result.affectedRows > 0)) return res.send({ code: 400, msg: "更新失败" });
      // if (Array.isArray(tagIds)) {
        await query(`delete from article_tags where article_id=?`, [id]);
        for (const tagId of tagIds) {
          await query(`insert into article_tags(article_id, tag_id, created_at) values(?, ?, NOW())`, [id, tagId]);
        }
      // }
      return res.send({ code: 200, msg: "更新成功", data: { id } });
    } else {
      const insertSql = `insert into articles(title, category_id, author_id, introduce, content, cover, views, state, created_at) values(?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
      const values = [title, category_id || null, req.user?.id || null, description || null, content || null, cover || null, 0, state ?? 0];
      const result = await query(insertSql, values);
      const newId = result.insertId;
      // if (Array.isArray(tagIds)) {
        for (const tagId of tagIds) {
          await query(`insert into article_tags(article_id, tag_id, created_at) values(?, ?, NOW())`, [newId, tagId]);
        }
      // }
      return res.send({ code: 200, msg: "创建成功", data: { id: newId } });
    }
  } catch (error) {
    res.send({ code: 500, msg: "服务器错误" });
  }
});

router.get('/published', async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const pageSize = parseInt(req.query.pageSize || '10', 10);
    const offset = (page - 1) * pageSize;
    const whereParts = ['a.state = 1'];
    const values = [];
    const categoryId = req.query.category_id ? parseInt(req.query.category_id, 10) : null;
    const tagId = req.query.tag_id ? parseInt(req.query.tag_id, 10) : null;
    const tagIdsParam = req.query.tag_ids || '';
    const tagIds = String(tagIdsParam)
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n));
    if (categoryId) {
      whereParts.push('a.category_id = ?');
      values.push(categoryId);
    }
    if (tagId || (tagIds && tagIds.length > 0)) {
      const ids = tagId ? [tagId] : tagIds;
      const placeholders = ids.map(() => '?').join(',');
      whereParts.push(`exists (select 1 from article_tags at2 where at2.article_id = a.id and at2.tag_id in (${placeholders}))`);
      values.push(...ids);
    }
    const whereSql = whereParts.length ? ('where ' + whereParts.join(' and ')) : '';
    const listSql = `
      select a.id, a.title, a.introduce as description, a.cover, a.category_id, a.state, a.views, a.created_at, a.updated_at,
             c.name as category_name,
             group_concat(t.name) as tags
      from articles a
      left join categories c on c.id = a.category_id
      left join article_tags at on at.article_id = a.id
      left join tags t on t.id = at.tag_id
      ${whereSql}
      group by a.id
      order by a.created_at desc
      limit ? offset ?`;
    const rows = await query(listSql, [...values, pageSize, offset]);
    const countSql = `
      select count(distinct a.id) as total
      from articles a
      left join categories c on c.id = a.category_id
      left join article_tags at on at.article_id = a.id
      left join tags t on t.id = at.tag_id
      ${whereSql}`;
    const [{ total }] = await query(countSql, values);
    res.send({ code: 200, msg: '获取成功', data: { list: rows, total, page, pageSize } });
  } catch (error) {
    res.send({ code: 500, msg: '服务器错误' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.send({ code: 400, msg: '无效文章ID' });
    const rows = await query(`select a.id, a.title, a.introduce as description, a.content, a.cover, a.category_id, a.state, a.views, a.created_at, a.updated_at, c.name as category_name from articles a left join categories c on c.id=a.category_id where a.id=? limit 1`, [id]);
    if (!rows || rows.length === 0) return res.send({ code: 404, msg: '文章不存在' });
    const tags = await query(`select t.id, t.name from article_tags at join tags t on t.id=at.tag_id where at.article_id=?`, [id]);
    res.send({ code: 200, msg: '获取成功', data: { ...rows[0], tags } });
  } catch (error) {
    res.send({ code: 500, msg: '服务器错误' });
  }
});

module.exports = router;