"""
Loan types tool.

Provides a list of available loan products.
"""

import parlant.sdk as p


@p.tool
async def get_loan_types(context: p.ToolContext) -> p.ToolResult:
    """
    Provides a list of available loan types.
    """
    return p.ToolResult(
        data=["Home Loan", "Personal Loan", "Auto Loan", "Mortgage", "Refinancing"]
    )
