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
      Pseudo_id,
      Pseudo_name,
      Pseudo_description,
      Pseudo_URL
    FROM Pseudocode
  `;
  await executeQuery(query, [], res);
});

router.post('/', async (req, res) => {
  const { Pseudo_name, Pseudo_description, Pseudo_URL } = req.body;

  if (!Pseudo_name || !Pseudo_description || !Pseudo_URL) {
    return res.status(400).send('กรุณาระบุหัวข้อ ข้อมูลและลิงก์');
  }

  try {
    const [maxIdResult] = await pool.query('SELECT MAX(Pseudo_id) as max_id FROM Pseudocode');
    const nextId = (maxIdResult[0].max_id || 0) + 1;

    const query = `
      INSERT INTO Pseudocode (Pseudo_id, Pseudo_name, Pseudo_description, Pseudo_URL) 
      VALUES (?, ?, ?, ?)
    `;
    await pool.query(query, [nextId, Pseudo_name, Pseudo_description, Pseudo_URL || null]);
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
  const { Pseudo_name, Pseudo_description, Pseudo_URL } = req.body;

  if (!Pseudo_name || !Pseudo_description || !Pseudo_URL) {
    return res.status(400).send('กรุณาระบุหัวข้อ ข้อมูลและลิงก์');
  }

  try {
    const [PseudocodeCheck] = await pool.query(
      'SELECT Pseudo_id FROM Pseudocode WHERE Pseudo_id = ?',
      [id]
    );
    if (PseudocodeCheck.length === 0) {
      return res.status(404).send('ไม่พบข้อมูล');
    }

    const query = `
      UPDATE Pseudocode 
      SET Pseudo_name = ?, Pseudo_description = ?, Pseudo_URL = ?
      WHERE Pseudo_id = ?
    `;
    await executeQuery(
      query, 
      [Pseudo_name, Pseudo_description, Pseudo_URL || null, id],
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
    const query = 'DELETE FROM Pseudocode WHERE Pseudo_id = ?';
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
