using System.ComponentModel.DataAnnotations;

namespace backend.Data.Models;

public class Customer
{
    [Key]
    public int Id { get; set; }

    public int MerchantId { get; set; }

    public string? Name { get; set; }
    public string? Surname { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
}