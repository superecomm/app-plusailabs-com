"use client";

import { useState, useEffect } from "react";
import { Folder } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export function VaultTab() {
  const { currentUser } = useAuth();
  const [storage, setStorage] = useState({ usedGB: "0.0", quotaGB: "5.0", percentUsed: "0.0" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    
    const fetchStorage = async () => {
      try {
        const response = await fetch(`/api/vault/storage?userId=${currentUser.uid}`);
        if (response.ok) {
          const data = await response.json();
          setStorage(data);
        }
      } catch (error) {
        console.error("Error fetching storage:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStorage();
  }, [currentUser]);

  return (
    <div className="p-4 space-y-3 max-w-4xl mx-auto">
      {/* Storage Bar - compact, real data */}
      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Storage</span>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {loading ? "..." : `${storage.usedGB} / ${storage.quotaGB} GB`}
          </span>
        </div>
        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 rounded-full transition-all"
            style={{ width: loading ? '0%' : `${storage.percentUsed}%` }}
          />
        </div>
      </div>
      
      {/* Vault Folders - real data */}
      <VaultFoldersList />
      
      {/* CTA - compact */}
      <Link
        href="/cloud"
        className="block w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-center text-sm font-medium rounded-md transition-colors"
      >
        Open Cloud →
      </Link>
    </div>
  );
}

function VaultFoldersList() {
  const { currentUser } = useAuth();
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const fetchFolders = async () => {
      try {
        const response = await fetch(`/api/vault/folders?userId=${currentUser.uid}`);
        if (response.ok) {
          const data = await response.json();
          setFolders(data.folders || []);
        }
      } catch (error) {
        console.error("Error fetching folders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFolders();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="space-y-1.5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse" />
        ))}
      </div>
    );
  }

  if (folders.length === 0) {
    return (
      <div className="p-3 text-center text-xs text-gray-500 dark:text-gray-400">
        No folders yet
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {folders.map((folder) => (
        <FolderCard key={folder.id} name={folder.name} />
      ))}
    </div>
  );
}

interface FolderCardProps {
  name: string;
}

function FolderCard({ name }: FolderCardProps) {
  return (
    <Link
      href="/cloud"
      className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
    >
      <Folder className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{name}</p>
      </div>
    </Link>
  );
}

