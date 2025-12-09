import { randomUUID } from "crypto";
import { getAdminApp, getAdminFirestore } from "@/lib/firebase/admin";
import { getStorage } from "firebase-admin/storage";
import { Timestamp } from "firebase-admin/firestore";

type VoiceLockProfile = {
  userId: string;
  status: "ready" | "pending" | "empty";
  activeDatasetId: string | null;
  sampleCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

type VoiceLockDataset = {
  datasetId: string;
  userId: string;
  name: string;
  status: "active" | "training" | "ready" | "error";
  sampleCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

type VoiceLockSample = {
  sampleId: string;
  datasetId: string;
  userId: string;
  gcsPath: string;
  durationMs?: number | null;
  createdAt: Timestamp;
};

const firestore = getAdminFirestore();
const storage = getStorage(getAdminApp()).bucket();

const profileRef = (userId: string) => firestore.collection("voiceLockProfiles").doc(userId);
const datasetRef = (datasetId: string) => firestore.collection("voiceLockDatasets").doc(datasetId);
const sampleRef = (sampleId: string) => firestore.collection("voiceLockSamples").doc(sampleId);

export async function getProfile(userId: string): Promise<VoiceLockProfile | null> {
  const snap = await profileRef(userId).get();
  return snap.exists ? (snap.data() as VoiceLockProfile) : null;
}

export async function ensureProfile(userId: string): Promise<VoiceLockProfile> {
  const ref = profileRef(userId);
  const snap = await ref.get();
  const now = Timestamp.now();
  if (snap.exists) {
    return snap.data() as VoiceLockProfile;
  }
  const profile: VoiceLockProfile = {
    userId,
    status: "empty",
    activeDatasetId: null,
    sampleCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  await ref.set(profile);
  return profile;
}

export async function listDatasets(userId: string): Promise<VoiceLockDataset[]> {
  const snap = await firestore
    .collection("voiceLockDatasets")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();
  return snap.docs.map((d) => ({ ...(d.data() as VoiceLockDataset), datasetId: d.id }));
}

export async function getActiveDataset(userId: string): Promise<VoiceLockDataset | null> {
  const profile = await ensureProfile(userId);
  if (!profile.activeDatasetId) return null;
  const snap = await datasetRef(profile.activeDatasetId).get();
  return snap.exists ? (snap.data() as VoiceLockDataset) : null;
}

export async function createDataset(userId: string, name?: string): Promise<VoiceLockDataset> {
  const id = randomUUID();
  const now = Timestamp.now();
  const dataset: VoiceLockDataset = {
    datasetId: id,
    userId,
    name: name || "Default",
    status: "ready",
    sampleCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  await datasetRef(id).set(dataset);
  // If no active dataset, set this one
  await firestore.runTransaction(async (tx) => {
    const pref = profileRef(userId);
    const psnap = await tx.get(pref);
    if (!psnap.exists || !(psnap.data() as VoiceLockProfile).activeDatasetId) {
      tx.set(
        pref,
        {
          userId,
          activeDatasetId: id,
          status: "ready",
          sampleCount: (psnap.data()?.sampleCount as number | undefined) ?? 0,
          createdAt: psnap.exists ? psnap.data()?.createdAt ?? now : now,
          updatedAt: now,
        },
        { merge: true }
      );
    }
  });
  return dataset;
}

export async function setActiveDataset(userId: string, datasetId: string) {
  const pref = profileRef(userId);
  await pref.set(
    {
      userId,
      activeDatasetId: datasetId,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
}

export async function saveSessionSample(params: {
  userId: string;
  audio: File;
  source?: string;
  vocalType?: string;
}) {
  const { userId, audio } = params;
  if (!audio) throw new Error("Audio blob is required");

  const active = (await getActiveDataset(userId)) ?? (await createDataset(userId, "Default"));
  const datasetId = active.datasetId;
  const sampleId = randomUUID();
  const gcsPath = `voice-lock/${userId}/${datasetId}/${sampleId}.webm`;

  const arrayBuffer = await audio.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await storage.file(gcsPath).save(buffer, {
    contentType: audio.type || "audio/webm",
    resumable: false,
  });

  const now = Timestamp.now();
  const sample: VoiceLockSample = {
    sampleId,
    datasetId,
    userId,
    gcsPath,
    createdAt: now,
  };

  await firestore.runTransaction(async (tx) => {
    tx.set(sampleRef(sampleId), sample);
    tx.update(datasetRef(datasetId), {
      sampleCount: (active.sampleCount ?? 0) + 1,
      updatedAt: now,
    });
    tx.set(
      profileRef(userId),
      {
        userId,
        activeDatasetId: datasetId,
        sampleCount: (active.sampleCount ?? 0) + 1,
        status: "ready",
        updatedAt: now,
      },
      { merge: true }
    );
  });

  const profileSnap = await profileRef(userId).get();
  const datasetSnap = await datasetRef(datasetId).get();
  return {
    profile: profileSnap.data() as VoiceLockProfile,
    dataset: datasetSnap.data() as VoiceLockDataset,
  };
}

