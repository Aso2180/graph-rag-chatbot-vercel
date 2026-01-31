'use client';

import * as React from 'react';

interface CheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  disabled?: boolean;
}

export function Checkbox({
  id,
  label,
  checked,
  onChange,
  description,
  disabled = false,
}: CheckboxProps) {
  return (
    <div className="flex items-start">
      <div className="flex items-center h-5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
      <div className="ml-3">
        <label
          htmlFor={id}
          className={`text-sm font-medium ${
            disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 cursor-pointer'
          }`}
        >
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}

interface CheckboxGroupProps {
  options: Array<{
    id: string;
    label: string;
    description?: string;
  }>;
  selectedValues: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}

export function CheckboxGroup({
  options,
  selectedValues,
  onChange,
  disabled = false,
}: CheckboxGroupProps) {
  const handleChange = (id: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedValues, id]);
    } else {
      onChange(selectedValues.filter((v) => v !== id));
    }
  };

  return (
    <div className="space-y-3">
      {options.map((option) => (
        <Checkbox
          key={option.id}
          id={option.id}
          label={option.label}
          description={option.description}
          checked={selectedValues.includes(option.id)}
          onChange={(checked) => handleChange(option.id, checked)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
