import { Injectable } from "@nestjs/common";
import { attestationStatus } from "../agents/attestation-schedule";
import { agentDemoStore } from "../agents/agent-demo.store";
import { usePlatformOpsDemoStore } from "../platform-ops/platform-ops-env";

const DEMO_TENANTS = [
  { tenantId: "tenant-gis", name: "Ghana International School", slug: "gis" },
  { tenantId: "tenant-mfg", name: "Demo Manufacturing", slug: "demo-mfg" },
  { tenantId: "tenant-hospital", name: "Demo Hospital", slug: "demo-hospital" },
];

@Injectable()
export class InternalTenantAgentsService {
  async getSummary() {
    if (usePlatformOpsDemoStore()) {
      const tenants = DEMO_TENANTS.map((tenant) => {
        const agents = agentDemoStore.listAgents(tenant.tenantId);
        const highRisk = agents.filter((a) => a.riskClassification === "high").length;
        const due = agents.filter(
          (a) => attestationStatus(a.nextAttestationDue) === "due",
        ).length;
        const attested = agents.filter(
          (a) => attestationStatus(a.nextAttestationDue) === "current",
        ).length;
        return {
          tenantId: tenant.tenantId,
          tenantName: tenant.name,
          slug: tenant.slug,
          agentCount: agents.length,
          highRiskCount: highRisk,
          dueAttestationCount: due,
          attestationCompliancePct:
            agents.length === 0 ? 100 : Math.round((attested / agents.length) * 100),
        };
      });

      return {
        totalRegisteredAgents: tenants.reduce((sum, t) => sum + t.agentCount, 0),
        tenantsDueAttestation: tenants.reduce((sum, t) => sum + t.dueAttestationCount, 0),
        highRiskCount: tenants.reduce((sum, t) => sum + t.highRiskCount, 0),
        tenants,
      };
    }

    return {
      totalRegisteredAgents: 0,
      tenantsDueAttestation: 0,
      highRiskCount: 0,
      tenants: [],
    };
  }
}
