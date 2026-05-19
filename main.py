"""
Application entrypoint.

Starts the server and initializes the Financial Services Agent.
"""

import asyncio

from app.config import init as init_config
from app.agent import setup_agent
import parlant.sdk as p


async def main() -> None:
    """
    The main function to initialize and configure the Financial Services Agent.
    """
    init_config()

    async with p.Server(session_store="local") as server:
        await setup_agent(server)


if __name__ == "__main__":
    asyncio.run(main())
