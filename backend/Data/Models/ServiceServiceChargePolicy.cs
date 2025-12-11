using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Data.Models;

public class ServiceServiceChargePolicy
{
    public int ServiceChargePoliciesId { get; set; }
    public ServiceChargePolicy Policy { get; set; } = null!;

    public int ServicesServiceId { get; set; }
    public Service Service { get; set; } = null!;
}
