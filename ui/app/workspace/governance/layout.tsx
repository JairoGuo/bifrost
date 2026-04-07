import { createFileRoute, Outlet, useChildMatches } from "@tanstack/react-router";
import { NoPermissionView } from "@/components/noPermissionView";
import { RbacOperation, RbacResource, useRbac } from "@enterprise/lib";
import GovernancePage from "./page";

function GovernanceLayout({ children }: { children: React.ReactNode }) {
	const hasGovernanceAccess = useRbac(RbacResource.Governance, RbacOperation.View);
	if (!hasGovernanceAccess) {
		return <NoPermissionView entity="governance" />;
	}
	return <div>{children}</div>;
}

function RouteComponent() {
	const childMatches = useChildMatches();
	return (
		<GovernanceLayout>{childMatches.length === 0 ? <GovernancePage /> : <Outlet />}</GovernanceLayout>
	);
}

export const Route = createFileRoute("/workspace/governance")({
	component: RouteComponent,
});
