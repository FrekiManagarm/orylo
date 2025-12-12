import TransactionsClient from "./components/transactions-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transactions | Orylo",
  description: "Detailed breakdown of all processed transactions.",
};

const TransactionsPage = () => {
  return <TransactionsClient />;
};

export default TransactionsPage;
