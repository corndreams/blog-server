var express = require("express");
var router = express.Router();
const { query } = require("../models/db");
const fs = require("fs");
const path = require("path");
const { log } = require("console");
let sharp;
try {
  sharp = require("sharp");
} catch (e) {
  sharp = null;
}

router.post("/upload", async (req, res) => {
  try {
    const { filename, data } = req.body;
    if (!data) return res.send({ code: 400, msg: "缺少文件数据" });
    const baseDir = path.join(__dirname, "..", "public", "uploads");
    if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });
    let mime = null;
    let b64 = data;
    if (data.startsWith("data:")) {
      const i = data.indexOf(";base64,");
      mime = data.slice(5, i);
      b64 = data.slice(i + 8);
    }
    const buf = Buffer.from(b64, "base64");
    const extFromMime = mime ? mime.split("/")[1] || "bin" : null;
    const extFromName =
      filename && filename.includes(".") ? filename.split(".").pop() : null;
    const ext = (extFromName || extFromMime || "bin").toLowerCase();
    const unique = Date.now() + "_" + Math.random().toString(36).slice(2);
    let finalExt = ext;
    let outBuf = buf;
    const isImageByMime = (mime || "").startsWith("image/");
    const isImageByExt = /^(jpg|jpeg|png|bmp|webp|tiff)$/i.test(ext);
    const isImage = isImageByMime || isImageByExt;
    const isSvg = ext === "svg" || (mime || "").includes("svg");
    const isGif = ext === "gif" || (mime || "").includes("gif");
    let detectedFormat = null;
    if (sharp) {
      try {
        const meta = await sharp(buf).metadata();
        detectedFormat =
          meta && meta.format ? String(meta.format).toLowerCase() : null;
      } catch (_) {
        detectedFormat = null;
      }
    }
    const alreadyWebp = ext === "webp" || detectedFormat === "webp";
    const canConvert =
      sharp &&
      !isSvg &&
      !isGif &&
      !alreadyWebp &&
      (isImage || !!detectedFormat);
    if (canConvert) {
      try {
        outBuf = await sharp(buf).webp({ quality: 80 }).toBuffer();
        finalExt = "webp";
        log("sharp webp success");
      } catch (e) {
        outBuf = buf;
        finalExt = ext;
        log("sharp webp failed");
      }
    } else if (!sharp && isImage && !isSvg && !isGif) {
      log("sharp not available, skip convert");
    }
    const finalName = `${unique}.${finalExt}`;
    const filePath = path.join(baseDir, finalName);
    fs.writeFileSync(filePath, outBuf);
    const baseUrl = "http://localhost:3000";
    const url = baseUrl + `/uploads/${finalName}`;
    await query(
      `insert into files(url, file_name, format, size, created_at) values(?, ?, ?, ?, NOW())`,
      [url, filename || finalName, finalExt, outBuf.length],
    );
    res.send({ code: 200, msg: "上传成功", data: { url: url } });
  } catch (error) {
    res.send({ code: 500, msg: "服务器错误" });
  }
});

module.exports = router;
router.get("/list", async (req, res) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const pageSize = parseInt(req.query.pageSize || "12", 10);
    const offset = (page - 1) * pageSize;
    const type = (req.query.type || "").toLowerCase();
    const where = [];
    const vals = [];
    if (type === "image") {
      where.push("format in ('jpg','jpeg','png','gif','webp','bmp','svg')");
    }
    const whereSql = where.length ? "where " + where.join(" and ") : "";
    const rows = await query(
      `select id, url, file_name, format, size, created_at from files ${whereSql} order by created_at desc limit ? offset ?`,
      [pageSize, offset],
    );
    const totalRows = await query(
      `select count(*) as total from files ${whereSql}`,
    );
    const total = totalRows[0].total;
    res.send({
      code: 200,
      msg: "获取成功",
      data: { list: rows, total, page, pageSize },
    });
  } catch (error) {
    res.send({ code: 500, msg: "服务器错误" });
  }
});
