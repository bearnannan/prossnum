import { cn } from "@/lib/utils";

interface GlassCardProps {
  children:  React.ReactNode;
  className?: string;
  hover?:     boolean;
  padding?:   boolean;
  glow?:      'cyan' | 'magenta' | 'green' | 'yellow' | 'purple' | 'none';
  geo?:       boolean; // แสดงมุม geometric
  style?:     React.CSSProperties;
}

export function GlassCard({ 
  children, 
  className, 
  hover = true, 
  padding = true,
  glow = 'none',
  geo = false,
  style,
}: GlassCardProps) {
  const glowStyles = {
    cyan:    'hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] hover:border-neon-cyan/30',
    magenta: 'hover:shadow-[0_0_20px_rgba(255,0,160,0.15)] hover:border-neon-magenta/30',
    green:   'hover:shadow-[0_0_20px_rgba(0,255,136,0.15)] hover:border-neon-green/30',
    yellow:  'hover:shadow-[0_0_20px_rgba(240,232,0,0.15)] hover:border-neon-yellow/30',
    purple:  'hover:shadow-[0_0_20px_rgba(184,41,221,0.15)] hover:border-neon-purple/30',
    none:    'hover:shadow-card-hover',
  };

  return (
    <div
      style={style}
      className={cn(
        "rounded-xl relative",
        padding && "p-6",
        "bg-dark-surface/80 backdrop-blur-[16px]",
        "border border-dark-border",
        "shadow-card",
        "transition-all duration-300",
        hover && "hover:-translate-y-0.5",
        hover && glowStyles[glow],
        geo && "geo-corner",
        className
      )}
    >
      {children}
    </div>
  );
}
