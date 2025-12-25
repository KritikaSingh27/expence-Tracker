# Requirements Document

## Introduction

Enhancement of the expense tracker frontend to add missing functionality for expense creation, improve category display, and fix period toggle behavior while maintaining the existing UI design and theme.

## Glossary

- **Expense_Form**: Modal form component for creating new expenses
- **Category_Totals**: Display of spending amounts grouped by category
- **Period_Toggle**: Weekly/Monthly view switcher
- **Add_Button**: Floating action button to open expense creation form
- **Frontend**: React-based user interface

## Requirements

### Requirement 1: Category Totals Display

**User Story:** As a user, I want to see category-wise spending totals in the overview section, so that I can understand where my money is going.

#### Acceptance Criteria

1. WHEN the overview tab is active, THE Frontend SHALL display category totals with amounts
2. WHEN category data is available, THE Frontend SHALL show each category name with its total spending
3. WHEN no category data exists, THE Frontend SHALL display "No category data yet" message
4. THE Frontend SHALL maintain the existing overview layout and styling
5. THE Frontend SHALL format amounts in Indian Rupees (₹) with 2 decimal places

### Requirement 2: Expense Creation Form

**User Story:** As a user, I want to add new expenses through the frontend interface, so that I don't need to use backend tools.

#### Acceptance Criteria

1. THE Frontend SHALL display a floating "+" button for adding expenses
2. WHEN the "+" button is clicked, THE Frontend SHALL open a modal form
3. THE Expense_Form SHALL include fields for amount, description, date, and category
4. WHEN the form is submitted with valid data, THE Frontend SHALL create a new expense via API
5. WHEN expense creation succeeds, THE Frontend SHALL close the modal and refresh the expense list
6. WHEN expense creation fails, THE Frontend SHALL display an error message
7. THE Expense_Form SHALL match the existing UI theme and styling
8. THE Frontend SHALL validate required fields before submission

### Requirement 3: Period Toggle Fix

**User Story:** As a user, I want the weekly/monthly toggle to show correct period data, so that I can view accurate summaries for each time period.

#### Acceptance Criteria

1. WHEN "Weekly" is selected, THE Frontend SHALL display weekly summary data
2. WHEN "Monthly" is selected, THE Frontend SHALL display monthly summary data
3. THE Frontend SHALL send the correct period parameter to API endpoints
4. THE Frontend SHALL update all summary displays when period changes
5. THE Frontend SHALL maintain existing toggle button styling and behavior