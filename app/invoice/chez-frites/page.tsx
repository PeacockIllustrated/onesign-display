
import { Metadata } from "next";
import ChezFritesInvoiceContent from "./content";

export const metadata: Metadata = {
    title: "Invoice - Chez Frites",
};

export default function ChezFritesInvoice() {
    return <ChezFritesInvoiceContent />;
}
