import mongoose from 'mongoose';

export async function connectDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aqua_flow';
  await mongoose.connect(uri);
  console.log('MongoDB connected');
}
