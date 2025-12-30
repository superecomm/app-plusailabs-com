"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Upload, Sparkles, Tag as TagIcon } from "lucide-react";
import { uploadVideo } from "@/lib/media/videoUpload";
import { nanoid } from "nanoid";

export function ProductCardEditor() {
  const router = useRouter();
  const { currentUser } = useAuth();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [compareAt, setCompareAt] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<'affiliate' | 'digital' | 'drop'>('affiliate');
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<any[]>([]);
  const [posting, setPosting] = useState(false);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setUploading(true);
    try {
      const result = await uploadVideo(file, currentUser.uid);
      setUploadedMedia(prev => [...prev, {
        type: 'video',
        url: result.url,
        thumbnail: result.thumbnail,
        duration: result.duration,
      }]);
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !currentUser) return;

    setUploading(true);
    try {
      const { ref: storageRef, uploadBytes: upload, getDownloadURL: getURL } = await import("firebase/storage");
      const { storage } = await import("@/lib/firebase/client");

      for (const file of files) {
        const imageRef = storageRef(storage!, `content/${currentUser.uid}/images/${Date.now()}_${file.name}`);
        await upload(imageRef, file);
        const url = await getURL(imageRef);
        
        setUploadedMedia(prev => [...prev, {
          type: 'image',
          url,
        }]);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handlePost = async () => {
    if (!currentUser || !title || !price) return;

    setPosting(true);
    try {
      const idToken = await currentUser.getIdToken();
      
      await fetch('/api/content/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          title,
          body: description,
          tags,
          media: uploadedMedia.length > 0 ? { items: uploadedMedia } : undefined,
          product: {
            price: parseFloat(price),
            currency: 'USD',
            compareAt: compareAt ? parseFloat(compareAt) : undefined,
            affiliate: deliveryMethod === 'affiliate' ? {
              url: affiliateUrl,
              commission: 5,
              network: 'custom',
            } : undefined,
            seller: {
              userId: currentUser.uid,
              handle: currentUser.email?.split('@')[0] || 'user',
              displayName: currentUser.displayName || 'User',
            },
          },
          aiContext: {
            category: tags[0] || 'general',
            searchKeywords: [title, ...tags],
          },
          type: 'product',
          visibility: 'public',
        }),
      });

      router.push('/profile');
    } catch (error) {
      console.error('Error posting product:', error);
      alert('Failed to post product');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Media Upload */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Media
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer text-center">
            <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Upload Video</p>
            <p className="text-xs text-gray-500 mt-1">Product demo</p>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
          
          <label className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer text-center">
            <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Upload Images</p>
            <p className="text-xs text-gray-500 mt-1">Up to 5 photos</p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
        
        {/* Uploaded Media Preview */}
        {uploadedMedia.length > 0 && (
          <div className="mt-3 grid grid-cols-4 gap-2">
            {uploadedMedia.map((item, i) => (
              <div key={i} className="relative aspect-square bg-gray-100 dark:bg-gray-900 rounded overflow-hidden">
                {item.type === 'video' ? (
                  <img src={item.thumbnail} alt="Video thumbnail" className="w-full h-full object-cover" />
                ) : (
                  <img src={item.url} alt="Product" className="w-full h-full object-cover" />
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Basic Info */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Product Details
        </h3>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Product title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </section>

      {/* Pricing */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Pricing
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Price ($)
            </label>
            <input
              type="number"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Compare at ($) <span className="text-gray-500">optional</span>
            </label>
            <input
              type="number"
              placeholder="0.00"
              value={compareAt}
              onChange={(e) => setCompareAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </section>

      {/* Tags */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Tags
        </h3>
        <div className="flex gap-2 mb-2 flex-wrap">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-sm rounded flex items-center gap-1"
            >
              #{tag}
              <button
                onClick={() => setTags(tags.filter(t => t !== tag))}
                className="hover:text-blue-900 dark:hover:text-blue-100"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add tag..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            onClick={handleAddTag}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            <TagIcon className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Delivery Method */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          How will buyers get this?
        </h3>
        <div className="space-y-2">
          <label className="flex items-start gap-3 p-3 border border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
            <input
              type="radio"
              checked={deliveryMethod === 'affiliate'}
              onChange={() => setDeliveryMethod('affiliate')}
              className="mt-1"
            />
            <div className="flex-1">
              <p className="font-medium text-sm">Affiliate Link</p>
              <p className="text-xs text-gray-500">Link to Amazon or other store</p>
              {deliveryMethod === 'affiliate' && (
                <input
                  type="url"
                  placeholder="https://amazon.com/product..."
                  value={affiliateUrl}
                  onChange={(e) => setAffiliateUrl(e.target.value)}
                  className="mt-2 w-full px-2 py-1 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-sm"
                />
              )}
            </div>
          </label>
          
          <label className="flex items-start gap-3 p-3 border border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 opacity-50">
            <input type="radio" disabled className="mt-1" />
            <div>
              <p className="font-medium text-sm">Digital Download</p>
              <p className="text-xs text-gray-500">Upload files • Coming soon</p>
            </div>
          </label>
        </div>
      </section>

      {/* Actions */}
      <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={() => router.back()}
          className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handlePost}
          disabled={!title || !price || posting}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors font-semibold"
        >
          {posting ? 'Posting...' : 'Post Product'}
        </button>
      </div>
    </div>
  );
}

