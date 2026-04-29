import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    approveChangeRequest,
    getPendingChangeRequests,
    rejectChangeRequest,
} from "../api/changeRequestsApi";
import type { ChangeRequest } from "../types/changeRequest";
import "./ChangeRequestsPage.css";

function safeDateTime(value?: string) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
}

function safeDate(value?: string) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
}

export default function ChangeRequestsPage() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState<ChangeRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadRequests = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await getPendingChangeRequests();
            setRequests(data);
        } catch (err: any) {
            console.error("CHANGE REQUESTS ERROR:", err);
            const message =
                err?.response?.data?.message ||
                err?.response?.data ||
                "Failed to load change requests.";
            setError(typeof message === "string" ? message : "Failed to load change requests.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const handleApprove = async (id: number) => {
        try {
            setActionLoadingId(id);
            setSuccess("");
            setError("");
            await approveChangeRequest(id);
            setSuccess("Change request approved successfully.");
            await loadRequests();
        } catch (err: any) {
            console.error("APPROVE CHANGE REQUEST ERROR:", err);
            const message =
                err?.response?.data?.message ||
                err?.response?.data ||
                "Failed to approve request.";
            setError(typeof message === "string" ? message : "Failed to approve request.");
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleReject = async (id: number) => {
        try {
            setActionLoadingId(id);
            setSuccess("");
            setError("");
            await rejectChangeRequest(id);
            setSuccess("Change request rejected successfully.");
            await loadRequests();
        } catch (err: any) {
            console.error("REJECT CHANGE REQUEST ERROR:", err);
            const message =
                err?.response?.data?.message ||
                err?.response?.data ||
                "Failed to reject request.";
            setError(typeof message === "string" ? message : "Failed to reject request.");
        } finally {
            setActionLoadingId(null);
        }
    };

    return (
        <div className="change-page">
            <div className="change-shell">
                <div className="change-header">
                    <div>
                        <p className="change-eyebrow">Approval Center</p>
                        <h1>Pending Change Requests</h1>
                        <p className="change-subtitle">
                            Team Leaders approve or reject major task changes
                        </p>
                    </div>

                    <button className="change-back-btn" onClick={() => navigate("/dashboard")}>
                        Back
                    </button>
                </div>

                {success && <div className="change-state-card change-success-card">{success}</div>}

                {loading ? (
                    <div className="change-state-card">Loading requests...</div>
                ) : error ? (
                    <div className="change-state-card change-error-card">{error}</div>
                ) : requests.length === 0 ? (
                    <div className="change-state-card">No pending change requests.</div>
                ) : (
                    <div className="change-requests-list">
                        {requests.map((request) => (
                            <div key={request.id} className="change-request-card">
                                <div className="change-request-top">
                                    <div>
                                        <h3>{request.taskTitle || `Task #${request.taskId}`}</h3>
                                        <p>
                                            Requested by {request.requestedByName || request.requestedById || "-"} ·{" "}
                                            {safeDateTime(request.createdAt)}
                                        </p>
                                    </div>

                                    <span className="change-status-chip">
                                        {request.status || "Pending"}
                                    </span>
                                </div>

                                <div className="change-request-grid">
                                    <div className="change-request-field">
                                        <label>Current Owner ID</label>
                                        <p>{request.currentAssignedMemberId ?? "-"}</p>
                                    </div>

                                    <div className="change-request-field">
                                        <label>Requested Owner ID</label>
                                        <p>{request.newAssignedMemberId ?? "-"}</p>
                                    </div>

                                    <div className="change-request-field">
                                        <label>Current Due Date</label>
                                        <p>{safeDate(request.currentDueDate)}</p>
                                    </div>

                                    <div className="change-request-field">
                                        <label>Requested Due Date</label>
                                        <p>{safeDate(request.newDueDate)}</p>
                                    </div>

                                    <div className="change-request-field">
                                        <label>Current Effort</label>
                                        <p>
                                            {request.currentEstimatedEffortHours !== undefined
                                                ? `${request.currentEstimatedEffortHours} hours`
                                                : "-"}
                                        </p>
                                    </div>

                                    <div className="change-request-field">
                                        <label>Requested Effort</label>
                                        <p>
                                            {request.newEstimatedEffortHours !== undefined
                                                ? `${request.newEstimatedEffortHours} hours`
                                                : "-"}
                                        </p>
                                    </div>

                                    <div className="change-request-field full">
                                        <label>Reason</label>
                                        <p>{request.reason || "-"}</p>
                                    </div>
                                </div>

                                <div className="change-actions">
                                    <button
                                        className="approve-btn"
                                        onClick={() => handleApprove(request.id)}
                                        disabled={actionLoadingId === request.id}
                                    >
                                        {actionLoadingId === request.id ? "Processing..." : "Approve"}
                                    </button>

                                    <button
                                        className="reject-btn"
                                        onClick={() => handleReject(request.id)}
                                        disabled={actionLoadingId === request.id}
                                    >
                                        {actionLoadingId === request.id ? "Processing..." : "Reject"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}