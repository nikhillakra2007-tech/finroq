'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useI18n, SUPPORTED_LANGUAGES, Language, LanguageMeta } from '@/lib/i18n-context';
import { Globe, Check, ChevronDown, Search } from 'lucide-react';

interface LanguageSelectorProps {
  variant?: 'compact' | 'full' | 'pill';
  className?: string;
  align?: 'left' | 'right';
}

export function LanguageSelector({
  variant = 'compact',
  className = '',
  align = 'right',
}: LanguageSelectorProps) {
  const { language, setLanguage, activeLanguageMeta, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Esc
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Trap wheel scrolling anywhere inside the dropdown menu so parent page never scrolls
  useEffect(() => {
    const menuEl = menuContainerRef.current;
    const listEl = listContainerRef.current;
    if (!menuEl || !isOpen) return;

    const handleWheel = (e: WheelEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (listEl) {
        listEl.scrollTop += e.deltaY;
      }
    };

    menuEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      menuEl.removeEventListener('wheel', handleWheel);
    };
  }, [isOpen]);

  const filteredLanguages = SUPPORTED_LANGUAGES.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.nativeName.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q)
    );
  });

  const handleSelect = (code: Language) => {
    setLanguage(code);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      {variant === 'pill' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{activeLanguageMeta.nativeName}</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {activeLanguageMeta.badge}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      ) : variant === 'full' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-between w-full gap-2.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
              {activeLanguageMeta.badge}
            </span>
            <span className="font-medium">{activeLanguageMeta.nativeName}</span>
            <span className="text-[10px] text-slate-400">({activeLanguageMeta.name})</span>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          aria-expanded={isOpen}
          aria-haspopup="true"
          title={`Language: ${activeLanguageMeta.name}`}
        >
          <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span className="hidden sm:inline font-semibold">{activeLanguageMeta.nativeName}</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            {activeLanguageMeta.badge}
          </span>
          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuContainerRef}
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-72 rounded-2xl bg-white dark:bg-[#18231c] border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 overscroll-contain`}
          style={{ overscrollBehavior: 'contain' }}
        >
          {/* Header & Search */}
          <div className="p-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t('chat.lang_switch', 'CHOOSE LANGUAGE')} ({SUPPORTED_LANGUAGES.length})
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                18 {t('chat.available', 'Available')}
              </span>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('chat.search_lang', 'Search language...')}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Languages List */}
          <div
            ref={listContainerRef}
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            style={{ overscrollBehavior: 'contain', touchAction: 'pan-y' }}
            className="max-h-64 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin overscroll-contain"
          >
            {filteredLanguages.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                {t('chat.no_match', 'No matching language found')}
              </div>
            ) : (
              filteredLanguages.map((item: LanguageMeta) => {
                const isSelected = item.code === language;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => handleSelect(item.code)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-colors text-left ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-5 rounded-md flex items-center justify-center text-[10px] font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                        {item.badge}
                      </span>
                      <div className="flex flex-col">
                        <span className="leading-tight font-medium">{item.nativeName}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                          {item.name}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Notice */}
          <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 text-[10px] text-slate-500 dark:text-slate-400 text-center">
            {t('chat.multilingual_notice', 'Finroq AI chats & speaks in your chosen language')}
          </div>
        </div>
      )}
    </div>
  );
}
