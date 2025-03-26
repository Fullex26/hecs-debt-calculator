# Deployment Workflow for HECS Debt Calculator

This document outlines the deployment workflow for the HECS Debt Calculator application.

## Environment Structure

The application is deployed to two separate environments:

1. **Development/Staging Environment**
   - Connected to the `development` branch
   - URL: [staging-url.vercel.app](https://staging-url.vercel.app)
   - Purpose: Testing new features before they go to production

2. **Production Environment**
   - Connected to the `main` branch
   - URL: [production-url.vercel.app](https://production-url.vercel.app)
   - Purpose: Live, user-facing application

## Workflow Overview

```
Feature Branch → Development → Main
      ↓               ↓         ↓
 Pull Request →  Staging Env → Production Env
```

## Step-by-Step Workflow

### 1. Feature Development

1. Create a new branch from `development` for your feature:
   ```bash
   git checkout development
   git pull
   git checkout -b feature/your-feature-name
   ```

2. Implement your feature, making commits as needed:
   ```bash
   git add .
   git commit -m "Implement feature X"
   ```

3. Push your branch to GitHub:
   ```bash
   git push -u origin feature/your-feature-name
   ```

4. When your feature is ready, create a Pull Request from your feature branch to `development`.

5. GitHub Actions will run tests and linting checks on your PR.

6. Other developers will review your PR. Make any requested changes.

7. Once approved and passing all checks, merge your PR into `development`.

### 2. Deployment to Staging

When code is merged to the `development` branch:

1. GitHub Actions automatically triggers the `deploy-development.yml` workflow.

2. The code is built, tested, and deployed to the Staging environment on Vercel.

3. You will see the status of this deployment in the GitHub Actions tab.

4. Test your changes on the Staging environment to ensure they work as expected.

### 3. Deployment to Production

When the changes in Staging are verified and ready for production:

1. Create a Pull Request from `development` to `main`.

2. Request a review from appropriate team members.

3. Once approved and passing all checks, merge your PR into `main`.

4. GitHub Actions automatically triggers the `deploy-production.yml` workflow.

5. The code is built, tested, and deployed to the Production environment on Vercel.

6. You will see the status of this deployment in the GitHub Actions tab.

7. Verify the changes on the Production environment.

## Feature Branch Preview Deployments

When you create a Pull Request from a feature branch, Vercel will automatically create a preview deployment for that PR. You can access this preview deployment from the PR page on GitHub.

## Rollbacks

If an issue is discovered in production:

1. Create a hotfix branch from `main`
   ```bash
   git checkout main
   git pull
   git checkout -b hotfix/fix-issue
   ```

2. Fix the issue and create a PR to both `main` and `development`

3. After approval, merge to `main` first to deploy the fix to production

4. Then merge to `development` to ensure the fix is included in future releases

## Troubleshooting Deployments

If a deployment fails:

1. Check the GitHub Actions logs for error messages
2. Check the Vercel deployment logs
3. Fix the issue in your local environment
4. Push the fix to the appropriate branch
5. The deployment will automatically retry

## GitHub Actions Permissions

Our GitHub Actions workflows have specific permissions configured to ensure they can perform necessary deployment operations:

### Production Workflow
The production deployment workflow has these permissions:
- `contents: read` - For reading repository content
- `deployments: write` - For creating deployments
- `statuses: write` - For updating commit statuses
- `issues: write` - For commenting on issues
- `pull-requests: write` - For commenting on PRs with deployment information
- `checks: write` - For creating check runs
- `actions: read` - For reading workflow information
- `discussions: write` - For commenting on discussions

### Development Workflow
The development deployment workflow has similar permissions:
- `contents: read` - For reading repository content
- `deployments: write` - For creating deployments 
- `statuses: write` - For updating commit statuses
- `issues: write` - For commenting on issues
- `pull-requests: write` - For commenting on PRs with deployment information
- `checks: write` - For creating check runs
- `actions: read` - For reading workflow information
- `discussions: write` - For commenting on discussions

### CI Workflow
The CI workflow used for pull requests has:
- `contents: read` - For reading repository content
- `pull-requests: read` - For accessing pull request information

If deployment issues occur with "Resource not accessible by integration" errors, check:
1. Workflow permissions in the YAML files
2. Repository secrets configuration
3. Vercel token permissions and expiration
4. GitHub Actions permissions settings in the repository settings

## Environment Variables

- Environment variables are managed in the Vercel dashboard
- Different values are set for Production and Preview environments
- Never commit sensitive values to the repository
- Use `.env.example` to document required environment variables 