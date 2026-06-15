import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LayoutDashboard, Users, CalendarCheck, FileText, Wallet,
  Receipt, BarChart3, Settings, LogOut, Plus, Pencil, Trash2,
  Check, X, Download, Search, ChevronDown, ChevronRight, FileDown,
  Printer, ArrowUpRight, ArrowDownRight, Clock, AlertCircle,
  TrendingUp, Building2, Mail, Calendar as CalIcon, DollarSign,
  ShieldCheck, UserCircle, Inbox, Filter, Briefcase, Star,
  Package, Ticket, Network, Target, Award, BookOpen, ClipboardList,
  CheckSquare, AlertTriangle, ChevronLeft, RefreshCw, Eye,
  UserPlus, Layers, Activity, Bell, MoreVertical, Hash,
  MessageSquare, PlusCircle, MinusCircle, Zap
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts';

// ============================================================================
// STORAGE LAYER
// ============================================================================
const STORE_KEYS = {
  employees: 'hr:employees',
  attendance: 'hr:attendance',
  leaves: 'hr:leaves',
  payroll: 'hr:payroll',
  cashflow: 'hr:cashflow',
  categories: 'hr:categories',
  recruitment: 'hr:recruitment',
  performance: 'hr:performance',
  assets: 'hr:assets',
  tickets: 'hr:tickets',
  onboarding: 'hr:onboarding',
  meta: 'hr:meta',
};

const safeStorage = {
  async get(key, fallback) {
    try {
      const res = await window.storage.get(key);
      return res ? JSON.parse(res.value) : fallback;
    } catch { return fallback; }
  },
  async set(key, value) {
    try { await window.storage.set(key, JSON.stringify(value)); } catch (e) { console.error('storage set fail', e); }
  }
};

// ============================================================================
// HELPERS
// ============================================================================
const pad = n => String(n).padStart(2, '0');
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const monthKey = (y, m) => `${y}-${pad(m)}`;
const daysInMonth = (y, m) => new Date(y, m, 0).getDate();
const fmtMoney = n => 'Rs ' + (Number(n) || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 });
const fmtDate = iso => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
const uid = () => Math.random().toString(36).slice(2, 10);
const monthName = m => ['January','February','March','April','May','June','July','August','September','October','November','December'][m-1];
const diffDays = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000) + 1;
const downloadFile = (content, name, type='text/csv') => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
};
const toCSV = (rows) => {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [keys.join(','), ...rows.map(r => keys.map(k => esc(r[k])).join(','))].join('\n');
};

// ============================================================================
// SEED DATA
// ============================================================================
const SEED_EMPLOYEES = [
  { id: 'EMP001', name: 'Ahmed Raza Khan',  email: 'ahmed.khan@company.pk',  department: 'Engineering', position: 'Senior Engineer',    monthlySalary: 180000, allowances: 15000, taxRate: 8,  loanDeduction: 0,    joinDate: '2022-03-15', status: 'active', role: 'admin', managerId: null },
  { id: 'EMP002', name: 'Fatima Sheikh',     email: 'fatima.sheikh@company.pk',department: 'Engineering', position: 'Software Engineer',  monthlySalary: 120000, allowances: 8000,  taxRate: 5,  loanDeduction: 5000, joinDate: '2023-01-10', status: 'active', role: 'employee', managerId: 'EMP001' },
  { id: 'EMP003', name: 'Bilal Ahmad',       email: 'bilal.ahmad@company.pk', department: 'Sales',       position: 'Sales Manager',      monthlySalary: 140000, allowances: 20000, taxRate: 7,  loanDeduction: 0,    joinDate: '2021-08-22', status: 'active', role: 'manager', managerId: null },
  { id: 'EMP004', name: 'Ayesha Malik',      email: 'ayesha.malik@company.pk',department: 'HR',          position: 'HR Lead',            monthlySalary: 110000, allowances: 10000, taxRate: 5,  loanDeduction: 0,    joinDate: '2022-11-05', status: 'active', role: 'admin', managerId: null },
  { id: 'EMP005', name: 'Hassan Iqbal',      email: 'hassan.iqbal@company.pk',department: 'Sales',       position: 'Sales Executive',    monthlySalary: 75000,  allowances: 5000,  taxRate: 3,  loanDeduction: 0,    joinDate: '2024-02-14', status: 'active', role: 'employee', managerId: 'EMP003' },
  { id: 'EMP006', name: 'Zainab Tariq',      email: 'zainab.tariq@company.pk',department: 'Finance',     position: 'Accountant',         monthlySalary: 95000,  allowances: 7000,  taxRate: 5,  loanDeduction: 3000, joinDate: '2023-06-01', status: 'active', role: 'employee', managerId: null },
];

const seedAttendance = () => {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth() + 1;
  const days = daysInMonth(y, m);
  const rows = [];
  for (const emp of SEED_EMPLOYEES) {
    for (let d = 1; d <= Math.min(days, now.getDate()); d++) {
      const dow = new Date(y, m-1, d).getDay();
      if (dow === 0) continue;
      let status = 'present';
      const r = Math.random();
      if (r < 0.05) status = 'absent';
      else if (r < 0.10) status = 'half';
      rows.push({
        id: uid(),
        employeeId: emp.id,
        date: `${y}-${pad(m)}-${pad(d)}`,
        status,
        checkIn: status === 'absent' ? null : '09:' + pad(Math.floor(Math.random() * 30)),
        checkOut: status === 'absent' ? null : (status === 'half' ? '13:30' : '18:' + pad(Math.floor(Math.random() * 30))),
      });
    }
  }
  return rows;
};

const SEED_LEAVES = [
  { id: uid(), employeeId: 'EMP002', startDate: '2026-06-08', endDate: '2026-06-09', type: 'sick',     reason: 'Fever and flu',           status: 'approved', days: 2, requestDate: '2026-06-07' },
  { id: uid(), employeeId: 'EMP005', startDate: '2026-06-15', endDate: '2026-06-17', type: 'vacation', reason: 'Family wedding',          status: 'pending',  days: 3, requestDate: '2026-06-10' },
  { id: uid(), employeeId: 'EMP003', startDate: '2026-06-20', endDate: '2026-06-20', type: 'personal', reason: 'Personal appointment',    status: 'pending',  days: 1, requestDate: '2026-06-11' },
];

const SEED_CASHFLOW = [
  { id: uid(), date: '2026-06-01', type: 'income',  category: 'Sales Revenue',  amount: 850000, description: 'Q2 client payment - Project Athena' },
  { id: uid(), date: '2026-06-03', type: 'expense', category: 'Rent',           amount: 120000, description: 'Office rent June' },
  { id: uid(), date: '2026-06-04', type: 'expense', category: 'Utilities',      amount: 35000,  description: 'Electricity + internet' },
  { id: uid(), date: '2026-06-05', type: 'income',  category: 'Sales Revenue',  amount: 220000, description: 'Retainer - Client B' },
  { id: uid(), date: '2026-06-07', type: 'expense', category: 'Office Supplies',amount: 18500,  description: 'Stationery and pantry' },
  { id: uid(), date: '2026-06-09', type: 'expense', category: 'Marketing',      amount: 65000,  description: 'Q2 ad spend' },
  { id: uid(), date: '2026-06-10', type: 'income',  category: 'Sales Revenue',  amount: 145000, description: 'Hourly billing - Client C' },
];

const SEED_CATEGORIES = [
  { id: uid(), name: 'Rent',            monthlyBudget: 120000 },
  { id: uid(), name: 'Utilities',       monthlyBudget: 45000 },
  { id: uid(), name: 'Office Supplies', monthlyBudget: 25000 },
  { id: uid(), name: 'Marketing',       monthlyBudget: 80000 },
  { id: uid(), name: 'Payroll',         monthlyBudget: 900000 },
  { id: uid(), name: 'Software',        monthlyBudget: 30000 },
];

const SEED_RECRUITMENT = [
  { id: uid(), title: 'Senior Frontend Developer', department: 'Engineering', status: 'open', priority: 'high', openDate: '2026-05-20', targetDate: '2026-07-01', description: 'React/Next.js expert for product team', candidates: [
    { id: uid(), name: 'Ali Hassan',    email: 'ali.h@gmail.com',    phone: '0321-1234567', stage: 'interview', score: 8, appliedDate: '2026-05-25', source: 'LinkedIn' },
    { id: uid(), name: 'Sara Noor',     email: 'sara.n@gmail.com',   phone: '0333-7654321', stage: 'screening', score: 7, appliedDate: '2026-05-28', source: 'Indeed' },
    { id: uid(), name: 'Usman Ghani',   email: 'usman.g@gmail.com',  phone: '0311-9876543', stage: 'applied',   score: 0, appliedDate: '2026-06-01', source: 'Referral' },
  ]},
  { id: uid(), title: 'Sales Executive', department: 'Sales', status: 'open', priority: 'medium', openDate: '2026-06-01', targetDate: '2026-07-15', description: 'B2B sales experience required', candidates: [
    { id: uid(), name: 'Hina Butt',     email: 'hina.b@gmail.com',   phone: '0300-1112222', stage: 'offer',     score: 9, appliedDate: '2026-06-03', source: 'LinkedIn' },
    { id: uid(), name: 'Kamran Riaz',   email: 'kamran.r@gmail.com', phone: '0345-3334444', stage: 'rejected',  score: 4, appliedDate: '2026-06-05', source: 'Portal' },
  ]},
  { id: uid(), title: 'Accountant', department: 'Finance', status: 'closed', priority: 'low', openDate: '2026-04-01', targetDate: '2026-05-15', description: 'CA/ACCA preferred', candidates: [] },
];

const SEED_PERFORMANCE = [
  { id: uid(), employeeId: 'EMP001', period: '2026-H1', goals: [
    { id: uid(), title: 'Launch v2 API',        weight: 40, progress: 80, status: 'on-track' },
    { id: uid(), title: 'Code review coverage', weight: 30, progress: 100, status: 'completed' },
    { id: uid(), title: 'Team mentoring',        weight: 30, progress: 60, status: 'on-track' },
  ], rating: null, reviewDate: null, status: 'in-progress' },
  { id: uid(), employeeId: 'EMP002', period: '2026-H1', goals: [
    { id: uid(), title: 'Complete React migration', weight: 50, progress: 90, status: 'on-track' },
    { id: uid(), title: 'Unit test coverage 80%',   weight: 50, progress: 45, status: 'at-risk' },
  ], rating: null, reviewDate: null, status: 'in-progress' },
  { id: uid(), employeeId: 'EMP003', period: '2026-H1', goals: [
    { id: uid(), title: 'Achieve Q2 sales target',  weight: 60, progress: 110, status: 'completed' },
    { id: uid(), title: 'Onboard 3 new clients',    weight: 40, progress: 100, status: 'completed' },
  ], rating: 4.5, reviewDate: '2026-06-10', status: 'reviewed' },
];

const SEED_ASSETS = [
  { id: 'AST001', name: 'MacBook Pro 14"',     category: 'Laptop',  serialNo: 'C02XJ4Y1JGH5', assignedTo: 'EMP001', assignDate: '2022-03-15', condition: 'good',  value: 450000, status: 'assigned' },
  { id: 'AST002', name: 'MacBook Air M2',       category: 'Laptop',  serialNo: 'C02ZL5P2KGH8', assignedTo: 'EMP002', assignDate: '2023-01-10', condition: 'good',  value: 320000, status: 'assigned' },
  { id: 'AST003', name: 'Dell Monitor 27"',     category: 'Monitor', serialNo: 'DL-MON-2023-03', assignedTo: 'EMP001', assignDate: '2022-03-15', condition: 'good',  value: 85000, status: 'assigned' },
  { id: 'AST004', name: 'HP Laptop 15s',        category: 'Laptop',  serialNo: 'HP-15S-2024-01', assignedTo: 'EMP005', assignDate: '2024-02-14', condition: 'fair',  value: 180000, status: 'assigned' },
  { id: 'AST005', name: 'iPhone 14 Pro',        category: 'Phone',   serialNo: 'IMEI-3456789', assignedTo: null,     assignDate: null,          condition: 'good',  value: 260000, status: 'available' },
  { id: 'AST006', name: 'Office Chair (Exec)',  category: 'Furniture',serialNo: 'FURN-2021-07', assignedTo: 'EMP003', assignDate: '2021-08-22', condition: 'good',  value: 45000, status: 'assigned' },
];

const SEED_TICKETS = [
  { id: 'TKT001', employeeId: 'EMP002', category: 'IT',       subject: 'Laptop running slow', description: 'My laptop freezes frequently, especially with Chrome open.', status: 'open',     priority: 'medium', createdDate: '2026-06-09', resolvedDate: null, assignedTo: 'EMP001', comments: [] },
  { id: 'TKT002', employeeId: 'EMP005', category: 'HR',       subject: 'Leave balance query',  description: 'Need clarification on remaining leave balance for Q3.',     status: 'resolved', priority: 'low',    createdDate: '2026-06-07', resolvedDate: '2026-06-08', assignedTo: 'EMP004', comments: [] },
  { id: 'TKT003', employeeId: 'EMP006', category: 'Finance',  subject: 'Reimbursement pending',description: 'Travel expense from May still not reimbursed.',             status: 'in-progress', priority: 'high', createdDate: '2026-06-10', resolvedDate: null, assignedTo: 'EMP004', comments: [] },
  { id: 'TKT004', employeeId: 'EMP003', category: 'Facility', subject: 'AC not working',       description: 'Air conditioning in meeting room B is broken.',             status: 'open',     priority: 'high',   createdDate: '2026-06-11', resolvedDate: null, assignedTo: null, comments: [] },
];

const SEED_ONBOARDING = [
  { id: uid(), employeeId: 'EMP002', startDate: '2023-01-10', checklist: [
    { id: uid(), task: 'Send welcome email',           completed: true,  dueDay: 0 },
    { id: uid(), task: 'Setup company email',          completed: true,  dueDay: 1 },
    { id: uid(), task: 'Assign laptop and equipment',  completed: true,  dueDay: 1 },
    { id: uid(), task: 'HR documentation complete',    completed: true,  dueDay: 3 },
    { id: uid(), task: 'Complete security training',   completed: true,  dueDay: 7 },
    { id: uid(), task: '30-day check-in meeting',      completed: true,  dueDay: 30 },
    { id: uid(), task: '90-day performance review',    completed: false, dueDay: 90 },
  ], status: 'active' },
];

