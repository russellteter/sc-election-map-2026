"""
Structured logging configuration for SC Ethics Monitor.

Provides JSON-formatted logs suitable for GitHub Actions and production debugging.
Replaces print statements with proper logging levels.
"""

import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any


class StructuredFormatter(logging.Formatter):
    """
    JSON formatter for structured logging.

    Outputs logs in JSON format with timestamp, level, module, and extra fields.
    Makes GitHub Action logs parseable and searchable.
    """

    def format(self, record: logging.LogRecord) -> str:
        """Format a log record as JSON."""
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
            "message": record.getMessage(),
        }

        # Include extra fields if present
        if hasattr(record, "extra") and record.extra:
            log_entry["extra"] = record.extra

        # Include exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry)


class PrettyFormatter(logging.Formatter):
    """
    Human-readable formatter for local development.

    Uses colors and clear formatting for terminal output.
    """

    COLORS = {
        "DEBUG": "\033[36m",    # Cyan
        "INFO": "\033[32m",     # Green
        "WARNING": "\033[33m",  # Yellow
        "ERROR": "\033[31m",    # Red
        "CRITICAL": "\033[35m", # Magenta
    }
    RESET = "\033[0m"

    def format(self, record: logging.LogRecord) -> str:
        """Format a log record with colors."""
        color = self.COLORS.get(record.levelname, "")
        timestamp = datetime.now().strftime("%H:%M:%S")

        # Build prefix
        prefix = f"{color}[{timestamp}] {record.levelname:8}{self.RESET}"

        # Build message
        message = record.getMessage()

        # Include extra fields if present
        if hasattr(record, "extra") and record.extra:
            extras = " | ".join(f"{k}={v}" for k, v in record.extra.items())
            message = f"{message} ({extras})"

        return f"{prefix} {message}"


class MonitorLogger:
    """
    Logging wrapper for SC Ethics Monitor.

    Provides consistent logging interface with structured output support.
    """

    def __init__(self, name: str = "ethics-monitor", level: int = logging.INFO):
        """
        Initialize the logger.

        Args:
            name: Logger name (default: "ethics-monitor")
            level: Logging level (default: INFO)
        """
        self.logger = logging.getLogger(name)
        self.logger.setLevel(level)

        # Prevent duplicate handlers
        if not self.logger.handlers:
            self._setup_handlers()

    def _setup_handlers(self):
        """Set up logging handlers based on environment."""
        handler = logging.StreamHandler(sys.stdout)

        # Use JSON in CI/GitHub Actions, pretty in local dev
        if self._is_ci_environment():
            handler.setFormatter(StructuredFormatter())
        else:
            handler.setFormatter(PrettyFormatter())

        self.logger.addHandler(handler)

    def _is_ci_environment(self) -> bool:
        """Check if running in CI environment."""
        import os
        ci_vars = ["CI", "GITHUB_ACTIONS", "GITLAB_CI", "JENKINS_URL"]
        return any(os.environ.get(var) for var in ci_vars)

    def info(self, message: str, **extra: Any):
        """Log an info message."""
        self._log(logging.INFO, message, extra)

    def debug(self, message: str, **extra: Any):
        """Log a debug message."""
        self._log(logging.DEBUG, message, extra)

    def warning(self, message: str, **extra: Any):
        """Log a warning message."""
        self._log(logging.WARNING, message, extra)

    def error(self, message: str, **extra: Any):
        """Log an error message."""
        self._log(logging.ERROR, message, extra)

    def critical(self, message: str, **extra: Any):
        """Log a critical message."""
        self._log(logging.CRITICAL, message, extra)

    def _log(self, level: int, message: str, extra: dict):
        """Internal log method with extra data support."""
        record = self.logger.makeRecord(
            self.logger.name,
            level,
            "(unknown)",
            0,
            message,
            (),
            None,
        )
        if extra:
            record.extra = extra
        self.logger.handle(record)

    def success(self, message: str, **extra: Any):
        """Log a success message (INFO level with checkmark)."""
        self.info(f"[OK] {message}", **extra)

    def step(self, step_num: int, total: int, message: str, **extra: Any):
        """Log a pipeline step."""
        self.info(f"[{step_num}/{total}] {message}", **extra)

    def metric(self, name: str, value: Any, **extra: Any):
        """Log a metric."""
        self.info(f"METRIC: {name}={value}", metric_name=name, metric_value=value, **extra)


# Global logger instance
_logger = None


def get_logger() -> MonitorLogger:
    """Get the global logger instance."""
    global _logger
    if _logger is None:
        _logger = MonitorLogger()
    return _logger


def setup_logging(level: int = logging.INFO) -> MonitorLogger:
    """
    Set up logging for the application.

    Args:
        level: Logging level (default: INFO)

    Returns:
        Configured MonitorLogger instance.
    """
    global _logger
    _logger = MonitorLogger(level=level)
    return _logger


# Convenience functions for direct use
def log_info(message: str, **extra):
    """Log an info message."""
    get_logger().info(message, **extra)


def log_error(message: str, **extra):
    """Log an error message."""
    get_logger().error(message, **extra)


def log_warning(message: str, **extra):
    """Log a warning message."""
    get_logger().warning(message, **extra)


def log_debug(message: str, **extra):
    """Log a debug message."""
    get_logger().debug(message, **extra)


def log_success(message: str, **extra):
    """Log a success message."""
    get_logger().success(message, **extra)


def log_step(step_num: int, total: int, message: str, **extra):
    """Log a pipeline step."""
    get_logger().step(step_num, total, message, **extra)


def log_metric(name: str, value: Any, **extra):
    """Log a metric."""
    get_logger().metric(name, value, **extra)
