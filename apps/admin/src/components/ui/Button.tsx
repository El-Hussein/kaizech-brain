import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
  loading?: boolean;
  isLoading?: boolean;
  loadingText?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      loading: explicitLoading,
      isLoading,
      loadingText,
      icon,
      children,
      onClick,
      disabled,
      className = '',
      type = 'button',
      style,
      ...props
    },
    ref
  ) => {
    const [asyncLoading, setAsyncLoading] = useState(false);
    const isCurrentlyLoading = Boolean(explicitLoading || isLoading || asyncLoading);

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isCurrentlyLoading || disabled) {
        e.preventDefault();
        return;
      }
      if (!onClick) return;

      try {
        const result = onClick(e) as unknown;
        if (result && typeof (result as any).then === 'function') {
          setAsyncLoading(true);
          await result;
        }
      } finally {
        setAsyncLoading(false);
      }
    };

    const variantClass = variant ? `btn-${variant}` : '';
    const combinedClassName = `btn ${variantClass} ${className}`.trim();

    return (
      <button
        {...props}
        ref={ref}
        type={type}
        className={combinedClassName}
        disabled={disabled || isCurrentlyLoading}
        onClick={handleClick}
        style={style}
      >
        {isCurrentlyLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" style={{ flexShrink: 0 }} />
            {loadingText !== undefined ? loadingText : children}
          </>
        ) : (
          <>
            {icon && <span className="btn-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
            {children}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
