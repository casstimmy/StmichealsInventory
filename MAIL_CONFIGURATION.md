# Mail Configuration

Use these environment variables to keep every mail route explicit. Do not commit real passwords or live mailbox values.

## Sender and SMTP

```env
MAIL_FROM="St's Micheals <sender@example.com>"

# Option A: SMTP provider
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=sender@example.com
SMTP_PASS=app-password-or-smtp-password

# Option B: Gmail fallback
EMAIL_USER=sender@example.com
EMAIL_PASS=gmail-app-password
```

Sender fallback order is `MAIL_FROM`, `SMTP_FROM`, `EMAIL_FROM`, `FROM_EMAIL`, `SMTP_USER`, then `EMAIL_USER`.

## Recipients

```env
# Monthly business report from /api/daily-mail
MONTHLY_REPORT_MAIL_TO=owner@example.com
# Optional fallback names still supported: MONTHLY_REPORT_EMAIL_TO, REPORT_MAIL_TO, TEST_EMAIL

# Salary schedule from /api/salary-mail
SALARY_MAIL_TO=accounts@example.com
SALARY_MAIL_CC=manager@example.com

# Admin action/stock notifications
ADMIN_EMAIL=admin@example.com

# Support center notifications
SUPPORT_EMAIL=support@example.com
```

Customer, hotel, order-status, setup-verification, and onboarding emails use the customer/admin address from the request or database, and use the shared sender settings above.