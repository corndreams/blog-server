const mysql = require('mysql2/promise')
const config=require('../config/default')

const pool=mysql.createPool({
  host:config.datebase.host,
  user:config.datebase.username,
  password:config.datebase.password,
  database:config.datebase.database
})

let query=()=>{
  return new Promise(()=>{
    
  })
}