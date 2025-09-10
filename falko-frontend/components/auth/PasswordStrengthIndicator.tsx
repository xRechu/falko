'use client';

import { useMemo } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
  showDetails?: boolean;
}

interface StrengthCriteria {
  label: string;
  test: (password: string) => boolean;
  required: boolean;
}

interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  bgColor: string;
  criteria: Array<{ label: string; met: boolean; required: boolean }>;
}

const strengthCriteria: StrengthCriteria[] = [
  {
    label: 'Co najmniej 8 znaków',
    test: (password) => password.length >= 8,
    required: true,
  },
  {
    label: 'Zawiera małą literę',
    test: (password) => /[a-z]/.test(password),
    required: true,
  },
  {
    label: 'Zawiera wielką literę',
    test: (password) => /[A-Z]/.test(password),
    required: true,
  },
  {
    label: 'Zawiera cyfrę',
    test: (password) => /\d/.test(password),
    required: true,
  },
  {
    label: 'Zawiera znak specjalny',
    test: (password) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    required: false,
  },
  {
    label: 'Co najmniej 12 znaków',
    test: (password) => password.length >= 12,
    required: false,
  },
];

/**
 * Komponent do wyświetlania siły hasła z wizualnym wskaźnikiem
 */
export function PasswordStrengthIndicator({ password, showDetails = true }: PasswordStrengthProps) {
  const strength = useMemo((): PasswordStrength => {
    if (!password) {
      return {
        score: 0,
        label: 'Wprowadź hasło',
        color: 'text-gray-400',
        bgColor: 'bg-gray-200',
        criteria: strengthCriteria.map(criterion => ({
          label: criterion.label,
          met: false,
          required: criterion.required,
        })),
      };
    }

    const metCriteria = strengthCriteria.map(criterion => ({
      label: criterion.label,
      met: criterion.test(password),
      required: criterion.required,
    }));

    const requiredMet = metCriteria.filter(c => c.required && c.met).length;
    const optionalMet = metCriteria.filter(c => !c.required && c.met).length;
    const totalRequired = strengthCriteria.filter(c => c.required).length;

    let score = 0;
    let label = '';
    let color = '';
    let bgColor = '';

    if (requiredMet === 0) {
      score = 0;
      label = 'Bardzo słabe';
      color = 'text-red-600';
      bgColor = 'bg-red-500';
    } else if (requiredMet < totalRequired) {
      score = 1;
      label = 'Słabe';
      color = 'text-red-500';
      bgColor = 'bg-red-400';
    } else if (requiredMet === totalRequired && optionalMet === 0) {
      score = 2;
      label = 'Średnie';
      color = 'text-orange-500';
      bgColor = 'bg-orange-400';
    } else if (requiredMet === totalRequired && optionalMet === 1) {
      score = 3;
      label = 'Dobre';
      color = 'text-blue-500';
      bgColor = 'bg-blue-400';
    } else {
      score = 4;
      label = 'Bardzo dobre';
      color = 'text-green-500';
      bgColor = 'bg-green-500';
    }

    return {
      score,
      label,
      color,
      bgColor,
      criteria: metCriteria,
    };
  }, [password]);

  const getBarWidth = () => {
    if (strength.score === 0) return '0%';
    return `${(strength.score / 4) * 100}%`;
  };

  return (
    <div className="space-y-3">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Siła hasła</span>
          <span className={`text-sm font-medium ${strength.color}`}>
            {strength.label}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ease-in-out ${strength.bgColor}`}
            style={{ width: getBarWidth() }}
          />
        </div>

        {/* Color-coded segments */}
        <div className="flex space-x-1">
          {[1, 2, 3, 4].map((segment) => (
            <div
              key={segment}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                strength.score >= segment
                  ? segment === 1
                    ? 'bg-red-400'
                    : segment === 2
                    ? 'bg-orange-400'
                    : segment === 3
                    ? 'bg-blue-400'
                    : 'bg-green-500'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Detailed Criteria */}
      {showDetails && password && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Wymagania:</p>
          <div className="space-y-1">
            {strength.criteria.map((criterion, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 text-sm"
              >
                {criterion.met ? (
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
                <span
                  className={`${
                    criterion.met 
                      ? 'text-green-700' 
                      : criterion.required 
                      ? 'text-gray-600' 
                      : 'text-gray-400'
                  } ${!criterion.required ? 'italic' : ''}`}
                >
                  {criterion.label}
                  {!criterion.required && ' (opcjonalne)'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
