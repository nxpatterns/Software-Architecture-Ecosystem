# Listmonk Bulk Import

## What is Listmonk?

Listmonk is a self-hosted newsletter and mailing list manager. Unlike SaaS alternatives (Mailchimp, SendGrid), you control the data and infrastructure. It's built for:

- High-volume email campaigns (100k+ subscribers)
- Transactional emails (password resets, notifications)
- Custom templates with per-subscriber attributes

## Why Bulk Import?

When migrating from another system or bootstrapping a platform, you often have existing contact data (e.g., 20,000 company contacts from a database). Bulk import gets this data into Listmonk in one operation rather than adding subscribers one-by-one via the UI.

## CSV Format Requirements

Listmonk expects a specific CSV format with **exactly these column names**:

```csv
email,name,attributes
john@example.com,"John Doe","{""company"": ""Acme Inc"", ""id"": ""ABC123""}"
jane@example.com,"Jane Smith","{""company"": ""Tech Corp"", ""id"": ""XYZ789""}"
```

**Key rules**:

1. **Headers must be exact**: `email`, `name`, `attributes` (case-sensitive)
2. **email**: Required, must be valid email addresses
3. **name**: Optional, plain text (can be empty string)
4. **attributes**: Optional JSON object as a **string** with escaped double quotes

**Attributes explained**: This is a JSON object containing custom fields for each subscriber. In the example above:

- `company` and `id` are custom fields
- The entire JSON is wrapped in double quotes as a CSV field
- Internal double quotes are escaped as `""`

When you create email templates in Listmonk, you can reference these attributes:

```
Hello {{ .Subscriber.Name }},
Your company: {{ .Attributes.company }}
```

## Generating the CSV from a Database

If your data is in PostgreSQL (or any SQL database), you can export directly to CSV with the correct format.

**Example: Exporting contacts with company ULIDs**

```sql
-- Assuming tables: contacts (id, email, name), companies (id, ulid, name)
-- and a join through contact_company (contact_id, company_id)

\copy (
    SELECT
        TRIM(c.email)                       AS email,
        c.name                              AS name,
        json_build_object(
            'company_ulid', co.ulid,
            'company_name', co.name
        )::text                             AS attributes
    FROM contacts c
    INNER JOIN contact_company cc ON cc.contact_id = c.id
    INNER JOIN companies co ON co.id = cc.company_id
    WHERE
        c.email IS NOT NULL
        AND TRIM(c.email) != ''
    ORDER BY co.ulid, c.id
) TO '/tmp/listmonk-import.csv' WITH CSV HEADER;
```

**What this query does**:

1. Joins contacts with their companies
2. Filters out rows with null/empty emails
3. Uses `json_build_object` to create the attributes JSON (PostgreSQL handles escaping)
4. Outputs to `/tmp/listmonk-import.csv` with headers

**Sanity checks before exporting**:

```sql
-- Check total exportable rows
SELECT COUNT(*) FROM contacts WHERE email IS NOT NULL AND TRIM(email) != '';

-- Check for duplicate emails (Listmonk deduplicates by email)
SELECT email, COUNT(*) as count
FROM contacts
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;
```

## The HTTP 413 Problem (Payload Too Large)

**Symptom**: When uploading the CSV to Listmonk via the web UI or API, you get:

```
AxiosError: Request failed with status code 413
```

**What it means**: The CSV file is too large for the web server's upload limit. This isn't a Listmonk limitation — it's the reverse proxy (Nginx, Traefik, Apache) in front of Listmonk rejecting the request.

**Why it happens**:

- Default upload limits are often 1-2 MB
- A CSV with 20k rows and attributes can be 5-10 MB uncompressed
- The proxy sees the POST body size and rejects before it reaches Listmonk

## Solution 1: Compress the CSV (Recommended)

Listmonk accepts **gzipped CSV files**. Compression typically reduces size by 70-90%.

```bash
# Compress the CSV
gzip -k /tmp/listmonk-import.csv
# Output: /tmp/listmonk-import.csv.gz (e.g., 10 MB → 1 MB)

# Upload the .gz file via Listmonk UI
# Listmonk automatically detects and decompresses it
```

**Why this works**: Even if the proxy has a 2 MB limit, the compressed file now fits. Listmonk decompresses after the upload completes.

## Solution 2: Increase Proxy Upload Limit

If compression isn't enough, or you need to support larger files in the future, increase the proxy's upload limit.

**For Nginx** (common in front of Listmonk):

