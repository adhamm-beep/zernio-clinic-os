import{
buildSegment,
}from"./segmentation.engine";

import type{
CustomerInsights,
}from"../engine/buildCustomerInsights";

export function recommendCampaign(
insights:CustomerInsights
){

const segment=
buildSegment(insights);

switch(segment){

case"VIP":

return"VIP Loyalty Campaign";

case"RISK":

return"Win Back Campaign";

case"NEW":

return"Welcome Campaign";

case"LOYAL":

return"Premium Upgrade";

default:

return"Monthly Offer";

}

}