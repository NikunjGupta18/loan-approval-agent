"""
Eligibility check tool.

Validates whether a customer meets basic qualification criteria
for a loan based on credit score, income, and loan amount.
"""

import parlant.sdk as p


@p.tool
async def check_eligibility(
    context: p.ToolContext,
    credit_score: int,
    income: float,
    loan_amount: float,
) -> p.ToolResult:
    """
    Checks if the customer meets the basic qualification criteria for a loan.
    """
    # Simulate a business logic check for eligibility
    if credit_score >= 680 and income >= 50000 and loan_amount <= 500000:
        return p.ToolResult(data={"is_eligible": True})
    else:
        # Provide reason for ineligibility
        reason = (
            "insufficient credit score"
            if credit_score < 680
            else "income criteria does not meet the requirements"
        )
        return p.ToolResult(data={"is_eligible": False, "reason": reason})
