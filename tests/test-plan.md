# Comprehensive Test Plan - Finance Tracking App

## Test Execution Date: [Current Date]
## Test Environment: Development/Staging
## Tested By: [Tester Name]

---

## 1. ONBOARDING FLOW (CRITICAL)

### 1.1 EssentialsStep - Numeric Input Validation
- [ ] **Test Case**: Enter monthly income with commas (e.g., "1,234")
  - **Expected**: Input accepts and formats correctly
  - **Status**: ___
  - **Notes**: ___

- [ ] **Test Case**: Enter decimal values (e.g., "1234.56")
  - **Expected**: Accepts decimals, formats to 2 decimal places
  - **Status**: ___
  - **Notes**: ___

- [ ] **Test Case**: Try to submit empty fields
  - **Expected**: Form validation prevents submission with helpful message
  - **Status**: ___
  - **Notes**: ___

- [ ] **Test Case**: Enter very large numbers (>1,000,000)
  - **Expected**: Formats correctly with thousand separators
  - **Status**: ___
  - **Notes**: ___

### 1.2 ExpensesStep - File Upload & Manual Entry
- [ ] **Test Case**: Upload a valid PDF bank statement (< 5MB)
  - **Expected**: Upload progresses, OCR processes, extracts transactions
  - **Status**: ___
  - **Processing Time**: ___ seconds
  - **Notes**: ___

- [ ] **Test Case**: Upload a large PDF (> 5MB)
  - **Expected**: Shows size warning, still attempts processing
  - **Status**: ___
  - **Notes**: ___

- [ ] **Test Case**: Upload corrupted/invalid PDF
  - **Expected**: Shows error message, suggests CSV alternative
  - **Status**: ___
  - **Notes**: ___

- [ ] **Test Case**: Add manual expense with all fields
  - **Expected**: Expense saves to database, appears in list
  - **Status**: ___
  - **Notes**: ___

- [ ] **Test Case**: Skip expenses step (no uploads, no manual entry)
  - **Expected**: Can proceed to next step without data
  - **Status**: ___
  - **Notes**: ___

### 1.3 InvestmentsStep - Manual Investment Entry
- [ ] **Test Case**: Add manual investment with symbol (e.g., AAPL)
  - **Expected**: Investment saves, appears in list
  - **Status**: ___
  - **Notes**: ___

- [ ] **Test Case**: Add investment without symbol (e.g., real estate)
  - **Expected**: Accepts without symbol, saves successfully
  - **Status**: ___
  - **Notes**: ___

- [ ] **Test Case**: Skip investments step
  - **Expected**: Can proceed without adding investments
  - **Status**: ___
  - **Notes**: ___

### 1.4 SummaryStep - AI Insights
- [ ] **Test Case**: View AI financial projections
  - **Expected**: Shows projections based on entered data, no "GPT-4o" mention
  - **Status**: ___
  - **Notes**: ___

- [ ] **Test Case**: Complete onboarding
  - **Expected**: User profile updated, redirected to dashboard
  - **Status**: ___
  - **Notes**: ___

---

## 2. DASHBOARD - DATA ACCURACY (CRITICAL)

### 2.1 Real Data Display
- [ ] **Test Case**: Verify Finance Score calculation
  - **Expected**: Score reflects actual user data (income, expenses, goals)
  - **Current Score**: ___
  - **Manual Calculation**: ___
  - **Status**: ___

- [ ] **Test Case**: Check Balance Card accounts
  - **Expected**: Shows real investments and cash, no fake "Premium Plus"
  - **Status**: ___
  - **Notes**: ___

- [ ] **Test Case**: Verify Monthly Income stat
  - **Expected**: Matches user_profiles.monthly_income
  - **DB Value**: ___
  - **Displayed Value**: ___
  - **Status**: ___

- [ ] **Test Case**: Verify Monthly Expenses stat
  - **Expected**: Sum of current month expenses from database
  - **DB Sum**: ___
  - **Displayed Value**: ___
  - **Status**: ___

- [ ] **Test Case**: Check Cashflow Chart (last 7 days)
  - **Expected**: Shows actual daily income/expenses, not hardcoded data
  - **Status**: ___
  - **Notes**: ___

- [ ] **Test Case**: Verify Saving Plans
  - **Expected**: Shows only user's actual savings goals, or empty state
  - **Status**: ___
  - **Notes**: ___

### 2.2 Empty States
- [ ] **Test Case**: View dashboard with no expenses
  - **Expected**: Shows empty state for expense-related sections
  - **Status**: ___
  - **Notes**: ___

