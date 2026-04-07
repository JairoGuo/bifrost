import { createFileRoute } from "@tanstack/react-router";
import { NoPermissionView } from "@/components/noPermissionView";
import { RbacOperation, RbacResource, useRbac } from "@enterprise/lib";
import DashboardPage from "./page";

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const hasObservabilityAccess = useRbac(RbacResource.Observability, RbacOperation.View)
  if (!hasObservabilityAccess) {
    return <NoPermissionView entity="dashboard" />;
  }
  return <div>{children}</div>
}

function RouteComponent() {
	return (
		<DashboardLayout>
			<DashboardPage />
		</DashboardLayout>
	);
}

export const Route = createFileRoute("/workspace/dashboard")({
	component: RouteComponent,
});
