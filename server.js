'use strict';
require('dotenv').config();

const app    = require('./app');
const connectDB = require('./config/db');
const { PORT } = require('./config/env');

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`\n🖤  AURA API  ·  ${process.env.NODE_ENV?.toUpperCase()} mode`);
    console.log(`🚀  Listening on http://localhost:${PORT}\n`);
  });
};

start();