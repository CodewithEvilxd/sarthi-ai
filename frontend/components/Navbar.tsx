"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Heart, CloudSun } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={13} /> },
    { href: '/chat', label: 'AI Chat', icon: <MessageSquare size={13} /> },
    { href: '/health', label: 'Health', icon: <Heart size={13} /> },
    { href: '/environment', label: 'Environment', icon: <CloudSun size={13} /> },
  ];

  return (
    <header
      style={{ background: 'var(--z1)', borderBottom: '1px solid var(--border-subtle)' }}
      className="sticky top-0 z-50 w-full backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          {/* Live indicator */}
          <div className="flex items-center gap-1.5">
            <span
              style={{
                width: 7, height: 7, borderRadius: '50%',
                background: 'var(--ok)',
                animation: 'pulse-ok 2.5s ease-in-out infinite',
                display: 'inline-block'
              }}
            />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 15,
              letterSpacing: '-0.02em',
              color: 'var(--ink-1)'
            }}
          >
            Sarthi
            <span style={{ color: 'var(--ok)', marginLeft: 2 }}>AI</span>
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--ink-3)',
              letterSpacing: '0.08em',
              borderLeft: '1px solid var(--border-default)',
              paddingLeft: 10,
              marginLeft: 2
            }}
          >
            DECISION INTELLIGENCE
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-0.5">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--ink-1)' : 'var(--ink-2)',
                  background: isActive ? 'var(--z3)' : 'transparent',
                  borderRadius: 6,
                  transition: 'color 120ms, background 120ms',
                  position: 'relative',
                  textDecoration: 'none',
                  letterSpacing: '0.01em'
                }}
                className="group hover:text-[var(--ink-1)] hover:bg-[var(--z2)]"
              >
                <span style={{ color: isActive ? 'var(--ok)' : 'var(--ink-3)', transition: 'color 120ms' }}>
                  {link.icon}
                </span>
                {link.label}
                {/* Active indicator — left edge bar */}
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '25%',
                      height: '50%',
                      width: 2,
                      background: 'var(--ok)',
                      borderRadius: '0 2px 2px 0'
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
