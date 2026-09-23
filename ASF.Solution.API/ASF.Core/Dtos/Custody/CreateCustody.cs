using System;
using System.Collections.Generic;

namespace ASF.Core.Dtos
{
    public class CreateCustodyDto
    {
        public decimal AdvanceAmount { get; set; }
        public string? Notes { get; set; }
        // اختياري: فتح العهدة لمستخدم معيّن (لو أدمن)
        public string? CustodianUserId { get; set; }
    }

    public class AddInvoiceDto
    {
        public string InvoiceNumber { get; set; } = default!;
        public DateTime InvoiceDate { get; set; }
        public string ItemDescription { get; set; } = default!;
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }

        // ضريبة افتراضي 15%
        public decimal VatRatePercent { get; set; } = 15.00m;
    }

    public class CloseCustodyDto
    {
        public string? Notes { get; set; }
        public DateTime? ClosedAt { get; set; }
    }

    public class InvoiceReadDto
    {
        public int Id { get; set; }
        public int SequenceNo { get; set; }
        public string InvoiceNumber { get; set; } = default!;
        public DateTime InvoiceDate { get; set; }
        public string ItemDescription { get; set; } = default!;
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal VatRatePercent { get; set; }
        public decimal UnitPriceAfterVat { get; set; }
        public decimal LineTotal { get; set; }
    }

    public class CustodyReadDto
    {
        public int Id { get; set; }
        public string CustodianUserId { get; set; } = default!;
        public string? CustodianName { get; set; }
        public decimal AdvanceAmount { get; set; }
        public string Status { get; set; } = default!;
        public DateTime CreatedAt { get; set; }
        public DateTime? ClosedAt { get; set; }
        public string? Notes { get; set; }

        // تجميع
        public int InvoicesCount { get; set; }
        public decimal SubtotalBeforeVat { get; set; }
        public decimal TotalVat { get; set; }
        public decimal GrandTotal { get; set; }

        // الرصيد المتبقي/المطلوب للتصفية
        public decimal RemainingToSettle { get; set; } // = AdvanceAmount - GrandTotal
        public List<InvoiceReadDto> Invoices { get; set; } = new();
    }

    public class AggregateSummaryDto
    {
        public string? CustodianUserId { get; set; }
        public string? CustodianName { get; set; }
        public int OpenCustodiesCount { get; set; }
        public int ClosedCustodiesCount { get; set; }

        public int TotalInvoicesCount { get; set; }
        public decimal TotalAdvanceAmount { get; set; }
        public decimal SubtotalBeforeVat { get; set; }
        public decimal TotalVat { get; set; }
        public decimal GrandTotal { get; set; }

        // الرصيد عبر كل العُهد المفتوحة
        public decimal RemainingAcrossOpenCustodies { get; set; }
    }
}
