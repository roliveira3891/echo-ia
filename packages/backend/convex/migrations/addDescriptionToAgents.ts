import { internalMutation } from "../_generated/server";

/**
 * Migration para adicionar description aos agentes existentes
 * Execute: npx convex run migrations/addDescriptionToAgents:default
 */
export default internalMutation({
  handler: async (ctx) => {
    const agents = await ctx.db.query("aiAgents").collect();

    let updated = 0;

    for (const agent of agents) {
      // @ts-ignore - old agents may not have description
      if (!agent.description) {
        await ctx.db.patch(agent._id, {
          description: "",
        });
        updated++;
      }
    }

    console.log(`✅ Updated ${updated} agents with empty description`);
    return { updated, total: agents.length };
  },
});
