import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaCalendarAlt,
    FaCheckCircle,
    FaClipboardList,
    FaLightbulb,
    FaPlus,
    FaSignOutAlt,
    FaSitemap,
    FaSlidersH,
    FaUserCog,
    FaUsers,
} from "react-icons/fa";

import { getAllTasks } from "../api/tasksApi";
import { getTeamWorkload } from "../api/teamsApi";
import {
    getUserById,
    getUserWorkload,
    type MemberTask,
    type UserWorkloadResponse,
} from "../api/usersApi";
import StatusBadge from "../components/common/StatusBadge";
import type { TaskResponseDto } from "../types/task";
import type { TeamWorkloadMember } from "../types/workload";
import { clearAuth, getFullName, getRole, getUserId } from "../utils/auth";
import { isAdmin, isTeamLeader } from "../utils/permissions";

import "./DashboardPage.css";

type DashboardTotals = {
    totalMembers: number;
    totalTasks: number;
    totalEffort: number;
    totalWeight: number;
};

type LeaderDashboardTab = "summary" | "calendar" | "available" | "members" | "tasks";

type CalendarDay = {
    date: Date;
    key: string;
    dayNumber: number;
    dayName: string;
    isToday: boolean;
};

type MemberDayLoad = {
    memberId: string;
    memberName: string;
    tasks: TaskResponseDto[];
    totalWeight: number;
    status: "Free" | "Busy" | "Full";
};

type MemberSummary = {
    memberId: string;
    memberName: string;
    status: string;
    tasks: TaskResponseDto[];
    taskCount: number;
    effort: number;
    weight: number;
    recommendation: string;
};

function formatDateInput(date: Date) {
    return date.toISOString().split("T")[0];
}

function getThisWeekRange() {
    const today = new Date();
    const day = today.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const start = new Date(today);
    start.setDate(today.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return {
        startDate: formatDateInput(start),
        endDate: formatDateInput(end),
    };
}

function getNextWeekRange() {
    const thisWeek = getThisWeekRange();
    const start = new Date(thisWeek.startDate);
    start.setDate(start.getDate() + 7);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return {
        startDate: formatDateInput(start),
        endDate: formatDateInput(end),
    };
}

function normalizeDate(value: Date | string) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
}

function buildCalendarDays(from: string, to: string): CalendarDay[] {
    const start = normalizeDate(from);
    const end = normalizeDate(to);
    const days: CalendarDay[] = [];

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
        return days;
    }

    const today = normalizeDate(new Date());
    const current = new Date(start);

    while (current <= end) {
        const copy = new Date(current);

      
        const dayOfWeek = copy.getDay();

        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            days.push({
                date: copy,
                key: formatDateInput(copy),
                dayNumber: copy.getDate(),
                dayName: copy.toLocaleDateString(undefined, { weekday: "short" }),
                isToday: copy.getTime() === today.getTime(),
            });
        }

        current.setDate(current.getDate() + 1);
    }

    return days;
}

function getMemberId(member: TeamWorkloadMember) {
    return String(member.userId ?? member.id ?? "");
}

function getMemberName(member: TeamWorkloadMember) {
    return (
        member.fullName ||
        member.name ||
        member.memberName ||
        member.userName ||
        "Unknown Member"
    );
}
function isOnlyMemberRole(member: TeamWorkloadMember) {
    const roleValue = String((member as any).role ?? "").toLowerCase();

    return (
        roleValue === "member" ||
        roleValue === "2" ||
        roleValue.includes("member")
    );
}

function getMemberStatus(member: TeamWorkloadMember) {
    return member.workloadStatus || member.status || "Available";
}

function getMemberTasks(member: TeamWorkloadMember) {
    return Number(member.totalTasks ?? member.taskCount ?? 0);
}

function getMemberEffort(member: TeamWorkloadMember) {
    return Number(member.totalEffortHours ?? member.effortHours ?? 0);
}

function getMemberWeight(member: TeamWorkloadMember) {
    return Number(member.totalWeight ?? 0);
}