Edit the Nginx config (usually `/etc/nginx/sites-available/listmonk` or `/etc/nginx/nginx.conf`):

```nginx
server {
    listen 80;
    server_name listmonk.example.com;

    # Increase upload limit to 10 MB
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Reload Nginx:

```bash
sudo nginx -t          # Test config syntax
sudo systemctl reload nginx
```

**For Traefik** (if using Docker labels):

Add a middleware to the Listmonk container labels:

```yaml
labels:
  - "traefik.http.middlewares.listmonk-limit.buffering.maxRequestBodyBytes=10485760"  # 10 MB
  - "traefik.http.routers.listmonk.middlewares=listmonk-limit@docker"
```

Or globally in `traefik.yml`:

```yaml
http:
  middlewares:
    upload-limit:
      buffering:
        maxRequestBodyBytes: 10485760  # 10 MB
```

Restart Traefik after changes.

**For Apache**:

```apache
<VirtualHost *:80>
    ServerName listmonk.example.com

    # Increase upload limit to 10 MB
    LimitRequestBody 10485760

    ProxyPass / http://localhost:9000/
    ProxyPassReverse / http://localhost:9000/
</VirtualHost>
```

Reload Apache:

```bash
sudo apachectl configtest
sudo systemctl reload apache2
```

## Import Process

1. **Prepare the CSV** (ensure format is correct, sanity-check row count)
2. **Compress if needed**: `gzip -k file.csv`
3. **Log into Listmonk web UI** → Subscribers → Import
4. **Select the list** (must exist before import)
5. **Upload the CSV/gz file**
6. **Choose import mode**:
   - **Subscribe**: Marks all as subscribed (default for new campaigns)
   - **Blocklist**: Adds to blocklist (for opt-outs)
   - **Overwrite**: Replaces existing attributes if email already exists
7. **Click Import** and wait

**Import takes time**: 20k subscribers can take 30-60 seconds. Don't refresh the page.

## Post-Import Verification

After import completes:

1. **Check subscriber count**: Subscribers → Total count should match your export
2. **Spot-check attributes**: Click on a few subscribers, verify the JSON attributes loaded correctly
3. **Test template rendering**: Create a test campaign with 1-2 subscribers, use `{{ .Attributes.your_field }}` in the template, send and verify

## Common Import Issues

### Issue 1: Attributes Not Appearing

**Symptom**: Subscribers imported, but attributes are empty.

**Causes**:

- JSON in CSV wasn't properly escaped (missing `""` around the attributes column)
- Used single quotes `'{...}'` instead of double quotes `"{...}"`
- JSON itself is invalid (use a validator like `jq` to check)

**Fix**: Re-export with correct escaping. Test with a 2-row CSV first.

### Issue 2: Duplicate Email Deduplication

**Symptom**: Exported 1000 rows, but Listmonk only imported 950.

**Cause**: Listmonk deduplicates by email. If the same email appears multiple times in the CSV, only the **last** occurrence's attributes are kept.

**Expected behavior**: This is by design. One email = one subscriber. If you need to send different content to the same email for different entities (e.g., same person owns multiple companies), you have two options:

1. **Merge attributes into an array** (one subscriber, one email, template loops over the array)
2. **Use separate campaigns** (one per entity, filter by attribute in campaign settings)

### Issue 3: Import Hangs or Times Out

**Symptom**: Upload starts but never completes, or browser shows timeout after 5+ minutes.

**Causes**:

- File too large even after compression (50+ MB)
- Listmonk database is slow (check disk I/O, database locks)
- Network interruption between browser and Listmonk

**Fix**:

- Split the CSV into chunks (e.g., 10k rows each), import sequentially
- Use the Listmonk API for import instead of the web UI (allows retries)
- Check Listmonk logs for errors: `docker logs listmonk` or `/var/log/listmonk/`

## Best Practices

1. **Always compress large CSVs**: Even if the proxy limit is high, compressed uploads are faster.

2. **Test with a small sample first**: Export 10-20 rows, import, verify attributes before running the full export.

3. **Back up the Listmonk database before import**: Large imports can go wrong. Have a rollback plan.

4. **Use transactions in your export query**: If the database changes while exporting, you may get inconsistent data. Wrap in a transaction or use a read replica.

5. **Document your attribute schema**: Future you (or your team) needs to know what `company_ulid` or `customer_tier` means. Keep a data dictionary.

**Listmonk Bulk Import** lets you load tens of thousands of subscribers in one operation. Key requirements: correct CSV format with escaped JSON attributes, compress large files to avoid HTTP 413, verify post-import.
