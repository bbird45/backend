require('dotenv').config(); // โหลดตัวแปรสิ่งแวดล้อมจากไฟล์ .env
const express = require('express');
const cors = require('cors');
const flowchartRoutes = require('./routes/flowchart'); // แก้ไขเส้นทาง
const PseudocodeRoutes = require('./routes/Pseudocode');
const QuizRoutes = require('./routes/Quiz');
const ScoreRoutes = require('./routes/Score');
const training_phrases = require('./routes/training_phrases');
const intents = require('./routes/intents');
const adminRoutes = require('./routes/admin');
const loginRoutes = require('./routes/login');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/flowchart', flowchartRoutes);
app.use('/api/Pseudocode', PseudocodeRoutes);
app.use('/api/Quiz', QuizRoutes);
app.use('/api/Score', ScoreRoutes);
app.use('/api/training_phrases',training_phrases );
app.use('/api/intents',intents );
app.use('/api/admin', adminRoutes);
app.use('/api/login', loginRoutes);

app.listen(port, () => {
  console.log(`เซิร์ฟเวอร์กำลังทำงานที่ http://localhost:${port}`);
});
