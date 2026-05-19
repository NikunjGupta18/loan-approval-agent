"""
Domain glossary module.

Adds domain-specific terminology to align the agent's understanding
with financial services concepts and brand voice.
"""

import parlant.sdk as p


async def add_domain_glossary(agent: p.Agent) -> None:
    """
    Adds domain-specific terminology to align the agent's understanding with
    financial services concepts and brand voice.
    """
    await agent.create_term(
        name="Customer Care Phone Number",
        description="The direct line for human assistance, at +1-234-567-8900",
    )
    await agent.create_term(
        name="Loan Specialist",
        description="A specific term to use when referring to human experts who handle loan applications.",
    )
    await agent.create_term(
        name="Loan Operations",
        description="The official department name to refer to in legal disclaimers.",
    )
    await agent.create_term(
        name="Online Portal",
        description="The online platform where customers can manage their application and upload documents manually.",
    )
    # Define financial concepts to prevent misinformation
    await agent.create_term(name="APR", description="Annual Percentage Rate")
    await agent.create_term(name="LTV", description="Loan-to-Value ratio")
    await agent.create_term(
        name="Loan Qualification",
        description="A preliminary estimate, not a guaranteed loan",
    )
