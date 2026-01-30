import { forwardRef, InputHTMLAttributes, ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '../../lib/utils'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string | ReactNode
  description?: string
  error?: string
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, ...props }, ref) => {
    return (
      <div className="flex items-start gap-2">
        <div className="flex items-center justify-center flex-shrink-0 mt-0.5">
          <div className="relative inline-flex items-center justify-center">
            <input
              ref={ref}
              type="checkbox"
              className={cn(
                'peer h-4 w-4 min-h-[16px] min-w-[16px] rounded border-[1.5px] cursor-pointer',
                'transition-all duration-200 bg-white',
                'checked:bg-[var(--project-primary)] checked:border-[var(--project-primary)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--project-primary)] focus:ring-offset-1',
                'disabled:cursor-not-allowed disabled:opacity-50',
                error ? 'border-red-500' : 'border-gray-300',
                className
              )}
              style={{
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none',
              }}
              {...props}
            />
            <Check
              className="absolute inset-0 m-auto w-2.5 h-2.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
              strokeWidth={3}
            />
          </div>
        </div>
        {(label || description) && (
          <div className="flex-1 min-w-0">
            {label && (
              <label
                htmlFor={props.id}
                className="text-sm font-medium text-text-primary cursor-pointer leading-5 break-words"
              >
                {label}
                {props.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
            )}
            {description && (
              <p className="text-sm text-text-muted">{description}</p>
            )}
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

export default Checkbox


