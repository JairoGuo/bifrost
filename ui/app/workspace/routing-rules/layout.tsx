import { createFileRoute, Outlet, useChildMatches } from "@tanstack/react-router";
import RoutingRulesPage from "./page";
/**
 * Routing Rules Layout
 * Provides layout structure only and renders children. RBAC gating is not
 * applied here; child components (e.g. routingRulesView.tsx) perform RBAC
 * checks via useRbac.
 */

interface RoutingRulesLayoutProps {
	children: React.ReactNode;
}

function RoutingRulesLayout({ children }: RoutingRulesLayoutProps) {
	// Note: useRbac is a hook, so we use it at the top level
	// For server components, RBAC is checked client-side in the child components
	// This layout just provides the structure
	return <>{children}</>;
}

function RouteComponent() {
	const childMatches = useChildMatches();
	return (
		<RoutingRulesLayout>{childMatches.length === 0 ? <RoutingRulesPage /> : <Outlet />}</RoutingRulesLayout>
	);
}

export const Route = createFileRoute("/workspace/routing-rules")({
	component: RouteComponent,
});
