import { MantineProvider, createTheme } from '@mantine/core';
import { HECSCalculator } from './components/HECSCalculator';

const theme = createTheme({
  primaryColor: 'blue',
});

function App() {
  return (
    <MantineProvider theme={theme}>
      <HECSCalculator />
    </MantineProvider>
  );
}

export default App;
