import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BookOpen,
  Bot,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleDot,
  CreditCard,
  Dot,
  Gauge,
  KeyRound,
  LayoutDashboard,
  Plug2,
  ScrollText,
  Server,
  Settings,
  ShieldCheck,
  Telescope,
  Workflow,
} from "lucide-react";

const ICON_MAP = {
  layoutDashboard: LayoutDashboard,
  telescope: Telescope,
  gauge: Gauge,
  bot: Bot,
  alertTriangle: AlertTriangle,
  server: Server,
  workflow: Workflow,
  bookOpen: BookOpen,
  shieldCheck: ShieldCheck,
  scrollText: ScrollText,
  settings: Settings,
  creditCard: CreditCard,
  keyRound: KeyRound,
  plug2: Plug2,
  check: Check,
  circle: Circle,
  circleDot: CircleDot,
  dot: Dot,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
} as const satisfies Record<string, LucideIcon>;

export type AppIconName = keyof typeof ICON_MAP;

/** Icons used by `CONSOLE_MODULES` — kept in sync with `lib/console-nav.ts`. */
export const CONSOLE_MODULE_ICON_NAMES = [
  "layoutDashboard",
  "telescope",
  "gauge",
  "bot",
  "alertTriangle",
  "server",
  "workflow",
  "bookOpen",
  "shieldCheck",
  "scrollText",
  "settings",
  "creditCard",
  "keyRound",
  "plug2",
] as const;

export type ConsoleModuleIconName = (typeof CONSOLE_MODULE_ICON_NAMES)[number];

type AppIconProps = {
  name: AppIconName;
  /** Pixel size; passed to Lucide `size`. Default 18. */
  size?: number;
  strokeWidth?: number;
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
};

export function AppIcon({
  name,
  size = 18,
  strokeWidth = 1.65,
  className = "",
  "aria-hidden": ariaHidden = true,
}: AppIconProps) {
  const Icon = ICON_MAP[name];
  const merged = ["shrink-0", className].filter(Boolean).join(" ");
  return <Icon className={merged} size={size} strokeWidth={strokeWidth} aria-hidden={ariaHidden} />;
}
