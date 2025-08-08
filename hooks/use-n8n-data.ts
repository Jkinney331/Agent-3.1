import { useState, useEffect, useCallback } from 'react';

interface WorkflowStatus {
  id: string;
  name: string;
  displayName: string;
  status: 'active' | 'inactive' | 'error' | 'warning';
  lastExecution: string | null;
  lastExecutionStatus: 'success' | 'failed' | 'running' | null;
  executionCount: number;
  successRate: number;
  errorCount: number;
  averageRunTime: number;
  icon: string;
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'success' | 'failed' | 'running';
  startedAt: string;
  finishedAt?: string;
  duration?: number;
  error?: string;
  data?: any;
  parameters?: Record<string, any>;
}

interface APIConnectionStatus {
  service: string;
  status: 'connected' | 'disconnected' | 'error' | 'warning';
  lastCheck: string;
  responseTime?: number;
  rateLimitUsage?: {
    used: number;
    remaining: number;
    resetTime: string;
  };
  error?: string;
}

interface N8NHealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  uptime: number;
  version?: string;
  lastHealthCheck: string;
  details?: string;
}

interface N8NData {
  workflows: WorkflowStatus[];
  recentExecutions: WorkflowExecution[];
  apiConnections: APIConnectionStatus[];
  healthCheck: N8NHealthCheck;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  triggerWorkflow: (workflowId: string, parameters?: Record<string, any>) => Promise<boolean>;
  stopWorkflow: (executionId: string) => Promise<boolean>;
  emergencyStop: () => Promise<boolean>;
}

const WORKFLOW_DEFINITIONS: Omit<WorkflowStatus, 'status' | 'lastExecution' | 'lastExecutionStatus' | 'executionCount' | 'successRate' | 'errorCount' | 'averageRunTime'>[] = [
  {
    id: 'trading_engine',
    name: 'advanced-ai-trading-engine',
    displayName: 'ADVANCED AI TRADING ENGINE - All-in-One',
    icon: '🚀'
  },
  {
    id: 'portfolio_monitor',
    name: 'portfolio-risk-monitor',
    displayName: 'PORTFOLIO & RISK MONITOR - Comprehensive',
    icon: '💼'
  },
  {
    id: 'notification_system',
    name: 'smart-notification-system',
    displayName: 'SMART NOTIFICATION SYSTEM - All Channels',
    icon: '📱'
  }
];

const API_SERVICES = [
  { id: 'alpaca', name: 'Alpaca (Paper Trading)', icon: '📈' },
  { id: 'coingecko', name: 'CoinGecko (Market Data)', icon: '🪙' },
  { id: 'alpha_vantage', name: 'Alpha Vantage (Sentiment)', icon: '📊' },
  { id: 'binance', name: 'Binance (Crypto Data)', icon: '🟡' },
  { id: 'supabase', name: 'Supabase (Database)', icon: '🗃️' }
];

