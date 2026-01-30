var express = require("express");
var router = express.Router();
const { query } = require("../models/db");
const jwt = require("jsonwebtoken");
const config = require("../config/default");
const { verifyToken } = require("../middleware/auth");

//管理员登录
router.post("/sign_in", async (req, res) => {
  try {
    const { name, password } = req.body;

    // 验证输入
    if (!name || !password) {
      return res.send({
        code: 400,
        msg: "用户名和密码不能为空",
      });
    }

    const sql = `select * from users where name=? and password=?`;
    const values = [name, password];
    const result = await query(sql, values);

    if (result.length > 0) {
      // 生成JWT token
      const adminData = result[0];
      const token = jwt.sign(
        { id: adminData.id, name: adminData.name },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      res.send({
        code: 200,
        msg: "登录成功",
        data: {
          // ...adminData,
          token,
        },
      });
    } else {
      res.send({
        code: 401,
        msg: "用户名或密码错误",
      });
    }
  } catch (error) {
    console.error("登录错误:", error);
    res.send({
      code: 500,
      msg: "服务器错误",
    });
  }
});

// 获取管理员信息
router.get("/admin_info", async (req, res) => {
  try {
    const sql = `select id, name, moment, imgurl from users limit 1`;
    const result = await query(sql);

    if (result && result.length > 0) {
      res.send({
        code: 200,
        msg: "获取成功",
        data: result[0],
      });
    } else {
      res.send({
        code: 404,
        msg: "管理员信息不存在",
      });
    }
  } catch (error) {
    console.error("获取管理员信息错误:", error);
    res.send({
      code: 500,
      msg: "服务器错误",
    });
  }
});

// 修改管理员信息
router.put("/update_admin", verifyToken, async (req, res) => {
  try {
    const { password, imgurl } = req.body;

    // 从token中获取管理员ID
    const adminId = req.user.id;

    // 构建更新字段
    let updateFields = [];
    let values = [];

    if (password) {
      updateFields.push("password=?");
      values.push(password);
    }

    if (imgurl) {
      updateFields.push("imgurl=?");
      values.push(imgurl);
    }

    if (updateFields.length === 0) {
      return res.send({
        code: 400,
        msg: "没有提供要更新的字段",
      });
    }

    // 添加管理员ID到values数组
    values.push(adminId);

    const sql = `update users set ${updateFields.join(", ")} where id=?`;
    const result = await query(sql, values);

    if (result && result.affectedRows > 0) {
      res.send({
        code: 200,
        msg: "更新成功",
      });
    } else {
      res.send({
        code: 400,
        msg: "更新失败",
      });
    }
  } catch (error) {
    console.error("更新管理员信息错误:", error);
    res.send({
      code: 500,
      msg: "服务器错误",
    });
  }
});

module.exports = router;
