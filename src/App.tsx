import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
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
        <button className="mobile-menu icon-button" onClick={onOpenList} aria-label="打开工单列表">
          <ListFilter size={18} />
        </button>
        <div className="brand-mark"><Activity size={19} /></div>
        <span>工程师工作台</span>
      </div>
      <nav className="primary-nav">
        <button className={`nav-item ${activeView === "mine" ? "active" : ""}`} onClick={() => onView("mine")}>我的任务 <b>4</b></button>
        <button className={`nav-item ${activeView === "agent" ? "active" : ""}`} onClick={() => onView("agent")}>Agent 任务 <b>12</b></button>
      </nav>
      <div className="top-actions">
        <button className="icon-button has-dot" aria-label="通知" title="通知"><Bell size={18} /></button>
        <button className="icon-button" aria-label="待办" title="待办任务"><CheckCircle2 size={18} /></button>
        <button className="icon-button ai-button" aria-label="Agent" title="Agent 状态" onClick={() => onView("agent")}><Bot size={18} /></button>
        <button className="icon-button" aria-label="设置" title="设置"><Settings size={18} /></button>
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
          <span className="count-badge">{props.tickets.length}</span>
          <button className="mobile-close icon-button" onClick={props.onClose} aria-label="关闭"><X size={18} /></button>
        </div>
        <div className="filters">
          <div className="filter-row">
            <label>
              <select value={props.severity} onChange={(event) => props.setSeverity(event.target.value)}>
                <option>全部状态</option>
                <option>P0</option>
                <option>P1</option>
                <option>P2</option>
              </select>
              <ChevronDown size={14} />
            </label>
            <label>
              <select value={props.type} onChange={(event) => props.setType(event.target.value)}>
                {types.map((item) => <option key={item}>{item}</option>)}
              </select>
              <ChevronDown size={14} />
            </label>
          </div>
          <div className="search-box">
            <Search size={15} />
            <input value={props.search} onChange={(event) => props.setSearch(event.target.value)} placeholder="搜索工单编号或标题" />
          </div>
        </div>
        <div className="ticket-list">
          {props.tickets.map((item) => (
            <button
              key={item.id}
              className={`ticket-card ${props.selectedId === item.id ? "selected" : ""}`}
              onClick={() => props.onSelect(item.id)}
            >
              <div className="ticket-meta">
                <span className={`severity severity-${item.severity.toLowerCase()}`}>{item.severity}</span>
                <span>{item.id}</span>
                <span className="ticket-time">{item.createdAt}</span>
              </div>
              <h3>{item.title}</h3>
              <div className="summary-list">
                {item.summaries.map((line) => <span key={line}>{line}</span>)}
              </div>
              <div className="ticket-footer">
                <span className="person"><i className="avatar">{item.initials}</i>{item.reporter}</span>
                <span className="type-tag">{item.type}</span>
              </div>
            </button>
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
        <span className={`status-pill ${stage}`}>
          <i /> {stage === "confirm" ? "等待确认发布" : "持续观察中"}
        </span>
      </div>
      <div className="tabs">
        {["处理流程", "能力包", "完整记录"].map((tab) => (
          <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => onTab(tab)}>{tab}</button>
        ))}
      </div>
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
    <section className="flow-section">
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
    </section>
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
    <button className={`flow-card ${prominent ? "prominent" : ""}`} onClick={onClick}>
      <div className="flow-card-top">
        <span className="task-icon"><Icon size={15} /></span>
        <span className="ai-tag"><Bot size={12} /> AI</span>
      </div>
      <h3>{task.name}</h3>
      <p>{task.description}</p>
      <div className="flow-card-foot">
        <span className="done"><Check size={13} /> 已完成</span>
        <ChevronRight size={15} />
      </div>
    </button>
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
    <article
      className={`human-card ${stage === "observing" ? "completed" : ""}`}
      role="button"
      tabIndex={0}
      onClick={onDetails}
      onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && onDetails()}
    >
      <div className="flow-card-top">
        <span className="human-icon">{stage === "observing" ? <Check size={16} /> : <UserRound size={16} />}</span>
        <span className="human-tag"><UserRound size={12} /> 人工</span>
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
        <button className="primary-button" onClick={(event) => { event.stopPropagation(); onConfirm(); }}>确认发布 <ChevronRight size={16} /></button>
      ) : (
        <button className="completed-button" disabled><Check size={15} /> 已由工程师确认</button>
      )}
    </article>
  );
}

function ObserveCard({ ticket, stage, onClick }: { ticket: Ticket; stage: TicketStage; onClick: () => void }) {
  return (
    <button className={`observe-card ${stage}`} onClick={onClick}>
      <div className="flow-card-top">
        <span className="task-icon"><Activity size={15} /></span>
        <span className="ai-tag"><Bot size={12} /> AI</span>
      </div>
      <h3>影响范围、变更、日志持续观察</h3>
      <p>{stage === "observing" ? "正在采集实时指标并验证恢复效果" : "方案发布后自动启动监控"}</p>
      <div className="observe-status">
        {stage === "observing" ? <><span className="live-dot" /> 持续观察</> : <><Clock3 size={13} /> 等待启动</>}
      </div>
      {stage === "observing" && <strong>{ticket.metrics[1]?.value}</strong>}
    </button>
  );
}

