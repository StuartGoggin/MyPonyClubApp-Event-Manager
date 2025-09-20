/**
 * Email Validator
 * Handles email address validation and normalization
 */

export class EmailValidator {
  validateEmail(email: any, options: any = {}): any {
    if (!email || typeof email !== "string") {
      return {isValid: false, error: "Email is required"};
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {isValid: false, error: "Invalid email format"};
    }

    const disposableDomains = ["10minutemail.com", "tempmail.org", "guerrillamail.com"];
    const domain = email.split("@")[1];
    if (options.checkDisposable && disposableDomains.includes(domain)) {
      return {isValid: false, error: "Disposable email not allowed"};
    }

    const roleEmails = ["admin", "support", "noreply", "info"];
    const localPart = email.split("@")[0];
    if (options.allowRoleEmails === false && roleEmails.includes(localPart)) {
      return {isValid: false, error: "Role-based email not allowed"};
    }

    return {isValid: true, email: email.toLowerCase()};
  }

  validateEmailList(emails: string[]): any {
    const validEmails = [];
    const invalidEmails = [];

    for (const email of emails) {
      const result = this.validateEmail(email);
      if (result.isValid) {
        validEmails.push(result.email);
      } else {
        invalidEmails.push(email);
      }
    }

    return {validEmails, invalidEmails};
  }

  async validateEmailWithMX(email: string): Promise<any> {
    const basicValidation = this.validateEmail(email);
    if (!basicValidation.isValid) {
      return {...basicValidation, mxExists: false};
    }

    const domain = email.split("@")[1];
    // Mock MX record check
    const knownGoodDomains = ["gmail.com", "yahoo.com", "outlook.com"];
    const mxExists = knownGoodDomains.includes(domain);

    return {
      isValid: mxExists,
      email: email.toLowerCase(),
      mxExists,
    };
  }

  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
