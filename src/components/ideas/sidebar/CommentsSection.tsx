"use client";

import { useState, useEffect, memo, useCallback, useMemo } from "react";
import { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import {
  addComment,
  getComments,
  deleteComment,
  updateComment,
  deleteCommentWithReplies,
} from "@/lib/comments";
import type { Comment } from "@/types";
import { Send, CornerDownRight, Trash2, Edit3 } from "lucide-react";
import Link from "next/link";

type CommentsSectionProps = {
  ideaId: string;
  ideaTitle: string;
  ideaOwnerId: string;
  user: User | null;
  isIdeaOwner: boolean;
  onAuthTrigger: () => void;
};

// Helper function to send notification
async function sendCommentNotification({
  recipientId,
  senderName,
  commentText,
  ideaId,
  ideaTitle,
  notificationType,
  parentCommentId,
  senderId
}: {
  recipientId: string;
  senderName: string;
  commentText: string;
  ideaId: string;
  ideaTitle: string;
  notificationType: 'new_comment' | 'reply';
  parentCommentId?: string;
  senderId: string;
}) {
  // Don't notify yourself
  if (recipientId === senderId) {
    console.log('[NOTIF] Skipping self-notification');
    return;
  }

  try {
    const response = await fetch('/api/emails/send-comment-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientId,
        senderName,
        commentText,
        ideaId,
        ideaTitle,
        notificationType,
        parentCommentId
      })
    });

    const data = await response.json();
    if (data.skipped) {
      console.log('[NOTIF] Skipped:', data.reason);
    } else if (data.success) {
      console.log('[NOTIF] ✅ Notification sent');
    } else {
      console.error('[NOTIF] Failed:', data.error);
    }
  } catch (error) {
    console.error('[NOTIF] Error sending notification:', error);
  }
}

// ISOLATED REPLY BOX
const ReplyBox = memo(({ 
  commentId, 
  username, 
  onSubmit, 
  onCancel,
  submitting 
}: { 
  commentId: string;
  username: string;
  onSubmit: (commentId: string, text: string) => void;
  onCancel: () => void;
  submitting: boolean;
}) => {
  const [text, setText] = useState("");

  const handleSubmit = useCallback(() => {
    if (text.trim()) {
      onSubmit(commentId, text);
      setText("");
    }
  }, [text, commentId, onSubmit]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  }, []);

  return (
    <div className="mt-3 bg-neutral-950/50 border border-neutral-800 rounded-xl p-3">
      <textarea
        autoFocus
        value={text}
        onChange={handleChange}
        placeholder={`Reply to ${username}...`}
        style={{ fontSize: "16px" }}
        className="w-full bg-transparent text-white placeholder:text-neutral-600 focus:outline-none resize-none min-h-[60px]"
      />
      <div className="flex items-center justify-end gap-2 mt-2">
        <button
          onClick={onCancel}
          className="text-[10px] font-black text-neutral-500 uppercase hover:text-neutral-400 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || submitting}
          className="flex items-center gap-2 px-3 py-1.5 bg-brand text-white text-[10px] font-black uppercase rounded-lg hover:bg-brand/90 transition-all disabled:opacity-30"
        >
          <Send size={10} /> Reply
        </button>
      </div>
    </div>
  );
});

ReplyBox.displayName = "ReplyBox";

// ISOLATED EDIT BOX
const EditBox = memo(({
  commentId,
  initialText,
  onSave,
  onCancel
}: {
  commentId: string;
  initialText: string;
  onSave: (commentId: string, text: string) => void;
  onCancel: () => void;
}) => {
  const [text, setText] = useState(initialText);

  const handleSave = useCallback(() => {
    onSave(commentId, text);
  }, [commentId, text, onSave]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  }, []);

  return (
    <div className="space-y-2 mt-1">
      <textarea
        autoFocus
        value={text}
        onChange={handleChange}
        style={{ fontSize: "16px" }}
        className="w-full bg-neutral-950 border border-neutral-800 text-white p-2 rounded-xl focus:outline-none resize-none min-h-[60px]"
      />
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="text-[10px] font-black text-brand uppercase hover:text-brand/80 transition-colors"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="text-[10px] font-black text-neutral-500 uppercase hover:text-neutral-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
});

EditBox.displayName = "EditBox";

