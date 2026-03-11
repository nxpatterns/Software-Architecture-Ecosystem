# Address Data Enrichment with Geocoding APIs

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=false} -->

<!-- code_chunk_output -->

- [Problem Statement](#problem-statement)
- [Solution Overview](#solution-overview)
- [Tier 1: Rule-Based Extraction](#tier-1-rule-based-extraction)
- [Tier 2: Pattern-Based Inference](#tier-2-pattern-based-inference)
- [Tier 3: Geocoding API](#tier-3-geocoding-api)
  - [API Choice Comparison](#api-choice-comparison)
  - [Implementation](#implementation)
  - [Rate Limiting](#rate-limiting)
- [Country Name Standardization](#country-name-standardization)
- [Common Pitfalls & Solutions](#common-pitfalls--solutions)
  - [1. CSV Parsing Issues](#1-csv-parsing-issues)
  - [2. DataFrame Type Conflicts](#2-dataframe-type-conflicts)
  - [3. NaN Handling in String Operations](#3-nan-handling-in-string-operations)
  - [4. Environment Variables in Containers](#4-environment-variables-in-containers)
- [Workflow for Large Datasets](#workflow-for-large-datasets)
- [Performance Metrics (Example)](#performance-metrics-example)
- [Cost Estimation](#cost-estimation)
- [Best Practices](#best-practices)
- [Security Notes](#security-notes)
- [Alternative Approaches](#alternative-approaches)

<!-- /code_chunk_output -->

## Problem Statement

When importing address data from external sources (web scraping, user input, legacy databases), address fields are often incomplete or inconsistent:

- Missing country names
- Missing cities (especially when only postal codes are present)
- Country names in various languages (Sverige, Svizzera, Belgique)
- Inconsistent formatting across records

**Goal:** Programmatically enrich incomplete address data to ensure all records have complete, standardized address components before database import.

## Solution Overview

Use a **multi-tiered enrichment strategy** to minimize API costs while maximizing data quality:

1. **Rule-based extraction** (free, fast)
2. **Pattern inference** (free, fast, limited scope)
3. **Geocoding API** (paid, accurate, fallback only)

## Tier 1: Rule-Based Extraction

Extract country information directly from existing address strings using keyword matching.

```python
COUNTRY_PATTERNS = [
    ('Germany', ['Deutschland', 'Germany']),
    ('Austria', ['Österreich', 'Osterreich', 'Austria']),
    ('Switzerland', ['Schweiz', 'Svizzera', 'Switzerland']),
    ('Sweden', ['Sverige', 'Sweden']),
    ('Belgium', ['Belgien', 'Belgique', 'Belgium']),
]

def extract_country_from_address(address: str) -> Optional[str]:
    """Extract country from address string via keyword matching"""
    if not address or pd.isna(address):
        return None

    address_upper = address.upper()

    for target_country, patterns in COUNTRY_PATTERNS:
        for pattern in patterns:
            if pattern.upper() in address_upper:
                return target_country

    return None
```

**Result:** Handles ~30-40% of missing countries at zero cost.

## Tier 2: Pattern-Based Inference

Infer country from postal code patterns **only for unambiguous cases**.

```python
def infer_country_from_plz(plz: str) -> Optional[str]:
    """Infer country from postal code - unambiguous cases only"""
    if not plz or pd.isna(plz):
        return None

    plz_clean = str(plz).strip()

    if not plz_clean.isdigit():
        return None

    length = len(plz_clean)

    # Only handle cases with high confidence
    if length == 5:
        return 'Germany'  # German postal codes are always 5 digits

    # DO NOT infer for ambiguous patterns:
    # 4 digits: could be Austria OR Switzerland
    # 6 digits: could be Netherlands OR formatted Swedish code

    return None
```

**Critical Rule:** Never guess. Only infer when pattern uniquely identifies a country.

**Result:** Handles ~10-15% more records with zero cost.

## Tier 3: Geocoding API

Use Google Geocoding API as fallback for remaining incomplete records.

### API Choice Comparison

| Provider | Free Tier | Paid Cost | Accuracy | Terms |
|----------|-----------|-----------|----------|-------|
| Google Geocoding | $200/month (~40k requests) | $5/1000 after free tier | 95-98% | Cannot store permanently |
| Nominatim (OSM) | Free | Free | 70-85% | 1 req/sec, must cache |
| HERE | 250k/month | $1/1000 | 90-95% | No storage |

**Recommendation:** Google for one-time imports (high accuracy, free tier sufficient for <40k records). Nominatim for ongoing operations.

### Implementation

```python
import requests

GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json"
API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

def geocode_address(address: str, plz: str = None, stadt: str = None) -> Dict:
    """Call Google Geocoding API with available address components"""

    # Build query from available parts
    query_parts = []

    if stadt and not pd.isna(stadt):
        query_parts.append(str(stadt))
    if plz and not pd.isna(plz):
        query_parts.append(str(plz))
    if address and not pd.isna(address):
        query_parts.append(str(address))

    if not query_parts:
        return {'success': False, 'error': 'no_valid_address_parts'}

    query = ", ".join(query_parts)

    params = {
        'address': query,
        'key': API_KEY
    }

    try:
        response = requests.get(GEOCODING_URL, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if data['status'] == 'OK' and len(data['results']) > 0:
            result = data['results'][0]
            components = result['address_components']

            # Extract standardized components
            country = None
            city = None
            postal_code = None

            for component in components:
                types = component['types']
                if 'country' in types:
                    country = component['long_name']
                elif 'locality' in types or 'postal_town' in types:
                    city = component['long_name']
                elif 'postal_code' in types:
                    postal_code = component['long_name']

            return {
                'success': True,
                'country': country,
                'city': city,
                'postal_code': postal_code
            }
        else:
            return {'success': False, 'error': data.get('status', 'UNKNOWN')}

    except Exception as e:
        return {'success': False, 'error': str(e)}
```

### Rate Limiting

Google allows 50 requests/second. For batch processing, add conservative delay:

```python
if needs_api_call:
    result = geocode_address(...)
    time.sleep(0.05)  # 20 req/sec = conservative
```

## Country Name Standardization

Geocoding APIs return country names in English. Translate to target language:

```python
COUNTRY_TRANSLATIONS = {
    'Austria': 'Österreich',
    'Germany': 'Deutschland',
    'Switzerland': 'Schweiz',
    'Sweden': 'Schweden',
    'Belgium': 'Belgien',
    'Italy': 'Italien',
    'France': 'Frankreich',
    'Netherlands': 'Niederlande',
}

# Apply after API call
if result['country']:
    standardized = COUNTRY_TRANSLATIONS.get(result['country'], result['country'])
```

## Common Pitfalls & Solutions

### 1. CSV Parsing Issues

**Problem:** CSV contains multi-line fields (company names with newlines). Default pandas parsing treats these as separate rows.

**Solution:**

```python
# Force quote-aware parsing
df = pd.read_csv(filename, quoting=1)  # csv.QUOTE_ALL
```

### 2. DataFrame Type Conflicts

**Problem:** `df.iloc[idx] = row` causes `FutureWarning` when assigning string values to float columns.

**Solution:**

```python
# DON'T: Overwrite entire row
df.iloc[idx] = enriched_row

# DO: Update only specific columns
df.at[idx, 'country'] = enriched_row['country']
df.at[idx, 'city'] = enriched_row['city']
```

### 3. NaN Handling in String Operations

**Problem:** `", ".join([city, plz])` fails when values are `NaN` (float type).

**Solution:**

```python
# Always check for NaN before string operations
if stadt and not pd.isna(stadt):
    query_parts.append(str(stadt))
```

### 4. Environment Variables in Containers

**Problem:** Environment variables from `.zshrc` or `.bashrc` are not available in containerized environments.

**Solutions:**

- Run script locally where env vars are loaded
- Pass API key as command-line argument
- Use a `.env` file with python-dotenv

## Workflow for Large Datasets

For datasets where enrichment was partially completed:

1. **Load existing enriched data**
2. **Apply post-processing fixes** (translations, corrections) without re-calling API
3. **Identify remaining incomplete records**
4. **Enrich only incomplete records**

```python
# Load partially enriched data
df_enriched = pd.read_csv('enriched_addresses.csv')

# Fix translations in-place (no API calls)
country_map = {'Austria': 'Österreich', 'Switzerland': 'Schweiz'}
df_enriched['country'] = df_enriched['country'].replace(country_map)

# Find incomplete records
incomplete_mask = df_enriched['country'].isna()
df_incomplete = df_enriched[incomplete_mask]

# Enrich only incomplete records
for idx, row in df_incomplete.iterrows():
    # ... enrichment logic
```

## Performance Metrics (Example)

For a dataset of 1600 addresses:

- **Rule-based extraction:** 386 records (~24%) - 0 cost, instant
- **Google API calls:** 883 records (~55%) - $4.42 (within free tier)
- **Failed enrichment:** 4 records (~0.25%) - manual review needed
- **Total time:** ~45 seconds at 20 req/sec

## Cost Estimation

**Google Geocoding API:**

- Free tier: $200/month = ~40,000 requests
- After free tier: $5 per 1,000 requests
- Rate limit: 50 req/sec

**Example calculations:**

- 1,600 addresses = $0 (within free tier)
- 10,000 addresses = $0 (within free tier)
- 50,000 addresses = $50 (10k free + 40k paid)

## Best Practices

1. **Always use tiered approach** - exhaust free methods before calling paid APIs
2. **Never guess ambiguous patterns** - 4-digit postal codes could be Austria OR Switzerland
3. **Validate before database import** - check for remaining nulls after enrichment
4. **Track enrichment methods** - add a column indicating how each record was enriched (rule-based, API, manual)
5. **Handle errors gracefully** - log failed enrichments for manual review
6. **Use appropriate rate limiting** - be conservative to avoid hitting API limits
7. **Standardize output** - translate all country names to consistent language/format

## Security Notes

- Never commit API keys to version control
- Use environment variables or secure key management
- Restrict API keys to specific domains/IPs in production
- Monitor API usage to detect unauthorized access

## Alternative Approaches

For **ongoing production systems** with real-time requirements:

1. **Cache geocoding results** - store API responses to avoid duplicate calls
2. **Use free alternatives** - Nominatim for non-critical paths
3. **Implement fallback chains** - Try Nominatim → Google → Manual review
4. **Consider bulk geocoding** - Some providers offer batch discounts

For **sensitive data**:

1. **Self-hosted geocoding** - Photon, Pelias (OpenStreetMap-based)
2. **On-premise solutions** - Ensures data never leaves your infrastructure
3. **Differential privacy** - Add noise to coordinates before external API calls
