export type Campaign={id:number;name:string;channel:string;status:string;objective:string|null;budget:number;spend:number;start_date:string|null;end_date:string|null;audience_segment:string|null;offer_text:string|null};
export type Lead={id:number;campaign_id:number|null;source:string;full_name:string|null;phone:string|null;email:string|null;status:string;interested_service:string|null;customer_id:number|null;appointment_id:number|null;notes:string|null;campaign?:{name:string}|null};
export type Message={id:number;channel:string;recipient:string|null;message_text:string;ai_generated:boolean;status:string;scheduled_at:string|null;campaign?:{name:string}|null};
export type SourceCost={id:number;source:string;period_month:string;spend:number;impressions:number;clicks:number};
export type MarketingData={campaigns:Campaign[];leads:Lead[];messages:Message[];costs:SourceCost[]};
