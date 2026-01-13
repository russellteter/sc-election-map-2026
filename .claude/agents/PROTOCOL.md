# Inter-Agent Communication Protocol

## Overview

This document defines how agents communicate, coordinate, and hand off work in the SC Election Map multi-agent system.

## Message Format

```typescript
interface AgentMessage {
  // Metadata
  id: string;                    // Unique message ID
  timestamp: string;             // ISO-8601 timestamp

  // Routing
  source: AgentType;             // Sending agent
  target: AgentType | 'broadcast' | 'orchestrator';

  // Classification
  type: 'request' | 'response' | 'alert' | 'handoff';
  priority: 'low' | 'medium' | 'high' | 'critical';

  // Content
  payload: {
    task: string;                // What needs to be done
    context: string[];           // Relevant file paths or info
    artifacts?: string[];        // Generated files/outputs
    status?: 'pending' | 'in_progress' | 'completed' | 'blocked';
  };

  // Response handling
  requires_response: boolean;
  response_deadline?: string;    // ISO-8601 if time-sensitive
}

type AgentType =
  | 'strategic-planner'
  | 'qa-testing'
  | 'ui-ux'
  | 'data-pipeline'
  | 'performance'
  | 'documentation';
```

## Communication Patterns

### 1. Request-Response
```
Agent A ──request──► Agent B
Agent A ◄──response── Agent B
```
Used for: Task assignments, information queries, approvals

### 2. Broadcast
```
Agent A ──broadcast──► All Agents
```
Used for: Status updates, critical alerts, phase changes

### 3. Handoff
```
Agent A ──handoff──► Agent B
         (includes context and artifacts)
```
Used for: Workflow transitions, dependent tasks

### 4. Escalation
```
Agent A ──escalate──► Orchestrator ──assign──► Agent B
```
Used for: Blocked tasks, priority conflicts, cross-agent issues

## Workflow Orchestration

### Feature Development Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FEATURE DEVELOPMENT WORKFLOW                      │
└─────────────────────────────────────────────────────────────────────┘

[User Request]
     │
     ▼
┌─────────────────┐
│   ORCHESTRATOR  │ ◄─── Central coordination (Claude Code)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    STRATEGIC    │ 1. Analyze request
│    PLANNER      │ 2. Create task breakdown
│                 │ 3. Assign to agents
└────────┬────────┘
         │
    ┌────┴────┬────────────┐
    │         │            │
    ▼         ▼            ▼
┌───────┐ ┌───────┐ ┌─────────────┐
│ UI/UX │ │ DATA  │ │ PERFORMANCE │  Parallel work
└───┬───┘ └───┬───┘ └──────┬──────┘
    │         │            │
    └────┬────┴────────────┘
         │
         ▼
┌─────────────────┐
│   QA/TESTING    │ 4. Comprehensive testing
│                 │ 5. Evidence collection
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ DOCUMENTATION   │ 6. Update docs
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    STRATEGIC    │ 7. Review and approve
│    PLANNER      │ 8. Release decision
└────────┬────────┘
         │
         ▼
[Release / Deploy]
```

### Bug Fix Flow

```
[Bug Report]
     │
     ▼
┌─────────────────┐
│   QA/TESTING    │ 1. Reproduce and document
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    STRATEGIC    │ 2. Prioritize
│    PLANNER      │ 3. Assign fix
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Assigned Agent │ 4. Implement fix
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   QA/TESTING    │ 5. Verify fix
└────────┬────────┘
         │
         ▼
[Deploy]
```

## Priority Levels

| Priority | Response Time | Use Case |
|----------|---------------|----------|
| Critical | Immediate | Production down, data corruption |
| High | < 1 hour | User-facing bugs, blocking issues |
| Medium | < 4 hours | Feature work, improvements |
| Low | < 24 hours | Documentation, minor enhancements |

## Agent Capabilities Matrix

| Capability | Planner | QA | UI/UX | Data | Perf | Docs |
|------------|---------|-----|-------|------|------|------|
| Read files | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Write code | - | - | ✓ | ✓ | ✓ | - |
| Run tests | - | ✓ | - | - | ✓ | - |
| Deploy | - | - | - | - | - | - |
| Approve release | ✓ | - | - | - | - | - |
| Update docs | - | - | - | - | - | ✓ |

## Handoff Templates

### Strategic Planner → UI/UX
```json
{
  "type": "handoff",
  "source": "strategic-planner",
  "target": "ui-ux",
  "payload": {
    "task": "Implement new FilterPanel component",
    "context": [
      "See design spec in docs/designs/filter-panel.md",
      "Must be accessible (WCAG 2.1 AA)",
      "Mobile-first responsive"
    ],
    "artifacts": ["mockups/filter-panel.png"],
    "status": "pending"
  },
  "requires_response": true
}
```

### UI/UX → QA/Testing
```json
{
  "type": "handoff",
  "source": "ui-ux",
  "target": "qa-testing",
  "payload": {
    "task": "Test FilterPanel implementation",
    "context": [
      "Component at src/components/FilterPanel.tsx",
      "Verify accessibility compliance",
      "Test all filter combinations"
    ],
    "artifacts": ["src/components/FilterPanel.tsx"],
    "status": "pending"
  },
  "requires_response": true
}
```

### QA/Testing → Strategic Planner
```json
{
  "type": "response",
  "source": "qa-testing",
  "target": "strategic-planner",
  "payload": {
    "task": "FilterPanel test results",
    "context": [
      "All tests passed",
      "Lighthouse accessibility: 98",
      "No regressions detected"
    ],
    "artifacts": ["test-results/filter-panel-report.json"],
    "status": "completed"
  }
}
```

## Conflict Resolution

### Priority Conflicts
1. Escalate to Strategic Planner
2. Planner evaluates business impact
3. Planner assigns priority order
4. Affected agents acknowledge

### Resource Conflicts
1. Identify shared resource
2. Propose sequencing or parallel paths
3. Strategic Planner approves approach
4. Agents coordinate execution

### Technical Disagreements
1. Document positions
2. Escalate to Strategic Planner
3. Planner may request Orchestrator input
4. Decision recorded in project docs

## Monitoring and Reporting

### Daily Status
Each agent reports:
- Tasks completed
- Tasks in progress
- Blockers encountered
- Estimated completion times

### Weekly Summary
Strategic Planner consolidates:
- Features delivered
- Quality metrics
- Performance trends
- Upcoming priorities

## Implementation Notes

### Using Task Tool for Agent Communication
```
// Launch specific agent
Task tool with subagent_type="[agent-type]"

// Provide context via prompt
prompt: "See /path/to/handoff.json for task details"

// Agent reads context and executes
```

### Coordination via Orchestrator
The orchestrator (Claude Code main session) coordinates by:
1. Reading agent configuration files
2. Launching appropriate agents via Task tool
3. Collecting and routing responses
4. Maintaining workflow state via TodoWrite
