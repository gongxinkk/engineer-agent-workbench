export type Severity = "P0" | "P1" | "P2";
export type TicketStage = "confirm" | "observing";

export type Metric = {
  label: string;
  value: string;
  trend: string;
  tone: "good" | "warning" | "neutral";
};

export type TaskDetail = {
  id: string;
  actor?: "ai" | "human";
  status?: "completed" | "waiting" | "running";
  name: string;
  description: string;
  duration: string;
  input: string[];
  result: string[];
  output: string;
  logs: string[];
  evidence: string[];
};

export type Ticket = {
  id: string;
  severity: Severity;
  title: string;
  summaries: string[];
  reporter: string;
  initials: string;
  type: string;
  createdAt: string;
  location: string;
  impact: string[];
  alerts: string[];
  changes: string[];
  topology: string[];
  rootCause: string;
  confidence: number;
  solution: string;
  solutionSteps: string[];
  risk: string;
  rollback: string;
  expectedImpact: string;
  tasks: TaskDetail[];
  metrics: Metric[];
};

export type LogEntry = {
  time: string;
  title: string;
  detail: string;
  type: "ai" | "human" | "system";
};
