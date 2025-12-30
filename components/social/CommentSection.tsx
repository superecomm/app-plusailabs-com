"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { MessageCircle, Plus, Minus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Comment } from "@/types/comments";

interface CommentSectionProps {
  contentId: string;
  contentType: 'product' | 'post' | 'video';
}

export function CommentSection({ contentId, contentType }: CommentSectionProps) {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [selectedVibe, setSelectedVibe] = useState<'+' | '-' | null>(null);
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [contentId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments?contentId=${contentId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!currentUser || !commentText.trim()) return;

    setPosting(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          userId: currentUser.uid,
          userHandle: currentUser.email?.split('@')[0],
          userDisplayName: currentUser.displayName || 'User',
          userPhoto: currentUser.photoURL,
          text: commentText,
          vibe: contentType === 'product' ? selectedVibe : undefined,
        }),
      });

      if (response.ok) {
        setCommentText("");
        setSelectedVibe(null);
        fetchComments();
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setPosting(false);
    }
  };

  const handleVibe = async (commentId: string, vibe: '+' | '-') => {
    if (!currentUser) return;

    try {
      await fetch('/api/comments/vibe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId,
          contentId,
          userId: currentUser.uid,
          vibe,
        }),
      });

      fetchComments();
    } catch (error) {
      console.error('Error vibing comment:', error);
    }
  };

  return (
    <div className="mt-4 border-t border-gray-200 dark:border-gray-800 pt-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
          {contentType === 'product' ? 'Reviews' : 'Comments'} ({comments.length})
        </h4>
      </div>

      {/* Comment input */}
      <div className="mb-4">
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={contentType === 'product' ? "Write a review..." : "Add a comment..."}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={2}
        />
        
        <div className="flex items-center justify-between mt-2">
          {/* Vibe selector (for products) */}
          {contentType === 'product' && (
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedVibe(selectedVibe === '+' ? null : '+')}
                className={`px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors ${
                  selectedVibe === '+'
                    ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700'
                }`}
              >
                <Plus className="w-3 h-3" />
                Positive
              </button>
              
              <button
                onClick={() => setSelectedVibe(selectedVibe === '-' ? null : '-')}
                className={`px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors ${
                  selectedVibe === '-'
                    ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700'
                }`}
              >
                <Minus className="w-3 h-3" />
                Negative
              </button>
            </div>
          )}
          
          <button
            onClick={handlePostComment}
            disabled={!commentText.trim() || posting}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
          >
            {posting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-4 text-sm text-gray-500">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-4 text-sm text-gray-500">
            No {contentType === 'product' ? 'reviews' : 'comments'} yet
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              {/* Avatar */}
              {comment.userPhoto ? (
                <img
                  src={comment.userPhoto}
                  alt={comment.userDisplayName}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold">
                    {comment.userDisplayName.charAt(0)}
                  </span>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-gray-900 dark:text-white">
                    @{comment.userHandle}
                  </span>
                  {comment.vibe && (
                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                      comment.vibe === '+'
                        ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                    }`}>
                      {comment.vibe}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                  </span>
                </div>
                
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {comment.text}
                </p>
                
                {/* Vibe buttons on comment */}
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => handleVibe(comment.id, '+')}
                    className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    {comment.vibes.plus}
                  </button>
                  
                  <button
                    onClick={() => handleVibe(comment.id, '-')}
                    className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                    {comment.vibes.minus}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

