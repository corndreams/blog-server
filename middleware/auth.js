const jwt = require('jsonwebtoken');
const config = require('../config/default');

// 验证JWT token的中间件
const verifyToken = (req, res, next) => {
  // 从请求头获取token
  const token = req.headers['token'];
  
  if (!token) {
    return res.status(403).send({
      code: 403,
      msg: '未提供认证令牌'
    });
  }
  
  try {
    // 验证token，支持两种格式："Bearer token" 或直接 "token"
    let tokenValue = token;
    // if (token.startsWith('Bearer ')) {
    //   tokenValue = token.split(' ')[1];
    // }
    const decoded = jwt.verify(tokenValue, config.jwt.secret);
    
    // 将解码后的用户信息添加到请求对象中
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).send({
      code: 401,
      msg: '无效或已过期的令牌'
    });
  }
};

module.exports = { verifyToken };