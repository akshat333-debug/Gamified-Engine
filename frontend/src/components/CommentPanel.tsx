'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';

interface Comment {
  id: string;
  program_id: number;
  user_id: string;
  user_name: string;
  content: string;
  section: string;
  created_at: string;
  parent_id: string | null;
  replies: Comment[];
}

interface CommentPanelProps {
  programId: number;
  section?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CommentPanel({ programId, section, isOpen, onClose }: CommentPanelProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchComments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ program_id: programId.toString() });
      if (section) params.append('section', section);

      const response = await axios.get(`${API_URL}/api/collaboration/comments?${params}`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, programId, section]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/collaboration/comments`, {
        program_id: programId,
        user_id: user.id,
        user_name: user.email?.split('@')[0] || 'Anonymous',
        content: newComment.trim(),
        section: section || 'general',
        parent_id: replyTo
      });

      setNewComment('');
      setReplyTo(null);
      fetchComments();
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderComment = (comment: Comment, depth = 0) => (
    <motion.div
      key={comment.id}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      style={{ marginLeft: depth * 20 }}
      className="comment-item"
    >
      <div className="comment-header">
        <span className="comment-author">👤 {comment.user_name}</span>
        <span className="comment-time">{formatDate(comment.created_at)}</span>
      </div>
      <p className="comment-content">{comment.content}</p>
      <div className="comment-actions">
        <button
          className="reply-btn"
          onClick={() => setReplyTo(comment.id)}
        >
          ↩️ Reply
        </button>
        {comment.section !== 'general' && (
          <span className="comment-section">📍 {comment.section}</span>
        )}
      </div>
      {comment.replies?.map(reply => renderComment(reply, depth + 1))}
    </motion.div>
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="comment-panel-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="comment-panel"
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="comment-panel-header">
            <h3>💬 Comments</h3>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>

          <div className="comments-list">
            {loading ? (
              <div className="loading-spinner">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="no-comments">
                <p>💭 No comments yet</p>
                <span>Be the first to leave a comment!</span>
              </div>
            ) : (
              comments.map(comment => renderComment(comment))
            )}
          </div>

          {user ? (
            <form onSubmit={handleSubmit} className="comment-form">
              {replyTo && (
                <div className="reply-indicator">
                  Replying to comment...
                  <button type="button" onClick={() => setReplyTo(null)}>Cancel</button>
                </div>
              )}
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
              />
              <button
                type="submit"
                disabled={!newComment.trim() || submitting}
                className="submit-btn"
              >
                {submitting ? 'Posting...' : '📤 Post Comment'}
              </button>
            </form>
          ) : (
            <div className="login-prompt">
              <p>🔒 Please log in to leave comments</p>
            </div>
          )}
        </motion.div>
      </motion.div>

      <style jsx>{`
        .comment-panel-overlay {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1000;
        }

        .comment-panel {
          position: fixed;
          top: 0;
          right: 0;
          width: 380px;
          max-width: 100%;
          height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          box-shadow: -5px 0 20px rgba(0, 0, 0, 0.3);
        }

        .comment-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .comment-panel-header h3 {
          margin: 0;
          color: #fff;
          font-size: 1.2rem;
        }

        .close-btn {
          background: none;
          border: none;
          color: #888;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 5px 10px;
          border-radius: 5px;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .comments-list {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        :global(.comment-item) {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 15px;
          margin-bottom: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        :global(.comment-header) {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        :global(.comment-author) {
          color: #4cc9f0;
          font-weight: 600;
          font-size: 0.9rem;
        }

        :global(.comment-time) {
          color: #666;
          font-size: 0.75rem;
        }

        :global(.comment-content) {
          color: #e0e0e0;
          margin: 0 0 10px 0;
          line-height: 1.5;
          font-size: 0.95rem;
        }

        :global(.comment-actions) {
          display: flex;
          gap: 15px;
          align-items: center;
        }

        :global(.reply-btn) {
          background: none;
          border: none;
          color: #7b68ee;
          font-size: 0.8rem;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        :global(.reply-btn:hover) {
          background: rgba(123, 104, 238, 0.2);
        }

        :global(.comment-section) {
          color: #888;
          font-size: 0.75rem;
        }

        .loading-spinner {
          text-align: center;
          color: #888;
          padding: 40px;
        }

        .no-comments {
          text-align: center;
          padding: 40px 20px;
          color: #888;
        }

        .no-comments p {
          font-size: 1.2rem;
          margin-bottom: 5px;
        }

        .no-comments span {
          font-size: 0.85rem;
        }

        .comment-form {
          padding: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.2);
        }

        .reply-indicator {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(123, 104, 238, 0.2);
          padding: 8px 12px;
          border-radius: 8px;
          margin-bottom: 10px;
          color: #7b68ee;
          font-size: 0.85rem;
        }

        .reply-indicator button {
          background: none;
          border: none;
          color: #ff6b6b;
          cursor: pointer;
          font-size: 0.8rem;
        }

        .comment-form textarea {
          width: 100%;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          padding: 12px;
          color: #fff;
          resize: none;
          font-family: inherit;
          font-size: 0.95rem;
          margin-bottom: 10px;
        }

        .comment-form textarea:focus {
          outline: none;
          border-color: #4cc9f0;
        }

        .submit-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #4cc9f0 0%, #7b68ee 100%);
          border: none;
          border-radius: 10px;
          color: #fff;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .submit-btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(76, 201, 240, 0.3);
        }

        .login-prompt {
          padding: 20px;
          text-align: center;
          color: #888;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </AnimatePresence>
  );
}
