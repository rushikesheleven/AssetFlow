import React, { createContext, useContext, useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import {
  ShieldAlert, ArrowRight, ArrowLeft, LayoutDashboard, Users,
  Package, ArrowRightLeft, Calendar, Wrench, ClipboardCheck,
  Search, Bell, LogOut, Menu, Plus, Filter, X, Trash2, CheckCircle2,
  AlertTriangle, Clock, Undo2, ListChecks
} from 'lucide-react';

/* =========================================================================
   TYPES
   ========================================================================= */

interface Department {
  id: string;
  name: string;
  headId: string | null;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  departmentId: string | null;
  role: 'Employee' | 'DeptHead' | 'AssetManager' | 'Admin';
}

type AssetStatus = 'Available' | 'Allocated' | 'Under Maintenance' | 'Retired';
type AssetCondition = 'New' | 'Good' | 'Fair' | 'Poor';

interface Asset {
  id: string;
  tag: string;
  name: string;
  category: string;
  serial: string;
  condition: AssetCondition;
  status: AssetStatus;
  bookable: boolean;
}

interface Allocation {
  id: string;
  assetId: string;
  employeeId: string;
  allocatedDate: string;
  expectedReturn: string;
  returnedDate: string | null;
  status: 'Active' | 'Returned';
}

interface Booking {
  id: string;
  assetId: string;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: 'Confirmed' | 'Cancelled';
}

type MaintenancePriority = 'Low' | 'Medium' | 'High';
type MaintenanceStatus = 'Open' | 'In Progress' | 'Resolved';

interface MaintenanceRecord {
  id: string;
  assetId: string;
  issue: string;
  priority: MaintenancePriority;
  reportedDate: string;
  reportedBy: string;
  status: MaintenanceStatus;
  resolvedDate: string | null;
  notes: string;
}

interface AuditRecord {
  id: string;
  title: string;
  date: string;
  auditor: string;
  assetIds: string[];
  findings: string;
  status: 'Scheduled' | 'Completed';
}

type UserRole = 'Admin' | 'Employee';

interface CurrentUser {
  name: string;
  email: string;
  role: UserRole;
  employeeId: string | null;
}

/* =========================================================================
   ID HELPER
   ========================================================================= */

let idCounter = 1;
function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/* =========================================================================
   ROLE RESOLUTION
   -------------------------------------------------------------------------
   To add/remove Admins, just edit this list — any email in it always logs
   in as Admin, no matter what's in the Employee Directory.
   ========================================================================= */

const ADMIN_EMAILS = ['admin@assetflow.com'];

interface ResolvedLogin {
  role: UserRole;
  employeeId: string | null;
  directoryName: string | null;
}

function resolveLogin(email: string, employees: Employee[]): ResolvedLogin {
  const normalized = email.trim().toLowerCase();
  if (ADMIN_EMAILS.includes(normalized)) {
    return { role: 'Admin', employeeId: null, directoryName: null };
  }
  const match = employees.find((e) => e.email.trim().toLowerCase() === normalized);
  if (match) {
    // Directory role "Admin" also grants Admin access; every other
    // directory role (Employee/DeptHead/AssetManager) gets Employee access.
    return {
      role: match.role === 'Admin' ? 'Admin' : 'Employee',
      employeeId: match.id,
      directoryName: match.name,
    };
  }
  return { role: 'Employee', employeeId: null, directoryName: null };
}

/* =========================================================================
   APP DATA CONTEXT
   ========================================================================= */

interface AppDataContextValue {
  currentUser: CurrentUser | null;
  setCurrentUser: (u: CurrentUser | null) => void;

  departments: Department[];
  addDepartment: (name: string, headId: string | null) => void;
  removeDepartment: (id: string) => void;

  employees: Employee[];
  addEmployee: (e: Omit<Employee, 'id'>) => void;
  removeEmployee: (id: string) => void;

  assets: Asset[];
  addAsset: (a: Omit<Asset, 'id' | 'status'>) => void;
  removeAsset: (id: string) => void;
  updateAssetCondition: (id: string, condition: AssetCondition) => void;

  allocations: Allocation[];
  addAllocation: (assetId: string, employeeId: string, expectedReturn: string) => void;
  returnAllocation: (id: string) => void;

  bookings: Booking[];
  addBooking: (b: Omit<Booking, 'id' | 'status'>) => { ok: boolean; message?: string };
  cancelBooking: (id: string) => void;

  maintenance: MaintenanceRecord[];
  addMaintenance: (m: Omit<MaintenanceRecord, 'id' | 'status' | 'resolvedDate'>) => void;
  updateMaintenanceStatus: (id: string, status: MaintenanceStatus) => void;

  audits: AuditRecord[];
  addAudit: (a: Omit<AuditRecord, 'id' | 'status'>) => void;
  completeAudit: (id: string, findings: string) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}

function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [audits, setAudits] = useState<AuditRecord[]>([]);

  const addDepartment = (name: string, headId: string | null) => {
    setDepartments((prev) => [...prev, { id: nextId('dept'), name, headId }]);
  };
  const removeDepartment = (id: string) => {
    setDepartments((prev) => prev.filter((d) => d.id !== id));
  };

  const addEmployee = (e: Omit<Employee, 'id'>) => {
    setEmployees((prev) => [...prev, { ...e, id: nextId('emp') }]);
  };
  const removeEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  };

  const addAsset = (a: Omit<Asset, 'id' | 'status'>) => {
    setAssets((prev) => [...prev, { ...a, id: nextId('ast'), status: 'Available' }]);
  };
  const removeAsset = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  };
  const updateAssetCondition = (id: string, condition: AssetCondition) => {
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, condition } : a)));
  };
  const setAssetStatus = (id: string, status: AssetStatus) => {
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const addAllocation = (assetId: string, employeeId: string, expectedReturn: string) => {
    setAllocations((prev) => [
      ...prev,
      {
        id: nextId('alc'),
        assetId,
        employeeId,
        allocatedDate: todayISO(),
        expectedReturn,
        returnedDate: null,
        status: 'Active',
      },
    ]);
    setAssetStatus(assetId, 'Allocated');
  };
  const returnAllocation = (id: string) => {
    setAllocations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Returned', returnedDate: todayISO() } : a))
    );
    const alloc = allocations.find((a) => a.id === id);
    if (alloc) setAssetStatus(alloc.assetId, 'Available');
  };

  const addBooking = (b: Omit<Booking, 'id' | 'status'>) => {
    const conflict = bookings.find(
      (bk) =>
        bk.assetId === b.assetId &&
        bk.date === b.date &&
        bk.status === 'Confirmed' &&
        !(b.endTime <= bk.startTime || b.startTime >= bk.endTime)
    );
    if (conflict) {
      return { ok: false, message: 'This asset is already booked for an overlapping time slot on that date.' };
    }
    setBookings((prev) => [...prev, { ...b, id: nextId('bkg'), status: 'Confirmed' }]);
    return { ok: true };
  };
  const cancelBooking = (id: string) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'Cancelled' } : b)));
  };

  const addMaintenance = (m: Omit<MaintenanceRecord, 'id' | 'status' | 'resolvedDate'>) => {
    setMaintenance((prev) => [
      ...prev,
      { ...m, id: nextId('mnt'), status: 'Open', resolvedDate: null },
    ]);
    setAssetStatus(m.assetId, 'Under Maintenance');
  };
  const updateMaintenanceStatus = (id: string, status: MaintenanceStatus) => {
    setMaintenance((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, status, resolvedDate: status === 'Resolved' ? todayISO() : m.resolvedDate }
          : m
      )
    );
    const record = maintenance.find((m) => m.id === id);
    if (record && status === 'Resolved') {
      setAssetStatus(record.assetId, 'Available');
    }
  };

  const addAudit = (a: Omit<AuditRecord, 'id' | 'status'>) => {
    setAudits((prev) => [...prev, { ...a, id: nextId('adt'), status: 'Scheduled' }]);
  };
  const completeAudit = (id: string, findings: string) => {
    setAudits((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Completed', findings } : a))
    );
  };

  const value: AppDataContextValue = {
    currentUser, setCurrentUser,
    departments, addDepartment, removeDepartment,
    employees, addEmployee, removeEmployee,
    assets, addAsset, removeAsset, updateAssetCondition,
    allocations, addAllocation, returnAllocation,
    bookings, addBooking, cancelBooking,
    maintenance, addMaintenance, updateMaintenanceStatus,
    audits, addAudit, completeAudit,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

/* =========================================================================
   SHARED UI PRIMITIVES
   ========================================================================= */

function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl shadow-xl w-full ${wide ? 'max-w-lg' : 'max-w-md'} overflow-hidden max-h-[90vh] flex flex-col`}>
        <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="px-6 py-14 text-center text-gray-500">
      <Icon className="w-8 h-8 text-gray-300 mx-auto mb-3" />
      <p className="font-medium text-gray-900">{title}</p>
      <p className="text-sm mt-1">{subtitle}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-800"
        >
          <Plus className="w-4 h-4" /> {actionLabel}
        </button>
      )}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  Available: 'bg-emerald-100 text-emerald-700',
  Allocated: 'bg-blue-100 text-blue-700',
  'Under Maintenance': 'bg-amber-100 text-amber-700',
  Retired: 'bg-gray-200 text-gray-600',
  Active: 'bg-blue-100 text-blue-700',
  Returned: 'bg-gray-200 text-gray-600',
  Confirmed: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-gray-200 text-gray-600',
  Open: 'bg-red-100 text-red-700',
  'In Progress': 'bg-amber-100 text-amber-700',
  Resolved: 'bg-emerald-100 text-emerald-700',
  Scheduled: 'bg-blue-100 text-blue-700',
  Completed: 'bg-emerald-100 text-emerald-700',
  Low: 'bg-gray-200 text-gray-600',
  Medium: 'bg-amber-100 text-amber-700',
  High: 'bg-red-100 text-red-700',
};

function StatusBadge({ value }: { value: string }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[value] || 'bg-gray-100 text-gray-600'}`}>
      {value}
    </span>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-gray-700 mb-1">{children}</label>;
}

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-teal-700 focus:ring-1 focus:ring-teal-700 bg-white';

function SectionHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function PrimaryButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="bg-teal-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-800 transition-colors flex items-center gap-2 shrink-0"
    >
      {children}
    </button>
  );
}

function IconTextButton({
  onClick,
  icon: Icon,
  children,
  tone = 'default',
}: {
  onClick: () => void;
  icon: React.ElementType;
  children: React.ReactNode;
  tone?: 'default' | 'danger';
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-md transition-colors ${
        tone === 'danger'
          ? 'text-red-600 hover:bg-red-50'
          : 'text-teal-700 hover:bg-teal-50'
      }`}
    >
      <Icon className="w-3.5 h-3.5" /> {children}
    </button>
  );
}

/* =========================================================================
   LANDING / LOGIN
   ========================================================================= */

function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <ShieldAlert className="w-20 h-20 mb-6 text-teal-700" />
      <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-4 text-center">
        Welcome to AssetFlow
      </h1>
      <p className="text-lg text-gray-600 mb-10 text-center max-w-xl">
        The complete Enterprise Asset & Resource Management System. Track lifecycle, prevent double-bookings, and streamline your entire organization.
      </p>
      <Link
        to="/login"
        className="bg-teal-700 text-white font-semibold py-3 px-8 rounded-lg flex items-center justify-center gap-2 transition-colors hover:bg-teal-800"
      >
        Get Started to Login
        <ArrowRight className="w-5 h-5" />
      </Link>
    </div>
  );
}

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setCurrentUser, employees } = useAppData();

  const detected = useMemo(() => resolveLogin(email, employees), [email, employees]);
  const trimmedEmail = email.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    const resolved = resolveLogin(email, employees);
    setCurrentUser({
      name: resolved.directoryName || (isLogin ? email.split('@')[0] : name),
      email,
      role: resolved.role,
      employeeId: resolved.employeeId,
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-100 relative">
        <Link to="/" className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="flex flex-col items-center mb-8">
          <div className="bg-teal-50 p-3 rounded-full mb-3">
            <ShieldAlert className="w-10 h-10 text-teal-700" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">AssetFlow</h1>
          <p className="text-sm text-gray-500 mt-1">Enterprise Resource Management</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <FieldLabel>Full Name</FieldLabel>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
                placeholder="John Doe"
              />
            </div>
          )}

          <div>
            <FieldLabel>Email Address</FieldLabel>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              placeholder="you@company.com"
            />
          </div>

          <div>
            <FieldLabel>Password</FieldLabel>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              placeholder="••••••••"
            />
          </div>

          {/* Role is derived from the email — not chosen manually */}
          {trimmedEmail.length > 0 && (
            <div className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 ${
              detected.role === 'Admin' ? 'border-teal-200 bg-teal-50' : 'border-gray-200 bg-gray-50'
            }`}>
              {detected.role === 'Admin' ? (
                <ShieldAlert className="w-4 h-4 text-teal-700 mt-0.5 shrink-0" />
              ) : (
                <Users className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
              )}
              <p className="text-xs text-gray-600">
                <span className={`font-semibold ${detected.role === 'Admin' ? 'text-teal-700' : 'text-gray-700'}`}>
                  {detected.role} access
                </span>
                {detected.directoryName
                  ? ` — matched to ${detected.directoryName} in the Employee Directory.`
                  : detected.role === 'Admin'
                  ? ' — this email is on the admin allowlist.'
                  : ' — no matching Employee Directory record; ask an admin to add this email in Org Setup for full access.'}
              </p>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="w-full bg-teal-700 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors hover:bg-teal-800"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-teal-700 font-semibold hover:underline outline-none"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   ROLE GUARD
   ========================================================================= */

function AccessDenied() {
  return (
    <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center py-24">
      <div className="bg-red-50 p-4 rounded-full mb-4">
        <ShieldAlert className="w-10 h-10 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-900">Admins only</h2>
      <p className="text-sm text-gray-500 mt-1 max-w-sm">
        This section is restricted to Admin accounts. Sign in as an Admin to manage org setup, allocations, or audits.
      </p>
    </div>
  );
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAppData();
  if (currentUser?.role !== 'Admin') return <AccessDenied />;
  return <>{children}</>;
}

/* =========================================================================
   ORG SETUP VIEW
   ========================================================================= */

function OrgSetupView() {
  const { departments, addDepartment, removeDepartment, employees, addEmployee, removeEmployee } = useAppData();
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [search, setSearch] = useState('');

  const [deptName, setDeptName] = useState('');
  const [deptHead, setDeptHead] = useState('');

  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empDept, setEmpDept] = useState('');
  const [empRole, setEmpRole] = useState<Employee['role']>('Employee');

  const departmentName = (id: string | null) => departments.find((d) => d.id === id)?.name || '—';

  const filteredEmployees = employees.filter((e) =>
    `${e.name} ${e.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const submitDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) return;
    addDepartment(deptName.trim(), deptHead || null);
    setDeptName('');
    setDeptHead('');
    setShowDeptModal(false);
  };

  const submitEmp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim() || !empEmail.trim() || !empDept) return;
    addEmployee({ name: empName.trim(), email: empEmail.trim(), departmentId: empDept, role: empRole });
    setEmpName('');
    setEmpEmail('');
    setEmpDept('');
    setEmpRole('Employee');
    setShowEmpModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">
      <SectionHeader
        title="Organization Setup"
        subtitle="Manage departments, roles, and employee access."
        action={
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeptModal(true)}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Department
            </button>
            <PrimaryButton onClick={() => setShowEmpModal(true)}>
              <Plus className="w-4 h-4" /> Invite Employee
            </PrimaryButton>
          </div>
        }
      />

      {/* Departments */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Departments</h3>
        </div>
        {departments.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No departments yet"
            subtitle="Create your first department to start organizing employees."
            actionLabel="Add Department"
            onAction={() => setShowDeptModal(true)}
          />
        ) : (
          <div className="divide-y divide-gray-200">
            {departments.map((d) => (
              <div key={d.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{d.name}</p>
                  <p className="text-xs text-gray-500">
                    Head: {employees.find((e) => e.id === d.headId)?.name || 'Unassigned'}
                  </p>
                </div>
                <IconTextButton icon={Trash2} tone="danger" onClick={() => removeDepartment(d.id)}>
                  Remove
                </IconTextButton>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Employee Directory Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Employee Directory</h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employees..."
              className="pl-9 pr-4 py-1.5 border border-gray-300 rounded-md text-sm focus:border-teal-700 focus:ring-1 focus:ring-teal-700 outline-none w-64"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Department</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={Users}
                      title="No employees found"
                      subtitle="Invite your first employee to get started."
                      actionLabel="Invite Employee"
                      onAction={() => setShowEmpModal(true)}
                    />
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">No employees match your search.</td>
                </tr>
              ) : (
                filteredEmployees.map((e) => (
                  <tr key={e.id}>
                    <td className="px-6 py-3 font-medium text-gray-900">{e.name}</td>
                    <td className="px-6 py-3 text-gray-600">{e.email}</td>
                    <td className="px-6 py-3 text-gray-600">{departmentName(e.departmentId)}</td>
                    <td className="px-6 py-3 text-gray-600">{e.role}</td>
                    <td className="px-6 py-3 text-right">
                      <IconTextButton icon={Trash2} tone="danger" onClick={() => removeEmployee(e.id)}>
                        Remove
                      </IconTextButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDeptModal && (
        <Modal title="Add New Department" onClose={() => setShowDeptModal(false)}>
          <form className="p-6 space-y-4" onSubmit={submitDept}>
            <div>
              <FieldLabel>Department Name</FieldLabel>
              <input
                type="text"
                required
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                className={inputCls}
                placeholder="e.g. IT Support"
              />
            </div>
            <div>
              <FieldLabel>Department Head (Optional)</FieldLabel>
              <select value={deptHead} onChange={(e) => setDeptHead(e.target.value)} className={inputCls}>
                <option value="">Select an employee...</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
              {employees.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">No employees invited yet.</p>
              )}
            </div>
            <div className="pt-4 flex gap-3">
              <button type="button" onClick={() => setShowDeptModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
              <button type="submit" className="flex-1 px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 font-medium">Create Department</button>
            </div>
          </form>
        </Modal>
      )}

      {showEmpModal && (
        <Modal title="Invite Employee" onClose={() => setShowEmpModal(false)}>
          <form className="p-6 space-y-4" onSubmit={submitEmp}>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <FieldLabel>Full Name</FieldLabel>
                <input type="text" required value={empName} onChange={(e) => setEmpName(e.target.value)} className={inputCls} placeholder="Jane Doe" />
              </div>
              <div className="col-span-2">
                <FieldLabel>Email Address</FieldLabel>
                <input type="email" required value={empEmail} onChange={(e) => setEmpEmail(e.target.value)} className={inputCls} placeholder="jane@company.com" />
              </div>
              <div>
                <FieldLabel>Department</FieldLabel>
                <select required value={empDept} onChange={(e) => setEmpDept(e.target.value)} className={inputCls}>
                  <option value="">Select...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                {departments.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">Create a department first.</p>
                )}
              </div>
              <div>
                <FieldLabel>Role</FieldLabel>
                <select value={empRole} onChange={(e) => setEmpRole(e.target.value as Employee['role'])} className={inputCls}>
                  <option value="Employee">Employee</option>
                  <option value="DeptHead">Dept Head</option>
                  <option value="AssetManager">Asset Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="pt-4 flex gap-3">
              <button type="button" onClick={() => setShowEmpModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
              <button type="submit" disabled={departments.length === 0} className="flex-1 px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed">Send Invite</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* =========================================================================
   ASSET DIRECTORY VIEW
   ========================================================================= */

function AssetDirectoryView() {
  const { assets, addAsset, removeAsset, currentUser } = useAppData();
  const isAdmin = currentUser?.role === 'Admin';
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | AssetStatus>('All');
  const [showFilter, setShowFilter] = useState(false);

  const [tag, setTag] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [serial, setSerial] = useState('');
  const [condition, setCondition] = useState<AssetCondition>('New');
  const [bookable, setBookable] = useState(false);

  const filtered = assets.filter((a) => {
    const matchesSearch = `${a.tag} ${a.name} ${a.serial}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tag.trim() || !name.trim() || !category) return;
    addAsset({ tag: tag.trim(), name: name.trim(), category, serial: serial.trim(), condition, bookable });
    setTag(''); setName(''); setCategory(''); setSerial(''); setCondition('New'); setBookable(false);
    setShowAssetModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">
      <SectionHeader
        title="Asset Directory"
        subtitle={isAdmin ? "Track and manage your organization's physical assets." : "Browse your organization's physical assets."}
        action={
          isAdmin ? (
            <PrimaryButton onClick={() => setShowAssetModal(true)}>
              <Plus className="w-4 h-4" /> Register New Asset
            </PrimaryButton>
          ) : undefined
        }
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-4 relative">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by tag, name, or serial..."
              className="pl-9 pr-4 py-1.5 border border-gray-300 rounded-md text-sm focus:border-teal-700 focus:ring-1 focus:ring-teal-700 outline-none w-full"
            />
          </div>
          <button
            onClick={() => setShowFilter((s) => !s)}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" /> Filter{statusFilter !== 'All' ? `: ${statusFilter}` : ''}
          </button>
          {showFilter && (
            <div className="absolute right-6 top-14 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-48 py-2">
              {(['All', 'Available', 'Allocated', 'Under Maintenance', 'Retired'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setShowFilter(false); }}
                  className={`w-full text-left px-4 py-1.5 text-sm hover:bg-gray-50 ${statusFilter === s ? 'text-teal-700 font-semibold' : 'text-gray-700'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Asset Tag</th>
                <th className="px-6 py-3 font-medium">Item Name</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Condition</th>
                <th className="px-6 py-3 font-medium">Status</th>
                {isAdmin && <th className="px-6 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5}>
                    <EmptyState
                      icon={Package}
                      title="No assets registered yet"
                      subtitle={isAdmin ? "Register your first asset to start tracking it." : "Check back once an admin registers assets."}
                      actionLabel={isAdmin ? "Register New Asset" : undefined}
                      onAction={isAdmin ? () => setShowAssetModal(true) : undefined}
                    />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-10 text-center text-gray-500">No assets match your search or filter.</td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id}>
                    <td className="px-6 py-3 font-mono text-xs text-gray-700">{a.tag}</td>
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {a.name}
                      {a.bookable && <span className="ml-2 text-[10px] uppercase tracking-wide text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">Bookable</span>}
                    </td>
                    <td className="px-6 py-3 text-gray-600 capitalize">{a.category}</td>
                    <td className="px-6 py-3 text-gray-600">{a.condition}</td>
                    <td className="px-6 py-3"><StatusBadge value={a.status} /></td>
                    {isAdmin && (
                      <td className="px-6 py-3 text-right">
                        <IconTextButton icon={Trash2} tone="danger" onClick={() => removeAsset(a.id)}>
                          Remove
                        </IconTextButton>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAssetModal && (
        <Modal title="Register New Asset" onClose={() => setShowAssetModal(false)} wide>
          <form className="p-6 space-y-4" onSubmit={submit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <FieldLabel>Asset Tag</FieldLabel>
                <input type="text" required value={tag} onChange={(e) => setTag(e.target.value)} className={`${inputCls} bg-gray-50`} placeholder="e.g. AF-0001" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <FieldLabel>Category</FieldLabel>
                <select required value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                  <option value="">Select...</option>
                  <option value="electronics">Electronics</option>
                  <option value="furniture">Furniture</option>
                  <option value="vehicles">Vehicles</option>
                  <option value="tools">Tools</option>
                  <option value="facilities">Facilities</option>
                </select>
              </div>
              <div className="col-span-2">
                <FieldLabel>Item Name</FieldLabel>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="e.g. MacBook Pro M3" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <FieldLabel>Serial Number</FieldLabel>
                <input type="text" value={serial} onChange={(e) => setSerial(e.target.value)} className={inputCls} placeholder="Optional" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <FieldLabel>Initial Condition</FieldLabel>
                <select value={condition} onChange={(e) => setCondition(e.target.value as AssetCondition)} className={inputCls}>
                  <option value="New">New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>
              <div className="col-span-2 mt-2 flex items-center gap-2">
                <input type="checkbox" id="bookable" checked={bookable} onChange={(e) => setBookable(e.target.checked)} className="w-4 h-4 text-teal-700 border-gray-300 rounded focus:ring-teal-700" />
                <label htmlFor="bookable" className="text-sm font-medium text-gray-700">This is a shared resource (Can be booked via Calendar)</label>
              </div>
            </div>
            <div className="pt-4 flex gap-3">
              <button type="button" onClick={() => setShowAssetModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
              <button type="submit" className="flex-1 px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 font-medium">Register Asset</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* =========================================================================
   ALLOCATIONS VIEW
   ========================================================================= */

function AllocationsView() {
  const { allocations, addAllocation, returnAllocation, assets, employees } = useAppData();
  const [showModal, setShowModal] = useState(false);
  const [assetId, setAssetId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('');

  const availableAssets = assets.filter((a) => a.status === 'Available');
  const assetName = (id: string) => assets.find((a) => a.id === id)?.name || 'Unknown asset';
  const assetTag = (id: string) => assets.find((a) => a.id === id)?.tag || '—';
  const employeeName = (id: string) => employees.find((e) => e.id === id)?.name || 'Unknown employee';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId || !employeeId || !expectedReturn) return;
    addAllocation(assetId, employeeId, expectedReturn);
    setAssetId(''); setEmployeeId(''); setExpectedReturn('');
    setShowModal(false);
  };

  const sorted = [...allocations].sort((a, b) => (a.status === b.status ? 0 : a.status === 'Active' ? -1 : 1));

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">
      <SectionHeader
        title="Allocations"
        subtitle="Assign assets to employees and track what's currently checked out."
        action={
          <PrimaryButton onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" /> New Allocation
          </PrimaryButton>
        }
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Asset</th>
                <th className="px-6 py-3 font-medium">Assigned To</th>
                <th className="px-6 py-3 font-medium">Allocated</th>
                <th className="px-6 py-3 font-medium">Expected Return</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {allocations.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={ArrowRightLeft}
                      title="No allocations yet"
                      subtitle="Assign an available asset to an employee to get started."
                      actionLabel={assets.length && employees.length ? 'New Allocation' : undefined}
                      onAction={assets.length && employees.length ? () => setShowModal(true) : undefined}
                    />
                  </td>
                </tr>
              ) : (
                sorted.map((a) => (
                  <tr key={a.id}>
                    <td className="px-6 py-3 text-gray-900 font-medium">{assetName(a.assetId)} <span className="text-xs text-gray-400 font-mono">({assetTag(a.assetId)})</span></td>
                    <td className="px-6 py-3 text-gray-600">{employeeName(a.employeeId)}</td>
                    <td className="px-6 py-3 text-gray-600">{a.allocatedDate}</td>
                    <td className="px-6 py-3 text-gray-600">{a.expectedReturn}</td>
                    <td className="px-6 py-3"><StatusBadge value={a.status} /></td>
                    <td className="px-6 py-3 text-right">
                      {a.status === 'Active' && (
                        <IconTextButton icon={Undo2} onClick={() => returnAllocation(a.id)}>Mark Returned</IconTextButton>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title="New Allocation" onClose={() => setShowModal(false)}>
          <form className="p-6 space-y-4" onSubmit={submit}>
            <div>
              <FieldLabel>Asset</FieldLabel>
              <select required value={assetId} onChange={(e) => setAssetId(e.target.value)} className={inputCls}>
                <option value="">Select an available asset...</option>
                {availableAssets.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.tag})</option>
                ))}
              </select>
              {availableAssets.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">No assets are currently available to allocate.</p>
              )}
            </div>
            <div>
              <FieldLabel>Assign To</FieldLabel>
              <select required value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className={inputCls}>
                <option value="">Select an employee...</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
              {employees.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">Invite employees first in Org Setup.</p>
              )}
            </div>
            <div>
              <FieldLabel>Expected Return Date</FieldLabel>
              <input type="date" required min={todayISO()} value={expectedReturn} onChange={(e) => setExpectedReturn(e.target.value)} className={inputCls} />
            </div>
            <div className="pt-4 flex gap-3">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
              <button type="submit" disabled={availableAssets.length === 0 || employees.length === 0} className="flex-1 px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed">Allocate</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* =========================================================================
   BOOKINGS VIEW
   ========================================================================= */

function BookingsView() {
  const { bookings, addBooking, cancelBooking, assets, employees, currentUser } = useAppData();
  const isAdmin = currentUser?.role === 'Admin';
  const isLinked = !!currentUser?.employeeId;
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [assetId, setAssetId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [purpose, setPurpose] = useState('');

  const bookableAssets = assets.filter((a) => a.bookable && a.status !== 'Retired');
  const assetName = (id: string) => assets.find((a) => a.id === id)?.name || 'Unknown asset';
  const employeeName = (id: string) => employees.find((e) => e.id === id)?.name || 'Unknown employee';
  // Non-admins can only ever book for themselves; admins may book on behalf of anyone.
  const canBook = isAdmin || isLinked;

  const openModal = () => {
    setError('');
    setEmployeeId(isAdmin ? '' : currentUser?.employeeId || '');
    setShowModal(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const bookingEmployeeId = isAdmin ? employeeId : currentUser?.employeeId || '';
    if (!assetId || !bookingEmployeeId || !date || !startTime || !endTime) return;
    if (endTime <= startTime) {
      setError('End time must be after start time.');
      return;
    }
    const result = addBooking({ assetId, employeeId: bookingEmployeeId, date, startTime, endTime, purpose });
    if (!result.ok) {
      setError(result.message || 'Unable to create booking.');
      return;
    }
    setAssetId(''); setEmployeeId(''); setDate(''); setStartTime(''); setEndTime(''); setPurpose(''); setError('');
    setShowModal(false);
  };

  const sorted = [...bookings].sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  const canCancel = (b: Booking) => isAdmin || (isLinked && b.employeeId === currentUser?.employeeId);

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">
      <SectionHeader
        title="Bookings"
        subtitle="Reserve shared resources and avoid double-bookings."
        action={
          <PrimaryButton onClick={openModal}>
            <Plus className="w-4 h-4" /> New Booking
          </PrimaryButton>
        }
      />

      {!canBook && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800">
            Your account ({currentUser?.email}) isn't linked to an Employee Directory record yet, so you can't create bookings.
            Ask an admin to add your email in Org Setup.
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Resource</th>
                <th className="px-6 py-3 font-medium">Booked By</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Time</th>
                <th className="px-6 py-3 font-medium">Purpose</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={Calendar}
                      title="No bookings yet"
                      subtitle="Mark an asset as a shared resource in Assets, then reserve it here."
                      actionLabel={bookableAssets.length && canBook ? 'New Booking' : undefined}
                      onAction={bookableAssets.length && canBook ? openModal : undefined}
                    />
                  </td>
                </tr>
              ) : (
                sorted.map((b) => (
                  <tr key={b.id}>
                    <td className="px-6 py-3 text-gray-900 font-medium">{assetName(b.assetId)}</td>
                    <td className="px-6 py-3 text-gray-600">{employeeName(b.employeeId)}</td>
                    <td className="px-6 py-3 text-gray-600">{b.date}</td>
                    <td className="px-6 py-3 text-gray-600">{b.startTime}–{b.endTime}</td>
                    <td className="px-6 py-3 text-gray-600">{b.purpose || '—'}</td>
                    <td className="px-6 py-3"><StatusBadge value={b.status} /></td>
                    <td className="px-6 py-3 text-right">
                      {b.status === 'Confirmed' && canCancel(b) && (
                        <IconTextButton icon={X} tone="danger" onClick={() => cancelBooking(b.id)}>Cancel</IconTextButton>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title="New Booking" onClose={() => setShowModal(false)}>
          <form className="p-6 space-y-4" onSubmit={submit}>
            <div>
              <FieldLabel>Resource</FieldLabel>
              <select required value={assetId} onChange={(e) => setAssetId(e.target.value)} className={inputCls}>
                <option value="">Select a bookable resource...</option>
                {bookableAssets.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.tag})</option>
                ))}
              </select>
              {bookableAssets.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">No assets are marked as shared/bookable resources yet.</p>
              )}
            </div>
            <div>
              <FieldLabel>Booked By</FieldLabel>
              {isAdmin ? (
                <select required value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className={inputCls}>
                  <option value="">Select an employee...</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              ) : (
                <div className={`${inputCls} bg-gray-50 text-gray-600`}>
                  {currentUser?.name} <span className="text-xs text-gray-400">(you)</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <FieldLabel>Date</FieldLabel>
                <input type="date" required min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <FieldLabel>Start</FieldLabel>
                <input type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputCls} />
              </div>
              <div>
                <FieldLabel>End</FieldLabel>
                <input type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <FieldLabel>Purpose (Optional)</FieldLabel>
              <input type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)} className={inputCls} placeholder="e.g. Client demo" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="pt-4 flex gap-3">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
              <button type="submit" disabled={bookableAssets.length === 0 || !canBook} className="flex-1 px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed">Book Resource</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* =========================================================================
   MAINTENANCE VIEW
   ========================================================================= */

function MaintenanceView() {
  const { maintenance, addMaintenance, updateMaintenanceStatus, assets, currentUser } = useAppData();
  const isAdmin = currentUser?.role === 'Admin';
  const [showModal, setShowModal] = useState(false);
  const [assetId, setAssetId] = useState('');
  const [issue, setIssue] = useState('');
  const [priority, setPriority] = useState<MaintenancePriority>('Medium');
  const [notes, setNotes] = useState('');

  const eligibleAssets = assets.filter((a) => a.status !== 'Retired' && a.status !== 'Under Maintenance');
  const assetName = (id: string) => assets.find((a) => a.id === id)?.name || 'Unknown asset';
  const assetTag = (id: string) => assets.find((a) => a.id === id)?.tag || '—';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId || !issue.trim()) return;
    addMaintenance({
      assetId,
      issue: issue.trim(),
      priority,
      reportedDate: todayISO(),
      reportedBy: currentUser?.name || currentUser?.email || 'Unknown user',
      notes: notes.trim(),
    });
    setAssetId(''); setIssue(''); setPriority('Medium'); setNotes('');
    setShowModal(false);
  };

  const sorted = [...maintenance].sort((a, b) => (a.status === 'Resolved' ? 1 : 0) - (b.status === 'Resolved' ? 1 : 0));

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">
      <SectionHeader
        title="Maintenance"
        subtitle={isAdmin ? "Report issues and track repairs from open to resolved." : "Report issues on assets you're using."}
        action={
          <PrimaryButton onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" /> Report Issue
          </PrimaryButton>
        }
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Asset</th>
                <th className="px-6 py-3 font-medium">Issue</th>
                <th className="px-6 py-3 font-medium">Priority</th>
                <th className="px-6 py-3 font-medium">Reported</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {maintenance.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={Wrench}
                      title="No maintenance records"
                      subtitle="Report an issue on an asset to start a maintenance record."
                      actionLabel={eligibleAssets.length ? 'Report Issue' : undefined}
                      onAction={eligibleAssets.length ? () => setShowModal(true) : undefined}
                    />
                  </td>
                </tr>
              ) : (
                sorted.map((m) => (
                  <tr key={m.id}>
                    <td className="px-6 py-3 text-gray-900 font-medium">{assetName(m.assetId)} <span className="text-xs text-gray-400 font-mono">({assetTag(m.assetId)})</span></td>
                    <td className="px-6 py-3 text-gray-600 max-w-xs">
                      {m.issue}
                      <p className="text-xs text-gray-400 mt-0.5">Reported by {m.reportedBy}{m.notes ? ` — ${m.notes}` : ''}</p>
                    </td>
                    <td className="px-6 py-3"><StatusBadge value={m.priority} /></td>
                    <td className="px-6 py-3 text-gray-600">{m.reportedDate}</td>
                    <td className="px-6 py-3"><StatusBadge value={m.status} /></td>
                    <td className="px-6 py-3 text-right space-x-1">
                      {isAdmin && m.status === 'Open' && (
                        <IconTextButton icon={Clock} onClick={() => updateMaintenanceStatus(m.id, 'In Progress')}>Start Work</IconTextButton>
                      )}
                      {isAdmin && m.status === 'In Progress' && (
                        <IconTextButton icon={CheckCircle2} onClick={() => updateMaintenanceStatus(m.id, 'Resolved')}>Mark Resolved</IconTextButton>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title="Report Maintenance Issue" onClose={() => setShowModal(false)}>
          <form className="p-6 space-y-4" onSubmit={submit}>
            <div>
              <FieldLabel>Asset</FieldLabel>
              <select required value={assetId} onChange={(e) => setAssetId(e.target.value)} className={inputCls}>
                <option value="">Select an asset...</option>
                {eligibleAssets.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.tag})</option>
                ))}
              </select>
              {eligibleAssets.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">No eligible assets. Register assets first.</p>
              )}
            </div>
            <div>
              <FieldLabel>Issue Description</FieldLabel>
              <textarea required value={issue} onChange={(e) => setIssue(e.target.value)} className={`${inputCls} min-h-[80px]`} placeholder="Describe the problem..." />
            </div>
            <div>
              <FieldLabel>Priority</FieldLabel>
              <select value={priority} onChange={(e) => setPriority(e.target.value as MaintenancePriority)} className={inputCls}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <FieldLabel>Notes (Optional)</FieldLabel>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} placeholder="Additional context" />
            </div>
            <div className="pt-4 flex gap-3">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
              <button type="submit" disabled={eligibleAssets.length === 0} className="flex-1 px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed">Submit Report</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* =========================================================================
   AUDITS VIEW
   ========================================================================= */

function AuditsView() {
  const { audits, addAudit, completeAudit, assets } = useAppData();
  const [showModal, setShowModal] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [findingsDraft, setFindingsDraft] = useState('');

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [auditor, setAuditor] = useState('');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);

  const assetName = (id: string) => assets.find((a) => a.id === id)?.name || 'Unknown asset';

  const toggleAsset = (id: string) => {
    setSelectedAssets((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !auditor.trim() || selectedAssets.length === 0) return;
    addAudit({ title: title.trim(), date, auditor: auditor.trim(), assetIds: selectedAssets, findings: '' });
    setTitle(''); setDate(''); setAuditor(''); setSelectedAssets([]);
    setShowModal(false);
  };

  const submitFindings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingId) return;
    completeAudit(completingId, findingsDraft.trim() || 'No discrepancies found.');
    setCompletingId(null);
    setFindingsDraft('');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">
      <SectionHeader
        title="Audits"
        subtitle="Schedule asset audits and record findings."
        action={
          <PrimaryButton onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" /> Schedule Audit
          </PrimaryButton>
        }
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Audit</th>
                <th className="px-6 py-3 font-medium">Auditor</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Assets in Scope</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {audits.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={ClipboardCheck}
                      title="No audits scheduled"
                      subtitle="Schedule an audit to review a set of assets."
                      actionLabel={assets.length ? 'Schedule Audit' : undefined}
                      onAction={assets.length ? () => setShowModal(true) : undefined}
                    />
                  </td>
                </tr>
              ) : (
                audits.map((a) => (
                  <tr key={a.id}>
                    <td className="px-6 py-3 text-gray-900 font-medium">
                      {a.title}
                      {a.status === 'Completed' && a.findings && (
                        <p className="text-xs text-gray-400 mt-0.5">{a.findings}</p>
                      )}
                    </td>
                    <td className="px-6 py-3 text-gray-600">{a.auditor}</td>
                    <td className="px-6 py-3 text-gray-600">{a.date}</td>
                    <td className="px-6 py-3 text-gray-600">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <ListChecks className="w-3.5 h-3.5 text-gray-400" /> {a.assetIds.length} asset{a.assetIds.length !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-3"><StatusBadge value={a.status} /></td>
                    <td className="px-6 py-3 text-right">
                      {a.status === 'Scheduled' && (
                        <IconTextButton icon={CheckCircle2} onClick={() => { setCompletingId(a.id); setFindingsDraft(''); }}>Complete</IconTextButton>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title="Schedule Audit" onClose={() => setShowModal(false)} wide>
          <form className="p-6 space-y-4" onSubmit={submit}>
            <div>
              <FieldLabel>Audit Title</FieldLabel>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. Q3 Electronics Audit" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Date</FieldLabel>
                <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <FieldLabel>Auditor</FieldLabel>
                <input type="text" required value={auditor} onChange={(e) => setAuditor(e.target.value)} className={inputCls} placeholder="Auditor name" />
              </div>
            </div>
            <div>
              <FieldLabel>Assets in Scope</FieldLabel>
              {assets.length === 0 ? (
                <p className="text-xs text-gray-400">No assets registered yet.</p>
              ) : (
                <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-100">
                  {assets.map((a) => (
                    <label key={a.id} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAssets.includes(a.id)}
                        onChange={() => toggleAsset(a.id)}
                        className="w-4 h-4 text-teal-700 border-gray-300 rounded focus:ring-teal-700"
                      />
                      <span className="text-gray-700">{a.name}</span>
                      <span className="text-xs text-gray-400 font-mono">({a.tag})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="pt-4 flex gap-3">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
              <button type="submit" disabled={assets.length === 0} className="flex-1 px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed">Schedule</button>
            </div>
          </form>
        </Modal>
      )}

      {completingId && (
        <Modal title="Record Audit Findings" onClose={() => setCompletingId(null)}>
          <form className="p-6 space-y-4" onSubmit={submitFindings}>
            <div>
              <FieldLabel>Findings</FieldLabel>
              <textarea
                value={findingsDraft}
                onChange={(e) => setFindingsDraft(e.target.value)}
                className={`${inputCls} min-h-[100px]`}
                placeholder="Summarize discrepancies, damage, or missing items (leave blank if none)."
              />
            </div>
            <div className="pt-4 flex gap-3">
              <button type="button" onClick={() => setCompletingId(null)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
              <button type="submit" className="flex-1 px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 font-medium">Complete Audit</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* =========================================================================
   DASHBOARD HOME VIEW (KPIs)
   ========================================================================= */

function DashboardHome() {
  const { assets, allocations, maintenance, employees } = useAppData();

  const kpis = useMemo(() => {
    const total = assets.length;
    const available = assets.filter((a) => a.status === 'Available').length;
    const underMaintenance = assets.filter((a) => a.status === 'Under Maintenance').length;
    const overdue = allocations.filter(
      (a) => a.status === 'Active' && a.expectedReturn < todayISO()
    ).length;

    return [
      { title: 'Total Assets', value: total, trend: total === 0 ? 'No assets registered' : `${employees.length} employee${employees.length !== 1 ? 's' : ''} onboarded`, color: 'text-gray-900', icon: Package, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
      { title: 'Available', value: available, trend: total === 0 ? 'Awaiting data' : `${Math.round((available / total) * 100)}% of fleet`, color: 'text-emerald-600', icon: ClipboardCheck, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
      { title: 'Under Maintenance', value: underMaintenance, trend: maintenance.filter((m) => m.status !== 'Resolved').length + ' open ticket(s)', color: 'text-amber-500', icon: Wrench, iconBg: 'bg-amber-100', iconColor: 'text-amber-500' },
      { title: 'Overdue Returns', value: overdue, trend: overdue === 0 ? 'All allocations on track' : 'Needs follow-up', color: 'text-red-600', icon: ShieldAlert, iconBg: 'bg-red-100', iconColor: 'text-red-600' },
    ];
  }, [assets, allocations, maintenance, employees]);

  const recent = [...allocations]
    .sort((a, b) => b.allocatedDate.localeCompare(a.allocatedDate))
    .slice(0, 5);

  const assetName = (id: string) => assets.find((a) => a.id === id)?.name || 'Unknown asset';
  const assetTag = (id: string) => assets.find((a) => a.id === id)?.tag || '—';
  const { employees: emps } = useAppData();
  const employeeName = (id: string) => emps.find((e) => e.id === id)?.name || 'Unknown employee';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-sm text-gray-500 mt-1">Track key metrics and recent system activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">{kpi.title}</p>
              <h3 className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</h3>
              <p className="text-xs text-gray-400 mt-2">{kpi.trend}</p>
            </div>
            <div className={`p-3 rounded-lg ${kpi.iconBg}`}>
              <kpi.icon className={`w-6 h-6 ${kpi.iconColor}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Allocations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Asset Tag</th>
                <th className="px-6 py-3 font-medium">Item Name</th>
                <th className="px-6 py-3 font-medium">Assigned To</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No recent allocations found.
                  </td>
                </tr>
              ) : (
                recent.map((a) => (
                  <tr key={a.id}>
                    <td className="px-6 py-3 font-mono text-xs text-gray-700">{assetTag(a.assetId)}</td>
                    <td className="px-6 py-3 text-gray-900 font-medium">{assetName(a.assetId)}</td>
                    <td className="px-6 py-3 text-gray-600">{employeeName(a.employeeId)}</td>
                    <td className="px-6 py-3"><StatusBadge value={a.status} /></td>
                    <td className="px-6 py-3 text-right text-gray-500">{a.allocatedDate}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   DASHBOARD LAYOUT
   ========================================================================= */

function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { currentUser, setCurrentUser } = useAppData();

  const isAdmin = currentUser?.role === 'Admin';

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
    { path: '/dashboard/org', label: 'Org Setup', icon: Users, adminOnly: true },
    { path: '/dashboard/assets', label: 'Assets', icon: Package, adminOnly: false },
    { path: '/dashboard/allocations', label: 'Allocations', icon: ArrowRightLeft, adminOnly: true },
    { path: '/dashboard/bookings', label: 'Bookings', icon: Calendar, adminOnly: false },
    { path: '/dashboard/maintenance', label: 'Maintenance', icon: Wrench, adminOnly: false },
    { path: '/dashboard/audits', label: 'Audits', icon: ClipboardCheck, adminOnly: true },
  ].filter((item) => !item.adminOnly || isAdmin);

  const initial = currentUser?.name?.charAt(0)?.toUpperCase() || 'E';

  const handleSignOut = () => {
    setCurrentUser(null);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className={`bg-white border-r border-gray-200 transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="h-16 flex items-center justify-center border-b border-gray-200 px-4">
          <ShieldAlert className="w-8 h-8 text-teal-700 shrink-0" />
          {sidebarOpen && <span className="ml-3 font-bold text-xl tracking-tight text-gray-900">AssetFlow</span>}
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-teal-50 text-teal-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-teal-700' : 'text-gray-400'}`} />
                    {sidebarOpen && <span className="ml-3 whitespace-nowrap">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleSignOut}
            className={`flex items-center w-full px-3 py-2.5 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors ${!sidebarOpen && 'justify-center'}`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span className="ml-3 font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900 leading-none flex items-center justify-end gap-1.5">
                  {currentUser?.name || 'Employee'}
                  <span className={`text-[10px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded ${isAdmin ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'}`}>
                    {currentUser?.role || 'Employee'}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-1">{currentUser?.email || 'Not signed in'}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">
                {initial}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/* =========================================================================
   MAIN ROUTER APP
   ========================================================================= */

export default function App() {
  return (
    <AppDataProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="org" element={<RequireAdmin><OrgSetupView /></RequireAdmin>} />
            <Route path="assets" element={<AssetDirectoryView />} />
            <Route path="allocations" element={<RequireAdmin><AllocationsView /></RequireAdmin>} />
            <Route path="bookings" element={<BookingsView />} />
            <Route path="maintenance" element={<MaintenanceView />} />
            <Route path="audits" element={<RequireAdmin><AuditsView /></RequireAdmin>} />
          </Route>
        </Routes>
      </Router>
    </AppDataProvider>
  );
}
