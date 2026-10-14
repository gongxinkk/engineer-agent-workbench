import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Database,
  FileSearch,
  GitBranch,
  History,
  ListFilter,
  Network,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  UserRound,
  Users,
  X,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { tickets } from "./data";
import type { LogEntry, TaskDetail, Ticket, TicketStage } from "./types";

const INITIAL_LOGS: LogEntry[] = [
  { time: "20:33:42", title: "AI 自动核查已完成", detail: "确认后发布方案，启动持续观察", type: "ai" },
  { time: "20:32:18", title: "已生成推荐解决方案", detail: "关联 5 条历史事件与 2 篇知识文档", type: "ai" },
  { time: "20:31:06", title: "候选根因已确认", detail: "证据链完整度 92%，进入解决方案检索", type: "ai" },
];

function App() {
  const [selectedId, setSelectedId] = useState(tickets[0].id);
  const [activeView, setActiveView] = useState<"mine" | "agent">("mine");
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("全部状态");
  const [type, setType] = useState("全部类型");
  const [activeTab, setActiveTab] = useState("处理流程");
  const [selectedTask, setSelectedTask] = useState<TaskDetail | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [stages, setStages] = useState<Record<string, TicketStage>>({});
  const [logs, setLogs] = useState<Record<string, LogEntry[]>>({});
  const [tick, setTick] = useState(0);
  const [mobileListOpen, setMobileListOpen] = useState(false);

  const ticket = tickets.find((item) => item.id === selectedId) ?? tickets[0];
  const stage = stages[ticket.id] ?? "confirm";
  const ticketLogs = logs[ticket.id] ?? INITIAL_LOGS;

  const filteredTickets = useMemo(() => {
    return tickets.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.id.toLowerCase().includes(search.toLowerCase());
      const matchesSeverity = severity === "全部状态" || item.severity === severity;
      const matchesType = type === "全部类型" || item.type === type;
      return matchesSearch && matchesSeverity && matchesType;
    });
  }, [search, severity, type]);

  useEffect(() => {
    if (stage !== "observing") return;
    const interval = window.setInterval(() => setTick((current) => current + 1), 2600);
    return () => window.clearInterval(interval);
  }, [stage]);

  const publish = () => {
    const now = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    setStages((current) => ({ ...current, [ticket.id]: "observing" }));
    setLogs((current) => ({
      ...current,
      [ticket.id]: [
        {
          time: now,
          title: "解决方案已由工程师确认发布",
          detail: "自动执行完成，AI 已接管持续观察",
          type: "human",
        },
        ...(current[ticket.id] ?? INITIAL_LOGS),
      ],
    }));
    setConfirming(false);
  };

  const selectTicket = (id: string) => {
    setSelectedId(id);
    setActiveTab("处理流程");
    setSelectedTask(null);
    setMobileListOpen(false);
  };

  return (
    <div className="app-shell">
      <Header activeView={activeView} onView={setActiveView} onOpenList={() => setMobileListOpen(true)} />
      <div className="app-body">
        <TicketSidebar
          tickets={filteredTickets}
          selectedId={selectedId}
          onSelect={selectTicket}
          search={search}
          setSearch={setSearch}
          severity={severity}
          setSeverity={setSeverity}
          type={type}
          setType={setType}
          mobileOpen={mobileListOpen}
          onClose={() => setMobileListOpen(false)}
        />
        <main className="workspace">
          {activeView === "mine" ? (
            <>
              <TicketHeader ticket={ticket} stage={stage} activeTab={activeTab} onTab={setActiveTab} />
              {activeTab === "处理流程" && (
                <>
                  <FlowWorkspace ticket={ticket} stage={stage} onTask={setSelectedTask} onConfirm={() => setConfirming(true)} />
                  {stage === "observing" && <Observability ticket={ticket} tick={tick} />}
                  <ActivityLog stage={stage} entries={ticketLogs} onConfirm={() => setConfirming(true)} />
                </>
              )}
              {activeTab === "能力包" && <CapabilityView />}
              {activeTab === "完整记录" && <FullHistory entries={ticketLogs} ticket={ticket} />}
            </>
          ) : (
            <AgentTaskView ticket={ticket} stage={stage} onTask={setSelectedTask} onBack={() => setActiveView("mine")} />
          )}
        </main>
      </div>
      {selectedTask && <TaskDrawer task={selectedTask} onClose={() => setSelectedTask(null)} />}
      {confirming && <ConfirmModal ticket={ticket} onCancel={() => setConfirming(false)} onConfirm={publish} />}
    </div>
  );
}

