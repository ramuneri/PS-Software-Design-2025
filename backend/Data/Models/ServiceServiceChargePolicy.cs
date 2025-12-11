namespace backend.Data.Models;

public class ServiceServiceChargePolicy
{
    public int ServiceChargePoliciesId { get; set; }
    public ServiceChargePolicy ServiceChargePolicy { get; set; } = null!;

    public int ServicesServiceId { get; set; }
    public Service Service { get; set; } = null!;
}
