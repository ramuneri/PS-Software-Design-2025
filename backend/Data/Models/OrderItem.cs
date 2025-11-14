using System.ComponentModel.DataAnnotations;

namespace backend.Data.Models;

public class OrderItem
{
    [Key]
    public int Id { get; set; }

    public int OrderId { get; set; }
    public int? ProductId { get; set; }
    public int? ServiceId { get; set; }
    public int? ReservationId { get; set; }

    public int Quantity { get; set; }

    public Order Order { get; set; } = null!;
    public Product? Product { get; set; }
    public Service? Service { get; set; }
    public Reservation? Reservation { get; set; }
}