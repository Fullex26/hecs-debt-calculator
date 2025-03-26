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

### Common Deployment Issues

#### "Resource not accessible by integration" Error

This error occurs when GitHub Actions does not have sufficient permissions to access resources. To resolve:

1. Verify workflow permissions in the YAML files match those documented below
2. Check Repository Settings > Actions > General > Workflow permissions are set to "Read and write permissions"
3. Check that the GITHUB_TOKEN has the necessary permissions
4. Ensure your Vercel token has not expired and has sufficient permissions

#### Failed Deployments on Vercel

If deployments fail on Vercel's side:

1. Check if the build is failing due to environment variables - ensure all required variables are set
2. Verify the Vercel project configuration in `vercel.json`
3. Check if there are any Vercel platform issues by visiting their status page

## GitHub Actions Permissions

Our GitHub Actions workflows now have enhanced permissions configured to ensure they can perform all necessary operations:

### Production and Development Workflows

Both production and development deployment workflows have these permissions:

- `contents: write` - For reading and writing repository content
- `deployments: write` - For creating deployments
- `statuses: write` - For updating commit statuses
- `issues: write` - For commenting on issues
- `pull-requests: write` - For commenting on PRs with deployment information
- `checks: write` - For creating check runs
- `actions: write` - For managing workflow runs
- `discussions: write` - For commenting on discussions
- `security-events: write` - For security scanning and reporting

### CI Workflow

The CI workflow used for pull requests has:

- `contents: read` - For reading repository content
- `pull-requests: write` - For writing status comments to pull requests
- `checks: write` - For creating check runs
- `actions: read` - For reading workflow information
- `security-events: write` - For security scanning

### Permission Explanation and Reasoning

Each permission is set with a specific purpose:

- `contents: write` - Allows reading and modifying repository files, necessary for deployment processes
- `deployments: write` - Enables creation and management of deployments
- `statuses: write` - Allows updating commit status checks
- `pull-requests: write` - Enables commenting on PRs with deployment information and status
- `checks: write` - Permits creating GitHub Actions check runs
- `actions: write` - Allows management of workflow runs
- `discussions: write` - Enables posting to discussions
- `security-events: write` - Permits security vulnerability scanning

### Repository Settings

In addition to workflow file permissions, you should also configure repository settings:

1. Go to Repository Settings > Actions > General
2. Under "Workflow permissions", select "Read and write permissions"
3. Check "Allow GitHub Actions to create and approve pull requests"
4. Save changes

## Environment Variables

- Environment variables are managed in the Vercel dashboard
- Different values are set for Production and Preview environments
- Never commit sensitive values to the repository
- Use `.env.example` to document required environment variables 