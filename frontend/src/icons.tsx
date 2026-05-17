export {
  Search as SearchIcon,
  Globe as GlobeIcon,
  Link as LinkIcon,
  FileText as FileTextIcon,
  Layers as LayersIcon,
  LogOut as LogOutIcon,
  Trash2 as TrashIcon,
  Plus as PlusIcon,
  Play as PlayIcon,
  Download as DownloadIcon,
  Menu as MenuIcon,
  X as XIcon,
  Clock as ClockIcon,
  Zap as ZapIcon,
  History as HistoryIcon,
  AlertCircle as AlertIcon,
  User as UserIcon,
  Cpu as CpuIcon,
  ClipboardCheck,
} from 'lucide-react';

import { Globe, Link, FileText, ClipboardCheck } from 'lucide-react';

export const TAB_ICONS: Record<string, React.FC<any>> = {
  search: Globe,
  scrape: Link,
  report: FileText,
  feedback: ClipboardCheck,
};
