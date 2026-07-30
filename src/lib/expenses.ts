import { ExpenseCategory } from "./enums";

export type ParsedExpenseCategory = {
  displayCategory: string;
  rawCategory: ExpenseCategory | string;
  isCustom: boolean;
  cleanNotes: string;
};

export function parseExpenseCategory(expense: { category: string; notes?: string | null }): ParsedExpenseCategory {
  const notes = expense.notes || "";
  const match = notes.match(/^\[Category:\s*([^\]]+)\]\s*/i);

  if (match && match[1]) {
    const customName = match[1].trim();
    const cleanNotes = notes.replace(/^\[Category:\s*([^\]]+)\]\s*/i, "").trim();
    return {
      displayCategory: customName,
      rawCategory: expense.category,
      isCustom: true,
      cleanNotes,
    };
  }

  return {
    displayCategory: formatStandardExpenseCategory(expense.category),
    rawCategory: expense.category,
    isCustom: false,
    cleanNotes: notes,
  };
}

export function formatStandardExpenseCategory(cat: string): string {
  switch (cat) {
    case ExpenseCategory.SOFTWARE:
      return "Software & Tools";
    case ExpenseCategory.HOSTING:
      return "Server Hosting";
    case ExpenseCategory.DOMAINS:
      return "Domain Names";
    case ExpenseCategory.MARKETING:
      return "Marketing & Ads";
    case ExpenseCategory.OFFICE:
      return "Office & Supplies";
    case ExpenseCategory.TRAVEL:
      return "Travel & Meetings";
    case ExpenseCategory.TEAM_PAYMENTS:
      return "Team Payments";
    case ExpenseCategory.OTHER:
      return "Other Expense";
    default:
      return cat;
  }
}
