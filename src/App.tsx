import { MantineProvider, createTheme } from '@mantine/core';
import { HECSCalculator } from './components/HECSCalculator';

const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  headings: {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight: '600',
  },
  breakpoints: {
    xs: '20em',    // 320px
    sm: '30em',    // 480px
    md: '48em',    // 768px
    lg: '64em',    // 1024px
    xl: '80em',    // 1280px
  },
  colors: {
    // Custom color palette
    brand: [
      '#E3F2FD', // 0: Lightest
      '#BBDEFB',
      '#90CAF9',
      '#64B5F6',
      '#42A5F5', // 4: Primary
      '#2196F3',
      '#1E88E5',
      '#1976D2',
      '#1565C0',
      '#0D47A1'  // 9: Darkest
    ],
  },
  components: {
    Container: {
      defaultProps: {
        px: { base: 'md', sm: 'lg', lg: 'xl' }
      }
    },
    Paper: {
      defaultProps: {
        p: { base: 'md', sm: 'lg', lg: 'xl' }
      }
    },
    Card: {
      defaultProps: {
        p: { base: 'md', sm: 'lg' },
        radius: 'md',
        withBorder: true,
      },
      styles: {
        root: {
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }
        }
      }
    },
    Button: {
      defaultProps: {
        radius: 'md',
      },
      styles: {
        root: {
          transition: 'transform 0.2s ease',
          '&:active': {
            transform: 'translateY(1px)',
          }
        }
      }
    },
    NumberInput: {
      defaultProps: {
        radius: 'md',
      },
      styles: {
        input: {
          '&:focus': {
            borderColor: 'var(--mantine-color-blue-5)',
            boxShadow: '0 0 0 2px rgba(33, 150, 243, 0.1)',
          }
        }
      }
    },
    ThemeIcon: {
      defaultProps: {
        radius: 'xl',
      },
      styles: {
        root: {
          background: 'linear-gradient(45deg, var(--mantine-color-blue-6), var(--mantine-color-blue-4))',
        }
      }
    },
    Timeline: {
      styles: {
        item: {
          '&::before': {
            transition: 'background-color 0.2s ease',
          }
        }
      }
    }
  }
});

function App() {
  return (
    <MantineProvider theme={theme}>
      <HECSCalculator />
    </MantineProvider>
  );
}

export default App;
