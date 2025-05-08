import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

// Configure Genkit with Google AI plugin
// Ensure GOOGLE_API_KEY is set in your .env file if required by the plugin
export const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.GOOGLE_API_KEY })
  ],
  // You might want to set a default model if all your flows use the same one
  // model: 'googleai/gemini-1.5-flash-latest', 
});

console.log('Genkit initialized with Google AI plugin.');
