# Bank Statement Import & Onboarding System

## Overview
Comprehensive PDF bank statement parsing system with AI-powered categorization and robust user onboarding flow.

---

## 🎯 Key Features Implemented

### 1. Enhanced PDF Parsing (`supabase/functions/process-bank-statement-v2/index.ts`)

#### Multi-Method Text Extraction
- **BT/ET Block Parsing**: Extracts text from PDF text operators
- **TJ/Tj Operator Handling**: Captures individual and array-based text strings
- **Fallback Extraction**: Alternative method for complex PDF structures
- **Pattern Detection**: Identifies dates and amounts in raw PDF content

#### Bank Detection
- Two-phase AI analysis
- First call: Identifies bank name from header/first page
- Supports Italian banks (Intesa Sanpaolo, UniCredit, BNL, Poste Italiane, etc.)
- Falls back to "Unknown Bank" for unsupported formats

#### Transaction Extraction
- **Extracts ALL transactions** (no artificial limits)
- Handles multi-page statements
- Normalizes dates to YYYY-MM-DD format
- Properly handles negative (expenses) and positive (income) amounts
- Assigns confidence scores (0.0-1.0) for each categorization

#### Merchant Identification
- Pattern-based merchant recognition
- Known merchant database (supermarkets, gas stations, restaurants, etc.)
- Chain/franchise detection
- Merchant name extraction from descriptions

#### Error Handling
- 3-minute timeout for large PDFs
- File size validation (10MB limit)
- PDF magic byte validation
- Comprehensive error logging
- Graceful fallback mechanisms

---

### 2. Merchant Lookup Service (`src/lib/merchantLookup.ts`)

#### Strategy-Based Lookup
1. **Pattern Matching**: Fast, local matching against known merchants
2. **Chain Detection**: Identifies major franchise/chain merchants
3. **External API Ready**: Infrastructure for future integration with Google Places/Yelp

#### Supported Merchant Categories
- Food & Dining (supermarkets, restaurants, cafés)
- Transportation (gas stations, public transport, ride services)
- Shopping (retail, e-commerce)
- Entertainment (streaming, gaming)
- Healthcare (pharmacies, medical)
- Bills & Utilities (electricity, internet, rent)
- Other (ATM, transfers)

---

### 3. Enhanced UI Components

#### BankStatementUpload Component
**New Features:**
- ✅ Transaction review table with editable fields
- ✅ Confidence badges (green/yellow/red)
- ✅ Delete individual transactions
- ✅ "Show Raw Text" toggle for debugging
- ✅ "Re-parse" button to start over
- ✅ "Upload CSV Instead" fallback option
- ✅ Highlighted low-confidence items
- ✅ Sticky table header for long lists
- ✅ Bank name display

**Visual Indicators:**
- Green badge (≥80% confidence)
- Yellow badge (60-79% confidence)
- Red badge (<60% confidence)

#### PDFParsingHelp Component
**Displayed When:**
- Very few transactions extracted (<3)
- Parsing fails completely
- Partial extraction detected

**Features:**
- Clear explanation of why parsing might fail
- Quick actions (Upload CSV, Report Issue)
- Tips for better results
- Email support integration

---

### 4. Onboarding System

#### OnboardingQuestionnaire (`src/components/OnboardingQuestionnaire.tsx`)
**3-Step Interactive Flow:**

**Step 1: Financial Goal**
- Save money
- Invest in ETFs & Stocks
- Track expenses
- All of the above

**Step 2: Investment Interest**
- Yes, I want to invest
- Learning about it
- Not right now

**Step 3: Monthly Budget**
- €0 - €1,000
- €1,000 - €3,000
- €3,000 - €5,000
- €5,000+

**Features:**
- Progress bar
- Visual step indicators
- Back/Continue navigation
- Radio button UI with descriptions
- Saves to localStorage AND database

#### OnboardingGuide (`src/components/OnboardingGuide.tsx`)
**3-Card Tutorial System:**

**Card 1: Upload Your Bank Statement**
- How to upload PDF
- Multi-page support info
- AI extraction details
- CTA: "Go to Upload"

**Card 2: Review & Approve Transactions**
- Edit categories/amounts
- Check low-confidence items
- Bulk approval process

**Card 3: Manage Your Profile**
- Configure categories
- Set up notifications
- View audit logs
- CTA: "Go to Settings"

**Features:**
- Visual progress dots
- Skip functionality
- Direct navigation to relevant pages
- One-time display (persisted in localStorage)

#### Database Integration
**New Fields in `user_profiles` table:**
- `main_goal` (TEXT)
- `investment_interest` (TEXT)
- `monthly_budget` (TEXT)

**Benefits:**
- Personalized experience based on goals
- Analytics on user preferences
- Future recommendation engine
- No need to re-ask users

---

## 🔧 Technical Implementation

### AI Configuration
**Model:** `google/gemini-2.5-flash` (default, free during Sept 29 - Oct 13, 2025)
**Max Tokens:** 32,000 (supports extracting 50+ transactions)
**Temperature:** 0.1 (deterministic output)

### Security
- Input validation with Zod schemas
- URL validation for file paths
- File size limits enforced
- Magic byte validation for PDFs
- No SQL injection risks (parameterized queries)
- RLS policies enforced on user_profiles

### Performance
- 3-minute timeout for large files
- Background processing with persistent toast
- Progress tracking in localStorage
- Efficient text extraction algorithms
- Minimal AI API calls (2 per document)

---

## 📊 Testing Recommendations

### Test Cases for PDF Parsing

#### ✅ Happy Path
1. Upload 1-page PDF with 10 transactions
2. Upload 3-page PDF with 30 transactions
3. Upload statement with mixed transactions (income + expenses)

