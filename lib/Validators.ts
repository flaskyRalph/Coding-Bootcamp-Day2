export const validators = {
  email: (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },
  
  phoneNumber: (phone: string): boolean => {
    const re = /^(09|\+639)\d{9}$/;
    return re.test(phone.replace(/\s/g, ''));
  },
  
  name: (name: string): boolean => {
    return name.length >= 2 && /^[a-zA-Z\s'-]+$/.test(name);
  },
  
  password: (password: string): string | null => {
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain number';
    return null;
  },
  
  sanitizeInput: (input: string): string => {
    return input.trim().replace(/<[^>]*>/g, '');
  },
  
  orNumber: (orNumber: string): boolean => {
    const re = /^OR-\d{4}-\d{5}$/;
    return re.test(orNumber);
  },
  
  age: (age: number): boolean => {
    return age >= 0 && age <= 150;
  },
};

export const validateForm = (formData: Record<string, any>, rules: Record<string, Function[]>) => {
  const errors: Record<string, string> = {};
  
  Object.keys(rules).forEach(field => {
    const value = formData[field];
    const fieldRules = rules[field];
    
    for (const rule of fieldRules) {
      const error = rule(value);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  });
  
  return { isValid: Object.keys(errors).length === 0, errors };
};


