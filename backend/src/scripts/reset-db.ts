import 'dotenv/config';
import mongoose from 'mongoose';
import { runSeed } from '../services/seed.service';

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aqua_flow';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB\n');

  await runSeed({ wipe: true });

  console.log('Database reset complete.\n');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
