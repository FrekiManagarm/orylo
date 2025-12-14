import TransactionsClient from "./components/transactions-client";
import { Metadata } from "next";
import { getFraudAnalyses } from "@/lib/actions/fraud-analyses";

export const metadata: Metadata = {
  title: "Transactions | Orylo",
  description: "Detailed breakdown of all processed transactions.",
};

const TransactionsPage = async () => {
  const analyses = await getFraudAnalyses();

  return <TransactionsClient analyses={analyses} />;
};

export default TransactionsPage;
