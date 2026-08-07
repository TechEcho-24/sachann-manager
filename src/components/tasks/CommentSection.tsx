"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { Send, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RoleBadge } from "@/components/users/RoleBadge";
import { getTaskComments, addTaskComment, type SerializedComment } from "@/actions/task";
import { toast } from "sonner";
import type { UserRole } from "@/lib/roles";

interface CommentSectionProps {
  taskId: string;
  currentUserRole?: string;
}

export function CommentSection({ taskId }: CommentSectionProps) {
  const [comments, setComments] = useState<SerializedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const data = await getTaskComments(taskId);
      setComments(data);
    } catch (err) {
      console.error("Failed to load comments", err);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const res = await addTaskComment(taskId, newComment);
      if (res.error) {
        toast.error(res.error);
      } else {
        setNewComment("");
        toast.success("Comment added");
        fetchComments();
      }
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <MessageSquare className="w-4 h-4 text-brand-green" />
        <span>Discussion ({comments.length})</span>
      </div>

      {/* Comment List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {loading ? (
          <div className="py-8 text-center text-xs text-muted-foreground">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground bg-muted/40 rounded-xl border border-dashed border-border">
            No comments yet. Start the conversation below!
          </div>
        ) : (
          comments.map((c) => (
            <div key={c._id} className="bg-card border border-border p-3 rounded-xl space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center font-bold text-xs">
                    {c.user?.name?.charAt(0) || "U"}
                  </div>
                  <span className="text-xs font-semibold text-foreground">{c.user?.name}</span>
                  <RoleBadge role={c.user?.role as UserRole} className="text-[9px] px-1.5 py-0" />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className="text-xs text-foreground/90 pl-8 whitespace-pre-wrap">{c.text}</p>
            </div>
          ))
        )}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleAddComment} className="flex flex-col gap-2 pt-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment or update on this task..."
          rows={2}
          className="rounded-xl resize-none text-xs"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={submitting || !newComment.trim()}
            size="sm"
            className="h-8 px-4 rounded-xl bg-brand-green hover:bg-brand-green-light text-white text-xs gap-1.5"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Post Comment
          </Button>
        </div>
      </form>
    </div>
  );
}
