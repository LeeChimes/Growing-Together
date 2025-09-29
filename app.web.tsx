// Web-specific entry point with compatibility layer
import { Platform } from 'react-native';

// Import web compatibility layer
import './src/lib/webCompatibility';

// Import the main app
import App from './app/_layout';

export default App;
