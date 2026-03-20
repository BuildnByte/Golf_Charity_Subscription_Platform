const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const scoreRoutes = require('./src/routes/scores');
const charityRoutes = require('./src/routes/charities');
const adminRoutes = require('./src/routes/admin');
const winnerRoutes = require('./src/routes/winners');
const paymentRoutes = require('./src/routes/payment');
const userRoutes = require('./src/routes/user');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/scores', scoreRoutes);
app.use('/charities', charityRoutes);
app.use('/admin', adminRoutes);
app.use('/winners', winnerRoutes);
app.use('/payment', paymentRoutes);
app.use('/user', userRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
