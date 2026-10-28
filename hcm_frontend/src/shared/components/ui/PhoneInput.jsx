import React from 'react';
import { Phone } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useSettings } from '../../../context/SettingsContext';

const COUNTRY_MAX_LENGTHS = {
  '+91': 10,
  '+1': 10,
  '+44': 10,
  '+49': 11,
  '+971': 9
};

const PhoneInput = ({ 
  value, 
  onChange, 
  name = 'phone', 
  required = false, 
  disabled = false, 
  className,
  placeholder
}) => {
  const { settings } = useSettings();
  
  // Priority: 1. Context, 2. LocalStorage, 3. Hardcoded Default
  let countryCode = settings?.defaultPhoneCountry || '+91';

  if (!settings?.defaultPhoneCountry) {
    try {
      const stored = localStorage.getItem('hcm_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.defaultPhoneCountry) {
          countryCode = parsed.defaultPhoneCountry;
        }
      }
    } catch (e) {
      // fallback
    }
  }

  // Ensure it's just the prefix. The settings may store "India (+91)" or "+91".
  if (countryCode.includes('(')) {
    const match = countryCode.match(/\(([^)]+)\)$/);
    countryCode = match ? match[1] : countryCode;
  }

  const maxLength = COUNTRY_MAX_LENGTHS[countryCode] || 10;
  
  // Custom onChange to automatically strip non-digits and cap dynamically
  const handleChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, maxLength);
    // Mimic standard event for the parent's onChange
    onChange({
      ...e,
      target: {
        ...e.target,
        name,
        value: val
      }
    });
  };

  return (
    <div className="relative group w-full">
      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-primary-600 transition-colors pointer-events-none" size={18} />
      <div className="absolute left-9 top-1/2 -translate-y-1/2 font-semibold text-xs text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 pr-2 pointer-events-none select-none">
        {countryCode}
      </div>
      <input
        type="tel"
        name={name}
        value={value || ''}
        onChange={handleChange}
        required={required}
        disabled={disabled}
        maxLength={maxLength}
        placeholder={placeholder || `e.g. ${'9'.repeat(maxLength)}`}
        className={cn(
          "w-full h-[44px] pl-20 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-2xs",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      />
    </div>
  );
};

export default PhoneInput;
