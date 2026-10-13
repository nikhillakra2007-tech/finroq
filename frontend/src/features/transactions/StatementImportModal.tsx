'use client';

import React, { useState } from 'react';
import { Account, StatementImportPreviewResponse, StatementImportPreviewItem } from '@/lib/api-types';
import { apiClient } from '@/lib/api-client';
import { Modal, Button, Select, Badge } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Upload, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

interface StatementImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  accounts: Account[];
}

export function StatementImportModal({
  isOpen,
  onClose,
  onSuccess,
  accounts,
}: StatementImportModalProps) {
  const { language, t } = useI18n();
  const [selectedAccountId, setSelectedAccountId] = useState<number>(accounts[0]?.id || 0);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<StatementImportPreviewResponse | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handlePreview = async () => {
    if (!file) {
      setError('Please select a bank statement file (CSV or plain text).');
      return;
    }
    if (!selectedAccountId) {
      setError('Please select an account for ingestion.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.previewStatementImport(selectedAccountId, file);
      setPreview(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to parse statement. Please check format.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview || preview.items.length === 0) return;

    setIsConfirming(true);
    setError(null);
    try {
      // Import valid, non-duplicate rows (or rows user approved)
      const validRows = preview.items.filter((it) => it.is_valid && !it.is_duplicate);
      if (validRows.length === 0) {
        setError('No valid non-duplicate transactions found to import.');
        setIsConfirming(false);
        return;
      }

      const res = await apiClient.confirmStatementImport({
        account_id: preview.account_id,
        transactions: validRows.map((it) => ({
          transaction_date: it.transaction_date,
          description: it.description,
          amount: it.amount,
          transaction_type: it.transaction_type,
          category_id: it.suggested_category_id,
        })),
      });

      setSuccessMessage(res.data.message);
      await onSuccess();
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to confirm statement import.');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setSuccessMessage(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={language === 'hi' ? 'बैंक स्टेटमेंट आयात करें' : 'Import Bank Statement'}
      description={
        language === 'hi'
          ? 'अपने लेजर में लेन-देन की समीक्षा, वर्गीकरण और जोड़ने के लिए समर्थित स्टेटमेंट फाइलें (CSV, TSV, टेक्स्ट) अपलोड करें।'
          : 'Upload supported statement files (CSV, TSV, text) to review, categorize, and commit transactions into your ledger.'
      }
      size="xl"
    >
      <div className="space-y-6">
        {error && (
          <div className="p-3.5 rounded-xl bg-[var(--bad-soft)] border border-[var(--bad-soft)] text-[var(--bad)] text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-[var(--soft)] border border-[var(--line)] text-[var(--accent)] text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {!preview ? (
          <div className="space-y-5">
            <div>
              <label className="text-xs font-medium text-finroq-forest dark:text-slate-300 block mb-1.5">
                {language === 'hi' ? 'लक्षित खाता' : 'Target Account'}
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE4DC] bg-white text-[#173F2B] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#173F2B] dark:bg-[#16251E] dark:border-[#2A3D33] dark:text-emerald-300"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.account_type} • {a.currency})
                  </option>
                ))}
              </select>
            </div>

            <div className="border-2 border-dashed border-finroq-border rounded-2xl p-8 text-center hover:bg-finroq-mint/20 transition-colors">
              <Upload className="w-10 h-10 text-finroq-forest/40 mx-auto mb-3" />
              <p className="text-sm font-semibold text-finroq-forest mb-1">
                {language === 'hi' ? 'बैंक स्टेटमेंट फाइल चुनें' : 'Choose a bank statement file'}
              </p>
              <p className="text-xs text-finroq-muted mb-4">
                {language === 'hi'
                  ? 'समर्थित प्रारूप: CSV, TSV, या सादा टेक्स्ट। अधिकतम 10MB।'
                  : 'Supported formats: CSV, TSV, or plain text export. Max 10MB.'}
              </p>
              <input
                type="file"
                id="statement-file-input"
                accept=".csv,.tsv,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="statement-file-input"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-finroq-mint text-finroq-forest border border-finroq-border text-xs font-semibold cursor-pointer hover:bg-finroq-sage/60 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                {file ? file.name : (language === 'hi' ? 'स्टेटमेंट फाइल ब्राउज़ करें' : 'Browse Statement File')}
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-finroq-border">
              <Button type="button" variant="secondary" onClick={handleClose}>
                {language === 'hi' ? 'रद्द करें' : 'Cancel'}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handlePreview}
                loading={isLoading}
                disabled={!file}
              >
                {language === 'hi' ? 'लेन-देन पूर्वावलोकन' : 'Preview Transactions'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Summary Banner */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[#EAF3E7]/40 border border-[#DCE4DC] text-xs dark:bg-[#16251E] dark:border-[#2A3D33]">
              <div>
                <span className="text-[#4D5D51] dark:text-slate-400 block">
                  {language === 'hi' ? 'कुल पार्स किए गए' : 'Total Parsed'}
                </span>
                <span className="font-mono text-base font-bold text-[#173F2B] dark:text-emerald-300">
                  {preview.total_rows}
                </span>
              </div>
              <div>
                <span className="text-[#4D5D51] dark:text-slate-400 block">
                  {language === 'hi' ? 'आयात के लिए तैयार' : 'Ready to Import'}
                </span>
                <span className="font-mono text-base font-bold text-[#247A50] dark:text-emerald-400">
                  {preview.valid_count}
                </span>
              </div>
              <div>
                <span className="text-[#4D5D51] dark:text-slate-400 block">
                  {language === 'hi' ? 'डुप्लीकेट चिन्हित' : 'Duplicates Flagged'}
                </span>
                <span className="font-mono text-base font-bold text-[#B77925] dark:text-amber-400">
                  {preview.duplicate_count}
                </span>
              </div>
            </div>

            {/* Preview Table */}
            <div className="border border-finroq-border rounded-xl overflow-hidden max-h-80 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#EAF3E7]/50 sticky top-0 border-b border-[#DCE4DC] dark:bg-[#1A2C22] dark:border-[#2A3D33]">
                  <tr>
                    <th className="p-3 text-left font-semibold text-[#173F2B] dark:text-emerald-300">
                      {language === 'hi' ? 'दिनांक' : 'Date'}
                    </th>
                    <th className="p-3 text-left font-semibold text-[#173F2B] dark:text-emerald-300">
                      {language === 'hi' ? 'विवरण' : 'Description'}
                    </th>
                    <th className="p-3 text-left font-semibold text-[#173F2B] dark:text-emerald-300">
                      {language === 'hi' ? 'सुझाई गई श्रेणी' : 'Suggested Category'}
                    </th>
                    <th className="p-3 text-right font-semibold text-[#173F2B] dark:text-emerald-300">
                      {language === 'hi' ? 'राशि' : 'Amount'}
                    </th>
                    <th className="p-3 text-center font-semibold text-[#173F2B] dark:text-emerald-300">
                      {language === 'hi' ? 'स्थिति' : 'Status'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-finroq-border">
                  {preview.items.map((it, idx) => (
                    <tr
                      key={idx}
                      className={it.is_duplicate ? 'bg-amber-50/50' : 'hover:bg-finroq-mint/20'}
                    >
                      <td className="p-3 font-mono text-[#173F2B] dark:text-slate-100">
                        {formatDate(it.transaction_date)}
                      </td>
                      <td className="p-3 font-medium text-[#202B24] dark:text-slate-200 max-w-xs truncate">
                        {it.description || '—'}
                      </td>
                      <td className="p-3">
                        {it.suggested_category_name ? (
                          <Badge variant="info" size="sm">
                            {it.suggested_category_name}
                          </Badge>
                        ) : (
                          <span className="text-[#4D5D51] dark:text-slate-400">
                            {language === 'hi' ? 'अवर्गीकृत' : 'Uncategorized'}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono font-bold">
                        <span
                          className={
                            it.transaction_type === 'income'
                              ? 'text-[#247A50] dark:text-emerald-400'
                              : 'text-[#B74747] dark:text-rose-400'
                          }
                        >
                          {it.transaction_type === 'income' ? '+' : '-'}
                          {formatCurrency(it.amount)}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {it.is_duplicate ? (
                          <Badge variant="warning" size="sm">
                            {language === 'hi' ? 'डुप्लीकेट' : 'Duplicate'}
                          </Badge>
                        ) : it.is_valid ? (
                          <Badge variant="success" size="sm">
                            {language === 'hi' ? 'मान्य' : 'Valid'}
                          </Badge>
                        ) : (
                          <Badge variant="danger" size="sm">
                            {it.error || (language === 'hi' ? 'अमान्य' : 'Invalid')}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-finroq-border">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPreview(null)}
                disabled={isConfirming}
              >
                {language === 'hi' ? 'फ़ाइल पर वापस जाएँ' : 'Back to File'}
              </Button>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleClose}
                  disabled={isConfirming}
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleConfirm}
                  loading={isConfirming}
                  disabled={preview.valid_count === 0}
                >
                  {language === 'hi'
                    ? `आयात की पुष्टि करें (${preview.valid_count} लेन-देन)`
                    : `Confirm Import (${preview.valid_count} Transactions)`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
