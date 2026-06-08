import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTeam } from '@/components/TeamContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  FileText, 
  TrendingUp,
  AlertCircle,
  Activity
} from 'lucide-react';
import StaffManagementPanel from '@/components/collaboration/StaffManagementPanel';

export default function Collaboration() {
  const { activeTeamId } = useTeam();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: recentActivity } = useQuery({
    queryKey: ['recentActivity', activeTeamId],
    queryFn: async () => {
      const changes = await base44.entities.ChangeLog.filter({
        team_id: activeTeamId
      }, '-timestamp', 20);
      return changes;
    },
    enabled: !!activeTeamId
  });

  const { data: pendingApprovals } = useQuery({
    queryKey: ['pendingApprovals', activeTeamId],
    queryFn: async () => {
      const workflows = await base44.entities.ApprovalWorkflow.filter({
        team_id: activeTeamId,
        status: 'pending_review',
        active: true
      });
      return workflows;
    },
    enabled: !!activeTeamId
  });

  const { data: recentComments } = useQuery({
    queryKey: ['recentComments', activeTeamId],
    queryFn: async () => {
      const comments = await base44.entities.CollaborationComment.filter({
        team_id: activeTeamId,
        active: true
      }, '-created_date', 10);
      return comments;
    },
    enabled: !!activeTeamId
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Collaboration Hub</h1>
            <p className="text-muted-foreground">Manage staff, approvals, and team communication</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Pending Approvals"
                value={pendingApprovals?.length || 0}
                icon={Clock}
                color="text-amber-400"
                bgColor="bg-amber-900/20"
              />
              <StatCard
                title="Recent Comments"
                value={recentComments?.length || 0}
                icon={MessageSquare}
                color="text-blue-400"
                bgColor="bg-blue-900/20"
              />
              <StatCard
                title="Recent Changes"
                value={recentActivity?.length || 0}
                icon={Activity}
                color="text-emerald-400"
                bgColor="bg-emerald-900/20"
              />
              <StatCard
                title="Active Projects"
                value="-"
                icon={FileText}
                color="text-purple-400"
                bgColor="bg-purple-900/20"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {recentActivity?.slice(0, 8).map(change => (
                        <div key={change.id} className="flex items-start gap-3 p-2 rounded bg-slate-800/50">
                          <ChangeTypeIcon changeType={change.change_type} />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{change.user_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {change.change_summary || `${change.change_type} ${change.entity_type}`}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {new Date(change.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Recent Comments */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Recent Comments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {recentComments?.slice(0, 8).map(comment => (
                        <div key={comment.id} className="p-2 rounded bg-slate-800/50">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-[10px] h-5">
                              {comment.comment_type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.created_date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm line-clamp-2">{comment.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            on {comment.parent_type}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="staff">
            <StaffManagementPanel teamId={activeTeamId} />
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Full Activity Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {recentActivity?.map(change => (
                      <div key={change.id} className="p-3 rounded-lg border bg-slate-800/50">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <ChangeTypeIcon changeType={change.change_type} />
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{change.user_name}</span>
                                <Badge variant="outline" className="text-[10px]">
                                  {change.user_role || 'Coach'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {change.change_summary || `Changed ${change.entity_type}`}
                              </p>
                              {change.changed_fields?.length > 0 && (
                                <div className="text-xs text-slate-400 space-y-1">
                                  {change.changed_fields.map((field, idx) => (
                                    <div key={idx}>
                                      <span className="font-medium">{field.field_label}:</span>{' '}
                                      {field.old_value} → {field.new_value}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(change.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bgColor }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${bgColor}`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChangeTypeIcon({ changeType }) {
  const config = {
    create: { icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-900/20' },
    update: { icon: Activity, color: 'text-blue-400', bg: 'bg-blue-900/20' },
    delete: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-900/20' },
    status_change: { icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-900/20' },
    approval_change: { icon: CheckCircle, color: 'text-purple-400', bg: 'bg-purple-900/20' }
  };

  const { icon: Icon, color, bg } = config[changeType] || config.update;

  return (
    <div className={`p-2 rounded ${bg}`}>
      <Icon className={`h-4 w-4 ${color}`} />
    </div>
  );
}