// SINGLE COMMENT ITEM
const CommentItem = memo(({ 
  comment,
  depth = 0,
  currentUserId,
  isIdeaOwner,
  editingId,
  replyingTo,
  submitting,
  onReply,
  onEdit,
  onDelete,
  onCancelReply,
  onCancelEdit,
  onSaveEdit,
  onSubmitReply,
  onAuthTrigger,
  replies,
  allComments
}: { 
  comment: Comment;
  depth?: number;
  currentUserId: string | null;
  isIdeaOwner: boolean;
  editingId: string | null;
  replyingTo: string | null;
  submitting: boolean;
  onReply: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string, hasReplies: boolean) => void;
  onCancelReply: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string, text: string) => void;
  onSubmitReply: (parentId: string, text: string) => void;
  onAuthTrigger: () => void;
  replies: Comment[];
  allComments: Comment[];
}) => {
  const maxDepth = 3;
  const hasReplies = allComments.some(c => c.parentId === comment.id);
  const canEdit = currentUserId && comment.userId === currentUserId;
  const canDelete = currentUserId && (comment.userId === currentUserId || isIdeaOwner);

  return (
    <div className={`${depth > 0 ? "ml-4 sm:ml-8 mt-4" : ""}`}>
      <div className="group flex gap-2 sm:gap-3">
        <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-white/5 overflow-hidden shrink-0 mt-1">
          {comment.userPhotoURL ? (
            <img src={comment.userPhotoURL} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-neutral-500">
              {comment.username?.[0]?.toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header with username and date */}
          <div className="flex items-center justify-between mb-1 gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Link 
                href={`/profile/${comment.userId}`} 
                className="text-[11px] font-black text-white hover:text-brand transition-colors uppercase"
              >
                {comment.username}
              </Link>
              {isIdeaOwner && comment.userId === currentUserId && (
                <span className="text-[8px] font-black bg-brand/10 text-brand px-1.5 py-0.5 rounded border border-brand/20 uppercase tracking-tighter">
                  Founder
                </span>
              )}
              {comment.isEdited && (
                <span className="text-[8px] text-neutral-600 italic">(edited)</span>
              )}
            </div>
            <span className="text-[9px] text-neutral-600 font-bold whitespace-nowrap">
              {new Date(typeof comment.createdAt === "number" ? comment.createdAt : (comment.createdAt as any).toMillis?.() || Date.now()).toLocaleDateString()}
            </span>
          </div>

          {/* Comment content or edit box */}
          {editingId === comment.id ? (
            <EditBox
              commentId={comment.id}
              initialText={comment.text}
              onSave={onSaveEdit}
              onCancel={onCancelEdit}
            />
          ) : (
            <>
              <p className="text-sm text-neutral-400 leading-snug break-words mb-2">
                {comment.text}
              </p>

              {/* Action buttons - ALWAYS VISIBLE */}
              <div className="flex flex-wrap gap-3 sm:gap-4 mt-2">
                {depth < maxDepth && (
                  <button
                    onClick={() => {
                      if (!currentUserId) return onAuthTrigger();
                      onReply(comment.id);
                    }}
                    className="text-[9px] font-black text-neutral-500 hover:text-brand uppercase flex items-center gap-1 transition-colors"
                  >
                    <CornerDownRight size={10} /> Reply
                  </button>
                )}

                {canEdit && (
                  <button
                    onClick={() => onEdit(comment.id)}
                    className="text-[9px] font-black text-neutral-500 hover:text-brand uppercase flex items-center gap-1 transition-colors"
                  >
                    <Edit3 size={10} /> Edit
                  </button>
                )}

                {canDelete && (
                  <button 
                    onClick={() => onDelete(comment.id, hasReplies)} 
                    className="text-[9px] font-black text-neutral-500 hover:text-rose-500 uppercase flex items-center gap-1 transition-colors"
                  >
                    <Trash2 size={10} /> Delete{hasReplies && isIdeaOwner && " Thread"}
                  </button>
                )}
              </div>
            </>
          )}

          {/* Reply box */}
          {replyingTo === comment.id && (
            <ReplyBox
              commentId={comment.id}
              username={comment.username}
              onSubmit={onSubmitReply}
              onCancel={onCancelReply}
              submitting={submitting}
            />
          )}
        </div>
      </div>

      {/* Nested replies */}
      {hasReplies && replies.length > 0 && (
        <div className="space-y-4 mt-4 border-l-2 border-neutral-800/50 pl-2 sm:pl-4">
          {replies.map((reply) => {
            const nestedReplies = allComments
              .filter(c => c.parentId === reply.id)
              .sort((a, b) => {
                const timeA = typeof a.createdAt === "number" ? a.createdAt : (a.createdAt as any).toMillis?.() || 0;
                const timeB = typeof b.createdAt === "number" ? b.createdAt : (b.createdAt as any).toMillis?.() || 0;
                return timeA - timeB;
              });

            return (
              <CommentItem 
                key={reply.id} 
                comment={reply} 
                depth={depth + 1}
                currentUserId={currentUserId}
                isIdeaOwner={isIdeaOwner}
                editingId={editingId}
                replyingTo={replyingTo}
                submitting={submitting}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onCancelReply={onCancelReply}
                onCancelEdit={onCancelEdit}
                onSaveEdit={onSaveEdit}
                onSubmitReply={onSubmitReply}
                onAuthTrigger={onAuthTrigger}
                replies={nestedReplies}
                allComments={allComments}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.comment.id === nextProps.comment.id &&
    prevProps.comment.text === nextProps.comment.text &&
    prevProps.comment.isEdited === nextProps.comment.isEdited &&
    prevProps.editingId === nextProps.editingId &&
    prevProps.replyingTo === nextProps.replyingTo &&
    prevProps.replies.length === nextProps.replies.length &&
    prevProps.submitting === nextProps.submitting &&
    prevProps.allComments.length === nextProps.allComments.length
  );
});

CommentItem.displayName = "CommentItem";

export default function CommentsSection({
  ideaId,
  ideaTitle,
  ideaOwnerId,
  user,
  isIdeaOwner,
  onAuthTrigger,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [ideaId]);

  const loadComments = async () => {
    try {
      const data = await getComments(ideaId);
      setComments(
        data.sort((a, b) => {
          const timeA = typeof a.createdAt === "number" ? a.createdAt : (a.createdAt as any).toMillis?.() || 0;
          const timeB = typeof b.createdAt === "number" ? b.createdAt : (b.createdAt as any).toMillis?.() || 0;
          return timeB - timeA;
        })
      );
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = useCallback(async () => {
    if (!user) return null;
    const db = getFirebaseDb();
    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      return {
        name: userData.username || userData.displayName || user.displayName || "Anonymous",
        handle: userData.userHandle || userData.username?.toLowerCase().replace(/\s/g, "") || "user",
        photo: userData.photoURL || userData.avatarUrl || user.photoURL || null,
      };
    }
    return {
      name: user.displayName || user.email?.split("@")[0] || "New User",
      handle: user.email?.split("@")[0]?.toLowerCase() || "user",
      photo: user.photoURL || null,
    };
  }, [user]);

  const handleReplySubmit = useCallback(async (parentId: string, text: string) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const userData = await fetchUserData();
      if (!userData) return;

      let threadOwnerId = user.uid;
      const parentComment = comments.find(c => c.id === parentId);
      if (parentComment) {
        threadOwnerId = (parentComment as any).threadOwnerId || parentComment.userId;
      }

      const comment = await addComment(
        ideaId,
        user.uid,
        userData.name,
        userData.handle,
        userData.photo,
        text,
        parentId,
        threadOwnerId
      );

      setComments((prev) => [...prev, comment]);
      setReplyingTo(null);

      if (parentComment && parentComment.userId) {
        sendCommentNotification({
          recipientId: parentComment.userId,
          senderName: userData.name,
          commentText: text,
          ideaId,
          ideaTitle,
          notificationType: 'reply',
          parentCommentId: parentId,
          senderId: user.uid
        });
      }

    } catch (error) {
      console.error("Error submitting reply:", error);
    } finally {
      setSubmitting(false);
    }
  }, [user, ideaId, ideaTitle, fetchUserData, comments]);

  const handleCommentSubmit = useCallback(async () => {
    if (!user) return onAuthTrigger();
    const trimmed = newComment.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      const userData = await fetchUserData();
      if (!userData) return;

      const comment = await addComment(
        ideaId,
        user.uid,
        userData.name,
        userData.handle,
        userData.photo,
        trimmed,
        null,
        user.uid
      );

      setComments((prev) => [comment, ...prev]);
      setNewComment("");

      sendCommentNotification({
        recipientId: ideaOwnerId,
        senderName: userData.name,
        commentText: trimmed,
        ideaId,
        ideaTitle,
        notificationType: 'new_comment',
        senderId: user.uid
      });

    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setSubmitting(false);
    }
  }, [user, newComment, submitting, ideaId, ideaTitle, ideaOwnerId, fetchUserData, onAuthTrigger]);

  const handleEditSave = useCallback(async (commentId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      await updateComment(commentId, trimmed);
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, text: trimmed, isEdited: true } : c))
      );
      setEditingId(null);
    } catch (error) {
      console.error("Edit failed", error);
    }
  }, []);

  const handleDelete = useCallback(async (commentId: string, hasReplies: boolean) => {
    const message = hasReplies ? "Delete this comment and all its replies?" : "Delete this comment?";
    if (!window.confirm(message)) return;

    try {
      if (hasReplies) {
        const deletedIds = await deleteCommentWithReplies(commentId, comments);
        setComments((prev) => prev.filter((c) => !deletedIds.includes(c.id)));
      } else {
        await deleteComment(commentId);
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (error) {
      console.error("Delete failed", error);
    }
  }, [comments]);

  const handleReply = useCallback((id: string) => {
    setReplyingTo(replyingTo === id ? null : id);
  }, [replyingTo]);

  const handleEdit = useCallback((id: string) => {
    setEditingId(id);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  const { threadedComments, repliesMap } = useMemo(() => {
    const topLevel = comments.filter((c) => !c.parentId);
    const replyMap = new Map<string, Comment[]>();
    
    comments.forEach((c) => {
      if (c.parentId) {
        if (!replyMap.has(c.parentId)) {
          replyMap.set(c.parentId, []);
        }
        replyMap.get(c.parentId)!.push(c);
      }
    });

    replyMap.forEach((replies) => {
      replies.sort((a, b) => {
        const timeA = typeof a.createdAt === "number" ? a.createdAt : (a.createdAt as any).toMillis?.() || 0;
        const timeB = typeof b.createdAt === "number" ? b.createdAt : (b.createdAt as any).toMillis?.() || 0;
        return timeA - timeB;
      });
    });

    return { threadedComments: topLevel, repliesMap: replyMap };
  }, [comments]);

  const handleNewCommentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value);
  }, []);

  return (
    <div className="space-y-6">
      {/* New comment input */}
      <div className="bg-gradient-to-br from-neutral-950/20 via-neutral-900/20 to-neutral-900 border border-neutral-800 rounded-2xl p-1 focus-within:border-brand/40 transition-all">
        <textarea
          value={newComment}
          onChange={handleNewCommentChange}
          onFocus={() => !user && onAuthTrigger()}
          placeholder={user ? "Write a comment..." : "Sign in to join discussion"}
          style={{ fontSize: "16px" }}
          className="w-full bg-transparent p-3 text-white placeholder:text-neutral-600 focus:outline-none resize-none min-h-[70px]"
        />
        <div className="flex items-center justify-between px-3 pb-2">
          <span className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">
            {submitting ? "Posting..." : "Discussion"}
          </span>
          <button
            onClick={handleCommentSubmit}
            disabled={!newComment.trim() || submitting}
            className="flex items-center gap-2 px-3 py-1.5 bg-brand text-white text-[11px] font-black uppercase tracking-tighter rounded-xl hover:bg-brand/90 transition-all disabled:opacity-20"
          >
            <Send size={10} /> Post
          </button>
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-6">
        {loading ? (
          <div className="animate-pulse flex gap-3">
            <div className="w-8 h-8 bg-neutral-800 rounded-lg" />
            <div className="h-10 bg-neutral-800 rounded-xl flex-1" />
          </div>
        ) : threadedComments.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-neutral-800 rounded-2xl">
            <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest">
              No comments yet
            </p>
          </div>
        ) : (
          threadedComments.map((comment) => (
            <CommentItem 
              key={comment.id}
              comment={comment}
              depth={0}
              currentUserId={user?.uid || null}
              isIdeaOwner={isIdeaOwner}
              editingId={editingId}
              replyingTo={replyingTo}
              submitting={submitting}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCancelReply={handleCancelReply}
              onCancelEdit={handleCancelEdit}
              onSaveEdit={handleEditSave}
              onSubmitReply={handleReplySubmit}
              onAuthTrigger={onAuthTrigger}
              replies={repliesMap.get(comment.id) || []}
              allComments={comments}
            />
          ))
        )}
      </div>
    </div>
  );
}