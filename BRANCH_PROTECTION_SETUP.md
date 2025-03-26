# Branch Protection Setup Instructions

To protect your `main` and `development` branches from direct pushes and enforce code reviews, follow these steps:

## Setting Up Branch Protection for `main` Branch

1. Go to your GitHub repository
2. Click on "Settings" > "Branches"
3. Under "Branch protection rules," click "Add rule"
4. For "Branch name pattern," enter `main`
5. Enable the following options:
   - ✅ "Require a pull request before merging"
   - ✅ "Require approvals" (set to at least 1)
   - ✅ "Dismiss stale pull request approvals when new commits are pushed"
   - ✅ "Require status checks to pass before merging"
   - ✅ "Require branches to be up to date before merging"
   - ✅ Search for and enable the "ci" status check
6. Optionally, enable:
   - ✅ "Include administrators" to enforce these rules for repository administrators
7. Click "Create" or "Save changes"

## Setting Up Branch Protection for `development` Branch

1. Still in the "Branch protection rules" section, click "Add rule" again
2. For "Branch name pattern," enter `development`
3. Enable similar options as for the main branch, but you may want to be slightly less strict:
   - ✅ "Require a pull request before merging"
   - ✅ "Require approvals" (set to at least 1)
   - ✅ "Require status checks to pass before merging"
   - ✅ "Require branches to be up to date before merging"
   - ✅ Search for and enable the "ci" status check
4. Click "Create" or "Save changes"

## Setting Up GitHub Secrets for Vercel Deployment

For the GitHub Actions workflows to deploy to Vercel, you need to set up the following secrets in your GitHub repository:

1. Go to your GitHub repository
2. Click on "Settings" > "Secrets and variables" > "Actions"
3. Click "New repository secret"
4. Add the following secrets (you can obtain these from your Vercel dashboard):
   - `VERCEL_TOKEN`: Your Vercel API token
   - `VERCEL_ORG_ID`: Your Vercel organization ID
   - `VERCEL_PROJECT_ID`: Your Vercel project ID

## Setting Up Environment Variables in Vercel

1. Go to your Vercel dashboard and select your project
2. Go to "Settings" > "Environment Variables"
3. Add environment variables for each environment:
   - Production: 
     - `PRODUCTION_SUPABASE_URL`
     - `PRODUCTION_SUPABASE_ANON_KEY`
   - Preview/Development:
     - `DEVELOPMENT_SUPABASE_URL`
     - `DEVELOPMENT_SUPABASE_ANON_KEY`
4. Make sure to associate the variables with the correct environments 