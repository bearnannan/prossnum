export function getSLAProgress(createdAt: Date, dueAt: Date) {
  const total = dueAt.getTime() - createdAt.getTime();
  const remainingMs = Math.max(0, dueAt.getTime() - Date.now());
  
  let pct = 0;
  if (total > 0) {
    pct = Math.max(0, Math.min(1, remainingMs / total));
  }
  
  let status: 'ok' | 'warning' | 'breached' = 'ok';
  if (remainingMs <= 0) {
    status = 'breached';
    pct = 0;
  } else if (pct < 0.25) {
    status = 'warning';
  }
  
  return {
    pct,
    status,
    remainingMs
  };
}
