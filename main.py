"""
Application entrypoint.

Starts the server and initializes the Financial Services Agent,
and serves the custom frontend on port 8000.
"""

import asyncio
import subprocess
import sys
import atexit

from app.config import init as init_config
from app.agent import setup_agent
import parlant.sdk as p


def start_frontend_server():
    """Starts a simple HTTP server to serve the frontend directory."""
    print("Starting frontend server at http://localhost:8000")
    process = subprocess.Popen(
        [sys.executable, "-m", "http.server", "8000", "--directory", "frontend"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    
    # Ensure the process is cleaned up when the script exits
    atexit.register(lambda: process.terminate())


async def main() -> None:
    """
    The main function to initialize and configure the Financial Services Agent.
    """
    init_config()
    start_frontend_server()

    async with p.Server(session_store="local") as server:
        await setup_agent(server)


if __name__ == "__main__":
    asyncio.run(main())