function Header({
  activeView,
  onView,
  onOpenList,
}: {
  activeView: "mine" | "agent";
  onView: (view: "mine" | "agent") => void;
  onOpenList: () => void;
}) {
  return (
    <header className="topbar">
      <div className="brand">
        <Button variant="ghost" size="icon" className="mobile-menu icon-button" onClick={onOpenList} aria-label="打开工单列表">
          <ListFilter size={18} />
        </Button>
        <span>工程师工作台</span>
      </div>
      <nav className="primary-nav">
        <Button variant="ghost" className={`nav-item ${activeView === "mine" ? "active" : ""}`} onClick={() => onView("mine")}>我的任务 <b>4</b></Button>
        <Button variant="ghost" className={`nav-item ${activeView === "agent" ? "active" : ""}`} onClick={() => onView("agent")}>Agent 任务 <b>12</b></Button>
      </nav>
      <div className="top-actions">
        <Button variant="ghost" size="icon" className="icon-button has-dot" aria-label="通知" title="通知"><Bell size={18} /></Button>
        <Button variant="ghost" size="icon" className="icon-button" aria-label="待办" title="待办任务"><CheckCircle2 size={18} /></Button>
        <Button variant="ghost" size="icon" className="icon-button ai-button" aria-label="Agent" title="Agent 状态" onClick={() => onView("agent")}><Bot size={18} /></Button>
        <Button variant="ghost" size="icon" className="icon-button" aria-label="设置" title="设置"><Settings size={18} /></Button>
        <div className="avatar avatar-dark">GX</div>
      </div>
    </header>
  );
}

type SidebarProps = {
  tickets: Ticket[];
  selectedId: string;
  onSelect: (id: string) => void;
  search: string;
  setSearch: (value: string) => void;
  severity: string;
  setSeverity: (value: string) => void;
  type: string;
  setType: (value: string) => void;
  mobileOpen: boolean;
  onClose: () => void;
};

