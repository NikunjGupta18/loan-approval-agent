"""
Document processing tool.

Simulates a service that processes and validates uploaded
documents for loan applications.
"""

import parlant.sdk as p


@p.tool
async def process_documents(
    context: p.ToolContext,
    document_list: list,
) -> p.ToolResult:
    """
    Simulates a service that processes and validates uploaded documents.
    """
    # Simulate document processing and validation logic
    # We add a condition to simulate a document failing the validation
    if "tax_returns.pdf" in document_list and "pay_stubs.pdf" in document_list:
        # Assume one document is found to be inaccurate, a common real-world scenario
        if "inaccurate_info" in document_list:
            return p.ToolResult(
                data={"documents_processed": False, "reason": "inaccurate information"}
            )
        else:
            return p.ToolResult(data={"documents_processed": True})
    else:
        # Case for when the expected documents are not provided
        return p.ToolResult(
            data={"documents_processed": False, "reason": "missing documents"}
        )
