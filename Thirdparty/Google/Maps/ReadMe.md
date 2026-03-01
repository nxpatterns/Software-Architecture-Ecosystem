# Google Maps API

## Setup

### Online

- Google Cloud Console: Projekt erstellen
- Maps JavaScript API aktivieren
- API-Schlüssel generieren (Einschränkungen setzen)

### Local

- API-Schlüssel in e.g. `.zshrc` Datei speichern
  - Environment-Variable setzen: `export GOOGLE_MAPS_API_KEY=<your_api_key>`
  - Terminal neu laden, e.g. `zsh -l` oder `source ~/.zshrc`
- `pip install googlemaps` für Python-Client-Bibliothek

## Example (Python Jupyter Notebook)

```python
import os
import pandas as pd

# Get Google Maps API key
GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')
print(f"GOOGLE_MAPS_API_KEY found: {'Yes' if GOOGLE_MAPS_API_KEY else 'No'}\n")

# Read the CSV file
df = pd.read_csv('snippets/outputs/missing-countries-in-table-adresse.csv')
```

```python
# Display the DataFrame to verify it loaded correctly
print(df.head())
```

```python
import googlemaps

# Initialize Google Maps client
gmaps = googlemaps.Client(key=GOOGLE_MAPS_API_KEY)

def get_country_from_address(row):
    """
    Geocode address and extract country code
    """
    address = f"{row['strasse']}, {row['plz']} {row['stadt']}"

    try:
        result = gmaps.geocode(address)
        if result:
            # Extract country from address_components
            for component in result[0]['address_components']:
                if 'country' in component['types']:
                    return component['short_name']
    except Exception as e:
        print(f"Error for {address}: {e}")

    return None

# Apply geocoding to each row
df['land'] = df.apply(get_country_from_address, axis=1)

print("\nUpdated data:")
print(df[['strasse', 'stadt', 'plz', 'land']].to_string())

# Save updated CSV
df.to_csv('snippets/outputs/missing-countries-in-table-adresse.csv', index=False)
```

E.g. Add Country Mapping and use the IDs from DB Result

```python
# ISO to German country names mapping
COUNTRY_MAP = {
    'AT': 'Österreich',
    'IT': 'Italien',
    'CH': 'Schweiz',
    'DE': 'Deutschland',
    'FR': 'Frankreich',
    'SI': 'Slowenien',
    'CZ': 'Tschechien',
    'HU': 'Ungarn',
    'SK': 'Slowakei',
    'PL': 'Polen',
    'HR': 'Kroatien',
    'LI': 'Liechtenstein'
}

# Read DB export with IDs
db_df = pd.read_csv('db_export.csv')

# Merge geocoded countries with DB IDs
df = df.merge(db_df[['id', 'strasse', 'stadt', 'plz']],
              on=['strasse', 'stadt', 'plz'],
              how='left')

# Convert ISO codes to German names
df['land_de'] = df['land'].map(COUNTRY_MAP)

# Generate UPDATE statements
for _, row in df.iterrows():
    print(f"UPDATE adresse SET land = '{row['land_de']}' WHERE id = {row['id']};")
```
