# Data Enrichment & Import

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=false} -->

<!-- code_chunk_output -->

- [Overview](#overview)
- [Problem Context](#problem-context)
- [Architecture](#architecture)
  - [Data Flow](#data-flow)
  - [Key Components](#key-components)
- [Implementation Details](#implementation-details)
  - [1. Understanding Multi-Line CSV Fields](#1-understanding-multi-line-csv-fields)
  - [2. Country Extraction & Inference](#2-country-extraction--inference)
  - [3. Google Geocoding API Usage](#3-google-geocoding-api-usage)
  - [4. Swedish Postal Code Format](#4-swedish-postal-code-format)
  - [5. Edge Case Patterns](#5-edge-case-patterns)
  - [6. Decimal-Formatted Postal Codes](#6-decimal-formatted-postal-codes)
  - [7. Database Import with Validation](#7-database-import-with-validation)
  - [8. Fixing Database Decimal Postal Codes](#8-fixing-database-decimal-postal-codes)
- [Results & Metrics](#results--metrics)
- [Key Lessons Learned](#key-lessons-learned)
  - [1. Data Type Handling](#1-data-type-handling)
  - [2. API Integration](#2-api-integration)
  - [3. Country-Specific Formats](#3-country-specific-formats)
  - [4. Error Recovery](#4-error-recovery)
  - [5. Database Operations](#5-database-operations)
  - [6. Code Organization](#6-code-organization)
- [Reusable Patterns](#reusable-patterns)
  - [Pattern 1: Multi-Stage Enrichment](#pattern-1-multi-stage-enrichment)
  - [Pattern 2: Defensive CSV Reading](#pattern-2-defensive-csv-reading)
  - [Pattern 3: Safe Database Import](#pattern-3-safe-database-import)
  - [Pattern 4: Progressive Fix Strategy](#pattern-4-progressive-fix-strategy)
- [Tools & Libraries](#tools--libraries)
- [Future Improvements](#future-improvements)
- [Appendix: Common Postal Code Formats](#appendix-common-postal-code-formats)

<!-- /code_chunk_output -->

## Overview

This document describes a complete workflow for enriching incomplete address data using rule-based parsing and Google Geocoding API, then importing it into a PostgreSQL database. The process handles common data quality issues including multi-line CSV fields, decimal-formatted postal codes, and country-specific address formats.

## Problem Context

**Initial State:**

- CSV export with incomplete address fields (missing city, postal code, or country)
- Addresses from multiple European countries with different formatting conventions
- Need to enrich data before database import

**Goal:**

- Parse and enrich all address records
- Import into normalized database structure
- Maintain data quality and traceability

## Architecture

### Data Flow

```
Raw CSV → Parse Missing Fields → Rule-Based Enrichment → API Enrichment → Fix Edge Cases → Database Import
```

### Key Components

1. **Rule-Based Enrichment**: Extract country from address strings, infer country from postal code patterns
2. **Google Geocoding API**: Fill missing fields when rules insufficient
3. **Pattern-Based Fixes**: Handle country-specific postal code formats
4. **Database Import**: Validate and insert into PostgreSQL

## Implementation Details

### 1. Understanding Multi-Line CSV Fields

**Issue Discovered:**

- CSV files with quoted fields containing newlines cause line count discrepancies
- Physical line count ≠ logical record count

**Example:**

```csv
3274,"Skischule & Skiverleih Snowsports Mayrhofen
SSM GmbH",info@example.com,...
```

This is **one record** across **two physical lines**.

**Solution:**

```python
df = pd.read_csv(csv_file, quoting=1)  # QUOTE_ALL mode handles embedded newlines
```

**Lesson:** Always use `quoting=1` (QUOTE_ALL) when reading CSV exports that may contain multi-line fields.

### 2. Country Extraction & Inference

**Strategy:**

```python
# Pattern 1: Extract from address string
COUNTRY_PATTERNS = [
    ("Deutschland", ["Deutschland"]),
    ("Schweiz", ["Schweiz", "Svizzera"]),
    ("Österreich", ["Österreich", "Osterreich"]),
    # ...
]

# Pattern 2: Infer from postal code (only unambiguous cases)
def infer_country_from_plz(plz: str) -> Optional[str]:
    if not plz or len(plz) != 5:
        return None
    # German PLZ: 5 digits (0-9)
    if plz.isdigit() and len(plz) == 5:
        return "Deutschland"
    # 4-digit: Ambiguous (Austria OR Switzerland) - return None
    return None
```

**Lesson:** Only infer when patterns are **unambiguous**. 4-digit postal codes could be Austria or Switzerland - don't guess.

### 3. Google Geocoding API Usage

**Approach:**

```python
def geocode_address(address: str, plz: str = None, stadt: str = None) -> Dict:
    # Build query from available components
    query_parts = []
    if stadt: query_parts.append(str(stadt))
    if plz: query_parts.append(str(plz))
    if address: query_parts.append(str(address))

    query = ", ".join(query_parts)

    response = requests.get(
        "https://maps.googleapis.com/maps/api/geocode/json",
        params={"address": query, "key": API_KEY},
        timeout=10
    )

    # Extract components from result
    # Rate limit: 50 req/sec, use time.sleep(0.05) for safety
```

**Critical Discovery:**
API can return `status: "OK"` but with `postal_code: null`. Don't mark as "success" unless **all required fields** are populated.

**Lesson:** Verify API response contains actual data, not just success status.

### 4. Swedish Postal Code Format

**Issue Discovered:**
Swedish postal codes have a **space** in the middle: `"151 38"`, `"644 30"`

**Problem:**
Original parser didn't handle spaces, so postal codes ended up in the `stadt` (city) field.

**Fix Strategy:**

```python
# Pattern: 3 digits + space + 2 digits
swedish_plz_pattern = re.compile(r'^(\d{3}\s\d{2})\s+(.+)$')

match = swedish_plz_pattern.match(parsed_stadt)
if match:
    plz = match.group(1)      # "151 38"
    city = match.group(2)     # "Södertälje"
```

**Coverage:** Fixed 290 of 302 missing records (96%).

**Lesson:** Research country-specific postal code formats before parsing. Sweden, Canada, UK all use spaces.

### 5. Edge Case Patterns

**Discovered Patterns:**

| Pattern | Example | Fix |
|---------|---------|-----|
| Complex Swedish | `"Stortorget 3, 231 43 Trelleborg"` in stadt | Extract street, PLZ, city separately |
| German no-space | `"44265Dortmund"` | Regex: `(\d{5})([A-Z].+)` |
| German 6-digit typo | `"277833Ottersweier"` | Take first 5 digits |
| Austrian AT prefix | `"AT4822"` | Strip "AT" prefix |
| Swedish in strasse | `"911 91 Vännäs"` in street field | Move to PLZ + city |

**Implementation:**

```python
# Pattern library approach
patterns = {
    'swedish_complex': re.compile(r'^(.+?),?\s*(\d{3}\s\d{2})\s+(.+)$'),
    'german_no_space': re.compile(r'^(\d{5})([A-ZÄÖÜ][a-zäöüß]+.*)$'),
    'german_6digit': re.compile(r'^(\d{6})(.+)$'),
    # ...
}

# Apply patterns in order of specificity
for pattern_name, pattern in patterns.items():
    match = pattern.match(field)
    if match:
        apply_fix(match)
        break
```

**Lesson:** Build a pattern library. Test each pattern independently. Apply from most specific to most general.

### 6. Decimal-Formatted Postal Codes

**Issue:**
Pandas reads postal codes as floats when mixed with NaN values, resulting in `"54497.0"` instead of `"54497"`.

**First Attempt (Failed):**

```python
df['parsed_plz'] = df['parsed_plz'].apply(
    lambda x: str(int(float(x))) if pd.notna(x) else None
)
```

**Problem:** Swedish postal codes like `"151 38"` contain spaces → `float("151 38")` raises `ValueError`.

**Correct Solution:**

```python
def fix_plz(x):
    if pd.isna(x):
        return None
    x_str = str(x).strip()

    # If contains space (Swedish PLZ), keep as-is
    if ' ' in x_str:
        return x_str

    # Otherwise convert float to int string
    try:
        return str(int(float(x_str)))
    except ValueError:
        return x_str  # Keep original if conversion fails

df['parsed_plz'] = df['parsed_plz'].apply(fix_plz)
```

**Lesson:** Check for special cases (spaces, letters) before numeric conversion.

### 7. Database Import with Validation

**Strategy:**

```python
# 1. Load and fix data types
df = pd.read_csv(csv_file, quoting=1)
df['parsed_plz'] = df['parsed_plz'].apply(fix_plz)

# 2. Validate required fields
for idx, row in df.iterrows():
    strasse = str(row["parsed_strasse"]).strip() if pd.notna(row["parsed_strasse"]) else None
    stadt = str(row["parsed_stadt"]).strip() if pd.notna(row["parsed_stadt"]) else None
    plz = str(row["parsed_plz"]).strip() if pd.notna(row["parsed_plz"]) else None
    land = str(row["parsed_land"]).strip() if pd.notna(row["parsed_land"]) else None

    # Handle missing street (use placeholder)
    if not strasse or strasse == 'nan':
        strasse = '-'

    # Stadt, PLZ, Land are required
    if not all([stadt, plz, land]):
        log_error(idx, missing_fields)
        continue

    # 3. Insert into database
    execute_insert(unternehmen_id, strasse, stadt, plz, land)
```

**Lesson:**

- Street can be optional (use placeholder)
- City, postal code, country are critical
- Always validate before INSERT

### 8. Fixing Database Decimal Postal Codes

**Issue:** After import, some postal codes still had decimals in database.

**Solution Using PostgreSQL Transaction:**

```sql
BEGIN;

-- Preview changes
SELECT
    id,
    plz as old_plz,
    SPLIT_PART(plz, '.', 1) as new_plz
FROM public.adresse
WHERE plz LIKE '%.%'
LIMIT 10;

-- Execute update
UPDATE public.adresse
SET plz = SPLIT_PART(plz, '.', 1)
WHERE plz LIKE '%.%';

-- Verify (should return 0)
SELECT COUNT(*) FROM public.adresse WHERE plz LIKE '%.%';

-- If OK: COMMIT; If problems: ROLLBACK;
```

**Lesson:**

- Always use transactions for bulk updates
- Preview before executing
- Verify after executing
- Keep ROLLBACK option available

## Results & Metrics

**Final Statistics:**

- Total records: 1,273
- Successfully enriched: 1,269 (99.7%)
- Rule-based: 386 (30%)
- API-based: 884 (70%)
- Failed (invalid addresses): 4 (0.3%)

**Enrichment Coverage:**

- Swedish postal code fixes: 290 records
- Pattern-based fixes: 8 records
- Successfully imported: 1,255 records (98.6%)

## Key Lessons Learned

### 1. Data Type Handling

- CSV exports can have multi-line fields → use `quoting=1`
- Mixed data types cause pandas to use float → fix before string operations
- Always check for edge cases (spaces, special chars) before numeric conversion

### 2. API Integration

- Don't trust API "success" status alone
- Verify response contains actual data
- Implement conservative rate limiting (0.05-0.1s between calls)
- Build fallback strategies for API failures

### 3. Country-Specific Formats

- Research postal code formats before parsing
- Sweden: `XXX XX` (with space)
- Germany: `XXXXX` (5 digits, no space)
- Austria: `XXXX` (4 digits)
- Switzerland: `XXXX` (4 digits)
- Don't infer country from ambiguous patterns

### 4. Error Recovery

- Separate records by fix-ability: auto-fixable vs. manual review required
- Generate detailed error reports with context
- Provide manual review CSV for edge cases
- Track enrichment method for debugging

### 5. Database Operations

- Use transactions for all bulk updates
- Preview changes before execution
- Always maintain ROLLBACK option
- Verify results with COUNT queries

### 6. Code Organization

- Build pattern libraries for reuse
- Separate concerns: parse → enrich → fix → import
- Create intermediate CSV files for inspection
- Log every decision for traceability

## Reusable Patterns

### Pattern 1: Multi-Stage Enrichment

```python
def enrich_address(row):
    # Stage 1: Rule-based extraction
    if missing_country:
        country = extract_from_address(row['address'])

    # Stage 2: Inference from patterns
    if not country and has_postal_code:
        country = infer_from_postal_code(row['plz'])

    # Stage 3: API fallback
    if still_missing_fields:
        api_result = geocode(row['address'])
        apply_api_results(api_result)

    return row
```

### Pattern 2: Defensive CSV Reading

```python
df = pd.read_csv(
    csv_file,
    quoting=1,              # Handle multi-line fields
    encoding='utf-8',       # Explicit encoding
    dtype={'plz': str}      # Force string for postal codes
)
```

### Pattern 3: Safe Database Import

```python
with engine.begin() as conn:
    try:
        conn.execute(insert_query, params)
        success_count += 1
    except Exception as e:
        errors.append({'row': idx, 'error': str(e)})
        error_count += 1
```

### Pattern 4: Progressive Fix Strategy

```python
# 1. Extract unfixable
unfixable = df[df['address'].isin(['invalid', 'incomplete'])]

# 2. Apply pattern fixes
fixable = df[~df.index.isin(unfixable.index)]
for pattern in patterns:
    fixable = apply_pattern(fixable, pattern)

# 3. API for remaining
still_missing = fixable[fixable['plz'].isna()]
for idx, row in still_missing.iterrows():
    api_enrich(row)

# 4. Manual review remainder
manual = still_missing[still_missing['plz'].isna()]
```

## Tools & Libraries

- **pandas**: CSV handling, data manipulation
- **SQLAlchemy**: Database connections, safe parameterized queries
- **requests**: Google Geocoding API calls
- **re**: Regex pattern matching for postal codes
- **PostgreSQL 17**: Database with transaction support

## Future Improvements

1. **Caching**: Store API responses to reduce duplicate calls
2. **Batch Processing**: Group addresses by country for optimized API usage
3. **Validation Rules**: Add country-specific postal code format validation
4. **Fuzzy Matching**: Use Levenshtein distance for city name matching
5. **Automated Testing**: Build test suite with known address formats
6. **Monitoring**: Track API quota usage and success rates

## Appendix: Common Postal Code Formats

| Country | Format | Example | Notes |
|---------|--------|---------|-------|
| Germany | `XXXXX` | `54497` | 5 digits, no space |
| Austria | `XXXX` | `1230` | 4 digits |
| Switzerland | `XXXX` | `8700` | 4 digits |
| Sweden | `XXX XX` | `151 38` | Space required |
| Belgium | `XXXX` | `1083` | 4 digits |
| Netherlands | `XXXX XX` | `1012 AB` | Space + letters |
| Italy | `XXXXX` | `39100` | 5 digits |
| France | `XXXXX` | `75001` | 5 digits |
