"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGate } from "@/components/AuthGate";
import { ArrowLeft, Package, Video, Image, FileText, Zap } from "lucide-react";
import Link from "next/link";
import type { ContentType } from "@/types/content";
import { ProductCardEditor } from "@/components/create/ProductCardEditor";

export default function CreatePage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [selectedType, setSelectedType] = useState<ContentType | null>(null);

  return (
    <AuthGate>
      <div className="min-h-screen bg-white dark:bg-black">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3 max-w-2xl mx-auto">
            <Link
              href="/profile"
              className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-900 rounded transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold">Create Post</h1>
          </div>
        </div>

        {/* Type Selector */}
        {!selectedType ? (
          <div className="p-6 max-w-2xl mx-auto">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              What would you like to create?
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <TypeOption
                type="product"
                icon={Package}
                title="Product Card"
                description="Sell something"
                onClick={() => setSelectedType('product')}
              />
              
              <TypeOption
                type="video"
                icon={Video}
                title="Video Post"
                description="Share a video"
                onClick={() => setSelectedType('video')}
              />
              
              <TypeOption
                type="gallery"
                icon={Image}
                title="Image Gallery"
                description="Photo collection"
                onClick={() => setSelectedType('gallery')}
              />
              
              <TypeOption
                type="text"
                icon={FileText}
                title="Text Post"
                description="Share thoughts"
                onClick={() => setSelectedType('text')}
              />
              
              <TypeOption
                type="drop"
                icon={Zap}
                title="Limited Drop"
                description="Timed release"
                onClick={() => setSelectedType('drop')}
                badge="Soon"
              />
            </div>
          </div>
        ) : (
          <div className="p-6 max-w-2xl mx-auto">
            <button
              onClick={() => setSelectedType(null)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4"
            >
              ← Change type
            </button>
            
            {/* Dynamic Editor */}
            {selectedType === 'product' && <ProductCardEditor />}
            {selectedType === 'video' && (
              <div className="text-center text-gray-500 py-12">
                Video editor coming soon...
              </div>
            )}
            {selectedType === 'gallery' && (
              <div className="text-center text-gray-500 py-12">
                Gallery editor coming soon...
              </div>
            )}
            {selectedType === 'text' && (
              <div className="text-center text-gray-500 py-12">
                Text editor coming soon...
              </div>
            )}
          </div>
        )}
      </div>
    </AuthGate>
  );
}

interface TypeOptionProps {
  type: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onClick: () => void;
  badge?: string;
}

function TypeOption({ icon: Icon, title, description, onClick, badge }: TypeOptionProps) {
  return (
    <button
      onClick={onClick}
      disabled={!!badge}
      className="p-6 border-2 border-gray-200 dark:border-gray-800 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 dark:disabled:hover:border-gray-800"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        {badge && (
          <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-800 text-xs font-medium rounded">
            {badge}
          </span>
        )}
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </button>
  );
}

