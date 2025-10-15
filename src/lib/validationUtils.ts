export type ValidationErrors = {
  [key: string]: string;
};

/**
 * Validates email format using a standard regex pattern
 * @param email - Email string to validate
 * @returns Empty string if valid, error message if invalid
 */
export const validateEmail = (email: string): string => {
  if (!email) return '';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) ? '' : 'Please enter a valid email address';
};

/**
 * Validates phone number format - supports various formats with/without country codes
 * @param phone - Phone number string to validate
 * @returns Empty string if valid, error message if invalid
 */
export const validatePhone = (phone: string): string => {
  if (!phone) return '';
  const phoneRegex = /^[+]?[(]?[\d\s\-()]{10,}$/;
  return phoneRegex.test(phone) ? '' : 'Please enter a valid phone number';
};

/**
 * Validates website URL format - supports http/https and www variations
 * @param website - Website URL string to validate
 * @returns Empty string if valid, error message if invalid
 */
export const validateWebsite = (website: string): string => {
  if (!website) return '';
  const urlRegex =
    /^(https?:\/\/)?(www\.)?[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}$/;
  return urlRegex.test(website) ? '' : 'Please enter a valid website URL';
};

/**
 * Validates that a required field is not empty or whitespace-only
 * @param value - Value to validate
 * @param fieldName - Name of the field for error message
 * @returns Empty string if valid, error message if invalid
 */
export const validateRequired = (value: string, fieldName: string): string => {
  return value.trim() === '' ? `${fieldName} is required` : '';
};

/**
 * Validates salary format - supports various salary range formats
 * @param salary - Salary string to validate
 * @returns Empty string if valid, error message if invalid
 */
export const validateSalary = (salary: string): string => {
  if (!salary) return '';
  const salaryRegex =
    /^\$?[\d,]+(\s*-\s*\$?[\d,]+)?(\/?(hour|hr|year|yr|annually)?)?$/i;
  return salaryRegex.test(salary)
    ? ''
    : 'Please enter a valid salary range (e.g., $50,000 - $70,000)';
};

/**
 * Validates address format - basic validation for non-empty and reasonable length
 * @param address - Address string to validate
 * @returns Empty string if valid, error message if invalid
 */
export const validateAddress = (address: string): string => {
  if (!address) return '';
  if (address.trim().length < 10) {
    return 'Please enter a complete address (at least 10 characters)';
  }
  return '';
};

/**
 * Validates description format - ensures minimum length for meaningful content
 * @param description - Description string to validate
 * @param fieldName - Name of the field for error message
 * @param minLength - Minimum required length (default: 20)
 * @returns Empty string if valid, error message if invalid
 */
export const validateDescription = (
  description: string,
  fieldName: string = 'Description',
  minLength: number = 20
): string => {
  if (!description) return '';
  if (description.trim().length < minLength) {
    return `${fieldName} should be at least ${minLength} characters long`;
  }
  return '';
};

/**
 * Validates company data and returns validation errors
 * @param companyData - Company data object to validate
 * @returns ValidationErrors object with field-specific error messages
 */
export const validateCompanyData = (companyData: {
  name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  description: string;
}): ValidationErrors => {
  const errors: ValidationErrors = {};

  errors.name = validateRequired(companyData.name, 'Company name');
  errors.email = validateEmail(companyData.email);
  errors.phone = validatePhone(companyData.phone);
  errors.website = validateWebsite(companyData.website);
  errors.address = validateAddress(companyData.address);
  errors.description = validateDescription(
    companyData.description,
    'Company description'
  );

  return errors;
};

/**
 * Validates job data and returns validation errors
 * @param jobData - Job data object to validate
 * @returns ValidationErrors object with field-specific error messages
 */
export const validateJobData = (jobData: {
  title: string;
  location: string;
  salary: string;
  description: string;
  requirements: string;
}): ValidationErrors => {
  const errors: ValidationErrors = {};

  errors.title = validateRequired(jobData.title, 'Job title');
  errors.location = validateRequired(jobData.location, 'Location');
  errors.description = validateRequired(jobData.description, 'Job description');
  errors.requirements = validateRequired(jobData.requirements, 'Requirements');
  errors.salary = validateSalary(jobData.salary);

  return errors;
};

/**
 * Validates client data and returns validation errors
 * @param clientData - Client data object to validate
 * @returns ValidationErrors object with field-specific error messages
 */
export const validateClientData = (clientData: {
  user_id: string;
  company_name: string;
  industry: string;
  contact_phone: string;
  address: string;
}): ValidationErrors => {
  const errors: ValidationErrors = {};

  errors.user_id = validateRequired(clientData.user_id, 'User selection');
  errors.company_name = validateRequired(
    clientData.company_name,
    'Company name'
  );

  // Email validation - make it required for client login

  // Phone validation - optional but validate format if provided
  if (clientData.contact_phone) {
    errors.contact_phone = validatePhone(clientData.contact_phone);
  }

  return errors;
};

/**
 * Checks if validation errors object has any errors
 * @param errors - ValidationErrors object to check
 * @returns true if no errors, false if there are errors
 */
export const hasNoValidationErrors = (errors: ValidationErrors): boolean => {
  return !Object.values(errors).some(error => error !== '');
};