export function useN8NData(): N8NData {
  const [workflows, setWorkflows] = useState<WorkflowStatus[]>([]);
  const [recentExecutions, setRecentExecutions] = useState<WorkflowExecution[]>([]);
  const [apiConnections, setApiConnections] = useState<APIConnectionStatus[]>([]);
  const [healthCheck, setHealthCheck] = useState<N8NHealthCheck>({
    status: 'unhealthy',
    uptime: 0,
    lastHealthCheck: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflowStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/n8n/integration?action=status');
      const result = await response.json();

      if (result.success && result.data) {
        // Map workflow status from API response
        const workflowStatuses: WorkflowStatus[] = WORKFLOW_DEFINITIONS.map(workflow => {
          const apiData = result.data.workflows?.find((w: any) => w.name === workflow.name) || {};
          
          return {
            ...workflow,
            status: apiData.active ? 'active' : 'inactive',
            lastExecution: apiData.lastExecution || null,
            lastExecutionStatus: apiData.lastStatus || null,
            executionCount: apiData.executionCount || 0,
            successRate: apiData.successRate || 0,
            errorCount: apiData.errorCount || 0,
            averageRunTime: apiData.averageRunTime || 0
          };
        });

        setWorkflows(workflowStatuses);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error fetching workflow status:', err);
      return false;
    }
  }, []);

  const fetchExecutionHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/n8n/integration?action=get_executions');
      const result = await response.json();

      if (result.success && result.data?.executions) {
        setRecentExecutions(result.data.executions.slice(0, 20)); // Keep last 20 executions
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error fetching execution history:', err);
      return false;
    }
  }, []);

  const fetchAPIStatus = useCallback(async () => {
    try {
      const connections: APIConnectionStatus[] = [];
      
      // Check each API service status
      for (const service of API_SERVICES) {
        try {
          const startTime = Date.now();
          let response;
          let serviceStatus: APIConnectionStatus['status'] = 'disconnected';
          let responseTime: number | undefined;
          let rateLimitUsage;
          let error: string | undefined;

          switch (service.id) {
            case 'alpaca':
              response = await fetch('/api/trading/real-time-data?action=connection-test', { 
                method: 'GET',
                headers: { 'Accept': 'application/json' }
              });
              break;
            case 'coingecko':
              response = await fetch('/api/crypto?symbols=bitcoin', {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
              });
              break;
            case 'alpha_vantage':
              response = await fetch('/api/alpha-vantage?action=test', {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
              });
              break;
            default:
              // For other services, use n8n health check as proxy
              response = await fetch('/api/n8n/integration?action=health');
          }

          responseTime = Date.now() - startTime;

          if (response && response.ok) {
            const result = await response.json();
            if (result.success !== false) {
              serviceStatus = 'connected';
              
              // Extract rate limit info if available
              const rateLimitHeader = response.headers.get('x-ratelimit-remaining');
              if (rateLimitHeader) {
                rateLimitUsage = {
                  used: parseInt(response.headers.get('x-ratelimit-used') || '0'),
                  remaining: parseInt(rateLimitHeader),
                  resetTime: response.headers.get('x-ratelimit-reset') || new Date(Date.now() + 3600000).toISOString()
                };
              }
            } else {
              serviceStatus = 'error';
              error = result.error;
            }
          } else {
            serviceStatus = 'error';
            error = `HTTP ${response?.status} ${response?.statusText}`;
          }

          connections.push({
            service: service.name,
            status: serviceStatus,
            lastCheck: new Date().toISOString(),
            responseTime,
            rateLimitUsage,
            error
          });

        } catch (err) {
          connections.push({
            service: service.name,
            status: 'error',
            lastCheck: new Date().toISOString(),
            error: err instanceof Error ? err.message : 'Connection failed'
          });
        }
      }

      setApiConnections(connections);
      return true;
    } catch (err) {
      console.error('Error checking API status:', err);
      return false;
    }
  }, []);

  const fetchHealthCheck = useCallback(async () => {
    try {
      const startTime = Date.now();
      const response = await fetch('/api/n8n/integration?action=health');
      const result = await response.json();
      
      const responseTime = Date.now() - startTime;

      if (result.success && result.data) {
        setHealthCheck({
          status: result.data.status === 'healthy' ? 'healthy' : 'unhealthy',
          uptime: responseTime,
          version: result.data.version,
          lastHealthCheck: new Date().toISOString(),
          details: result.data.details
        });
        return true;
      } else {
        setHealthCheck({
          status: 'unhealthy',
          uptime: responseTime,
          lastHealthCheck: new Date().toISOString(),
          details: result.error || 'Health check failed'
        });
        return false;
      }
    } catch (err) {
      setHealthCheck({
        status: 'unhealthy',
        uptime: 0,
        lastHealthCheck: new Date().toISOString(),
        details: err instanceof Error ? err.message : 'Health check error'
      });
      return false;
    }
  }, []);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [workflowSuccess, executionSuccess, apiSuccess, healthSuccess] = await Promise.all([
        fetchWorkflowStatus(),
        fetchExecutionHistory(),
        fetchAPIStatus(),
        fetchHealthCheck()
      ]);

      if (!workflowSuccess && !executionSuccess && !apiSuccess && !healthSuccess) {
        throw new Error('Failed to fetch n8n data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch n8n data');
    } finally {
      setIsLoading(false);
    }
  }, [fetchWorkflowStatus, fetchExecutionHistory, fetchAPIStatus, fetchHealthCheck]);

  const triggerWorkflow = useCallback(async (workflowId: string, parameters?: Record<string, any>): Promise<boolean> => {
    try {
      const response = await fetch('/api/n8n/integration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'execute_trade', // This will be mapped to the correct workflow
          workflow: workflowId,
          payload: parameters || {},
          metadata: {
            source: 'manual-trigger',
            userId: 'dashboard-user'
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Refresh data after successful trigger
        await refreshData();
        return true;
      } else {
        console.error('Failed to trigger workflow:', result.error);
        return false;
      }
    } catch (err) {
      console.error('Error triggering workflow:', err);
      return false;
    }
  }, [refreshData]);

  const stopWorkflow = useCallback(async (executionId: string): Promise<boolean> => {
    try {
      // Note: This would require implementing a stop endpoint in the n8n integration
      const response = await fetch('/api/n8n/integration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'stop_execution',
          payload: { executionId }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        await refreshData();
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error stopping workflow:', err);
      return false;
    }
  }, [refreshData]);

  const emergencyStop = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/n8n/integration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'emergency_stop',
          payload: {},
          metadata: { priority: 'critical' }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        await refreshData();
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error executing emergency stop:', err);
      return false;
    }
  }, [refreshData]);

  // Initial data fetch
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Real-time updates via polling
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 15000); // Update every 15 seconds

    return () => clearInterval(interval);
  }, [refreshData]);

  return {
    workflows,
    recentExecutions,
    apiConnections,
    healthCheck,
    isLoading,
    error,
    refreshData,
    triggerWorkflow,
    stopWorkflow,
    emergencyStop
  };
}