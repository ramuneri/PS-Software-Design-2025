using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Data.Models;

public class EmployeeService
{
    [Key, Column(Order = 0)]
    public string EmployeeId { get; set; } = null!;

    [Key, Column(Order = 1)]
    public int ServiceId { get; set; }

    public User Employee { get; set; } = null!;
    public Service Service { get; set; } = null!;
}
