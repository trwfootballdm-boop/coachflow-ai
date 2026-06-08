import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Trophy, 
  TrendingUp,
  Play,
  Calendar,
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function PlayerDashboard() {
  const [selectedPosition, setSelectedPosition] = useState('all');
  const queryClient = useQueryClient();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['playerDashboard', selectedPosition],
    queryFn: async () => {
      const user = await base44.auth.me();
      const teams = await base44.entities.Team.filter({ active: true });
      if (teams.length === 0) return null;
      
      const response = await base44.functions.invoke('getPlayerDashboard', {
        team_id: teams[0].id,
        position: selectedPosition === 'all' ? null : selectedPosition
      });
      return response.data;
    }
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ player_content_id, progress_data }) => {
      const teams = await base44.entities.Team.filter({ active: true });
      return await base44.functions.invoke('updatePlayerProgress', {
        team_id: teams[0].id,
        player_content_id,
        progress_data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playerDashboard'] });
    }
  });

  const handleConfidenceRating = (contentId, rating) => {
    updateProgressMutation.mutate({
      player_content_id: contentId,
      progress_data: {
        confidence_rating: rating,
        confidence_rated_date: new Date().toISOString()
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">No Content Available</h1>
          <p className="text-muted-foreground">Check back later for install materials.</p>
        </div>
      </div>
    );
  }

  const { content, weekly_packages, stats } = dashboard;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">My Install</h1>
            <p className="text-muted-foreground">Weekly playbooks and assignments</p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {stats.completion_rate}% Complete
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Plays</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Confidence</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.average_confidence || '-'}/5</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="content" className="space-y-4">
          <TabsList>
            <TabsTrigger value="content">This Week</TabsTrigger>
            <TabsTrigger value="weekly">Weekly Packages</TabsTrigger>
            <TabsTrigger value="progress">My Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            {content.map((item) => (
              <PlayerContentCard
                key={item.id}
                content={item}
                progress={item.progress}
                onConfidenceRate={(rating) => handleConfidenceRating(item.id, rating)}
              />
            ))}
          </TabsContent>

          <TabsContent value="weekly" className="space-y-4">
            {weekly_packages.map((pkg) => (
              <WeeklyPackageCard key={pkg.id} package={pkg} />
            ))}
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <ProgressOverview content={content} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function PlayerContentCard({ content, progress, onConfidenceRate }) {
  const [showConfidence, setShowConfidence] = useState(false);
  const isCompleted = progress?.passed_quiz || progress?.confidence_rating >= 4;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border rounded-lg p-6 bg-card"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{content.title}</h3>
            {isCompleted && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{content.side_of_ball}</Badge>
            {content.position_groups?.map(pos => (
              <Badge key={pos} variant="outline">{pos}</Badge>
            ))}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowConfidence(!showConfidence)}
        >
          {progress?.confidence_rating ? `Rated: ${progress.confidence_rating}/5` : 'Rate Confidence'}
        </Button>
      </div>

      {content.description && (
        <p className="text-muted-foreground mb-4">{content.description}</p>
      )}

      {showConfidence && (
        <div className="mb-4 p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">How confident are you with this content?</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Button
                key={rating}
                variant={progress?.confidence_rating === rating ? 'default' : 'outline'}
                size="sm"
                onClick={() => onConfidenceRate(rating)}
              >
                {rating}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            1 = Not confident, 5 = Very confident
          </p>
        </div>
      )}

      {progress && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Last studied: {new Date(progress.last_activity_date).toLocaleDateString()}</span>
          {progress.quiz_score && (
            <span>Quiz: {Math.round(progress.quiz_score)}%</span>
          )}
        </div>
      )}
    </motion.div>
  );
}

function WeeklyPackageCard({ package: pkg }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Week {pkg.week_number} - {pkg.opponent_name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{pkg.description}</p>
        <div className="grid gap-2 md:grid-cols-3">
          {pkg.offense_content_ids?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-1">Offense</h4>
              <p className="text-sm text-muted-foreground">
                {pkg.offense_content_ids.length} plays
              </p>
            </div>
          )}
          {pkg.defense_content_ids?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-1">Defense</h4>
              <p className="text-sm text-muted-foreground">
                {pkg.defense_content_ids.length} plays
              </p>
            </div>
          )}
          {pkg.special_teams_content_ids?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-1">Special Teams</h4>
              <p className="text-sm text-muted-foreground">
                {pkg.special_teams_content_ids.length} plays
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressOverview({ content }) {
  const completed = content.filter(c => c.progress?.passed_quiz || c.progress?.confidence_rating >= 4);
  const inProgress = content.filter(c => c.progress && !completed.includes(c));
  const notStarted = content.filter(c => !c.progress);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Completed ({completed.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {completed.length === 0 ? (
            <p className="text-muted-foreground">No completed content yet</p>
          ) : (
            <ul className="space-y-2">
              {completed.map(c => (
                <li key={c.id} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{c.title}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>In Progress ({inProgress.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {inProgress.length === 0 ? (
            <p className="text-muted-foreground">Nothing in progress</p>
          ) : (
            <ul className="space-y-2">
              {inProgress.map(c => (
                <li key={c.id} className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span>{c.title}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Not Started ({notStarted.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {notStarted.length === 0 ? (
            <p className="text-muted-foreground">All content started!</p>
          ) : (
            <ul className="space-y-2">
              {notStarted.map(c => (
                <li key={c.id} className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span>{c.title}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}