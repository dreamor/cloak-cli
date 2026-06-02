# Security Policy

## Reporting a Vulnerability

**Do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in CloakBrowser CLI, please report it responsibly:

1. **Email**: Open a GitHub Security Advisory at [github.com/dreamor/cloak-cli/security/advisories/new](https://github.com/dreamor/cloak-cli/security/advisories/new)
2. **Include**:
   - A description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

## Response Timeline

| Stage | Target |
|-------|--------|
| Acknowledgment | Within 48 hours |
| Initial assessment | Within 5 business days |
| Fix development | Depends on severity |
| Advisory published | After fix is released |

## Scope

**In scope:**
- Command injection via CLI arguments
- Path traversal in file output (`--out`, `--screenshot`, `--pdf`, `session save-state`)
- Daemon socket permission issues
- Credential leakage in logs or output

**Out of scope:**
- CloakBrowser engine vulnerabilities (report to the CloakBrowser project)
- Playwright vulnerabilities (report to the Playwright project)
- Issues in dependencies (report upstream)

## Secure Usage

- Never pass unsanitized user input as CLI arguments without validation
- The daemon socket (`~/.cloak/daemon.sock`) is user-local; ensure proper filesystem permissions
- Proxy credentials (`--proxy http://user:pass@host`) may appear in process listings — prefer environment variables or config files for sensitive credentials
- `eval` and `eval-file` execute arbitrary JavaScript in the browser context — use only with trusted input
