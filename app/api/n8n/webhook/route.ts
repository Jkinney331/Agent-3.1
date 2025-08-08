import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Enhanced webhook endpoint for n8n integration with comprehensive validation and security
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Get request headers and body
    const headersList = headers();
    const authHeader = headersList.get('authorization') || headersList.get('Authorization') || '';
    const contentType = headersList.get('content-type') || '';
    const userAgent = headersList.get('user-agent') || '';
    const origin = headersList.get('origin') || '';
    const forwardedFor = headersList.get('x-forwarded-for') || '';
    
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('❌ Webhook Body Parse Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON payload',
          requestId,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }
    
    // Comprehensive authentication validation
    const expectedBearer = `Bearer ${process.env.API_INTEGRATION_BEARER_TOKEN || 'ai-trading-bot-secure-2025-integration'}`;
    const isAuthenticated = authHeader === expectedBearer;
    
    if (!isAuthenticated) {
      console.error('🔒 Webhook Authentication Failed:', {
        requestId,
        hasAuth: !!authHeader,
        authMethod: authHeader.split(' ')[0] || 'none',
        origin,
        userAgent: userAgent.substring(0, 100)
      });
      
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - Invalid or missing authentication token',
          requestId,
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }
    
    // Request validation
    const validationErrors: string[] = [];
    
    if (!body || typeof body !== 'object') {
      validationErrors.push('Request body must be a valid JSON object');
    }
    
    if (!body.action && !body.type && !body.workflow) {
      validationErrors.push('Missing required parameter: action, type, or workflow');
    }
    
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationErrors,
          requestId,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }
    
    // Security checks
    const securityWarnings: string[] = [];
    
    // Check for suspicious user agents (but allow legitimate trading bots)
    if (userAgent.toLowerCase().includes('bot') && !userAgent.toLowerCase().includes('trading')) {
      securityWarnings.push('Suspicious user agent detected');
    }
    
    // Rate limiting check (basic implementation)
    const rateLimitKey = forwardedFor || 'unknown-ip';
    // Note: In production, implement proper rate limiting with Redis or similar
    
    // Log security warnings
    if (securityWarnings.length > 0) {
      console.warn('⚠️ Security Warnings:', {
        requestId,
        warnings: securityWarnings,
        clientInfo: {
          origin,
          userAgent: userAgent.substring(0, 100),
          ip: forwardedFor
        }
      });
    }
    
    // Determine target workflow and prepare payload
    const action = (body.action || body.type || body.workflow).toString().toUpperCase();\n    let targetEndpoint: string;\n    let workflowPayload: any;\n    let priority = 'MEDIUM';\n    \n    switch (action) {\n      case 'TRADING':\n      case 'TRADE':\n      case 'AI_TRADING':\n      case 'MARKET_ANALYSIS':\n        targetEndpoint = '/api/trading/enhanced-execution';\n        priority = 'HIGH';\n        workflowPayload = {\n          trigger: 'WEBHOOK_REQUEST',\n          symbol: body.symbol || 'BTC',\n          capital: body.capital || process.env.TRADING_CAPITAL || '50000',\n          riskTolerance: body.riskTolerance || process.env.RISK_TOLERANCE || 'MEDIUM',\n          requestId,\n          timestamp: new Date().toISOString(),\n          ...body\n        };\n        break;\n        \n      case 'PORTFOLIO':\n      case 'PERFORMANCE':\n      case 'RISK':\n      case 'MONITORING':\n        targetEndpoint = '/api/trading/positions';\n        priority = 'MEDIUM';\n        workflowPayload = {\n          trigger: 'WEBHOOK_REQUEST',\n          accountId: body.accountId || 'default',\n          includeHistory: body.includeHistory !== false,\n          requestId,\n          timestamp: new Date().toISOString(),\n          ...body\n        };\n        break;\n        \n      case 'NOTIFICATION':\n      case 'ALERT':\n      case 'NOTIFY':\n        targetEndpoint = '/api/notifications';\n        priority = body.priority || 'MEDIUM';\n        workflowPayload = {\n          body: {\n            type: body.notificationType || 'WEBHOOK_NOTIFICATION',\n            message: body.message || 'Webhook notification',\n            priority: body.priority || 'MEDIUM',\n            source: 'WEBHOOK_API',\n            requestId,\n            timestamp: new Date().toISOString()\n          },\n          ...body\n        };\n        break;\n        \n      default:\n        return NextResponse.json(\n          {\n            success: false,\n            error: `Unsupported action: ${action}`,\n            supportedActions: ['TRADING', 'PORTFOLIO', 'NOTIFICATION'],\n            requestId,\n            timestamp: new Date().toISOString()\n          },\n          { status: 400 }\n        );\n    }\n    \n    // Execute the target workflow\n    console.log('🔄 Executing Webhook Request:', {\n      requestId,\n      action,\n      targetEndpoint,\n      priority,\n      hasPayload: !!workflowPayload\n    });\n    \n    let workflowResponse;\n    let workflowSuccess = false;\n    let workflowError = null;\n    \n    try {\n      // Make internal API call to the appropriate endpoint\n      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';\n      const fullUrl = `${baseUrl}${targetEndpoint}`;\n      \n      const workflowRequest = await fetch(fullUrl, {\n        method: 'POST',\n        headers: {\n          'Content-Type': 'application/json',\n          'Authorization': authHeader,\n          'X-Request-ID': requestId,\n          'X-Priority': priority\n        },\n        body: JSON.stringify(workflowPayload)\n      });\n      \n      workflowResponse = await workflowRequest.json();\n      workflowSuccess = workflowRequest.ok && workflowResponse.success !== false;\n      \n      if (!workflowSuccess) {\n        workflowError = workflowResponse.error || `HTTP ${workflowRequest.status}`;\n      }\n    } catch (error: any) {\n      console.error('❌ Workflow Execution Error:', {\n        requestId,\n        error: error.message,\n        targetEndpoint\n      });\n      \n      workflowError = `Workflow execution failed: ${error.message}`;\n      workflowSuccess = false;\n    }\n    \n    // Calculate execution metrics\n    const executionTime = Date.now() - startTime;\n    \n    // Prepare response\n    const response = {\n      success: workflowSuccess,\n      requestId,\n      timestamp: new Date().toISOString(),\n      execution: {\n        action,\n        targetEndpoint,\n        priority,\n        executionTimeMs: executionTime,\n        workflowSuccess\n      },\n      data: workflowResponse || null,\n      error: workflowError,\n      metadata: {\n        version: '2.0.0',\n        source: 'webhook-api',\n        securityWarnings: securityWarnings.length > 0 ? securityWarnings : undefined\n      }\n    };\n    \n    // Log request for audit trail\n    console.log('✅ Webhook Request Completed:', {\n      requestId,\n      success: workflowSuccess,\n      action,\n      executionTime: `${executionTime}ms`,\n      origin: origin || 'unknown'\n    });\n    \n    // Store audit log in database (if Supabase is available)\n    try {\n      if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {\n        const auditData = {\n          request_id: requestId,\n          method: 'POST',\n          endpoint: '/api/n8n/webhook',\n          action,\n          target_endpoint: targetEndpoint,\n          priority,\n          client_ip: forwardedFor || 'unknown',\n          user_agent: userAgent.substring(0, 200),\n          origin: origin || 'unknown',\n          auth_valid: isAuthenticated,\n          response_status: workflowSuccess ? 'SUCCESS' : 'FAILED',\n          execution_time_ms: executionTime,\n          request_payload: JSON.stringify(body),\n          response_data: JSON.stringify(workflowResponse || {}),\n          security_warnings: securityWarnings.length > 0 ? JSON.stringify(securityWarnings) : null,\n          created_at: new Date().toISOString()\n        };\n        \n        await fetch(`${process.env.SUPABASE_URL}/rest/v1/webhook_requests`, {\n          method: 'POST',\n          headers: {\n            'apikey': process.env.SUPABASE_ANON_KEY,\n            'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,\n            'Content-Type': 'application/json',\n            'Prefer': 'return=minimal'\n          },\n          body: JSON.stringify(auditData)\n        });\n      }\n    } catch (auditError: any) {\n      console.error('⚠️ Audit Log Error (non-critical):', auditError.message);\n    }\n    \n    // Return appropriate status code\n    const statusCode = workflowSuccess ? 200 : (workflowError?.includes('Unauthorized') ? 401 : 500);\n    \n    return NextResponse.json(response, {\n      status: statusCode,\n      headers: {\n        'X-Request-ID': requestId,\n        'X-Execution-Time': `${executionTime}ms`,\n        'X-API-Version': '2.0.0'\n      }\n    });\n    \n  } catch (error: any) {\n    const executionTime = Date.now() - startTime;\n    \n    console.error('💥 Webhook Critical Error:', {\n      requestId,\n      error: error.message,\n      stack: error.stack,\n      executionTime: `${executionTime}ms`\n    });\n    \n    return NextResponse.json(\n      {\n        success: false,\n        error: 'Internal server error',\n        details: process.env.NODE_ENV === 'development' ? error.message : undefined,\n        requestId,\n        timestamp: new Date().toISOString(),\n        executionTimeMs: executionTime\n      },\n      { status: 500 }\n    );\n  }\n}\n\n// Handle OPTIONS for CORS preflight\nexport async function OPTIONS(request: NextRequest) {\n  return NextResponse.json(\n    { message: 'OK' },\n    {\n      status: 200,\n      headers: {\n        'Access-Control-Allow-Origin': '*',\n        'Access-Control-Allow-Methods': 'POST, OPTIONS',\n        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID, X-Priority',\n        'Access-Control-Max-Age': '86400'\n      }\n    }\n  );\n}\n\n// Handle GET for health check\nexport async function GET(request: NextRequest) {\n  const timestamp = new Date().toISOString();\n  \n  return NextResponse.json(\n    {\n      status: 'operational',\n      service: 'n8n-webhook-api',\n      version: '2.0.0',\n      timestamp,\n      endpoints: {\n        webhook: '/api/n8n/webhook',\n        methods: ['POST'],\n        authentication: 'Bearer token required',\n        supportedActions: ['TRADING', 'PORTFOLIO', 'NOTIFICATION']\n      },\n      health: {\n        database: process.env.SUPABASE_URL ? 'configured' : 'not-configured',\n        authentication: process.env.API_INTEGRATION_BEARER_TOKEN ? 'configured' : 'not-configured',\n        tradingCapital: process.env.TRADING_CAPITAL || '50000'\n      }\n    },\n    {\n      status: 200,\n      headers: {\n        'X-API-Version': '2.0.0',\n        'X-Health-Check': timestamp\n      }\n    }\n  );\n}"