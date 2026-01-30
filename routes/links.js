var express = require("express");
var router = express.Router();
const { query } = require("../models/db");
const { verifyToken } = require("../middleware/auth");

router.get("/", async (req, res) => {
  try {
    const rows = await query(
      `select id, name, icon, url, created_at, updated_at from links order by created_at desc`,
    );
    res.send({ code: 200, msg: "获取成功", data: rows });
  } catch (error) {
    res.send({ code: 500, msg: "服务器错误" });
  }
});

router.post("/edit", verifyToken, async (req, res) => {
  try {
    const { id, name, icon, url } = req.body;
    if (!name) return res.send({ code: 400, msg: "名称不能为空" });
    if (!url) return res.send({ code: 400, msg: "链接不能为空" });
    if (id) {
      const fields = [];
      const values = [];
      if (name !== undefined) {
        fields.push("name=?");
        values.push(name);
      }
      if (icon !== undefined) {
        fields.push("icon=?");
        values.push(icon);
      }
      if (url !== undefined) {
        fields.push("url=?");
        values.push(url);
      }
      fields.push("updated_at=NOW()");
      values.push(id);
      const sql = `update links set ${fields.join(", ")} where id=?`;
      const result = await query(sql, values);
      if (result && result.affectedRows > 0) {
        return res.send({ code: 200, msg: "更新成功" });
      } else {
        return res.send({ code: 400, msg: "更新失败" });
      }
    } else {
      const result = await query(
        `insert into links(name, icon, url, created_at) values(?, ?, ?, NOW())`,
        [name, icon || null, url],
      );
      return res.send({
        code: 200,
        msg: "创建成功",
        data: { id: result.insertId },
      });
    }
  } catch (error) {
    res.send({ code: 500, msg: "服务器错误" });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.send({ code: 400, msg: "无效链接ID" });
    const result = await query(`delete from links where id=?`, [id]);
    if (result && result.affectedRows > 0) {
      res.send({ code: 200, msg: "删除成功" });
    } else {
      res.send({ code: 404, msg: "链接不存在" });
    }
  } catch (error) {
    res.send({ code: 500, msg: "服务器错误" });
  }
});

module.exports = router;
