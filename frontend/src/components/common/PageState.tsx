import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Inbox, Loader2 } from 'lucide-react';

interface PageStateProps {
  type: 'loading' | 'empty' | 'error';
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: ReactNode;
}

const icons = {
  loading: <Loader2 className="h-8 w-8 animate-spin text-primary" />,
  empty: <Inbox className="h-10 w-10 text-muted-foreground/50" />,
  error: <AlertCircle className="h-10 w-10 text-destructive/70" />,
};

export default function PageState({ type, title, description, action, icon }: PageStateProps) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center">
      {icon || icons[type]}
      {title && <h2 className="text-xl font-semibold">{title}</h2>}
      {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && (
        <Button variant={type === 'error' ? 'destructive' : 'default'} onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
