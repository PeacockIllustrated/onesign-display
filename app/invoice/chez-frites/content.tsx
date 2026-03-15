"use client";

import { Logo } from "@/components/marketing/Logo";
import { Printer } from "lucide-react";

export default function ChezFritesInvoiceContent() {
    const invoiceDetails = {
        invoiceNumber: "INV-001",
        date: new Date().toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
        }),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
        }),
        to: {
            name: "Chez Frites",
        },
        from: {
            name: "Thomas Peacock",
            email: "tom@onesignanddigital.com",
        },
        items: [
            { description: "Menu Signage creation and software onboarding", amount: 400 },
            { description: "Additional Bespoke Features", amount: 100 },
        ],
        bankDetails: {
            name: "THOMAS PEACOCK",
            sortCode: "04-29-09",
            accountNumber: "06206352"
        }
    };

    const total = invoiceDetails.items.reduce((acc, item) => acc + item.amount, 0);

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 p-8 md:p-12 print:p-0">
            <div className="max-w-3xl mx-auto border border-zinc-200 shadow-sm print:border-0 print:shadow-none bg-white p-8 md:p-12">
                {/* Header */}
                <div className="flex justify-between items-start mb-12">
                    <div>
                        <Logo className="w-48 mb-6" width={200} height={64} />
                        <h1 className="text-2xl font-bold text-zinc-900">INVOICE</h1>
                        <p className="text-zinc-500 text-sm mt-1">Ref: {invoiceDetails.invoiceNumber}</p>
                    </div>
                    <div className="text-right text-sm">
                        <div className="mb-2">
                            <span className="text-zinc-500 font-medium block">Issued Date</span>
                            <span>{invoiceDetails.date}</span>
                        </div>
                        <div>
                            <span className="text-zinc-500 font-medium block">Due Date</span>
                            <span>{invoiceDetails.dueDate}</span>
                        </div>
                    </div>
                </div>

                {/* Client & Provider Details */}
                <div className="grid grid-cols-2 gap-8 mb-12">
                    <div>
                        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">Billed To</h3>
                        <p className="font-semibold text-lg">{invoiceDetails.to.name}</p>
                    </div>
                    <div className="text-right">
                        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">Payable To</h3>
                        <p className="font-semibold text-lg">{invoiceDetails.from.name}</p>
                    </div>
                </div>

                {/* Line Items */}
                <div className="mb-12">
                    <div className="border-b border-zinc-200 pb-2 mb-4 flex justify-between uppercase text-sm font-semibold text-zinc-500 tracking-wider">
                        <span>Description</span>
                        <span>Amount</span>
                    </div>
                    <ul className="space-y-4">
                        {invoiceDetails.items.map((item, index) => (
                            <li key={index} className="flex justify-between items-center py-2">
                                <span className="text-zinc-800">{item.description}</span>
                                <span className="font-medium">£{item.amount.toFixed(2)}</span>
                            </li>
                        ))}
                    </ul>
                    <div className="border-t border-zinc-200 mt-4 pt-4 flex justify-between items-center text-lg font-bold">
                        <span>Total</span>
                        <span>£{total.toFixed(2)}</span>
                    </div>
                </div>

                {/* Bank Details */}
                <div className="bg-zinc-50 p-6 rounded-lg print:bg-transparent print:p-0 print:border-t print:border-zinc-200 print:rounded-none">
                    <h3 className="text-sm font-semibold text-zinc-900 mb-4">Payment Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="block text-zinc-500">Bank Account Name</span>
                            <span className="font-medium">{invoiceDetails.bankDetails.name}</span>
                        </div>
                        <div>
                            <span className="block text-zinc-500">Total Amount</span>
                            <span className="font-medium text-zinc-900">£{total.toFixed(2)}</span>
                        </div>
                        <div>
                            <span className="block text-zinc-500">Sort Code</span>
                            <span className="font-medium">{invoiceDetails.bankDetails.sortCode}</span>
                        </div>
                        <div>
                            <span className="block text-zinc-500">Account Number</span>
                            <span className="font-medium">{invoiceDetails.bankDetails.accountNumber}</span>
                        </div>
                        <div className="col-span-1 sm:col-span-2 mt-2 pt-2 border-t border-zinc-200/50">
                            <span className="block text-zinc-500 mb-1">Payment Terms</span>
                            <span className="font-medium text-zinc-900">Payable in full or in 2 installments of £{(total / 2).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-16 pt-8 border-t border-zinc-100 flex flex-col items-center justify-center text-center">
                    <p className="font-sans font-black text-4xl text-zinc-900 mb-2 tracking-tight uppercase">Thank You</p>
                    <p className="text-zinc-500 font-medium text-sm">We appreciate your partnership with Onesign Display.</p>
                </div>
            </div>

            {/* Print Action */}
            <div className="fixed bottom-8 right-8 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="bg-zinc-900 text-white px-6 py-3 rounded-full shadow-lg hover:bg-zinc-800 transition-colors font-medium flex items-center gap-2"
                >
                    <Printer className="w-5 h-5" />
                    Print Invoice
                </button>
            </div>
        </div>
    );
}
