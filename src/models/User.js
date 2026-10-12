import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, toJSON: { transform(_doc, ret) { delete ret.password; delete ret.__v; return ret; } } });
export default mongoose.model('User', schema);