#### ⚠️ Edge Cases
1. Scanned/image-based PDF (should fail gracefully)
2. Protected/encrypted PDF (should show error)
3. PDF with unusual formatting
4. Statement with <3 transactions (triggers help)
5. Very large PDF (5+ pages, 50+ transactions)

#### 🔴 Error Scenarios
1. Invalid file type (not PDF)
2. File >10MB
3. Corrupted PDF
4. Empty PDF
5. PDF with no tables

### Test Cases for Onboarding

#### ✅ Complete Flow
1. New user signup → sees questionnaire
2. Complete 3 steps → sees guide
3. Complete guide → redirected to dashboard
4. Answers saved to database

#### ⚠️ Skip Scenarios
1. Skip questionnaire (not allowed - must complete)
2. Skip guide (allowed - saves preference)
3. Return after skipping (doesn't show again)

---

## 🐛 Known Limitations & Future Enhancements

### Current Limitations
1. **OCR Not Implemented**: Image-based PDFs won't work
   - *Recommendation*: Integrate Tesseract.js or cloud OCR API
2. **No External Merchant API**: Only local pattern matching
   - *Recommendation*: Add Google Places API integration
3. **Single AI Model**: Only supports Gemini Flash
   - *Recommendation*: Add model fallback options
4. **No Transaction Deduplication**: May import duplicates
   - *Recommendation*: Check for existing transactions by date/amount

### Future Enhancements
- [ ] OCR support for scanned PDFs
- [ ] External merchant lookup (Google Places/Yelp)
- [ ] Automatic bank detection from IBAN/BIC
- [ ] Transaction deduplication
- [ ] Multi-language support for international banks
- [ ] CSV export of extracted data
- [ ] Learning from user corrections (ML feedback loop)
- [ ] Support for other file formats (OFX, QIF)

---

## 📝 User Flow Diagrams

### New User Journey
```
Registration → Questionnaire (3 steps) → Guide (3 cards) → Dashboard
                    ↓                           ↓
              Saved to DB                Saved to localStorage
```

### PDF Upload Journey
```
Upload PDF → AI Processing → Transaction Review → Approve → Added to Expenses
                ↓                    ↓
          Bank Detection      Low Confidence?
                                     ↓
                              Show Help Panel
                                     ↓
                            CSV Fallback Option
```

---

## 🎨 UI/UX Improvements

### Visual Enhancements
- Glass-morphism card designs
- Gradient text for headings
- Color-coded confidence badges
- Sticky table headers
- Responsive mobile layout
- Toast notifications for feedback
- Loading states with progress bars

### Accessibility
- ARIA labels on interactive elements
- Keyboard navigation support
- Clear error messages
- High contrast mode compatible
- Screen reader friendly

---

## 🔐 Security Considerations

### Data Protection
- User data isolated by RLS policies
- No sensitive data in localStorage (only flags)
- Secure file upload through Supabase Storage
- Temporary signed URLs (5 min expiry)
- No client-side API keys

### Input Validation
- Zod schemas for all user inputs
- File type validation
- Size limits enforced
- SQL injection prevention
- XSS protection

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue**: "No transactions extracted"
**Solution**: 
1. Check if PDF is text-based (not scanned)
2. Try CSV export from bank instead
3. Report issue with PDF sample

**Issue**: "Only 2/30 transactions extracted"
**Solution**:
1. Click "Re-parse" to try again
2. Check "Show Raw Text" for debugging
3. Use CSV fallback option
4. Contact support with PDF

**Issue**: "Processing timeout"
**Solution**:
1. Try smaller date range
2. Split multi-month statement
3. Check file size (<10MB)

### Admin Logs
All processing errors logged to:
- Supabase Edge Function logs
- Client console (for debugging)
- Toast notifications (user-facing)

---

## 📚 Developer Notes

### Code Organization
```
src/
├── components/
│   ├── BankStatementUpload.tsx      # Main upload UI
│   ├── PDFParsingHelp.tsx           # Error help component
│   ├── OnboardingQuestionnaire.tsx  # 3-step questionnaire
│   └── OnboardingGuide.tsx          # 3-card tutorial
├── lib/
│   └── merchantLookup.ts            # Merchant identification
├── contexts/
│   └── UploadContext.tsx            # Upload state management
└── pages/
    ├── Index.tsx                    # Onboarding entry point
    └── Upload.tsx                   # Upload page

supabase/functions/
└── process-bank-statement-v2/
    └── index.ts                     # PDF parsing edge function
```

### Key Dependencies
- `zod`: Input validation
- `lucide-react`: Icon library
- `@supabase/supabase-js`: Backend integration
- `sonner`: Toast notifications

---

## ✅ Checklist for Production

- [x] PDF parsing handles multi-page documents
- [x] Bank detection implemented
- [x] Transaction categorization with confidence
- [x] User can edit all fields before confirming
- [x] Fallback to CSV upload available
- [x] Error messages are user-friendly
- [x] Onboarding questionnaire implemented
- [x] 3-card tutorial guide created
- [x] Answers saved to database
- [x] Security linter issues resolved
- [ ] OCR support (future)
- [ ] External merchant API (future)
- [ ] Comprehensive E2E tests (recommended)

---

## 🎯 Success Metrics

### Target Performance
- **Extraction Rate**: >95% of transactions from text-based PDFs
- **Categorization Accuracy**: >85% correct categories
- **User Completion**: >80% complete full onboarding flow
- **CSV Fallback Usage**: <10% (indicates good PDF parsing)

### Monitoring
- Track extraction success rates
- Monitor low-confidence transaction %
- Analyze onboarding completion rates
- Collect user feedback on accuracy

---

*Last Updated: October 2025*
*Version: 2.0*
