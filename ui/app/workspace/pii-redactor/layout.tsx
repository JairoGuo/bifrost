import { createFileRoute, Outlet, useChildMatches } from "@tanstack/react-router";
import { NoPermissionView } from "@/components/noPermissionView";
import { RbacOperation, RbacResource, useRbac } from "@enterprise/lib";
import PiiRedactorPage from "./page";

function PiiRedactorLayout({ children }: { children: React.ReactNode }) {
	const hasPiiRedactorAccess = useRbac(RbacResource.PIIRedactor, RbacOperation.View);
	if (!hasPiiRedactorAccess) {
		return <NoPermissionView entity="PII redactor" />;
	}
	return <div>{children}</div>;
}

function RouteComponent() {
	const childMatches = useChildMatches();
	return (
		<PiiRedactorLayout>{childMatches.length === 0 ? <PiiRedactorPage /> : <Outlet />}</PiiRedactorLayout>
	);
}

export const Route = createFileRoute("/workspace/pii-redactor")({
	component: RouteComponent,
});
