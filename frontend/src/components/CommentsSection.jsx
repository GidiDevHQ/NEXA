import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { commentsAPI } from '../services/api';
import { useAuth } from '../contexts/useAuth';

// ---------------------------------------------------------------------------
// CommentItem — renders a single comment with replies, edit, delete, like
// ---------------------------------------------------------------------------

const CommentItem = ({ comment, currentUser, postId, onDelete }) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [commentContent, setCommentContent] = useState(comment.content);
  const [isLiked, setIsLiked] = useState(
    comment.likes?.some((id) => id.toString() === currentUser?._id) ?? false
  );
  const [likeCount, setLikeCount] = useState(comment.like_count || 0);
  const [replyError, setReplyError] = useState('');
  const [editError, setEditError] = useState('');

  const isOwner = currentUser?._id === comment.author?._id;

  // ---- Replies ----

  const handleToggleReplies = async () => {
    const opening = !showReplies;
    setShowReplies(opening);

    if (opening && replies.length === 0) {
      setRepliesLoading(true);
      try {
        const response = await commentsAPI.getReplies(comment._id);
        setReplies(response.data.replies || response.data || []);
      } catch {
        // silently fail — replies just won't show
      } finally {
        setRepliesLoading(false);
      }
    }
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setReplyError('');

    try {
      const response = await commentsAPI.createReply(comment._id, {
        content: replyContent,
      });
      const newReply = response.data.reply || response.data;
      setReplies((prev) => [newReply, ...prev]);
      setReplyContent('');
      setShowReplyForm(false);
      setShowReplies(true);
    } catch {
      setReplyError('Failed to post reply. Please try again.');
    }
  };

  // ---- Edit ----

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editContent.trim()) return;
    setEditError('');

    try {
      await commentsAPI.updateComment(comment._id, { content: editContent });
      setCommentContent(editContent);
      setIsEditing(false);
    } catch {
      setEditError('Failed to update comment. Please try again.');
    }
  };

  // ---- Delete ----

  const handleDelete = async () => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await commentsAPI.deleteComment(comment._id);
      onDelete(comment._id);
    } catch {
      // no-op — keep comment visible if delete fails
    }
  };

  // ---- Like / Unlike (optimistic) ----

  const handleLike = async () => {
    const prevLiked = isLiked;
    const prevCount = likeCount;

    // Optimistic update
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);

    try {
      if (prevLiked) {
        await commentsAPI.unlikeComment(comment._id);
      } else {
        await commentsAPI.likeComment(comment._id);
      }
    } catch {
      // Revert on error
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
    }
  };

  // ---- Author display helpers ----

  const author = comment.author;
  const displayName =
    author?.first_name || author?.last_name
      ? `${author.first_name ?? ''} ${author.last_name ?? ''}`.trim()
      : author?.username || 'Unknown';

  const avatarInitial = (
    author?.first_name?.charAt(0) ||
    author?.username?.charAt(0) ||
    'U'
  ).toUpperCase();

  const formattedDate = comment.createdAt
    ? new Date(comment.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      {/* Author row */}
      <div className="flex items-center mb-2">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-2 flex-shrink-0">
          {avatarInitial}
        </div>
        <div>
          <span className="font-semibold text-gray-900 text-sm">{displayName}</span>
          <span className="text-xs text-gray-500 ml-2">{formattedDate}</span>
        </div>
      </div>

      {/* Comment body — edit mode or read mode */}
      {isEditing ? (
        <form onSubmit={handleSaveEdit} className="mt-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          {editError && (
            <p className="text-red-600 text-xs mt-1">{editError}</p>
          )}
          <div className="flex space-x-2 mt-2">
            <button
              type="submit"
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditContent(commentContent);
                setEditError('');
              }}
              className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <p className="text-gray-800 text-sm mt-1 whitespace-pre-wrap">{commentContent}</p>
      )}

      {/* Action buttons — only for logged-in users */}
      {currentUser && (
        <div className="flex items-center space-x-3 mt-3">
          {/* Like */}
          <button
            onClick={handleLike}
            className={`flex items-center space-x-1 text-xs px-2 py-1 rounded transition-colors ${
              isLiked
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>{isLiked ? '❤️' : '🤍'}</span>
            <span>{likeCount}</span>
          </button>

          {/* Reply */}
          <button
            onClick={() => setShowReplyForm((v) => !v)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Reply
          </button>

          {/* View replies */}
          <button
            onClick={handleToggleReplies}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {showReplies ? 'Hide replies' : `View replies`}
          </button>

          {/* Owner-only: Edit / Delete */}
          {isOwner && (
            <>
              <button
                onClick={() => {
                  setIsEditing(true);
                  setEditContent(commentContent);
                }}
                className="text-xs text-gray-500 hover:text-blue-600 font-medium"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="text-xs text-gray-500 hover:text-red-600 font-medium"
              >
                Delete
              </button>
            </>
          )}
        </div>
      )}

      {/* Reply form */}
      {showReplyForm && currentUser && (
        <form onSubmit={handleSubmitReply} className="mt-3 pl-4 border-l-2 border-blue-200">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply…"
            rows={2}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          {replyError && (
            <p className="text-red-600 text-xs mt-1">{replyError}</p>
          )}
          <div className="flex space-x-2 mt-2">
            <button
              type="submit"
              disabled={!replyContent.trim()}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Post Reply
            </button>
            <button
              type="button"
              onClick={() => {
                setShowReplyForm(false);
                setReplyContent('');
                setReplyError('');
              }}
              className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Replies list */}
      {showReplies && (
        <div className="mt-3 pl-4 border-l-2 border-gray-200 space-y-3">
          {repliesLoading ? (
            <div className="flex justify-center py-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            </div>
          ) : replies.length === 0 ? (
            <p className="text-xs text-gray-500">No replies yet.</p>
          ) : (
            replies.map((reply) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                currentUser={currentUser}
                postId={postId}
                onDelete={(deletedId) =>
                  setReplies((prev) => prev.filter((r) => r._id !== deletedId))
                }
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// CommentsSection — fetches and renders all comments for a post
// ---------------------------------------------------------------------------

const CommentsSection = ({ postId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await commentsAPI.getComments(postId);
        const data = response.data;
        const extracted = data?.comments || data?.data || (Array.isArray(data) ? data : []);
        setComments(extracted);
      } catch {
        setError('Failed to load comments. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [postId]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    setSubmitError('');

    try {
      const response = await commentsAPI.createComment(postId, {
        content: newComment,
      });
      const created = response.data.comment || response.data;
      setComments((prev) => [created, ...prev]);
      setNewComment('');
    } catch {
      setSubmitError('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = (deletedId) => {
    setComments((prev) => prev.filter((c) => c._id !== deletedId));
  };

  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Comments</h2>

      {/* Comment form — logged-in users only */}
      {user ? (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment…"
            rows={3}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          {submitError && (
            <p className="text-red-600 text-sm mt-1">{submitError}</p>
          )}
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Posting…' : 'Post Comment'}
            </button>
          </div>
        </form>
      ) : (
        <p className="mb-6 text-sm text-gray-600">
          <Link to="/signin" className="text-blue-600 hover:text-blue-800 font-medium">
            Sign in
          </Link>{' '}
          to comment
        </p>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <p className="text-red-600 text-sm text-center py-4">{error}</p>
      ) : comments.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              currentUser={user}
              postId={postId}
              onDelete={handleDeleteComment}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default CommentsSection;
