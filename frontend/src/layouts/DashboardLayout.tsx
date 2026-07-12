import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Box, Calendar, Wrench, ShieldCheck, Search } from 'lucide-react';

export default function DashboardLayout() {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Org Setup', path: '/org-setup', icon: Users },
    { name: 'Assets', path: '/assets', icon: Box },
    { name: 'Allocations', path: '/allocations', icon: Calendar },
    { name: 'Bookings', path: '/bookings', icon: Calendar },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench },
    { name: 'Audits', path: '/audits', icon: ShieldCheck },
  ];

  return (
    <div className="flex h-screen w-full bg-[#F9FAFB] font-sans text-gray-900">
      
      {/* Persistent Left Sidebar */}
      <aside className="w-64 border-r border-gray-200 bg-white flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold tracking-tight text-[#0F766E]">AssetFlow</h1>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-teal-50 font-medium text-[#0F766E]' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Search Bar */}
        <header className="h-16 border-b border-gray-200 bg-white flex items-center px-6 justify-between">
          <div className="relative w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search assets, users, or tickets..." 
              className="w-full h-9 pl-9 pr-4 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-[#0F766E] text-white flex items-center justify-center text-sm font-medium">
              EMP
            </div>
          </div>
        </header>

        {/* Page Content Injection Point */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

    </div>
  );
}