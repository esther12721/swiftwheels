const mongoose = require('mongoose');

const fuelSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  date: { type: Date, required: true, default: Date.now },
  liters: { type: Number, required: true },
  pricePerLiter: { type: Number, required: true },
  totalCost: { type: Number },
  odometer: { type: Number },
  station: { type: String },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

fuelSchema.pre('save', function (next) {
  this.totalCost = this.liters * this.pricePerLiter;
  next();
});

module.exports = mongoose.model('Fuel', fuelSchema);
