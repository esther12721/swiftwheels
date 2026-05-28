const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');

// 1. GET ALL TRIPS (With populated deep objects)
router.get('/', async (req, res) => {
  try {
    const trips = await Trip.find()
      .populate('vehicleId', 'plateNumber make model type')
      .populate('driverId', 'name licenseNumber status')
      .sort({ startDate: -1 });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. CREATE NEW RELATIONAL TRIP ENTRY
router.post('/', async (req, res) => {
  const trip = new Trip({
    tripNumber: req.body.tripNumber,
    vehicleId: req.body.vehicleId,
    driverId: req.body.driverId,
    origin: req.body.origin,
    destination: req.body.destination,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    status: req.body.status,
    notes: req.body.notes
  });

  try {
    const newTrip = await trip.save();
    // Re-populate data before returning response to match table layout state
    const populatedTrip = await Trip.findById(newTrip._id)
      .populate('vehicleId', 'plateNumber make model type')
      .populate('driverId', 'name licenseNumber status');
    res.status(201).json(populatedTrip);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 3. UPDATE TRIP DETAILS / STATUS MODIFICATIONS
router.put('/:id', async (req, res) => {
  try {
    const updatedTrip = await Trip.findByIdAndUpdate(
      req.id || req.params.id,
      { $set: req.body },
      { new: true }
    )
    .populate('vehicleId', 'plateNumber make model type')
    .populate('driverId', 'name licenseNumber status');
    
    if (!updatedTrip) return res.status(404).json({ message: 'Trip log not found' });
    res.json(updatedTrip);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 4. DELETE TRIP ENTRY RECORD
router.delete('/:id', async (req, res) => {
  try {
    const trip = await Trip.findByIdAndDelete(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip row entry not found' });
    res.json({ message: 'Trip record purged successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;