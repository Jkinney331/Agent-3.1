'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  History,
  Clock,
  CheckCircle,
  XCircle,
  PlayCircle,
  RefreshCw,
  AlertTriangle,
  Eye,
  ExternalLink,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react';
import { useN8NData } from '@/hooks/use-n8n-data';

export function WorkflowExecutionHistory() {
  const {
    workflows,
    recentExecutions,
    isLoading,
    error,
    refreshData
  } = useN8NData();

  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedExecution, setExpandedExecution] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'running':
        return <PlayCircle className="h-4 w-4 animate-pulse" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    const durationMs = end - start;
    
    if (durationMs < 1000) return `${durationMs}ms`;
    if (durationMs < 60000) return `${(durationMs / 1000).toFixed(1)}s`;
    return `${Math.floor(durationMs / 60000)}m ${Math.floor((durationMs % 60000) / 1000)}s`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getWorkflowDisplayName = (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId);
    return workflow ? workflow.displayName : workflowId;
  };

  const getWorkflowIcon = (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId);
    return workflow ? workflow.icon : '⚙️';
  };

  // Filter executions based on selected filters
  const filteredExecutions = recentExecutions.filter(execution => {
    const matchesWorkflow = selectedWorkflow === 'all' || execution.workflowId === selectedWorkflow;
    const matchesStatus = selectedStatus === 'all' || execution.status === selectedStatus;
    return matchesWorkflow && matchesStatus;
  });

  // Calculate stats
  const totalExecutions = filteredExecutions.length;
  const successfulExecutions = filteredExecutions.filter(e => e.status === 'success').length;
  const failedExecutions = filteredExecutions.filter(e => e.status === 'failed').length;
  const runningExecutions = filteredExecutions.filter(e => e.status === 'running').length;
  const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

  if (isLoading && recentExecutions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Workflow Execution History
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
            <History className="h-5 w-5" />
            Workflow Execution History
            <Badge variant="outline">
              {totalExecutions} executions
            </Badge>
          </div>
          <Button 
            size="sm" 
            variant="outline"
            onClick={refreshData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
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

        {/* Summary Stats */}
        {totalExecutions > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold">{totalExecutions}</div>
              <div className="text-xs text-muted-foreground">Total Runs</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
                <TrendingUp className="h-4 w-4" />
                {successfulExecutions}
              </div>
              <div className="text-xs text-muted-foreground">Successful</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600 flex items-center justify-center gap-1">
                <TrendingDown className="h-4 w-4" />
                {failedExecutions}
              </div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 flex items-center justify-center gap-1">
                <Activity className="h-4 w-4" />
                {successRate.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </div>
          </div>
        )}

        <Tabs value={selectedWorkflow} onValueChange={setSelectedWorkflow} className="mb-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Workflows</TabsTrigger>
            <TabsTrigger value="trading_engine">Trading</TabsTrigger>
            <TabsTrigger value="portfolio_monitor">Portfolio</TabsTrigger>
            <TabsTrigger value="notification_system">Notifications</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Status Filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            size="sm"
            variant={selectedStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedStatus('all')}
          >
            All Status
          </Button>
          <Button
            size="sm"
            variant={selectedStatus === 'success' ? 'default' : 'outline'}
            onClick={() => setSelectedStatus('success')}
            className="text-green-700"
          >
            Success
          </Button>
          <Button
            size="sm"
            variant={selectedStatus === 'failed' ? 'default' : 'outline'}
            onClick={() => setSelectedStatus('failed')}
            className="text-red-700"
          >
            Failed
          </Button>
          <Button
            size="sm"
            variant={selectedStatus === 'running' ? 'default' : 'outline'}
            onClick={() => setSelectedStatus('running')}
            className="text-blue-700"
          >
            Running
          </Button>
        </div>

        {/* Execution List */}
        <div className="space-y-3">
          {filteredExecutions.map((execution) => (
            <div 
              key={execution.id} 
              className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getWorkflowIcon(execution.workflowId)}</span>
                  <div>
                    <div className="font-medium text-sm">
                      {getWorkflowDisplayName(execution.workflowId)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ID: {execution.id.substring(0, 8)}...
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(execution.status)}
                  >
                    {getStatusIcon(execution.status)}
                    <span className="ml-1 capitalize">{execution.status}</span>
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <div className="text-muted-foreground">Started</div>
                  <div className="font-medium">{formatTimeAgo(execution.startedAt)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Duration</div>
                  <div className="font-medium">
                    {formatDuration(execution.startedAt, execution.finishedAt)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Status</div>
                  <div className={`font-medium ${
                    execution.status === 'success' ? 'text-green-600' :
                    execution.status === 'failed' ? 'text-red-600' :
                    execution.status === 'running' ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {execution.status === 'running' ? 'In Progress' : 
                     execution.status === 'success' ? 'Completed' :
                     execution.status === 'failed' ? 'Failed' : 'Unknown'}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Actions</div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setExpandedExecution(
                      expandedExecution === execution.id ? null : execution.id
                    )}
                    className="h-6 px-2"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Details
                  </Button>
                </div>
              </div>

              {/* Error Message */}
              {execution.error && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs">
                  <div className="flex items-center gap-1 text-red-800 font-medium mb-1">
                    <AlertTriangle className="h-3 w-3" />
                    Error Details
                  </div>
                  <div className="text-red-700 font-mono">{execution.error}</div>
                </div>
              )}

              {/* Expanded Details */}
              {expandedExecution === execution.id && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="font-medium mb-2">Execution Details</div>
                      <div className="space-y-1">
                        <div><span className="text-muted-foreground">Started:</span> {new Date(execution.startedAt).toLocaleString()}</div>
                        {execution.finishedAt && (
                          <div><span className="text-muted-foreground">Finished:</span> {new Date(execution.finishedAt).toLocaleString()}</div>
                        )}
                        <div><span className="text-muted-foreground">Duration:</span> {execution.duration ? `${execution.duration}ms` : formatDuration(execution.startedAt, execution.finishedAt)}</div>
                      </div>
                    </div>
                    
                    {execution.parameters && Object.keys(execution.parameters).length > 0 && (
                      <div>
                        <div className="font-medium mb-2">Parameters</div>
                        <div className="bg-white p-2 rounded border font-mono text-xs">
                          <pre>{JSON.stringify(execution.parameters, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {execution.data && (
                    <div className="mt-3">
                      <div className="font-medium mb-2">Output Data</div>
                      <div className="bg-white p-2 rounded border font-mono text-xs max-h-32 overflow-y-auto">
                        <pre>{JSON.stringify(execution.data, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredExecutions.length === 0 && !isLoading && !error && (
          <div className="text-center text-muted-foreground py-8">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No Execution History</p>
            <p className="text-sm">
              {selectedWorkflow !== 'all' || selectedStatus !== 'all' ? 
                'No executions match the selected filters.' :
                'Workflow executions will appear here once they start running.'
              }
            </p>
          </div>
        )}

        {/* Footer */}
        {filteredExecutions.length > 0 && (
          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground text-center">
            Showing {filteredExecutions.length} of {recentExecutions.length} total executions • 
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}