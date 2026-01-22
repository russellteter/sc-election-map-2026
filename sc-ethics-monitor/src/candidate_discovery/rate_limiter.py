"""
Rate limiter for API calls.

Provides async-compatible rate limiting to respect API rate limits
when scraping multiple sources.
"""

import asyncio
import time
from typing import Optional


class RateLimiter:
    """
    Rate limiter for API calls.

    Ensures that requests are spaced appropriately to respect
    rate limits (e.g., 30 requests per minute for Firecrawl).

    Attributes:
        requests_per_minute: Maximum requests allowed per minute
        interval: Minimum seconds between requests
    """

    def __init__(
        self,
        requests_per_minute: int = 30,
        burst_size: Optional[int] = None,
    ):
        """
        Initialize the rate limiter.

        Args:
            requests_per_minute: Maximum requests per minute
            burst_size: Optional burst size for token bucket (not implemented)
        """
        self.rpm = requests_per_minute
        self.interval = 60.0 / requests_per_minute
        self._last_request: float = 0.0
        self._request_count: int = 0
        self._window_start: float = time.time()

    async def wait(self) -> None:
        """
        Wait if necessary to respect rate limit.

        This method should be called before each API request.
        It will sleep if the time since the last request is less
        than the required interval.
        """
        now = time.time()

        # Check if we need to reset the window
        if now - self._window_start >= 60.0:
            self._window_start = now
            self._request_count = 0

        # Check if we're at the rate limit
        if self._request_count >= self.rpm:
            # Wait until the window resets
            sleep_time = 60.0 - (now - self._window_start)
            if sleep_time > 0:
                await asyncio.sleep(sleep_time)
            self._window_start = time.time()
            self._request_count = 0

        # Ensure minimum interval between requests
        elapsed = now - self._last_request
        if elapsed < self.interval:
            await asyncio.sleep(self.interval - elapsed)

        self._last_request = time.time()
        self._request_count += 1

    def wait_sync(self) -> None:
        """
        Synchronous version of wait().

        For use in non-async contexts.
        """
        now = time.time()

        # Check if we need to reset the window
        if now - self._window_start >= 60.0:
            self._window_start = now
            self._request_count = 0

        # Check if we're at the rate limit
        if self._request_count >= self.rpm:
            sleep_time = 60.0 - (now - self._window_start)
            if sleep_time > 0:
                time.sleep(sleep_time)
            self._window_start = time.time()
            self._request_count = 0

        # Ensure minimum interval between requests
        elapsed = now - self._last_request
        if elapsed < self.interval:
            time.sleep(self.interval - elapsed)

        self._last_request = time.time()
        self._request_count += 1

    @property
    def requests_remaining(self) -> int:
        """
        Get the number of requests remaining in the current window.

        Returns:
            Number of requests remaining
        """
        now = time.time()
        if now - self._window_start >= 60.0:
            return self.rpm
        return max(0, self.rpm - self._request_count)

    @property
    def time_until_reset(self) -> float:
        """
        Get seconds until the rate limit window resets.

        Returns:
            Seconds until reset
        """
        now = time.time()
        elapsed = now - self._window_start
        if elapsed >= 60.0:
            return 0.0
        return 60.0 - elapsed

    def reset(self) -> None:
        """Reset the rate limiter state."""
        self._last_request = 0.0
        self._request_count = 0
        self._window_start = time.time()

    def __repr__(self) -> str:
        """Return string representation."""
        return (
            f"RateLimiter(rpm={self.rpm}, "
            f"remaining={self.requests_remaining}, "
            f"reset_in={self.time_until_reset:.1f}s)"
        )
