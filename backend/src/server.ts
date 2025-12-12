import 'dotenv/config'; // Load .env from current directory first
import dotenv from 'dotenv';
import path from 'path';

// Also try to load from parent directory as fallback/supplement
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

import app from './app.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
