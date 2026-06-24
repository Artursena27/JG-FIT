'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, API_URL } from '@/lib/supabaseClient';
import { useBrand } from '@/context/BrandContext';
import { Bell, CheckCheck, BellOff } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

/** Tempo relativo simples a partir de uma data ISO. */
function relativeTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'agora';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} h`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days} d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} sem`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mês${months > 1 ? 'es' : ''}`;
  const years = Math.floor(days / 365);
  return `${years} ano${years > 1 ? 's' : ''}`;
}

export default function NotificationsBell() {
  const { brand } = useBrand();
  const c = brand.colors;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const authedFetch = useCallback(async (path: string, options: RequestInit = {}) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return fetch(`${API_URL}${path}`, {
      ...options,
      headers: { ...(options.headers ?? {}), Authorization: `Bearer ${session?.access_token ?? ''}` },
    });
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await authedFetch('/api/notifications/me');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setNotifications(data);
    } catch {
      /* silencioso */
    }
  }, [authedFetch]);

  // Carga inicial + polling a cada 30s
  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    try {
      const res = await authedFetch('/api/notifications/me/read-all', { method: 'POST' });
      if (res.ok) await load();
    } catch {
      /* silencioso */
    }
  };

  const markOneRead = async (n: Notification) => {
    if (n.isRead) return;
    // Atualização otimista local
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    try {
      await authedFetch(`/api/notifications/${n.id}/read`, { method: 'POST' });
      await load();
    } catch {
      /* silencioso */
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Botão do sino */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-xl bg-bg-card border border-border-custom text-text-sub hover:text-text-main transition-colors cursor-pointer"
        title="Notificações"
        aria-label="Notificações"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-black leading-none"
            style={{ backgroundColor: c.primary, color: c.accent }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] bg-bg-card border border-border-custom rounded-2xl shadow-xl z-50 overflow-hidden">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between gap-2 p-3 border-b border-border-custom">
            <div className="flex items-center gap-2 min-w-0">
              <Bell className="w-4 h-4 shrink-0" style={{ color: c.primary }} />
              <h4 className="font-extrabold text-xs uppercase leading-none truncate">Notificações</h4>
              {unreadCount > 0 && (
                <span
                  className="text-[9px] font-black px-1.5 py-0.5 rounded"
                  style={{ color: c.primary, backgroundColor: `${c.primary}1f` }}
                >
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[10px] font-bold text-text-sub hover:text-text-main transition-colors shrink-0 cursor-pointer"
                title="Marcar todas como lidas"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-text-sub gap-2">
                <BellOff className="w-8 h-8 opacity-30" />
                <span className="text-xs">Nenhuma notificação por aqui.</span>
              </div>
            ) : (
              <ul>
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => markOneRead(n)}
                      className="w-full text-left p-3 border-b border-border-custom last:border-b-0 hover:bg-black/25 transition-colors flex gap-2.5 cursor-pointer"
                    >
                      {/* Indicador de não-lida */}
                      <span className="pt-1.5 shrink-0 w-2">
                        {!n.isRead && (
                          <span className="block w-2 h-2 rounded-full" style={{ backgroundColor: c.primary }} />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-xs truncate ${n.isRead ? 'font-semibold text-text-sub' : 'font-bold text-text-main'}`}
                          >
                            {n.title}
                          </span>
                          <span className="text-[9px] text-text-sub shrink-0">{relativeTime(n.createdAt)}</span>
                        </div>
                        <p
                          className={`text-[11px] leading-relaxed mt-0.5 ${n.isRead ? 'text-text-sub' : 'text-text-sub'}`}
                        >
                          {n.message}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
