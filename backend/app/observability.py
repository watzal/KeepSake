import logging
from contextlib import contextmanager

import sentry_sdk

from .config import settings

AGENT_NAME = "Keepsake Organizer"


def init_sentry() -> None:
    """Turn on Sentry tracing. Without a DSN everything stays a no-op."""
    if not settings.sentry_dsn:
        logging.info("SENTRY_DSN not set, tracing disabled")
        return
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.sentry_environment,
        traces_sample_rate=1.0,
        send_default_pii=False,
    )


@contextmanager
def traced(op: str, name: str, attributes: dict | None = None):
    """A Sentry span with attributes, which also works on SDK versions without `attributes=`."""
    # Without an active trace (e.g. a background task) the first span has to be a transaction.
    if sentry_sdk.get_current_span() is None:
        cm = sentry_sdk.start_transaction(op=op, name=name)
    else:
        cm = sentry_sdk.start_span(op=op, name=name)
    with cm as span:
        for key, value in (attributes or {}).items():
            span.set_data(key, value)
        yield span
