import type {Metadata} from "next";
import LegalPublicPage from "@/components/LegalPublicPage";
import {legalVersion,termsSections} from "@/mobile-patient/src/legal";
export const metadata:Metadata={title:"الشروط والأحكام | Panthera Clinics",description:"Panthera Clinics Patient App terms and conditions"};
export default function TermsPage(){return <LegalPublicPage titleAr="الشروط والأحكام وحقوق الملكية" titleEn="Terms, Conditions & Intellectual Property" version={legalVersion} sectionsAr={termsSections.ar} sectionsEn={termsSections.en}/>;}