function TicketSidebar(props: SidebarProps) {
  const types = ["全部类型", "网络问题", "安全事件", "资产问题", "基础设施"];
  return (
    <>
      {props.mobileOpen && <div className="mobile-scrim" onClick={props.onClose} />}
      <aside className={`ticket-sidebar ${props.mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-heading">
          <div>
            <p className="eyebrow">INBOX</p>
            <h2>我的工单</h2>
          </div>
          <Badge variant="secondary" className="count-badge">{props.tickets.length}</Badge>
          <Button variant="ghost" size="icon" className="mobile-close icon-button" onClick={props.onClose} aria-label="关闭"><X size={18} /></Button>
        </div>
        <div className="filters">
          <div className="filter-row">
            <Select value={props.severity} onValueChange={props.setSeverity}>
              <SelectTrigger size="sm" className="filter-select" aria-label="状态筛选"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["全部状态", "P0", "P1", "P2"].map((item) => <SelectItem value={item} key={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={props.type} onValueChange={props.setType}>
              <SelectTrigger size="sm" className="filter-select" aria-label="类型筛选"><SelectValue /></SelectTrigger>
              <SelectContent>
                {types.map((item) => <SelectItem value={item} key={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="search-box">
            <Search size={15} />
            <Input className="sidebar-search-input" value={props.search} onChange={(event) => props.setSearch(event.target.value)} placeholder="搜索工单编号或标题" />
          </div>
        </div>
        <div className="ticket-list">
          {props.tickets.map((item) => (
            <Button
              variant="ghost"
              key={item.id}
              className={`ticket-card ${props.selectedId === item.id ? "selected" : ""}`}
              onClick={() => props.onSelect(item.id)}
            >
              <div className="ticket-meta">
                <Badge variant="outline" className={`severity severity-${item.severity.toLowerCase()}`}>{item.severity}</Badge>
                <span>{item.id}</span>
                <span className="ticket-time">{item.createdAt}</span>
              </div>
              <h3>{item.title}</h3>
              <div className="summary-list">
                {item.summaries.map((line) => <span key={line}>{line}</span>)}
              </div>
              <div className="ticket-footer">
                <span className="person"><i className="avatar">{item.initials}</i>{item.reporter}</span>
                <Badge variant="secondary" className="type-tag">{item.type}</Badge>
              </div>
            </Button>
          ))}
          {props.tickets.length === 0 && <div className="empty-state">未找到匹配工单</div>}
        </div>
      </aside>
    </>
  );
}

function TicketHeader({
  ticket,
  stage,
  activeTab,
  onTab,
}: {
  ticket: Ticket;
  stage: TicketStage;
  activeTab: string;
  onTab: (tab: string) => void;
}) {
  return (
    <section className="ticket-header">
      <div className="breadcrumb">重大事件 <ChevronRight size={13} /> {ticket.id}</div>
      <div className="title-row">
        <div>
          <h1>{ticket.title}</h1>
          <div className="incident-facts">
            <span><Clock3 size={14} /> {ticket.createdAt} 创建</span>
            <span><Network size={14} /> {ticket.location}</span>
            <span><Users size={14} /> {ticket.reporter} 提交</span>
          </div>
        </div>
        <Badge variant="outline" className={`status-pill ${stage}`}>
          <i /> {stage === "confirm" ? "等待确认发布" : "持续观察中"}
        </Badge>
      </div>
      <Tabs value={activeTab} onValueChange={onTab} className="ticket-tabs">
        <TabsList variant="line" className="tabs">
          {["处理流程", "能力包", "完整记录"].map((tab) => (
            <TabsTrigger value={tab} key={tab}>{tab}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </section>
  );
}

function FlowWorkspace({
  ticket,
  stage,
  onTask,
  onConfirm,
}: {
  ticket: Ticket;
  stage: TicketStage;
  onTask: (task: TaskDetail) => void;
  onConfirm: () => void;
}) {
  const humanTask: TaskDetail = {
    id: "human-confirm",
    actor: "human",
    status: stage === "confirm" ? "waiting" : "completed",
    name: "协同方案并观察",
    description: "工程师核对推荐方案、风险与回滚预案后发布执行",
    duration: stage === "confirm" ? "等待工程师处理" : "已确认",
    input: ["候选根因", "推荐解决方案", "风险评估", "回滚预案"],
    result: [
      `推荐方案：${ticket.solution}`,
      `预计影响：${ticket.expectedImpact}`,
      `风险提示：${ticket.risk}`,
    ],
    output: stage === "confirm" ? "等待工程师确认发布" : "方案已发布，进入持续观察",
    logs: stage === "confirm" ? ["AI 已提交决策材料", "等待工程师确认"] : ["工程师已确认方案", "执行指令已发布"],
    evidence: ["AI 根因推理链", "变更执行计划", "回滚预案"],
  };
  const observeTask: TaskDetail = {
    id: "observe",
    actor: "ai",
    status: stage === "observing" ? "running" : "waiting",
    name: "影响范围、变更、日志持续观察",
    description: stage === "observing" ? "实时采集关键指标并验证故障恢复效果" : "方案发布后由 AI 自动启动监控",
    duration: stage === "observing" ? "持续执行中" : "尚未开始",
    input: ["网络监控", "DNS 指标", "服务日志", "告警与变更流"],
    result: stage === "observing" ? ticket.metrics.map((metric) => `${metric.label}：${metric.value}`) : ["等待方案发布"],
    output: stage === "observing" ? "关键指标持续恢复，暂未发现新增异常" : "等待人工确认后启动",
    logs: stage === "observing" ? ["创建观察窗口", "完成首轮指标采样", "持续检测异常趋势"] : ["观察任务已编排"],
    evidence: ["实时指标面板", "告警时间线", "变更审计记录"],
  };

  return (
    <Card className="flow-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">INCIDENT RUNBOOK</p>
          <h2>智能运维处理流程</h2>
        </div>
        <div className="agent-state"><span className="pulse" /> Agent 已完成 6 项分析任务</div>
      </div>
      <div className="stage-rail">
        {["数据理解", "分析判断", "解决方案", "人工确认", "持续观察"].map((label, index) => (
          <div className={`stage-label ${index === 3 && stage === "confirm" ? "current" : ""} ${index === 4 && stage === "observing" ? "current observing" : ""}`} key={label}>
            <b>{String(index + 1).padStart(2, "0")}</b><span>{label}</span>
          </div>
        ))}
      </div>
      <div className="flow-grid">
        <div className="understand-column">
          {ticket.tasks.slice(0, 4).map((task, index) => (
            <FlowCard key={task.id} task={task} icon={[Users, GitBranch, ShieldAlert, Network][index]} onClick={() => onTask(task)} />
          ))}
        </div>
        <FlowConnector />
        <FlowCard task={ticket.tasks[4]} icon={Sparkles} prominent onClick={() => onTask(ticket.tasks[4])} />
        <FlowConnector />
        <FlowCard task={ticket.tasks[5]} icon={FileSearch} prominent onClick={() => onTask(ticket.tasks[5])} />
        <FlowConnector orange={stage === "confirm"} />
        <HumanCard ticket={ticket} stage={stage} onDetails={() => onTask(humanTask)} onConfirm={onConfirm} />
        <FlowConnector active={stage === "observing"} />
        <ObserveCard ticket={ticket} stage={stage} onClick={() => onTask(observeTask)} />
      </div>
    </Card>
  );
}

function FlowCard({
  task,
  icon: Icon,
  prominent,
  onClick,
}: {
  task: TaskDetail;
  icon: typeof Users;
  prominent?: boolean;
  onClick: () => void;
}) {
  return (
    <Button variant="outline" className={`flow-card ${prominent ? "prominent" : ""}`} onClick={onClick}>
      <div className="flow-card-top">
        <span className="task-icon"><Icon size={15} /></span>
        <Badge variant="secondary" className="ai-tag"><Bot size={12} /> AI</Badge>
      </div>
      <h3>{task.name}</h3>
      <p>{task.description}</p>
      <div className="flow-card-foot">
        <span className="done"><Check size={13} /> 已完成</span>
        <ChevronRight size={15} />
      </div>
    </Button>
  );
}

function FlowConnector({ orange = false, active = false }: { orange?: boolean; active?: boolean }) {
  return <div className={`connector ${orange ? "orange" : ""} ${active ? "active" : ""}`}><span /></div>;
}

function HumanCard({
  ticket,
  stage,
  onDetails,
  onConfirm,
}: {
  ticket: Ticket;
  stage: TicketStage;
  onDetails: () => void;
  onConfirm: () => void;
}) {
  return (
    <Card
      className={`human-card ${stage === "observing" ? "completed" : ""}`}
      role="button"
      tabIndex={0}
      onClick={onDetails}
      onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && onDetails()}
    >
      <div className="flow-card-top">
        <span className="human-icon">{stage === "observing" ? <Check size={16} /> : <UserRound size={16} />}</span>
        <Badge variant="secondary" className="human-tag"><UserRound size={12} /> 人工</Badge>
      </div>
      <div className="human-title">
        <h3>协同方案并观察</h3>
        <span>{stage === "confirm" ? "等待人工确认" : "已确认发布"}</span>
      </div>
      <div className="recommendation">
        <label>推荐方案</label>
        <p>{ticket.solution}</p>
      </div>
      <dl>
        <div><dt>AI 依据</dt><dd>根因置信度 {ticket.confidence}%</dd></div>
        <div><dt>预计影响</dt><dd>{ticket.expectedImpact}</dd></div>
        <div className="risk-row"><dt>风险提示</dt><dd>{ticket.risk}</dd></div>
      </dl>
      {stage === "confirm" ? (
        <Button className="primary-button" onClick={(event) => { event.stopPropagation(); onConfirm(); }}>确认发布 <ChevronRight size={16} /></Button>
      ) : (
        <Button variant="secondary" className="completed-button" disabled><Check size={15} /> 已由工程师确认</Button>
      )}
    </Card>
  );
}

function ObserveCard({ ticket, stage, onClick }: { ticket: Ticket; stage: TicketStage; onClick: () => void }) {
  return (
    <Button variant="outline" className={`observe-card ${stage}`} onClick={onClick}>
      <div className="flow-card-top">
        <span className="task-icon"><Activity size={15} /></span>
        <Badge variant="secondary" className="ai-tag"><Bot size={12} /> AI</Badge>
      </div>
      <h3>影响范围、变更、日志持续观察</h3>
      <p>{stage === "observing" ? "正在采集实时指标并验证恢复效果" : "方案发布后自动启动监控"}</p>
      <div className="observe-status">
        {stage === "observing" ? <><span className="live-dot" /> 持续观察</> : <><Clock3 size={13} /> 等待启动</>}
      </div>
      {stage === "observing" && <strong>{ticket.metrics[1]?.value}</strong>}
    </Button>
  );
}

function Observability({ ticket, tick }: { ticket: Ticket; tick: number }) {
  return (
    <Card className="observability">
      <div className="section-heading compact">
        <div><p className="eyebrow">LIVE TELEMETRY</p><h2>持续观察</h2></div>
        <span className="live-label"><i /> 实时更新 · {tick + 1} 次采样</span>
      </div>
      <div className="metric-grid">
        {ticket.metrics.map((metric, index) => (
          <Card className="metric-card" key={metric.label}>
            <div className="metric-top">
              <span>{metric.label}</span>
              <CircleDot size={14} className={`tone-${metric.tone}`} />
            </div>
            <strong>{index === 2 && tick > 0 ? `${Math.max(0.04, parseFloat(metric.value) - tick * 0.02).toFixed(2)}%` : metric.value}</strong>
            <small>{metric.trend}</small>
          </Card>
        ))}
      </div>
    </Card>
  );
}

function ActivityLog({ stage, entries, onConfirm }: { stage: TicketStage; entries: LogEntry[]; onConfirm: () => void }) {
  return (
    <Card className="activity-panel">
      <div className="activity-head">
        <div><p className="eyebrow">ACTIVITY</p><h2>操作记录</h2></div>
        <span>{stage === "confirm" ? "AI 已完成当前阶段 · 等待人工确认" : "方案已发布 · AI 正在持续观察"}</span>
      </div>
      <div className="activity-content">
        <div className="timeline">
          {entries.slice(0, 4).map((entry, index) => (
            <div className="timeline-item" key={`${entry.time}-${entry.title}`}>
              <i className={entry.type}>{entry.type === "human" ? <UserRound size={13} /> : <Bot size={13} />}</i>
              <time>{entry.time}</time>
              <div><strong>{entry.title}</strong><p>{entry.detail}</p></div>
              {index === 0 && <span className="latest">最新</span>}
            </div>
          ))}
        </div>
        {stage === "confirm" && (
          <div className="next-action">
            <span>下一步需要工程师决策</span>
            <Button className="primary-button large" onClick={onConfirm}>确认发布 <ChevronRight size={17} /></Button>
          </div>
        )}
      </div>
    </Card>
  );
}

function AgentTaskView({
  ticket,
  stage,
  onTask,
  onBack,
}: {
  ticket: Ticket;
  stage: TicketStage;
  onTask: (task: TaskDetail) => void;
  onBack: () => void;
}) {
  return (
    <section className="agent-task-view">
      <div className="agent-page-head">
        <div>
          <div className="breadcrumb">工程师工作台 <ChevronRight size={13} /> Agent 任务</div>
          <h1>Agent 执行中心</h1>
          <p>查看当前工单的自动分析任务、执行证据与运行状态。</p>
        </div>
        <Button variant="outline" className="secondary-button" onClick={onBack}>返回处理流程</Button>
      </div>
      <Card className="agent-summary-strip">
        <div><span>当前工单</span><strong>{ticket.id}</strong></div>
        <div><span>分析任务</span><strong>6</strong></div>
        <div><span>已完成</span><strong className="tone-good">6</strong></div>
        <div><span>持续观察</span><strong className={stage === "observing" ? "tone-good" : "tone-neutral"}>{stage === "observing" ? "运行中" : "待启动"}</strong></div>
      </Card>
      <Card className="agent-task-list">
        <div className="agent-list-head"><span>任务</span><span>输入源</span><span>耗时</span><span>状态</span><span /></div>
        {ticket.tasks.map((task) => (
          <Button variant="ghost" className="agent-task-row" key={task.id} onClick={() => onTask(task)}>
            <span className="agent-task-name"><i><Bot size={15} /></i><span><strong>{task.name}</strong><small>{task.description}</small></span></span>
            <span>{task.input.length} 个数据源</span>
            <span>{task.duration}</span>
            <span className="done"><Check size={13} /> 已完成</span>
            <ChevronRight size={16} />
          </Button>
        ))}
      </Card>
    </section>
  );
}

function TaskDrawer({ task, onClose }: { task: TaskDetail; onClose: () => void }) {
  const isHuman = task.actor === "human";
  const statusLabel = task.status === "running" ? "持续执行" : task.status === "waiting" ? "等待处理" : "已完成";
  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="drawer" showCloseButton={false}>
        <div className="drawer-head">
          <div className={`drawer-icon ${isHuman ? "human" : ""}`}>{isHuman ? <UserRound size={19} /> : <Bot size={19} />}</div>
          <div><span>{isHuman ? "人工决策详情" : "AI 执行详情"}</span><SheetTitle>{task.name}</SheetTitle></div>
          <Button variant="ghost" size="icon" className="icon-button" onClick={onClose} aria-label="关闭详情"><X size={19} /></Button>
        </div>
        <div className="drawer-status">
          <span className={task.status === "waiting" ? "waiting" : "done"}>
            {task.status === "waiting" ? <Clock3 size={13} /> : <Check size={13} />} {statusLabel}
          </span>
          <span><Clock3 size={14} /> 执行耗时 {task.duration}</span>
        </div>
        <DrawerSection title="任务说明"><p>{task.description}</p></DrawerSection>
        <DrawerSection title="输入数据">
          <div className="chip-list">{task.input.map((item) => <span key={item}>{item}</span>)}</div>
        </DrawerSection>
        <DrawerSection title="AI 分析结果">
          <ul className="result-list">{task.result.map((item) => <li key={item}><CheckCircle2 size={15} /> {item}</li>)}</ul>
        </DrawerSection>
        <DrawerSection title="输出结果"><div className="output-box">{task.output}</div></DrawerSection>
        <DrawerSection title="执行日志">
          <div className="log-list">{task.logs.map((item, index) => <div key={item}><time>20:3{index}:0{index + 2}</time><span>{item}</span></div>)}</div>
        </DrawerSection>
        <DrawerSection title="相关证据">
          {task.evidence.map((item) => <Button variant="ghost" className="evidence-row" key={item}><Database size={15} /> {item}<ChevronRight size={15} /></Button>)}
        </DrawerSection>
      </SheetContent>
    </Sheet>
  );
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="drawer-section"><h3>{title}</h3>{children}</section>;
}

function ConfirmModal({ ticket, onCancel, onConfirm }: { ticket: Ticket; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="modal" showCloseButton={false}>
        <DialogHeader className="modal-head">
          <span className="warning-icon"><AlertTriangle size={20} /></span>
          <div><p>人工决策节点</p><DialogTitle>确认发布解决方案？</DialogTitle></div>
          <Button variant="ghost" size="icon" className="icon-button" onClick={onCancel} aria-label="关闭确认窗口"><X size={19} /></Button>
        </DialogHeader>
        <div className="modal-body">
          <div className="decision-summary">
            <label>推荐方案</label><p>{ticket.solution}</p>
          </div>
          <div className="decision-grid">
            <div><label>影响范围</label><p>{ticket.location} · {ticket.impact[0]}</p></div>
            <div><label>预计恢复</label><p>{ticket.expectedImpact}</p></div>
          </div>
          <div className="risk-box"><AlertTriangle size={16} /><div><label>风险提示</label><p>{ticket.risk}</p></div></div>
          <div className="rollback-box"><History size={16} /><div><label>回滚方案</label><p>{ticket.rollback}</p></div></div>
          <div className="steps">
            <label>执行步骤</label>
            {ticket.solutionSteps.map((step, index) => <div key={step}><b>{index + 1}</b><span>{step}</span></div>)}
          </div>
        </div>
        <DialogFooter className="modal-actions">
          <Button variant="outline" className="secondary-button" onClick={onCancel}>取消</Button>
          <Button className="primary-button" onClick={onConfirm}><Zap size={15} /> 确认发布</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CapabilityView() {
  const items = [
    ["网络诊断", "跨区域拨测、链路追踪与网络拓扑分析", Network],
    ["变更核查", "关联故障窗口内发布与配置变更", GitBranch],
    ["告警聚合", "告警去重、归因和异常时间线", ShieldAlert],
    ["知识检索", "历史故障与运维知识库语义检索", FileSearch],
  ] as const;
  return (
    <Card className="placeholder-view">
      <div className="section-heading"><div><p className="eyebrow">AGENT CAPABILITIES</p><h2>本工单启用的能力包</h2></div></div>
      <div className="capability-grid">
        {items.map(([title, description, Icon]) => <Card key={title}><Icon size={20} /><div><h3>{title}</h3><p>{description}</p></div><Badge variant="secondary">已启用</Badge></Card>)}
      </div>
    </Card>
  );
}

function FullHistory({ entries, ticket }: { entries: LogEntry[]; ticket: Ticket }) {
  return (
    <Card className="placeholder-view">
      <div className="section-heading"><div><p className="eyebrow">AUDIT TRAIL</p><h2>完整处理记录</h2></div></div>
      <div className="history-table">
        <div className="history-row header"><span>时间</span><span>执行方</span><span>动作</span><span>结果</span></div>
        {entries.map((entry) => (
          <div className="history-row" key={`${entry.time}-${entry.title}`}><time>{entry.time}</time><span>{entry.type === "human" ? ticket.reporter : "Agent"}</span><strong>{entry.title}</strong><span>{entry.detail}</span></div>
        ))}
      </div>
    </Card>
  );
}

export default App;
