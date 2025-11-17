using System.ComponentModel.DataAnnotations;

namespace backend.Data.Models;

public class RefreshToken
{
    [Key]
    public int Id { get; set; }

    [Required]
    public required string UserId { get; set; }

    [Required]
    public required DateTime CreatedAt { get; set; }

    [Required]
    public required DateTime ExpiresAt { get; set; }

    public bool IsRevoked { get; set; }

    [Required]
    public required string Token { get; set; }

    public User User { get; set; } = null!;
}