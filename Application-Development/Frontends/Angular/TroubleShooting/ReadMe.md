# Angular Troubleshooting

## NG: Validator Invalid Characters (Email Validator)

Example: `pa­ris­ka­ra­lis@example.com`. The email contains non-printable Unicode characters (specifically U+00AD SOFT HYPHEN characters) embedded in the local part:

```plaintext
pa­ris­ka­ra­lis@example.com
    ^ ^ ^ ^
```

A human won't most probably notice the error, but the Angular email validator will reject it as invalid. The presence of these invisible characters can lead to confusion for users and developers alike, as the email may appear correct at first glance but fails validation.

**Breaking it down:**

- Byte sequence shows `70 61 C2 AD 72 69 73 C2 AD 6B 61 C2 AD 72 61 C2 AD 6C 69 73 31`
- The `C2 AD` bytes are UTF-8 encoded soft hyphens
- Valid email addresses cannot contain these characters in the local part per RFC 5321/5322

The intended address is likely: `pariskaralis@example.com`

## Solution: Custom Validator

```typescript
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function strictEmailValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;

    const email = control.value;

    // Check for non-printable/invisible characters (e.g.:)
    const hasInvisibleChars = /[\u00AD\u200B-\u200D\uFEFF]/.test(email);
    if (hasInvisibleChars) {
      return { invisibleCharacters: true };
    }

    // Standard email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { email: true };
    }

    return null;
  };
}
```

**Form Setup:**

```typescript
this.myForm = this.fb.group({
  email: ['', [Validators.required, strictEmailValidator()]]
});
```

**Template with specific error messages:**

```html
<mat-error *ngIf="emailControl.hasError('invisibleCharacters')">
  <span class="error-message" [textContent]="'TRANSLATION.KEY' | transloco ">
  </span>
</mat-error>
```
