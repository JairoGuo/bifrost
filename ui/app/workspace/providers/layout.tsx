import { createFileRoute, Outlet, useChildMatches } from "@tanstack/react-router";
import { NoPermissionView } from "@/components/noPermissionView";
import { RbacOperation, RbacResource, useRbac } from "@enterprise/lib";
import Providers from "./page";

function ProvidersLayout({ children }: { children: React.ReactNode }) {
	const hasProvidersAccess = useRbac(RbacResource.ModelProvider, RbacOperation.View);
	if (!hasProvidersAccess) {
		return <NoPermissionView entity="model providers" />;
	}
	return <div>{children}</div>;
}

function RouteComponent() {
	const childMatches = useChildMatches();
	return (
		<ProvidersLayout>{childMatches.length === 0 ? <Providers /> : <Outlet />}</ProvidersLayout>
	);
}

export const Route = createFileRoute("/workspace/providers")({
	component: RouteComponent,
});
