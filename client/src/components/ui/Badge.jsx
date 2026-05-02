import { cn } from '../../utils';
import './Badge.css';

const STATUS_MAP = {
  'חדש': 'new',
  'בטיפול': 'inprogress',
  'סגור': 'closed',
};

export function Badge({ children, status, className }) {
  const variant = status ? STATUS_MAP[status] || 'default' : 'default';
  return (
    <span className={cn('badge', `badge--${variant}`, className)}>
      {children}
    </span>
  );
}
