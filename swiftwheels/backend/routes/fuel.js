const express = require('express');
const router = express.Router();
const Fuel = require('../models/Fuel');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const records = await Fuel.find()
      .populate('vehicle', 'plateNumber make model')
      .populate('driver', 'name')
      .sort({ date: -1 });
    res.json(records);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const record = await Fuel.create(req.body);
    res.status(201).json(record);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const record = await Fuel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(record);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await Fuel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Record removed' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
