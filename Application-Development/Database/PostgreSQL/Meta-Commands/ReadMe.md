# PostgreSQL Meta-Commands Reference

## Overview

PostgreSQL's `psql` command-line tool provides meta-commands (backslash commands) for inspecting database structure and managing connections. These are shortcuts that don't require SQL syntax. This documentation is project-agnostic and focuses on practical patterns you'll need when working with PostgreSQL in Docker containers.

## Using with Docker

When running PostgreSQL in Docker, execute meta-commands via `docker exec`:

```bash
docker exec <container-name> psql -U <username> -d <database> -c "<meta-command>"
```

**Flags:**

- `-U` - Database user
- `-d` - Database name
- `-c` - Command to execute
- `-t` - Tuple-only mode (removes headers/footers, cleaner output)

**Example:**

```bash
docker exec my-postgres psql -U admin -d mydb -c "\dt"
```

## Core Meta-Commands

### Database & Schema Inspection

```bash
\l              # List all databases
\c dbname       # Connect to database
\dn             # List schemas
\dt             # List tables (current schema)
\dt+            # Tables with size/description
\dt *.*         # Tables from all schemas
\dt schema.*    # Tables from specific schema
```

### Table Structure

```bash
\d tablename    # Show table structure (columns, types, keys, indexes)
\d+ tablename   # Extended info (storage, descriptions)
\d indexname    # Index details
```

**Output includes:**

- Column names and data types
- NULL/NOT NULL constraints
- Default values
- Primary keys
- Foreign keys
- Indexes
- Check constraints

### Object Types

```bash
\dv             # Views
\dm             # Materialized views
\ds             # Sequences
\di             # Indexes
\df             # Functions
\dT             # Data types
```

### Users & Permissions

```bash
\du             # List roles/users
\dp tablename   # Access privileges on table
\z tablename    # Alias for \dp
```

### Utility

```bash
\?              # Help on meta-commands
\h COMMAND      # SQL command help (e.g., \h SELECT)
\x              # Toggle vertical/horizontal display
\timing         # Toggle query execution time display
\q              # Quit psql
\i filename     # Execute SQL file
\conninfo       # Current connection info
```

## Common Patterns

### Get Clean List of Table Names

```bash
docker exec <container> psql -U <user> -d <db> -t -c \
  "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"
```

The `-t` flag removes headers and row count, giving you just the names.

### Inspect Specific Table

```bash
docker exec <container> psql -U <user> -d <db> -c "\d tablename"
```

### List All Tables Across Schemas

```bash
docker exec <container> psql -U <user> -d <db> -c "\dt *.*"
```

### Check Table Sizes

```bash
docker exec <container> psql -U <user> -d <db> -c "\dt+"
```

## Key Differences: \d vs \dt vs \d+

- `\d` - Describes specific object (table, view, index)
- `\dt` - Lists all tables
- `\d+` - Extended version with storage/description info
- `\dt+` - Lists tables with size details

## Interactive vs Non-Interactive Mode

**Interactive** (inside container):

```bash
docker exec -it <container> psql -U <user> -d <db>
# Then use meta-commands directly
\dt
\d tablename
```

**Non-Interactive** (one-off commands):

```bash
docker exec <container> psql -U <user> -d <db> -c "\dt"
```

Use `-c` for scripting or quick checks. Use interactive mode for exploration.

## Tips

1. **Use `\?` when stuck** - Shows all available meta-commands with brief descriptions
2. **Schema matters** - Default commands only show objects in the current schema (usually `public`)
3. **Combine with SQL** - You can mix meta-commands with SQL queries for more complex filtering
4. **Output formatting** - Use `-t` for scripts, `\x` for wide tables in interactive mode
5. **Abbreviations work** - You don't need the full object name if it's unique (e.g., `\d user` works if only one table starts with "user")

## Schema Qualification

If working with multiple schemas, qualify table names:

```bash
\d schema_name.table_name
\dt schema_name.*
```

Or switch schema context:

```bash
SET search_path TO schema_name;
```

## Complete Help

For the full list of meta-commands, run `\?` in an interactive psql session:

```bash
docker exec -it <container> psql -U <user> -d <db>
\?
```
