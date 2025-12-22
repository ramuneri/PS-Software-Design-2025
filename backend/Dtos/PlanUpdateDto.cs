using System.Collections.Generic;

namespace backend.Dtos;

public class PlanUpdateDto
{
    public string? Name { get; set; }
    public decimal? Price { get; set; }
    public string? BillingPeriod { get; set; }
    public bool? IsActive { get; set; }
    public List<PlanFeatureRequestDto>? Features { get; set; }
}
