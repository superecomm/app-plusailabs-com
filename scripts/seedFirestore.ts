import fs from 'fs';
import path from 'path';
import { Timestamp } from 'firebase-admin/firestore';

// Load .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log('Loading .env.local...');
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      let key = match[1].trim();
      let value = match[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      // Don't expand \n here because admin.ts does it
      if (!process.env[key]) {
         process.env[key] = value;
      }
    }
  });
} else {
    console.warn('Warning: .env.local not found. Relying on existing environment variables.');
}

// Import after env vars are set
import { getAdminFirestore } from '../lib/firebase/admin';

const SEED_USER_ID = 'seed-user-001';
const SEED_EMAIL = 'seed@superplus.ai';

async function seed() {
  console.log('🌱 Starting Firestore seed...');
  
  try {
    const db = getAdminFirestore();
    const batch = db.batch();

    // 1. Create User
    const userRef = db.collection('users').doc(SEED_USER_ID);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      batch.set(userRef, {
          email: SEED_EMAIL,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          displayName: 'Seed User',
          isEmailVerified: true,
          photoURL: null,
      });
      console.log(`Queued creation for user: ${SEED_USER_ID}`);
    } else {
      console.log(`User ${SEED_USER_ID} already exists`);
    }

    // 2. User Preferences
    const prefsRef = db.collection('preferences').doc(`pref_${SEED_USER_ID}`);
    const prefsDoc = await prefsRef.get();
    if (!prefsDoc.exists) {
        batch.set(prefsRef, {
            userId: SEED_USER_ID,
            theme: 'dark',
            notificationsEnabled: true,
            language: 'en-US',
            autoPlayAudio: true,
            transcriptionEnabled: true,
            defaultModel: 'gpt-4o',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        console.log(`Queued preferences for user: ${SEED_USER_ID}`);
    }

    // 3. Device
    const deviceId = 'device_seed_01';
    const deviceRef = db.collection('devices').doc(deviceId);
    const deviceDoc = await deviceRef.get();
    if (!deviceDoc.exists) {
        batch.set(deviceRef, {
            userId: SEED_USER_ID,
            deviceId: deviceId,
            name: 'Seed iPhone 15',
            type: 'mobile',
            lastActiveAt: Timestamp.now(),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        console.log(`Queued device: ${deviceId}`);
    }

    // 4. Conversation
    const convoId = 'convo_seed_01';
    const convoRef = db.collection('conversations').doc(convoId);
    const convoDoc = await convoRef.get();
    if (!convoDoc.exists) {
        batch.set(convoRef, {
            userId: SEED_USER_ID,
            title: 'Welcome to Super Plus AI',
            modelId: 'gpt-4o',
            lastMessageAt: Timestamp.now(),
            messageCount: 2,
            isArchived: false,
            isPinned: true,
            hasAudio: false,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        console.log(`Queued conversation: ${convoId}`);
        
        // Messages
        const msg1Ref = convoRef.collection('messages').doc();
        batch.set(msg1Ref, {
            conversationId: convoId,
            userId: 'system',
            role: 'assistant',
            content: 'Welcome! I am Super Plus AI. How can I help you today?',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });

        const msg2Ref = convoRef.collection('messages').doc();
        batch.set(msg2Ref, {
            conversationId: convoId,
            userId: SEED_USER_ID,
            role: 'user',
            content: 'Hello! Tell me about your security features.',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
    }

    // 5. Voice Lock Profile
    const vlProfileRef = userRef.collection('voiceLockProfile').doc('profile');
    const vlProfileDoc = await vlProfileRef.get();
    if (!vlProfileDoc.exists) {
        batch.set(vlProfileRef, {
            voiceLockId: 'vl_seed_001',
            status: 'mobile_enrolled',
            mobileSamples: 5,
            studioSamples: 0,
            studioVerified: false,
            datasetCompletion: 50,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        console.log(`Queued VoiceLock profile for user: ${SEED_USER_ID}`);
    }

    // 6. Voice Lock Dataset
    const datasetId = 'dataset_seed_001';
    const datasetRef = userRef.collection('voice_datasets').doc(datasetId);
    const datasetDoc = await datasetRef.get();
    if (!datasetDoc.exists) {
        batch.set(datasetRef, {
            userId: SEED_USER_ID,
            datasetId: datasetId,
            name: 'Seed Dataset',
            status: 'mobile_enrolled',
            mobileSamples: 5,
            studioSamples: 0,
            studioVerified: false,
            datasetCompletion: 50,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            isActive: true
        });
        console.log(`Queued VoiceLock dataset: ${datasetId}`);
    }

    await batch.commit();
    console.log('✅ Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
