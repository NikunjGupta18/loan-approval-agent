"""
Loan approval journey module.

Defines the structured, multi-step conversational journey
for processing loan applications.
"""

import parlant.sdk as p

from app.tools import check_eligibility, process_documents, get_loan_types


async def create_loan_journey(agent: p.Agent) -> p.Journey:
    """
    Defines the structured, multi-step journey for loan approval.
    """
    journey = await agent.create_journey(
        title="Loan Approval",
        description="Guides a potential borrower through a two-stage loan approval process.",
        conditions=["The customer asks about loans or related financial services"],
    )

    # Ask the customer what type of loan they are interested in
    t0 = await journey.initial_state.transition_to(
        chat_state="Determine the type of loan user is interested in"
    )

    # Collect initial details from the user
    t1 = await t0.target.transition_to(
        chat_state="Ask them to provide their credit score, annual income, and the desired loan amount",
        condition="The customer specified the type of loan",
    )

    # Use a tool to check basic credit eligibility
    t2 = await t1.target.transition_to(tool_state=check_eligibility)

    # Handle the path for initial credit ineligibility
    t3_credit_ineligible = await t2.target.transition_to(
        chat_state="Inform them that they are not qualified for the loan and ask them if they are interested in other types of loans",
        condition="The customer is not eligible for the loan",
    )
    await t3_credit_ineligible.target.transition_to(state=p.END_JOURNEY)

    # Else continue this path: request and process documents
    t3_request_docs = await t2.target.transition_to(
        chat_state="Inform them that they meet the initial criteria and ask them to provide their tax returns and recent pay stubs",
        condition="The customer is eligible for the loan",
    )

    # Process the documents using a tool
    t4_process_docs = await t3_request_docs.target.transition_to(
        tool_state=process_documents
    )

    # Handle the path for document ineligibility
    t5_docs_ineligible = await t4_process_docs.target.transition_to(
        chat_state="Ask them to use our Online Portal to submit their documents, or contact a Loan Specialist at our Customer Care Phone Number for assistance",
        condition="The documents are either invalid, missing or not uploaded correctly",
    )
    await t5_docs_ineligible.target.transition_to(state=p.END_JOURNEY)

    # Else continue this path: success and hand-off to human
    t5_final_eligible = await t4_process_docs.target.transition_to(
        chat_state="Inform them that their application has been approved and a Loan Specialist will review their information and contact them shortly",
        condition="Documents are successfully uploaded",
    )

    # End the journey
    await t5_final_eligible.target.transition_to(state=p.END_JOURNEY)

    # Create additional guidelines for the journey
    await journey.create_guideline(
        condition="The customer asks about the types of loans we offer.",
        action="Call the get_loan_types tool and provide the list of loan types we offer.",
        tools=[get_loan_types],
    )

    return journey
