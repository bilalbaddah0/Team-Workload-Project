import type { WorkloadStatus } from "../../types/workload";

interface StatusBadgeProps {
    status: WorkloadStatus | string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
    const normalized = String(status).toLowerCase();

    let className = "status-badge";
    if (normalized === "available") className += " status-available";
    else if (normalized === "moderate") className += " status-moderate";
    else className += " status-overloaded";

    return <span className={className}>{status}</span>;
}