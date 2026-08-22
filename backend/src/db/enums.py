from enum import Enum


class UserRole(str, Enum):
    ENGINEER = "engineer"
    LEADER = "leader"
    ADMIN = "admin"


class IncidentStatus(str, Enum):
    OPEN = "OPEN"
    INVESTIGATING = "INVESTIGATING"
    RESOLVED = "RESOLVED"


class AnalysisSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"
