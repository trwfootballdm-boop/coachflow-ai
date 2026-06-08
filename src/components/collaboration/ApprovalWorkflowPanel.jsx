import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  FileText,
  Users,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ApprovalWorkflowPanel({ parentType, parentId, teamId }) {
  const queryClient = useQueryClient();

  const { data: workflow } = useQuery({
    queryKey: ['approvalWorkflow', parentType, parentId],
    queryFn: async () => {
      const workflows = await base44.entities.ApprovalWorkflow.filter({
        parent_type: parentType,
        parent_id: parentId,
        active: true
      });
      return workflows[0] || null;
    }
  });

  const submitForApprovalMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.ApprovalWorkflow.create({
        team_id: teamId,
        parent_type: parentType,
        parent_id: parentId,
        status: 'pending_review',
        submitted_by: 'current_user',
        submitted_date: new Date().toISOString(),
        version_number: 1,
        approval_history: [{
          action: 'submitted',
          user_id: 'current_user',
          user_name: 'Current User',
          user_role: 'Coach',
          timestamp: new Date().toISOString(),
          notes: 'Submitted for approval'
        }]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['approvalWorkflow', parentType, parentId]);
    }
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      const updateData = {
        status: 'approved',
        approved_by: 'current_user',
        approved_date: new Date().toISOString(),
        approval_history: [
          ...(workflow?.approval_history || []),
          {
            action: 'approved',
            user_id: 'current_user',
            user_name: 'Current User',
            user_role: 'Coach',
            timestamp: new Date().toISOString(),
            notes: 'Approved'
          }
        ]
      };
      await base44.entities.ApprovalWorkflow.update(workflow.id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['approvalWorkflow', parentType, parentId]);
    }
  });

  const requestRevisionMutation = useMutation({
    mutationFn: async (notes) => {
      const updateData = {
        status: 'revision_requested',
        revision_requested_by: 'current_user',
        revision_notes: notes,
        approval_history: [
          ...(workflow?.approval_history || []),
          {
            action: 'revision_requested',
            user_id: 'current_user',
            user_name: 'Current User',
            user_role: 'Coach',
            timestamp: new Date().toISOString(),
            notes
          }
        ]
      };
      await base44.entities.ApprovalWorkflow.update(workflow.id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['approvalWorkflow', parentType, parentId]);
    }
  });

  const statusConfig = {
    draft: { label: 'Draft', color: 'text-slate-400', bg: 'bg-slate-800', border: 'border-slate-700', icon: FileText },
    pending_review: { label: 'Pending Review', color: 'text-amber-400', bg: 'bg-amber-900/20', border: 'border-amber-700', icon: Clock },
    approved: { label: 'Approved', color: 'text-emerald-400', bg: 'bg-emerald-900/20', border: 'border-emerald-700', icon: CheckCircle },
    revision_requested: { label: 'Revision Requested', color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-700', icon: AlertCircle },
    rejected: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-700', icon: XCircle }
  };

  const config = statusConfig[workflow?.status || 'draft'];
  const StatusIcon = config.icon;

  return (
    <Card className={cn("border", config.border, config.bg)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <StatusIcon className={cn("h-4 w-4", config.color)} />
            Approval Status
          </CardTitle>
          <Badge variant="outline" className={cn("text-xs", config.color, config.border)}>
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Buttons */}
        {!workflow || workflow.status === 'draft' ? (
          <Button
            className="w-full"
            onClick={() => submitForApprovalMutation.mutate()}
            disabled={submitForApprovalMutation.isPending}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Submit for Approval
          </Button>
        ) : workflow.status === 'pending_review' ? (
          <div className="flex gap-2">
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-500"
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-red-700 text-red-400 hover:bg-red-900/20"
              onClick={() => requestRevisionMutation.mutate('Needs revision')}
              disabled={requestRevisionMutation.isPending}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Request Revision
            </Button>
          </div>
        ) : workflow.status === 'revision_requested' ? (
          <div className="p-3 rounded bg-red-900/20 border border-red-700">
            <p className="text-xs text-red-300 font-semibold mb-1">Revision Notes:</p>
            <p className="text-sm text-red-200">{workflow.revision_notes}</p>
          </div>
        ) : null}

        {/* Approval History */}
        {workflow?.approval_history && workflow.approval_history.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              Activity Log
            </div>
            <div className="space-y-1">
              {workflow.approval_history.slice(-5).reverse().map((action, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded bg-slate-900/50">
                  <div className="flex items-center gap-2">
                    <ActionIcon action={action.action} />
                    <span>{action.user_name}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {new Date(action.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActionIcon({ action }) {
  const config = {
    submitted: { icon: TrendingUp, color: 'text-blue-400' },
    approved: { icon: CheckCircle, color: 'text-emerald-400' },
    revision_requested: { icon: AlertCircle, color: 'text-red-400' },
    rejected: { icon: XCircle, color: 'text-red-400' }
  };

  const { icon: Icon, color } = config[action] || config.submitted;
  return <Icon className={cn("h-3 w-3", color)} />;
}