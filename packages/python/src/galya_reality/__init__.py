"""galya-reality — resolve and run judgement-layer validators."""

from galya_reality.base import (
    ContextWindow,
    Message,
    ValidationResult,
    Validator,
)
from galya_reality.client import ValidatorClient, validator
from galya_reality.exceptions import (
    ChecksumMismatchError,
    EntrypointError,
    GalyaError,
    LanguageNotSupportedError,
    NetworkError,
    UnknownValidatorError,
)

__all__ = [
    "ContextWindow",
    "Message",
    "ValidationResult",
    "Validator",
    "ValidatorClient",
    "validator",
    "GalyaError",
    "UnknownValidatorError",
    "LanguageNotSupportedError",
    "ChecksumMismatchError",
    "EntrypointError",
    "NetworkError",
]

__version__ = "0.1.0"
