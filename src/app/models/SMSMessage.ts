import mongoose from 'mongoose';

const smsMessageSchema = new mongoose.Schema({
  sender_phone: String,
  sender_name: String,
  recipient_phone: String,
  message: String,
  received_date: String,
  received_time: String,
  account_id: String,
  extension_id: String,
  first_name: String,
  email: String,
  extension_number: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const SMSMessage = mongoose.models.SMSMessage || mongoose.model('SMSMessage', smsMessageSchema);

export default SMSMessage; 