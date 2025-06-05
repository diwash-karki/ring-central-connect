import mongoose from 'mongoose';

const missedCallSchema = new mongoose.Schema({
  callid: String,
  caller_phone: String,
  recipient_phone: String,
  recipient_name: String,
  call_direction: String,
  call_end_date: String,
  call_end_time: String,
  account_id: String,
  extension_id: String,
  first_name: String,
  email: String,
  extension_number: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const MissedCall = mongoose.models.MissedCall || mongoose.model('MissedCall', missedCallSchema);

export default MissedCall; 