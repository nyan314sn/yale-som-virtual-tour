"""One PydanticAI agent per professor, all sharing the same course-database tools."""

import os
from collections import OrderedDict

from pydantic_ai import Agent
from pydantic_ai.messages import ModelMessage
from pydantic_ai.models.openai import OpenAIResponsesModel
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.usage import UsageLimits

import db
from professors import Professor, system_prompt

PORTKEY_BASE_URL = "https://api.portkey.ai/v1"
MODEL_NAME = os.getenv("OPENAI_MODEL", "gpt-6-luna")
LIMITS = UsageLimits(request_limit=8)
MAX_HISTORY = 40  # messages kept per conversation
MAX_SESSIONS = 500


def _model():
    if os.getenv("PORTKEY_API_KEY"):
        # A Portkey key is not an OpenAI key: send it to Portkey's OpenAI-compatible endpoint.
        return OpenAIResponsesModel(MODEL_NAME, provider=OpenAIProvider(base_url=PORTKEY_BASE_URL, api_key=os.environ["PORTKEY_API_KEY"]))
    if os.getenv("OPENAI_API_KEY"):
        return OpenAIResponsesModel(MODEL_NAME)
    raise RuntimeError("Set PORTKEY_API_KEY (routed through Portkey) or OPENAI_API_KEY (direct) in .env")


# ---------- tools (shared by every professor)

def search_courses(query: str, limit: int = 10) -> list[dict]:
    """Search all Yale SOM courses by keywords (topic, title, course number, or professor name).

    Args:
        query: keywords, e.g. 'machine learning', 'negotiation', 'MGT 409', 'accounting'.
        limit: max results (default 10).
    """
    return db.search(query, min(limit, 25))


def get_course_details(course_number: str) -> list[dict]:
    """Full details (description, every section's time and room, units, syllabus link) for one course.

    Args:
        course_number: e.g. 'MGT 409' or 'MGT409'.
    """
    return db.by_number(course_number)


def find_professor_courses(professor_name: str) -> list[dict]:
    """List the courses a professor teaches. Accepts a first name, last name, or both.

    Args:
        professor_name: e.g. 'Zaman', 'Kevin Williams'.
    """
    return db.by_professor(professor_name)


def courses_on_schedule(day: str | None = None, room: str | None = None, session: str | None = None) -> list[dict]:
    """Find course sections by meeting day, room and/or session. Leave a filter empty to ignore it.

    Args:
        day: weekday name, e.g. 'Monday' or 'Thu'.
        room: room number, e.g. '2200' or 'Evans 4430'.
        session: term session, e.g. 'fall', 'fall-1' (first half) or 'fall-2' (second half).
    """
    return db.schedule(day, room, session)


TOOLS = [search_courses, get_course_details, find_professor_courses, courses_on_schedule]


class Chats:
    """Agents are built lazily and cached; conversation history is kept in memory per session."""

    def __init__(self):
        self._model = None
        self._agents: dict[str, Agent] = {}
        self._history: OrderedDict[tuple[str, str], list[ModelMessage]] = OrderedDict()

    def agent(self, prof: Professor) -> Agent:
        if prof.id not in self._agents:
            self._model = self._model or _model()
            self._agents[prof.id] = Agent(self._model, instructions=system_prompt(prof), tools=TOOLS, name=prof.id)
        return self._agents[prof.id]

    async def ask(self, prof: Professor, session_id: str, message: str) -> str:
        key = (session_id, prof.id)
        history = self._history.get(key, [])
        result = await self.agent(prof).run(message, message_history=history, usage_limits=LIMITS)
        self._history[key] = _trim(result.all_messages())
        self._history.move_to_end(key)
        while len(self._history) > MAX_SESSIONS:
            self._history.popitem(last=False)
        return result.output

    def reset(self, prof_id: str, session_id: str) -> None:
        self._history.pop((session_id, prof_id), None)


def _trim(messages: list[ModelMessage]) -> list[ModelMessage]:
    """Keep the tail of the conversation, starting on a user turn so tool calls stay paired."""
    if len(messages) <= MAX_HISTORY:
        return messages
    tail = messages[-MAX_HISTORY:]
    for i, msg in enumerate(tail):
        if msg.kind == "request" and any(p.part_kind == "user-prompt" for p in msg.parts):
            return tail[i:]
    return tail
