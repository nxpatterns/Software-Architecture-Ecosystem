# Jupyter Notebooks

## Environment Variables

```python
import os

# Safe method (returns None if not exists)
value = os.environ.get('MY_VAR')

# Direct access (raises KeyError if not exists)
value = os.environ['MY_VAR']

# With default value
value = os.environ.get('MY_VAR', 'default_value')
```

**Important:** The env variable must be set BEFORE starting the Jupyter server. Variables set in the shell after Jupyter is running won't be visible.

To verify:

```python
print(os.environ.get('MY_VAR'))
```

If you need to set it dynamically within the notebook:

```python
os.environ['MY_VAR'] = 'value'
```

## JSON

### Load JSON

```python
import json

with open('dObj.json') as f:
    data = json.load(f)
data
```

### Find Anomalies (Simple)

```python
def find_anomalies(data, path=''):
    if isinstance(data, dict):
        for key, value in data.items():
            find_anomalies(value, path + f'/{key}')
    elif isinstance(data, list):
        for i, value in enumerate(data):
            find_anomalies(value, path + f'/{i}')
    else:
        print(f'Path: {path}, Value: {data}')

find_anomalies(data)
```

### Create DB Schema

> Re-Check everything

```python
def create_table_schema(data, table_name='dobj'):
    schema = f'CREATE TABLE {table_name} ('
    for key, value in data.items():
        if isinstance(value, list):
            value = value[0] if value else ''
        data_type = get_data_type(value)
        key = key.replace('-', '_')
        schema += f'\n{key} {data_type},'
    schema = schema.rstrip(',')  # remove the last comma
    schema += '\n);'
    return schema

schema = create_table_schema(data[0])
schema
```
