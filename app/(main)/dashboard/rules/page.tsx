import { Metadata } from "next";
import RulesClient from "./rules-client";

export const metadata: Metadata = {
  title: "Rules | Orylo",
  description:
    "Create and manage rules to analyze transactions and prevent fraud in real-time.",
};

const RulesPage = () => {
  return <RulesClient />;
};

export default RulesPage;