// ============================================================================
// DATA HOOK
// ============================================================================
function useHRData() {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [cashflow, setCashflow] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recruitment, setRecruitment] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [assets, setAssets] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [onboarding, setOnboarding] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const meta = await safeStorage.get(STORE_KEYS.meta, null);
      if (!meta || meta.version < 2) {
        const att = seedAttendance();
        await safeStorage.set(STORE_KEYS.employees, SEED_EMPLOYEES);
        await safeStorage.set(STORE_KEYS.attendance, att);
        await safeStorage.set(STORE_KEYS.leaves, SEED_LEAVES);
        await safeStorage.set(STORE_KEYS.payroll, []);
        await safeStorage.set(STORE_KEYS.cashflow, SEED_CASHFLOW);
        await safeStorage.set(STORE_KEYS.categories, SEED_CATEGORIES);
        await safeStorage.set(STORE_KEYS.recruitment, SEED_RECRUITMENT);
        await safeStorage.set(STORE_KEYS.performance, SEED_PERFORMANCE);
        await safeStorage.set(STORE_KEYS.assets, SEED_ASSETS);
        await safeStorage.set(STORE_KEYS.tickets, SEED_TICKETS);
        await safeStorage.set(STORE_KEYS.onboarding, SEED_ONBOARDING);
        await safeStorage.set(STORE_KEYS.meta, { seeded: true, version: 2 });
        setEmployees(SEED_EMPLOYEES); setAttendance(att); setLeaves(SEED_LEAVES);
        setCashflow(SEED_CASHFLOW); setCategories(SEED_CATEGORIES);
        setRecruitment(SEED_RECRUITMENT); setPerformance(SEED_PERFORMANCE);
        setAssets(SEED_ASSETS); setTickets(SEED_TICKETS); setOnboarding(SEED_ONBOARDING);
      } else {
        setEmployees(await safeStorage.get(STORE_KEYS.employees, []));
        setAttendance(await safeStorage.get(STORE_KEYS.attendance, []));
        setLeaves(await safeStorage.get(STORE_KEYS.leaves, []));
        setPayroll(await safeStorage.get(STORE_KEYS.payroll, []));
        setCashflow(await safeStorage.get(STORE_KEYS.cashflow, []));
        setCategories(await safeStorage.get(STORE_KEYS.categories, []));
        setRecruitment(await safeStorage.get(STORE_KEYS.recruitment, []));
        setPerformance(await safeStorage.get(STORE_KEYS.performance, []));
        setAssets(await safeStorage.get(STORE_KEYS.assets, []));
        setTickets(await safeStorage.get(STORE_KEYS.tickets, []));
        setOnboarding(await safeStorage.get(STORE_KEYS.onboarding, []));
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => { if (loaded) safeStorage.set(STORE_KEYS.employees, employees); }, [employees, loaded]);
  useEffect(() => { if (loaded) safeStorage.set(STORE_KEYS.attendance, attendance); }, [attendance, loaded]);
  useEffect(() => { if (loaded) safeStorage.set(STORE_KEYS.leaves, leaves); }, [leaves, loaded]);
  useEffect(() => { if (loaded) safeStorage.set(STORE_KEYS.payroll, payroll); }, [payroll, loaded]);
  useEffect(() => { if (loaded) safeStorage.set(STORE_KEYS.cashflow, cashflow); }, [cashflow, loaded]);
  useEffect(() => { if (loaded) safeStorage.set(STORE_KEYS.categories, categories); }, [categories, loaded]);
  useEffect(() => { if (loaded) safeStorage.set(STORE_KEYS.recruitment, recruitment); }, [recruitment, loaded]);
  useEffect(() => { if (loaded) safeStorage.set(STORE_KEYS.performance, performance); }, [performance, loaded]);
  useEffect(() => { if (loaded) safeStorage.set(STORE_KEYS.assets, assets); }, [assets, loaded]);
  useEffect(() => { if (loaded) safeStorage.set(STORE_KEYS.tickets, tickets); }, [tickets, loaded]);
  useEffect(() => { if (loaded) safeStorage.set(STORE_KEYS.onboarding, onboarding); }, [onboarding, loaded]);

  const resetAll = async () => {
    for (const k of Object.values(STORE_KEYS)) {
      try { await window.storage.delete(k); } catch {}
    }
    window.location.reload();
  };

  return {
    employees, setEmployees,
    attendance, setAttendance,
    leaves, setLeaves,
    payroll, setPayroll,
    cashflow, setCashflow,
    categories, setCategories,
    recruitment, setRecruitment,
    performance, setPerformance,
    assets, setAssets,
    tickets, setTickets,
    onboarding, setOnboarding,
    loaded, resetAll,
  };
}

