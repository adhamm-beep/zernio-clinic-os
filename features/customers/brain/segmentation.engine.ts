import type {
CustomerInsights,
} from "../engine/buildCustomerInsights";

export type Segment=

"VIP"

|"LOYAL"

|"NEW"

|"RISK"

|"REGULAR";

export function buildSegment(
insights:CustomerInsights
):Segment{

if(insights.vip)
return"VIP";

if(insights.riskLevel==="HIGH")
return"RISK";

if(insights.visits<=1)
return"NEW";

if(insights.visits>=10)
return"LOYAL";

return"REGULAR";

}
