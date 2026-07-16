# galya-reality (Python SDK)

Resolve named validators from the shared Galya registry, install the
pinned commit into a local cache, and call `.index()` / `.judge()`.

```python
import galya_reality as validators

client = validators.validator("my-validator")
```

See the monorepo root README for architecture and trust-model details.
