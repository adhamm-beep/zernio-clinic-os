import PatientInbox from "@/features/messages/components/PatientInbox";
export default async function MessagesPage({searchParams}:{searchParams:Promise<{customer?:string|string[]}>}){
  const params=await searchParams;
  const raw=Array.isArray(params.customer)?params.customer[0]:params.customer;
  const customerId=Number(raw);
  return <PatientInbox initialCustomerId={Number.isSafeInteger(customerId)&&customerId>0?customerId:null}/>;
}
