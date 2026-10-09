const AREAS = {
  'F&A': {color:'#15803d', tint:'#f0fdf4', label:'Finance & Accounting'},
  Econ: {color:'#0f766e', tint:'#f0fdfa', label:'Economics'},
  POM: {color:'#9333ea', tint:'#faf5ff', label:'Operations Management'},
  Mktg: {color:'#ea580c', tint:'#fff7ed', label:'Marketing'},
  Entre: {color:'#65a30d', tint:'#f7fee7', label:'Entrepreneurship'},
  OBHRM: {color:'#d97706', tint:'#fffbeb', label:'Organisational Behaviour & HR'},
  Interdis: {color:'#a16207', tint:'#fefce8', label:'Interdisciplinary'},
  DS: {color:'#0891b2', tint:'#ecfeff', label:'Decision Sciences'},
  IS: {color:'#475569', tint:'#f1f5f9', label:'Information Systems'},
  Mcomm: {color:'#be185d', tint:'#fdf2f8', label:'Management Communication'},
  PP: {color:'#b91c1c', tint:'#fef2f2', label:'Public Policy'},
  Strat: {color:'#2563eb', tint:'#eff6ff', label:'Strategy'},
};
export function courseAreaStyle(area) {
  return AREAS[area] || {color:'#64748b',tint:'#f8fafc',label:area || 'Unconfirmed area'};
}
