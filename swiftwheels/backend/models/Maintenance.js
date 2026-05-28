const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  type: { type: String, enum: ['service', 'repair', 'inspection', 'tire', 'oil_change', 'other'], required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['scheduled', 'in_progress', 'completed', 'cancelled'], default: 'scheduled' },
  scheduledDate: { type: Date, required: true },
  completedDate: { type: Date },
  cost: { type: Number, default: 0 },
  mechanic: { type: String },
  garage: { type: String },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Maintenance', maintenanceSchema);
