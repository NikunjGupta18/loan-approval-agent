# Loan Approval Conversational Agent

A compliance-driven conversational AI agent that guides customers through a structured loan approval process.

## Overview

This project implements a financial services chatbot that helps customers navigate the loan application process. The agent uses a state-based journey to guide users through eligibility checks, document collection, and approval workflows while maintaining compliance with financial service standards using deterministic and rule-based behavioral patterns.

## Installation

1. **Prerequisites**:
- Python 3.12+

2. **Install dependencies:**
    First, install `uv` and set up the environment:
    ```bash
    # MacOS/Linux
    curl -LsSf https://astral.sh/uv/install.sh | sh

    # Windows
    powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
    ```

    Then install project dependencies:
    ```bash
    # Create virtual environment and activate it
    uv venv
    source .venv/bin/activate  # MacOS/Linux
    .venv\Scripts\activate     # Windows

    # Install dependencies
    uv sync
    ```

3. **Set up environment variables:**
    ```bash
    # Create a .env file with your OpenAI API key
    echo OPENAI_API_KEY=your-api-key-here > .env
    ```

## Usage

Run the main application:
```bash
uv run main.py
```

This will start the server locally on port 8800 with the loan approval agent configured and ready to handle customer interactions.

![](chat-preview.png)

## Loan Approval Flow

The agent follows a structured conversational journey for processing loan applications:

```mermaid
stateDiagram-v2
    N0: Determine the type of loan user is interested in
    N1: Ask them to provide income and loan related details
    N2: Use the tool check_eligibility
    N3: Inform them that they are not qualified for the loan and ask them if they are interested in other types of loans
    N4: Ask them to provide their tax returns and recent pay stubs
    N5: Use the tool process_documents
    N6: Ask them to use our Online Portal to submit their documents, or contact a Loan Specialist at our Customer Care Phone Number for assistance
    N7: Inform them that their application has been approved and a Loan Specialist will review their information and contact them shortly
    [*] --> N0
    N0 --> N1: The customer specified the type of loan
    N1 --> N2
    N2 --> N3: The customer is not eligible for the loan
    N2 --> N4: The customer is eligible for the loan
    N4 --> N5
    N5 --> N6: The documents are either invalid, missing or not uploaded correctly
    N5 --> N7: Documents are successfully uploaded
    N7 --> [*]
    N6 --> [*]
    N3 --> [*]
style N0 fill:#006e53,stroke:#ffffff,stroke-width:2px,color:#ffffff
style N1 fill:#006e53,stroke:#ffffff,stroke-width:2px,color:#ffffff
style N2 fill:#ffeeaa,stroke:#ffeeaa,stroke-width:2px,color:#dd6600
style N3 fill:#006e53,stroke:#ffffff,stroke-width:2px,color:#ffffff
style N4 fill:#006e53,stroke:#ffffff,stroke-width:2px,color:#ffffff
style N5 fill:#ffeeaa,stroke:#ffeeaa,stroke-width:2px,color:#dd6600
style N6 fill:#006e53,stroke:#ffffff,stroke-width:2px,color:#ffffff
style N7 fill:#006e53,stroke:#ffffff,stroke-width:2px,color:#ffffff
```

## Project Structure

```
loan-approval-agent/
├── main.py                      # Application entrypoint
├── app/
│   ├── __init__.py
│   ├── config.py                # Environment & config loading
│   ├── agent.py                 # Agent creation & orchestration
│   ├── glossary.py              # Domain-specific terminology
│   ├── guidelines.py            # Agent behavioral guidelines
│   ├── tools/                   # Tool definitions
│   │   ├── eligibility.py       # Credit eligibility check
│   │   ├── documents.py         # Document processing
│   │   ├── rates.py             # Interest rate lookup
│   │   └── loan_types.py        # Available loan products
│   └── journeys/                # Conversational journey definitions
│       └── loan_approval.py     # Loan approval state machine
├── pyproject.toml
└── .env                         # API keys (gitignored)
```

## Key Components

### Tools
- **`check_eligibility`**: Validates customer creditworthiness based on credit score, income, and loan amount
- **`process_documents`**: Simulates document validation for tax returns and pay stubs
- **`get_current_rates`**: Fetches current interest rates by location
- **`get_loan_types`**: Returns available loan products

### Agent Capabilities
- Domain-specific terminology understanding
- Compliance guidelines for financial advice limitations
- Structured conversation flow management
- Human handoff protocols
