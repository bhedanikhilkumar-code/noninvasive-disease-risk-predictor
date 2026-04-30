# Security Policy

## Scope

This repository is a portfolio/project repository. Security expectations depend on how the project is deployed, configured, and connected to external services.

## Responsible Disclosure

If you find a security issue:

1. Do **not** open a public issue with exploit details.
2. Contact the repository owner through their GitHub profile or trusted contact channel.
3. Include a clear description, impact, reproduction steps, and affected files/configuration.
4. Give reasonable time for review before public disclosure.

## Secrets and Configuration

Never commit:

- API keys
- OAuth secrets
- Database credentials
- `.env` files with real values
- Private certificates or signing keys
- Production tokens

Use `.env.example` or documentation placeholders when configuration is required.

## Recommended Hardening

- Keep dependencies updated.
- Validate user input before processing or storing it.
- Avoid logging sensitive data.
- Use least-privilege credentials for external services.
- Review generated files before committing.
- Document security assumptions in README or architecture notes.

## Supported Versions

This project is maintained as a portfolio project. Security fixes are handled on a best-effort basis unless a production deployment is explicitly documented.
