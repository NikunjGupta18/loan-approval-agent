"""
Interest rates tool.

Fetches the current loan interest rates based on the
customer's location (zip code).
"""

import parlant.sdk as p


@p.tool
async def get_current_rates(
    context: p.ToolContext,
    zip_code: str,
) -> p.ToolResult:
    """
    Fetches the current loan interest rates based on the customer's location.
    """
    # Simulate an API call to get dynamic rates
    return p.ToolResult(
        data={"rates": {"30-year-fixed": "6.2%", "15-year-fixed": "5.8%"}}
    )
