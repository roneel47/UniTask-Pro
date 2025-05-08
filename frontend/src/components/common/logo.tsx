import { APP_NAME } from '@/lib/constants';
import { ListChecks } from 'lucide-react';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  iconSize?: number;
  textSize?: string;
}

export function Logo({ className, iconSize = 24, textSize = "text-xl" }: LogoProps) {
  return (
    <Link href="/dashboard" className={cn("flex items-center gap-2 group", className)}>
      <ListChecks size={iconSize} className="text-primary group-hover:text-accent transition-colors" />
      <span className={`font-bold ${textSize} text-foreground group-hover:text-accent transition-colors`}>
        {APP_NAME}
      </span>
    </Link>
  );
}

// Utility for cn if not already defined globally or in utils
// (assuming it exists in @/lib/utils)
import { cn } from '@/lib/utils';
