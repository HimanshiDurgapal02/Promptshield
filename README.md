# PromptShield: AI Prompt Injection Scanner

Attacks our own chatbot (HelpBot) with 15 known prompt injections, scores how easily its
fake secret leaks, applies a 3-layer defense, and shows the score drop on a dashboard.
Only ever run this against the chatbot in this project. The secret is made up.

## One-time setup
1. Install Python 3.10+, Node.js 18+, MySQL 8 (with Workbench).
2. In this folder:
   ```
   python -m venv venv
   venv\Scripts\activate          (Mac/Linux: source venv/bin/activate)
   pip install -r requirements.txt
   ```
3. Copy `.env.example` to `.env` and fill in ANTHROPIC_API_KEY and DB_PASSWORD.
   Set PYTHON_BIN to your venv python (see the comment in the file).
4. Create the tables: open `database/schema.sql` in MySQL Workbench and run it
   (or `mysql -u root -p < database/schema.sql`).
5. Install web dependencies:
   ```
   cd backend  && npm install
   cd ../frontend && npm install
   ```

## Test the scanner alone (no website needed)
```
python scanner/hello_llm.py          # API connection works?
python scanner/chatbot.py            # chat with HelpBot
python scanner/runner.py weak        # attack the original bot
python scanner/runner.py defended    # attack the defended bot
python scanner/runner.py both --no-db   # skip MySQL while testing
```

## Run the full app (two terminals)
```
cd backend  && npm start        # API on http://localhost:5000
cd frontend && npm run dev      # dashboard on http://localhost:5173
```
Open http://localhost:5173, click "Scan original chatbot", then "Scan defended chatbot".

## Offline test mode
`MOCK_LLM=1` swaps in a fake bot so you can test the code without an API key.
Its numbers are NOT real results; never use them in your demo.

## Files
scanner/chatbot.py   HelpBot + hidden secret      | scanner/attacks.py   15 attacks
scanner/scorer.py    leak check + score           | scanner/runner.py    runs the scan
scanner/defense.py   3 defense layers             | scanner/db.py        saves to MySQL
backend/server.js    API for the dashboard        | frontend/src/App.jsx dashboard
