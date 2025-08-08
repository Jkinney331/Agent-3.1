'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Activity,
  Settings,
  StopCircle,
  TrendingUp,
  TrendingDown,
  Zap
} from 'lucide-react';
import { useN8NData } from '@/hooks/use-n8n-data';

export function N8NWorkflowStatus() {
  const {
    workflows,
    recentExecutions,
    healthCheck,
    isLoading,
    error,
    refreshData,
    triggerWorkflow,
    emergencyStop
  } = useN8NData();

  const [triggeringWorkflow, setTriggeringWorkflow] = useState<string | null>(null);
  const [showParameters, setShowParameters] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'success':
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'running':
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
      case 'failed':
      case 'unhealthy':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'inactive':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'success':
      case 'healthy':
        return <CheckCircle className="h-4 w-4" />;
      case 'running':
        return <Activity className="h-4 w-4 animate-pulse" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'error':
      case 'failed':
      case 'unhealthy':
        return <StopCircle className="h-4 w-4" />;
      case 'inactive':
      default:
        return <Pause className="h-4 w-4" />;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const handleTriggerWorkflow = async (workflowId: string) => {
    setTriggeringWorkflow(workflowId);
    try {
      await triggerWorkflow(workflowId);
    } finally {
      setTriggeringWorkflow(null);
    }
  };

  const handleEmergencyStop = async () => {
    if (confirm('Are you sure you want to emergency stop all workflows? This will halt all trading activities.')) {
      await emergencyStop();
    }
  };

  if (isLoading && workflows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            n8n Workflow Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            n8n Workflow Status
            <Badge 
              variant="outline" 
              className={getStatusColor(healthCheck.status)}
            >
              {getStatusIcon(healthCheck.status)}
              <span className="ml-1">{healthCheck.status}</span>
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={refreshData}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleEmergencyStop}
              className="text-xs"
            >
              <StopCircle className="h-4 w-4 mr-1" />
              Emergency Stop
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button onClick={refreshData} variant="outline" size="sm" className="ml-2">
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {workflows.map((workflow) => {
            const runningExecution = recentExecutions.find(
              exec => exec.workflowId === workflow.id && exec.status === 'running'
            );

            return (
              <div 
                key={workflow.id} 
                className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{workflow.icon}</span>
                    <div>
                      <h3 className="font-medium text-sm">{workflow.displayName}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {workflow.executionCount} executions • {workflow.successRate.toFixed(1)}% success rate
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={getStatusColor(workflow.status)}
                    >
                      {getStatusIcon(workflow.status)}
                      <span className="ml-1">{workflow.status}</span>
                    </Badge>
                  </div>
                </div>

                {/* Execution Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Success Rate</div>
                    <div className="font-medium flex items-center justify-center gap-1">
                      {workflow.successRate > 90 ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : workflow.successRate < 70 ? (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      ) : null}
                      {workflow.successRate.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Errors</div>
                    <div className={`font-medium ${workflow.errorCount > 5 ? 'text-red-600' : ''}`}>
                      {workflow.errorCount}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Avg Runtime</div>
                    <div className="font-medium">
                      {workflow.averageRunTime > 0 ? formatDuration(workflow.averageRunTime) : '--'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Last Run</div>
                    <div className="font-medium">
                      {workflow.lastExecution ? formatTimeAgo(workflow.lastExecution) : 'Never'}
                    </div>
                  </div>
                </div>

                {/* Running Execution Progress */}
                {runningExecution && (
                  <div className="mb-3 p-2 bg-blue-50 rounded-md">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-blue-700 font-medium">Currently Running</span>
                      <span className="text-blue-600">
                        Started {formatTimeAgo(runningExecution.startedAt)}
                      </span>
                    </div>
                    <Progress value={undefined} className="mt-2 h-2" />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTriggerWorkflow(workflow.id)}
                    disabled={triggeringWorkflow === workflow.id || runningExecution !== undefined}
                  >
                    {triggeringWorkflow === workflow.id ? (
                      <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Play className="h-3 w-3 mr-1" />
                    )}
                    {runningExecution ? 'Running' : 'Trigger'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowParameters(
                      showParameters === workflow.id ? null : workflow.id
                    )}
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Parameters
                  </Button>
                </div>

                {/* Parameters Panel */}
                {showParameters === workflow.id && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <div className="text-xs text-muted-foreground mb-2">
                      Workflow Parameters (upcoming feature)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>Risk Level: Medium</div>
                      <div>Auto Execute: Enabled</div>
                      <div>Stop Loss: 2%</div>
                      <div>Take Profit: 5%</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {workflows.length === 0 && !isLoading && !error && (
          <div className="text-center text-muted-foreground py-8">
            <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No Workflows Found</p>
            <p className="text-sm">n8n workflows will appear here once configured.</p>
          </div>
        )}

        {/* Footer with system info */}
        {workflows.length > 0 && (
          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
            <div className="flex justify-between items-center">
              <span>
                Last updated: {new Date().toLocaleTimeString()}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Response time: {healthCheck.uptime}ms
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}