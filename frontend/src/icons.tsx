import React from 'react';
// SVG icon components (outline style, strokeWidth 1.8)
type P = { size?: number; className?: string };
const I = ({ size=14, cls='', d }: { size?:number; cls?:string; d: string | string[] }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    className={cls}>
    {Array.isArray(d) ? d.map((p,i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
);

export const SearchIcon   = (p:P) => <I size={p.size} cls={p.className} d="M21 21l-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"/>;
export const GlobeIcon    = (p:P) => <I size={p.size} cls={p.className} d={["M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z","M2 12h20","M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"]}/>;
export const LinkIcon     = (p:P) => <I size={p.size} cls={p.className} d={["M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71","M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"]}/>;
export const FileTextIcon = (p:P) => (
  <svg width={p.size??14} height={p.size??14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={p.className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
  </svg>
);
export const MsgIcon      = (p:P) => <I size={p.size} cls={p.className} d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>;
export const LayersIcon   = (p:P) => <I size={p.size} cls={p.className} d={["M12 2L2 7l10 5 10-5-10-5z","M2 17l10 5 10-5","M2 12l10 5 10-5"]}/>;
export const LogOutIcon   = (p:P) => <I size={p.size} cls={p.className} d={["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4","M16 17l5-5-5-5","M21 12H9"]}/>;
export const TrashIcon    = (p:P) => <I size={p.size} cls={p.className} d={["M3 6h18","M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6","M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"]}/>;
export const PlusIcon     = (p:P) => <I size={p.size} cls={p.className} d={["M12 5v14","M5 12h14"]}/>;
export const PlayIcon     = (p:P) => (
  <svg width={p.size??14} height={p.size??14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}>
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);
export const DownloadIcon = (p:P) => <I size={p.size} cls={p.className} d={["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4","M7 10l5 5 5-5","M12 15V3"]}/>;
export const MenuIcon     = (p:P) => <I size={p.size} cls={p.className} d={["M3 12h18","M3 6h18","M3 18h18"]}/>;
export const XIcon        = (p:P) => <I size={p.size} cls={p.className} d={["M18 6L6 18","M6 6l12 12"]}/>;
export const ClockIcon    = (p:P) => <I size={p.size} cls={p.className} d={["M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z","M12 6v6l4 2"]}/>;
export const ZapIcon      = (p:P) => (
  <svg width={p.size??14} height={p.size??14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
export const HistoryIcon  = (p:P) => <I size={p.size} cls={p.className} d={["M2 12a10 10 0 1 0 .26-2.24","M2 4v6h6","M12 7v5l3 3"]}/>;
export const AlertIcon    = (p:P) => <I size={p.size} cls={p.className} d={["M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z","M12 9v4","M12 17h.01"]}/>;
export const UserIcon     = (p:P) => <I size={p.size} cls={p.className} d={["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2","M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"]}/>;
export const CpuIcon      = (p:P) => (
  <svg width={p.size??16} height={p.size??16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={p.className}>
    <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/>
    <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
    <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
    <line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/>
    <line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
  </svg>
);

export const TAB_ICONS: Record<string, React.FC<P>> = {
  search: GlobeIcon, scrape: LinkIcon, report: FileTextIcon, feedback: MsgIcon,
};