function getInitials(name: string) {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((x) => x[0]?.toUpperCase())
        .join("");
}

function mapTaskStatusLabel(value?: number | string) {
    if (typeof value === "string") return value;

    switch (Number(value)) {
        case 0:
            return "New";
        case 1:
            return "In Progress";
        case 2:
            return "Blocked";
        case 3:
            return "Done";
        default:
            return "-";
    }
}

function safeTaskDate(value?: string) {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString();
}

function getTaskAssignedId(task: TaskResponseDto) {
    const taskAny = task as any;

    return String(
        taskAny.assignedMemberId ??
        taskAny.assignedToId ??
        taskAny.userId ??
        taskAny.memberId ??
        taskAny.assignedMember?.id ??
        ""
    );
}

function taskOverlapsDate(task: TaskResponseDto, date: Date) {
    const taskAny = task as any;
    const startValue = task.startDate || taskAny.createdAt || taskAny.dueDate;
    const dueValue = task.dueDate || taskAny.endDate || task.startDate;

    if (!startValue && !dueValue) return false;

    const taskStart = normalizeDate(startValue || dueValue);
    const taskEnd = normalizeDate(dueValue || startValue);
    const selectedDate = normalizeDate(date);

    if (
        Number.isNaN(taskStart.getTime()) ||
        Number.isNaN(taskEnd.getTime()) ||
        Number.isNaN(selectedDate.getTime())
    ) {
        return false;
    }

    return taskStart <= selectedDate && taskEnd >= selectedDate;
}

function taskOverlapsRange(task: TaskResponseDto, startDate: string, endDate: string) {
    if (!task.startDate || !task.dueDate) return true;

    const taskStart = new Date(task.startDate);
    const taskDue = new Date(task.dueDate);
    const filterStart = new Date(startDate);
    const filterEnd = new Date(endDate);

    if (
        Number.isNaN(taskStart.getTime()) ||
        Number.isNaN(taskDue.getTime()) ||
        Number.isNaN(filterStart.getTime()) ||
        Number.isNaN(filterEnd.getTime())
    ) {
        return true;
    }

    return taskStart <= filterEnd && taskDue >= filterStart;
}

function getDailyLoadStatus(totalWeight: number, taskCount: number): "Free" | "Busy" | "Full" {
    if (taskCount === 0 || totalWeight === 0) return "Free";
    if (totalWeight >= 8 || taskCount >= 3) return "Full";
    return "Busy";
}

function getRecommendation(taskCount: number, weight: number) {
    if (taskCount === 0) return "Best choice for a new task";
    if (weight <= 15) return "Can take another small task";
    if (weight <= 25) return "Moderate load, assign carefully";
    return "Overloaded, avoid new tasks";
}

function getCalendarMemberLoads(
    day: CalendarDay,
    members: TeamWorkloadMember[],
    tasks: TaskResponseDto[]
): MemberDayLoad[] {
    return members
        .map((member) => {
            const memberId = getMemberId(member);
            const memberName = getMemberName(member);

            const memberTasks = tasks.filter(
                (task) => getTaskAssignedId(task) === memberId && taskOverlapsDate(task, day.date)
            );

            const totalWeight = memberTasks.reduce(
                (sum, task) => sum + Number((task as any).weight ?? 0),
                0
            );

            return {
                memberId,
                memberName,
                tasks: memberTasks,
                totalWeight,
                status: getDailyLoadStatus(totalWeight, memberTasks.length),
            };
        })
        .filter((load) => load.tasks.length > 0);
}

function memberHasTaskInRange(member: TeamWorkloadMember, tasks: TaskResponseDto[]) {
    const memberId = getMemberId(member);
    return tasks.some((task) => getTaskAssignedId(task) === memberId);
}