- [ ] **Test Case**: View dashboard with no investments
  - **Expected**: Shows empty state for investment sections
  - **Status**: ___
  - **Notes**: ___

- [ ] **Test Case**: View dashboard with no goals
  - **Expected**: Shows empty state or prompt to add goals
  - **Status**: ___
  - **Notes**: ___

---

## 3. UX CORE (HIGH PRIORITY)

### 3.1 Pre-populated Values
- [ ] **Test Case**: Complete fresh onboarding
  - **Expected**: NO fake pre-filled values (all start at 0)
  - **Status**: ___
  - **Notes**: ___

- [ ] **Test Case**: Check Savings Goal Card on empty profile
  - **Expected**: Shows empty state, not fake $8,000 emergency fund
  - **Status**: ___
  - **Notes**: ___

### 3.2 PDF Upload Timeout
- [ ] **Test Case**: Upload 10-page PDF
  - **Expected**: Completes within 3 minutes, shows progress
  - **Processing Time**: ___ seconds
  - **Status**: ___

- [ ] **Test Case**: Upload 50-page PDF
  - **Expected**: OCR timeout at 2 min, shows helpful error
  - **Processing Time**: ___ seconds
  - **Status**: ___
  - **Error Message**: ___

- [ ] **Test Case**: Monitor OCR progress
  - **Expected**: Toast/progress updates every 10-20%
  - **Status**: ___
  - **Notes**: ___

### 3.3 Mobile Bottom Truncation
- [ ] **Test Case**: View Transactions page on mobile
  - **Expected**: All content visible, no truncation by bottom nav
  - **Device**: ___
  - **Status**: ___

- [ ] **Test Case**: View Settings page on mobile
  - **Expected**: All content visible with proper padding
  - **Device**: ___
  - **Status**: ___

- [ ] **Test Case**: View Investments page on mobile
  - **Expected**: Last item fully visible, safe area respected
  - **Device**: ___
  - **Status**: ___

- [ ] **Test Case**: Test on iPhone with notch
  - **Expected**: iOS safe areas properly handled
  - **Device**: ___
  - **Status**: ___

---

## 4. SECONDARY FEATURES (POLISH)

### 4.1 Gamification System
- [ ] **Test Case**: Add first expense
  - **Expected**: +10 points, "First Transaction" achievement unlocked
  - **Status**: ___
  - **Notes**: ___

- [ ] **Test Case**: Add first investment
  - **Expected**: +20 points, "First Investment" achievement unlocked
  - **Status**: ___
  - **Notes**: ___

- [ ] **Test Case**: Complete onboarding
  - **Expected**: +50 points, "Onboarding Complete" achievement
  - **Status**: ___
  - **Notes**: ___

- [ ] **Test Case**: View gamification in Settings > Progress tab
  - **Expected**: Shows current level, points, streak, achievements
  - **Status**: ___
  - **Notes**: ___

- [ ] **Test Case**: Reach 10 transactions
  - **Expected**: "10 Transactions" achievement unlocked
  - **Status**: ___
  - **Notes**: ___

- [ ] **Test Case**: Level up (reach 100 points)
  - **Expected**: Toast notification "🎉 Level Up!", level increments
  - **Status**: ___
  - **Notes**: ___

### 4.2 Notifications
- [ ] **Test Case**: Check notification bell in top bar
  - **Expected**: Shows unread count badge
  - **Status**: ___
  - **Unread Count**: ___

- [ ] **Test Case**: View notification list
  - **Expected**: Shows all notifications with timestamps
  - **Status**: ___
  - **Notes**: ___

- [ ] **Test Case**: Mark single notification as read
  - **Expected**: Badge decrements, notification style changes
  - **Status**: ___
  - **Notes**: ___

- [ ] **Test Case**: Mark all as read
  - **Expected**: Badge disappears, all notifications marked
  - **Status**: ___
  - **Notes**: ___

- [ ] **Test Case**: Delete notification
  - **Expected**: Notification removed from list
  - **Status**: ___
  - **Notes**: ___

### 4.3 Export Features
- [ ] **Test Case**: Export to CSV from Dashboard
  - **Expected**: Downloads CSV with all user data
  - **Status**: ___
  - **Notes**: ___

- [ ] **Test Case**: Export to PDF from Dashboard
  - **Expected**: Generates PDF report with summary
  - **Status**: ___
  - **Notes**: ___

- [ ] **Test Case**: Export from Settings
  - **Expected**: Exports all data successfully
  - **Status**: ___
  - **Notes**: ___

---

## 5. PERFORMANCE & RELIABILITY

