
using System.ComponentModel.DataAnnotations.Schema;

namespace ASF.Core.Entities
{
    public class Custody
    {
            public int Id { get; set; }

            // صاحب العهدة
            public string CustodianUserId { get; set; } = default!;

            // مبلغ العهدة (السلفة)
            public decimal AdvanceAmount { get; set; }

            public string? Notes { get; set; }
            public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

            // Open | Closed
            public string Status { get; set; } = "Open";
            public DateTime? ClosedAt { get; set; }

            public ICollection<CustodyInvoice> Invoices { get; set; } = new List<CustodyInvoice>();
        }
    public class CustodyInvoice
    {
        public int Id { get; set; }

        public int CustodyId { get; set; }
        public Custody Custody { get; set; } = default!;

        // م (تسلسل داخل العهدة)
        public int SequenceNo { get; set; }

        // رقم وتاريخ الفاتورة
        public string InvoiceNumber { get; set; } = default!;
        public DateTime InvoiceDate { get; set; }

        // وصف البند
        public string ItemDescription { get; set; } = default!;

        // الكمية والسعر قبل الضريبة
        [Column(TypeName = "decimal(18,3)")]
        public decimal Quantity { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }

        // نسبة الضريبة بالمئة (مثال 15.00)
        [Column(TypeName = "decimal(5,2)")]
        public decimal VatRatePercent { get; set; } = 15.00m;

        // السعر بعد الضريبة (للوحدة) والإجمالي (للسطر)
        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPriceAfterVat { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal LineTotal { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
