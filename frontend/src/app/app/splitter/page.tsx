'use client';

import React, { useState, useEffect } from 'react';
import { ModuleShell } from '@/components/layout/ModuleShell';
import { apiClient } from '@/lib/api-client';
import { Account } from '@/lib/api-types';
import { formatCurrency } from '@/lib/utils';
import { Users, Plus, Trash2, ArrowRight, CheckCircle2, Calculator, Wallet } from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  paid: number;
}

export default function AppSplitterPage() {
  const [description, setDescription] = useState('Weekend Trip & Groceries');
  const [participants, setParticipants] = useState<Participant[]>([
    { id: '1', name: 'You', paid: 12000 },
    { id: '2', name: 'Sam', paid: 0 },
    { id: '3', name: 'Jordan', paid: 3000 },
  ]);
  const [newName, setNewName] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number>(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSuccess, setRecordSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const res = await apiClient.listAccounts();
        setAccounts(res.data.accounts || []);
        if (res.data.accounts && res.data.accounts.length > 0) {
          setSelectedAccountId(res.data.accounts[0].id);
        }
      } catch (err) {
        // Fallback gracefully
      }
    }
    fetchAccounts();
  }, []);

  const totalExpense = participants.reduce((sum, p) => sum + (Number(p.paid) || 0), 0);
  const sharePerPerson = participants.length > 0 ? totalExpense / participants.length : 0;

  const handleRecordShare = async () => {
    if (!selectedAccountId || sharePerPerson <= 0) return;
    setIsRecording(true);
    setRecordSuccess(null);
    try {
      await apiClient.createTransaction({
        account_id: selectedAccountId,
        amount: sharePerPerson.toFixed(2),
        currency: accounts.find((a) => a.id === selectedAccountId)?.currency || 'INR',
        transaction_type: 'expense',
        description: `Group Split Share: ${description}`,
        transaction_date: new Date().toISOString().split('T')[0],
      });
      setRecordSuccess(`Successfully committed ${formatCurrency(sharePerPerson)} to ledger.`);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to record transaction to ledger.');
    } finally {
      setIsRecording(false);
    }
  };

  const balances = participants.map((p) => ({
    ...p,
    net: (Number(p.paid) || 0) - sharePerPerson,
  }));

  const addParticipant = () => {
    if (!newName.trim()) return;
    setParticipants([...participants, { id: String(Date.now()), name: newName.trim(), paid: 0 }]);
    setNewName('');
  };

  const removeParticipant = (id: string) => {
    if (participants.length <= 2) return;
    setParticipants(participants.filter((p) => p.id !== id));
  };

  const updatePaid = (id: string, amount: number) => {
    setParticipants(
      participants.map((p) => (p.id === id ? { ...p, paid: Math.max(0, amount) } : p))
    );
  };

  // Settlement algorithm: pair debtors with creditors
  const debtors = balances.filter((b) => b.net < -0.01).map((b) => ({ ...b, debt: -b.net }));
  const creditors = balances.filter((b) => b.net > 0.01).map((b) => ({ ...b, credit: b.net }));
  const settlements: { from: string; to: string; amount: number }[] = [];

  let dIdx = 0;
  let cIdx = 0;
  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];
    const amount = Math.min(debtor.debt, creditor.credit);

    settlements.push({
      from: debtor.name,
      to: creditor.name,
      amount: Math.round(amount * 100) / 100,
    });

    debtor.debt -= amount;
    creditor.credit -= amount;

    if (debtor.debt < 0.01) dIdx++;
    if (creditor.credit < 0.01) cIdx++;
  }

  return (
    <ModuleShell
      title="Expense Splitter"
      category="Track & Control"
      description="Divide shared group expenses, compute exact equal or custom shares, and resolve multi-party debts with zero drift."
    >
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left: Input bill & members */}
        <div className="lg:col-span-7 bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <h3 className="font-display font-bold text-lg">Group Bill Details</h3>
            <span className="text-xs font-mono text-[var(--muted)]">{participants.length} People</span>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--muted)] block mb-1.5">
              Expense Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--line)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm font-medium"
            />
          </div>

          {/* Members list */}
          <div className="space-y-3">
            <label className="text-xs font-medium text-[var(--muted)] block">
              Who Paid What?
            </label>
            <div className="divide-y divide-[var(--line)] border border-[var(--line)] rounded-2xl overflow-hidden bg-[var(--bg)]/50">
              {participants.map((p) => (
                <div key={p.id} className="p-3.5 flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-[var(--ink)] min-w-[80px]">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--muted)]">Paid:</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={p.paid}
                      onChange={(e) => updatePaid(p.id, parseFloat(e.target.value) || 0)}
                      className="w-28 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--line)] font-mono text-sm text-right focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    />
                    {participants.length > 2 && (
                      <button
                        onClick={() => removeParticipant(p.id)}
                        className="p-1.5 text-[var(--muted)] hover:text-[var(--bad)] rounded-lg transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add member row */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="New person's name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addParticipant()}
                className="flex-1 px-4 py-2 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <button
                type="button"
                onClick={addParticipant}
                className="btn-pill sm bg-[var(--ink)] text-[var(--bg)] hover:bg-[var(--accent)] flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>
        </div>

        {/* Right: Summary & Settlements */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
            <h3 className="font-display font-bold text-lg pb-3 border-b border-[var(--line)]">
              Equal Share Breakdown
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[var(--soft)]/60">
                <span className="text-xs text-[var(--muted)] block">Total Group Bill</span>
                <span className="font-mono text-xl font-bold text-[var(--ink)] block mt-1">
                  {formatCurrency(totalExpense)}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--soft)]/60">
                <span className="text-xs text-[var(--muted)] block">Share Per Person</span>
                <span className="font-mono text-xl font-bold text-[var(--accent)] block mt-1">
                  {formatCurrency(sharePerPerson)}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-[var(--muted)] block">
                Net Balances
              </span>
              <div className="space-y-2 text-xs">
                {balances.map((b) => (
                  <div key={b.id} className="flex justify-between items-center py-1 border-b border-[var(--line)]">
                    <span className="font-medium text-[var(--ink)]">{b.name}</span>
                    <span className={`font-mono font-bold ${b.net > 0 ? 'text-[var(--accent)]' : b.net < 0 ? 'text-[var(--bad)]' : 'text-[var(--muted)]'}`}>
                      {b.net > 0 ? `Gets back ${formatCurrency(b.net)}` : b.net < 0 ? `Owes ${formatCurrency(Math.abs(b.net))}` : 'Settled'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-[var(--line)]">
              <h4 className="font-display font-bold text-sm text-[var(--ink)]">
                Minimal Transfer Settlements
              </h4>
              {settlements.length === 0 ? (
                <div className="p-3 rounded-xl bg-[var(--soft)] text-xs text-[var(--accent)] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> All participants are settled evenly!
                </div>
              ) : (
                <div className="space-y-2">
                  {settlements.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[var(--soft)] border border-[var(--line)] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 font-medium">
                        <span className="text-[var(--bad)] font-semibold">{s.from}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[var(--muted)]" />
                        <span className="text-[var(--accent)] font-semibold">{s.to}</span>
                      </div>
                      <span className="font-mono font-bold text-[var(--ink)]">
                        {formatCurrency(s.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cross-Module Integration: Commit Share to Authoritative Ledger */}
            <div className="pt-5 border-t border-[var(--line)] space-y-3">
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-[var(--muted)] block">
                Record Share into Finroq Ledger
              </span>

              {recordSuccess ? (
                <div className="p-3 rounded-xl bg-[var(--soft)] text-xs text-[var(--accent)] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{recordSuccess}</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {accounts.length > 0 && (
                    <div>
                      <label className="text-[11px] text-[var(--muted)] block mb-1">Deduct From Account</label>
                      <select
                        value={selectedAccountId}
                        onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      >
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({a.currency})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleRecordShare}
                    disabled={isRecording || sharePerPerson <= 0 || accounts.length === 0}
                    className="w-full py-2.5 px-4 rounded-xl bg-[var(--ink)] text-[var(--bg)] hover:bg-[var(--accent)] disabled:opacity-50 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    {isRecording ? 'Recording...' : `Record Your Share (${formatCurrency(sharePerPerson)})`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModuleShell>
  );
}