### 5.1 Loading States
- [ ] **Test Case**: Dashboard initial load
  - **Expected**: Shows LoadingDashboard skeleton
  - **Load Time**: ___ ms
  - **Status**: ___

- [ ] **Test Case**: Slow network simulation (3G)
  - **Expected**: Loading indicators appear, no crashes
  - **Status**: ___
  - **Notes**: ___

### 5.2 Error Handling
- [ ] **Test Case**: Disconnect internet, try to add expense
  - **Expected**: Shows offline error message
  - **Status**: ___
  - **Notes**: ___

- [ ] **Test Case**: Corrupt database query
  - **Expected**: Shows user-friendly error, doesn't crash
  - **Status**: ___
  - **Notes**: ___

### 5.3 Database Integrity
- [ ] **Test Case**: Check RLS policies for expenses
  - **Expected**: User can only see their own expenses
  - **Status**: ___
  - **Notes**: ___

- [ ] **Test Case**: Check RLS policies for investments
  - **Expected**: User can only see their own investments
  - **Status**: ___
  - **Notes**: ___

- [ ] **Test Case**: Check RLS policies for goals
  - **Expected**: User can only see their own goals
  - **Status**: ___
  - **Notes**: ___

---

## 6. AUTHENTICATION & SECURITY

### 6.1 Login/Logout
- [ ] **Test Case**: Login with valid credentials
  - **Expected**: Redirects to dashboard/onboarding
  - **Status**: ___
  - **Notes**: ___

- [ ] **Test Case**: Logout from Settings
  - **Expected**: Clears session, redirects to /auth
  - **Status**: ___
  - **Notes**: ___

- [ ] **Test Case**: Try to access protected route when logged out
  - **Expected**: Redirects to /auth
  - **Status**: ___
  - **Notes**: ___

### 6.2 Session Management
- [ ] **Test Case**: Refresh page while logged in
  - **Expected**: Session persists, stays logged in
  - **Status**: ___
  - **Notes**: ___

- [ ] **Test Case**: Open app in new tab
  - **Expected**: Session shared across tabs
  - **Status**: ___
  - **Notes**: ___

---

## 7. CROSS-BROWSER & DEVICE TESTING

### 7.1 Desktop Browsers
- [ ] **Chrome** (Latest)
  - **Status**: ___
  - **Issues**: ___

- [ ] **Firefox** (Latest)
  - **Status**: ___
  - **Issues**: ___

- [ ] **Safari** (Latest)
  - **Status**: ___
  - **Issues**: ___

- [ ] **Edge** (Latest)
  - **Status**: ___
  - **Issues**: ___

### 7.2 Mobile Devices
- [ ] **iOS Safari** (iPhone)
  - **Device**: ___
  - **Status**: ___
  - **Issues**: ___

- [ ] **Android Chrome**
  - **Device**: ___
  - **Status**: ___
  - **Issues**: ___

- [ ] **Tablet** (iPad/Android)
  - **Device**: ___
  - **Status**: ___
  - **Issues**: ___

---

## 8. REGRESSION TESTING

### 8.1 Previously Fixed Issues
- [ ] **Test Case**: Verify Problem 1 fix (EssentialsStep numeric inputs)
  - **Status**: ___

- [ ] **Test Case**: Verify Problem 2 fix (ExpensesStep upload crash)
  - **Status**: ___

- [ ] **Test Case**: Verify Problem 3 fix (InvestmentsStep non-functional buttons)
  - **Status**: ___

- [ ] **Test Case**: Verify Problem 4 fix (SummaryStep AI timeout)
  - **Status**: ___

- [ ] **Test Case**: Verify Problem 5 fix (Dashboard empty states)
  - **Status**: ___

- [ ] **Test Case**: Verify Problem 6 fix (Dashboard fake data)
  - **Status**: ___

- [ ] **Test Case**: Verify Problem 7 fix (PDF infinite timeout)
  - **Status**: ___

- [ ] **Test Case**: Verify Problem 8 fix (Fake pre-populated values)
  - **Status**: ___

- [ ] **Test Case**: Verify Problem 9 fix (Mobile truncation)
  - **Status**: ___

- [ ] **Test Case**: Verify Problem 10 fix (Secondary features working)
  - **Status**: ___

---

## SUMMARY

### Total Test Cases: ___
### Passed: ___
### Failed: ___
### Blocked: ___
### Not Tested: ___

### Critical Issues Found:
1. ___
2. ___
3. ___

### Recommendations:
1. ___
2. ___
3. ___

### Sign-off:
- **Tester**: _______________  **Date**: _______________
- **Developer**: _______________  **Date**: _______________
- **Product Owner**: _______________  **Date**: _______________
