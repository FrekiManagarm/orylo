import {
  LayoutGrid,
  LucideIcon,
  Settings,
  FileText,
  Link as LinkIcon,
  Shield,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";

export type Submenu = {
  href: string;
  label: string;
  active: boolean;
  comingSoon?: boolean;
  icon: LucideIcon;
};

export type Menu = {
  href: string;
  label: string;
  active: boolean;
  icon: LucideIcon;
  submenus?: Submenu[];
  comingSoon?: boolean;
};

export type Group = {
  groupLabel: string;
  menus: Menu[];
};

export function proMenuList(pathname: string): Group[] {
  return [
    {
      groupLabel: "",
      menus: [
        {
          href: `/dashboard`,
          label: "Overview",
          active: pathname === `/dashboard`,
          icon: LayoutGrid,
        },
      ],
    },
    {
      groupLabel: "Fraud Detection",
      menus: [
        {
          href: `/dashboard/card-testing`,
          label: "Card Testing",
          active: pathname === `/dashboard/card-testing`,
          icon: ShieldAlert,
        },
        {
          href: `/dashboard/transactions`,
          label: "Transactions",
          active: pathname === `/dashboard/transactions`,
          icon: FileText,
        },
        {
          href: `/dashboard/alerts`,
          label: "Alerts",
          active: pathname === `/dashboard/alerts`,
          icon: AlertCircle,
        },
        {
          href: `/dashboard/rules`,
          label: "Rules",
          active: pathname === `/dashboard/rules`,
          icon: Shield,
        },
      ],
    },
    {
      groupLabel: "Settings",
      menus: [
        {
          href: `/dashboard/connect`,
          label: "Stripe Connect",
          active: pathname === `/dashboard/connect`,
          icon: LinkIcon,
        },
        {
          href: `/dashboard/settings`,
          label: "Settings",
          active: pathname.startsWith(`/dashboard/settings`),
          icon: Settings,
        },
      ],
    },
  ];
}
