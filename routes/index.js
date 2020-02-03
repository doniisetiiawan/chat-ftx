const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.send('Socket.io chat application');
});

module.exports = router;
