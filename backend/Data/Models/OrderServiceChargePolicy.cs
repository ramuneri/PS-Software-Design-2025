namespace backend.Data.Models;

public class OrderServiceChargePolicy
{
    public int OrdersId { get; set; }
    public Order Order { get; set; } = null!;

    public int ServiceChargePoliciesId { get; set; }
    public ServiceChargePolicy ServiceChargePolicy { get; set; } = null!;
}
