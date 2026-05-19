"""
Agent guidelines module.

Defines agent-level behavioral guidelines that control how the
agent responds to various customer inquiries.
"""

import parlant.sdk as p

from app.tools import get_current_rates


async def setup_agent_guidelines(agent: p.Agent) -> None:
    """
    Creates agent-level guidelines for behavioral control.
    """
    await agent.create_guideline(
        condition="The customer asks about current loan interest rates.",
        action="Call the get_current_rates tool and provide the current rates for the customer's zip code.",
        tools=[get_current_rates],
    )

    await agent.create_guideline(
        condition="The customer asks for legal or financial advice",
        action="State that you cannot provide financial or legal advice and recommend a licensed professional.",
    )

    await agent.create_guideline(
        condition="The customer asks about something that has nothing to do with financial services.",
        action="Kindly tell them you cannot assist with off-topic inquiries - do not engage with their request.",
    )

    await agent.create_guideline(
        condition="The customer asks for contact information for human support.",
        action="Provide the Customer Care Phone Number and tell them a Loan Specialist can assist them.",
    )
