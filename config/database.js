

const { Pool } = require('pg');
   
  const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();
   async function query(sql, params) {
       const client = await pool.connect();
       try {
           const result = await client.query(sql, params);
           return result.rows;
       } finally {
           client.release();
       }
   }