function Observability({ ticket, tick }: { ticket: Ticket; tick: number }) {
  return (
    <section className="observability">
      <div className="section-heading compact">
        <div><p className="eyebrow">LIVE TELEMETRY</p><h2>持续观察</h2></div>
        <span className="live-label"><i /> 实时更新 · {tick + 1} 次采样</span>
      </div>
      <div className="metric-grid">
        {ticket.metrics.map((metric, index) => (
          <article className="metric-card" key={metric.label}>
            <div className="metric-top">
              <span>{metric.label}</span>
              <CircleDot size={14} className={`tone-${metric.tone}`} />
            </div>
            <strong>{index === 2 && tick > 0 ? `${Math.max(0.04, parseFloat(metric.value) - tick * 0.02).toFixed(2)}%` : metric.value}</strong>
            <small>{metric.trend}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function ActivityLog({ stage, entries, onConfirm }: { stage: TicketStage; entries: LogEntry[]; onConfirm: () => void }) {
  return (
    <section className="activity-panel">
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
            <button className="primary-button large" onClick={onConfirm}>确认发布 <ChevronRight size={17} /></button>
          </div>
        )}
      </div>
    </section>
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
        <button className="secondary-button" onClick={onBack}>返回处理流程</button>
      </div>
      <div className="agent-summary-strip">
        <div><span>当前工单</span><strong>{ticket.id}</strong></div>
        <div><span>分析任务</span><strong>6</strong></div>
        <div><span>已完成</span><strong className="tone-good">6</strong></div>
        <div><span>持续观察</span><strong className={stage === "observing" ? "tone-good" : "tone-neutral"}>{stage === "observing" ? "运行中" : "待启动"}</strong></div>
      </div>
      <div className="agent-task-list">
        <div className="agent-list-head"><span>任务</span><span>输入源</span><span>耗时</span><span>状态</span><span /></div>
        {ticket.tasks.map((task) => (
          <button className="agent-task-row" key={task.id} onClick={() => onTask(task)}>
            <span className="agent-task-name"><i><Bot size={15} /></i><span><strong>{task.name}</strong><small>{task.description}</small></span></span>
            <span>{task.input.length} 个数据源</span>
            <span>{task.duration}</span>
            <span className="done"><Check size={13} /> 已完成</span>
            <ChevronRight size={16} />
          </button>
        ))}
      </div>
    </section>
  );
}

function TaskDrawer({ task, onClose }: { task: TaskDetail; onClose: () => void }) {
  const isHuman = task.actor === "human";
  const statusLabel = task.status === "running" ? "持续执行" : task.status === "waiting" ? "等待处理" : "已完成";
  return (
    <>
      <div className="drawer-scrim" onClick={onClose} />
      <aside className="drawer">
        <div className="drawer-head">
          <div className={`drawer-icon ${isHuman ? "human" : ""}`}>{isHuman ? <UserRound size={19} /> : <Bot size={19} />}</div>
          <div><span>{isHuman ? "人工决策详情" : "AI 执行详情"}</span><h2>{task.name}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="关闭详情"><X size={19} /></button>
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
          {task.evidence.map((item) => <button className="evidence-row" key={item}><Database size={15} /> {item}<ChevronRight size={15} /></button>)}
        </DrawerSection>
      </aside>
    </>
  );
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="drawer-section"><h3>{title}</h3>{children}</section>;
}

function ConfirmModal({ ticket, onCancel, onConfirm }: { ticket: Ticket; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="modal-scrim" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <span className="warning-icon"><AlertTriangle size={20} /></span>
          <div><p>人工决策节点</p><h2>确认发布解决方案？</h2></div>
          <button className="icon-button" onClick={onCancel} aria-label="关闭确认窗口"><X size={19} /></button>
        </div>
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
        <div className="modal-actions">
          <button className="secondary-button" onClick={onCancel}>取消</button>
          <button className="primary-button" onClick={onConfirm}><Zap size={15} /> 确认发布</button>
        </div>
      </div>
    </div>
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
    <section className="placeholder-view">
      <div className="section-heading"><div><p className="eyebrow">AGENT CAPABILITIES</p><h2>本工单启用的能力包</h2></div></div>
      <div className="capability-grid">
        {items.map(([title, description, Icon]) => <article key={title}><Icon size={20} /><div><h3>{title}</h3><p>{description}</p></div><span>已启用</span></article>)}
      </div>
    </section>
  );
}

function FullHistory({ entries, ticket }: { entries: LogEntry[]; ticket: Ticket }) {
  return (
    <section className="placeholder-view">
      <div className="section-heading"><div><p className="eyebrow">AUDIT TRAIL</p><h2>完整处理记录</h2></div></div>
      <div className="history-table">
        <div className="history-row header"><span>时间</span><span>执行方</span><span>动作</span><span>结果</span></div>
        {entries.map((entry) => (
          <div className="history-row" key={`${entry.time}-${entry.title}`}><time>{entry.time}</time><span>{entry.type === "human" ? ticket.reporter : "Agent"}</span><strong>{entry.title}</strong><span>{entry.detail}</span></div>
        ))}
      </div>
    </section>
  );
}

export default App;
