export function getRetellConfig(): { apiKey: string; agentId: string } {
  const apiKey = process.env.RETELL_API_KEY;
  const agentId = process.env.RETELL_AGENT_ID;

  if (!apiKey) {
    throw new Error("Missing RETELL_API_KEY in environment/config");
  }
  if (!agentId) {
    throw new Error("Missing RETELL_AGENT_ID in environment/config");
  }

  return { apiKey, agentId };
}


