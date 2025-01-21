# Hebrew Text Processing

This project processes Hebrew texts from MongoDB using OpenAI's GPT models to generate chunks and metadata, then stores the results in Supabase.

## Setup Instructions

### Prerequisites

- Node.js (version 14 or higher recommended)
- NPM (comes with Node.js)
- Access to MongoDB database
- Supabase account and API keys
- OpenAI API key

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/your-repo.git
   cd your-repo
   ```

2. **Install the dependencies:**

   ```bash
   npm install
   ```

3. **Create a `.env` file:**

   Copy the `.env.example` file to `.env`:

   ```bash
   cp .env.example .env
   ```

   Fill in your configuration values in the `.env` file.

4. **Update Configurations:**

   Ensure that the `config.js` file correctly imports and uses your environment variables.

5. **Run the application:**

   ```bash
   npm start
   ```

## Configuration Details

- **OpenAI API:** Set your OpenAI API key in the `.env` file.
- **MongoDB:** Provide your MongoDB URI and database name.
- **Supabase:** Provide your Supabase URL and API key.

## Logging

Logs are written to the console and to an `app.log` file in the project root. Adjust logging levels in `index.js` as needed.

## Dependencies

- See `package.json` for a full list of dependencies.

## Contributing

Contributions are welcome. Please open an issue or submit a pull request. 
=======
# seforim-process
>>>>>>> origin/main
