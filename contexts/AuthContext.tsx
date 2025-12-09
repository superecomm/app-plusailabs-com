"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, setPersistence, browserSessionPersistence } from "firebase/auth";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { UserProfile, UserPreferences, UserSubscription } from "@/lib/data/types";
import { Timestamp } from "firebase/firestore";

type AuthContextType = {
  currentUser: User | null;
  userProfile: UserProfile | null;
  userPreferences: UserPreferences | null;
  userSubscription: UserSubscription | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    // Set persistence to session - user will be logged out when tab/window is closed
    setPersistence(auth, browserSessionPersistence).catch((error) => {
      console.error("Error setting auth persistence:", error);
    });

    let unsubscribeProfile: (() => void) | undefined;
    let unsubscribePrefs: (() => void) | undefined;
    let unsubscribeSubscription: (() => void) | undefined;

    const handleSnapshotError = (error: any) => {
      console.error("Firestore listener error", error);
      // Gracefully recover from permission errors so the app doesn't crash
      if (error?.code === "permission-denied") {
        setUserProfile(null);
        setUserPreferences(null);
        setUserSubscription(null);
      }
    };

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      // Reset state if no user
      if (!user) {
        setUserProfile(null);
        setUserPreferences(null);
        if (unsubscribeProfile) unsubscribeProfile();
        if (unsubscribePrefs) unsubscribePrefs();
        if (unsubscribeSubscription) unsubscribeSubscription();
        setLoading(false);
        return;
      }

      if (db) {
        // Capture db in a local variable to ensure type safety in closures
        const firestore = db;
        
        // Subscribe to User Profile
        unsubscribeProfile = onSnapshot(
          doc(firestore, "users", user.uid),
          (snapshot) => {
            if (snapshot.exists()) {
              setUserProfile(snapshot.data() as UserProfile);
            } else {
              // Create default profile if missing (first login)
              const newProfile: UserProfile = {
                userId: user.uid,
                email: user.email || "",
                displayName: user.displayName || "",
                photoURL: user.photoURL || "",
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
              };
              setDoc(doc(firestore, "users", user.uid), newProfile).catch(console.error);
            }
          },
          handleSnapshotError
        );

        // Subscribe to Preferences
        unsubscribePrefs = onSnapshot(
          doc(firestore, "preferences", `pref_${user.uid}`),
          (snapshot) => {
            if (snapshot.exists()) {
              setUserPreferences(snapshot.data() as UserPreferences);
            } else {
               // Create default preferences
               const newPrefs: UserPreferences = {
                  userId: user.uid,
                  theme: "system",
                  notificationsEnabled: true,
                  language: "en-US",
                  autoPlayAudio: true,
                  transcriptionEnabled: true,
                  defaultModel: "gpt-4o",
                  createdAt: Timestamp.now(),
                  updatedAt: Timestamp.now()
               };
               setDoc(doc(firestore, "preferences", `pref_${user.uid}`), newPrefs).catch(console.error);
            }
          },
          handleSnapshotError
        );

        // Subscribe to subscription (do not auto-create; handled by plan flow)
        unsubscribeSubscription = onSnapshot(
          doc(firestore, "subscriptions", user.uid),
          (snapshot) => {
            if (snapshot.exists()) {
              setUserSubscription(snapshot.data() as UserSubscription);
            } else {
              setUserSubscription(null);
            }
          },
          handleSnapshotError
        );
      }
      
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribePrefs) unsubscribePrefs();
      if (unsubscribeSubscription) unsubscribeSubscription();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase Auth not initialized");
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase Auth not initialized");
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    if (!auth) throw new Error("Firebase Auth not initialized");
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const value = {
    currentUser,
    userProfile,
    userPreferences,
    userSubscription,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