// ============================================================================
// UI PRIMITIVES
// ============================================================================
function Btn({ children, variant = 'primary', size = 'md', icon: Icon, ...props }) {
  const base = 'inline-flex items-center gap-2 font-medium transition-all whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-600';
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-sm' };
  const variants = {
    primary:   'bg-slate-900 text-white hover:bg-slate-700 rounded-lg shadow-sm',
    secondary: 'bg-white text-slate-800 border border-slate-200 hover:border-slate-400 hover:bg-slate-50 rounded-lg',
    ghost:     'text-slate-600 hover:bg-slate-100 rounded-lg',
    danger:    'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100 rounded-lg',
    accent:    'bg-violet-600 text-white hover:bg-violet-700 rounded-lg shadow-sm',
    success:   'bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-sm',
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]}`} {...props}>
      {Icon && <Icon size={size === 'sm' ? 13 : 15} />}
      {children}
    </button>
  );
}

function Input({ label, error, hint, ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</span>}
      <input
        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 placeholder:text-slate-300 transition-all"
        {...props}
      />
      {hint && <span className="block text-xs text-slate-400 mt-1">{hint}</span>}
      {error && <span className="block text-xs text-rose-600 mt-1">{error}</span>}
    </label>
  );
}

function Select({ label, options, ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</span>}
      <select className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all" {...props}>
        {options.map(o => typeof o === 'object' ? <option key={o.value} value={o.value}>{o.label}</option> : <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function Textarea({ label, ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</span>}
      <textarea
        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none"
        {...props}
      />
    </label>
  );
}

function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;
  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${widths[size]} max-h-[90vh] overflow-hidden flex flex-col`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900 text-base">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"><X size={16} /></button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function Badge({ children, tone = 'slate', size = 'sm' }) {
  const tones = {
    slate:   'bg-slate-100 text-slate-600',
    green:   'bg-emerald-50 text-emerald-700 border border-emerald-100',
    red:     'bg-rose-50 text-rose-600 border border-rose-100',
    amber:   'bg-amber-50 text-amber-700 border border-amber-100',
    blue:    'bg-blue-50 text-blue-700 border border-blue-100',
    teal:    'bg-teal-50 text-teal-700 border border-teal-100',
    violet:  'bg-violet-50 text-violet-700 border border-violet-100',
    orange:  'bg-orange-50 text-orange-700 border border-orange-100',
    pink:    'bg-pink-50 text-pink-700 border border-pink-100',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

function StatCard({ label, value, sub, icon: Icon, tone = 'slate', trend, accent }) {
  const iconBg = {
    slate: 'bg-slate-100 text-slate-600',
    teal:  'bg-teal-50 text-teal-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose:  'bg-rose-50 text-rose-600',
    violet:'bg-violet-50 text-violet-600',
    blue:  'bg-blue-50 text-blue-600',
  };
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
        {Icon && <div className={`p-2 rounded-lg ${iconBg[tone]}`}><Icon size={15} /></div>}
      </div>
      <div className="text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
      {sub && <div className="mt-1.5 text-xs text-slate-500 flex items-center gap-1">
        {trend === 'up' && <ArrowUpRight size={11} className="text-emerald-600" />}
        {trend === 'down' && <ArrowDownRight size={11} className="text-rose-600" />}
        {sub}
      </div>}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      {Icon && <div className="p-4 bg-slate-50 rounded-2xl mb-4"><Icon size={22} className="text-slate-300" /></div>}
      <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
      {description && <p className="text-xs text-slate-400 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function PageHeader({ eyebrow, title, description, actions, badge }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        {eyebrow && <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">{eyebrow}</p>}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {badge}
        </div>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </header>
  );
}

function SectionCard({ title, subtitle, children, headerRight, className = '' }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl overflow-hidden ${className}`}>
      {(title || headerRight) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            {title && <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {headerRight}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

// ============================================================================
// DASHBOARD
// ============================================================================
function Dashboard({ data, currentUser, navigate }) {
  const { employees, attendance, leaves, cashflow, categories, recruitment, tickets } = data;
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth() + 1;
  const monthPrefix = `${y}-${pad(m)}`;

  const todayAtt = attendance.filter(a => a.date === todayISO());
  const presentToday = todayAtt.filter(a => a.status === 'present' || a.status === 'half').length;
  const pendingLeaves = leaves.filter(l => l.status === 'pending');
  const monthIncome  = cashflow.filter(c => c.date.startsWith(monthPrefix) && c.type === 'income').reduce((s,c)=>s+c.amount,0);
  const monthExpense = cashflow.filter(c => c.date.startsWith(monthPrefix) && c.type === 'expense').reduce((s,c)=>s+c.amount,0);
  const totalBalance = cashflow.reduce((s,c) => s + (c.type === 'income' ? c.amount : -c.amount), 0);
  const monthPayroll = employees.reduce((s,e) => s + e.monthlySalary + (e.allowances || 0), 0);
  const openJobs = recruitment.filter(r => r.status === 'open').length;
  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in-progress').length;
  const totalCandidates = recruitment.reduce((s,r) => s + r.candidates.length, 0);

  const last14 = useMemo(() => {
    const out = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const iso = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
      const dayTx = cashflow.filter(c => c.date === iso);
      out.push({
        date: `${d.getDate()}/${d.getMonth()+1}`,
        income: dayTx.filter(c=>c.type==='income').reduce((s,c)=>s+c.amount,0),
        expense: dayTx.filter(c=>c.type==='expense').reduce((s,c)=>s+c.amount,0),
      });
    }
    return out;
  }, [cashflow]);

  const expenseByCat = useMemo(() => {
    const map = {};
    cashflow.filter(c=>c.date.startsWith(monthPrefix) && c.type==='expense').forEach(c => {
      map[c.category] = (map[c.category] || 0) + c.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [cashflow, monthPrefix]);

  const PIE_COLORS = ['#7c3aed','#0e7490','#059669','#d97706','#db2777','#2563eb','#475569'];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back, ${currentUser.name.split(' ')[0]}`}
        description={`${monthName(m)} ${y} — operations snapshot`}
        badge={<Badge tone="violet">{currentUser.role === 'admin' ? 'HR Admin' : currentUser.role === 'manager' ? 'Manager' : 'Employee'}</Badge>}
      />

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active workforce" value={employees.filter(e=>e.status==='active').length} sub={`${employees.length} on record`} icon={Users} tone="violet" />
        <StatCard label="Present today"    value={`${presentToday}/${employees.length}`} sub={`${Math.round(presentToday/Math.max(employees.length,1)*100)}% attendance`} icon={CalendarCheck} tone="green" trend="up" />
        <StatCard label="Open positions"   value={openJobs} sub={`${totalCandidates} candidates active`} icon={Briefcase} tone="blue" />
        <StatCard label="Cash balance"     value={fmtMoney(totalBalance)} sub="Net of all transactions" icon={Wallet} tone={totalBalance >= 0 ? 'green' : 'rose'} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pending leaves"   value={pendingLeaves.length} sub="Awaiting approval" icon={Inbox} tone="amber" />
        <StatCard label="Open tickets"     value={openTickets} sub="Helpdesk requests" icon={Ticket} tone="rose" />
        <StatCard label="Month income"     value={fmtMoney(monthIncome)} sub={monthName(m)} icon={ArrowUpRight} tone="green" trend="up" />
        <StatCard label="Month expenses"   value={fmtMoney(monthExpense)} sub={monthName(m)} icon={ArrowDownRight} tone="rose" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <SectionCard title="Cash flow — last 14 days" subtitle="Daily income vs expense" className="lg:col-span-2"
          headerRight={
            <div className="flex gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-500"></span>Income</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400"></span>Expense</span>
            </div>
          }>
          <div className="px-5 pt-4 pb-2">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={last14} margin={{ top: 8, right: 0, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="inc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.25}/>
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.2}/>
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${v/1000}k` : v}/>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0', boxShadow:'0 4px 12px rgba(0,0,0,0.08)' }} formatter={v => fmtMoney(v)}/>
                <Area type="monotone" dataKey="income"  stroke="#7c3aed" strokeWidth={2} fill="url(#inc)" />
                <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2} fill="url(#exp)" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-4 mt-3 pt-4 border-t border-slate-100">
              <div><div className="text-xs text-slate-400">Income this month</div><div className="text-base font-bold text-emerald-600 tabular-nums">{fmtMoney(monthIncome)}</div></div>
              <div><div className="text-xs text-slate-400">Expense this month</div><div className="text-base font-bold text-rose-500 tabular-nums">{fmtMoney(monthExpense)}</div></div>
              <div><div className="text-xs text-slate-400">Est. payroll due</div><div className="text-base font-bold text-slate-900 tabular-nums">{fmtMoney(monthPayroll)}</div></div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Expenses by category" subtitle={`${monthName(m)} ${y}`}>
          <div className="px-5 py-4">
            {expenseByCat.length ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={expenseByCat} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={3}>
                      {expenseByCat.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => fmtMoney(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }}/>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {expenseByCat.slice(0,5).map((e,i) => (
                    <div key={e.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full flex-shrink-0" style={{background: PIE_COLORS[i % PIE_COLORS.length]}}></span><span className="truncate max-w-[110px] text-slate-600">{e.name}</span></span>
                      <span className="tabular-nums text-slate-500 font-medium">{fmtMoney(e.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <EmptyState icon={Receipt} title="No expenses yet" />}
          </div>
        </SectionCard>
      </div>

      {/* Lists row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <SectionCard title="Pending leave requests"
          headerRight={<button onClick={() => navigate('leaves')} className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1">View all <ChevronRight size={11}/></button>}>
          {pendingLeaves.length ? (
            <div className="divide-y divide-slate-50">
              {pendingLeaves.slice(0,4).map(l => {
                const emp = employees.find(e=>e.id===l.employeeId);
                return (
                  <div key={l.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{emp?.name || 'Unknown'}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{fmtDate(l.startDate)} · {l.days}d · {l.type}</div>
                    </div>
                    <Badge tone="amber">Pending</Badge>
                  </div>
                );
              })}
            </div>
          ) : <EmptyState icon={Inbox} title="All caught up" description="No pending leave requests." />}
        </SectionCard>

        <SectionCard title="Recent transactions"
          headerRight={<button onClick={() => navigate('cashflow')} className="text-xs text-violet-600 font-medium flex items-center gap-1">View all <ChevronRight size={11}/></button>}>
          <div className="divide-y divide-slate-50">
            {cashflow.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4).map(c => (
              <div key={c.id} className="px-5 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{c.description}</div>
                  <div className="text-xs text-slate-400">{fmtDate(c.date)} · {c.category}</div>
                </div>
                <div className={`text-sm font-bold tabular-nums ml-3 ${c.type === 'income' ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {c.type === 'income' ? '+' : '−'}{fmtMoney(c.amount)}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Open helpdesk tickets"
          headerRight={<button onClick={() => navigate('helpdesk')} className="text-xs text-violet-600 font-medium flex items-center gap-1">View all <ChevronRight size={11}/></button>}>
          {tickets.filter(t=>t.status!=='resolved').length ? (
            <div className="divide-y divide-slate-50">
              {tickets.filter(t=>t.status!=='resolved').slice(0,4).map(t => {
                const emp = employees.find(e=>e.id===t.employeeId);
                const priorityTone = { high:'red', medium:'amber', low:'slate' };
                return (
                  <div key={t.id} className="px-5 py-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{t.subject}</div>
                      <div className="text-xs text-slate-400">{t.id} · {emp?.name} · {t.category}</div>
                    </div>
                    <Badge tone={priorityTone[t.priority]}>{t.priority}</Badge>
                  </div>
                );
              })}
            </div>
          ) : <EmptyState icon={Ticket} title="No open tickets" />}
        </SectionCard>
      </div>
    </div>
  );
}

// ============================================================================
// EMPLOYEES MODULE
// ============================================================================
function EmployeesModule({ data, currentUser }) {
  const { employees, setEmployees } = data;
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const isAdmin = currentUser.role === 'admin';

  const departments = [...new Set(employees.map(e => e.department))];
  const filtered = employees.filter(e =>
    (deptFilter === 'all' || e.department === deptFilter) &&
    (e.name.toLowerCase().includes(search.toLowerCase()) ||
     e.department.toLowerCase().includes(search.toLowerCase()) ||
     e.id.toLowerCase().includes(search.toLowerCase()))
  );

  const save = (emp) => {
    if (emp.id && employees.find(e => e.id === emp.id)) {
      setEmployees(employees.map(e => e.id === emp.id ? emp : e));
    } else {
      const id = 'EMP' + String(employees.length + 1).padStart(3, '0');
      setEmployees([...employees, { ...emp, id, status: 'active' }]);
    }
    setEditing(null);
  };

  const remove = (id) => {
    if (confirm('Remove this employee? Their historical data will remain.')) {
      setEmployees(employees.filter(e => e.id !== id));
    }
  };

  const deptCounts = departments.reduce((acc, d) => {
    acc[d] = employees.filter(e => e.department === d).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="People" title="Employees"
        description={`${employees.length} on record · ${employees.filter(e=>e.status==='active').length} active`}
        actions={<>
          <Btn variant="secondary" icon={Download} onClick={() => downloadFile(toCSV(employees), `employees-${todayISO()}.csv`)}>Export</Btn>
          {isAdmin && <Btn icon={Plus} onClick={() => setEditing({})}>Add employee</Btn>}
        </>}
      />

      {/* Dept pills */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setDeptFilter('all')} className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${deptFilter === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>All ({employees.length})</button>
        {departments.map(d => (
          <button key={d} onClick={() => setDeptFilter(d)} className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${deptFilter === d ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>{d} ({deptCounts[d]})</button>
        ))}
      </div>

      <SectionCard>
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <Search size={14} className="text-slate-300" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, department or ID…" className="flex-1 text-sm outline-none bg-transparent placeholder:text-slate-300" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3 text-right">Monthly salary</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Role</th>
                {isAdmin && <th className="px-4 py-3 w-20"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filtered.map(e => (
                <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3.5 text-slate-400 font-mono text-xs">{e.id}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {e.name.split(' ').map(n=>n[0]).slice(0,2).join('')}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{e.name}</div>
                        <div className="text-xs text-slate-400">{e.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">{e.department}</td>
                  <td className="px-4 py-3.5 text-slate-600">{e.position}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-slate-900">{fmtMoney(e.monthlySalary)}</td>
                  <td className="px-4 py-3.5 text-slate-500 text-xs">{fmtDate(e.joinDate)}</td>
                  <td className="px-4 py-3.5"><Badge tone={e.status === 'active' ? 'green' : 'slate'}>{e.status}</Badge></td>
                  <td className="px-4 py-3.5"><Badge tone={e.role === 'admin' ? 'violet' : e.role === 'manager' ? 'blue' : 'slate'}>{e.role}</Badge></td>
                  {isAdmin && (
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1">
                        <button onClick={()=>setEditing(e)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"><Pencil size={13}/></button>
                        <button onClick={()=>remove(e.id)} className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={13}/></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={isAdmin ? 9 : 8}><EmptyState icon={Users} title="No matches" description="Try a different search term." /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <EmployeeForm open={!!editing} onClose={()=>setEditing(null)} onSave={save} initial={editing} employees={employees} />
    </div>
  );
}

function EmployeeForm({ open, onClose, onSave, initial, employees }) {
  const [form, setForm] = useState({});
  useEffect(() => { setForm(initial || {}); }, [initial]);
  const update = (k,v) => setForm({...form, [k]: v});

  const submit = () => {
    if (!form.name || !form.department || !form.monthlySalary) return alert('Name, department and salary are required.');
    onSave({
      ...form,
      monthlySalary: Number(form.monthlySalary),
      allowances: Number(form.allowances || 0),
      taxRate: Number(form.taxRate || 0),
      loanDeduction: Number(form.loanDeduction || 0),
      joinDate: form.joinDate || todayISO(),
      role: form.role || 'employee',
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={initial?.id ? 'Edit employee' : 'Add employee'} size="lg">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Full name *"           value={form.name || ''} onChange={e=>update('name', e.target.value)} placeholder="Ahmed Khan"/>
        <Input label="Email"                 value={form.email || ''} onChange={e=>update('email', e.target.value)} placeholder="ahmed@company.pk"/>
        <Input label="Department *"          value={form.department || ''} onChange={e=>update('department', e.target.value)} placeholder="Engineering"/>
        <Input label="Position"              value={form.position || ''} onChange={e=>update('position', e.target.value)} placeholder="Software Engineer"/>
        <Input label="Monthly salary (Rs) *" type="number" value={form.monthlySalary || ''} onChange={e=>update('monthlySalary', e.target.value)} placeholder="120000"/>
        <Input label="Allowances (Rs)"       type="number" value={form.allowances || ''} onChange={e=>update('allowances', e.target.value)} placeholder="10000"/>
        <Input label="Tax rate (%)"          type="number" value={form.taxRate || ''} onChange={e=>update('taxRate', e.target.value)} placeholder="5"/>
        <Input label="Loan deduction (Rs/mo)"type="number" value={form.loanDeduction || ''} onChange={e=>update('loanDeduction', e.target.value)} placeholder="0"/>
        <Input label="Joining date"          type="date" value={form.joinDate || ''} onChange={e=>update('joinDate', e.target.value)}/>
        <Select label="Role" value={form.role || 'employee'} onChange={e=>update('role', e.target.value)} options={[
          {value:'employee', label:'Employee'}, {value:'manager', label:'Manager'}, {value:'admin', label:'HR Admin'}
        ]}/>
        <Select label="Manager" value={form.managerId || ''} onChange={e=>update('managerId', e.target.value)}
          options={[{value:'', label:'— None —'}, ...employees.filter(e=>e.id !== form.id).map(e=>({value:e.id, label:`${e.name} (${e.id})`}))]}/>
        <Select label="Status" value={form.status || 'active'} onChange={e=>update('status', e.target.value)} options={[{value:'active',label:'Active'},{value:'inactive',label:'Inactive'}]}/>
      </div>
      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={submit}>{initial?.id ? 'Save changes' : 'Add employee'}</Btn>
      </div>
    </Modal>
  );
}

// ============================================================================
// ATTENDANCE MODULE
// ============================================================================
function AttendanceModule({ data, currentUser }) {
  const { employees, attendance, setAttendance, leaves } = data;
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [search, setSearch] = useState('');
  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'manager';

  const days = daysInMonth(year, month);
  const monthPrefix = `${year}-${pad(month)}`;

  const visibleEmployees = currentUser.role === 'employee'
    ? employees.filter(e => e.id === currentUser.id)
    : employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

  const getCell = (empId, day) => {
    const date = `${monthPrefix}-${pad(day)}`;
    const rec = attendance.find(a => a.employeeId === empId && a.date === date);
    if (rec) return rec.status;
    const onLeave = leaves.find(l => l.employeeId === empId && l.status === 'approved' && date >= l.startDate && date <= l.endDate);
    if (onLeave) return 'leave';
    const dow = new Date(year, month-1, day).getDay();
    if (dow === 0) return 'off';
    if (date > todayISO()) return null;
    return null;
  };

  const cycleStatus = (empId, day) => {
    if (!isAdmin) return;
    const date = `${monthPrefix}-${pad(day)}`;
    if (date > todayISO()) return;
    const cycle = ['present','absent','half',null];
    const rec = attendance.find(a => a.employeeId === empId && a.date === date);
    const cur = rec?.status;
    const next = cycle[(cycle.indexOf(cur) + 1) % cycle.length];
    if (next === null) {
      setAttendance(attendance.filter(a => !(a.employeeId === empId && a.date === date)));
    } else if (rec) {
      setAttendance(attendance.map(a => a.id === rec.id ? { ...a, status: next } : a));
    } else {
      setAttendance([...attendance, { id: uid(), employeeId: empId, date, status: next, checkIn: '09:00', checkOut: next === 'half' ? '13:30' : '18:00' }]);
    }
  };

  const cellClass = (s) => {
    switch (s) {
      case 'present': return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200';
      case 'absent':  return 'bg-rose-100 text-rose-600 hover:bg-rose-200';
      case 'half':    return 'bg-amber-100 text-amber-700 hover:bg-amber-200';
      case 'leave':   return 'bg-blue-100 text-blue-700';
      case 'off':     return 'bg-slate-100 text-slate-300';
      default:        return 'bg-white border border-dashed border-slate-200 text-slate-200 hover:bg-slate-50';
    }
  };
  const cellLetter = (s) => ({ present:'P', absent:'A', half:'½', leave:'L', off:'·' }[s] || '');

  const summary = useMemo(() => {
    const out = {};
    for (const emp of employees) {
      const recs = attendance.filter(a => a.employeeId === emp.id && a.date.startsWith(monthPrefix));
      const empLeaves = leaves.filter(l => l.employeeId === emp.id && l.status === 'approved' && l.startDate.startsWith(monthPrefix));
      out[emp.id] = {
        present: recs.filter(r=>r.status==='present').length,
        half:    recs.filter(r=>r.status==='half').length,
        absent:  recs.filter(r=>r.status==='absent').length,
        leave:   empLeaves.reduce((s,l) => s + l.days, 0),
      };
    }
    return out;
  }, [attendance, leaves, employees, monthPrefix]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Time" title="Attendance"
        description={`${monthName(month)} ${year} — ${isAdmin ? 'click any cell to cycle status' : 'your monthly record'}`}
        actions={<>
          <Select value={month} onChange={e=>setMonth(Number(e.target.value))} options={Array.from({length:12},(_,i)=>({value:i+1,label:monthName(i+1)}))} />
          <Select value={year} onChange={e=>setYear(Number(e.target.value))} options={[now.getFullYear()-1, now.getFullYear(), now.getFullYear()+1].map(y=>({value:y,label:String(y)}))} />
          <Btn variant="secondary" icon={Download} onClick={()=>{
            const rows = employees.map(e=>({id:e.id,name:e.name,department:e.department,...summary[e.id]}));
            downloadFile(toCSV(rows),`attendance-${monthPrefix}.csv`);
          }}>Export</Btn>
        </>}
      />

      <div className="flex flex-wrap gap-3 text-xs">
        {[['present','P','bg-emerald-100 text-emerald-700','Present'],['half','½','bg-amber-100 text-amber-700','Half-day'],['absent','A','bg-rose-100 text-rose-600','Absent'],['leave','L','bg-blue-100 text-blue-700','On leave'],['off','·','bg-slate-100 text-slate-400','Off-day']].map(([,l,cls,lbl])=>(
          <span key={lbl} className="flex items-center gap-1.5">
            <span className={`w-6 h-6 rounded-md ${cls} flex items-center justify-center font-bold text-xs`}>{l}</span>
            <span className="text-slate-500">{lbl}</span>
          </span>
        ))}
      </div>

      {isAdmin && (
        <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3">
          <Search size={14} className="text-slate-300" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Filter employees…" className="flex-1 text-sm outline-none placeholder:text-slate-300" />
        </div>
      )}

      <SectionCard>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-left font-semibold text-slate-500 sticky left-0 bg-slate-50 z-10 min-w-[160px]">Employee</th>
                {Array.from({length: days}, (_,i) => i+1).map(d => {
                  const dow = new Date(year, month-1, d).getDay();
                  return (
                    <th key={d} className={`px-0.5 py-2 text-center font-semibold min-w-[28px] ${dow === 0 ? 'text-slate-300' : 'text-slate-500'}`}>{d}</th>
                  );
                })}
                <th className="px-3 py-2 text-center text-slate-500 min-w-[36px]">P</th>
                <th className="px-3 py-2 text-center text-slate-500 min-w-[36px]">A</th>
                <th className="px-3 py-2 text-center text-slate-500 min-w-[36px]">½</th>
                <th className="px-3 py-2 text-center text-slate-500 min-w-[36px]">L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {visibleEmployees.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2 font-medium text-slate-900 sticky left-0 bg-white">{emp.name.split(' ').slice(0,2).join(' ')}</td>
                  {Array.from({length: days}, (_,i) => i+1).map(d => {
                    const s = getCell(emp.id, d);
                    return (
                      <td key={d} className="px-0.5 py-1.5 text-center">
                        <button
                          onClick={() => cycleStatus(emp.id, d)}
                          className={`w-6 h-6 rounded-md flex items-center justify-center font-bold mx-auto transition-all ${cellClass(s)} ${isAdmin && s !== 'off' && s !== 'leave' ? 'cursor-pointer' : 'cursor-default'}`}
                          title={s || 'Not marked'}
                        >{cellLetter(s)}</button>
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-center font-semibold text-emerald-600">{summary[emp.id]?.present || 0}</td>
                  <td className="px-3 py-2 text-center font-semibold text-rose-500">{summary[emp.id]?.absent || 0}</td>
                  <td className="px-3 py-2 text-center font-semibold text-amber-600">{summary[emp.id]?.half || 0}</td>
                  <td className="px-3 py-2 text-center font-semibold text-blue-600">{summary[emp.id]?.leave || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

// ============================================================================
// LEAVES MODULE
// ============================================================================
function LeavesModule({ data, currentUser }) {
  const { employees, leaves, setLeaves } = data;
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'manager';

  const visible = leaves.filter(l => {
    const isOwn = l.employeeId === currentUser.id;
    const accessible = isAdmin || isOwn;
    const statusMatch = filter === 'all' || l.status === filter;
    return accessible && statusMatch;
  });

  const approve = (id) => setLeaves(leaves.map(l => l.id === id ? { ...l, status: 'approved' } : l));
  const reject  = (id) => setLeaves(leaves.map(l => l.id === id ? { ...l, status: 'rejected' } : l));
  const remove  = (id) => { if (confirm('Delete this leave request?')) setLeaves(leaves.filter(l => l.id !== id)); };

  const submit = (form) => {
    setLeaves([...leaves, {
      ...form, id: uid(), status: 'pending',
      days: diffDays(form.startDate, form.endDate),
      requestDate: todayISO(),
    }]);
    setShowForm(false);
  };

  const tonemap = { approved: 'green', pending: 'amber', rejected: 'red' };
  const typeTone = { vacation: 'blue', sick: 'rose', personal: 'violet' };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Time off" title="Leave requests"
        description={`${leaves.filter(l=>l.status==='pending').length} pending approval`}
        actions={<Btn icon={Plus} onClick={()=>setShowForm(true)}>Request leave</Btn>}
      />

      <div className="flex gap-2">
        {['all','pending','approved','rejected'].map(s => (
          <button key={s} onClick={()=>setFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border capitalize transition-all ${filter === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
            {s} ({s==='all' ? leaves.length : leaves.filter(l=>l.status===s).length})
          </button>
        ))}
      </div>

      <SectionCard>
        {visible.length ? (
          <div className="divide-y divide-slate-50">
            {visible.sort((a,b)=>b.requestDate?.localeCompare(a.requestDate||'')||0).map(l => {
              const emp = employees.find(e=>e.id===l.employeeId);
              return (
                <div key={l.id} className="px-5 py-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {emp?.name?.split(' ').map(n=>n[0]).slice(0,2).join('') || '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900">{emp?.name || 'Unknown'}</span>
                        <Badge tone={typeTone[l.type] || 'slate'}>{l.type}</Badge>
                        <Badge tone={tonemap[l.status]}>{l.status}</Badge>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{fmtDate(l.startDate)} – {fmtDate(l.endDate)} · <strong>{l.days}</strong> day{l.days>1?'s':''}</div>
                      <div className="text-xs text-slate-400 mt-0.5 italic">"{l.reason}"</div>
                    </div>
                  </div>
                  {isAdmin && l.status === 'pending' && (
                    <div className="flex gap-2">
                      <Btn variant="success" size="sm" icon={Check} onClick={()=>approve(l.id)}>Approve</Btn>
                      <Btn variant="danger" size="sm" icon={X} onClick={()=>reject(l.id)}>Reject</Btn>
                    </div>
                  )}
                  {isAdmin && l.status !== 'pending' && (
                    <button onClick={()=>remove(l.id)} className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={13}/></button>
                  )}
                </div>
              );
            })}
          </div>
        ) : <EmptyState icon={Inbox} title="No leave requests" description="Requests will appear here." />}
      </SectionCard>

      <LeaveForm open={showForm} onClose={()=>setShowForm(false)} onSubmit={submit} employees={employees} currentUser={currentUser}/>
    </div>
  );
}

function LeaveForm({ open, onClose, onSubmit, employees, currentUser }) {
  const [form, setForm] = useState({});
  useEffect(() => { if (open) setForm({ employeeId: currentUser.id, type: 'vacation', startDate: todayISO(), endDate: todayISO(), reason: '' }); }, [open, currentUser]);
  const update = (k,v) => setForm({...form, [k]: v});
  const days = form.startDate && form.endDate ? diffDays(form.startDate, form.endDate) : 0;

  const submit = () => {
    if (!form.reason) return alert('Please provide a reason.');
    if (form.endDate < form.startDate) return alert('End date cannot be before start date.');
    onSubmit(form);
  };

  return (
    <Modal open={open} onClose={onClose} title="Request leave">
      <div className="space-y-4">
        <Select label="Employee" value={form.employeeId||''} onChange={e=>update('employeeId',e.target.value)}
          options={employees.map(e=>({value:e.id,label:`${e.name} (${e.id})`}))}
          disabled={currentUser.role==='employee'}/>
        <Select label="Leave type" value={form.type||'vacation'} onChange={e=>update('type',e.target.value)}
          options={[{value:'vacation',label:'Vacation'},{value:'sick',label:'Sick'},{value:'personal',label:'Personal'},{value:'emergency',label:'Emergency'}]}/>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Start date" type="date" value={form.startDate||''} onChange={e=>update('startDate',e.target.value)}/>
          <Input label="End date"   type="date" value={form.endDate||''}   onChange={e=>update('endDate',e.target.value)}/>
        </div>
        <div className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">Duration: <span className="font-bold text-slate-700">{days} day{days!==1?'s':''}</span></div>
        <Textarea label="Reason" rows={3} value={form.reason||''} onChange={e=>update('reason',e.target.value)} placeholder="Brief reason for the leave…"/>
      </div>
      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={submit}>Submit request</Btn>
      </div>
    </Modal>
  );
}

// ============================================================================
// PAYROLL MODULE
// ============================================================================
function computePayroll(emp, attendance, leaves, year, month) {
  const monthPrefix = `${year}-${pad(month)}`;
  const totalDays = daysInMonth(year, month);
  const recs = attendance.filter(a => a.employeeId === emp.id && a.date.startsWith(monthPrefix));
  const absent = recs.filter(r => r.status === 'absent').length;
  const half   = recs.filter(r => r.status === 'half').length;
  const absences = absent + (half * 0.5);
  const workingDays = totalDays - absences;
  const totalPay = emp.monthlySalary + (emp.allowances || 0);
  const perDayWage = totalPay / totalDays;
  const gross = workingDays * perDayWage;
  const tax = gross * ((emp.taxRate || 0) / 100);
  const loan = emp.loanDeduction || 0;
  const net = gross - tax - loan;
  return {
    employeeId: emp.id, month, year,
    monthDays: totalDays, absences, workingDays,
    perDayWage: Math.round(perDayWage),
    baseSalary: emp.monthlySalary, allowances: emp.allowances || 0,
    gross: Math.round(gross), tax: Math.round(tax), loan, deductions: Math.round(tax) + loan,
    net: Math.round(net),
  };
}

function PayrollModule({ data, currentUser, navigate }) {
  const { employees, attendance, leaves, payroll, setPayroll, cashflow, setCashflow } = data;
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const isAdmin = currentUser.role === 'admin';

  const visibleEmployees = currentUser.role === 'employee' ? employees.filter(e => e.id === currentUser.id) : employees;

  const computed = useMemo(() => {
    return visibleEmployees.map(emp => {
      const existing = payroll.find(p => p.employeeId === emp.id && p.month === month && p.year === year);
      return existing || { ...computePayroll(emp, attendance, leaves, year, month), status: 'draft' };
    });
  }, [visibleEmployees, attendance, leaves, year, month, payroll]);

  const finalizePayroll = () => {
    if (!confirm(`Finalize payroll for ${monthName(month)} ${year}?`)) return;
    const newRecords = computed.map(c => ({ ...c, id: c.id || uid(), status: 'paid', paidDate: todayISO() }));
    const others = payroll.filter(p => !(p.month === month && p.year === year));
    setPayroll([...others, ...newRecords]);
    const total = newRecords.reduce((s,r) => s + r.net, 0);
    setCashflow([...cashflow, { id: uid(), date: todayISO(), type: 'expense', category: 'Payroll', amount: total, description: `Payroll disbursement — ${monthName(month)} ${year}` }]);
    alert(`Payroll finalized. ${fmtMoney(total)} recorded.`);
  };

  const isFinalized = payroll.some(p => p.month === month && p.year === year && p.status === 'paid');
  const totalGross = computed.reduce((s,c) => s + c.gross, 0);
  const totalNet   = computed.reduce((s,c) => s + c.net, 0);
  const totalDed   = computed.reduce((s,c) => s + c.deductions, 0);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Compensation" title="Payroll"
        description={`${monthName(month)} ${year}`}
        badge={isFinalized ? <Badge tone="green">Paid</Badge> : <Badge tone="amber">Draft</Badge>}
        actions={<>
          <Select value={month} onChange={e=>setMonth(Number(e.target.value))} options={Array.from({length:12},(_,i)=>({value:i+1,label:monthName(i+1)}))} />
          <Select value={year} onChange={e=>setYear(Number(e.target.value))} options={[now.getFullYear()-1, now.getFullYear()].map(y=>({value:y,label:String(y)}))} />
          {isAdmin && !isFinalized && <Btn variant="accent" icon={Check} onClick={finalizePayroll}>Finalize & pay</Btn>}
        </>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Headcount"      value={computed.length} icon={Users} tone="violet"/>
        <StatCard label="Gross total"    value={fmtMoney(totalGross)} icon={DollarSign} tone="slate"/>
        <StatCard label="Total deductions" value={fmtMoney(totalDed)} icon={ArrowDownRight} tone="rose"/>
        <StatCard label="Net payable"    value={fmtMoney(totalNet)} icon={Wallet} tone="green"/>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-800 flex gap-2.5 items-start">
        <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-amber-500"/>
        <div><strong>Calculation:</strong> Per-day = (Salary + Allowances) ÷ Days · Gross = Working days × Per-day · Net = Gross − Tax − Loan</div>
      </div>

      <SectionCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="px-4 py-3">Employee</th>
                <th className="px-3 py-3 text-right">Days</th>
                <th className="px-3 py-3 text-right">Abs.</th>
                <th className="px-3 py-3 text-right">Work</th>
                <th className="px-3 py-3 text-right">Per day</th>
                <th className="px-3 py-3 text-right">Gross</th>
                <th className="px-3 py-3 text-right">Tax</th>
                <th className="px-3 py-3 text-right">Loan</th>
                <th className="px-3 py-3 text-right">Net</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {computed.map(p => {
                const emp = employees.find(e=>e.id===p.employeeId);
                return (
                  <tr key={p.employeeId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{emp?.name}<div className="text-xs text-slate-400 font-normal">{emp?.position}</div></td>
                    <td className="px-3 py-3.5 text-right tabular-nums text-slate-600">{p.monthDays}</td>
                    <td className="px-3 py-3.5 text-right tabular-nums text-rose-500 font-semibold">{p.absences}</td>
                    <td className="px-3 py-3.5 text-right tabular-nums text-emerald-600 font-semibold">{p.workingDays}</td>
                    <td className="px-3 py-3.5 text-right tabular-nums text-slate-600">{fmtMoney(p.perDayWage)}</td>
                    <td className="px-3 py-3.5 text-right tabular-nums text-slate-900 font-semibold">{fmtMoney(p.gross)}</td>
                    <td className="px-3 py-3.5 text-right tabular-nums text-slate-500">{fmtMoney(p.tax)}</td>
                    <td className="px-3 py-3.5 text-right tabular-nums text-slate-500">{fmtMoney(p.loan)}</td>
                    <td className="px-3 py-3.5 text-right tabular-nums text-emerald-600 font-bold">{fmtMoney(p.net)}</td>
                    <td className="px-3 py-3.5">
                      <button onClick={()=>navigate('payslips', { empId: p.employeeId, month, year })} className="text-xs text-violet-600 hover:text-violet-700 font-semibold">Payslip →</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

// ============================================================================
// PAYSLIP MODULE
// ============================================================================
function PayslipModule({ data, currentUser, navigationState }) {
  const { employees, attendance, leaves, payroll } = data;
  const now = new Date();
  const [year, setYear] = useState(navigationState?.year || now.getFullYear());
  const [month, setMonth] = useState(navigationState?.month || now.getMonth() + 1);
  const [empId, setEmpId] = useState(navigationState?.empId || (currentUser.role==='employee' ? currentUser.id : employees[0]?.id));

  const employee = employees.find(e => e.id === empId);
  const existing = payroll.find(p => p.employeeId === empId && p.month === month && p.year === year);
  const slip = existing || (employee ? { ...computePayroll(employee, attendance, leaves, year, month), status: 'draft' } : null);

  const printSlip = () => {
    const printWin = window.open('', '_blank');
    const html = `<html><head><title>Payslip</title>
    <style>body{font-family:system-ui,sans-serif;max-width:680px;margin:40px auto;padding:30px;color:#0f172a}
    .hd{display:flex;justify-content:space-between;border-bottom:2px solid #7c3aed;padding-bottom:15px;margin-bottom:25px}
    h1{margin:0;font-size:20px;color:#7c3aed}.muted{color:#64748b;font-size:12px}
    table{width:100%;border-collapse:collapse;margin:12px 0}
    td{padding:7px 4px;border-bottom:1px solid #f1f5f9;font-size:13px}.label{color:#64748b}.right{text-align:right;font-variant-numeric:tabular-nums}
    .total{border-top:2px solid #e2e8f0;font-weight:700;font-size:15px;padding-top:10px}
    .net{background:#f5f3ff;padding:16px;border-radius:10px;margin-top:18px;display:flex;justify-content:space-between;align-items:center;border:1px solid #ddd6fe}
    .net-v{font-size:24px;font-weight:800;color:#7c3aed}.gr{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:18px}
    .st{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;margin:18px 0 6px}
    </style></head><body>
    <div class="hd"><div><h1>Payslip</h1><div class="muted">${monthName(month)} ${year}</div></div>
    <div style="text-align:right"><div style="font-weight:700">Workforce HR</div><div class="muted">Lahore, Pakistan</div></div></div>
    <div class="gr">
      <div><div class="st">Employee</div><div style="font-weight:700;font-size:15px">${employee?.name}</div>
      <div class="muted">${employee?.id} · ${employee?.position}</div><div class="muted">${employee?.department}</div></div>
      <div><div class="st">Pay period</div><div>${monthName(month)} 1 – ${slip?.monthDays}, ${year}</div>
      <div class="muted">Status: ${slip?.status === 'paid' ? 'Paid' : 'Draft'}</div></div>
    </div>
    <div class="st">Earnings</div>
    <table><tr><td class="label">Base salary</td><td class="right">${fmtMoney(slip?.baseSalary)}</td></tr>
    <tr><td class="label">Allowances</td><td class="right">${fmtMoney(slip?.allowances)}</td></tr>
    <tr><td class="total">Gross (${slip?.workingDays} working days)</td><td class="total right">${fmtMoney(slip?.gross)}</td></tr></table>
    <div class="st">Deductions</div>
    <table><tr><td class="label">Income tax (${employee?.taxRate||0}%)</td><td class="right">−${fmtMoney(slip?.tax)}</td></tr>
    <tr><td class="label">Loan / other</td><td class="right">−${fmtMoney(slip?.loan)}</td></tr>
    <tr><td class="total">Total deductions</td><td class="total right">−${fmtMoney(slip?.deductions)}</td></tr></table>
    <div class="net"><span>Net pay</span><span class="net-v">${fmtMoney(slip?.net)}</span></div>
    <p class="muted" style="text-align:center;margin-top:24px;font-size:11px">Computer generated · ${fmtDate(todayISO())}</p>
    </body></html>`;
    printWin.document.write(html); printWin.document.close();
    setTimeout(() => printWin.print(), 250);
  };

  if (!employee || !slip) return <EmptyState icon={FileText} title="Select an employee" />;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Payslip" title={employee.name}
        description={`${monthName(month)} ${year} payslip`}
        badge={<Badge tone={slip.status==='paid'?'green':'amber'}>{slip.status==='paid'?'Paid':'Draft'}</Badge>}
        actions={<>
          {currentUser.role !== 'employee' && (
            <Select value={empId} onChange={e=>setEmpId(e.target.value)} options={employees.map(e=>({value:e.id,label:e.name}))}/>
          )}
          <Select value={month} onChange={e=>setMonth(Number(e.target.value))} options={Array.from({length:12},(_,i)=>({value:i+1,label:monthName(i+1)}))}/>
          <Select value={year} onChange={e=>setYear(Number(e.target.value))} options={[now.getFullYear()-1, now.getFullYear()].map(y=>({value:y,label:String(y)}))}/>
          <Btn variant="secondary" icon={Printer} onClick={printSlip}>Print</Btn>
        </>}
      />

      <div className="max-w-2xl">
        <SectionCard>
          <div className="px-6 py-5">
            <div className="flex justify-between items-start pb-5 mb-5 border-b border-slate-100">
              <div>
                <div className="text-xl font-bold text-slate-900">{employee.name}</div>
                <div className="text-sm text-slate-400 mt-0.5">{employee.id} · {employee.position} · {employee.department}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-700">{monthName(month)} {year}</div>
                <div className="text-xs text-slate-400">Pay period: {monthName(month)} 1–{slip.monthDays}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Earnings</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Base salary</span><span className="tabular-nums">{fmtMoney(slip.baseSalary)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Allowances</span><span className="tabular-nums">{fmtMoney(slip.allowances)}</span></div>
                  <div className="flex justify-between pt-2 border-t border-slate-100 font-bold"><span>Gross</span><span className="tabular-nums">{fmtMoney(slip.gross)}</span></div>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Deductions</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Tax ({employee.taxRate}%)</span><span className="tabular-nums text-rose-500">−{fmtMoney(slip.tax)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Loan</span><span className="tabular-nums text-rose-500">−{fmtMoney(slip.loan)}</span></div>
                  <div className="flex justify-between pt-2 border-t border-slate-100 font-bold"><span>Total deductions</span><span className="tabular-nums text-rose-500">−{fmtMoney(slip.deductions)}</span></div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-violet-50 to-violet-100 rounded-xl p-5 flex justify-between items-center border border-violet-200">
              <div>
                <div className="text-sm font-semibold text-violet-700">Net pay</div>
                <div className="text-xs text-violet-500 mt-0.5">{slip.workingDays} of {slip.monthDays} days worked</div>
              </div>
              <div className="text-3xl font-bold text-violet-700 tabular-nums">{fmtMoney(slip.net)}</div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ============================================================================
// CASHFLOW MODULE
// ============================================================================
function CashFlowModule({ data, currentUser }) {
  const { cashflow, setCashflow } = data;
  const now = new Date();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({});
  const [filter, setFilter] = useState('all');

  const sorted = cashflow.slice().sort((a,b) => b.date.localeCompare(a.date));
  const visible = filter === 'all' ? sorted : sorted.filter(c => c.type === filter);

  const totalIncome  = cashflow.filter(c=>c.type==='income').reduce((s,c)=>s+c.amount,0);
  const totalExpense = cashflow.filter(c=>c.type==='expense').reduce((s,c)=>s+c.amount,0);
  const balance = totalIncome - totalExpense;

  const save = () => {
    if (!form.date || !form.type || !form.amount || !form.description) return alert('All fields required.');
    setCashflow([...cashflow, { ...form, id: uid(), amount: Number(form.amount), category: form.category || 'Other' }]);
    setShowForm(false); setForm({});
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Finance" title="Cash flow"
        description="All income and expense transactions"
        actions={<>
          <Btn variant="secondary" icon={Download} onClick={()=>downloadFile(toCSV(sorted),`cashflow-${todayISO()}.csv`)}>Export</Btn>
          {currentUser.role==='admin' && <Btn icon={Plus} onClick={()=>setShowForm(true)}>Add transaction</Btn>}
        </>}
      />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total income"  value={fmtMoney(totalIncome)}  icon={ArrowUpRight} tone="green"/>
        <StatCard label="Total expense" value={fmtMoney(totalExpense)} icon={ArrowDownRight} tone="rose"/>
        <StatCard label="Net balance"   value={fmtMoney(balance)} icon={Wallet} tone={balance>=0?'green':'rose'}/>
      </div>

      <div className="flex gap-2">
        {['all','income','expense'].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} className={`px-3 py-1.5 text-xs font-medium rounded-lg border capitalize transition-all ${filter===f?'bg-slate-900 text-white border-slate-900':'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>{f}</button>
        ))}
      </div>

      <SectionCard>
        <div className="divide-y divide-slate-50">
          {visible.map(c => (
            <div key={c.id} className="px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.type==='income'?'bg-emerald-50':'bg-rose-50'}`}>
                  {c.type==='income' ? <ArrowUpRight size={14} className="text-emerald-600"/> : <ArrowDownRight size={14} className="text-rose-500"/>}
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-900">{c.description}</div>
                  <div className="text-xs text-slate-400">{fmtDate(c.date)} · {c.category}</div>
                </div>
              </div>
              <div className={`text-sm font-bold tabular-nums ${c.type==='income'?'text-emerald-600':'text-rose-500'}`}>
                {c.type==='income'?'+':'−'}{fmtMoney(c.amount)}
              </div>
            </div>
          ))}
          {!visible.length && <EmptyState icon={Wallet} title="No transactions" />}
        </div>
      </SectionCard>

      <Modal open={showForm} onClose={()=>setShowForm(false)} title="Add transaction">
        <div className="space-y-4">
          <Select label="Type" value={form.type||'income'} onChange={e=>setForm({...form,type:e.target.value})} options={[{value:'income',label:'Income'},{value:'expense',label:'Expense'}]}/>
          <Input label="Amount (Rs)" type="number" value={form.amount||''} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="50000"/>
          <Input label="Date" type="date" value={form.date||''} onChange={e=>setForm({...form,date:e.target.value})}/>
          <Input label="Category" value={form.category||''} onChange={e=>setForm({...form,category:e.target.value})} placeholder="Sales Revenue, Rent…"/>
          <Input label="Description" value={form.description||''} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Brief description…"/>
        </div>
        <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
          <Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancel</Btn>
          <Btn onClick={save}>Add transaction</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================================
// EXPENSES MODULE
// ============================================================================
function ExpensesModule({ data, currentUser }) {
  const { cashflow, categories, setCategories } = data;
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [editingCat, setEditingCat] = useState(null);
  const monthPrefix = `${year}-${pad(month)}`;

  const budgetData = categories.map(cat => {
    const spent = cashflow.filter(c => c.type==='expense' && c.date.startsWith(monthPrefix) && c.category===cat.name).reduce((s,c)=>s+c.amount,0);
    const pct = cat.monthlyBudget > 0 ? Math.min(100, Math.round(spent/cat.monthlyBudget*100)) : 0;
    return { ...cat, spent, pct, variance: cat.monthlyBudget - spent };
  });

  const saveCat = (cat) => {
    if (cat.id && categories.find(c=>c.id===cat.id)) {
      setCategories(categories.map(c => c.id===cat.id ? cat : c));
    } else {
      setCategories([...categories, { ...cat, id: uid() }]);
    }
    setEditingCat(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Finance" title="Expense budgets"
        description="Monthly budget vs actual tracking"
        actions={<>
          <Select value={month} onChange={e=>setMonth(Number(e.target.value))} options={Array.from({length:12},(_,i)=>({value:i+1,label:monthName(i+1)}))}/>
          <Select value={year} onChange={e=>setYear(Number(e.target.value))} options={[now.getFullYear()-1, now.getFullYear()].map(y=>({value:y,label:String(y)}))}/>
          {currentUser.role==='admin' && <Btn icon={Plus} onClick={()=>setEditingCat({})}>Add category</Btn>}
        </>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgetData.map(cat => (
          <SectionCard key={cat.id}
            headerRight={currentUser.role==='admin' && <button onClick={()=>setEditingCat(cat)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><Pencil size={13}/></button>}>
            <div className="px-5 py-4">
              <div className="flex justify-between items-start mb-3">
                <div className="font-semibold text-slate-900">{cat.name}</div>
                <Badge tone={cat.pct>90?'red':cat.pct>70?'amber':'green'}>{cat.pct}%</Badge>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
                <div className={`h-2 rounded-full transition-all ${cat.pct>90?'bg-rose-500':cat.pct>70?'bg-amber-500':'bg-emerald-500'}`} style={{width:`${cat.pct}%`}}></div>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Spent: <strong className="text-slate-700">{fmtMoney(cat.spent)}</strong></span>
                <span>Budget: <strong className="text-slate-700">{fmtMoney(cat.monthlyBudget)}</strong></span>
                <span className={cat.variance>=0?'text-emerald-600 font-semibold':'text-rose-500 font-semibold'}>
                  {cat.variance>=0?'+':''}{fmtMoney(cat.variance)}
                </span>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>

      <Modal open={!!editingCat} onClose={()=>setEditingCat(null)} title={editingCat?.id ? 'Edit category' : 'Add category'}>
        <div className="space-y-4">
          <Input label="Category name" value={editingCat?.name||''} onChange={e=>setEditingCat({...editingCat,name:e.target.value})} placeholder="Marketing"/>
          <Input label="Monthly budget (Rs)" type="number" value={editingCat?.monthlyBudget||''} onChange={e=>setEditingCat({...editingCat,monthlyBudget:Number(e.target.value)})} placeholder="80000"/>
        </div>
        <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
          <Btn variant="secondary" onClick={()=>setEditingCat(null)}>Cancel</Btn>
          <Btn onClick={()=>saveCat(editingCat)}>Save</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================================
// RECRUITMENT / ATS MODULE (NEW)
// ============================================================================
const STAGES = ['applied','screening','interview','offer','hired','rejected'];
const STAGE_COLORS = { applied:'slate', screening:'blue', interview:'violet', offer:'amber', hired:'green', rejected:'red' };

function RecruitmentModule({ data, currentUser }) {
  const { recruitment, setRecruitment, employees } = data;
  const [view, setView] = useState('jobs'); // jobs | pipeline
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showCandForm, setShowCandForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'manager';

  const job = recruitment.find(r => r.id === selectedJob);

  const saveJob = (form) => {
    if (form.id && recruitment.find(r=>r.id===form.id)) {
      setRecruitment(recruitment.map(r => r.id===form.id ? {...r,...form} : r));
    } else {
      setRecruitment([...recruitment, { ...form, id: uid(), candidates: [], openDate: todayISO() }]);
    }
    setShowJobForm(false); setEditingJob(null);
  };

  const moveCandidate = (jobId, candId, newStage) => {
    setRecruitment(recruitment.map(r => r.id!==jobId ? r : {
      ...r, candidates: r.candidates.map(c => c.id!==candId ? c : { ...c, stage: newStage })
    }));
  };

  const addCandidate = (jobId, cand) => {
    setRecruitment(recruitment.map(r => r.id!==jobId ? r : {
      ...r, candidates: [...r.candidates, { ...cand, id: uid(), stage: 'applied', appliedDate: todayISO() }]
    }));
    setShowCandForm(false);
  };

  const deleteCandidate = (jobId, candId) => {
    setRecruitment(recruitment.map(r => r.id!==jobId ? r : {
      ...r, candidates: r.candidates.filter(c => c.id!==candId)
    }));
  };

  const totalCandidates = recruitment.reduce((s,r)=>s+r.candidates.length,0);
  const openJobs = recruitment.filter(r=>r.status==='open').length;
  const hiredThisMonth = recruitment.reduce((s,r)=>s+r.candidates.filter(c=>c.stage==='hired').length,0);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Talent" title="Recruitment"
        description={`${openJobs} open positions · ${totalCandidates} candidates`}
        actions={<>
          <div className="flex border border-slate-200 rounded-lg overflow-hidden">
            <button onClick={()=>setView('jobs')} className={`px-3 py-1.5 text-xs font-medium transition-all ${view==='jobs'?'bg-slate-900 text-white':'bg-white text-slate-600 hover:bg-slate-50'}`}>Jobs</button>
            <button onClick={()=>setView('pipeline')} className={`px-3 py-1.5 text-xs font-medium transition-all ${view==='pipeline'?'bg-slate-900 text-white':'bg-white text-slate-600 hover:bg-slate-50'}`}>Pipeline</button>
          </div>
          {isAdmin && <Btn icon={Plus} onClick={()=>{setEditingJob({}); setShowJobForm(true);}}>Post job</Btn>}
        </>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Open positions"    value={openJobs} icon={Briefcase} tone="blue"/>
        <StatCard label="Total candidates"  value={totalCandidates} icon={Users} tone="violet"/>
        <StatCard label="In interview"      value={recruitment.reduce((s,r)=>s+r.candidates.filter(c=>c.stage==='interview').length,0)} icon={Star} tone="amber"/>
        <StatCard label="Hired"             value={hiredThisMonth} icon={CheckSquare} tone="green"/>
      </div>

      {view === 'jobs' && (
        <div className="space-y-4">
          {recruitment.map(r => (
            <SectionCard key={r.id}
              headerRight={
                <div className="flex items-center gap-2">
                  <Badge tone={r.status==='open'?'green':'slate'}>{r.status}</Badge>
                  <Badge tone={r.priority==='high'?'red':r.priority==='medium'?'amber':'slate'}>{r.priority}</Badge>
                  {isAdmin && <button onClick={()=>{setEditingJob(r); setShowJobForm(true);}} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><Pencil size={13}/></button>}
                </div>
              }>
              <div className="px-5 py-4">
                <div className="flex flex-wrap gap-4 justify-between items-start mb-4">
                  <div>
                    <div className="font-semibold text-slate-900 text-base">{r.title}</div>
                    <div className="text-sm text-slate-400 mt-0.5">{r.department} · Target: {fmtDate(r.targetDate)}</div>
                    <div className="text-xs text-slate-400 mt-1 italic">{r.description}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>setSelectedJob(r.id===selectedJob?null:r.id)} className="text-xs text-violet-600 font-semibold flex items-center gap-1">
                      {r.id===selectedJob ? 'Hide' : 'View'} candidates ({r.candidates.length}) {r.id===selectedJob?<ChevronDown size={11}/>:<ChevronRight size={11}/>}
                    </button>
                    {isAdmin && r.status==='open' && <Btn size="sm" icon={UserPlus} onClick={()=>{setSelectedJob(r.id); setShowCandForm(true);}}>Add candidate</Btn>}
                  </div>
                </div>

                {/* Stage summary pills */}
                <div className="flex flex-wrap gap-2">
                  {STAGES.map(s => {
                    const n = r.candidates.filter(c=>c.stage===s).length;
                    if (!n) return null;
                    return <Badge key={s} tone={STAGE_COLORS[s]}>{s} ({n})</Badge>;
                  })}
                </div>

                {/* Expanded candidates */}
                {r.id === selectedJob && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    {r.candidates.length ? (
                      <div className="space-y-2">
                        {r.candidates.map(c => (
                          <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-xs font-bold">
                                {c.name.split(' ').map(n=>n[0]).slice(0,2).join('')}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-slate-900">{c.name}</div>
                                <div className="text-xs text-slate-400">{c.email} · {c.source}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {c.score > 0 && <span className="text-xs font-bold text-amber-600">★ {c.score}/10</span>}
                              <select value={c.stage} onChange={e=>moveCandidate(r.id, c.id, e.target.value)}
                                className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-violet-400">
                                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <button onClick={()=>deleteCandidate(r.id, c.id)} className="p-1 hover:bg-rose-50 rounded text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={12}/></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <EmptyState icon={Users} title="No candidates yet" description="Add candidates to this position." />}
                  </div>
                )}
              </div>
            </SectionCard>
          ))}
          {!recruitment.length && <EmptyState icon={Briefcase} title="No open positions" description="Post a job to start tracking candidates." action={isAdmin && <Btn icon={Plus} onClick={()=>{setEditingJob({});setShowJobForm(true);}}>Post job</Btn>}/>}
        </div>
      )}

      {view === 'pipeline' && (
        <div className="overflow-x-auto">
          <div className="flex gap-4 min-w-max pb-4">
            {STAGES.map(stage => {
              const allCands = recruitment.flatMap(r => r.candidates.filter(c=>c.stage===stage).map(c=>({...c, jobTitle:r.title})));
              return (
                <div key={stage} className="w-64 flex-shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge tone={STAGE_COLORS[stage]}>{stage}</Badge>
                    </div>
                    <span className="text-xs font-semibold text-slate-400 bg-slate-100 rounded-md px-1.5 py-0.5">{allCands.length}</span>
                  </div>
                  <div className="space-y-2">
                    {allCands.map(c => (
                      <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-3 hover:shadow-md transition-shadow cursor-default">
                        <div className="font-semibold text-sm text-slate-900">{c.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{c.jobTitle}</div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-slate-400">{c.source}</span>
                          {c.score > 0 && <span className="text-xs font-bold text-amber-500">★ {c.score}</span>}
                        </div>
                      </div>
                    ))}
                    {!allCands.length && <div className="h-16 border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-300">Empty</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Job form modal */}
      <Modal open={showJobForm} onClose={()=>{setShowJobForm(false);setEditingJob(null);}} title={editingJob?.id?'Edit job':'Post new job'}>
        {editingJob && <JobFormFields form={editingJob} onChange={setEditingJob} onSave={saveJob} onClose={()=>{setShowJobForm(false);setEditingJob(null);}}/>}
      </Modal>

      {/* Candidate form modal */}
      <Modal open={showCandForm} onClose={()=>setShowCandForm(false)} title="Add candidate">
        <CandidateForm onSave={(c)=>addCandidate(selectedJob,c)} onClose={()=>setShowCandForm(false)}/>
      </Modal>
    </div>
  );
}

function JobFormFields({ form, onChange, onSave, onClose }) {
  const f = (k,v) => onChange({...form,[k]:v});
  return (
    <div className="space-y-4">
      <Input label="Job title *" value={form.title||''} onChange={e=>f('title',e.target.value)} placeholder="Senior Frontend Developer"/>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Department" value={form.department||''} onChange={e=>f('department',e.target.value)} placeholder="Engineering"/>
        <Select label="Priority" value={form.priority||'medium'} onChange={e=>f('priority',e.target.value)} options={['high','medium','low'].map(v=>({value:v,label:v.charAt(0).toUpperCase()+v.slice(1)}))}/>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Target date" type="date" value={form.targetDate||''} onChange={e=>f('targetDate',e.target.value)}/>
        <Select label="Status" value={form.status||'open'} onChange={e=>f('status',e.target.value)} options={[{value:'open',label:'Open'},{value:'closed',label:'Closed'},{value:'on-hold',label:'On hold'}]}/>
      </div>
      <Textarea label="Job description" rows={3} value={form.description||''} onChange={e=>f('description',e.target.value)} placeholder="Briefly describe the role…"/>
      <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={()=>{if(!form.title)return alert('Title required.');onSave(form);}}>Save</Btn>
      </div>
    </div>
  );
}

function CandidateForm({ onSave, onClose }) {
  const [form, setForm] = useState({ source: 'LinkedIn', score: 0 });
  const f = (k,v) => setForm({...form,[k]:v});
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Full name *" value={form.name||''} onChange={e=>f('name',e.target.value)} placeholder="Ali Hassan"/>
        <Input label="Email" value={form.email||''} onChange={e=>f('email',e.target.value)} placeholder="ali@gmail.com"/>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Phone" value={form.phone||''} onChange={e=>f('phone',e.target.value)} placeholder="0321-1234567"/>
        <Select label="Source" value={form.source||'LinkedIn'} onChange={e=>f('source',e.target.value)} options={['LinkedIn','Indeed','Referral','Portal','Other'].map(v=>({value:v,label:v}))}/>
      </div>
      <Input label="Score (0–10)" type="number" min="0" max="10" value={form.score||0} onChange={e=>f('score',Number(e.target.value))}/>
      <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={()=>{if(!form.name)return alert('Name required.');onSave(form);}}>Add candidate</Btn>
      </div>
    </div>
  );
}

// ============================================================================
// PERFORMANCE MODULE (NEW)
// ============================================================================
function PerformanceModule({ data, currentUser }) {
  const { performance, setPerformance, employees } = data;
  const [selected, setSelected] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'manager';

  const visible = currentUser.role === 'employee'
    ? performance.filter(p => p.employeeId === currentUser.id)
    : performance;

  const updateGoal = (perfId, goalId, progress) => {
    setPerformance(performance.map(p => p.id!==perfId ? p : {
      ...p, goals: p.goals.map(g => g.id!==goalId ? g : {
        ...g, progress,
        status: progress >= 100 ? 'completed' : progress < 40 ? 'at-risk' : 'on-track'
      })
    }));
  };

  const submitReview = (perfId, rating) => {
    setPerformance(performance.map(p => p.id!==perfId ? p : { ...p, rating, reviewDate: todayISO(), status: 'reviewed' }));
    setShowReview(false);
  };

  const addPerformance = (empId) => {
    if (performance.find(p=>p.employeeId===empId && p.period==='2026-H1')) return alert('Record already exists.');
    setPerformance([...performance, { id: uid(), employeeId: empId, period: '2026-H1', goals: [], rating: null, reviewDate: null, status: 'in-progress' }]);
  };

  const avgScore = (goals) => {
    if (!goals.length) return 0;
    const weighted = goals.reduce((s,g) => s + (g.progress * g.weight / 100), 0);
    const totalWeight = goals.reduce((s,g) => s + g.weight, 0);
    return totalWeight > 0 ? Math.round(weighted / totalWeight * 100) / 100 : 0;
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="People" title="Performance"
        description="2026 H1 — goals and reviews"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Under review"   value={visible.filter(p=>p.status==='in-progress').length} icon={Target} tone="blue"/>
        <StatCard label="Reviewed"       value={visible.filter(p=>p.status==='reviewed').length} icon={CheckSquare} tone="green"/>
        <StatCard label="At risk"        value={visible.reduce((s,p)=>s+p.goals.filter(g=>g.status==='at-risk').length,0)} icon={AlertTriangle} tone="rose"/>
        <StatCard label="Avg score"      value={`${(visible.filter(p=>p.rating).reduce((s,p)=>s+p.rating,0)/Math.max(visible.filter(p=>p.rating).length,1)).toFixed(1)}/5`} icon={Star} tone="amber"/>
      </div>

      <div className="space-y-4">
        {visible.map(p => {
          const emp = employees.find(e=>e.id===p.employeeId);
          const overall = avgScore(p.goals);
          return (
            <SectionCard key={p.id}
              headerRight={
                <div className="flex items-center gap-2">
                  <Badge tone={p.status==='reviewed'?'green':p.status==='in-progress'?'blue':'slate'}>{p.status}</Badge>
                  {isAdmin && p.status==='in-progress' && <Btn size="sm" variant="accent" onClick={()=>{setSelected(p.id); setShowReview(true);}}>Submit review</Btn>}
                </div>
              }>
              <div className="px-5 py-4">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 text-white flex items-center justify-center text-sm font-bold">
                    {emp?.name?.split(' ').map(n=>n[0]).slice(0,2).join('')}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{emp?.name}</div>
                    <div className="text-xs text-slate-400">{emp?.position} · {p.period}</div>
                  </div>
                  {p.rating && (
                    <div className="ml-auto text-right">
                      <div className="text-2xl font-bold text-violet-600">{p.rating}<span className="text-sm text-slate-400">/5</span></div>
                      <div className="text-xs text-slate-400">Final rating</div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {p.goals.map(g => (
                    <div key={g.id}>
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-800">{g.title}</span>
                          <Badge tone={g.status==='completed'?'green':g.status==='at-risk'?'red':'blue'}>{g.status}</Badge>
                          <span className="text-xs text-slate-400">({g.weight}%)</span>
                        </div>
                        <span className="text-sm font-bold text-slate-700 tabular-nums">{g.progress}%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-100 rounded-full h-2">
                          <div className={`h-2 rounded-full transition-all ${g.status==='completed'?'bg-emerald-500':g.status==='at-risk'?'bg-rose-500':'bg-violet-500'}`} style={{width:`${Math.min(100,g.progress)}%`}}></div>
                        </div>
                        {(isAdmin || p.employeeId===currentUser.id) && (
                          <input type="range" min="0" max="120" step="5" value={g.progress}
                            onChange={e=>updateGoal(p.id,g.id,Number(e.target.value))}
                            className="w-20 accent-violet-600"/>
                        )}
                      </div>
                    </div>
                  ))}
                  {!p.goals.length && <div className="text-xs text-slate-400 italic">No goals defined yet.</div>}
                </div>

                {p.goals.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-xs text-slate-500">Overall progress</div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-slate-100 rounded-full h-2">
                        <div className="h-2 rounded-full bg-violet-500 transition-all" style={{width:`${Math.min(100,overall)}%`}}></div>
                      </div>
                      <span className="text-sm font-bold text-violet-600">{overall}%</span>
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          );
        })}
        {!visible.length && <EmptyState icon={Target} title="No performance records" description="Performance reviews will appear here." />}
      </div>

      <Modal open={showReview} onClose={()=>setShowReview(false)} title="Submit performance review">
        <ReviewForm perfId={selected} onSubmit={submitReview} onClose={()=>setShowReview(false)}/>
      </Modal>
    </div>
  );
}

function ReviewForm({ perfId, onSubmit, onClose }) {
  const [rating, setRating] = useState(3);
  const [hovered, setHovered] = useState(null);
  return (
    <div className="space-y-5">
      <div>
        <div className="text-sm font-semibold text-slate-700 mb-3">Overall rating</div>
        <div className="flex gap-3">
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={()=>setRating(n)} onMouseEnter={()=>setHovered(n)} onMouseLeave={()=>setHovered(null)}
              className={`w-12 h-12 rounded-xl border-2 font-bold text-lg transition-all ${(hovered||rating)>=n?'bg-violet-600 border-violet-600 text-white':'bg-white border-slate-200 text-slate-400'}`}>
              {n}
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-400 mt-2">{['','Below expectations','Needs improvement','Meets expectations','Exceeds expectations','Outstanding'][rating]}</div>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="accent" onClick={()=>onSubmit(perfId, rating)}>Submit review</Btn>
      </div>
    </div>
  );
}

// ============================================================================
// ASSET MANAGEMENT MODULE (NEW)
// ============================================================================
function AssetsModule({ data, currentUser }) {
  const { assets, setAssets, employees } = data;
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const isAdmin = currentUser.role === 'admin';

  const filtered = assets.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase()) || a.category.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || a.status === filter;
    return matchSearch && matchFilter;
  });

  const save = (asset) => {
    if (assets.find(a=>a.id===asset.id)) {
      setAssets(assets.map(a => a.id===asset.id ? asset : a));
    } else {
      const id = 'AST' + String(assets.length + 1).padStart(3, '0');
      setAssets([...assets, { ...asset, id }]);
    }
    setEditing(null);
  };

  const condTone = { good: 'green', fair: 'amber', poor: 'red' };
  const statusTone = { assigned: 'blue', available: 'green', maintenance: 'amber', retired: 'slate' };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Operations" title="Asset management"
        description={`${assets.length} assets tracked · ${assets.filter(a=>a.status==='available').length} available`}
        actions={<>
          <Btn variant="secondary" icon={Download} onClick={()=>downloadFile(toCSV(assets),`assets-${todayISO()}.csv`)}>Export</Btn>
          {isAdmin && <Btn icon={Plus} onClick={()=>setEditing({status:'available',condition:'good'})}>Add asset</Btn>}
        </>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total assets"  value={assets.length} icon={Package} tone="slate"/>
        <StatCard label="Assigned"      value={assets.filter(a=>a.status==='assigned').length} icon={Users} tone="blue"/>
        <StatCard label="Available"     value={assets.filter(a=>a.status==='available').length} icon={CheckSquare} tone="green"/>
        <StatCard label="Total value"   value={fmtMoney(assets.reduce((s,a)=>s+a.value,0))} icon={DollarSign} tone="violet"/>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all','assigned','available','maintenance','retired'].map(s=>(
          <button key={s} onClick={()=>setFilter(s)} className={`px-3 py-1.5 text-xs font-medium rounded-lg border capitalize transition-all ${filter===s?'bg-slate-900 text-white border-slate-900':'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>{s}</button>
        ))}
      </div>

      <SectionCard>
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <Search size={14} className="text-slate-300"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search assets…" className="flex-1 text-sm outline-none placeholder:text-slate-300"/>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Asset</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Assigned to</th>
                <th className="px-4 py-3">Condition</th>
                <th className="px-4 py-3 text-right">Value</th>
                <th className="px-4 py-3">Status</th>
                {isAdmin && <th className="px-4 py-3 w-12"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(a => {
                const emp = employees.find(e=>e.id===a.assignedTo);
                return (
                  <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5 text-xs font-mono text-slate-400">{a.id}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900">{a.name}</div>
                      <div className="text-xs text-slate-400">{a.serialNo}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{a.category}</td>
                    <td className="px-4 py-3.5">
                      {emp ? (
                        <div>
                          <div className="text-sm font-medium text-slate-800">{emp.name}</div>
                          <div className="text-xs text-slate-400">{fmtDate(a.assignDate)}</div>
                        </div>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3.5"><Badge tone={condTone[a.condition]}>{a.condition}</Badge></td>
                    <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-slate-700">{fmtMoney(a.value)}</td>
                    <td className="px-4 py-3.5"><Badge tone={statusTone[a.status]}>{a.status}</Badge></td>
                    {isAdmin && (
                      <td className="px-4 py-3.5">
                        <button onClick={()=>setEditing(a)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"><Pencil size={13}/></button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {!filtered.length && <tr><td colSpan={isAdmin?8:7}><EmptyState icon={Package} title="No assets found"/></td></tr>}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <Modal open={!!editing} onClose={()=>setEditing(null)} title={editing?.id && assets.find(a=>a.id===editing.id) ? 'Edit asset' : 'Add asset'} size="lg">
        {editing && <AssetForm form={editing} onChange={setEditing} employees={employees} onSave={save} onClose={()=>setEditing(null)}/>}
      </Modal>
    </div>
  );
}

function AssetForm({ form, onChange, employees, onSave, onClose }) {
  const f = (k,v) => onChange({...form,[k]:v});
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Asset name *" value={form.name||''} onChange={e=>f('name',e.target.value)} placeholder="MacBook Pro 14"/>
        <Input label="Category"     value={form.category||''} onChange={e=>f('category',e.target.value)} placeholder="Laptop"/>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Serial number" value={form.serialNo||''} onChange={e=>f('serialNo',e.target.value)} placeholder="SN-2024-001"/>
        <Input label="Value (Rs)"    type="number" value={form.value||''} onChange={e=>f('value',Number(e.target.value))} placeholder="250000"/>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select label="Status" value={form.status||'available'} onChange={e=>f('status',e.target.value)} options={['available','assigned','maintenance','retired'].map(v=>({value:v,label:v.charAt(0).toUpperCase()+v.slice(1)}))}/>
        <Select label="Condition" value={form.condition||'good'} onChange={e=>f('condition',e.target.value)} options={['good','fair','poor'].map(v=>({value:v,label:v.charAt(0).toUpperCase()+v.slice(1)}))}/>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select label="Assigned to" value={form.assignedTo||''} onChange={e=>f('assignedTo',e.target.value)} options={[{value:'',label:'— Unassigned —'},...employees.map(e=>({value:e.id,label:e.name}))]}/>
        <Input label="Assign date" type="date" value={form.assignDate||''} onChange={e=>f('assignDate',e.target.value)}/>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={()=>{if(!form.name)return alert('Name required.');onSave(form);}}>Save asset</Btn>
      </div>
    </div>
  );
}

// ============================================================================
// HELPDESK / TICKETING MODULE (NEW)
// ============================================================================
function HelpdeskModule({ data, currentUser }) {
  const { tickets, setTickets, employees } = data;
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'manager';

  const visible = tickets.filter(t => {
    const accessible = isAdmin || t.employeeId === currentUser.id;
    const match = filter === 'all' || t.status === filter;
    return accessible && match;
  });

  const updateTicket = (id, changes) => setTickets(tickets.map(t => t.id===id ? {...t,...changes} : t));

  const submit = (form) => {
    const id = 'TKT' + String(tickets.length + 1).padStart(3, '0');
    setTickets([...tickets, { ...form, id, status: 'open', createdDate: todayISO(), resolvedDate: null, assignedTo: null, comments: [] }]);
    setShowForm(false);
  };

  const priorityTone = { high:'red', medium:'amber', low:'slate' };
  const statusTone = { open:'rose', 'in-progress':'blue', resolved:'green', closed:'slate' };

  const ticket = tickets.find(t=>t.id===selected);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Support" title="Helpdesk"
        description="IT, HR, Finance, and Facility tickets"
        actions={<Btn icon={Plus} onClick={()=>setShowForm(true)}>New ticket</Btn>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Open"        value={tickets.filter(t=>t.status==='open').length} icon={AlertCircle} tone="rose"/>
        <StatCard label="In progress" value={tickets.filter(t=>t.status==='in-progress').length} icon={Clock} tone="blue"/>
        <StatCard label="Resolved"    value={tickets.filter(t=>t.status==='resolved').length} icon={CheckSquare} tone="green"/>
        <StatCard label="All tickets" value={tickets.length} icon={Ticket} tone="slate"/>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all','open','in-progress','resolved','closed'].map(s=>(
          <button key={s} onClick={()=>setFilter(s)} className={`px-3 py-1.5 text-xs font-medium rounded-lg border capitalize transition-all ${filter===s?'bg-slate-900 text-white border-slate-900':'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>{s}</button>
        ))}
      </div>

      <SectionCard>
        <div className="divide-y divide-slate-50">
          {visible.sort((a,b)=>b.createdDate.localeCompare(a.createdDate)).map(t => {
            const emp = employees.find(e=>e.id===t.employeeId);
            const assignee = employees.find(e=>e.id===t.assignedTo);
            return (
              <div key={t.id} className="px-5 py-4 flex flex-wrap gap-4 items-start hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={()=>setSelected(t.id===selected?null:t.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-mono text-slate-400">{t.id}</span>
                    <Badge tone={statusTone[t.status]}>{t.status}</Badge>
                    <Badge tone={priorityTone[t.priority]}>{t.priority}</Badge>
                    <Badge tone="slate">{t.category}</Badge>
                  </div>
                  <div className="text-sm font-semibold text-slate-900">{t.subject}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{emp?.name} · {fmtDate(t.createdDate)}</div>

                  {t.id === selected && (
                    <div className="mt-3 space-y-3">
                      <div className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">{t.description}</div>
                      {isAdmin && (
                        <div className="flex flex-wrap gap-2">
                          <select value={t.status} onChange={e=>updateTicket(t.id,{status:e.target.value, resolvedDate:e.target.value==='resolved'?todayISO():null})}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-violet-400">
                            {['open','in-progress','resolved','closed'].map(s=><option key={s} value={s}>{s}</option>)}
                          </select>
                          <select value={t.assignedTo||''} onChange={e=>updateTicket(t.id,{assignedTo:e.target.value})}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-violet-400">
                            <option value="">Unassigned</option>
                            {employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {assignee && (
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 flex-shrink-0">
                    <div className="w-5 h-5 rounded-full bg-violet-200 text-violet-700 flex items-center justify-center text-xs font-bold">
                      {assignee.name[0]}
                    </div>
                    {assignee.name.split(' ')[0]}
                  </div>
                )}
              </div>
            );
          })}
          {!visible.length && <EmptyState icon={Ticket} title="No tickets" description="Tickets will appear here." action={<Btn icon={Plus} onClick={()=>setShowForm(true)}>New ticket</Btn>}/>}
        </div>
      </SectionCard>

      <Modal open={showForm} onClose={()=>setShowForm(false)} title="New ticket">
        <TicketForm onSubmit={submit} onClose={()=>setShowForm(false)} currentUser={currentUser}/>
      </Modal>
    </div>
  );
}

function TicketForm({ onSubmit, onClose, currentUser }) {
  const [form, setForm] = useState({ employeeId: currentUser.id, category: 'IT', priority: 'medium' });
  const f = (k,v) => setForm({...form,[k]:v});
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Select label="Category" value={form.category||'IT'} onChange={e=>f('category',e.target.value)} options={['IT','HR','Finance','Facility','Other'].map(v=>({value:v,label:v}))}/>
        <Select label="Priority" value={form.priority||'medium'} onChange={e=>f('priority',e.target.value)} options={['low','medium','high'].map(v=>({value:v,label:v.charAt(0).toUpperCase()+v.slice(1)}))}/>
      </div>
      <Input label="Subject *" value={form.subject||''} onChange={e=>f('subject',e.target.value)} placeholder="Brief description of the issue"/>
      <Textarea label="Description" rows={4} value={form.description||''} onChange={e=>f('description',e.target.value)} placeholder="Describe the issue in detail…"/>
      <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={()=>{if(!form.subject)return alert('Subject required.');onSubmit(form);}}>Submit ticket</Btn>
      </div>
    </div>
  );
}

// ============================================================================
// ORG CHART MODULE (NEW)
// ============================================================================
function OrgChartModule({ data }) {
  const { employees } = data;

  const departments = [...new Set(employees.map(e=>e.department))];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Structure" title="Org chart" description="Company hierarchy and department structure"/>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map(dept => {
          const deptEmps = employees.filter(e=>e.department===dept && e.status==='active');
          const managers = deptEmps.filter(e=>e.role==='manager'||e.role==='admin');
          const reports = deptEmps.filter(e=>e.role==='employee');
          return (
            <SectionCard key={dept}>
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="font-semibold text-slate-900">{dept}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{deptEmps.length} member{deptEmps.length!==1?'s':''}</div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                    <Building2 size={15} className="text-violet-600"/>
                  </div>
                </div>
                {managers.map(m => (
                  <div key={m.id} className="mb-3">
                    <div className="flex items-center gap-3 p-2.5 bg-violet-50 rounded-xl border border-violet-100">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-white flex items-center justify-center text-xs font-bold">
                        {m.name.split(' ').map(n=>n[0]).slice(0,2).join('')}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-900">{m.name}</div>
                        <div className="text-xs text-slate-400">{m.position}</div>
                      </div>
                      <Badge tone="violet" className="ml-auto">{m.role}</Badge>
                    </div>
                    {/* Connector */}
                    {reports.filter(e=>e.managerId===m.id||(!e.managerId&&m.department===e.department)).length > 0 && (
                      <div className="ml-4 mt-1 mb-1 border-l-2 border-dashed border-slate-200 pl-4 space-y-1">
                        {reports.filter(e=>e.managerId===m.id||(!e.managerId&&m.department===e.department)).map(emp=>(
                          <div key={emp.id} className="flex items-center gap-2.5 py-1.5 px-2 hover:bg-slate-50 rounded-lg transition-colors">
                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                              {emp.name.split(' ').map(n=>n[0]).slice(0,2).join('')}
                            </div>
                            <div>
                              <div className="text-xs font-medium text-slate-800">{emp.name}</div>
                              <div className="text-xs text-slate-400">{emp.position}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {!managers.length && reports.map(emp=>(
                  <div key={emp.id} className="flex items-center gap-2.5 p-2 hover:bg-slate-50 rounded-lg transition-colors mb-1">
                    <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {emp.name.split(' ').map(n=>n[0]).slice(0,2).join('')}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-800">{emp.name}</div>
                      <div className="text-xs text-slate-400">{emp.position}</div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// REPORTS MODULE
// ============================================================================
function ReportsModule({ data }) {
  const { employees, attendance, leaves, payroll, cashflow, categories } = data;
  const now = new Date();
  const [report, setReport] = useState('attendance');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const monthPrefix = `${year}-${pad(month)}`;
  const totalDays = daysInMonth(year, month);

  const reports = {
    attendance: {
      title: 'Attendance summary',
      build: () => employees.map(e => {
        const recs = attendance.filter(a => a.employeeId===e.id && a.date.startsWith(monthPrefix));
        return { id:e.id, name:e.name, department:e.department,
          present:recs.filter(r=>r.status==='present').length,
          half:recs.filter(r=>r.status==='half').length,
          absent:recs.filter(r=>r.status==='absent').length,
          workingDays: totalDays-recs.filter(r=>r.status==='absent').length-recs.filter(r=>r.status==='half').length*0.5 };
      }),
      columns: ['id','name','department','present','half','absent','workingDays'],
    },
    leaves: {
      title: 'Leave summary',
      build: () => leaves.filter(l=>l.startDate.startsWith(monthPrefix)||l.endDate.startsWith(monthPrefix)).map(l => {
        const emp = employees.find(e=>e.id===l.employeeId);
        return { employee:emp?.name, type:l.type, startDate:l.startDate, endDate:l.endDate, days:l.days, status:l.status, reason:l.reason };
      }),
      columns: ['employee','type','startDate','endDate','days','status','reason'],
    },
    payroll: {
      title: 'Payroll expense summary',
      build: () => employees.map(e => {
        const p = payroll.find(p=>p.employeeId===e.id&&p.month===month&&p.year===year) || computePayroll(e,attendance,leaves,year,month);
        return { id:e.id, name:e.name, gross:p.gross, tax:p.tax, loan:p.loan, deductions:p.deductions, net:p.net };
      }),
      columns: ['id','name','gross','tax','loan','deductions','net'],
    },
    cashflow: {
      title: 'Cash flow report',
      build: () => cashflow.filter(c=>c.date.startsWith(monthPrefix)).sort((a,b)=>a.date.localeCompare(b.date)),
      columns: ['date','type','category','description','amount'],
    },
    expenses: {
      title: 'Budget vs actual',
      build: () => categories.map(cat => {
        const spent = cashflow.filter(c=>c.type==='expense'&&c.date.startsWith(monthPrefix)&&c.category===cat.name).reduce((s,c)=>s+c.amount,0);
        return { category:cat.name, budget:cat.monthlyBudget, spent, variance:cat.monthlyBudget-spent };
      }),
      columns: ['category','budget','spent','variance'],
    },
  };

  const r = reports[report];
  const rows = r.build();

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Analytics" title="Reports"
        description="Built-in reports across all modules"
        actions={<Btn variant="secondary" icon={FileDown} onClick={()=>downloadFile(toCSV(rows),`${report}-${monthPrefix}.csv`)}>Export CSV</Btn>}
      />

      <SectionCard>
        <div className="px-5 py-4 flex flex-wrap gap-3 items-center border-b border-slate-100">
          <Select value={report} onChange={e=>setReport(e.target.value)} options={Object.entries(reports).map(([k,v])=>({value:k,label:v.title}))}/>
          <Select value={month} onChange={e=>setMonth(Number(e.target.value))} options={Array.from({length:12},(_,i)=>({value:i+1,label:monthName(i+1)}))}/>
          <Select value={year} onChange={e=>setYear(Number(e.target.value))} options={[now.getFullYear()-1, now.getFullYear()].map(y=>({value:y,label:String(y)}))}/>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {r.columns.map(c=><th key={c} className="px-4 py-3">{c.replace(/([A-Z])/g,' $1').trim()}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((row,i) => (
                <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                  {r.columns.map(c => {
                    const v = row[c];
                    const isMoney = ['gross','tax','loan','deductions','net','amount','budget','spent','variance'].includes(c);
                    return <td key={c} className={`px-4 py-3 ${isMoney?'text-right tabular-nums font-medium text-slate-700':'text-slate-600'} ${c==='variance'&&v<0?'text-rose-500':''} ${c==='variance'&&v>=0?'text-emerald-600':''}`}>
                      {isMoney ? fmtMoney(v) : (c.includes('Date')||c==='date' ? fmtDate(v) : v)}
                    </td>;
                  })}
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={r.columns.length}><EmptyState icon={BarChart3} title="No data" description="No records for this period."/></td></tr>}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

// ============================================================================
// SETTINGS MODULE
// ============================================================================
function SettingsModule({ data, currentUser }) {
  const { employees, categories, setCategories } = data;
  const deptList = [...new Set(employees.map(e=>e.department))];

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader eyebrow="Configuration" title="Settings"/>

      <SectionCard title="Your profile">
        <div className="px-5 py-5">
          <div className="flex items-center gap-4 mb-5 pb-5 border-b border-slate-100">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-400 to-violet-700 text-white flex items-center justify-center text-xl font-bold">
              {currentUser.name.split(' ').map(n=>n[0]).slice(0,2).join('')}
            </div>
            <div>
              <div className="font-bold text-slate-900 text-lg">{currentUser.name}</div>
              <div className="text-sm text-slate-400">{currentUser.position} · {currentUser.department}</div>
              <div className="flex gap-2 mt-1.5">
                <Badge tone="violet">{currentUser.role}</Badge>
                <Badge tone="green">{currentUser.status}</Badge>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {[['Employee ID', currentUser.id], ['Email', currentUser.email], ['Joined', fmtDate(currentUser.joinDate)], ['Monthly salary', fmtMoney(currentUser.monthlySalary)], ['Tax rate', `${currentUser.taxRate}%`], ['Allowances', fmtMoney(currentUser.allowances)]].map(([label,val])=>(
              <div key={label} className="bg-slate-50 rounded-xl p-3">
                <div className="text-xs text-slate-400 mb-1">{label}</div>
                <div className="font-semibold text-slate-900 text-sm truncate">{val}</div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Department overview">
        <div className="px-5 py-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {deptList.map(d => {
              const count = employees.filter(e=>e.department===d && e.status==='active').length;
              return (
                <div key={d} className="bg-slate-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-slate-900">{count}</div>
                  <div className="text-xs text-slate-500 mt-1">{d}</div>
                </div>
              );
            })}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="About this system">
        <div className="px-5 py-4">
          <ul className="space-y-2 text-sm text-slate-600">
            {[
              'Modules: Employees, Attendance, Leaves, Payroll, Payslips, Cash flow, Expenses, Recruitment, Performance, Assets, Helpdesk, Org Chart, Reports',
              'Attendance changes immediately reflect payroll calculations',
              'Finalizing payroll automatically records a cash outflow',
              'Role-based access: admin, manager, employee views',
              'All data persisted in browser storage with CSV export on all modules',
              'Recruitment ATS with pipeline, Kanban board, and candidate scoring',
              'Performance module with weighted goals, progress tracking, and rating',
              'Asset management with assignment tracking and condition monitoring',
              'Helpdesk ticketing with category routing, priority, and assignment'
            ].map((txt,i)=>(
              <li key={i} className="flex gap-2.5"><Check size={14} className="text-violet-600 mt-0.5 flex-shrink-0"/>{txt}</li>
            ))}
          </ul>
        </div>
      </SectionCard>

      <SectionCard title="Danger zone">
        <div className="px-5 py-4">
          <p className="text-sm text-slate-500 mb-4">Resetting clears all records and reseeds with demo data. This cannot be undone.</p>
          <Btn variant="danger" icon={Trash2} onClick={data.resetAll}>Reset all data to demo</Btn>
        </div>
      </SectionCard>
    </div>
  );
}

// ============================================================================
// SIDEBAR + APP SHELL
// ============================================================================
const NAV = [
  { key: 'dashboard',    label: 'Dashboard',    icon: LayoutDashboard, roles: ['admin','manager','employee'] },
  { key: 'employees',    label: 'Employees',    icon: Users,           roles: ['admin','manager'] },
  { key: 'attendance',   label: 'Attendance',   icon: CalendarCheck,   roles: ['admin','manager','employee'] },
  { key: 'leaves',       label: 'Leaves',       icon: Inbox,           roles: ['admin','manager','employee'] },
  { key: 'payroll',      label: 'Payroll',      icon: DollarSign,      roles: ['admin','employee'] },
  { key: 'payslips',     label: 'Payslips',     icon: FileText,        roles: ['admin','employee'] },
  { key: 'cashflow',     label: 'Cash flow',    icon: Wallet,          roles: ['admin'] },
  { key: 'expenses',     label: 'Expenses',     icon: Receipt,         roles: ['admin'] },
  { key: 'recruitment',  label: 'Recruitment',  icon: Briefcase,       roles: ['admin','manager'] },
  { key: 'performance',  label: 'Performance',  icon: Target,          roles: ['admin','manager','employee'] },
  { key: 'assets',       label: 'Assets',       icon: Package,         roles: ['admin','manager'] },
  { key: 'helpdesk',     label: 'Helpdesk',     icon: Ticket,          roles: ['admin','manager','employee'] },
  { key: 'orgchart',     label: 'Org chart',    icon: Network,         roles: ['admin','manager','employee'] },
  { key: 'reports',      label: 'Reports',      icon: BarChart3,       roles: ['admin','manager'] },
  { key: 'settings',     label: 'Settings',     icon: Settings,        roles: ['admin','manager','employee'] },
];

const NAV_GROUPS = [
  { label: 'Core HR', keys: ['dashboard','employees','attendance','leaves'] },
  { label: 'Finance', keys: ['payroll','payslips','cashflow','expenses'] },
  { label: 'Talent',  keys: ['recruitment','performance','assets'] },
  { label: 'Workspace', keys: ['helpdesk','orgchart','reports','settings'] },
];

export default function HRApp() {
  const data = useHRData();
  const [route, setRoute] = useState('dashboard');
  const [navState, setNavState] = useState({});
  const [currentUserId, setCurrentUserId] = useState('EMP004');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = (to, state = {}) => { setRoute(to); setNavState(state); setSidebarOpen(false); };

  const currentUser = data.employees.find(e => e.id === currentUserId) || data.employees[0];

  if (!data.loaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-2xl bg-violet-600 mx-auto mb-4 flex items-center justify-center">
            <Zap size={20} className="text-white"/>
          </div>
          <div className="text-slate-500 text-sm">Loading workspace…</div>
        </div>
      </div>
    );
  }
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 text-sm">No employees found. <button onClick={data.resetAll} className="text-violet-600 underline">Reset to seed data</button></div>
      </div>
    );
  }

  const allowedNav = NAV.filter(n => n.roles.includes(currentUser.role));

  const render = () => {
    switch (route) {
      case 'dashboard':   return <Dashboard       data={data} currentUser={currentUser} navigate={navigate}/>;
      case 'employees':   return <EmployeesModule data={data} currentUser={currentUser}/>;
      case 'attendance':  return <AttendanceModule data={data} currentUser={currentUser}/>;
      case 'leaves':      return <LeavesModule    data={data} currentUser={currentUser}/>;
      case 'payroll':     return <PayrollModule   data={data} currentUser={currentUser} navigate={navigate}/>;
      case 'payslips':    return <PayslipModule   data={data} currentUser={currentUser} navigationState={navState}/>;
      case 'cashflow':    return <CashFlowModule  data={data} currentUser={currentUser}/>;
      case 'expenses':    return <ExpensesModule  data={data} currentUser={currentUser}/>;
      case 'recruitment': return <RecruitmentModule data={data} currentUser={currentUser}/>;
      case 'performance': return <PerformanceModule data={data} currentUser={currentUser}/>;
      case 'assets':      return <AssetsModule    data={data} currentUser={currentUser}/>;
      case 'helpdesk':    return <HelpdeskModule  data={data} currentUser={currentUser}/>;
      case 'orgchart':    return <OrgChartModule  data={data}/>;
      case 'reports':     return <ReportsModule   data={data}/>;
      case 'settings':    return <SettingsModule  data={data} currentUser={currentUser}/>;
      default:            return <Dashboard       data={data} currentUser={currentUser} navigate={navigate}/>;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans text-slate-900 antialiased">
      <style>{`
        :root { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
        .tabular-nums { font-variant-numeric: tabular-nums; }
        input[type=range]::-webkit-slider-thumb { accent-color: #7c3aed; }
      `}</style>

      {/* Mobile top bar */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2.5">
          <button onClick={()=>setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center"><Zap size={13} className="text-white"/></div>
            <span className="font-bold text-slate-900 text-base">Workforce</span>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:sticky top-0 left-0 z-40 w-60 h-screen bg-white border-r border-slate-200 flex flex-col transition-transform shadow-xl lg:shadow-none`}>
          {/* Logo */}
          <div className="px-5 py-5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0">
                <Zap size={16} className="text-white"/>
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm leading-tight">Workforce</div>
                <div className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">HRMS Platform</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
            {NAV_GROUPS.map(group => {
              const groupNav = allowedNav.filter(n => group.keys.includes(n.key));
              if (!groupNav.length) return null;
              return (
                <div key={group.label}>
                  <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-300">{group.label}</div>
                  {groupNav.map(n => (
                    <button
                      key={n.key}
                      onClick={() => navigate(n.key)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 my-0.5 rounded-xl text-xs font-semibold transition-all ${
                        route === n.key
                          ? 'bg-violet-600 text-white shadow-sm shadow-violet-200'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <n.icon size={14} />
                      {n.label}
                    </button>
                  ))}
                </div>
              );
            })}
          </nav>

          {/* User footer */}
          <div className="px-3 py-3 border-t border-slate-100 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300 px-3 mb-1">Switch view</div>
            <select
              value={currentUserId}
              onChange={e=>{setCurrentUserId(e.target.value); setRoute('dashboard');}}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200 text-slate-700"
            >
              {data.employees.map(e => <option key={e.id} value={e.id}>{e.name} · {e.role}</option>)}
            </select>
            <div className="px-3 py-2.5 flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {currentUser.name.split(' ').map(n=>n[0]).slice(0,2).join('')}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-900 truncate">{currentUser.name}</div>
                <div className="text-[10px] text-slate-400 capitalize">{currentUser.role} · {currentUser.department}</div>
              </div>
            </div>
          </div>
        </aside>

        {sidebarOpen && <div onClick={()=>setSidebarOpen(false)} className="lg:hidden fixed inset-0 z-30 bg-slate-900/20 backdrop-blur-sm"/>}

        {/* Main */}
        <main className="flex-1 min-w-0">
          <div className="p-5 lg:p-8 max-w-7xl mx-auto">
            {render()}
          </div>
        </main>
      </div>
    </div>
  );
}
