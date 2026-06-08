import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare, 
  Send, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Edit3,
  Trash2,
  MoreVertical,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CommentThread({ parentType, parentId, teamId }) {
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState('general');
  const [replyTo, setReplyTo] = useState(null);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', parentType, parentId],
    queryFn: async () => {
      const response = await base44.entities.CollaborationComment.filter({
        parent_type: parentType,
        parent_id: parentId,
        parent_comment_id: null, // Only top-level comments
        active: true
      }, '-created_date');
      return response;
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content) => {
      await base44.entities.CollaborationComment.create({
        team_id: teamId,
        parent_type: parentType,
        parent_id: parentId,
        author_user_id: 'current_user', // Will be replaced with actual user
        author_name: 'Current User',
        author_role: 'Coach',
        content,
        comment_type: commentType,
        parent_comment_id: replyTo?.id,
        created_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      setNewComment('');
      setReplyTo(null);
      queryClient.invalidateQueries(['comments', parentType, parentId]);
    }
  });

  const handleSubmit = () => {
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment);
    }
  };

  return (
    <Card className="border-slate-700 bg-slate-800/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment Input */}
        <div className="space-y-2">
          {replyTo && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Replying to {replyTo.author_name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setReplyTo(null)}
              >
                Cancel
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <Select value={commentType} onValueChange={setCommentType}>
              <SelectTrigger className="w-32 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="suggestion">Suggestion</SelectItem>
                <SelectItem value="question">Question</SelectItem>
                <SelectItem value="approval">Approval</SelectItem>
                <SelectItem value="revision_request">Revision</SelectItem>
              </SelectContent>
            </Select>
            <input
              className="flex-1 h-9 px-3 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <Button
              size="sm"
              className="h-9"
              onClick={handleSubmit}
              disabled={!newComment.trim() || addCommentMutation.isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Comments List */}
        {isLoading ? (
          <div className="text-center py-8 text-sm text-muted-foreground">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {comments.map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  teamId={teamId}
                  parentType={parentType}
                  parentId={parentId}
                  onReply={setReplyTo}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function CommentItem({ comment, teamId, parentType, parentId, onReply }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);

  const typeConfig = {
    general: { icon: MessageSquare, color: 'text-slate-400', bg: 'bg-slate-800' },
    suggestion: { icon: Edit3, color: 'text-blue-400', bg: 'bg-blue-900/20' },
    question: { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-900/20' },
    approval: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-900/20' },
    revision_request: { icon: Clock, color: 'text-red-400', bg: 'bg-red-900/20' }
  };

  const config = typeConfig[comment.comment_type] || typeConfig.general;
  const TypeIcon = config.icon;

  return (
    <div className={cn("p-3 rounded-lg border", config.bg, "border-slate-700")}>
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            {comment.author_name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{comment.author_name}</span>
              <Badge variant="outline" className="text-[10px] h-5">
                <TypeIcon className={cn("h-3 w-3 mr-1", config.color)} />
                {comment.comment_type.replace('_', ' ')}
              </Badge>
              {comment.is_resolved && (
                <Badge variant="outline" className="text-[10px] h-5 text-emerald-400">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Resolved
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(comment.created_date).toLocaleDateString()}
            </span>
          </div>
          {isEditing ? (
            <textarea
              className="w-full text-sm bg-slate-900 rounded p-2 min-h-[80px]"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
            />
          ) : (
            <p className="text-sm text-slate-300">{comment.content}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => onReply(comment)}
            >
              Reply
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}