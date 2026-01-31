'use client';

import * as React from 'react';

interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  direction?: 'vertical' | 'horizontal';
}

export function RadioGroup({
  name,
  options,
  value,
  onChange,
  disabled = false,
  direction = 'vertical',
}: RadioGroupProps) {
  return (
    <div
      className={`${
        direction === 'horizontal' ? 'flex flex-wrap gap-4' : 'space-y-3'
      }`}
      role="radiogroup"
    >
      {options.map((option) => (
        <div key={option.value} className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id={`${name}-${option.value}`}
              name={name}
              type="radio"
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div className="ml-3">
            <label
              htmlFor={`${name}-${option.value}`}
              className={`text-sm font-medium ${
                disabled
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 cursor-pointer'
              }`}
            >
              {option.label}
            </label>
            {option.description && (
              <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
