"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  IconSearch,
  IconPlus,
  IconBriefcase,
  IconUsers,
  IconCreditCard,
  IconReceipt2,
  IconTargetArrow,
  IconFileText,
  IconLayoutDashboard,
  IconUsersGroup,
  IconFolders,
  IconChartBar,
  IconArrowRight,
  IconX,
  IconCommand,
  IconMoon,
  IconSun,
} from "@tabler/icons-react";
import { useTheme } from "next-themes";
import { useNav } from "./nav-context";

type CommandPaletteProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { setPendingHref } = useNav();
  const { theme, setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Close palette on Esc key or when navigating
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open trigger handled globally
        }
      } else if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Reset query and selected index on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const navigateTo = useCallback(
    (href: string) => {
      setPendingHref(href);
      onClose();
      router.push(href);
    },
    [router, setPendingHref, onClose]
  );

  const ACTIONS = [
    {
      category: "Quick Actions",
      items: [
        {
          id: "new-project",
          label: "New Project",
          desc: "Create client project & timeline",
          icon: IconBriefcase,
          action: () => navigateTo("/projects/new"),
        },
        {
          id: "add-client",
          label: "Add Client",
          desc: "Register new client profile",
          icon: IconUsers,
          action: () => navigateTo("/clients"),
        },
        {
          id: "record-payment",
          label: "Record Payment",
          desc: "Log client payment inflow receipt",
          icon: IconCreditCard,
          action: () => navigateTo("/payments"),
        },
        {
          id: "add-expense",
          label: "Add Expense",
          desc: "Log business expenditure or tool bill",
          icon: IconReceipt2,
          action: () => navigateTo("/expenses"),
        },
        {
          id: "new-lead",
          label: "New Lead",
          desc: "Add inquiry into Kanban pipeline",
          icon: IconTargetArrow,
          action: () => navigateTo("/leads?new=true"),
        },
        {
          id: "post-standup",
          label: "Post Daily Standup",
          desc: "Log yesterday's wins, today's focus & blockers",
          icon: IconPlus,
          action: () => {
            navigateTo("/team");
            setTimeout(() => {
              window.dispatchEvent(new Event("open-daily-standup"));
            }, 500);
          },
        },
      ],
    },
    {
      category: "CRM Modules",
      items: [
        { id: "nav-dashboard", label: "Dashboard", desc: "Revenue & profit overview", icon: IconLayoutDashboard, action: () => navigateTo("/") },
        { id: "nav-leads", label: "Leads Pipeline", desc: "Kanban deal stages", icon: IconTargetArrow, action: () => navigateTo("/leads") },
        { id: "nav-clients", label: "Clients Directory", desc: "Company profiles & contacts", icon: IconUsers, action: () => navigateTo("/clients") },
        { id: "nav-projects", label: "Projects Registry", desc: "Active & completed builds", icon: IconBriefcase, action: () => navigateTo("/projects") },
        { id: "nav-payments", label: "Payments Ledger", desc: "Inflow transaction history", icon: IconCreditCard, action: () => navigateTo("/payments") },
        { id: "nav-expenses", label: "Expenses Ledger", desc: "Outflow costs & hosting", icon: IconReceipt2, action: () => navigateTo("/expenses") },
        { id: "nav-team", label: "Team Founders", desc: "Co-founder profiles & payout", icon: IconUsersGroup, action: () => navigateTo("/team") },
        { id: "nav-documents", label: "Documents Hub", desc: "Uploaded files & client vaults", icon: IconFolders, action: () => navigateTo("/documents") },
        { id: "nav-reports", label: "Reports & Analytics", desc: "Revenue, P&L exports", icon: IconChartBar, action: () => navigateTo("/reports") },
      ],
    },
    {
      category: "Preferences",
      items: [
        {
          id: "toggle-theme",
          label: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
          desc: "Toggle application color scheme",
          icon: theme === "dark" ? IconSun : IconMoon,
          action: () => {
            setTheme(theme === "dark" ? "light" : "dark");
            onClose();
          },
        },
      ],
    },
  ];

  // Filter items based on query
  const filteredCategories = ACTIONS.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.desc.toLowerCase().includes(query.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0);

  const allFilteredItems = filteredCategories.flatMap((cat) => cat.items);

  // Keyboard navigation up/down/enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || allFilteredItems.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % allFilteredItems.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + allFilteredItems.length) % allFilteredItems.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = allFilteredItems[selectedIndex];
        if (item) {
          item.action();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, allFilteredItems, selectedIndex]);

  if (!isOpen) return null;

  let globalItemIndex = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-stone-950/40 dark:bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
      <div
        className="w-full max-w-xl bg-surface-white border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/80 bg-surface-white">
          <IconSearch className="h-5 w-5 text-brand-orange shrink-0" stroke={2.2} />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or search modules... (Esc to close)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent text-sm font-semibold text-text-primary placeholder:text-text-secondary focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-page transition-colors cursor-pointer"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        {/* Command List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((cat) => (
              <div key={cat.category} className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-text-secondary px-3 py-1 block">
                  {cat.category}
                </span>
                {cat.items.map((item) => {
                  const currentIndex = globalItemIndex++;
                  const isSelected = currentIndex === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all duration-100 cursor-pointer ${
                        isSelected
                          ? "bg-brand-orange-tint text-brand-orange font-bold shadow-2xs"
                          : "text-text-primary hover:bg-surface-page"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-brand-orange text-white"
                              : "bg-surface-page text-text-secondary"
                          }`}
                        >
                          <item.icon className="h-4 w-4" stroke={2} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold block truncate">{item.label}</span>
                          <span className="text-[10px] text-text-secondary block truncate font-medium">
                            {item.desc}
                          </span>
                        </div>
                      </div>
                      <IconArrowRight
                        className={`h-4 w-4 shrink-0 transition-transform ${
                          isSelected ? "translate-x-0.5 text-brand-orange" : "opacity-0"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs font-medium text-text-secondary">
              No matching commands or modules found.
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 bg-surface-page/80 border-t border-border/80 flex items-center justify-between text-[10px] text-text-secondary font-semibold select-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="bg-surface-white border border-border px-1.5 py-0.5 rounded shadow-2xs font-mono">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-surface-white border border-border px-1.5 py-0.5 rounded shadow-2xs font-mono">↵</kbd> Select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="bg-surface-white border border-border px-1.5 py-0.5 rounded shadow-2xs font-mono">Esc</kbd> Exit
          </span>
        </div>
      </div>
    </div>
  );
}
