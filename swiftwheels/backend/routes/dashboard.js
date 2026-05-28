const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const Fuel = require('../models/Fuel');
const Maintenance = require('../models/Maintenance');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/stats', async (req, res) => {
  try {
    const [totalVehicles, totalDrivers, totalTrips, fuelRecords, maintenanceRecords] = await Promise.all([
      Vehicle.countDocuments(),
      Driver.countDocuments(),
      Trip.countDocuments(),
      Fuel.find(),
      Maintenance.find({ status: 'scheduled' })
    ]);

    const totalFuelCost = fuelRecords.reduce((sum, r) => sum + (r.totalCost || 0), 0);
    const activeTrips = await Trip.countDocuments({ status: 'in_progress' });
    const vehiclesInMaintenance = await Vehicle.countDocuments({ status: 'maintenance' });
    const availableVehicles = await Vehicle.countDocuments({ status: 'available' });

    const recentTrips = await Trip.find()
      .populate('vehicle', 'plateNumber make')
      .populate('driver', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalVehicles,
      totalDrivers,
      totalTrips,
      activeTrips,
      totalFuelCost,
      vehiclesInMaintenance,
      availableVehicles,
      scheduledMaintenance: maintenanceRecords.length,
      recentTrips
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
