namespace backend.Dtos;

public class MerchantUpdateDto
{
    public string? Name { get; set; }
    public string? BusinessType { get; set; }
    public string? Country { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? PaymentProvider { get; set; }
    public string? PaymentConfig { get; set; }
    public string? OwnerId { get; set; }
}
