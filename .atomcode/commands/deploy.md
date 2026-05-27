# /deploy Command

Deploy the project to Cloudflare Workers using wrangler.

## Steps

1. First run TypeScript type checking:
   ```bash
   npx tsc --noEmit
   ```

2. If type check passes, deploy:
   ```bash
   pnpm wrangler deploy
   ```

3. If type check fails, report the errors and ask the user if they want to deploy anyway.

## Notes

- The `wrangler.toml` file contains placeholders (`KV_NAMESPACE_ID_PLACEHOLDER`, `LX_USERS_PLACEHOLDER`) that are replaced during CI/CD
- For local deployment, ensure `wrangler.toml` has valid values (not placeholders)
- The CI/CD pipeline (`.github/workflows/deploy.yml`) handles placeholder injection for production deploys
