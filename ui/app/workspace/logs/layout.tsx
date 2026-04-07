import { createFileRoute, Outlet, useChildMatches } from "@tanstack/react-router";
import { NoPermissionView } from "@/components/noPermissionView"
import { RbacOperation, RbacResource, useRbac } from "@enterprise/lib"
import LogsPage from "./page";

function LogsLayout({ children }: { children: React.ReactNode }) {
  const hasViewLogsAccess = useRbac(RbacResource.Logs, RbacOperation.View)
  if (!hasViewLogsAccess) {
    return <NoPermissionView entity="logs" />
  }
  return (
    <div className="flex flex-col h-full">
      {children}
    </div>
  )
}

function RouteComponent() {
	const childMatches = useChildMatches();
	return (
		<LogsLayout>{childMatches.length === 0 ? <LogsPage /> : <Outlet />}</LogsLayout>
	);
}

export const Route = createFileRoute("/workspace/logs")({
	component: RouteComponent,
});
