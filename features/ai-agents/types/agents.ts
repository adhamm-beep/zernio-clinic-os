export type AgentKind="reception"|"doctor"|"marketing"|"finance"|"ceo";
export type AgentContext={appointmentsToday:number;pendingConfirmations:number;pendingFollowUps:number;completedTreatments:number;activeCustomers:number;revenueMonth:number;outstanding:number;activeCampaigns:number;marketingLeads:number;lowStockProducts:number;staffPresentToday:number;topServices:Array<{name:string;count:number}>;topSources:Array<{name:string;count:number}>};
export type AgentTask={id:string;title:string;detail:string;href:string;priority:"high"|"medium"|"low"};
export type AgentWorkspace={context:AgentContext;tasks:Record<AgentKind,AgentTask[]>};
export type AgentAnswer={answer:string;actions:string[];risks:string[];metricHighlights:string[]};
