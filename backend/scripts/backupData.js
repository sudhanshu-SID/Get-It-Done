const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Task = require('../models/Task');
const Project = require('../models/Project');
const Goal = require('../models/Goal');
const Reward = require('../models/Reward');
const Strike = require('../models/Strike');
const Consequence = require('../models/Consequence');
const ActiveTimer = require('../models/ActiveTimer');
const TaskSession = require('../models/TaskSession');
const UserSettings = require('../models/UserSettings');
const DailyRecord = require('../models/DailyRecord');
const Gamification = require('../models/Gamification');
const AccountabilityLog = require('../models/AccountabilityLog');
const Note = require('../models/Note');

async function backup() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('ERROR: MONGO_URI not found in backend/.env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(mongoUri);
  console.log('Connected successfully.');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '../backups', `pre-auth-${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });

  const collections = [
    { name: 'tasks', model: Task },
    { name: 'projects', model: Project },
    { name: 'goals', model: Goal },
    { name: 'rewards', model: Reward },
    { name: 'strikes', model: Strike },
    { name: 'consequences', model: Consequence },
    { name: 'active_timers', model: ActiveTimer },
    { name: 'task_sessions', model: TaskSession },
    { name: 'user_settings', model: UserSettings },
    { name: 'daily_records', model: DailyRecord },
    { name: 'gamification', model: Gamification },
    { name: 'accountability_logs', model: AccountabilityLog },
    { name: 'notes', model: Note }
  ];

  const summary = {};

  for (const { name, model } of collections) {
    try {
      const docs = await model.find({}).lean();
      const filePath = path.join(backupDir, `${name}.json`);
      fs.writeFileSync(filePath, JSON.stringify(docs, null, 2));
      summary[name] = docs.length;
      console.log(`✓ Backed up ${docs.length} records from ${name} -> ${filePath}`);
    } catch (err) {
      console.error(`✕ Error backing up ${name}:`, err.message);
    }
  }

  const manifestPath = path.join(backupDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    counts: summary
  }, null, 2));

  console.log('\n======================================');
  console.log('BACKUP COMPLETE! Manifest:');
  console.log(JSON.stringify(summary, null, 2));
  console.log(`Saved in: ${backupDir}`);
  console.log('======================================\n');

  await mongoose.disconnect();
}

backup().catch((err) => {
  console.error('Backup failed:', err);
  process.exit(1);
});
