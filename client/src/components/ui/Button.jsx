import { cn } from '../../utils';
import './Button.css';

export function Button({ variant = 'primary', size = 'md', children, className, ...props }) {
  return (
    <button className={cn('btn', `btn--${variant}`, `btn--${size}`, className)} {...props}>
      {children}
    </button>
  );
}