export default function DashboardPage() {
    const navigate = useNavigate();

    const fullName = getFullName() || "User";
    const role = getRole() || "Unknown";
    const currentUserId = String(getUserId() ?? "");

    const isAdminUser = isAdmin(role);
    const isLeaderUser = isTeamLeader(role);

    const initialRange = useMemo(() => getThisWeekRange(), []);

    const [startDate, setStartDate] = useState(initialRange.startDate);
    const [endDate, setEndDate] = useState(initialRange.endDate);

    const [teamName, setTeamName] = useState("Team Workload");
    const [members, setMembers] = useState<TeamWorkloadMember[]>([]);
    const [personalWorkload, setPersonalWorkload] = useState<UserWorkloadResponse | null>(null);
    const [allTasks, setAllTasks] = useState<TaskResponseDto[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [leaderTab, setLeaderTab] = useState<LeaderDashboardTab>("summary");

    const visibleAllTasks = useMemo(() => {
        return allTasks.filter((task) => taskOverlapsRange(task, startDate, endDate));
    }, [allTasks, startDate, endDate]);

    const memberSummaries = useMemo<MemberSummary[]>(() => {
        return members
            .filter((member) => {
                const name = getMemberName(member).toLowerCase();

                return (
                    !name.includes("admin") &&
                    !name.includes("leader")
                );
            })
            .map((member) => {
                const memberId = getMemberId(member);
                const memberName = getMemberName(member);

                const tasks = visibleAllTasks.filter((task) => getTaskAssignedId(task) === memberId);

                const effort = tasks.reduce(
                    (sum, task) => sum + Number(task.estimatedEffortHours ?? 0),
                    0
                );

                const weight = tasks.reduce(
                    (sum, task) => sum + Number((task as any).weight ?? 0),
                    0
                );

                return {
                    memberId,
                    memberName,
                    status: getRecommendation(tasks.length, weight),
                    tasks,
                    taskCount: tasks.length,
                    effort,
                    weight,
                    recommendation: getRecommendation(tasks.length, weight),
                };
            })
            .sort((a, b) => a.weight - b.weight);
    }, [members, visibleAllTasks]);

    const totals = useMemo<DashboardTotals>(() => {
        return memberSummaries.reduce<DashboardTotals>(
            (acc, member) => {
                acc.totalMembers += 1;
                acc.totalTasks += member.taskCount;
                acc.totalEffort += member.effort;
                acc.totalWeight += member.weight;
                return acc;
            },
            {
                totalMembers: 0,
                totalTasks: 0,
                totalEffort: 0,
                totalWeight: 0,
            }
        );
    }, [memberSummaries]);

    const personalTasks: MemberTask[] = personalWorkload?.tasks || [];

    const calendarDays = useMemo(() => {
        return buildCalendarDays(startDate, endDate);
    }, [startDate, endDate]);


    const availableMembers = useMemo(() => {
        return members
            .filter((member) => {
                const name = getMemberName(member).toLowerCase();
                return !name.includes("admin") && !name.includes("leader");
            })
            .filter((member) => !memberHasTaskInRange(member, visibleAllTasks));
    }, [members, visibleAllTasks]);

    const busyMembers = useMemo(() => {
        return members
            .filter((member) => {
                const name = getMemberName(member).toLowerCase();
                return !name.includes("admin") && !name.includes("leader");
            })
            .filter((member) => memberHasTaskInRange(member, visibleAllTasks));
    }, [members, visibleAllTasks]);

    const bestMember = memberSummaries[0] || null;
    const overloadedMembers = memberSummaries.filter((member) => member.weight > 25);
    const moderateMembers = memberSummaries.filter((member) => member.weight > 15 && member.weight <= 25);

    const loadDashboard = async (from = startDate, to = endDate) => {
        try {
            setLoading(true);
            setError("");

            if (isLeaderUser) {
                const currentUser = await getUserById(currentUserId);

                if (!currentUser.teamId) {
                    setError("Your account is not assigned to a team.");
                    setMembers([]);
                    setAllTasks([]);
                    setPersonalWorkload(null);
                    return;
                }

                const data = await getTeamWorkload(currentUser.teamId, from, to);
                const tasksData = await getAllTasks();

                setTeamName(data.teamName || data.name || `Team ${currentUser.teamId}`);
                setMembers(data.members || data.users || []);
                setAllTasks(tasksData);
                setPersonalWorkload(null);
            } else {
                const data = await getUserWorkload(currentUserId, from, to);

                setPersonalWorkload(data);
                setMembers([]);
                setAllTasks([]);
                setTeamName("Personal Dashboard");
            }
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.response?.data ||
                "Failed to load dashboard.";

            setError(typeof message === "string" ? message : JSON.stringify(message));
            setMembers([]);
            setAllTasks([]);
            setPersonalWorkload(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard(initialRange.startDate, initialRange.endDate);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUserId, role]);

    const handleLogout = () => {
        clearAuth();
        window.location.href = "/login";
    };

    const handleThisWeek = () => {
        const range = getThisWeekRange();
        setStartDate(range.startDate);
        setEndDate(range.endDate);
        loadDashboard(range.startDate, range.endDate);
    };

    const handleNextWeek = () => {
        const range = getNextWeekRange();
        setStartDate(range.startDate);
        setEndDate(range.endDate);
        loadDashboard(range.startDate, range.endDate);
    };

    const handleApply = () => {
        loadDashboard(startDate, endDate);
    };

    return (
        <div className="dashboard-page">
            <aside className="dashboard-sidebar">
                <div className="brand-box">
                    <div className="brand-logo">TW</div>
                    <div>
                        <strong>TaskFlow</strong>
                        <span>Workload System</span>
                    </div>
                </div>

                <div className="sidebar-profile">
                    <div className="sidebar-avatar">{getInitials(fullName)}</div>
                    <div>
                        <span>Logged in as</span>
                        <strong>{role}</strong>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {isLeaderUser && (
                        <>
                            <button
                                className={leaderTab === "summary" ? "active" : ""}
                                onClick={() => setLeaderTab("summary")}
                            >
                                <FaLightbulb />
                                Member Summary
                            </button>

                            <button
                                className={leaderTab === "calendar" ? "active" : ""}
                                onClick={() => setLeaderTab("calendar")}
                            >
                                <FaCalendarAlt />
                                Workload Calendar
                            </button>

                            <button
                                className={leaderTab === "available" ? "active" : ""}
                                onClick={() => setLeaderTab("available")}
                            >
                                <FaUsers />
                                Available Members
                            </button>

                            <button
                                className={leaderTab === "members" ? "active" : ""}
                                onClick={() => setLeaderTab("members")}
                            >
                                <FaUsers />
                                My Team
                            </button>

                            <button
                                className={leaderTab === "tasks" ? "active" : ""}
                                onClick={() => setLeaderTab("tasks")}
                            >
                                <FaClipboardList />
                                All Tasks
                            </button>

                            <button onClick={() => navigate("/tasks/new")}>
                                <FaPlus />
                                Create Task
                            </button>

                            <button onClick={() => navigate("/change-requests")}>
                                <FaCheckCircle />
                                Change Requests
                            </button>
                        </>
                    )}

                    {isAdminUser && (
                        <>
                            <button onClick={() => navigate("/admin/users")}>
                                <FaUserCog />
                                Manage Users
                            </button>

                            <button onClick={() => navigate("/admin/teams")}>
                                <FaSitemap />
                                Manage Teams
                            </button>

                            <button onClick={() => navigate("/admin/weight-multipliers")}>
                                <FaSlidersH />
                                Weight Settings
                            </button>
                        </>
                    )}
                </nav>

                <button className="sidebar-logout" onClick={handleLogout}>
                    <FaSignOutAlt />
                    Logout
                </button>
            </aside>

            <main className="dashboard-main">
                <header className="dashboard-topbar">
                    <div>
                        <p className="dashboard-eyebrow">Team Workload & Task Tracking</p>
                        <h1 className="dashboard-title">
                            {isLeaderUser ? "Team Leader Dashboard" : "Dashboard"}
                        </h1>
                        <p className="dashboard-subtitle">
                            Welcome back, <strong>{fullName}</strong>
                            {isLeaderUser
                                ? ". Member Summary gives a productive view of every team member and their tasks."
                                : "."}
                        </p>
                    </div>

                    <div className="topbar-profile">
                        <div className="topbar-avatar">{getInitials(fullName)}</div>
                        <div>
                            <span>{role}</span>
                            <strong>{fullName}</strong>
                        </div>
                    </div>
                </header>

                {isLeaderUser && (
                    <section className="filter-bar">
                        <div className="filter-title-wrap">
                            <FaCalendarAlt className="filter-icon" />
                            <div>
                                <h2>Analysis Date Range</h2>
                                <p>Member workload and task summary are calculated from this range.</p>
                            </div>
                        </div>

                        <div className="filter-controls">
                            <div className="input-group">
                                <label>Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>

                            <div className="input-group">
                                <label>End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>

                            <div className="filter-actions">
                                <button className="secondary-btn" onClick={handleThisWeek}>
                                    This Week
                                </button>

                                <button className="secondary-btn" onClick={handleNextWeek}>
                                    Next Week
                                </button>

                                <button className="primary-btn" onClick={handleApply}>
                                    Apply
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                {loading ? (
                    <div className="state-card">Loading dashboard...</div>
                ) : error ? (
                    <div className="state-card error-state">{error}</div>
                ) : isLeaderUser ? (
                    <>
                        <section className="leader-summary-grid">
                            <div className="leader-summary-card">
                                <span>Total Members</span>
                                <strong>{totals.totalMembers}</strong>
                                <p>{teamName}</p>
                            </div>

                            <button
                                className="leader-summary-card available admin-quick-card"
                                onClick={() => setLeaderTab("available")}
                            >
                                <span>Free Members</span>
                                <strong>{availableMembers.length}</strong>
                                <p>No tasks in selected range</p>
                            </button>

                            <div className="leader-summary-card moderate">
                                <span>Moderate Members</span>
                                <strong>{moderateMembers.length}</strong>
                                <p>Can take small tasks carefully</p>
                            </div>

                            <div className="leader-summary-card overloaded">
                                <span>Overloaded Members</span>
                                <strong>{overloadedMembers.length}</strong>
                                <p>Avoid assigning more</p>
                            </div>
                        </section>

                        {leaderTab === "summary" && (
                            <section className="table-card">
                                <div className="section-head">
                                    <div>
                                        <h2>Productive Member Summary</h2>
                                        <p>
                                            A clear summary of each team member, their tasks, workload,
                                            and assignment recommendation.
                                        </p>
                                    </div>

                                    <button
                                        className="primary-btn"
                                        onClick={() => navigate("/tasks/new")}
                                    >
                                        <FaPlus />
                                        Assign Task
                                    </button>
                                </div>

                                {bestMember && (
                                            <div className="summary-member-grid">
                                                {memberSummaries.map((member) => (
                                                    <button
                                                        key={member.memberId}
                                                        className="summary-member-card"
                                                        onClick={() => navigate(`/members/${member.memberId}`)}
                                                    >
                                                        <div className="summary-member-top">
                                                            <div className="summary-member-avatar">
                                                                {getInitials(member.memberName)}
                                                            </div>

                                                            <div>
                                                                <h3>{member.memberName}</h3>
                                                                <p>{member.recommendation}</p>
                                                            </div>
                                                        </div>

                                                        <div className="summary-member-stats">
                                                            <div>
                                                                <strong>{member.taskCount}</strong>
                                                                <span>Tasks</span>
                                                            </div>

                                                            <div>
                                                                <strong>{member.effort}</strong>
                                                                <span>Hours</span>
                                                            </div>

                                                            <div>
                                                                <strong>{member.weight.toFixed(1)}</strong>
                                                                <span>Weight</span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                )}

                                <div className="table-wrap">
                                    <table className="workload-table">
                                        <thead>
                                            <tr>
                                                <th>Member</th>
                                                <th>Workload</th>
                                                <th>Tasks</th>
                                                <th>Hours</th>
                                                <th>Weight</th>
                                                <th>Recommendation</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {memberSummaries.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="empty-row">
                                                        No members found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                memberSummaries.map((member) => (
                                                    <tr key={member.memberId}>
                                                        <td>
                                                            <div className="member-cell">
                                                                <div className="avatar-circle">
                                                                    {getInitials(member.memberName)}
                                                                </div>

                                                                <div>
                                                                    <div className="member-name">
                                                                        {member.memberName}
                                                                    </div>
                                                                    <div className="member-subtext">
                                                                        Team Member
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td>
                                                            <StatusBadge status={member.status} />
                                                        </td>
                                                        <td>{member.taskCount}</td>
                                                        <td>{member.effort}</td>
                                                        <td>{member.weight.toFixed(1)}</td>
                                                        <td>{member.recommendation}</td>
                                                        <td>
                                                            <button
                                                                className="secondary-btn"
                                                                onClick={() =>
                                                                    navigate(`/members/${member.memberId}`)
                                                                }
                                                            >
                                                                View
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        )}

                        {leaderTab === "calendar" && (
                            <section className="calendar-panel">
                                <div className="calendar-header">
                                    <div>
                                        <h2>Workload Calendar</h2>
                                        <p>
                                            Members without tasks are hidden here to keep the calendar
                                            clean. Use Available Members to assign new work.
                                        </p>
                                    </div>

                                    <button
                                        className="primary-btn"
                                        onClick={() => navigate("/tasks/new")}
                                    >
                                        <FaPlus />
                                        Assign New Task
                                    </button>
                                </div>

                                <div className="calendar-legend">
                                    <span className="legend-chip free">Low Load</span>
                                    <span className="legend-chip busy">Busy</span>
                                    <span className="legend-chip full">Full</span>
                                </div>

                                <div className="workload-calendar-grid">
                                    {calendarDays.length === 0 ? (
                                        <div className="empty-card">Invalid date range.</div>
                                    ) : (
                                        calendarDays.map((day) => {
                                            const loads = getCalendarMemberLoads(
                                                day,
                                                members,
                                                visibleAllTasks
                                            );

                                            return (
                                                <div
                                                    className={`calendar-day-card ${day.isToday ? "today" : ""
                                                        }`}
                                                    key={day.key}
                                                >
                                                    <div className="calendar-day-head">
                                                        <div>
                                                            <span>{day.dayName}</span>
                                                            <strong>{day.dayNumber}</strong>
                                                        </div>
                                                        <p>
                                                            {loads.reduce(
                                                                (sum, load) => sum + load.tasks.length,
                                                                0
                                                            )}{" "}
                                                            tasks
                                                        </p>
                                                    </div>

                                                    <div className="calendar-member-list">
                                                        {loads.length === 0 ? (
                                                            <div className="mini-empty">No tasks</div>
                                                        ) : (
                                                            loads.map((load) => (
                                                                <button
                                                                    key={`${day.key}-${load.memberId}`}
                                                                    className={`calendar-member-chip ${load.status.toLowerCase()}`}
                                                                    onClick={() =>
                                                                        navigate(
                                                                            `/members/${load.memberId}`
                                                                        )
                                                                    }
                                                                >
                                                                    <span className="calendar-member-avatar">
                                                                        {getInitials(load.memberName)}
                                                                    </span>

                                                                    <span className="calendar-member-info">
                                                                        <strong>{load.memberName}</strong>
                                                                        <small>
                                                                            {load.tasks.length} task
                                                                            {load.tasks.length === 1
                                                                                ? ""
                                                                                : "s"}{" "}
                                                                            · {load.status}
                                                                        </small>
                                                                    </span>
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </section>
                        )}

                        {leaderTab === "available" && (
                            <section className="table-card">
                                <div className="section-head">
                                    <div>
                                        <h2>Available Members</h2>
                                        <p>
                                            These members have no tasks in the selected date range and
                                            are the best candidates for new assignments.
                                        </p>
                                    </div>

                                    <button
                                        className="primary-btn"
                                        onClick={() => navigate("/tasks/new")}
                                    >
                                        <FaPlus />
                                        Assign Task
                                    </button>
                                </div>

                                <div className="member-cards-grid">
                                    {availableMembers.length === 0 ? (
                                        <div className="empty-card">
                                            No fully available members in this range.
                                        </div>
                                    ) : (
                                        availableMembers.map((member) => {
                                            const memberName = getMemberName(member);
                                            const memberId = getMemberId(member);

                                            return (
                                                <button
                                                    key={memberId}
                                                    className="member-profile-card"
                                                    onClick={() => navigate(`/members/${memberId}`)}
                                                >
                                                    <div className="member-profile-top">
                                                        <div className="member-profile-avatar">
                                                            {getInitials(memberName)}
                                                        </div>

                                                        <div className="member-profile-head">
                                                            <h3>{memberName}</h3>
                                                            <p>{member.role || "Team Member"}</p>
                                                        </div>
                                                    </div>

                                                    <div className="member-profile-status">
                                                        <span className="legend-chip free">
                                                            Available
                                                        </span>
                                                    </div>

                                                    <div className="member-profile-stats">
                                                        <div>
                                                            <strong>0</strong>
                                                            <span>Tasks</span>
                                                        </div>

                                                        <div>
                                                            <strong>0</strong>
                                                            <span>Hours</span>
                                                        </div>

                                                        <div>
                                                            <strong>0.0</strong>
                                                            <span>Weight</span>
                                                        </div>
                                                    </div>

                                                    <div className="member-profile-footer">
                                                        <span>View profile</span>
                                                        <span>→</span>
                                                    </div>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </section>
                        )}

                        {leaderTab === "members" && (
                            <section className="dashboard-content single">
                                <div className="table-card">
                                    <div className="section-head">
                                        <div>
                                            <h2>Team Members</h2>
                                            <p>
                                                Detailed workload overview with task count, effort,
                                                and weight.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="table-wrap">
                                        <table className="workload-table">
                                            <thead>
                                                <tr>
                                                    <th>Member</th>
                                                    <th>Status</th>
                                                    <th>Tasks</th>
                                                    <th>Effort Hours</th>
                                                    <th>Total Weight</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {memberSummaries.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="empty-row">
                                                            No workload data found for this range.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    memberSummaries.map((member) => (
                                                        <tr
                                                            key={member.memberId}
                                                            className="clickable-dashboard-row"
                                                            onClick={() =>
                                                                navigate(`/members/${member.memberId}`)
                                                            }
                                                        >
                                                            <td>
                                                                <div className="member-cell">
                                                                    <div className="avatar-circle">
                                                                        {getInitials(member.memberName)}
                                                                    </div>

                                                                    <div>
                                                                        <div className="member-name">
                                                                            {member.memberName}
                                                                        </div>
                                                                        <div className="member-subtext">
                                                                            Team Member
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            <td>
                                                                <StatusBadge status={member.status} />
                                                            </td>
                                                            <td>{member.taskCount}</td>
                                                            <td>{member.effort}</td>
                                                            <td>{member.weight.toFixed(1)}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </section>
                        )}

                        {leaderTab === "tasks" && (
                            <section className="table-card">
                                <div className="section-head">
                                    <div>
                                        <h2>All Team Tasks</h2>
                                        <p>
                                            Team Leader can view all created and assigned tasks in
                                            the selected date range.
                                        </p>
                                    </div>
                                </div>

                                <div className="table-wrap">
                                    <table className="workload-table">
                                        <thead>
                                            <tr>
                                                <th>Task</th>
                                                <th>Status</th>
                                                <th>Effort Hours</th>
                                                <th>Weight</th>
                                                <th>Start Date</th>
                                                <th>Due Date</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {visibleAllTasks.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="empty-row">
                                                        No tasks found for this range.
                                                    </td>
                                                </tr>
                                            ) : (
                                                visibleAllTasks.map((task) => (
                                                    <tr
                                                        key={task.id}
                                                        className="clickable-dashboard-row"
                                                        onClick={() => navigate(`/tasks/${task.id}`)}
                                                    >
                                                        <td>{task.title}</td>
                                                        <td>
                                                            <StatusBadge
                                                                status={mapTaskStatusLabel(task.status)}
                                                            />
                                                        </td>
                                                        <td>{task.estimatedEffortHours ?? 0}</td>
                                                        <td>{Number(task.weight ?? 0).toFixed(1)}</td>
                                                        <td>{safeTaskDate(task.startDate)}</td>
                                                        <td>{safeTaskDate(task.dueDate)}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        )}
                    </>
                ) : isAdminUser ? (
                    <section className="leader-summary-grid">
                        <button
                            className="leader-summary-card admin-quick-card"
                            onClick={() => navigate("/admin/users")}
                        >
                            <span>Admin</span>
                            <strong>Users</strong>
                            <p>Manage users, roles, and teams</p>
                        </button>

                        <button
                            className="leader-summary-card admin-quick-card"
                            onClick={() => navigate("/admin/teams")}
                        >
                            <span>Admin</span>
                            <strong>Teams</strong>
                            <p>Create and update teams</p>
                        </button>

                        <button
                            className="leader-summary-card admin-quick-card"
                            onClick={() => navigate("/admin/weight-multipliers")}
                        >
                            <span>Admin</span>
                            <strong>Weights</strong>
                            <p>Configure workload multipliers</p>
                        </button>
                    </section>
                ) : (
                    <>
                        <section className="leader-summary-grid">
                            <div className="leader-summary-card">
                                <span>Member</span>
                                <strong>{personalWorkload?.fullName || fullName}</strong>
                                <p>{personalWorkload?.email || "-"}</p>
                            </div>

                            <div className="leader-summary-card">
                                <span>Total Tasks</span>
                                <strong>{personalWorkload?.totalTasks ?? 0}</strong>
                                <p>Across selected range</p>
                            </div>

                            <div className="leader-summary-card">
                                <span>Total Effort</span>
                                <strong>{personalWorkload?.totalEffortHours ?? 0}</strong>
                                <p>Hours</p>
                            </div>

                            <div className="leader-summary-card">
                                <span>Total Weight</span>
                                <strong>
                                    {Number(personalWorkload?.totalWeight ?? 0).toFixed(1)}
                                </strong>
                                <p>{personalWorkload?.workloadStatus || "Available"}</p>
                            </div>
                        </section>

                        <section className="table-card">
                            <div className="section-head">
                                <div>
                                    <h2>My Assigned Tasks</h2>
                                    <p>Your tasks in the selected date range.</p>
                                </div>
                            </div>

                            <div className="table-wrap">
                                <table className="workload-table">
                                    <thead>
                                        <tr>
                                            <th>Task</th>
                                            <th>Status</th>
                                            <th>Effort Hours</th>
                                            <th>Weight</th>
                                            <th>Start Date</th>
                                            <th>Due Date</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {personalTasks.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="empty-row">
                                                    No tasks found for this range.
                                                </td>
                                            </tr>
                                        ) : (
                                            personalTasks.map((task) => (
                                                <tr
                                                    key={task.id}
                                                    className="clickable-dashboard-row"
                                                    onClick={() => navigate(`/tasks/${task.id}`)}
                                                >
                                                    <td>{task.title}</td>
                                                    <td>
                                                        <StatusBadge
                                                            status={mapTaskStatusLabel(task.status)}
                                                        />
                                                    </td>
                                                    <td>{task.estimatedEffortHours ?? 0}</td>
                                                    <td>{Number(task.weight ?? 0).toFixed(1)}</td>
                                                    <td>{safeTaskDate(task.startDate)}</td>
                                                    <td>{safeTaskDate(task.dueDate)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}