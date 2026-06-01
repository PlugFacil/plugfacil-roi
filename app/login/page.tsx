'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Zap, Mail, Lock, Eye, EyeOff, LogIn, UserPlus, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignup) {
        const res = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data?.error ?? 'Erro ao cadastrar'); setLoading(false); return; }
        const result = await signIn('credentials', { email, password, redirect: false });
        if (result?.ok) { router.replace('/dashboard'); return; }
        setError('Cadastro realizado. Faça login.');
        setIsSignup(false);
      } else {
        const result = await signIn('credentials', { email, password, redirect: false });
        if (result?.ok) { router.replace('/dashboard'); }
        else { setError('Email ou senha inválidos'); }
      }
    } catch { setError('Erro de conexão'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen gradient-dark flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative w-20 h-20 bg-white rounded-xl p-1.5">
              <Image src="/logo.png" alt="PlugFácil Logo" fill className="object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-white">PlugFácil</h1>
          </div>
          <p className="text-gray-400 text-sm flex items-center justify-center gap-1">
            <Zap className="w-4 h-4 text-emerald-400" />
            Simulador Financeiro de Franquias
          </p>
        </div>

        <div className="glass rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">
            {isSignup ? 'Criar Conta' : 'Acessar Plataforma'}
          </h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg p-3 mb-4 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-11 pr-11 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white gradient-accent hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
              {isSignup ? 'Cadastrar' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsSignup(!isSignup); setError(''); }}
              className="text-emerald-400 hover:text-emerald-300 text-sm transition"
            >
              {isSignup ? 'Já tem conta? Faça login' : 'Novo vendedor? Crie sua conta'}
            </button>
          </div>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          © 2026 PlugFácil - Recarga de Veículos Elétricos
        </p>
      </motion.div>
    </div>
  );
}
