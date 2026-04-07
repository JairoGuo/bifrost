import { createFileRoute } from "@tanstack/react-router";
import { NoPermissionView } from "@/components/noPermissionView"
import { RbacOperation, RbacResource, useRbac } from "@enterprise/lib"
import AuditLogsPage from "./page";

function AuditLogsLayout({ children }: { children: React.ReactNode }) {
  const hasAuditLogsAccess = useRbac(RbacResource.AuditLogs, RbacOperation.View)
  if (!hasAuditLogsAccess) {
    return <NoPermissionView entity="audit logs" />
  }
  return <div>{children}</div>
}

function RouteComponent() {
	return (
		<AuditLogsLayout>
			<AuditLogsPage />
		</AuditLogsLayout>
	);
}

export const Route = createFileRoute("/workspace/audit-logs")({
	component: RouteComponent,
});
