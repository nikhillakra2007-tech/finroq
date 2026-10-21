'use client';

import React, { useState, useId } from 'react';
import {
  Account,
  Category,
  IngestionSessionResponse,
  IngestionItem,
  DuplicateStatus,
  FieldConfidenceState,
} from '@/lib/api-types';
import { apiClient } from '@/lib/api-client';
import { Modal, Button, Select, Badge } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Wallet,
  ShieldCheck,
  XCircle,
  HelpCircle,
  ArrowRight,
  Filter,
  Check,
  RefreshCw,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

interface StatementImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  accounts: Account[];
  categories?: Category[];
}

export function StatementImportModal({
  isOpen,
  onClose,
  onSuccess,
  accounts,
  categories = [],
}: StatementImportModalProps) {
  const { language, t } = useI18n();
  const [selectedAccountId, setSelectedAccountId] = useState<number>(accounts[0]?.id || 0);
  const [importMode, setImportMode] = useState<'bank_statement' | 'receipt'>('bank_statement');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<IngestionSessionResponse | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'ready' | 'duplicates' | 'review'>('all');
  const [isConfirming, setIsConfirming] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) {
      setError(
        importMode === 'bank_statement'
          ? 'Please select a bank statement file (CSV, TSV, or PDF).'
          : 'Please select a receipt image or document.'
      );
      return;
    }
    if (!selectedAccountId) {
      setError('Please select an account for ingestion.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.uploadDocument(selectedAccountId, file, importMode);
      setSession(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to process document. Please check the file format.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleItemSelection = async (itemId: string, currentSelected: boolean) => {
    if (!session) return;
    const newSelected = !currentSelected;

    // Optimistically update local session
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((it) => (it.id === itemId ? { ...it, is_selected_for_import: newSelected } : it)),
      };
    });

    try {
      await apiClient.updateIngestionItem(session.session_id, itemId, {
        is_selected_for_import: newSelected,
      });
    } catch (err: any) {
      // Revert if API fails
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((it) => (it.id === itemId ? { ...it, is_selected_for_import: currentSelected } : it)),
        };
      });
    }
  };

  const handleItemFieldChange = async (
    itemId: string,
    field: 'description' | 'amount' | 'transaction_date' | 'category_id' | 'transaction_type',
    value: any
  ) => {
    if (!session) return;

    // Optimistically update
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((it) => {
          if (it.id !== itemId) return it;
          const updated = { ...it, [field]: value };
          if (field === 'category_id') {
            const cat = categories.find((c) => c.id === Number(value));
            updated.suggested_category_id = cat ? cat.id : null;
            updated.suggested_category_name = cat ? cat.name : null;
          }
          if (field === 'amount' && Number(value) > 0) {
            updated.amount_state = 'verified';
            updated.is_valid = true;
          }
          return updated;
        }),
      };
    });

    try {
      const payload: any = {};
      if (field === 'amount') payload.amount = Number(value);
      else if (field === 'description') payload.description = String(value);
      else if (field === 'transaction_date') payload.transaction_date = String(value);
      else if (field === 'category_id') payload.category_id = Number(value) || null;
      else if (field === 'transaction_type') payload.transaction_type = String(value);

      await apiClient.updateIngestionItem(session.session_id, itemId, payload);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update field.');
    }
  };

  const handleConfirmImport = async () => {
    if (!session || session.items.length === 0) return;

    const itemsToImport = session.items.filter((it) => it.is_selected_for_import && it.is_valid);
    if (itemsToImport.length === 0) {
      setError('No valid transactions selected for import.');
      return;
    }

    setIsConfirming(true);
    setError(null);
    try {
      const idempotencyKey = `finroq-import-${session.session_id}-${Date.now()}`;
      const res = await apiClient.confirmIngestionSession(session.session_id, {
        account_id: session.account_id,
        idempotency_key: idempotencyKey,
        selected_item_ids: itemsToImport.map((it) => it.id),
      });

      setSuccessMessage(res.data.message);
      await onSuccess();
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to confirm import. Financial records were not modified.');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancelSession = async () => {
    if (session) {
      try {
        await apiClient.cancelIngestionSession(session.session_id);
      } catch (err) {
        // Silently continue close
      }
    }
    handleClose();
  };

  const handleClose = () => {
    setFile(null);
    setSession(null);
    setError(null);
    setSuccessMessage(null);
    onClose();
  };

  // Filter items
  const items = session?.items || [];
  const filteredItems = items.filter((it) => {
    if (activeFilter === 'ready') return it.is_valid && it.duplicate_status === 'none';
    if (activeFilter === 'duplicates') return it.duplicate_status !== 'none';
    if (activeFilter === 'review') return it.amount_state !== 'verified' || !it.is_valid;
    return true;
  });

  const selectedCount = items.filter((it) => it.is_selected_for_import && it.is_valid).length;
  const duplicateCount = items.filter((it) => it.duplicate_status !== 'none').length;
  const uncertainCount = items.filter(
    (it) => it.amount_state === 'uncertain' || it.amount_state === 'missing' || !it.is_valid
  ).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        importMode === 'bank_statement'
          ? language === 'hi'
            ? 'विश्वसनीय बैंक स्टेटमेंट आयात'
            : 'Trustworthy Bank Statement Import'
          : language === 'hi'
          ? 'रसीद व बिल स्कैनिंग'
          : 'Receipt & Expense Document Ingestion'
      }
      description={
        language === 'hi'
          ? 'सटीक वित्तीय सत्यापन, गणितीय समाधान, और बहु-स्तरीय डुप्लीकेट रोकथाम के साथ दस्तावेजों को आयात करें।'
          : 'Ingest financial records with exact decimal verification, mathematical statement reconciliation, and cross-source duplicate prevention.'
      }
      size="xl"
    >
      <div className="space-y-6">
        {/* Error Notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Notification */}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {!session ? (
          /* Step 1: Document Selection & Configuration */
          <div className="space-y-5">
            {/* Mode Switch Tabs */}
            <div className="flex border-b border-[#DCE4DC] dark:border-[#2A3D33] gap-6 text-sm font-semibold">
              <button
                type="button"
                onClick={() => {
                  setImportMode('bank_statement');
                  setFile(null);
                  setError(null);
                }}
                className={`pb-2.5 flex items-center gap-2 transition-colors border-b-2 ${
                  importMode === 'bank_statement'
                    ? 'border-[#173F2B] text-[#173F2B] dark:border-emerald-400 dark:text-emerald-300'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>{language === 'hi' ? 'बैंक स्टेटमेंट' : 'Bank Statement'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setImportMode('receipt');
                  setFile(null);
                  setError(null);
                }}
                className={`pb-2.5 flex items-center gap-2 transition-colors border-b-2 ${
                  importMode === 'receipt'
                    ? 'border-[#173F2B] text-[#173F2B] dark:border-emerald-400 dark:text-emerald-300'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span>{language === 'hi' ? 'खरीदारी रसीद / बिल / चालान' : 'Receipt / Shopping Bill'}</span>
              </button>
            </div>

            {/* Target Account Selector */}
            <div>
              <label className="text-xs font-medium text-finroq-forest dark:text-slate-300 block mb-1.5">
                {language === 'hi' ? 'लक्षित खाता' : 'Target Financial Account'}
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE4DC] bg-white text-[#173F2B] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#173F2B] dark:bg-[#16251E] dark:border-[#2A3D33] dark:text-emerald-300"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.account_type.toUpperCase()} • {a.currency})
                  </option>
                ))}
              </select>
            </div>

            {/* Upload Zone */}
            <div className="border-2 border-dashed border-[#BAC7BE] dark:border-[#2A3D33] rounded-2xl p-8 text-center hover:bg-[#EAF3E7]/40 dark:hover:bg-[#1A2C22]/30 transition-colors">
              <Upload className="w-10 h-10 text-[#173F2B]/40 dark:text-emerald-400/40 mx-auto mb-3" />
              <p className="text-sm font-semibold text-[#173F2B] dark:text-slate-200 mb-1">
                {importMode === 'bank_statement'
                  ? language === 'hi'
                    ? 'बैंक स्टेटमेंट फाइल चुनें या यहाँ खींचें'
                    : 'Choose bank statement file or drag here'
                  : language === 'hi'
                  ? 'रसीद या बिल की फोटो / PDF चुनें'
                  : 'Choose receipt image or PDF'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                {importMode === 'bank_statement'
                  ? language === 'hi'
                    ? 'समर्थित प्रारूप: CSV, TSV, या टेक्स्ट-आधारित PDF। अधिकतम 10MB।'
                    : 'Supported formats: CSV, TSV, or text PDF statements. Max 10MB.'
                  : language === 'hi'
                  ? 'समर्थित प्रारूप: PNG, JPG, WEBP, PDF। अधिकतम 10MB।'
                  : 'Supported formats: PNG, JPG, WEBP, PDF, text. Max 10MB.'}
              </p>
              <input
                type="file"
                id="document-ingestion-input"
                accept={importMode === 'bank_statement' ? '.csv,.tsv,.txt,.pdf' : '.png,.jpg,.jpeg,.webp,.pdf,.txt'}
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="document-ingestion-input"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#EAF3E7] text-[#173F2B] border border-[#BAC7BE] text-xs font-semibold cursor-pointer hover:bg-[#DCE4DC] transition-colors dark:bg-[#1A2C22] dark:border-[#2A3D33] dark:text-emerald-300"
              >
                <Upload className="w-3.5 h-3.5" />
                {file ? file.name : language === 'hi' ? 'दस्तावेज़ ब्राउज़ करें' : 'Browse File'}
              </label>
            </div>

            {/* Verification Guarantee Alert */}
            <div className="p-3.5 rounded-xl bg-[#F4F7F3] border border-[#DCE4DC] text-xs text-[#374A3E] flex items-start gap-2.5 dark:bg-[#14231B] dark:border-[#2A3D33] dark:text-slate-300">
              <ShieldCheck className="w-4 h-4 text-[#173F2B] dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-[#173F2B] dark:text-emerald-300 mb-0.5">
                  {language === 'hi' ? 'सटीक लेजर अखंडता नीति' : 'Exact Financial Integrity Policy'}
                </span>
                <span>
                  {language === 'hi'
                    ? 'अपलोड केवल डेटा का पूर्वावलोकन करता है। किसी भी वित्तीय लेनदेन को आपके स्पष्ट सत्यापन और पुष्टि के बिना स्थायी लेजर में नहीं जोड़ा जाता है।'
                    : 'Upload only initiates extraction and preview. No financial records are ever committed without your transparent review and confirmation.'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-[#DCE4DC] dark:border-[#2A3D33]">
              <Button type="button" variant="secondary" onClick={handleClose}>
                {language === 'hi' ? 'रद्द करें' : 'Cancel'}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleUploadAndAnalyze}
                loading={isLoading}
                disabled={!file}
              >
                {language === 'hi' ? 'दस्तावेज़ का विश्लेषण करें' : 'Analyze & Review Document'}
              </Button>
            </div>
          </div>
        ) : (
          /* Step 2: Comprehensive Review Screen */
          <div className="space-y-5">
            {/* Top Metric Header */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#EAF3E7]/40 border border-[#DCE4DC] text-xs dark:bg-[#16251E] dark:border-[#2A3D33]">
              <div>
                <span className="text-[#4D5D51] dark:text-slate-400 block mb-0.5">
                  {language === 'hi' ? 'पहचाना गया प्रकार' : 'Detected Type'}
                </span>
                <span className="font-semibold text-xs uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {session.detected_document_type.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className="text-[#4D5D51] dark:text-slate-400 block mb-0.5">
                  {language === 'hi' ? 'कुल निकाले गए' : 'Total Extracted'}
                </span>
                <span className="font-mono text-base font-bold text-[#173F2B] dark:text-emerald-300">
                  {session.total_items}
                </span>
              </div>
              <div>
                <span className="text-[#4D5D51] dark:text-slate-400 block mb-0.5">
                  {language === 'hi' ? 'आयात के लिए चयनित' : 'Selected to Commit'}
                </span>
                <span className="font-mono text-base font-bold text-[#247A50] dark:text-emerald-400">
                  {selectedCount}
                </span>
              </div>
              <div>
                <span className="text-[#4D5D51] dark:text-slate-400 block mb-0.5">
                  {language === 'hi' ? 'डुप्लीकेट चिन्हित' : 'Duplicates Flagged'}
                </span>
                <span className="font-mono text-base font-bold text-amber-600 dark:text-amber-400">
                  {duplicateCount}
                </span>
              </div>
            </div>

            {/* Mathematical Statement Reconciliation Banner (Bank Statement Mode) */}
            {session.reconciliation && session.reconciliation.can_reconcile && (
              <div
                className={`p-4 rounded-2xl border text-xs ${
                  session.reconciliation.is_reconciled
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
                    : 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1.5">
                  {session.reconciliation.is_reconciled ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  )}
                  <span>
                    {session.reconciliation.is_reconciled
                      ? language === 'hi'
                        ? 'गणितीय विवरण समाधान सफल'
                        : 'Mathematical Statement Reconciliation Verified'
                      : language === 'hi'
                      ? 'समाधान अंतर पाया गया (Reconciliation Discrepancy)'
                      : 'Statement Balance Discrepancy Detected'}
                  </span>
                </div>
                <p className="text-xs leading-relaxed">{session.reconciliation.explanation}</p>
                <div className="mt-2 pt-2 border-t border-emerald-200/50 dark:border-emerald-800/50 flex flex-wrap gap-4 font-mono text-[11px]">
                  <span>
                    Opening: {selectedAccount.currency} {session.reconciliation.opening_balance}
                  </span>
                  <span>
                    Credits (+): {selectedAccount.currency} {session.reconciliation.total_credits}
                  </span>
                  <span>
                    Debits (-): {selectedAccount.currency} {session.reconciliation.total_debits}
                  </span>
                  <span>
                    Stated Closing: {selectedAccount.currency} {session.reconciliation.closing_balance}
                  </span>
                </div>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="flex border-b border-[#DCE4DC] dark:border-[#2A3D33] gap-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`pb-2 border-b-2 transition-colors ${
                  activeFilter === 'all'
                    ? 'border-[#173F2B] text-[#173F2B] dark:border-emerald-400 dark:text-emerald-300'
                    : 'border-transparent text-slate-500'
                }`}
              >
                {language === 'hi' ? 'सभी लेनदेन' : 'All Transactions'} ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('ready')}
                className={`pb-2 border-b-2 transition-colors ${
                  activeFilter === 'ready'
                    ? 'border-[#173F2B] text-[#173F2B] dark:border-emerald-400 dark:text-emerald-300'
                    : 'border-transparent text-slate-500'
                }`}
              >
                {language === 'hi' ? 'तैयार' : 'Ready to Import'} (
                {items.filter((it) => it.is_valid && it.duplicate_status === 'none').length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('duplicates')}
                className={`pb-2 border-b-2 transition-colors ${
                  activeFilter === 'duplicates'
                    ? 'border-[#173F2B] text-[#173F2B] dark:border-emerald-400 dark:text-emerald-300'
                    : 'border-transparent text-slate-500'
                }`}
              >
                {language === 'hi' ? 'डुप्लीकेट चेतावनी' : 'Duplicates'} ({duplicateCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('review')}
                className={`pb-2 border-b-2 transition-colors ${
                  activeFilter === 'review'
                    ? 'border-[#173F2B] text-[#173F2B] dark:border-emerald-400 dark:text-emerald-300'
                    : 'border-transparent text-slate-500'
                }`}
              >
                {language === 'hi' ? 'समीक्षा आवश्यक' : 'Needs Review'} ({uncertainCount})
              </button>
            </div>

            {/* Review Items Table */}
            <div className="border border-[#DCE4DC] dark:border-[#2A3D33] rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#EAF3E7]/60 sticky top-0 border-b border-[#DCE4DC] dark:bg-[#1A2C22] dark:border-[#2A3D33] z-10">
                  <tr>
                    <th className="p-3 text-center w-10">
                      <span className="sr-only">Select</span>
                    </th>
                    <th className="p-3 text-left font-semibold text-[#173F2B] dark:text-emerald-300">
                      {language === 'hi' ? 'दिनांक' : 'Date'}
                    </th>
                    <th className="p-3 text-left font-semibold text-[#173F2B] dark:text-emerald-300">
                      {language === 'hi' ? 'विवरण' : 'Description / Merchant'}
                    </th>
                    <th className="p-3 text-left font-semibold text-[#173F2B] dark:text-emerald-300">
                      {language === 'hi' ? 'श्रेणी' : 'Category'}
                    </th>
                    <th className="p-3 text-right font-semibold text-[#173F2B] dark:text-emerald-300">
                      {language === 'hi' ? 'राशि' : 'Amount'}
                    </th>
                    <th className="p-3 text-center font-semibold text-[#173F2B] dark:text-emerald-300">
                      {language === 'hi' ? 'सत्यापन स्थिति' : 'Verification Status'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE4DC] dark:divide-[#2A3D33]">
                  {filteredItems.map((it) => (
                    <tr
                      key={it.id}
                      className={
                        it.duplicate_status !== 'none'
                          ? 'bg-amber-50/40 dark:bg-amber-950/20'
                          : !it.is_valid
                          ? 'bg-rose-50/40 dark:bg-rose-950/20'
                          : 'hover:bg-[#EAF3E7]/20 dark:hover:bg-[#1A2C22]/20'
                      }
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={it.is_selected_for_import}
                          onChange={() => handleToggleItemSelection(it.id, it.is_selected_for_import)}
                          className="rounded border-[#BAC7BE] text-[#173F2B] focus:ring-[#173F2B] cursor-pointer"
                        />
                      </td>

                      {/* Date (Editable) */}
                      <td className="p-3 whitespace-nowrap">
                        <input
                          type="text"
                          defaultValue={it.transaction_date ? it.transaction_date.split('T')[0] : ''}
                          onBlur={(e) => handleItemFieldChange(it.id, 'transaction_date', e.target.value)}
                          className="w-28 px-2 py-1 text-xs border border-transparent hover:border-[#BAC7BE] focus:border-[#173F2B] rounded bg-transparent font-mono dark:text-slate-200"
                        />
                      </td>

                      {/* Description (Editable) */}
                      <td className="p-3">
                        <input
                          type="text"
                          defaultValue={it.description}
                          onBlur={(e) => handleItemFieldChange(it.id, 'description', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-transparent hover:border-[#BAC7BE] focus:border-[#173F2B] rounded bg-transparent font-medium dark:text-slate-200"
                        />
                        {it.receipt_number && (
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            Invoice: {it.receipt_number}
                          </span>
                        )}
                        {it.line_items && it.line_items.length > 0 && (
                          <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                            {it.line_items.map((li, lidx) => (
                              <span key={lidx} className="mr-2">
                                • {li.description} ({selectedAccount.currency} {li.total_price})
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Category Dropdown */}
                      <td className="p-3">
                        <select
                          value={it.suggested_category_id || ''}
                          onChange={(e) => handleItemFieldChange(it.id, 'category_id', e.target.value)}
                          className="px-2 py-1 text-xs rounded border border-[#BAC7BE] bg-white dark:bg-[#16251E] dark:border-[#2A3D33] text-[#173F2B] dark:text-slate-200"
                        >
                          <option value="">{language === 'hi' ? 'अवर्गीकृत' : 'Uncategorized'}</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Amount (Editable) */}
                      <td className="p-3 text-right whitespace-nowrap">
                        <span
                          className={`font-mono font-bold text-xs ${
                            it.transaction_type === 'income'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {it.transaction_type === 'income' ? '+' : '-'} {selectedAccount.currency}{' '}
                          <input
                            type="number"
                            step="0.01"
                            defaultValue={it.amount}
                            onBlur={(e) => handleItemFieldChange(it.id, 'amount', e.target.value)}
                            className="w-20 px-1 py-0.5 text-right font-mono text-xs border border-transparent hover:border-[#BAC7BE] focus:border-[#173F2B] rounded bg-transparent"
                          />
                        </span>
                      </td>

                      {/* Verification Status Badge */}
                      <td className="p-3 text-center whitespace-nowrap">
                        {it.duplicate_status !== 'none' ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                            title={it.duplicate_reason || 'Matches existing record'}
                          >
                            <AlertTriangle className="w-3 h-3" />
                            {it.duplicate_status === 'exact_duplicate'
                              ? language === 'hi'
                                ? 'सटीक डुप्लीकेट'
                                : 'Exact Duplicate'
                              : language === 'hi'
                              ? 'संभावित डुप्लीकेट'
                              : 'Potential Match'}
                          </span>
                        ) : it.amount_state === 'verified' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <Check className="w-3 h-3" />
                            {language === 'hi' ? 'सत्यापित' : 'Verified'}
                          </span>
                        ) : !it.is_valid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                            <XCircle className="w-3 h-3" />
                            {language === 'hi' ? 'अमान्य राशि' : 'Invalid Amount'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                            <HelpCircle className="w-3 h-3" />
                            {language === 'hi' ? 'समीक्षाधीन' : 'Pending Review'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#DCE4DC] dark:border-[#2A3D33]">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                <span>
                  {language === 'hi'
                    ? `${selectedCount} लेनदेन आयात किए जाएंगे, ${duplicateCount} डुप्लीकेट सुरक्षित रूप से छोड़े जाएंगे।`
                    : `${selectedCount} transaction(s) will be committed, ${duplicateCount} duplicate(s) safely skipped.`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Button type="button" variant="secondary" onClick={handleCancelSession}>
                  {language === 'hi' ? 'रद्द करें व छोड़ें' : 'Cancel & Discard'}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleConfirmImport}
                  loading={isConfirming}
                  disabled={selectedCount === 0}
                >
                  {language === 'hi'
                    ? `पुष्टि करें व आयात करें (${selectedCount})`
                    : `Confirm & Import (${selectedCount})`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
