"""Badge seeding service for default achievements."""
from collections.abc import Iterable

from sqlmodel import Session, select

from app.database import engine
from app.models import Badge

DEFAULT_BADGES: tuple[dict[str, str | None], ...] = (
    {
        "code": "FIRST_STEPS",
        "name": "First Steps",
        "description": "Complete your first minigame.",
    },
    {
        "code": "PERFECT_10",
        "name": "Perfect 10",
        "description": "Beat 10 minigames in a row without losing a life.",
    },
    {
        "code": "COIN_COLLECTOR",
        "name": "Coin Collector",
        "description": "Earn 50 coins in a single run.",
    },
    {
        "code": "SPEED_DEMON",
        "name": "Speed Demon",
        "description": "Complete a minigame with more than 5 seconds remaining.",
    },
    {
        "code": "SURVIVOR",
        "name": "Survivor",
        "description": "Complete 20 minigames in a single run.",
    },
)


def _existing_codes(session: Session) -> set[str]:
    """Get all existing badge codes from database."""
    rows = session.exec(select(Badge.code)).all()
    return set(rows)


def seed_default_badges(definitions: Iterable[dict[str, str | None]] | None = None) -> None:
    """Ensure the default badge definitions exist in the database."""
    badge_definitions = tuple(definitions) if definitions is not None else DEFAULT_BADGES
    if not badge_definitions:
        return

    with Session(engine) as session:
        present = _existing_codes(session)
        created = False
        for badge in badge_definitions:
            code = badge["code"]
            if code in present:
                continue
            session.add(
                Badge(
                    code=code,
                    name=badge.get("name") or code.title(),
                    description=badge.get("description"),
                )
            )
            created = True
        if created:
            session.commit()
