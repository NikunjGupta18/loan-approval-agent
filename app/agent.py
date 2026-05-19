"""
Agent orchestration module.

Creates and configures the agent by wiring together
all components: glossary, canned responses, journeys, and guidelines.
"""

import parlant.sdk as p

from app.glossary import add_domain_glossary
from app.journeys import create_loan_journey
from app.guidelines import setup_agent_guidelines


async def setup_agent(server: p.Server) -> p.Agent:
    """
    Creates and fully configures the Financial Services Agent.

    Returns the configured agent instance.
    """
    agent = await server.create_agent(
        name="Financial Services Agent",
        description="A compliance-driven agent that helps customers with loan approval.",
    )

    # Add foundational components
    await add_domain_glossary(agent)
    await agent.create_canned_response(
        template="Hello! My name is {{generative.agent_name}}. I am here to assist you with the loan approval process."
    )

    # Set up the loan approval journey
    await create_loan_journey(agent)

    # Set up agent-level behavioral guidelines
    await setup_agent_guidelines(agent)

    return agent
