using System.ComponentModel.DataAnnotations;

namespace backend.Data.Models;

public class Feature
{
    [Key]
    public int Id { get; set; }

    public string? Name { get; set; }
    public string? Description { get; set; }

    public ICollection<PlanFeature> PlanFeatures { get; set; } = new List<PlanFeature>();
}