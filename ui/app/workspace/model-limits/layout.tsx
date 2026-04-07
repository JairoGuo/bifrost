import { createFileRoute } from "@tanstack/react-router";
import ModelLimitsPage from "./page";
function ModelLimitsLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}

function RouteComponent() {
	return (
		<ModelLimitsLayout>
			<ModelLimitsPage />
		</ModelLimitsLayout>
	);
}

export const Route = createFileRoute("/workspace/model-limits")({
	component: RouteComponent,
});
