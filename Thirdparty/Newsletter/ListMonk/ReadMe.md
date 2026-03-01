# ListMonk

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=true} -->

<!-- code_chunk_output -->

1. [Troubleshooting](#troubleshooting)
    1. [AxiosError: Request failed with status code 413](#axioserror-request-failed-with-status-code-413)
        1. [Nginx (most likely culprit)](#nginx-most-likely-culprit)
        2. [Listmonk itself (Go `http.Server`)](#listmonk-itself-go-httpserver)
        3. [Docker / Traefik (if applicable)](#docker--traefik-if-applicable)

<!-- /code_chunk_output -->

## Troubleshooting

### AxiosError: Request failed with status code 413

413 = Payload Too Large

Listmonk uses **nginx** (or a reverse proxy) in front, plus its own Go HTTP server. Two places to check:

#### Nginx (most likely culprit)

```nginx
client_max_body_size 50M;
```

Add to your `server {}` or `location /` block.

#### Listmonk itself (Go `http.Server`)

Listmonk has a hardcoded or config-driven max. Check `config.toml`:

```toml
[server]
max_body_size = 52428800  # 50MB in bytes
```

If that key doesn't exist in your version, it may be hardcoded — check [listmonk source](https://github.com/knadh/listmonk) for `MaxBytesReader`.

#### Docker / Traefik (if applicable)

If you're behind Traefik:

```yaml
# traefik dynamic config
http:
  middlewares:
    limit:
      buffering:
        maxRequestBodyBytes: 52428800
```

* * *

**Quickest fix:** nginx `client_max_body_size`. Restart nginx, retry. If still 413, it's coming from Listmonk/Go layer.

To identify which layer returns the 413, check response headers — nginx adds `Server: nginx` and its error page is HTML; Listmonk returns JSON.
