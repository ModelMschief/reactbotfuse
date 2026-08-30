import React from 'react';
import { RATE_LIMIT_RULES, STATUS_CODES } from '@/data/docsData';
import { Shield, Key, Cpu, Zap, Lock, AlertTriangle, CheckCircle2, Server, Terminal } from 'lucide-react';

export const DocsOverview: React.FC = () => {
  return (
    <div className="space-y-12 pb-8">
      {/* Intro Hero */}
      <section id="overview" className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--primary-color)]/10 text-[var(--primary-color)] border border-[var(--primary-color)]/20">
          <Zap size={14} />
          <span>Interactive Developer Platform</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
          BotFusion API Documentation
        </h1>

        <p className="text-base text-[var(--text-secondary)] leading-relaxed max-w-3xl">
          Welcome to the official BotFusion Developer Hub. BotFusion provides high-throughput Telegram bot fleet management, AI microservice proxies (anomaly detection, dynamic QR generation, seller link tracking, toxicity screening), and non-custodial BEP-20 USDT merchant payment infrastructure.
        </p>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
              <Cpu size={18} />
            </div>
            <h3 className="font-bold text-sm text-[var(--text-primary)]">AI Microservices</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Fast, rate-limited proxies for Anomaly ML scoring, vector QR rendering, profanity detection, and link attribution.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
              <Server size={18} />
            </div>
            <h3 className="font-bold text-sm text-[var(--text-primary)]">Fleet Automation</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Multi-bot broadcast dispatch with dynamic inline button grids, media uploads, and 15 msg/s flood-safe batching.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <Lock size={18} />
            </div>
            <h3 className="font-bold text-sm text-[var(--text-primary)]">Non-Custodial Crypto</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Direct BSC BEP-20 USDT payments with temporary one-time deposit wallets, instant webhooks, and zero fees.
            </p>
          </div>
        </div>
      </section>

      {/* Authentication Schemes */}
      <section id="auth-schemes" className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
          <Key className="text-[var(--primary-color)]" size={22} />
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Authentication Schemes</h2>
        </div>

        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          BotFusion secures endpoints using four specialized authorization schemes tailored for each operational layer:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[var(--primary-color)]">Bearer JWT</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold">User Sessions</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Issued upon successful <code className="text-[var(--primary-color)]">/login</code> or <code className="text-[var(--primary-color)]">/verify-otp</code>. Required for managing bot fleets, uploading audiences, and viewing billing metrics.
            </p>
            <div className="p-2 rounded bg-black/40 font-mono text-[11px] text-gray-300">
              Authorization: Bearer eyJhbGciOiJIUzI1...
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[var(--primary-color)]">X-CONNECTION-KEY</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-semibold">Microservices</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Hex key prefixed with <code className="text-[var(--primary-color)]">acct_</code> used to invoke high-throughput AI microservices from bot webhooks without exposing full user credentials.
            </p>
            <div className="p-2 rounded bg-black/40 font-mono text-[11px] text-gray-300">
              X-CONNECTION-KEY: acct_eb3789b4a9912a8b
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[var(--primary-color)]">x-api-key</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold">BotFusion Pay</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Merchant API key prefixed with <code className="text-[var(--primary-color)]">bfpay_live_</code> for invoking <code className="text-[var(--primary-color)]">/bfpay/*</code> crypto gateway endpoints.
            </p>
            <div className="p-2 rounded bg-black/40 font-mono text-[11px] text-gray-300">
              x-api-key: bfpay_live_738a92b1c0e4
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[var(--primary-color)]">X-Webhook-Token</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-semibold">Webhooks</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Internal HMAC token used to verify automated on-chain payment confirmations from payment nodes.
            </p>
            <div className="p-2 rounded bg-black/40 font-mono text-[11px] text-gray-300">
              X-Webhook-Token: MASTER_BOT_TOKEN
            </div>
          </div>
        </div>
      </section>

      {/* Rate Limits & Safety */}
      <section id="ratelimits" className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
          <Shield className="text-[var(--primary-color)]" size={22} />
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Rate Limits & Traffic Protection</h2>
        </div>

        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          BotFusion enforces a multi-tier defense architecture to guarantee 99.98% cluster availability and prevent resource exhaustion.
        </p>

        <div className="overflow-x-auto rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-surface-hover)]/60 text-[var(--text-secondary)] font-semibold">
                <th className="py-3 px-4">Protection Tier</th>
                <th className="py-3 px-4">Threshold</th>
                <th className="py-3 px-4">Window / Scope</th>
                <th className="py-3 px-4">Rejection Response</th>
                <th className="py-3 px-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {RATE_LIMIT_RULES.map((rule, i) => (
                <tr key={i} className="hover:bg-[var(--bg-surface-hover)]/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-[var(--text-primary)]">{rule.scope}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-[var(--primary-color)]">{rule.limit}</td>
                  <td className="py-3 px-4 text-[var(--text-muted)]">{rule.window}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-red-400">{rule.action}</td>
                  <td className="py-3 px-4 text-[var(--text-secondary)]">{rule.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* HTTP Status & Errors */}
      <section id="statuscodes" className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
          <AlertTriangle className="text-[var(--primary-color)]" size={22} />
          <h2 className="text-xl font-bold text-[var(--text-primary)]">HTTP Status Codes & Error Guide</h2>
        </div>

        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          All API errors return standardized JSON payloads formatted with <code className="text-[var(--primary-color)]">error</code> and <code className="text-[var(--primary-color)]">message</code> attributes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {STATUS_CODES.map((item) => {
            const isSuccess = item.code >= 200 && item.code < 300;
            const badgeColor = isSuccess
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
              : item.code >= 400 && item.code < 500
              ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
              : 'bg-red-500/10 text-red-500 border-red-500/30';

            return (
              <div
                key={item.code}
                className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${badgeColor}`}>
                      {item.code}
                    </span>
                    <span className="text-xs font-bold text-[var(--text-primary)]">{item.status}</span>
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)]">{item.description}</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">{item.meaningInBotFusion}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
