using System.ComponentModel.DataAnnotations;

namespace backend.Data.Models;

public class PlanFeature
{
    [Key]
    public int UniqueId { get; set; }

    public int PlanId { get; set; }

    public int? FeatureId { get; set; }
    public int? LocationLimit { get; set; }

    public Plan Plan { get; set; } = null!;
    public Feature? Feature { get; set; }
}