type StatusPillProps = {
    status: "read" | "reading" | "unread";
};

export function StatusPill({ status }: StatusPillProps) {
    const styles =
        status === "read"
            ? "bg-green-100 text-green-800"
            : status === "reading"
              ? "bg-blue-100 text-blue-800"
              : "bg-zinc-100 text-zinc-700";

    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles}`}>
            {status == "read"
                ? "Read"
                : status == "reading"
                  ? "Reading"
                  : "Unread"}
        </span>
    );
}
