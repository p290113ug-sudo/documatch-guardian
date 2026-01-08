Executive Summary
DocuMatch Guardian is a three-tiered B2B SaaS platform that progressively analyzes PDF invoices using Google Vertex AI (Gemini 1.5 Pro) to provide audit trails, cash flow optimization, and fraud detection.

1. Data Field Extraction Requirements
Tier 1: The Auditor ($49/mo)
Required PDF Fields:

invoice_amount (total due)
vendor_name (company issuing invoice)
invoice_number (for reference tracking)

Required CSV Fields:

transaction_date
description (to match vendor name)
amount (to match invoice total)
transaction_id (optional, for audit trail)

Matching Logic:

Fuzzy match on vendor name (threshold: 85% similarity)
Exact match on amount (tolerance: ±$0.01 for rounding)
Date range match (±7 days from invoice date if extracted)

Output:

Renamed PDF: YYYY-MM-DD_VendorName_$Amount.pdf
Match status report (matched/unmatched)
Audit log entry


Tier 2: The Maximizer ($149/mo)
Additional PDF Fields Required:

invoice_date (date invoice was issued)
payment_terms (e.g., "Net 30", "Net 60", "Due on Receipt", "2/10 Net 30")
due_date (if explicitly stated, use this over calculated)
invoice_currency (default: USD)

Business Logic:

Parse payment terms to extract number of days
Calculate optimal payment date: invoice_date + payment_terms_days
If early payment discount exists (e.g., "2/10 Net 30"), calculate discount deadline and potential savings
Handle edge cases: weekends/holidays (push to next business day)

Output:

Cash flow schedule CSV with columns:

invoice_number
vendor_name
invoice_amount
invoice_date
payment_terms
optimal_payment_date
early_payment_discount (if applicable)
discount_deadline (if applicable)
potential_savings (if applicable)


Weekly/monthly payment calendar export
Rolling 90-day cash flow projection


Tier 3: The Firewall ($499/mo)
Additional PDF Fields Required:

