using System.ComponentModel.DataAnnotations;

namespace backend.Data.Models;

public class Service
{
    [Key]
    public int ServiceId { get; set; }

    public int MerchantId { get; set; }
    public int? TaxCategoryId { get; set; }

    public string? Name { get; set; }
    public decimal? DefaultPrice { get; set; }
    public int? DurationMinutes { get; set; }
    public string Description { get; set; } = null!;
    public bool IsActive { get; set; }

    public Merchant Merchant { get; set; } = null!;
    public TaxCategories? TaxCategory { get; set; }
    public ICollection<EmployeeService> EmployeeServices { get; set; } = new List<EmployeeService>();
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
    public ICollection<ServiceChargePolicy> ServiceChargePolicies { get; set; } = new List<ServiceChargePolicy>();
}