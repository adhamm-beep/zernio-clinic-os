import type {Metadata} from "next";
import LegalPublicPage from "@/components/LegalPublicPage";
import {legalVersion,privacySections} from "@/mobile-patient/src/legal";
export const metadata:Metadata={title:"سياسة الخصوصية | Panthera Clinics",description:"Panthera Clinics Patient App privacy policy"};
export default function PrivacyPage(){return <LegalPublicPage titleAr="سياسة الخصوصية" titleEn="Privacy Policy" version={legalVersion} sectionsAr={privacySections.ar} sectionsEn={privacySections.en}/>;}
