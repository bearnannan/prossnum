export const PRIORITY_CONFIG = {
  critical: { 
    label: 'CRITICAL', 
    color: '#ff00a0', 
    bg: 'rgba(255,0,160,0.12)',   
    glow: '0 0 12px rgba(255,0,160,0.4)'   
  },
  high:     { 
    label: 'HIGH',     
    color: '#ff7b00', 
    bg: 'rgba(255,123,0,0.12)',  
    glow: '0 0 12px rgba(255,123,0,0.35)' 
  },
  medium:   { 
    label: 'MEDIUM',   
    color: '#00f0ff', 
    bg: 'rgba(0,240,255,0.12)',  
    glow: '0 0 12px rgba(0,240,255,0.35)' 
  },
  low:      { 
    label: 'LOW',      
    color: '#6b7280', 
    bg: 'rgba(107,114,128,0.08)', 
    glow: 'none'                           
  },
} as const;

export const STATUS_CONFIG = {
  new:         { label: 'NEW',         color: '#00f0ff' },
  assigned:    { label: 'ASSIGNED',    color: '#b829dd' },
  in_progress: { label: 'IN PROGRESS', color: '#f0e800' },
  pending:     { label: 'PENDING',     color: '#6b7280' },
  resolved:    { label: 'RESOLVED',    color: '#00ff88' },
  closed:      { label: 'CLOSED',      color: '#059669' },
  cancelled:   { label: 'CANCELLED',   color: '#4b5563' },
} as const;
