const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// ฟังก์ชันทั่วไปสำหรับจัดการการทำงานกับฐานข้อมูล
async function executeQuery(query, params, res, successMessage) {
  try {
    const [results] = await pool.query(query, params);
    if (successMessage && results.affectedRows > 0) {
      res.status(201).send(successMessage);
    } else if (results.affectedRows === 0) {
      res.status(404).send('ไม่พบข้อมูลหรือไม่มีการเปลี่ยนแปลง');
    } else {
      res.json(results);
    }
  } catch (err) {
    console.error('เกิดข้อผิดพลาดในการดำเนินการฐานข้อมูล:', err.message);
    res.status(500).send('เกิดข้อผิดพลาด');
  }
}

router.get('/', async (req, res) => {
  const query = `
    SELECT 
      score_id,
      score_name,
      score_url
    FROM Score
    ORDER BY score_id ASC
  `;
  await executeQuery(query, [], res);
});

router.post('/', async (req, res) => {
  const { score_name,score_url } = req.body;

  if (!score_name || !score_url) {
    return res.status(400).send('กรุณาระบุหัวข้อและลิงก์');
  }

  try {
    const [maxIdResult] = await pool.query('SELECT MAX(score_id) as max_id FROM Score');
    const nextId = (maxIdResult[0].max_id || 0) + 1;

    const query = `
      INSERT INTO Score (score_id, score_name, score_url) 
      VALUES (?, ?, ?)
    `;
    await pool.query(query, [nextId, score_name, score_url || null]);
    res.status(201).send('เพิ่มข้อมูลเรียบร้อยแล้ว');
  } catch (err) {
    console.error('เกิดข้อผิดพลาดในการเพิ่มข้อมูล:', err.message);
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).send('มีข้อมูลในระบบแล้ว');
    } else {
      res.status(500).send('เกิดข้อผิดพลาดในการเพิ่มข้อมูล');
    }
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { score_name, score_url } = req.body;

  if (!score_name || !score_url) {
    return res.status(400).send('กรุณาระบุหัวข้อและลิงก์');
  }

  try {
    const [ScoreCheck] = await pool.query(
      'SELECT score_id FROM Score WHERE score_id = ?',
      [id]
    );
    if (ScoreCheck.length === 0) {
      return res.status(404).send('ไม่พบข้อมูล');
    }

    const query = `
      UPDATE Score 
      SET score_name = ?, score_url = ?
      WHERE score_id = ?
    `;
    await executeQuery(
      query, 
      [score_name, score_url || null, id],
      res,
      'อัปเดตข้อมูลเรียบร้อยแล้ว'
    );
  } catch (err) {
    console.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูล:', err.message);
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).send('มีข้อมูลในระบบแล้ว');
    } else {
      res.status(500).send('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    }
  }
});

// Delete flowchart
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const query = 'DELETE FROM Score WHERE score_id = ?';
    await executeQuery(query, [id], res, 'ลบข้อมูลเรียบร้อยแล้ว');
  } catch (err) {
    console.error('เกิดข้อผิดพลาดในการลบข้อมูล:', err.message);
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      res.status(400).send('ไม่สามารถลบได้เนื่องจากมีการใช้งานอยู่');
    } else {
      res.status(500).send('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  }
});

module.exports = router;
