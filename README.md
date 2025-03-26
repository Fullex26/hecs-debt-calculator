# HECS Debt Calculator

A modern, interactive web application that helps Australian students and graduates calculate their HECS-HELP loan repayments and visualize their debt repayment journey.

![HECS Debt Calculator Screenshot](screenshot.png)

## Features

- 📊 Interactive debt repayment calculator
- 📈 Visual repayment projections with detailed charts
- 💰 Accurate repayment thresholds for 2024-25
- 📅 Timeline of repayment milestones
- 💸 Voluntary repayment planning
- 📱 Fully responsive design for all devices
- 🎯 Advanced options for salary growth projections
- 🔄 CI/CD integration for automated deployments
- 🔒 Branch protection rules for code quality

## Live Demo

[View Live Demo](#) <!-- Add your deployment URL here -->

## Deployment Workflow

This project uses a structured deployment workflow with multiple environments:

### Environments

- **Development** - Connected to the `development` branch - for testing features
- **Production** - Connected to the `main` branch - for live, user-facing deployments

### Branch Structure

- `main` - Production branch, deployed to the live site
- `development` - Development/staging branch, deployed to staging site
- Feature branches - Created from `development` for implementing new features

### Contributing Flow

1. Create a feature branch from `development`
   ```bash
   git checkout development
   git pull
   git checkout -b feature/your-feature-name
   ```

2. Implement your changes and commit them
   ```bash
   git add .
   git commit -m "Implement feature X"
   ```

3. Push your branch and create a Pull Request to the `development` branch
   ```bash
   git push -u origin feature/your-feature-name
   ```

4. After code review and approval, merge the PR into `development`
   - This will automatically deploy to the staging environment

5. Test on the staging environment to verify everything works

6. Create a PR from `development` to `main` for production deployment
   - This requires code review approval before merging

7. After approval, merge to `main` to deploy to production

### Environment Variables

Each environment has its own set of environment variables:

- `.env.development` - Used for the development environment
- `.env.production` - Used for the production environment

## Technology Stack

- React 18
- TypeScript
- Vite
- Mantine UI
- Recharts
- Tabler Icons
- Supabase

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/hecs-debt-calculator.git
cd hecs-debt-calculator
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Start the development server
```bash
npm run dev
# or
yarn dev
```

4. Open your browser and visit `http://localhost:5173`

## Building for Production

To create a production build:

```bash
npm run build
# or
yarn build
```

For environment-specific builds:

```bash
# Development build
npm run build:dev

# Production build
npm run build:prod
```

The built files will be in the `dist` directory.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Mantine UI](https://mantine.dev/) for the beautiful component library
- [Recharts](https://recharts.org/) for the charting library
- [Tabler Icons](https://tabler-icons.io/) for the icon set
- Australian Taxation Office for the HECS-HELP repayment thresholds data

## Contact

Your Name - [@yourtwitter](https://twitter.com/yourtwitter)

Project Link: [https://github.com/yourusername/hecs-debt-calculator](https://github.com/yourusername/hecs-debt-calculator)
