'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Calculator, BarChart3, Car,
  Menu, X, Zap, BatteryCharging, SlidersHorizontal, CreditCard
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Painel', icon: LayoutDashboard },
  { href: '/dashboard/simulacao', label: 'Simulação', icon: Calculator },
  { href: '/dashboard/comparativo', label: 'Comparativo', icon: BarChart3 },
  { href: '/dashboard/personalizado', label: 'Personalizado', icon: SlidersHorizontal },
  { href: '/dashboard/financiamento', label: 'Financiamento', icon: CreditCard },
  { href: '/dashboard/carregamento', label: 'Carregamento', icon: BatteryCharging },
  { href: '/dashboard/veiculos', label: 'Veículos', icon: Car },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const [sideOpen, setSideOpen] = useState(false);

  return (
    <div className="min-h-screen gradient-dark">
      {/* Top Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/5">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <button onClick={() => setSideOpen(!sideOpen)} className="lg:hidden text-gray-400 hover:text-white">
              {sideOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="relative w-12 h-12 bg-white rounded-lg p-1">
                <Image src="/logo.png" alt="PlugFácil" fill className="object-contain" />
              </div>
              <span className="text-lg font-bold text-white hidden sm:block">PlugFácil</span>
            </Link>
            <div className="hidden sm:flex items-center gap-1 ml-2">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-gray-500">Simulador Financeiro</span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item: any) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith?.(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    active
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full font-medium hidden sm:block">Ferramenta Comercial</span>
          </div>
        </div>
      </header>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sideOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSideOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 h-full w-64 bg-[#0F1629] border-r border-white/5 z-50 p-6 lg:hidden"
            >
              <div className="flex items-center gap-2 mb-8">
                <div className="relative w-12 h-12 bg-white rounded-lg p-1">
                  <Image src="/logo.png" alt="PlugFácil" fill className="object-contain" />
                </div>
                <span className="text-lg font-bold text-white">PlugFácil</span>
              </div>
              <nav className="space-y-1">
                {navItems.map((item: any) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSideOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${
                        active ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="max-w-[1400px] mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
