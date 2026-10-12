'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, Button, Input } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { Users, Plus, Trash2, ArrowRight, CheckCircle2, Calculator } from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  paid: number;
}

export default function SplitterPage() {
  const [description, setDescription] = useState('Dinner & Groceries');
  const [participants, setParticipants] = useState<Participant[]>([
    { id: '1', name: 'You', paid: 120 },
    { id: '2', name: 'Sam', paid: 0 },
    { id: '3', name: 'Jordan', paid: 30 },
  ]);
  const [newName, setNewName] = useState('');

  const totalExpense = participants.reduce((sum, p) => sum + (Number(p.paid) || 0), 0);
  const sharePerPerson = participants.length > 0 ? totalExpense / participants.length : 0;

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

    if (amount > 0.01) {
      settlements.push({ from: debtor.name, to: creditor.name, amount });
    }

    debtor.debt -= amount;
    creditor.credit -= amount;

    if (debtor.debt <= 0.01) dIdx++;
    if (creditor.credit <= 0.01) cIdx++;
  }

  return (
    <MainLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-finroq-mint text-finroq-forest text-xs font-semibold mb-3">
            <Users className="h-3.5 w-3.5" />
            Module 3: Track & Control
          </div>
          <h1 className="heading-page">Expense Splitter & Settlements</h1>
          <p className="text-sm text-finroq-muted mt-1">
            Divide shared bills, calculate equal shares, and resolve settlements with minimum transactions.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column: Bill Setup */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="p-6 bg-white border-finroq-border rounded-2xl shadow-xs space-y-4">
              <h2 className="font-heading font-bold text-base text-finroq-text">1. Bill Details</h2>
              <div>
                <label className="label">Expense Title</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input"
                  placeholder="e.g. Vacation Airbnb, Team Dinner"
                />
              </div>

              <div className="pt-2">
                <label className="label">Add Participant</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="input"
                    placeholder="Participant name"
                    onKeyDown={(e) => e.key === 'Enter' && addParticipant()}
                  />
                  <button onClick={addParticipant} className="btn btn-primary text-xs px-4">
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-finroq-border space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-finroq-muted uppercase">
                  <span>Participant</span>
                  <span>Amount Paid ($)</span>
                </div>

                {participants.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 bg-finroq-ivory p-3 rounded-xl border border-finroq-border">
                    <span className="font-medium text-sm text-finroq-text flex-1">{p.name}</span>
                    <div className="w-32">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={p.paid || ''}
                        onChange={(e) => updatePaid(p.id, parseFloat(e.target.value) || 0)}
                        className="input text-right font-mono text-sm py-1.5"
                        placeholder="0.00"
                      />
                    </div>
                    {participants.length > 2 && (
                      <button
                        onClick={() => removeParticipant(p.id)}
                        className="p-1.5 text-finroq-muted hover:text-finroq-negative transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column: Calculations & Settlements */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="p-6 bg-white border-finroq-border rounded-2xl shadow-xs space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-finroq-border">
                <Calculator className="h-4 w-4 text-finroq-forest" />
                <h2 className="font-heading font-bold text-base text-finroq-text">Settlement Summary</h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-finroq-ivory p-4 rounded-xl border border-finroq-border">
                  <span className="text-xs text-finroq-muted">Total Expense</span>
                  <p className="font-mono text-xl font-bold text-finroq-text">{formatCurrency(totalExpense)}</p>
                </div>
                <div className="bg-finroq-mint p-4 rounded-xl border border-finroq-border">
                  <span className="text-xs text-finroq-forest font-medium">Equal Share / Person</span>
                  <p className="font-mono text-xl font-bold text-finroq-forest">{formatCurrency(sharePerPerson)}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-finroq-muted uppercase tracking-wider">Net Positions</h3>
                {balances.map((b) => (
                  <div key={b.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                    <span className="font-medium text-finroq-text">{b.name}</span>
                    <span
                      className={`font-mono font-bold ${
                        b.net > 0.01
                          ? 'text-finroq-positive'
                          : b.net < -0.01
                          ? 'text-finroq-negative'
                          : 'text-finroq-muted'
                      }`}
                    >
                      {b.net > 0.01
                        ? `Gets back ${formatCurrency(b.net)}`
                        : b.net < -0.01
                        ? `Owes ${formatCurrency(Math.abs(b.net))}`
                        : 'Settled ($0.00)'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-finroq-border space-y-3">
                <h3 className="text-xs font-bold text-finroq-forest uppercase tracking-wider">Suggested Transfers</h3>
                {settlements.length === 0 ? (
                  <div className="p-4 bg-finroq-mint rounded-xl text-center text-xs text-finroq-forest font-medium flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> All shares are fully balanced!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {settlements.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-finroq-ivory rounded-xl border border-finroq-border text-xs">
                        <span className="font-semibold text-finroq-text">{s.from}</span>
                        <div className="flex items-center gap-1.5 text-finroq-muted">
                          <span>pays</span>
                          <ArrowRight className="h-3 w-3" />
                        </div>
                        <span className="font-semibold text-finroq-forest">{s.to}</span>
                        <span className="font-mono font-bold text-finroq-positive">{formatCurrency(s.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
