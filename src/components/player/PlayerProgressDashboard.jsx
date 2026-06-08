import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Users,
  BookOpen
} from 'lucide-react';

export default function PlayerProgressDashboard({ content, onExport }) {
  if (!content || content.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Player Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No published content yet.</p>
        </CardContent>
      </Card>
    );
  }

  const stats = {
    total: content.length,
    highCompletion: content.filter(c => {
      const rate = c.view_count > 0 ? (c.acknowledgement_count / c.view_count) * 100 : 0;
      return rate >= 80;
    }).length,
    needsAttention: content.filter(c => {
      const rate = c.view_count > 0 ? (c.acknowledgement_count / c.view_count) * 100 : 0;
      return rate < 50;
    }).length,
    averageConfidence: content.reduce((sum, c) => sum + (c.average_confidence || 0), 0) / content.length
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">High Completion</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.highCompletion}</div>
            <p className="text-xs text-muted-foreground">≥80% completion rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.needsAttention}</div>
            <p className="text-xs text-muted-foreground">&lt;50% completion rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageConfidence.toFixed(1)}/5</div>
          </CardContent>
        </Card>
      </div>

      {/* Content Progress Table */}
      <Card>
        <CardHeader>
          <CardTitle>Content Progress by Player</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Content</TableHead>
                <TableHead>Position Groups</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Acknowledged</TableHead>
                <TableHead>Completion</TableHead>
                <TableHead>Avg Confidence</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {content.map((item) => {
                const completionRate = item.view_count > 0 
                  ? Math.round((item.acknowledgement_count / item.view_count) * 100) 
                  : 0;
                
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {item.position_groups?.slice(0, 3).map(pos => (
                          <Badge key={pos} variant="outline" className="text-xs">
                            {pos}
                          </Badge>
                        ))}
                        {item.position_groups?.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{item.position_groups.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{item.view_count || 0}</TableCell>
                    <TableCell>{item.acknowledgement_count || 0}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={completionRate} className="h-2 w-20" />
                        <span className="text-sm">{completionRate}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.average_confidence >= 4 ? 'default' : 'secondary'}>
                        {item.average_confidence?.toFixed(1) || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {completionRate >= 80 ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Good
                        </Badge>
                      ) : completionRate >= 50 ? (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Clock className="h-3 w-3 mr-1" />
                          In Progress
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Needs Work
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}