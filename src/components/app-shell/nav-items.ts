import {
  IconLayoutDashboard,
  IconTargetArrow,
  IconUsers,
  IconBriefcase,
  IconCreditCard,
  IconReceipt2,
  IconUsersGroup,
  IconFolders,
  IconFileText,
  IconChartBar,
  type Icon,
} from "@tabler/icons-react";

export type NavItem = {
  label: string;
  href: string;
  icon: Icon;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: IconLayoutDashboard },
  { label: "Leads", href: "/leads", icon: IconTargetArrow },
  { label: "Clients", href: "/clients", icon: IconUsers },
  { label: "Projects", href: "/projects", icon: IconBriefcase },
  { label: "Payments", href: "/payments", icon: IconCreditCard },
  { label: "Expenses", href: "/expenses", icon: IconReceipt2 },
  { label: "Team", href: "/team", icon: IconUsersGroup },
  { label: "Documents", href: "/documents", icon: IconFolders },
  { label: "Generators", href: "/generators", icon: IconFileText },
  { label: "Reports", href: "/reports", icon: IconChartBar },
];
