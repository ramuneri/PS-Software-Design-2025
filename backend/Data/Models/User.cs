using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace backend.Data.Models;

public class User : IdentityUser
{
    public int? MerchantId { get; set; }
    public string? Name { get; set; }
    public string? Surname { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime LastLoginAt { get; set; }
    public string Role { get; set; } = null!;
    public bool IsSuperAdmin { get; set; }

    public Merchant? Merchant { get; set; }
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<Order> EmployeeOrders { get; set; } = new List<Order>();
    public ICollection<Order> CustomerOrders { get; set; } = new List<Order>();
    public ICollection<Reservation> EmployeeReservations { get; set; } = new List<Reservation>();
    public ICollection<Reservation> CustomerReservations { get; set; } = new List<Reservation>();
    public ICollection<EmployeeService> EmployeeServices { get; set; } = new List<EmployeeService>();
}