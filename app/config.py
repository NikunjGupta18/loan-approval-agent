"""
Configuration module.

Loads environment variables from .env and centralizes
application-wide configuration.
"""

from dotenv import load_dotenv


def init() -> None:
    """Load environment variables from the .env file."""
    load_dotenv()
