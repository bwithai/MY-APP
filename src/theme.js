// theme.js
import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  styles: {
    global: {
      // Add fallback styles for older browsers
      body: {
        bg: '#f7fafc', // Fallback for gray.50
      },
      // Add more fallback styles as needed
    },
  },
  components: {
    Button: {
      baseStyle: {
        // Add fallback styles for buttons
        _hover: {
          bg: '#3182ce', // Fallback blue hover color
        },
      },
    },
    Box: {
      baseStyle: {
        // Add fallback styles for boxes
        borderColor: '#e2e8f0', // Fallback border color
      },
    },
  },
});

export default theme;