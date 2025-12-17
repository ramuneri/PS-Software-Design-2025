using System.ComponentModel.DataAnnotations;

namespace backend.Data.Models;

public class Reservation
{
    [Key]
    public int Id { get; set; }

    public string? EmployeeId { get; set; }
    public string? CustomerId { get; set; }
    public int? ServiceId { get; set; }

    public string? Status { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public DateTime? BookedAt { get; set; }
    public string? Note { get; set; }
    public bool IsActive { get; set; }

    public User? Employee { get; set; }
    public User? Customer { get; set; }
    public Service? Service { get; set; }
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
