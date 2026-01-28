from enum import Enum
from uuid import UUID
from datetime import datetime
from typing import List

class MessageType(int, Enum):
    User = 0
    Assistant = 1
    System = 2

class ExplicitPriority(Enum):
    P1_Urgent = 1
    P2_High = 2
    P3_Medium = 3
    P4_Low = 4
    P5_Optional = 5

class TaskStatus(Enum):
    NOT_STARTED = 1
    IN_PROGRESS = 2
    COMPLETED = 3
    CANCELLED = 4
    