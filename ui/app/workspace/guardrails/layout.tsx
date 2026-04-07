import { createFileRoute, Outlet, useChildMatches } from "@tanstack/react-router";
import { NoPermissionView } from "@/components/noPermissionView";
import { RbacOperation, RbacResource, useRbac } from "@enterprise/lib";
import GuardrailsPage from "./page";

function GuardrailsLayout({ children }: { children: React.ReactNode }) {
	const hasGuardrailsAccess = useRbac(RbacResource.GuardrailsConfig, RbacOperation.View);
	if (!hasGuardrailsAccess) {
		return <NoPermissionView entity="guardrails configuration" />;
	}
	return <div>{children}</div>;
}

function RouteComponent() {
	const childMatches = useChildMatches();
	return (
		<GuardrailsLayout>{childMatches.length === 0 ? <GuardrailsPage /> : <Outlet />}</GuardrailsLayout>
	);
}

export const Route = createFileRoute("/workspace/guardrails")({
	component: RouteComponent,
});
