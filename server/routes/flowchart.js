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
      flow_id,
      flow_name,
      flow_description,
      flow_url
    FROM flowchart
  `;
  await executeQuery(query, [], res);
});

router.post('/', async (req, res) => {
  const { flow_name, flow_description, flow_url } = req.body;

  if (!flow_name || !flow_description || !flow_url) {
    return res.status(400).send('กรุณาระบุหัวข้อ ข้อมูลและลิงก์');
  }

  try {
    const [maxIdResult] = await pool.query('SELECT MAX(flow_id) as max_id FROM flowchart');
    const nextId = (maxIdResult[0].max_id || 0) + 1;

    const query = `
      INSERT INTO flowchart (flow_id, flow_name, flow_description, flow_url) 
      VALUES (?, ?, ?, ?)
    `;
    await pool.query(query, [nextId, flow_name, flow_description, flow_url || null]);
    res.status(201).send('เพิ่มข้อมูลเรียบร้อยแล้ว');
  } catch (err) {
    console.error('เกิดข้อผิดพลาดในการเพิ่มข้อมูล:', err.message);
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).send('มีข้อมูลนี้ในระบบแล้ว');
    } else {
      res.status(500).send('เกิดข้อผิดพลาดในการเพิ่มข้อมูล');
    }
  }
});


router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { flow_name, flow_description, flow_url } = req.body;

  if (!flow_name || !flow_description || !flow_url) {
    return res.status(400).send('กรุณาระบุหัวข้อ ข้อมูลและลิงก์');
  }

  try {
    // ตรวจสอบว่ามีข้อมูลอยู่หรือไม่
    const [flowchartCheck] = await pool.query(
      'SELECT flow_id FROM flowchart WHERE flow_id = ?',
      [id]
    );
    if (flowchartCheck.length === 0) {
      return res.status(404).send('ไม่พบข้อมูล');
    }

    const query = `
      UPDATE flowchart 
      SET flow_name = ?, flow_description = ?, flow_url = ?
      WHERE flow_id = ?
    `;
    await executeQuery(
      query, 
      [flow_name, flow_description, flow_url || null, id],
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

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const query = 'DELETE FROM flowchart WHERE flow_id = ?';
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
