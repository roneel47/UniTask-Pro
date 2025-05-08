import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  iconSize?: number | string;
}

export function Logo({ className, iconSize = 32 }: LogoProps) {
  return (
    <Link href="/dashboard" className={cn("flex items-center gap-2 group", className)} aria-label="UniTask Pro Home">
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary group-hover:text-primary/80 transition-colors" 
        aria-hidden="true"
      >
        {/* Book Outline - Uses currentColor from parent className */}
        <path d="M56 4H8C5.79086 4 4 5.79086 4 8V56C4 58.2091 5.79086 60 8 60H56C58.2091 60 60 58.2091 60 56V8C60 5.79086 58.2091 4 56 4Z" fill="currentColor" />
        
        {/* Book Pages - White/Card Color */}
        <path d="M10 8H31V56H10V8Z" fill="hsl(var(--card))" />
        <path d="M33 8H54V56H33V8Z" fill="hsl(var(--card))" />
        
        {/* Spine Detail - Subtle, using primary-foreground with opacity */}
        <path d="M32 6V58" stroke="hsl(var(--primary-foreground))" strokeOpacity="0.2" strokeWidth="1.5" />

        {/* Left Page Content */}
        {/* Yellow Square - Accent Color */}
        <rect x="14" y="12" width="7" height="7" rx="1" fill="hsl(var(--accent))" />
        
        {/* Checkmarks - Success Color */}
        <path d="M15 25L17 27L21 23" stroke="hsl(var(--success))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 33L17 35L21 31" stroke="hsl(var(--success))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 41L17 43L21 39" stroke="hsl(var(--success))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Lines beside square/checks - Primary Color */}
        <rect x="24" y="14" width="4" height="3" fill="hsl(var(--primary))" />
        <rect x="24" y="25" width="4" height="3" fill="hsl(var(--primary))" />
        <rect x="24" y="33" width="4" height="3" fill="hsl(var(--primary))" />
        <rect x="24" y="41" width="4" height="3" fill="hsl(var(--primary))" />

        {/* Right Page Content */}
        {/* Graduation Cap - Primary Color */}
        <path d="M47 17L38 20.5L47 24L56 20.5L47 17Z" fill="hsl(var(--primary))" />
        <path d="M40 21V28C40 28.5523 40.4477 29 41 29H53C53.5523 29 54 28.5523 54 28V21" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="54" y1="20.5" x2="54" y2="24.5" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />

        {/* ID Card Outline - Primary Color */}
        <rect x="38" y="32" width="20" height="14" rx="2" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="transparent" />
        {/* ID Card Person Icon - Primary Color */}
        <circle cx="43" cy="37" r="2.5" fill="hsl(var(--primary))" />
        <path d="M40 42C40 40.3431 41.3431 39 43 39H43C44.6569 39 46 40.3431 46 42V44H40V42Z" fill="hsl(var(--primary))" />
        {/* ID Card Lines - Primary Color */}
        <rect x="48" y="36" width="7" height="2" fill="hsl(var(--primary))" />
        <rect x="48" y="40" width="5" height="2" fill="hsl(var(--primary))" />
      </svg>
      {/* APP_NAME text removed to focus on the iconic logo as per image */}
    </Link>
  );
}