bank_account_number (vendor's account for payment)
bank_routing_number (if available)
bank_name (if available)
beneficiary_name (account holder name)
wire_instructions (if present)
payment_method (ACH, wire, check)

Firestore "Trusted Vendors" Collection Schema:
trusted_vendors/{vendor_id}
  - vendor_name: string
  - vendor_aliases: array<string> (for name variations)
  - trusted_bank_accounts: array<object>
      - account_number: string (encrypted)
      - routing_number: string
      - bank_name: string
      - verified_date: timestamp
      - verification_method: string
  - alert_contacts: array<string> (emails)
  - last_invoice_date: timestamp
  - risk_score: number (0-100)
  - status: enum (active, flagged, blocked)
Fraud Detection Logic:

Extract bank account from PDF
Look up vendor in Firestore by name (with fuzzy matching)
Compare extracted account number against trusted_bank_accounts array
If no match found:

Generate FRAUD ALERT
Flag invoice for manual review
Send notification to alert_contacts
Log event with severity level


Additional checks:

Sudden change in bank account (if vendor exists)
New vendor with high invoice amount (threshold: $10,000+)
Account number format validation



Output:

Fraud alert dashboard
Email/SMS notifications to designated contacts
Detailed fraud report PDF with:

Expected bank account
Detected bank account
Invoice details
Risk assessment score
Recommended actions




2. File Structure Tree
documatch-guardian/
├── README.md
├── .env.example
├── .gitignore
├── package.json
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
│
├── /backend
│   ├── /functions
│   │   ├── index.js                          # Firebase Cloud Functions entry
│   │   ├── package.json
│   │   │
│   │   ├── /tier1-auditor
│   │   │   ├── invoiceProcessor.js           # Main processing logic
│   │   │   ├── csvParser.js                  # CSV bank statement parser
│   │   │   ├── pdfMatcher.js                 # Fuzzy matching algorithm
│   │   │   ├── fileRenamer.js                # PDF rename utility
│   │   │   └── auditLogger.js                # Audit trail creation
│   │   │
│   │   ├── /tier2-maximizer
│   │   │   ├── paymentTermsParser.js         # Parse "Net 30", "2/10 Net 30", etc.
│   │   │   ├── cashFlowCalculator.js         # Calculate optimal payment dates
│   │   │   ├── discountAnalyzer.js           # Early payment discount logic
│   │   │   ├── scheduleExporter.js           # Generate CSV/Excel exports
│   │   │   └── calendarGenerator.js          # Payment calendar creation
│   │   │
│   │   ├── /tier3-firewall
│   │   │   ├── bankAccountExtractor.js       # Extract bank details from PDF
│   │   │   ├── vendorVerifier.js             # Check against Firestore
│   │   │   ├── fraudDetector.js              # Fraud detection engine
│   │   │   ├── alertSystem.js                # Send alerts (email/SMS)
│   │   │   └── riskScorer.js                 # Calculate risk scores
│   │   │
│   │   ├── /shared
│   │   │   ├── vertexAIClient.js             # Vertex AI (Gemini 1.5 Pro) wrapper
│   │   │   ├── pdfProcessor.js               # PDF parsing utilities
│   │   │   ├── firestoreService.js           # Firestore CRUD operations
│   │   │   ├── storageService.js             # Cloud Storage operations
│   │   │   ├── authMiddleware.js             # Subscription tier verification
│   │   │   ├── rateLimiter.js                # API rate limiting
│   │   │   ├── errorHandler.js               # Centralized error handling
│   │   │   ├── logger.js                     # Winston/Bunyan logging
│   │   │   └── validators.js                 # Input validation schemas
│   │   │
│   │   └── /webhooks
│   │       ├── stripeWebhook.js              # Handle subscription events
│   │       └── notificationWebhook.js        # External integrations
│   │
│   └── /config
│       ├── firebase-admin.json               # Service account key (gitignored)
│       ├── vertexAI.config.js                # Vertex AI configuration
│       └── app.config.js                     # Environment variables
│
├── /frontend
│   ├── /public
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── /assets
│   │       ├── /images
│   │       └── /icons
│   │
│   ├── /src
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── routes.js
│   │   │
│   │   ├── /components
│   │   │   ├── /common
│   │   │   │   ├── Navbar.js
│   │   │   │   ├── Sidebar.js
│   │   │   │   ├── Footer.js
│   │   │   │   ├── LoadingSpinner.js
│   │   │   │   └── ErrorBoundary.js
│   │   │   │
│   │   │   ├── /tier1
│   │   │   │   ├── UploadInvoice.js          # Drag-drop PDF upload
│   │   │   │   ├── UploadBankStatement.js    # CSV upload
│   │   │   │   ├── MatchResultsTable.js      # Display matched/unmatched
│   │   │   │   └── AuditLog.js               # View audit history
│   │   │   │
│   │   │   ├── /tier2
│   │   │   │   ├── CashFlowDashboard.js      # Visual cash flow timeline
│   │   │   │   ├── PaymentCalendar.js        # Interactive calendar view
│   │   │   │   ├── DiscountOpportunities.js  # Highlight early pay discounts
│   │   │   │   └── ExportSchedule.js         # Download CSV/Excel
│   │   │   │
│   │   │   └── /tier3
│   │   │       ├── TrustedVendorManager.js   # CRUD for trusted vendors
│   │   │       ├── FraudAlertDashboard.js    # Real-time alert feed
│   │   │       ├── RiskScorecard.js          # Vendor risk metrics
│   │   │       └── AlertSettings.js          # Configure notification rules
│   │   │
│   │   ├── /pages
│   │   │   ├── Dashboard.js                  # Main landing after login
│   │   │   ├── Pricing.js                    # Tier selection & upgrade
│   │   │   ├── Settings.js                   # User/company settings
│   │   │   ├── Login.js
│   │   │   ├── Signup.js
│   │   │   └── NotFound.js
│   │   │
│   │   ├── /services
│   │   │   ├── api.js                        # Axios instance with interceptors
│   │   │   ├── authService.js                # Firebase Auth SDK
│   │   │   ├── invoiceService.js             # API calls for invoice processing
│   │   │   └── subscriptionService.js        # Stripe integration
│   │   │
│   │   ├── /hooks
│   │   │   ├── useAuth.js                    # Authentication state
│   │   │   ├── useSubscription.js            # User's current tier
│   │   │   └── useInvoices.js                # Invoice data fetching
│   │   │
│   │   ├── /context
│   │   │   ├── AuthContext.js
│   │   │   └── SubscriptionContext.js
│   │   │
│   │   └── /utils
│   │       ├── formatters.js                 # Date/currency formatting
│   │       ├── validators.js                 # Form validation
│   │       └── constants.js                  # App-wide constants
│   │
│   └── package.json
│
├── /database
│   └── /firestore-schema
│       ├── users.schema.json                 # User accounts
│       ├── organizations.schema.json         # Company/team structure
│       ├── invoices.schema.json              # Processed invoice records
│       ├── bank_statements.schema.json       # Uploaded statements
│       ├── trusted_vendors.schema.json       # Tier 3 vendor whitelist
│       ├── fraud_alerts.schema.json          # Alert history
│       ├── audit_logs.schema.json            # System audit trail
│       └── subscriptions.schema.json         # Stripe subscription data
│
├── /storage-structure                        # Cloud Storage bucket organization
│   ├── /uploads
│   │   ├── /{user_id}
│   │   │   ├── /invoices                     # Original PDFs
│   │   │   │   └── /YYYY/MM/
│   │   │   └── /bank-statements              # Uploaded CSVs
│   │   │       └── /YYYY/MM/
│   │   
│   ├── /processed
│   │   └── /{user_id}
│   │       ├── /renamed-invoices             # Tier 1 output
│   │       ├── /cash-flow-schedules          # Tier 2 exports
│   │       └── /fraud-reports                # Tier 3 alerts
│   │
│   └── /temp                                 # 24-hour auto-delete
│       └── /{session_id}
│
├── /docs
│   ├── API.md                                # REST API documentation
│   ├── DEPLOYMENT.md                         # Deployment guide
│   ├── SECURITY.md                           # Security best practices
│   ├── VERTEX_AI_PROMPTS.md                  # Gemini prompt engineering
│   └── USER_GUIDE.md                         # End-user documentation
│
├── /scripts
│   ├── deploy.sh                             # Deployment automation
│   ├── seed-firestore.js                     # Sample data for testing
│   ├── migrate-data.js                       # Database migrations
│   └── backup-firestore.sh                   # Automated backups
│
└── /tests
    ├── /unit
    │   ├── tier1.test.js
    │   ├── tier2.test.js
    │   └── tier3.test.js
    ├── /integration
    │   └── vertexAI.test.js
    └── /e2e
        └── invoice-workflow.test.js

3. Standard Operating Procedure (SOP)
3.1 Invoice Upload & Initial Processing (All Tiers)
Step 1: User Authentication & Authorization

User logs in via Firebase Authentication
System retrieves user's subscription tier from Firestore
Verify subscription is active (check Stripe webhook data)
Load tier-specific UI components

Step 2: PDF Upload

User drags PDF invoice to upload zone
Frontend validates:

File type is PDF
File size < 10MB
User has not exceeded monthly quota


Generate unique invoice_id (UUID)
Upload to Cloud Storage: /uploads/{user_id}/invoices/YYYY/MM/{invoice_id}.pdf
Create Firestore document in invoices collection:

   invoices/{invoice_id}
     - user_id: string
     - organization_id: string
     - upload_timestamp: timestamp
     - original_filename: string
     - storage_path: string
     - processing_status: "pending"
     - tier_processing: array (e.g., ["tier1", "tier2"])
     - extracted_data: object (empty, to be populated)
Step 3: Vertex AI Extraction

Cloud Function triggered on Firestore write
Retrieve PDF from Cloud Storage
Construct Gemini 1.5 Pro prompt based on user's tier:
Tier 1 Prompt:

   Analyze this invoice PDF and extract the following in JSON format:
   {
     "vendor_name": "exact company name",
     "invoice_number": "invoice ID",
     "invoice_amount": 1234.56,
     "invoice_date": "YYYY-MM-DD" (if available)
   }
   Return only valid JSON. If a field is not found, use null.
Tier 2 Additional Fields:
   Also extract:
   {
     "payment_terms": "exact text (e.g., Net 30, 2/10 Net 30)",
     "due_date": "YYYY-MM-DD" (if explicitly stated),
     "early_payment_discount": "percentage" (if applicable)
   }
Tier 3 Additional Fields:
   Also extract:
   {
     "bank_account_number": "exact number",
     "routing_number": "9-digit code",
     "bank_name": "bank name",
     "beneficiary_name": "account holder name",
     "payment_instructions": "any special wire/ACH instructions"
   }

Send PDF to Vertex AI API with constructed prompt
Parse JSON response
Validate extracted data against schemas
Update Firestore document extracted_data field
Set processing_status: "extracted"

Step 4: Error Handling

If Vertex AI fails: retry 3 times with exponential backoff
If extraction incomplete: flag for manual review
Log all errors to audit_logs collection
Send notification to user if critical failure


3.2 Tier 1 Processing: The Auditor
Step 5: CSV Bank Statement Upload

User uploads CSV bank statement
System parses CSV and validates columns:

Required: date, description, amount
Optional: transaction_id, category


Store parsed data in Firestore: bank_statements/{statement_id}
Link to user's organization

Step 6: Matching Algorithm

For each invoice with processing_status: "extracted":

Extract vendor_name and invoice_amount
Query bank statement transactions within ±7 days of invoice date
Perform fuzzy string matching on vendor name vs. transaction description

Use Levenshtein distance (threshold: 85%)
Account for common variations (Inc., LLC, Corp.)


Compare amounts with ±$0.01 tolerance


If match found:

Create match record in invoices/{invoice_id}:



     match_result: {
       status: "matched",
       transaction_id: "...",
       confidence_score: 0.95,
       matched_date: timestamp
     }

Download original PDF from Cloud Storage
Rename to format: YYYY-MM-DD_VendorName_$Amount.pdf

Sanitize vendor name (remove special chars, limit 50 chars)
Format amount: $1234.56 → $1234-56 (filesystem safe)


Upload renamed PDF to /processed/{user_id}/renamed-invoices/
Update Firestore: processing_status: "tier1_complete"


If no match:

Set match_result.status: "unmatched"
Flag for user review
Add to unmatched invoices report



Step 7: Audit Log Creation

Record in audit_logs collection:

   {
     timestamp: ...,
     user_id: ...,
     action: "tier1_match",
     invoice_id: ...,
     result: "matched/unmatched",
     details: { ... }
   }

3.3 Tier 2 Processing: The Maximizer
Step 8: Payment Terms Parsing

Retrieve extracted_data.payment_terms from invoice
Apply regex patterns to identify:

Simple terms: "Net 30" → 30 days
Discount terms: "2/10 Net 30" → 2% discount if paid in 10 days, else due in 30
Due on receipt: 0 days
Custom: "Due by [date]" → calculate days from invoice date


Store parsed terms:

   payment_analysis: {
     net_days: 30,
     discount_rate: 0.02,
     discount_days: 10,
     has_early_discount: true
   }
Step 9: Optimal Payment Date Calculation

Calculate base due date:

If due_date explicitly stated: use that
Else: invoice_date + net_days


Adjust for business days:

If due date falls on weekend, push to next Monday
Check against holiday calendar (US federal holidays)


Calculate early payment option:

If has_early_discount: true:

Discount deadline: invoice_date + discount_days
Potential savings: invoice_amount * discount_rate




Store in payment_schedule subcollection:

   payment_schedule/{invoice_id}
     - invoice_id
     - optimal_payment_date
     - discount_deadline
     - potential_savings
     - calculated_date: timestamp
Step 10: Cash Flow Schedule Export

User requests export (weekly/monthly/quarterly)
Query all invoices in date range
Generate CSV with columns:

Invoice Date, Vendor, Amount, Payment Terms, Optimal Date, Discount Info, Savings


Sort by optimal payment date ascending
Add summary rows:

Total payables per week/month
Total potential discount savings


Upload to /processed/{user_id}/cash-flow-schedules/schedule_{timestamp}.csv
Provide download link to user

Step 11: Payment Calendar Generation

Create visual calendar view (frontend component)
Mark dates with:

Payment due (red)
Early discount deadline (green)
Optimal payment date (blue)


Allow user to set reminders
Integrate with Google Calendar (optional feature)


3.4 Tier 3 Processing: The Firewall
Step 12: Bank Account Extraction

From Vertex AI extraction, retrieve:

bank_account_number
routing_number
bank_name
beneficiary_name


Validate formats:

Account number: 6-17 digits
Routing number: 9 digits (US ABA format)


Encrypt sensitive data before storage using Cloud KMS

Step 13: Vendor Verification

Look up vendor in trusted_vendors collection:

Primary match: vendor_name (exact)
Secondary match: vendor_aliases array (fuzzy)


If vendor found:

Retrieve trusted_bank_accounts array
Decrypt each stored account number
Compare against extracted account number


Match logic:

Exact match: ✅ Approved
No match: 🚨 FRAUD ALERT
Similar digits (1-2 digit difference): ⚠️ Warning (manual review)



Step 14: Fraud Alert Triggered

If account number doesn't match:

Create alert in fraud_alerts collection:



     {
       alert_id: UUID,
       timestamp: now(),
       severity: "critical",
       invoice_id: ...,
       vendor_name: ...,
       expected_account: "***1234" (masked),
       detected_account: "***5678" (masked),
       risk_score: 95,
       status: "pending_review",
       assigned_to: null
     }

Generate detailed fraud report PDF:

Invoice details
Side-by-side account comparison
Historical payment data for vendor
Recommended actions


Upload to /processed/{user_id}/fraud-reports/alert_{alert_id}.pdf

Step 15: Notification System

Retrieve alert_contacts from vendor record or organization settings
Send multi-channel notifications:

Email: Send via SendGrid/Firebase Extensions

Subject: "🚨 FRAUD ALERT: [Vendor Name] - Account Mismatch"
Body: Summary + link to dashboard
Attachment: Fraud report PDF


SMS: Send via Twilio (for critical alerts)

"DocuMatch ALERT: Suspicious bank account on invoice #[XXX]. Review immediately."


In-app: Real-time notification via Firebase Cloud Messaging


Escalation rules:

If not acknowledged in 1 hour: send to secondary contacts
If not resolved in 24 hours: escalate to admin



Step 16: Risk Scoring

Calculate risk score (0-100) based on:

Account number mismatch: +50
New vendor (<3 invoices): +20
High invoice amount (>$10k): +15
Unusual payment terms: +10
Email domain mismatch: +10
Recent vendor data change: +15


Update vendor's risk_score in Firestore
Auto-flag invoices with risk_score > 70 for review

Step 17: Manual Review Interface

User accesses Fraud Alert Dashboard
Review flagged invoice:

View extracted data vs. trusted data
See invoice PDF preview
Access historical invoices from vendor


User actions:

Approve: Add new account to trusted_bank_accounts
Reject: Block invoice, send to vendor for verification
Request Info: Auto-email vendor requesting confirmation


Log resolution in fraud_alerts document


3.5 Trusted Vendor Management
Step 18: Adding Trusted Vendor

User accesses Trusted Vendor Manager
Manual entry form:

Vendor name (required)
Aliases (optional, for name variations)
Bank account number (required, encrypted)
Routing number
Bank name


Verification options:

Upload voided check (OCR verification)
Import from existing invoice
Manual entry with confirmation


Create in trusted_vendors/{vendor_id}
Set verification_method: "manual/ocr/import"

Step 19: Auto-Learning from Approved Invoices

When user approves an invoice in Tier 3:

If vendor doesn't exist: create new trusted vendor entry
If vendor exists: add new account to trusted_bank_accounts array
Set verified_date: now()
Increment approval_count for confidence scoring




3.6 Cross-Tier Data Flow
PDF Upload → Vertex AI Extraction
     ↓
Tier 1: Match with Bank Statement → Rename PDF
     ↓
Tier 2: Parse Payment Terms → Calculate Dates → Export Schedule
     ↓
Tier 3: Extract Bank Account → Verify → Alert if Mismatch
Data Dependencies:

Tier 2 requires Tier 1 completion (needs verified vendor name)
Tier 3 can run parallel to Tier 1/2 but benefits from Tier 1 matching confidence


4. Firestore Collections Schema Detail
4.1 invoices Collection
javascript{
  invoice_id: "uuid",
  user_id: "firebase_uid",
  organization_id: "org_uuid",
  upload_timestamp: Timestamp,
  original_filename: "invoice_123.pdf",
  storage_path: "/uploads/user/invoices/...",
  processing_status: enum["pending", "extracted", "tier1_complete", "tier2_complete", "tier3_complete", "error"],
  
  extracted_data: {
    vendor_name: "ACME Corp",
    invoice_number: "INV-001",
    invoice_amount: 1500.00,
    invoice_date: "2024-01-15",
    payment_terms: "Net 30",
    due_date: "2024-02-14",
    bank_account_number: "encrypted_string",
    routing_number: "encrypted_string",
    bank_name: "Chase Bank"
  },
  
  tier1_match: {
    status: enum["matched", "unmatched", "pending"],
    transaction_id: "txn_123",
    confidence_score: 0.95,
    matched_date: Timestamp,
    renamed_file_path: "/processed/user/renamed/..."
  },
  
  tier2_payment: {
    net_days: 30,
    optimal_payment_date: "2024-02-14",
    discount_rate: 0.02,
    discount_deadline: "2024-01-25",
    potential_savings: 30.00
  },
  
  tier3_fraud: {
    verification_status: enum["approved", "flagged", "pending"],
    risk_score: 15,
    alert_id: "alert_uuid" (if flagged),
    verified_by: "user_id",
    verified_date: Timestamp
  },
  
  created_at: Timestamp,
  updated_at: Timestamp
}
4.2 trusted_vendors Collection
javascript{
  vendor_id: "uuid",
  organization_id: "org_uuid",
  vendor_name: "ACME Corporation",
  vendor_aliases: ["ACME Corp", "ACME Inc", "Acme Corporation"],
  
  trusted_bank_accounts: [
    {
      account_number: "encrypted_1234567890",
      routing_number: "encrypted_021000021",
      bank_name: "Chase Bank",
      beneficiary_name: "ACME Corporation",
      verified_date: Timestamp,
      verification_method: enum["manual", "ocr", "import", "approved_invoice"],
      approval_count: 5
    }
  ],
  
  alert_contacts: ["cfo@company.com", "ap@company.com"],
  last_invoice_date: Timestamp,
  total_invoices_processed: 47,
  risk_score: 10,
  status: enum["active", "flagged", "blocked"],
  
  created_at: Timestamp,
  updated_at: Timestamp
}
4.3 fraud_alerts Collection
javascript{
  alert_id: "uuid",
  organization_id: "org_uuid",
  invoice_id: "invoice_uuid",
  timestamp: Timestamp,
  severity: enum["low", "medium", "high", "critical"],
  
  vendor_name: "ACME Corp",
  expected_account: "***1234",
  detected_account: "***5678",
  
  risk_factors: [
    "account_number_mismatch",
    "high_invoice_amount"
  ],
  risk_score: 95,
  
  status: enum["pending_review", "under_review", "resolved_approved", "resolved_rejected"],
  assigned_to: "user_id",
  resolved_by: "user_id",
  resolved_date: Timestamp,
  resolution_notes: "Verified with vendor via phone",
  
  notifications_sent: [
    {
      type: "email",
      recipient: "cfo@company.com",
      sent_at: Timestamp,
      acknowledged: true
    }
  ],
  
  fraud_report_path: "/processed/user/fraud-reports/...",
  
  created_at: Timestamp,
  updated_at: Timestamp
}

5. Vertex AI Integration Details
5.1 Gemini 1.5 Pro Configuration
javascript{
  model: "gemini-1.5-pro-002",
  temperature: 0.1,  // Low for consistent extraction
  topP: 0.8,
  topK: 40,
  maxOutputTokens: 2048,
  
  safetySettings: [
    {
      category: "HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold: "BLOCK_ONLY_HIGH"
    }
  ]
}
5.2 Prompt Engineering Best Practices

Structure: Always request JSON output
Specificity: Define exact field names and formats
Fallbacks: Instruct model to use null for missing data
Examples: Include 1-2 shot examples for complex extractions
Validation: Request confidence scores for critical fields

5.3 Error Handling

429 Rate Limit: Implement exponential backoff (1s, 2s, 4s)
503 Service Unavailable: Retry up to 3 times
Low Confidence (<70%): Flag for manual review
Invalid JSON: Attempt regex parsing, else flag


6. Security Considerations
6.1 Data EncryptionContinue10:12 AM
At Rest: All bank account numbers encrypted using Google Cloud KMS
In Transit: TLS 1.3 for all API communications
Firestore Rules: Row-level security based on organization_id

6.2 Access Control

Role-Based: Owner, Admin, Accountant, Viewer
Tier Restrictions: Middleware checks subscription before processing
API Keys: Rotate monthly, store in Secret Manager

6.3 Compliance

SOC 2 Type II: Required for enterprise clients
GDPR: Right to deletion (cascade delete all invoice data)
PCI DSS: Not directly applicable (not storing credit cards), but follow best practices for financial data


7. Scalability & Performance
7.1 Processing Quotas

Tier 1: 100 invoices/month
Tier 2: 500 invoices/month
Tier 3: Unlimited (fair use: 5,000/month before review)

7.2 Optimization Strategies

Batch Processing: Process invoices in batches of 10 for Vertex AI efficiency
Caching: Cache vendor name → trusted_vendor lookups (15-minute TTL)
Lazy Loading: Frontend paginated results (20 invoices per page)
CDN: Serve renamed PDFs via Cloud CDN for faster downloads

7.3 Monitoring

Cloud Monitoring: Track Vertex AI API latency, error rates
Custom Metrics: Fraud alert rate, match success rate
Alerts: Slack/PagerDuty for critical errors


8. Development Workflow
Phase 1: Foundation (Weeks 1-2)

Set up Firebase project (Auth, Firestore, Functions, Storage)
Configure Vertex AI API access
Build basic PDF upload + storage

Phase 2: Tier 1 MVP (Weeks 3-4)

Vertex AI extraction for Tier 1 fields
CSV parser
Matching algorithm
PDF renaming

Phase 3: Tier 2 Features (Weeks 5-6)

Payment terms parser
Date calculation logic
CSV export functionality

Phase 4: Tier 3 Security (Weeks 7-9)

Bank account extraction
Firestore trusted vendor system
Fraud detection engine
Alert notification system

Phase 5: Frontend & UX (Weeks 10-11)

Dashboard components for all tiers
Fraud alert management UI
Trusted vendor CRUD interface

Phase 6: Testing & Launch (Weeks 12-13)

Unit tests (Jest)
Integration tests with Vertex AI
E2E tests (Cypress)
Beta user testing
Production deployment


9. Success Metrics (KPIs)
Technical Metrics

Extraction Accuracy: >95% for required fields
Match Rate (Tier 1): >85% auto-match success
Processing Time: <30 seconds per invoice
Fraud Detection Rate: Catch >98% of account changes

Business Metrics

User Adoption: 70% of users upgrade from Tier 1 to Tier 2 within 3 months
Churn Rate: <5% monthly
Support Tickets: <2% of invoices require manual intervention